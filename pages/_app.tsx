
import type { AppProps } from 'next/app';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/app/globals.css'; // Keep the path as is, assuming globals.css is in src/app
import { Toaster } from "@/components/ui/toaster";
// Removed useRouter import as it's not needed here

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

function MyApp({ Component, pageProps }: AppProps) {
   // Removed useRouter hook and basePath variable

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Component {...pageProps} />
      <Toaster />
    </div>
  );
}

export default MyApp;
