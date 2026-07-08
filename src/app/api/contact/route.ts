import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SUPPORT_EMAIL } from "@/lib/contact";

/**
 * Contact-form submission endpoint. Sends a notification to SUPPORT_EMAIL
 * with the sender's address set as reply-to, so replying from Gmail goes
 * straight back to the user — no separate inbox to check.
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured — contact form email not sent.");
    return NextResponse.json(
      { error: "Support email isn't configured yet. Please email us directly instead." },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "AuraPTE Support <onboarding@resend.dev>",
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[AuraPTE Contact] ${topic} — ${name}`,
      text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}`,
    });
    if (error) {
      console.error("Resend send error:", error);
      return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 502 });
  }
}
