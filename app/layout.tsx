import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Kitsune – Anime Watch Tracker",
    template: "%s | Kitsune",
  },
  description:
    "Track your anime watch progress with Kitsune. Browse top anime, seasonal picks, and save your progress — no account needed.",
  openGraph: {
    siteName: "Kitsune",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        {/* Navigation */}
        <Navbar />

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Floating Scroll to Top button */}
        <ScrollToTop />

        {/* Footer */}
        <footer className="border-t border-white/8 py-6 px-4 text-center text-xs text-white/40">
          Anime data provided by{" "}
          <a
            href="https://myanimelist.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:underline"
          >
            MyAnimeList
          </a>{" "}
          via{" "}
          <a
            href="https://jikan.moe"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/60"
          >
            Jikan API
          </a>
          . Kitsune is a fan-made tracker.
        </footer>
      </body>
    </html>
  );
}
