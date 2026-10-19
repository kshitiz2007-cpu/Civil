import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // REMOVE THE eslint BLOCK ENTIRELY
};

export default nextConfig;