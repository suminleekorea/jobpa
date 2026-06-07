// Manus Forge voice transcription — removed. Stub preserved for import compatibility.
export type TranscribeOptions = {
  audioUrl?: string;
  audioBuffer?: Buffer;
  language?: string;
};

export async function transcribeAudio(_options: TranscribeOptions): Promise<{ text: string }> {
  throw new Error("transcribeAudio: not available in self-hosted mode");
}
