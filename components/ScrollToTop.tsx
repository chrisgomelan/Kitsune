"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@/components/Icons";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 320) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top of page"
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-violet-600/90 text-white shadow-xl shadow-violet-950/60 ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-violet-500 hover:scale-105 active:scale-95 animate-in fade-in zoom-in-75 duration-200"
    >
      <ArrowUpIcon className="size-4 sm:size-5" />
    </button>
  );
}
