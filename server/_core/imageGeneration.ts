/**
 * 이미지 생성 — 현재 미구현 (stub)
 * 추후 OpenAI DALL-E / Stability AI 등으로 교체 가능
 */
export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
};

export type GenerateImageResponse = { url?: string };

export async function generateImage(
  _options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  console.warn("[imageGeneration] Image generation not yet configured.");
  return {};
}
