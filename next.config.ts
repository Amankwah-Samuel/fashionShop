import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Let phones on the same Wi-Fi use the dev server (http://<PC's IP>:3000).
  // Without this, Next blocks its dev scripts for non-localhost addresses, so
  // pages render but nothing is interactive. Dev only; ignored in production.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
  partialPrefetching: true,
  images: {
    // Product photos are served from Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [{ source: "/admin", destination: "/admin/products", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
