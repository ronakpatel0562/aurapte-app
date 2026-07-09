import { NextRequest, NextResponse } from "next/server";
import { SUPPORT_EMAIL } from "@/lib/contact";

/**
 * Contact-form submission endpoint. Forwards to FormSubmit (no API key —
 * SUPPORT_EMAIL must click the one-time activation link FormSubmit sends
 * the first time it receives a submission for that address) which emails
 * SUPPORT_EMAIL with the sender's address set as reply-to, so replying from
 * Gmail goes straight back to the user — no separate inbox to check.
 */
export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; topic?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const topic = (body.topic ?? "General question").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    // FormSubmit's ajax endpoint rejects requests with no Referer (treating
    // them as opened from a local HTML file). Node's server-side fetch never
    // sends one, so it must be set explicitly here.
    const referer = req.headers.get("referer") ?? req.nextUrl.origin;
    const res = await fetch(`https://formsubmit.co/ajax/${SUPPORT_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Referer: referer },
      body: JSON.stringify({
        _subject: `[AuraPTE Contact] ${topic} — ${name}`,
        _replyto: email,
        _template: "table",
        name,
        email,
        topic,
        message,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.success !== "true") {
      console.error("FormSubmit send error:", data);
      return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 502 });
  }
}
