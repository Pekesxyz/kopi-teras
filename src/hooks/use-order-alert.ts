"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "kopi-teras-sound-enabled";
const BELL_SRC = "/sounds/bell.wav";

/**
 * Notifikasi suara (HTML5 Audio API) untuk dashboard staf.
 * - Browser memblokir autoplay sebelum ada interaksi pengguna, jadi staf perlu
 *   menekan tombol "Aktifkan Suara" sekali di awal shift.
 * - `notifyIfNew(ids)` membunyikan bel setiap kali muncul ID pesanan baru.
 */
export function useOrderAlert() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(BELL_SRC);
    audioRef.current.preload = "auto";
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      // Tetap butuh interaksi; status ini hanya preferensi tampilan.
      setEnabled(true);
    }
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay diblokir — minta staf mengaktifkan suara lagi.
      setEnabled(false);
    });
  }, []);

  const enable = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setEnabled(true);
    play();
  }, [play]);

  const disable = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "0");
    setEnabled(false);
  }, []);

  const notifyIfNew = useCallback(
    (ids: string[]) => {
      const known = knownIdsRef.current;
      const next = new Set(ids);
      knownIdsRef.current = next;
      // Pemuatan pertama tidak membunyikan bel.
      if (!known) return 0;
      const newCount = ids.filter((id) => !known.has(id)).length;
      if (newCount > 0 && enabled) play();
      return newCount;
    },
    [enabled, play],
  );

  return { enabled, enable, disable, play, notifyIfNew };
}
