"use client";

import { useRef, useState } from "react";
import { useSavepoints } from "@/lib/savepoints";

export default function BackupButtons() {
  const { ready, exportJSON, importJSON } = useSavepoints();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!ready) return null;

  const handleExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kitsune-savepoints-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importJSON(ev.target?.result as string);
      setMessage(
        result.ok
          ? { text: "Savepoints imported successfully!", ok: true }
          : { text: result.error ?? "Import failed.", ok: false }
      );
      setTimeout(() => setMessage(null), 4000);
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          id="export-savepoints-btn"
          onClick={handleExport}
          className="rounded-xl border border-violet-500/50 px-5 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          ↓ Export JSON
        </button>
        <button
          id="import-savepoints-btn"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          ↑ Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
          aria-label="Import savepoints JSON file"
        />
      </div>
      {message && (
        <p
          role="status"
          className={`text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
