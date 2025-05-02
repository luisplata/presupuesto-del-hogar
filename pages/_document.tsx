
import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';
import nextConfig from '../next.config.js'; // Corrected import path

// Using default DocumentProps is usually sufficient
export default function Document(props: DocumentProps) {
  // Determine the correct path for the manifest based on environment
  // basePath should be an empty string or start with '/'
  const basePath = nextConfig.basePath && nextConfig.basePath !== '/' ? nextConfig.basePath : '';
  const manifestPath = `${basePath}/manifest.json`; // Correctly construct path

  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags for Installability and Appearance */}
        <meta name="application-name" content="Expense Tracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Expense Tracker" />
        <meta name="description" content="Track your expenses easily." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Recommended meta tags */}
        <meta name="msapplication-config" content={`${basePath}/browserconfig.xml`} /> {/* Optional: For Windows tiles */}
        <meta name="msapplication-TileColor" content="#008080" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#008080" /> {/* Match theme color */}

        {/* Link to manifest.json - Use the dynamically generated path */}
        {/* IMPORTANT: Ensure manifest.json exists in the public folder */}
        <link rel="manifest" href={manifestPath} />

        {/* Link to Apple touch icon */}
        {/* IMPORTANT: Create this icon file in public/icons/ */}
        <link rel="apple-touch-icon" href={`${basePath}/icons/apple-touch-icon.png`} />

        {/* Favicon and Standard Icons */}
        {/* IMPORTANT: Create these icon files in public/icons/ or public/ */}
        {/* Browsers will look for /favicon.ico by default */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href={`${basePath}/icons/favicon-32x32.png`} /> */}
        {/* <link rel="icon" type="image/png" sizes="16x16" href={`${basePath}/icons/favicon-16x16.png`} /> */}
        {/* <link rel="shortcut icon" href={`${basePath}/favicon.ico`} /> */}

        {/* Icons referenced in manifest (optional to link here too, but good practice) */}
        {/* <link rel="icon" type="image/png" sizes="192x192" href={`${basePath}/icons/icon-192x192.png`} /> */}
        {/* <link rel="icon" type="image/png" sizes="512x512" href={`${basePath}/icons/icon-512x512.png`} /> */}

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
