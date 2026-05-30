/**
 * 음성 전사 — 현재 미구현 (stub)
 * 추후 OpenAI Whisper API 등으로 교체 가능
 */
export type TranscriptionOptions = {
  audioUrl?: string;
  audioBase64?: string;
  mimeType?: string;
  language?: string;
};

export type TranscriptionResult = {
  text: string;
  language?: string;
};

export async function transcribeAudio(
  _options: TranscriptionOptions
): Promise<TranscriptionResult> {
  console.warn("[voiceTranscription] Voice transcription not yet configured.");
  return { text: "" };
}
