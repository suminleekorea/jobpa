// Manus Forge image generation — removed. Stub preserved for import compatibility.
export type GenerateImageOptions = {
  prompt: string;
  width?: number;
  height?: number;
};

export async function generateImage(_options: GenerateImageOptions): Promise<{ url: string }> {
  throw new Error("generateImage: not available in self-hosted mode");
}
