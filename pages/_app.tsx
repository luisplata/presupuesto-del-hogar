
import type { AppProps } from 'next/app';
import { GeistSans } from 'geist/font/sans'; // Import from geist package
import { GeistMono } from 'geist/font/mono';   // Import from geist package
import '@/app/globals.css'; // Import global styles
import { Toaster } from "@/components/ui/toaster";


function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Apply font variables to the root element using Geist package imports
    <div className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
      <Component {...pageProps} />
      <Toaster />
    </div>
  );
}

export default MyApp;
