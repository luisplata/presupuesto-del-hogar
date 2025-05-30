
import type { AppProps } from 'next/app';
import '@/app/globals.css'; // Import global styles
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is imported
import { AuthProvider } from '@/contexts/AuthContext';

// The application will now rely on the fallback fonts specified in globals.css

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // The font-family is applied in globals.css, now using fallback fonts
    <AuthProvider>
      <div>
        <Component {...pageProps} />
        <Toaster /> {/* Render the Toaster globally */}
      </div>
    </AuthProvider>
  );
}

export default MyApp;
