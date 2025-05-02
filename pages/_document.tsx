
import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';
import type { AppProps } from 'next/app';

// Define AppPropsWithBasePath by extending AppProps - This might not be necessary
// as basePath is typically handled by Next.js automatically based on config.
// interface AppPropsWithBasePath extends AppProps {
//   router: {
//     basePath: string;
//   };
// }

// Extend DocumentProps to potentially include router if passed down, though typically not needed directly here
// interface MyDocumentProps extends DocumentProps {
//     __NEXT_DATA__: { // Access __NEXT_DATA__ for basePath
//         assetPrefix?: string; // assetPrefix usually reflects basePath configuration
//         // You might need to find the exact property holding basePath if assetPrefix isn't it
//     };
// }


// Using default DocumentProps is usually sufficient
export default function Document(props: DocumentProps) {
    // basePath is automatically handled by Next.js when using relative paths
    // or the Link component/router. Manually constructing it here can be error-prone.
    // const basePath = '/presupuesto-del-hogar'; // Removed hardcoded basePath

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
        <link rel="manifest" href="./manifest.json" />

        {/* Favicon/Icons: Browsers often request /favicon.ico by default.
            The PWA manifest references icons in /icons/. Ensure these exist
            if you uncomment the apple-touch-icon links or want PWA functionality.
            No need to add a specific link for favicon.ico unless you have one
            at a non-standard location. The 502 error for favicon.ico likely
            indicates a server/proxy issue, not a missing link tag. */}
        {/*
        <link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="./icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="./icons/favicon-16x16.png" />
        */}

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

