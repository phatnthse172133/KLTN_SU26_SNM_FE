import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Route folders already contain /admin and /boothowner. Applying a basePath
  // here duplicated Admin URLs and leaked the Admin prefix into Booth Owner URLs.
  // Keep a distinct asset prefix so this app can still share the host with the
  // Market Owner application without colliding on /_next.
  assetPrefix: "/portal-assets",
};

export default nextConfig;
