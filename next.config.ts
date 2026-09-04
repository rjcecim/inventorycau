import type { NextConfig } from "next";

const extraDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.24.27", ...extraDevOrigins],
  async redirects() {
    return [
      { source: "/inventario", destination: "/computadores", permanent: false },
      { source: "/cadastros", destination: "/computadores", permanent: false },
      { source: "/busca", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
