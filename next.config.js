
const repoName = 'presupuesto-del-hogar';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Essential for static export
  basePath: process.env.NODE_ENV === 'production' ? `/${repoName}` : undefined, // Set base path only for production builds on GitHub Pages
  assetPrefix: process.env.NODE_ENV === 'production' ? `/${repoName}/` : undefined, // Set asset prefix only for production builds on GitHub Pages
  trailingSlash: true, // Ensures /page loads /page/index.html
  images: {
    unoptimized: true, // Required for next export
  },
  // Optional: Disable React Strict Mode if it causes issues during development/export
  // reactStrictMode: false,
};

module.exports = nextConfig;
