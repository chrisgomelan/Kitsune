import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
        {/* ── Navigation ── */}
        <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0b0c14]/80 backdrop-blur-xl">
          <nav
            className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"
            aria-label="Main navigation"
          >
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-white transition hover:text-violet-300"
            >
              <span className="text-2xl">🦊</span>
              Kitsune
            </Link>

            <div className="flex items-center gap-1">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/library">My Library</NavLink>
            </div>

            {/* Search form */}
            <form action="/search" method="get" className="flex">
              <label htmlFor="nav-search" className="sr-only">
                Search anime
              </label>
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search anime…"
                className="w-48 rounded-l-xl bg-white/8 px-4 py-2 text-sm text-white placeholder-white/40 ring-1 ring-white/10 transition focus:w-64 focus:outline-none focus:ring-violet-500 md:w-56"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="rounded-r-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Go
              </button>
            </form>
          </nav>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer ── */}
        <footer className="border-t border-white/8 py-6 text-center text-xs text-white/30">
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
            className="hover:text-white/50"
          >
            Jikan API
          </a>
          . Kitsune is a fan-made tracker and is not affiliated with MAL.
        </footer>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      {children}
    </Link>
  );
}
