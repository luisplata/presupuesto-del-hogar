
import type { AppProps } from 'next/app';
import '@/app/globals.css'; // Import global styles
// Removed direct Geist font CSS imports causing errors
// import 'geist/font/sans.css';
// import 'geist/font/mono.css';
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is imported

// The application will now rely on the fallback fonts specified in globals.css

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // The font-family is applied in globals.css, now using fallback fonts
    <div>
      <Component {...pageProps} />
      <Toaster /> {/* Render the Toaster globally */}
    </div>
  );
}

export default MyApp;
