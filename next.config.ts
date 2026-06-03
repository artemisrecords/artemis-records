import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Épingle la racine Turbopack au dossier du projet : évite qu'il remonte et
  // sélectionne un pnpm-workspace.yaml parent (cas des git worktrees), ce qui
  // dédoublait React.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
