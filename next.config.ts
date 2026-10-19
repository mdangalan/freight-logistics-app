import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@cursor/sdk", "@google/genai"],
  // These JSON files are read with fs at runtime, so the tracer will not
  // pick them up from a computed path. The API routes need them on Vercel.
  outputFileTracingIncludes: {
    "/api/assembler": ["./data/**/*"],
    "/api/assembler/[id]": ["./data/**/*"],
    "/api/clarification": ["./data/**/*"],
    "/api/clarification/[id]": ["./data/**/*"],
  },
  experimental: {
    agentFeedback: true,
    optimizePackageImports: ["lucide-react", "class-variance-authority"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
