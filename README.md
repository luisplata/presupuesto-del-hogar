
# Expense Tracker (using Next.js Pages Router)

This is a Next.js application for tracking expenses, built using the Pages Router for compatibility with `next export` and static hosting like GitHub Pages. It includes Progressive Web App (PWA) features, making it installable on supported devices.

To get started, take a look at `pages/index.tsx`.

## Running Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

    **Important:** The `basePath` (`/presupuesto-del-hogar`) is **not** applied during local development (`npm run dev`). Access the site directly at the root URL (`http://localhost:3000`).

## Building for Production (Static Export)

```bash
npm run build
```

This command will build the application and export it as static HTML/CSS/JS files into the `out` directory. The `output: 'export'` setting in `next.config.js` handles the static export process. The `basePath` and `assetPrefix` configurations in `next.config.js` will also be applied during this build, setting the base path to `/presupuesto-del-hogar/`.

### Testing the Static Build Locally

After running `npm run build`, you can test the static output:

1.  Install a simple HTTP server if you don't have one: `npm install -g serve`
2.  Serve the `out` directory: `npx serve out`
3.  Access the site **with the base path**: Open [http://localhost:3000/presupuesto-del-hogar/](http://localhost:3000/presupuesto-del-hogar/) (or the port `serve` indicates). Accessing just `http://localhost:3000/` will likely result in a 404 error because the site is built to live under the `/presupuesto-del-hogar/` path.

## Deployment to GitHub Pages

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the application to GitHub Pages whenever changes are pushed to the `main` branch.

**Setup:**

1.  **Enable GitHub Pages:**
    *   Go to your repository's **Settings** tab.
    *   Navigate to the **Pages** section in the sidebar.
    *   Under "Build and deployment", select **Source** as **GitHub Actions**. GitHub should automatically detect the workflow.

**How it works:**

*   On push to `main`, the workflow runs.
*   It checks out the code, installs dependencies, and runs `npm run build`.
*   The `build` script executes `next build`, which automatically triggers the static export defined by `output: 'export'` in `next.config.js`, generating the static site in the `out` folder with the correct `basePath`.
*   The workflow then pushes the contents of the `out` folder to the `gh-pages` branch.
*   GitHub Pages serves the site from the `gh-pages` branch.

Your deployed site will be available at `https://<your-username>.github.io/presupuesto-del-hogar/`. Make sure the `homepage` field in `package.json` and the `basePath`/`assetPrefix` in `next.config.js` match this URL structure. Accessing `https://<your-username>.github.io/` directly will likely result in a 404.

## PWA (Progressive Web App) Installation

This application is configured to be installable as a PWA on compatible desktop and mobile devices.

**Installation:**

*   **Desktop (Chrome, Edge):** Look for an install icon (often a computer screen with a down arrow) in the address bar when visiting the deployed site. Click it and follow the prompts.
*   **Mobile (Android - Chrome):** Visit the site, and you should see an "Add to Home screen" banner or find the option in the browser menu (⋮).
*   **Mobile (iOS - Safari):** Visit the site, tap the "Share" icon, and then select "Add to Home Screen".

**Important Icon Requirements:**

*   For the PWA to install correctly and display appropriate icons, you **must** create and place the following icon files in the `public/icons/` directory:
    *   `icon-192x192.png` (Required by manifest)
    *   `icon-512x512.png` (Required by manifest)
    *   `apple-touch-icon.png` (Recommended for iOS, typically 180x180 or larger)
*   You might also want to add a `favicon.ico` file to the `public/` directory for browser tabs.

*   **Offline Support:** Full offline capabilities via a service worker are not implemented by default due to potential complexities with `next export`. For basic installability, a service worker isn't strictly required. Libraries like `next-pwa` can add offline support but might need careful configuration with static exports.

## Troubleshooting

*   **404 Error at Root (`/`) after Build/Deploy:** This is expected behavior when a `basePath` is configured. Access the site using the full path including the `basePath` (e.g., `/presupuesto-del-hogar/`).
*   **502/404 Errors during `npm run dev`:** You might occasionally see `502 (Bad Gateway)` or `404 (Not Found)` errors for requests like `/` or `/favicon.ico` in the browser console during development (`npm run dev`), especially in cloud-based IDEs (like IDX). These are often related to the development server or proxy setup within the IDE environment and may not indicate an issue with the application code itself.
    *   If the application generally loads and functions at `http://localhost:3000`, these errors can sometimes be ignored.
    *   The `basePath` is *not* applied in development mode due to the conditional logic in `next.config.js`, so it shouldn't be the cause of 404s at the root during `npm run dev`.
    *   Persistent issues might require restarting the development server (`Ctrl+C` and `npm run dev` again) or checking the IDE/environment configuration. Ensure you are accessing `http://localhost:3000` and not `http://localhost:3000/presupuesto-del-hogar/` during development.
*   **PWA Install Prompt Not Appearing:**
    *   Ensure you are accessing the site via HTTPS (GitHub Pages provides this).
    *   Verify that the `manifest.json` is accessible at the correct path (e.g., `https://<user>.github.io/presupuesto-del-hogar/manifest.json`).
    *   Check the browser's developer console (Application > Manifest tab) for errors.
    *   Make sure you have created the necessary icon files (especially `icon-192x192.png` and `icon-512x512.png`) in `public/icons/`. Some browsers won't prompt if icons are missing.
*   **PWA Icons Not Showing After Install:** Double-check that the icon files exist at the paths specified in `public/manifest.json` and `pages/_document.tsx`. Clear the browser cache or uninstall/reinstall the PWA.
