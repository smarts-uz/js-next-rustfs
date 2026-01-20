import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.3.151",
        port: "30090",
        pathname: "/**", // ✅ REQUIRED
      },
      {
        protocol: "http",
        hostname: "192.168.3.151",
        port: "30100",
        pathname: "/**", // ✅ REQUIRED
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
