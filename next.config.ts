
import type { NextConfig } from 'next';

const repoName = 'presupuesto-del-hogar'; // 🚨 Ajusta esto si tu repo es otro (ej: "mi-app")

const nextConfig: NextConfig = {
  // output: 'export', // Removed for Pages Router export via script
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  trailingSlash: true,
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
};

export default nextConfig;
