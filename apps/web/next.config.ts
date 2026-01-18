import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@prisma-uml/parser'],
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
};

export default nextConfig;
