import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

const ALLOWED_FILES = new Set([
  "Exam-This-Month.html",
  "Answer-Short-Question.html",
  "Describe-Image.html",
  "Fill-in-the-Blanks.html",
  "Repeat-Sentence.html",
  "Responding-to-Situation.html",
  "Summarize-Spoken-Text.html",
  "Write-an-Email.html",
  "Write-from-Dictation.html",
  "logo.png",
]);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
};

const FILES_DIR = path.join(process.cwd(), "private-assets", "prediction-files");

// Mirrors DisableContextMenu.tsx — the viewer page embeds this HTML in an
// iframe, which is its own document, so the parent page's listener can't
// reach it; the protection has to be injected into the served markup itself.
const PROTECTION_SCRIPT = `
<script>
(function () {
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("keydown", function (e) {
    var key = e.key.toLowerCase();
    var blocked =
      key === "f12" ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].indexOf(key) !== -1) ||
      ((e.ctrlKey || e.metaKey) && ["u", "s", "p"].indexOf(key) !== -1);
    if (blocked) e.preventDefault();
  });
})();
</script>
`;

function injectProtection(html: string): string {
  if (html.includes("</body>")) {
    return html.replace("</body>", `${PROTECTION_SCRIPT}</body>`);
  }
  return html + PROTECTION_SCRIPT;
}

async function checkAccess(filename: string): Promise<number | null> {
  if (!ALLOWED_FILES.has(filename)) {
    return 404;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 401;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_expiry")
    .eq("id", user.id)
    .maybeSingle();

  const hasActivePlan =
    !!profile?.plan_expiry && new Date(profile.plan_expiry).getTime() > Date.now();

  if (!hasActivePlan) {
    return 402;
  }

  return null;
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const deniedStatus = await checkAccess(params.filename);
  return new NextResponse(null, { status: deniedStatus ?? 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  const deniedStatus = await checkAccess(filename);
  if (deniedStatus) {
    const message = deniedStatus === 404 ? "Not found" : deniedStatus === 401 ? "Unauthorized" : "Payment required";
    return new NextResponse(message, { status: deniedStatus });
  }

  const fileBuffer = await fs.readFile(path.join(FILES_DIR, filename));
  const contentType = CONTENT_TYPES[path.extname(filename)] ?? "application/octet-stream";

  const body =
    contentType.startsWith("text/html") && process.env.NODE_ENV === "production"
      ? injectProtection(fileBuffer.toString("utf-8"))
      : fileBuffer;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
