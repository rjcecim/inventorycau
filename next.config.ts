import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.24.27", "localhost"],
  async redirects() {
    return [
      { source: "/inventario", destination: "/computadores", permanent: false },
      { source: "/cadastros", destination: "/computadores", permanent: false },
      { source: "/busca", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
