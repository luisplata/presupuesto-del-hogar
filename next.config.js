
const repoName = 'presupuesto-del-hogar'; // Cambia esto si tu repo tiene otro nombre
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '';
let basePath = '';

if (isGithubActions) {
  // Use the repo name as prefix and base path in GitHub Actions
  assetPrefix = `/${repoName}/`;
  basePath = `/${repoName}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Necesario para generar HTML estático
  // Only set basePath and assetPrefix when deploying to GitHub Pages
  basePath: basePath, // Use variable which is empty locally
  assetPrefix: assetPrefix, // Use variable which is empty locally
  trailingSlash: true, // Recomendado para GitHub Pages

  // Ensure images are handled correctly when exporting
  images: {
    unoptimized: true, // Required for next export
  },

  // Opcional: para ignorar errores en build (útil mientras migras)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
