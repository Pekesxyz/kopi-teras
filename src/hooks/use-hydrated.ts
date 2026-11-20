"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `true` setelah komponen berjalan di browser. Dipakai untuk menghindari
 * hydration mismatch ketika membaca state yang dipersist di localStorage.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
