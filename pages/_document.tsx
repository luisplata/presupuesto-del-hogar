
import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';
import nextConfig from '../next.config.js'; // Corrected import path

// Using default DocumentProps is usually sufficient
export default function Document(props: DocumentProps) {
  // Determine the correct path for the manifest based on environment
  const basePath = nextConfig.basePath || '';
  const manifestPath = `${basePath}/manifest.json`;

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
        <meta name="theme-color" content="#008080" /> {/* Match theme color in globals.css or manifest */}

        {/* Link to manifest.json - Use the dynamically generated path */}
        {/* Ensure manifest.json exists in the public folder */}
        <link rel="manifest" href={manifestPath} />

        {/* Favicon: Browsers usually look for /favicon.ico by default.
            Place favicon.ico in the public folder.
            Next.js with basePath handles the path correctly if placed in /public. */}
        {/* Example explicit link (usually not needed if /public/favicon.ico exists): */}
        {/* <link rel="icon" href={`${basePath}/favicon.ico`} /> */}

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

