import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server-side rendering
  serverExternalPackages: ['@mysten/walrus', '@mysten/walrus-wasm'],
  
  // Experimental features
  experimental: {
    // serverComponentsExternalPackages moved to serverExternalPackages above
  },

  webpack: (config, { isServer }) => {
    // Handle Fabric.js and other client-side dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        path: false,
        zlib: false,
      };
    }

    // Handle Fabric.js
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Handle WASM files for Walrus
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
  
  transpilePackages: ['fabric'],
  
  // Turbopack configuration
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
