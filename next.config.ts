import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9100",
        pathname: "/**", // ✅ REQUIRED
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**", // ✅ REQUIRED
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
