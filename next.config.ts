import type { NextConfig } from "next";

const nextConfig = {
  outputFileTracingIncludes: {
    '/': ['./node_modules/.prisma/client/**/*', './node_modules/@prisma/client/**/*'],
    '/api/**/*': ['./node_modules/.prisma/client/**/*', './node_modules/@prisma/client/**/*'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: {
      // Это заставит Vercel пересобрать всё с нуля
    },
  },
};

export default nextConfig;