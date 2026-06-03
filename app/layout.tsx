import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { TweaksPanel } from "@/components/TweaksPanel";
import { TweaksProvider } from "@/lib/tweaks";
import { StarCursor } from "@/components/StarCursor";

export const metadata: Metadata = {
  title: "ARTémis Records — Label musical · Paris",
  description:
    "Label français dédié aux artistes émergents. Respect du travail, des conditions et du bien-être.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
        <TweaksProvider>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <TweaksPanel />
          <StarCursor />
        </TweaksProvider>
      </body>
    </html>
  );
}
