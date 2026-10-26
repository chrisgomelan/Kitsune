"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, CloseIcon, HomeIcon, KitsuneLogo, SearchIcon } from "@/components/Icons";
import LiveSearch from "@/components/LiveSearch";

export default function Navbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close mobile search when route changes
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0c14]/90 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white transition hover:text-violet-300 sm:text-xl shrink-0"
        >
          <KitsuneLogo className="size-6 text-violet-400" />
          <span>Kitsune</span>
        </Link>

        {/* Center / Navigation Links with Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/" active={pathname === "/"}>
            <HomeIcon className="size-3.5" />
            <span>Home</span>
          </NavLink>
          <NavLink href="/library" active={pathname.startsWith("/library")}>
            <BookmarkIcon className="size-3.5" />
            <span className="sm:hidden">Library</span>
            <span className="hidden sm:inline">My Library</span>
          </NavLink>
        </div>

        {/* Desktop AJAX Live Search */}
        <div className="hidden md:block">
          <LiveSearch variant="desktop" />
        </div>

        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen((prev) => !prev)}
          aria-expanded={isSearchOpen}
          aria-label={isSearchOpen ? "Close search bar" : "Open search bar"}
          className={`flex md:hidden h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition active:scale-95 ${
            isSearchOpen
              ? "bg-violet-600 text-white ring-1 ring-violet-400"
              : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
        >
          {isSearchOpen ? <CloseIcon className="size-4" /> : <SearchIcon className="size-4" />}
        </button>
      </nav>

      {/* Mobile Expandable Live Search */}
      {isSearchOpen && (
        <div className="border-t border-white/5 bg-[#0b0c14]/95 px-3.5 py-2.5 md:hidden animate-in fade-in slide-in-from-top-1 duration-150">
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
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:py-2 sm:text-sm ${
        active
          ? "bg-white/15 text-white font-semibold ring-1 ring-white/20 shadow-sm"
          : "text-white/70 hover:bg-white/8 hover:text-white"
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400`}
    >
      {children}
    </Link>
  );
}
