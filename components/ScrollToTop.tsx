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
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] text-black dark:text-white shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] transition-all hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 animate-in fade-in duration-150"
    >
      <ArrowUpIcon className="size-4 sm:size-5" />
    </button>
  );
}
