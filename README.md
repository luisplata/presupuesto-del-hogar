
# Expense Tracker (using Next.js Pages Router)

This is a Next.js application for tracking expenses, built using the Pages Router for compatibility with `next export` and static hosting like GitHub Pages.

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

## Troubleshooting

*   **404 Error at Root (`/`) after Build/Deploy:** This is expected behavior when a `basePath` is configured. Access the site using the full path including the `basePath` (e.g., `/presupuesto-del-hogar/`).
*   **502/404 Errors during `npm run dev`:** You might occasionally see `502 (Bad Gateway)` or `404 (Not Found)` errors for requests like `/` or `/favicon.ico` in the browser console during development (`npm run dev`), especially in cloud-based IDEs (like IDX). These are often related to the development server or proxy setup within the IDE environment and may not indicate an issue with the application code itself.
    *   If the application generally loads and functions at `http://localhost:3000`, these errors can sometimes be ignored.
    *   The `basePath` is *not* applied in development mode due to the conditional logic in `next.config.js`, so it shouldn't be the cause of 404s at the root during `npm run dev`.
    *   Persistent issues might require restarting the development server (`Ctrl+C` and `npm run dev` again) or checking the IDE/environment configuration. Ensure you are accessing `http://localhost:3000` and not `http://localhost:3000/presupuesto-del-hogar/` during development.
