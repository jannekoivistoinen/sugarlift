import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Enable static image imports from the public directory
    unoptimized: false,
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
