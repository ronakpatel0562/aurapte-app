/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Why this block exists:
   *   Test/question attempts are saved via client-side Supabase calls
   *   (QuestionAttemptClient, ExamRunner, MockExamRunner), not Server
   *   Actions. Next only auto-invalidates the client Router Cache after
   *   a Server Action, so a plain client insert never tells the router
   *   anything changed. Result: clicking "Back to Dashboard" after
   *   finishing a test served the Router Cache's stale RSC payload from
   *   before the attempt was written — dashboard stats / recent activity
   *   looked frozen until the 30s dynamic staleTime lapsed (or forever on
   *   back/forward nav). Setting dynamic staleTime to 0 makes every
   *   soft navigation to a dynamic route (dashboard, mock-tests,
   *   practice-tests — all cookie-driven, so already server-dynamic)
   *   re-fetch from the server instead of trusting a time-based cache.
   */
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "@supabase/ssr",
    ],
  },

  /**
   * Why this block exists:
   *   Aura's app imports the @supabase/* packages from both Server and
   *   Client Component trees (lib/supabase/server.ts, client.ts,
   *   middleware.ts, plus four API routes that need the service-role
   *   client directly). On `next dev` the Next.js webpack split optimizer
   *   periodically decides to extract @supabase/* into its own vendor
   *   chunk named `./vendor-chunks/@supabase.js`. When the dev server
   *   does a fast-refresh and only re-emits the changed routes, the
   *   chunk graph can reference that vendor chunk before it's been
   *   written to disk, producing:
   *
   *     Error: Cannot find module './vendor-chunks/@supabase.js'
   *
   *   on any dynamic route that imported @supabase/* (e.g.
   *   /questions/[module]/[task-type]/[id]/page.js).
   *
   *   Marking @supabase/* as server-external (CommonJS require() at
   *   runtime, no webpack bundle splitting) prevents the chunk graph
   *   from ever producing that path. The packages are pure JS with no
   *   native bindings, so externalizing them is safe.
   *
   *   See: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
   */
  /**
   * Treat @supabase/* the same way on the client bundler so the browser
   * never ends up with a partial vendor-chunks split either. webpack-
   * turbopack shares this config with the client compiler.
   */
  webpack: (config, { isServer }) => {
      // Externalize for both server AND client builds so the package is
      // loaded via Node/browser ESM-CJS interop rather than bundled into
      // a separately-named vendor-chunks file. This makes the dev chunk
      // graph deterministic.
      const externalsRegex =
        /^@supabase\/(supabase-js|ssr|auth-js|functions-js|storage-js|realtime-js|postgrest-js)$/;
      if (isServer) {
        config.externals = config.externals || [];
        if (Array.isArray(config.externals)) {
          config.externals.push(({ request }, callback) => {
            if (request && externalsRegex.test(request)) {
              return callback(null, `commonjs ${request}`);
            }
            callback();
          });
        } else if (typeof config.externals === "object" && config.externals !== null) {
          config.externals["@supabase/supabase-js"] = "commonjs @supabase/supabase-js";
          config.externals["@supabase/ssr"] = "commonjs @supabase/ssr";
        }
      } else {
        // On the client side the Supabase JS packages must remain bundled
        // (the browser can't resolve `commonjs @supabase/*`), so do not
        // externalize. We only customise the split-chunks grouping to
        // guarantee @supabase/* lands in one stable chunk instead of
        // being split across per-route vendor chunks.
        config.optimization = config.optimization || {};
        config.optimization.splitChunks = config.optimization.splitChunks || {};
        const sc = config.optimization.splitChunks;
        const existingGroups = (sc && sc.cacheGroups) || {};
        sc.cacheGroups = {
          ...existingGroups,
          supabaseVendor: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: "supabase-vendor",
            chunks: "all",
            priority: 30,
            reuseExistingChunk: true,
          },
        };
      }
      return config;
    },
};

export default nextConfig;
