import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kitsune",
    template: "%s | Kitsune",
  },
  description:
    "Track and stream your favorite anime with Kitsune. Browse top anime, seasonal picks, and save your progress effortlessly.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('kitsune_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased bg-[#d7d9de] dark:bg-[#111215] text-[#111111] dark:text-[#f1f1f5] transition-colors duration-200">
        {/* Navigation */}
        <Navbar />

        {/* Main content */}
        <main className="flex-1 w-full max-w-full overflow-x-clip">{children}</main>

        {/* Floating Scroll to Top button */}
        <ScrollToTop />

        {/* Footer in Manga Newspaper style */}
        <footer className="border-t-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] py-6 px-4 text-center text-xs font-medium text-[#333333] dark:text-[#aaaaaa]">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-manga-title text-base text-black dark:text-white font-bold tracking-wider">
                KITSUNE
              </span>
              <span className="text-[#666666] dark:text-[#888888]">· Anime Tracker</span>
            </div>
            <p className="text-[#555555] dark:text-[#999999]">
              Anime data via{" "}
              <a
                href="https://myanimelist.net"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-black dark:text-white underline hover:opacity-75"
              >
                MyAnimeList
              </a>{" "}
              &{" "}
              <a
                href="https://anilist.co"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-black dark:text-white underline hover:opacity-75"
              >
                AniList
              </a>
              . Built for anime lovers.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
