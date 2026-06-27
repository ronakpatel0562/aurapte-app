"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, AlertCircle, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] animate-fade-in text-center">
        <div className="w-12 h-12 bg-zinc-950 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <Send className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Check your email
        </h1>
        <p className="text-sm text-zinc-500 mt-3 mb-8 leading-relaxed">
          We have sent a temporary password reset link to <strong className="text-zinc-900 font-semibold">{email}</strong>.
          Please check your inbox and click the link to set a new password.
        </p>
        <Link
          href="/login"
          className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white active:scale-[0.98] text-sm font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Log In</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] animate-fade-in transition-all">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Reset password
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Enter your email to receive a recovery link
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 text-xs bg-red-50 text-red-700 border border-red-100 rounded-xl flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
          >
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400" />
            <input
              id="email"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-sm transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full h-11 mt-6 bg-zinc-900 hover:bg-zinc-800 text-white active:scale-[0.98] disabled:opacity-50 text-sm font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {loading ? (
            <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Send Reset Link</span>
              <Send className="w-3.5 h-3.5 text-white/70" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-zinc-500 mt-6">
        Remembered your password?{" "}
        <Link href="/login" className="text-zinc-900 hover:underline font-semibold transition">
          Log In
        </Link>
      </p>
    </div>
  );
}
