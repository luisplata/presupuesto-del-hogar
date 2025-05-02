
import type { AppProps } from 'next/app';
import { GeistSans } from 'geist/font/sans'; // Import from geist package
import { GeistMono } from 'geist/font/mono';   // Import from geist package
import '@/app/globals.css'; // Import global styles (assuming this path is correct)
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is imported

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Apply font variables to the root element using Geist package imports
    // font-sans is applied via globals.css using the variable
    <div className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
      <Component {...pageProps} />
      <Toaster /> {/* Render the Toaster globally */}
    </div>
  );
}

export default MyApp;
