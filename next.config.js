/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Build optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // Ignore ESLint errors during build for production
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Static optimization
  // output: 'standalone', // Commented out for Vercel deployment

  images: {
    domains: [
      "calibration.filcdn.io", // For FilCDN hosted images
      "ipfs.io", // For IPFS hosted content
      "avatars.githubusercontent.com", // For GitHub avatars
      "images.unsplash.com", // For Unsplash images
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  env: {
    // Public environment variables
    NEXT_PUBLIC_APP_NAME: "MegaVibe",
    NEXT_PUBLIC_APP_DESCRIPTION: "The Stage for Live Performance Economy",
  },

  experimental: {
    // Performance optimizations
    optimizePackageImports: [
      "react-icons",
      "ethers",
      "@web3modal/wagmi",
      "@wagmi/core",
    ],
    // Enable modern module federation
    esmExternals: true,
    // Server components improvements
    serverComponentsExternalPackages: ["pino"],
  },

  webpack: (config, { dev, isServer }) => {
    // Enable WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add support for .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
            ethers: {
              test: /[\\/]node_modules[\\/]ethers[\\/]/,
              name: "ethers",
              chunks: "all",
            },
            web3: {
              test: /[\\/]node_modules[\\/](@web3modal|@wagmi|wagmi)[\\/]/,
              name: "web3",
              chunks: "all",
            },
            icons: {
              test: /[\\/]node_modules[\\/]react-icons[\\/]/,
              name: "icons",
              chunks: "all",
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
