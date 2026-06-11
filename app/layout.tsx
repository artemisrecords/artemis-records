import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { StarCursor } from "@/components/StarCursor";
import { getLabelSettings, LABEL_DEFAULTS } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "ARTémis Records · Label musical · Paris",
  description:
    "Label français dédié aux artistes émergents. Respect du travail, des conditions et du bien-être.",
  icons: {
    icon: [
      // Icône sombre sur thème clair, icône claire sur thème sombre.
      { url: "/icon-fonce.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-clair.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const label = await getLabelSettings().catch(() => LABEL_DEFAULTS);
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Italiana&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
        />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer label={label} />
        </div>
        <StarCursor />
      </body>
    </html>
  );
}
