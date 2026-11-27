"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, CloseIcon, CompassIcon, HomeIcon, KitsuneLogo, SearchIcon } from "@/components/Icons";
import LiveSearch from "@/components/LiveSearch";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close mobile search when route changes
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] shadow-[0_2px_0px_#000000] dark:shadow-[0_2px_0px_#ffffff]">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3"
        aria-label="Main navigation"
      >
        {/* Brand with Manga / Ink aesthetic */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 group shrink-0"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] group-hover:bg-white dark:group-hover:bg-black group-hover:text-black dark:group-hover:text-white transition-colors">
            <KitsuneLogo className="size-4 sm:size-5" />
          </div>
          <span className="font-manga-title text-base sm:text-2xl font-black tracking-wider text-black dark:text-white leading-none">
            KITSUNE
          </span>
        </Link>

        {/* Center / Navigation Tabs & Theme Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NavLink href="/" active={pathname === "/"}>
            <HomeIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">Home</span>
          </NavLink>
          <NavLink href="/search?type=popular" active={pathname.startsWith("/search")}>
            <CompassIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">Catalog</span>
          </NavLink>
          <NavLink href="/library" active={pathname.startsWith("/library")}>
            <BookmarkIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">Library</span>
          </NavLink>

          {/* Theme Switcher Toggle (Paper / Dark mode) */}
          <ThemeToggle />

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-expanded={isSearchOpen}
            aria-label={isSearchOpen ? "Close search bar" : "Open search bar"}
            className={`flex md:hidden h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border-2 border-black dark:border-white text-black dark:text-white font-bold transition active:translate-x-0.5 active:translate-y-0.5 ${
              isSearchOpen
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white dark:bg-[#1a1b20] hover:bg-gray-100 dark:hover:bg-zinc-800 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
            }`}
          >
            {isSearchOpen ? <CloseIcon className="size-3.5" /> : <SearchIcon className="size-3.5" />}
          </button>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:block">
          <LiveSearch variant="desktop" />
        </div>
      </nav>

      {/* Mobile Search Dropdown */}
      {isSearchOpen && (
        <div className="border-t-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] px-3 py-2.5 md:hidden">
          <LiveSearch
            variant="mobile"
            autoFocus
            onSelect={() => setIsSearchOpen(false)}
          />
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition border-2 border-black dark:border-white min-h-[32px] sm:min-h-[40px] ${
        active
          ? "bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa]"
          : "bg-white dark:bg-[#1a1b20] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
      }`}
    >
      {children}
    </Link>
  );
}
