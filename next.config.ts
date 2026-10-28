import type { NextConfig } from "next";

const pagePaths = [
  "/",
  "/login",
  "/register",
  "/gold",
  "/gold/:path*",
  "/shops",
  "/shops/:path*",
  "/admin",
  "/admin/:path*",
  "/seller",
  "/seller/:path*",
];

const nextConfig: NextConfig = {
  async headers() {
    return pagePaths.map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      ],
    }));
  },
};

export default nextConfig;
