
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

  // Add i18n configuration
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ['en', 'es'],
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
    defaultLocale: 'en',
    // This is a list of locale domains and the default locale they
    // should handle (these are only required when setting up domain routing)
    // Note: subdomains must be included in the domain value to be matched e.g. "fr.example.com".
    // domains: [
    //   {
    //     domain: 'example.com',
    //     defaultLocale: 'en-US',
    //   },
    //   {
    //     domain: 'example.nl',
    //     defaultLocale: 'nl-NL',
    //   },
    //   {
    //     domain: 'example.fr',
    //     defaultLocale: 'fr',
    //   },
    // ],
    localeDetection: false, // Disable automatic locale detection
  },
};

module.exports = nextConfig;
