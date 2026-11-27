"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@/components/Icons";

export interface CategoryOption {
  label: string;
  href: string;
  active: boolean;
}

interface CategorySelectProps {
  options: CategoryOption[];
  activeHref: string;
}

export default function CategorySelect({ options, activeHref }: CategorySelectProps) {
  const router = useRouter();

  return (
    <div className="relative w-full sm:hidden">
      <select
        value={activeHref}
        onChange={(e) => {
          if (e.target.value) {
            router.push(e.target.value);
          }
        }}
        aria-label="Select Anime Category or Genre"
        className="h-10 w-full appearance-none border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] pl-3.5 pr-10 text-xs font-bold uppercase tracking-wider text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] focus:outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option
            key={opt.href}
            value={opt.href}
            className="bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold py-1"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white">
        <ChevronDownIcon className="size-4" />
      </span>
    </div>
  );
}
