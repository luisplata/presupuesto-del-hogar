
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

## Building for Production (Static Export)

```bash
npm run build
```

This command will build the application and export it as static HTML/CSS/JS files into the `out` directory.

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
*   The `build` script executes `next build && next export`, generating the static site in the `out` folder.
*   The workflow then pushes the contents of the `out` folder to the `gh-pages` branch.
*   GitHub Pages serves the site from the `gh-pages` branch.

Your deployed site will be available at `https://<your-username>.github.io/<your-repo-name>/`. Make sure the `homepage` field in `package.json` and the `basePath`/`assetPrefix` in `next.config.js` match this URL structure.

**Note on 502 Errors and Routing Issues in Development:**

*   You might occasionally see `502 (Bad Gateway)` errors for requests like `/` or `/favicon.ico` in the browser console during development, especially in cloud-based IDEs. These are often related to the development server or proxy setup within the IDE environment and may not indicate an issue with the application code itself.
*   If the application generally loads and functions, these can sometimes be ignored.
*   **Troubleshooting:** If you experience persistent 502 errors or routing problems during local development (`npm run dev`), ensure that `basePath` and `assetPrefix` in `next.config.js` are conditionally applied (e.g., only `process.env.NODE_ENV === 'production'`) or commented out for local development. These settings are essential for deployment but can interfere with the development server. Remember they are needed for the production build (`npm run build`).
*   Persistent issues might require restarting the development server or checking the IDE/environment configuration.
```