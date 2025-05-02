
import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';
import type { AppProps } from 'next/app';

// Define AppPropsWithBasePath by extending AppProps
interface AppPropsWithBasePath extends AppProps {
  router: {
    basePath: string;
  };
}

// Extend DocumentProps to potentially include router if passed down, though typically not needed directly here
interface MyDocumentProps extends DocumentProps {
    __NEXT_DATA__: { // Access __NEXT_DATA__ for basePath
        assetPrefix?: string; // assetPrefix usually reflects basePath configuration
        // You might need to find the exact property holding basePath if assetPrefix isn't it
    };
}


export default function Document(props: MyDocumentProps) {
    // Attempt to derive basePath. This might be tricky in _document.
    // Using a fixed path based on next.config.js might be more reliable for static export.
    const basePath = '/presupuesto-del-hogar'; // Hardcoded based on next.config.ts

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

        {/* Link to manifest.json using basePath */}
        <link rel="manifest" href={`${basePath}/manifest.json`} />

        {/* Placeholder Icons (replace with actual paths if available, consider basePath) */}
        {/*
        <link rel="apple-touch-icon" sizes="180x180" href={`${basePath}/icons/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${basePath}/icons/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${basePath}/icons/favicon-16x16.png`} />
        */}

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
