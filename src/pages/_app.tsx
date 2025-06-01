import { AppProps } from 'next/app';
import { useEffect } from 'react';
import Head from 'next/head';

// Extend Window interface to include content property
declare global {
  interface Window {
    content?: any;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize any global scripts or polyfills
  useEffect(() => {
    // Ensure content object exists
    window.content = window.content || {};
    
    // Fix for any missing global objects
    if (typeof window !== 'undefined') {
      // Log initialization
      console.log('App initialized');
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>QAPT - Property Management Software</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
