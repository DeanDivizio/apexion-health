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

interface ParsedDataUrl {
  mimeType: string;
  base64Data: string;
}

function parseDataUrl(value: string): ParsedDataUrl | null {
  const match = value.match(/^data:([^;,]+);base64,([\s\S]+)$/i);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    base64Data: match[2],
  };
}

function looksLikeRawBase64(value: string): boolean {
  const normalized = value.trim();
  if (!normalized || normalized.length < 64) return false;
  return /^[A-Za-z0-9+/=\s]+$/.test(normalized);
}

function buildUserContent(input: string): ChatCompletionContentPart[] {
  const parsedDataUrl = parseDataUrl(input);
  if (parsedDataUrl?.mimeType === "application/pdf") {
    return [
      {
        type: "file",
        file: {
          file_data: input,
          filename: "document.pdf",
        },
      },
      {
        type: "text",
        text: "Extract the data from this PDF and return valid JSON matching the described shape.",
      },
    ];
  }

  if (parsedDataUrl?.mimeType.startsWith("image/")) {
    return [
      {
        type: "image_url",
        image_url: { url: input, detail: "high" },
      },
      {
        type: "text",
        text: "Extract the data from this image and return valid JSON matching the described shape.",
      },
    ];
  }

  if (input.startsWith("https://") || input.startsWith("http://")) {
    return [
      {
        type: "image_url",
        image_url: { url: input, detail: "high" },
      },
      {
        type: "text",
        text: "Extract the data from this image and return valid JSON matching the described shape.",
      },
    ];
  }

  if (looksLikeRawBase64(input)) {
    return [
      {
        type: "image_url",
        image_url: { url: `data:image/png;base64,${input.trim()}`, detail: "high" },
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

export async function extractStructuredData<TOut, TDef extends ZodTypeDef, TIn>(
  req: ExtractionRequest<TOut, TDef, TIn>,
): Promise<TOut> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });

  const userContent = buildUserContent(req.image);

  const response = await client.chat.completions.create({
    model: req.model ?? "gpt-5.2",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: req.systemPrompt },
      {
        role: "user",
        content: userContent,
      },
    ],
    max_completion_tokens: 4096,
    posthogDistinctId: req.posthogDistinctId,
  });

  const rawText = response.choices[0]?.message?.content;
  if (!rawText) {
    throw new Error("OCR extraction returned empty response from model.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`OCR extraction returned invalid JSON. Raw: ${rawText.slice(0, 500)}`);
  }

  const result = req.responseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `OCR extraction produced data that failed validation: ${result.error.message}. Raw: ${rawText.slice(0, 500)}`,
    );
  }

  return result.data;
}
