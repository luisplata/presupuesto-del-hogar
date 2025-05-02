
const repoName = 'presupuesto-del-hogar';
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Essential for static export
  // Set base path only for production builds on GitHub Pages
  basePath: isProd ? `/${repoName}` : undefined,
  // Set asset prefix only for production builds on GitHub Pages
  assetPrefix: isProd ? `/${repoName}/` : undefined,
  trailingSlash: true, // Ensures /page loads /page/index.html, good for static hosts
  images: {
    unoptimized: true, // Required for next export
  },
  // Optional: Disable React Strict Mode if it causes issues, but generally keep it enabled
  // reactStrictMode: false,

  // Ensure experimental features that might interfere with 'export' are disabled if not needed
  // experimental: {
  //   appDir: false, // Explicitly ensure appDir is false if migrating from App Router
  // },
};

module.exports = nextConfig;
