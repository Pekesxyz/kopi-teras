"use client";

import { useEffect, useState } from "react";

/** Timestamp yang diperbarui berkala — untuk label "x menit lalu". */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
