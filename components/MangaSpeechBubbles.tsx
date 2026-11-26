import React from "react";

/**
 * Jagged explosion / shout bubble (like "UPDATED" in manga)
 */
export function JaggedShoutBubble({
  text = "UPDATED",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none filter drop-shadow-[2px_3px_0px_#000000] dark:drop-shadow-[2px_3px_0px_#ffffff] ${className}`}
    >
      <svg
        viewBox="0 0 160 80"
        className="w-full h-auto overflow-visible text-white dark:text-[#1a1b20] stroke-black dark:stroke-white"
        fill="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      >
        <polygon points="
          20,40 5,28 26,22 18,5 44,14 55,0 75,15 95,2 110,18 135,6 135,25 155,30 
          140,46 156,60 134,62 140,78 116,68 105,80 88,67 70,78 58,64 35,76 38,58 
          16,60 22,46 4,40
        " />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-manga-title text-black dark:text-white text-[11px] sm:text-xs font-black tracking-wider px-2 text-center pointer-events-none">
        {text}
      </span>
    </div>
  );
}

/**
 * Classic comic dialogue bubble with a tail pointing down
 */
export function SpeechBalloon({
  text = "EXCUSE ME?",
  className = "",
  tailPosition = "bottom-center",
}: {
  text?: string;
  className?: string;
  tailPosition?: "bottom-left" | "bottom-center" | "bottom-right";
}) {
  const tailAlignment =
    tailPosition === "bottom-left"
      ? "left-4 sm:left-6"
      : tailPosition === "bottom-right"
      ? "right-4 sm:right-6"
      : "left-1/2 -translate-x-1/2";

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="relative rounded-2xl border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]">
        <span className="font-manga-title text-[11px] sm:text-xs font-bold text-black dark:text-white tracking-wide whitespace-nowrap">
          {text}
        </span>
      </div>
      {/* Downward triangle tail */}
      <div
        className={`absolute -bottom-2 ${tailAlignment} w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-black dark:border-t-white`}
      />
      <div
        className={`absolute -bottom-[5px] ${tailAlignment} w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white dark:border-t-[#1a1b20]`}
      />
    </div>
  );
}

/**
 * Thought bubble with cloud bumps and floating circles
 */
export function ThoughtBubble({
  text = "MAYBE A NEW ANIME?",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Cloud main body */}
      <div className="relative rounded-3xl border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] px-3.5 sm:px-4 py-1.5 sm:py-2 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]">
        <span className="font-manga-title text-[11px] sm:text-xs font-bold tracking-wider text-black dark:text-white text-center block whitespace-normal">
          {text}
        </span>
      </div>
      {/* Thought dots leading down */}
      <div className="flex flex-col items-center gap-1 mt-1 -ml-3">
        <span className="w-2.5 h-2.5 rounded-full border-1.5 border-black dark:border-white bg-white dark:bg-[#1a1b20] shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#ffffff]" />
        <span className="w-1.5 h-1.5 rounded-full border-1.5 border-black dark:border-white bg-white dark:bg-[#1a1b20] shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#ffffff] -ml-2" />
      </div>
    </div>
  );
}

/**
 * Comic speed lines accent for panel corners
 */
export function ComicSpeedLines({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 select-none pointer-events-none ${className}`}>
      <span className="w-4 h-0.5 bg-black dark:bg-white rotate-[-25deg] transform origin-right" />
      <span className="w-6 h-1 bg-black dark:bg-white rotate-[-25deg] transform origin-right" />
      <span className="w-8 h-1 bg-black dark:bg-white rotate-[-25deg] transform origin-right" />
      <span className="w-5 h-0.5 bg-black dark:bg-white rotate-[-25deg] transform origin-right" />
    </div>
  );
}
