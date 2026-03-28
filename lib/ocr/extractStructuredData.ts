import { OpenAI } from "@posthog/ai";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import { type ZodType, type ZodTypeDef } from "zod";
import { getPostHogClient } from "@/lib/posthog-server";

interface ExtractionRequest<TOut, TDef extends ZodTypeDef, TIn> {
  image: string;
  systemPrompt: string;
  responseSchema: ZodType<TOut, TDef, TIn>;
  model?: string;
  posthogDistinctId?: string;
}

function detectDataUrlMime(value: string): string | null {
  const match = value.match(/^data:([^;,]+);base64,/i);
  return match ? match[1].toLowerCase() : null;
}

function detectBase64ImageMime(data: string): string {
  if (data.startsWith("/9j/")) return "image/jpeg";
  if (data.startsWith("iVBOR")) return "image/png";
  if (data.startsWith("R0lGOD")) return "image/gif";
  if (data.startsWith("UklGR")) return "image/webp";
  return "image/png";
}

function looksLikeRawBase64(value: string): boolean {
  const normalized = value.trim();
  if (!normalized || normalized.length < 64) return false;
  return /^[A-Za-z0-9+/=\s]+$/.test(normalized);
}

function buildUserContent(input: string): ChatCompletionContentPart[] {
  const mime = detectDataUrlMime(input);

  if (mime === "application/pdf") {
    return [
      {
        type: "file",
        file: { file_data: input, filename: "document.pdf" },
      },
      {
        type: "text",
        text: "Extract the data from this document and return valid JSON matching the described shape.",
      },
    ];
  }

  if (mime?.startsWith("image/")) {
    return [
      { type: "image_url", image_url: { url: input, detail: "high" } },
      {
        type: "text",
        text: "Extract the data from this image and return valid JSON matching the described shape.",
      },
    ];
  }

  if (input.startsWith("https://") || input.startsWith("http://")) {
    return [
      { type: "image_url", image_url: { url: input, detail: "high" } },
      {
        type: "text",
        text: "Extract the data from this image and return valid JSON matching the described shape.",
      },
    ];
  }

  if (looksLikeRawBase64(input)) {
    const detectedMime = detectBase64ImageMime(input.trim());
    return [
      {
        type: "image_url",
        image_url: {
          url: `data:${detectedMime};base64,${input.trim()}`,
          detail: "high",
        },
      },
      {
        type: "text",
        text: "Extract the data from this image and return valid JSON matching the described shape.",
      },
    ];
  }

  throw new Error(
    "OCR input must be an image URL/data URL, raw base64 image data, or a PDF data URL (data:application/pdf;base64,...).",
  );
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

export async function extractStructuredData<TOut, TDef extends ZodTypeDef, TIn>(
  req: ExtractionRequest<TOut, TDef, TIn>,
): Promise<TOut> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });

  const userContent = buildUserContent(req.image);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }

    try {
      const response = await client.chat.completions.create({
        model: req.model ?? "gpt-5.2",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: req.systemPrompt },
          { role: "user", content: userContent },
        ],
        max_completion_tokens: 32768,
        posthogDistinctId: req.posthogDistinctId,
      });

      const choice = response.choices[0];
      const finishReason = choice?.finish_reason;
      const refusal = (choice?.message as any)?.refusal;
      const rawText = choice?.message?.content;

      if (refusal) {
        throw new OCRExtractionError(
          `Model refused the request: ${refusal}`,
          { finishReason, refusal, attempt },
        );
      }

      if (finishReason === "length") {
        throw new OCRExtractionError(
          "Model output was truncated (token limit reached). The document may be too large for a single extraction.",
          { finishReason, attempt },
        );
      }

      if (!rawText) {
        lastError = new OCRExtractionError(
          `Empty response from model (finish_reason: ${finishReason ?? "unknown"}).`,
          { finishReason, attempt },
        );
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new OCRExtractionError(
          `Invalid JSON returned. Raw: ${rawText.slice(0, 500)}`,
          { finishReason, attempt },
        );
      }

      const result = req.responseSchema.safeParse(parsed);
      if (!result.success) {
        throw new OCRExtractionError(
          `Validation failed: ${result.error.message}. Raw: ${rawText.slice(0, 500)}`,
          { finishReason, attempt },
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof OCRExtractionError && !error.retryable) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("OCR extraction failed after retries.");
}

class OCRExtractionError extends Error {
  readonly retryable: boolean;

  constructor(
    message: string,
    public readonly context: Record<string, unknown> = {},
  ) {
    super(`OCR extraction: ${message}`);
    this.name = "OCRExtractionError";
    this.retryable = !message.includes("refused") && !message.includes("truncated") && !message.includes("Validation failed");
  }
}
