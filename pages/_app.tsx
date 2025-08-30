import { AppProps } from 'next/app';
import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';

// Global error boundary for unhandled errors
import { ErrorBoundary } from '../components/ErrorBoundary';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize TensorFlow.js backend on client side
    if (typeof window !== 'undefined') {
      // Set up global error handlers
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
      });

      // Initialize any client-side services here
      console.log('Visual Product Matcher initialized');
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AI-powered visual product matching application" />
        <meta name="keywords" content="product search, image search, AI, visual similarity, e-commerce" />
        <meta name="author" content="Visual Product Matcher" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Visual Product Matcher" />
        <meta property="og:description" content="Find similar products using AI-powered image analysis" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Visual Product Matcher" />
        <meta name="twitter:description" content="Find similar products using AI-powered image analysis" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Preload important resources */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
      </Head>

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </>
  );
}

export default MyApp;