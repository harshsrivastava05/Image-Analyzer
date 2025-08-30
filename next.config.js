/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization configuration
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'localhost'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // API routes configuration
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'mysql2'],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-session-id',
          },
        ],
      },
    ];
  },

  // Webpack configuration for TensorFlow.js
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle TensorFlow.js in Node.js environment
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
      });
    }

    // Handle worker files for TensorFlow.js
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    });

    // Fix for package imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output configuration for different deployment targets
  output: 'standalone',

  // Compression
  compress: true,

  // Trailing slash handling
  trailingSlash: false,

  // Power by header
  poweredByHeader: false,

  // Generate ETags
  generateEtags: true,

  // Redirects
  async redirects() {
    return [
      // Add any redirects here if needed
    ];
  },

  // Rewrites
  async rewrites() {
    return [
      // Add any rewrites here if needed
    ];
  },
};

module.exports = nextConfig;