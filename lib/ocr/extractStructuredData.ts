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

export async function extractStructuredData<TOut, TDef extends ZodTypeDef, TIn>(
  req: ExtractionRequest<TOut, TDef, TIn>,
): Promise<TOut> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });

  const imageContent: ChatCompletionContentPart = {
    type: "image_url",
    image_url: { url: req.image, detail: "high" },
  };

  const response = await client.chat.completions.create({
    model: req.model ?? "gpt-5.2",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: req.systemPrompt },
      {
        role: "user",
        content: [
          imageContent,
          { type: "text", text: "Extract the data from this image and return valid JSON matching the described shape." },
        ],
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
