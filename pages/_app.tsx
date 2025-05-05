
import type { AppProps } from 'next/app';
import { GeistSans } from 'geist/font/sans'; // Import from geist package
import { GeistMono } from 'geist/font/mono';   // Import from geist package
import '@/app/globals.css'; // Import global styles
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is imported

// No need for applyFontVariables function when using CSS variables this way

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Apply font variables to the root using class names provided by the font objects
    // Also apply them inline for broader compatibility if needed, though classes are preferred
    <div className={`${GeistSans.variable} ${GeistMono.variable}`} style={{
      '--font-geist-sans': GeistSans.style.fontFamily,
      '--font-geist-mono': GeistMono.style.fontFamily,
    } as React.CSSProperties}>
      <Component {...pageProps} />
      <Toaster /> {/* Render the Toaster globally */}
    </div>
  );
}

export default MyApp;
