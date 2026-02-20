
// Audio Processing Service (Transcription) using OpenAI Whisper
import { OpenAI } from "npm:openai";

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

/**
 * Transcribes audio using OpenAI's Whisper model.
 * 
 * @param buffer The audio file buffer
 * @param mimeType The MIME type of the audio file (default: audio/ogg)
 * @returns The transcribed text
 */
export async function transcribeAudio(
    buffer: ArrayBuffer,
    mimeType: string = "audio/ogg"
): Promise<string> {
    try {
        if (!buffer || buffer.byteLength === 0) {
            throw new Error("Empty audio buffer provided.");
        }

        console.log(`🎤 Transcribing audio: ${(buffer.byteLength / 1024).toFixed(2)} KB, Mime: ${mimeType}`);

        // Create a file-like object for OpenAI SDK
        const blob = new Blob([buffer], { type: mimeType });
        const file = new File([blob], "audio.ogg", { type: mimeType });

        const response = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: "pt",
            response_format: "text",
        });

        const text = typeof response === "string" ? response : (response as any).text;
        console.log("✅ Transcription complete:", text);

        return text;
    } catch (error) {
        console.error("❌ Transcription failed:", error);
        throw error;
    }
}
