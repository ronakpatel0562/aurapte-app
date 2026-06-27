"use client";

import React, { useState } from "react";

interface SupabaseSetupRequiredProps {
  schemaSql: string;
}

export default function SupabaseSetupRequired({ schemaSql }: SupabaseSetupRequiredProps) {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const envTemplate = `# Supabase Credentials (from settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# Session Cookie HMAC Signing Key (generate a strong random string)
SESSION_SECRET=at-least-32-character-random-secret-key-goes-here

# Vercel Cron Secret (for auth session cleanup endpoint)
CRON_SECRET=your-cron-secret-token`;

  const copyToClipboard = async (text: string, isEnv: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isEnv) {
        setCopiedEnv(true);
        setTimeout(() => setCopiedEnv(false), 2000);
      } else {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden font-sans selection:bg-neutral-800 selection:text-neutral-200">
      {/* Background Decorative Mesh / Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-mono mb-4 backdrop-blur-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            Supabase Setup Required
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3">
            Let&apos;s configure your database
          </h1>
          <p className="text-neutral-400 text-base md:text-lg max-w-2xl leading-relaxed">
            AuraPTE utilizes Supabase for secure user authentication, active heartbeats, single-session validation, and storing practice dashboard statistics. Follow these steps to set up your project.
          </p>
        </div>

        {/* Steps Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-xl p-6 md:p-8 space-y-8 shadow-2xl">
          
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-sm flex items-center justify-center font-bold">
              1
            </div>
            <div className="space-y-2 pt-1 flex-1">
              <h3 className="text-lg font-medium text-white">Create a Supabase Project</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Go to{" "}
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
                >
                  supabase.com
                </a>
                , sign in, and create a new project. Wait for the database to provision.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-sm flex items-center justify-center font-bold">
              2
            </div>
            <div className="space-y-4 pt-1 flex-1">
              <div>
                <h3 className="text-lg font-medium text-white">Configure Environment Variables</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-3">
                  Go to <strong>Project Settings → API</strong> in your Supabase dashboard. Update the placeholders in your <code className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono">.env.local</code> file with your project credentials:
                </p>
              </div>
              
              {/* Env Codebox */}
              <div className="relative rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 font-mono text-xs text-neutral-300">
                <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-900 bg-neutral-900/60">
                  <span className="text-neutral-400">.env.local</span>
                  <button
                    onClick={() => copyToClipboard(envTemplate, true)}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 transition-all active:scale-95 duration-100 cursor-pointer"
                  >
                    {copiedEnv ? "Copied!" : "Copy boilerplate"}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-neutral-400 leading-5">
                  <code>
{`NEXT_PUBLIC_SUPABASE_URL=`}<span className="text-yellow-400">https://your-project-ref.supabase.co</span>{"\n"}
{`NEXT_PUBLIC_SUPABASE_ANON_KEY=`}<span className="text-yellow-400">your-actual-anon-key</span>{"\n"}
{`SUPABASE_SERVICE_ROLE_KEY=`}<span className="text-yellow-400">your-actual-service-role-key</span>{"\n\n"}
{`# Session Cookie HMAC Signing Key (generate a strong key)`}{"\n"}
{`SESSION_SECRET=`}<span className="text-green-400">at-least-32-character-random-secret-key-goes-here</span>{"\n\n"}
{`# Vercel Cron Secret (for auth session cleanup endpoint)`}{"\n"}
{`CRON_SECRET=`}<span className="text-purple-400">your-cron-secret-token</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-sm flex items-center justify-center font-bold">
              3
            </div>
            <div className="space-y-4 pt-1 flex-1">
              <div>
                <h3 className="text-lg font-medium text-white">Execute SQL Migrations</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-3">
                  This project requires several tables and trigger functions to handle user profiles, practice questions, and single-session validation. Copy the SQL schema and paste it into the <strong>SQL Editor</strong> in Supabase, then click <strong>Run</strong>:
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(schemaSql, false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-medium text-sm transition-all active:scale-95 duration-100 flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {copiedSql ? "Schema Copied!" : "Copy SQL Schema (schema.sql)"}
                </button>
                <div className="text-neutral-500 text-xs flex items-center">
                  Or find file in <code className="text-neutral-400 bg-neutral-950 px-1 py-0.5 rounded font-mono ml-1">supabase/schema.sql</code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-sm flex items-center justify-center font-bold">
              4
            </div>
            <div className="space-y-2 pt-1 flex-1">
              <h3 className="text-lg font-medium text-white">Restart Development Server</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                After saving your <code className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono">.env.local</code> file, stop and restart your Next.js server so the new variables are loaded:
              </p>
              <div className="bg-neutral-950 border border-neutral-850 rounded-lg p-3 font-mono text-xs text-neutral-400 inline-block">
                <span className="text-neutral-600">$</span> npm run dev
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-neutral-600">
          AuraPTE Prep • Next.js 14 • Tailwind CSS v4 • Supabase
        </div>
      </div>
    </div>
  );
}
