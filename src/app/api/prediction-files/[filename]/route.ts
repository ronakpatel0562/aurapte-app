import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

const ALLOWED_FILES = new Set([
  "Answer-Short-Question.pdf",
  "Describe-Image.pdf",
  "Fill-in-the-Blanks.pdf",
  "Repeat-Sentence.pdf",
  "Responding-to-Situation.pdf",
  "Summarize-Spoken-Text.pdf",
  "Write-an-Email.pdf",
  "Write-from-Dictation.pdf",
]);

const FILES_DIR = path.join(process.cwd(), "private-assets", "prediction-files");

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  if (!ALLOWED_FILES.has(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_expiry")
    .eq("id", user.id)
    .maybeSingle();

  const hasActivePlan =
    !!profile?.plan_expiry && new Date(profile.plan_expiry).getTime() > Date.now();

  if (!hasActivePlan) {
    return new NextResponse("Payment required", { status: 402 });
  }

  const fileBuffer = await fs.readFile(path.join(FILES_DIR, filename));

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
