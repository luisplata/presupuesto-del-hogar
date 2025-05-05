
const path = require('path');

/** @type {import('next').NextConfig} */
const isGithub = process.env.REPO_NAME && process.env.REPO_NAME !== '';

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isGithub ? `/${process.env.REPO_NAME}` : '', // si REPO_NAME está vacío, no pone basePath
  assetPrefix: isGithub ? `/${process.env.REPO_NAME}/` : '', // lo mismo para los assets
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

  // Removed i18n configuration as it's incompatible with 'output: export'
  // i18n: { ... }
};

module.exports = nextConfig;
