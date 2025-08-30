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

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle TensorFlow.js properly for both server and client
    if (isServer) {
      // For server-side, we'll use CPU-only operations
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
        '@tensorflow/tfjs-node-gpu': 'commonjs @tensorflow/tfjs-node-gpu',
      });
    }

    // Fix for package imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: false,
      util: false
    };

    // Handle worker files
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    });

    // Ignore specific warnings
    config.module.rules.push({
      test: /node_modules[\/\\]@tensorflow[\/\\]/,
      use: {
        loader: 'ignore-loader'
      }
    });

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

  // Output configuration
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
      {
        source: '/app',
        destination: '/app.tsx',
        permanent: false,
      }
    ];
  },
};

module.exports = nextConfig;