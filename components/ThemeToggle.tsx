"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/Icons";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("kitsune_theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("kitsune_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      title={theme === "light" ? "Switch to Midnight Dark Mode" : "Switch to Light Paper Mode"}
      className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-gray-100 dark:hover:bg-zinc-800 transition active:translate-x-0.5 active:translate-y-0.5"
    >
      {theme === "light" ? (
        <MoonIcon className="size-3.5 sm:size-4 shrink-0 text-black dark:text-white" />
      ) : (
        <SunIcon className="size-3.5 sm:size-4 shrink-0 text-black dark:text-white" />
      )}
    </button>
  );
}
