import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating "N" dev-tools indicator; compile/runtime errors
  // still surface as overlays.
  devIndicators: false,
};

export default nextConfig;
