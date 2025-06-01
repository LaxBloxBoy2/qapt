/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false, // Set to false to avoid double-rendering in development
  swcMinify: true,
  // Disable static generation for pages that use React Query
  experimental: {
    esmExternals: false,
  },
  // Add custom webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for missing files
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Add custom headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
