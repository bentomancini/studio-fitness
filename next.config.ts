import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.100.52",
    "localhost:3000",
    "26.188.37.74",
    "*.local",
  ],
};

export default nextConfig;
