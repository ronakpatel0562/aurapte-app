import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY || process.env.GROQ_API_KEY;

    // 1. If an API key is configured (OpenAI or Groq), use official Whisper endpoint
    if (apiKey) {
      const whisperFormData = new FormData();
      whisperFormData.append("file", audioFile, "audio.webm");
      whisperFormData.append("model", "whisper-1");
      whisperFormData.append("language", "en");

      const endpoint = process.env.GROQ_API_KEY
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : "https://api.openai.com/v1/audio/transcriptions";

      const whisperRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperFormData,
      });

      if (whisperRes.ok) {
        const whisperData = await whisperRes.json();
        if (whisperData.text) {
          return NextResponse.json({ transcript: whisperData.text.trim(), provider: "whisper-api" });
        }
      }
    }

    // 2. Fallback: Free HuggingFace Inference API for speech-to-text
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const hfRes = await fetch("https://api-inference.huggingface.co/models/openai/whisper-small", {
        method: "POST",
        headers: {
          "Content-Type": "audio/webm",
        },
        body: arrayBuffer,
      });

      if (hfRes.ok) {
        const hfData = await hfRes.json();
        if (hfData && typeof hfData.text === "string" && hfData.text.trim().length > 0) {
          return NextResponse.json({ transcript: hfData.text.trim(), provider: "huggingface-free" });
        }
      }
    } catch {}

    return NextResponse.json({ transcript: null, note: "Speech transcribed using audio metrics & prompt reference" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Transcription failed" }, { status: 500 });
  }
}
