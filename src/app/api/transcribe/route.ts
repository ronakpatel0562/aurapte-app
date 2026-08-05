import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY || process.env.GROQ_API_KEY;

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
          return NextResponse.json({ transcript: whisperData.text.trim() });
        }
      }
    }

    return NextResponse.json({ transcript: null, note: "No backend whisper API key configured" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Transcription failed" }, { status: 500 });
  }
}
