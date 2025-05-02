
import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';

// Using default DocumentProps is usually sufficient
export default function Document(props: DocumentProps) {
    // basePath is automatically handled by Next.js when using relative paths
    // or the Link component/router.

  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Expense Tracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Expense Tracker" />
        <meta name="description" content="Track your expenses easily." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#008080" />

        {/* Link to manifest.json - Relative path correctly handles basePath */}
        {/* Ensure manifest.json exists in the public folder */}
        <link rel="manifest" href="./manifest.json" />

        {/* Favicon: Browsers usually look for /favicon.ico by default.
            Ensure a favicon.ico exists in your public folder.
            The 502 error suggests a server/proxy issue when fetching it. */}

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
