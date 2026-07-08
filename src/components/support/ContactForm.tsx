"use client";

import React, { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

const MIN_LOADER_MS = 1000;

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General question");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const start = Date.now();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json();

      // Always show at least MIN_LOADER_MS of "Sending…" so the UI feels
      // consistent regardless of actual network/send latency — the real
      // delivery already happened server-side by the time this resolves.
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADER_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADER_MS - elapsed));
      }

      if (!res.ok) {
        setError(data.error || "Couldn't send your message. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
      setTopic("General question");
    } catch {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADER_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADER_MS - elapsed));
      }
      setError("Couldn't send your message. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-canvas border border-hairline rounded-xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-ink">Message sent</h3>
        <p className="text-sm text-mute leading-relaxed">
          Thanks — our team will reply to your email within 24–48 hours. For anything urgent, use
          WhatsApp above.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-medium text-link hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-canvas border border-hairline rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium text-body">Name</label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Your name"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium text-body">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="topic" className="text-xs font-medium text-body">What&apos;s this about?</label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option>General question</option>
          <option>Question before purchasing a plan</option>
          <option>Billing / payment issue</option>
          <option>Doubt about a module or question</option>
          <option>Technical issue / bug</option>
          <option>Something else</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-xs font-medium text-body">Message</label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-hairline bg-canvas text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Tell us what's up — no question is too small."
        />
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full h-11 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send message
          </>
        )}
      </button>
    </form>
  );
}
