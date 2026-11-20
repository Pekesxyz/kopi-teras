import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Admin boleh memakai URL gambar menu dari CDN/host eksternal mana pun.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Prisma & bcrypt hanya dipakai di server.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
