/**
 * lib/savepoints.ts
 * useSavepoints() – localStorage hook for tracking watch progress.
 *
 * Architecture rules enforced here:
 *  - Never read localStorage during render (useEffect + ready flag).
 *  - All accesses wrapped in try/catch.
 *  - Cross-tab sync via the native "storage" event.
 *  - Cross-instance sync via custom "savepoints:change" event.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Savepoint, SavepointStore, WatchStatus } from "@/types/anime";

const STORAGE_KEY = "savepoints:v1";

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function readStore(): SavepointStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SavepointStore;
  } catch {
    return {};
  }
}

function writeStore(store: SavepointStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    // Notify other hook instances in the same tab
    window.dispatchEvent(new Event("savepoints:change"));
  } catch {
    // Quota exceeded or private mode – silently ignore
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSavepoints() {
  const [store, setStore] = useState<SavepointStore>({});
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setStore(readStore());
    setReady(true);
  }, []);

  // Listen for changes from other tabs (native storage event)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setStore(readStore());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Listen for changes from other instances in the same tab
  useEffect(() => {
    const onChange = () => setStore(readStore());
    window.addEventListener("savepoints:change", onChange);
    return () => window.removeEventListener("savepoints:change", onChange);
  }, []);

  // ---------------------------------------------------------------------------
  // Mutators
  // ---------------------------------------------------------------------------

  const upsert = useCallback(
    (
      mal_id: number,
      title: string,
      image: string,
      status: WatchStatus,
      episode: number,
      timestamp?: number,
      duration?: number
    ) => {
      const current = readStore();
      const existing = current[mal_id];
      const next = {
        ...current,
        [mal_id]: {
          mal_id,
          title,
          image,
          status,
          episode,
          timestamp: timestamp !== undefined ? timestamp : existing?.timestamp,
          duration: duration !== undefined ? duration : existing?.duration,
          updatedAt: Date.now(),
        },
      };
      writeStore(next);
      setStore(next);
    },
    []
  );

  const remove = useCallback((mal_id: number) => {
    const next = { ...readStore() };
    delete next[mal_id];
    writeStore(next);
    setStore(next);
  }, []);

  const get = useCallback(
    (mal_id: number): Savepoint | undefined => store[mal_id],
    [store]
  );

  const list = useCallback((): Savepoint[] => {
    return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [store]);

  // ---------------------------------------------------------------------------
  // Import / Export
  // ---------------------------------------------------------------------------

  const exportJSON = useCallback((): string => {
    return JSON.stringify(store, null, 2);
  }, [store]);

  const importJSON = useCallback((json: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false, error: "Invalid format: expected an object." };
      }
      // Light validation
      for (const [key, value] of Object.entries(parsed)) {
        if (isNaN(Number(key))) return { ok: false, error: `Invalid key: ${key}` };
        const sp = value as Partial<Savepoint>;
        if (
          typeof sp.mal_id !== "number" ||
          typeof sp.title !== "string" ||
          typeof sp.image !== "string" ||
          typeof sp.status !== "string" ||
          typeof sp.episode !== "number" ||
          typeof sp.updatedAt !== "number"
        ) {
          return { ok: false, error: `Invalid savepoint for id ${key}` };
        }
      }
      const next = parsed as SavepointStore;
      writeStore(next);
      setStore(next);
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not parse JSON." };
    }
  }, []);

  return { ready, store, get, list, upsert, remove, exportJSON, importJSON };
}
