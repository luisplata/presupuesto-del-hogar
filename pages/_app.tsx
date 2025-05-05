
import type { AppProps } from 'next/app';
import { GeistSans } from 'geist/font/sans'; // Import from geist package
import { GeistMono } from 'geist/font/mono';   // Import from geist package
import '@/app/globals.css'; // Import global styles (assuming this path is correct)
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is imported

// Apply font variables globally via CSS variables in globals.css
// This ensures they are available throughout the app without wrapping _app's return
const applyFontVariables = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--font-geist-sans', GeistSans.style.fontFamily);
    document.documentElement.style.setProperty('--font-geist-mono', GeistMono.style.fontFamily);
    document.documentElement.classList.add(GeistSans.variable);
    document.documentElement.classList.add(GeistMono.variable);
  }
};
applyFontVariables(); // Apply fonts immediately

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
        <Component {...pageProps} />
        <Toaster /> {/* Render the Toaster globally */}
    </>
  );
}

export default MyApp;
