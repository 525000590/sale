import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Bỏ qua kiểm tra lỗi TypeScript khi build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua kiểm tra lỗi ESLint khi build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;