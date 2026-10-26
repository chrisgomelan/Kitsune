"use client";

import { useEffect } from "react";
import { AlertCircleIcon } from "@/components/Icons";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isRateLimit =
    error.message === "RATE_LIMITED" ||
    error.message?.toLowerCase().includes("429");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-3xl bg-white/5 p-10 ring-1 ring-white/10 max-w-md w-full">
        <div className="mb-4 flex justify-center">
          <AlertCircleIcon className="size-12 text-violet-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          {isRateLimit ? "Slow down a bit!" : "Something went wrong"}
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          {isRateLimit
            ? "We hit the Jikan API rate limit (60 requests/min). Please wait a moment and try again."
            : "An unexpected error occurred. The Jikan API may be temporarily unavailable."}
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-white/25 font-mono">{error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
