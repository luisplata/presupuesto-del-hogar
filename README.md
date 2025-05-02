# Expense Tracker (using Next.js Pages Router)

This is a Next.js application for tracking expenses, built using the Pages Router for compatibility with `next export` and static hosting like GitHub Pages.

To get started, take a look at `pages/index.tsx`.

**Note on 502 Errors and Routing Issues in Development:**

*   You might occasionally see `502 (Bad Gateway)` errors for requests like `/` or `/favicon.ico` in the browser console during development, especially in cloud-based IDEs. These are often related to the development server or proxy setup within the IDE environment and may not indicate an issue with the application code itself.
*   If the application generally loads and functions, these can sometimes be ignored.
*   **Troubleshooting:** If you experience persistent 502 errors or routing problems (e.g., pages not found) during local development (`npm run dev`), try commenting out the `basePath` and `assetPrefix` lines in `next.config.ts`. These settings are essential for deploying to a subdirectory (like on GitHub Pages) but can sometimes interfere with the development server's routing. Remember to uncomment them before running `npm run build` and `npm run export` for deployment.
*   Persistent issues might require restarting the development server or checking the IDE/environment configuration.
