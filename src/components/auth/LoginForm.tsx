"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { login } from "@/app/auth/actions";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse error from URL query string
  const urlError = searchParams.get("error");
  let friendlyErrorMessage: string | null = null;
  if (urlError === "SESSION_OVERWRITTEN") {
    friendlyErrorMessage = "You have been logged out because a new login session was established on another device.";
  } else if (urlError === "auth-code-error") {
    friendlyErrorMessage = "Failed to verify secure login credentials. Please try signing in again.";
  } else if (urlError) {
    friendlyErrorMessage = urlError.replace(/-/g, " ");
  }

  const [error, setError] = useState<string | null>(friendlyErrorMessage);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(null, formData);

    if (result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError("Failed to initialize Google login.");
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] animate-fade-in transition-all">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Log in to your AuraPTE account to resume learning
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
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full h-11 pl-10 pr-4 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-sm transition"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-zinc-900 transition font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-zinc-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full h-11 pl-10 pr-10 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-sm transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-zinc-400 hover:text-zinc-600 transition focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-6 bg-zinc-900 hover:bg-zinc-800 text-white active:scale-[0.98] disabled:opacity-50 text-sm font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {loading ? (
            <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Continue with Email</span>
              <ArrowRight className="w-4 h-4 text-white/70" />
            </>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-zinc-400 font-medium">Or</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        type="button"
        className="w-full h-11 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-sm font-medium rounded-xl text-zinc-700 transition active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
      >
        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <span>Continue with Google</span>
      </button>

      <p className="text-center text-xs text-zinc-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-zinc-900 hover:underline font-semibold transition">
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[400px] p-8 bg-white/90 rounded-2xl border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] animate-pulse h-[400px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-6 bg-zinc-200 rounded-md w-3/4 mx-auto" />
          <div className="h-4 bg-zinc-200 rounded-md w-1/2 mx-auto" />
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-zinc-200 rounded-xl w-full" />
          <div className="h-10 bg-zinc-200 rounded-xl w-full" />
        </div>
        <div className="h-10 bg-zinc-200 rounded-xl w-full" />
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  );
}
