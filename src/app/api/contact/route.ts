import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SUPPORT_EMAIL } from "@/lib/contact";

/**
 * Contact-form submission endpoint. Sends via Gmail SMTP (GMAIL_USER +
 * GMAIL_APP_PASSWORD, an app password from myaccount.google.com/apppasswords)
 * to SUPPORT_EMAIL, with the sender's address set as reply-to, so replying
 * from Gmail goes straight back to the user — no separate inbox to check.
 * Replaced FormSubmit after it had a multi-hour outage (Cloudflare 522).
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
    await transporter.sendMail({
      from: `"AuraPTE Contact Form" <${process.env.GMAIL_USER}>`,
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[AuraPTE Contact] ${topic} — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Topic:</strong> ${topic}</p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 502 });
  }
}
