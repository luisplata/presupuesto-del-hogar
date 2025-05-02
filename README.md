
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

*   **Prerequisites:** You must be accessing the deployed site via **HTTPS** (GitHub Pages provides this). The install prompt generally won't appear on `http://localhost`.
*   **Desktop (Chrome, Edge):** Look for an install icon (often a computer screen with a down arrow, or sometimes within the browser menu ⋮) in the address bar when visiting the deployed site. Click it and follow the prompts.
*   **Mobile (Android - Chrome):** Visit the site, and you should see an "Add to Home screen" banner or find the option in the browser menu (⋮).
*   **Mobile (iOS - Safari):** Visit the site, tap the "Share" icon, and then select "Add to Home Screen".

**Important Icon Requirements:**

*   For the PWA to install correctly and display appropriate icons, you **must** create and place the following icon files in the `public/icons/` directory:
    *   `icon-192x192.png` (Required by manifest)
    *   `icon-512x512.png` (Required by manifest)
    *   `apple-touch-icon.png` (Required for iOS 'Add to Home Screen', typically 180x180 or larger)
*   **Placeholder icons have been added to `public/icons/` to enable the install prompt, but they are just text files. You MUST replace these with actual `.png` image files for the PWA to display correctly after installation.**
*   You might also want to add a `favicon.ico` file to the `public/` directory for browser tabs (optional for PWA installability).

*   **Offline Support:** Full offline capabilities via a service worker are not implemented by default due to potential complexities with `next export`. For basic installability, a service worker isn't strictly required. Libraries like `next-pwa` can add offline support but might need careful configuration with static exports.

## Troubleshooting

*   **404 Error at Root (`/`) after Build/Deploy:** This is expected behavior when a `basePath` is configured. Access the site using the full path including the `basePath` (e.g., `/presupuesto-del-hogar/`).
*   **502/404 Errors during `npm run dev`:** You might occasionally see `502 (Bad Gateway)` or `404 (Not Found)` errors for requests like `/` or `/favicon.ico` in the browser console during development (`npm run dev`), especially in cloud-based IDEs (like IDX). These are often related to the development server or proxy setup within the IDE environment and may not indicate an issue with the application code itself.
    *   If the application generally loads and functions at `http://localhost:3000`, these errors can sometimes be ignored.
    *   The `basePath` is *not* applied in development mode due to the conditional logic in `next.config.js`, so it shouldn't be the cause of 404s at the root during `npm run dev`.
    *   Persistent issues might require restarting the development server (`Ctrl+C` and `npm run dev` again) or checking the IDE/environment configuration. Ensure you are accessing `http://localhost:3000` and not `http://localhost:3000/presupuesto-del-hogar/` during development.
*   **PWA Install Prompt Not Appearing:**
    *   **Access via HTTPS:** Ensure you are visiting the deployed site (e.g., on GitHub Pages) which uses HTTPS. The prompt usually doesn't show on local `http`.
    *   **Manifest Check:** Verify that the `manifest.json` is accessible at the correct path (e.g., `https://<user>.github.io/presupuesto-del-hogar/manifest.json`). Check the browser's developer console (Application > Manifest tab or similar) for errors.
    *   **Icon Files:** This is a common issue. **Confirm that you have created *actual image files* (`icon-192x192.png`, `icon-512x512.png`, `apple-touch-icon.png`) and placed them in the `public/icons/` directory.** Missing icons often prevent the install prompt. Replace the placeholder text files.
    *   **Browser Cache/State:** Try clearing your browser's cache and site data for the deployed URL, or test in an incognito/private window. Check your browser's app settings (e.g., `edge://apps` in Edge) to see if the site is already listed or blocked.
    *   **Wait/Reload:** Sometimes it takes a moment or a reload for the browser to recognize the PWA criteria.
*   **PWA Icons Not Showing After Install:** Double-check that the *actual image files* exist at the paths specified in `public/manifest.json` and `pages/_document.tsx`. Ensure they are valid PNGs. Clear the browser cache or uninstall/reinstall the PWA.

