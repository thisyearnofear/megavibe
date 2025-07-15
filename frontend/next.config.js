/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "calibration.filcdn.io", // For FilCDN hosted images
      "ipfs.io", // For IPFS hosted content
      "avatars.githubusercontent.com", // For GitHub avatars
      "images.unsplash.com", // For Unsplash images
    ],
  },
  env: {
    // Public environment variables
    NEXT_PUBLIC_APP_NAME: "MegaVibe",
    NEXT_PUBLIC_APP_DESCRIPTION: "The Stage for Live Performance Economy",
  },
  experimental: {
    // Modern Next.js features are enabled by default in v14
  },
  webpack: (config) => {
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

    return config;
  },
};

module.exports = nextConfig;
