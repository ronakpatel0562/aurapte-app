import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY || process.env.GROQ_API_KEY;

    // 1. Official OpenAI or Groq Whisper API (if configured)
    if (apiKey) {
      const whisperFormData = new FormData();
      const filename = audioFile.type.includes("mp4") ? "audio.mp4" : "audio.webm";
      whisperFormData.append("file", audioFile, filename);
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

    // 2. Free Speech-to-Text Fallbacks (HuggingFace Serverless Inference Models)
    const models = [
      "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo",
      "https://api-inference.huggingface.co/models/openai/whisper-small",
      "https://api-inference.huggingface.co/models/facebook/wav2vec2-base-960h",
    ];

    const arrayBuffer = await audioFile.arrayBuffer();
    const contentType = audioFile.type || "audio/webm";

    for (const modelUrl of models) {
      try {
        const hfRes = await fetch(modelUrl, {
          method: "POST",
          headers: {
            "Content-Type": contentType,
          },
          body: arrayBuffer,
        });

        if (hfRes.ok) {
          const hfData = await hfRes.json();
          if (hfData && typeof hfData.text === "string" && hfData.text.trim().length > 0) {
            return NextResponse.json({ transcript: hfData.text.trim(), provider: "free-huggingface" });
          }
        }
      } catch {}
    }

    return NextResponse.json({ transcript: null, note: "Free STT services busy or unavailable" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Transcription failed" }, { status: 500 });
  }
}
