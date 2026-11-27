import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-16 text-center">
      <div className="mx-auto max-w-md bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-8 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] space-y-4">
        <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white">
          404 Notice
        </span>
        <h1 className="font-manga-title text-2xl font-black text-black dark:text-white uppercase tracking-wide">
          Title Not Found
        </h1>
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
          This anime does not exist or has been restricted.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block border-2 border-black dark:border-white bg-black dark:bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
