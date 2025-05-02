
import type { NextConfig } from 'next';

const repoName = 'presupuesto-del-hogar'; // 🚨 Ajusta esto si tu repo es otro (ej: "mi-app")

const nextConfig: NextConfig = {
  // output: 'export', // Keep commented out - 'npm run export' handles this
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`, // Ensure assetPrefix matches basePath for consistency
  trailingSlash: true, // Important for static export compatibility with some servers
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export with next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Recommended: Add reactStrictMode
  reactStrictMode: true,
};

export default nextConfig;

