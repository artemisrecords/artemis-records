"use client";

import { useState } from "react";
import { useTweaks, type Tweaks } from "@/lib/tweaks";

export function TweaksPanel() {
  const { tweaks, set } = useTweaks();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ouvrir le panneau Tweaks"
        className="fixed right-4 bottom-4 z-[9999] w-[52px] h-[52px] rounded-full border-none bg-magenta text-white cursor-pointer shadow-[0_12px_28px_rgba(0,0,0,0.28)] text-[22px] leading-none font-display flex items-center justify-center"
      >
        ✦
      </button>
    );
  }

  return (
    <div className="tweaks-panel">
      <div className="flex justify-between items-center mb-1">
        <h4>Tweaks</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bg-transparent border-none text-beige-sable/60 cursor-pointer text-[18px] p-1 leading-none"
          title="Fermer"
        >
          ×
        </button>
      </div>

      <span className="tw-label">Home</span>
      <div className="tw-row">
        <Chip tk="homeLayout" val="editorial" label="Éditorial" />
        <Chip tk="homeLayout" val="magazine" label="Magazine" />
        <Chip tk="homeLayout" val="immersive" label="Immersif" />
      </div>

      <span className="tw-label">Roster</span>
      <div className="tw-row">
        <Chip tk="artistGrid" val="grid" label="Grille" />
        <Chip tk="artistGrid" val="list" label="Liste" />
      </div>
    </div>
  );

  function Chip<K extends keyof Tweaks>({
    tk,
    val,
    label,
  }: {
    tk: K;
    val: Tweaks[K];
    label: string;
  }) {
    const active = tweaks[tk] === val;
    return (
      <button
        type="button"
        className={`tw-chip ${active ? "on" : ""}`}
        onClick={() => set(tk, val)}
      >
        {label}
      </button>
    );
  }
}
