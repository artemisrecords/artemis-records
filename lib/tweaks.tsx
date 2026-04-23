"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type HomeLayout = "editorial" | "magazine" | "immersive";
export type ArtistGrid = "grid" | "list";

export type Tweaks = {
  homeLayout: HomeLayout;
  artistGrid: ArtistGrid;
};

export const DEFAULT_TWEAKS: Tweaks = {
  homeLayout: "editorial",
  artistGrid: "grid",
};

const STORAGE_KEY = "ar-tweaks";

type TweaksContextValue = {
  tweaks: Tweaks;
  set: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  reset: () => void;
};

const TweaksContext = createContext<TweaksContextValue | null>(null);

export function TweaksProvider({ children }: { children: React.ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTweaks({ ...DEFAULT_TWEAKS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    } catch {}
  }, [tweaks]);

  const set: TweaksContextValue["set"] = (key, value) =>
    setTweaks((t) => ({ ...t, [key]: value }));
  const reset = () => setTweaks(DEFAULT_TWEAKS);

  return (
    <TweaksContext.Provider value={{ tweaks, set, reset }}>
      {children}
    </TweaksContext.Provider>
  );
}

export function useTweaks() {
  const ctx = useContext(TweaksContext);
  if (!ctx) throw new Error("useTweaks must be used inside <TweaksProvider>");
  return ctx;
}
