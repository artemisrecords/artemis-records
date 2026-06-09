"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Menu déroulant en DOM (et non un `<select>` natif). Le popup natif d'un
 * `<select>` est rendu par l'OS, hors de la page : le curseur personnalisé du
 * site ne peut pas s'y afficher (l'OS reprend la main). Ce composant garde la
 * liste dans le DOM, donc le curseur custom et la traînée restent cohérents.
 */
export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 bg-paper border border-ink/15 px-2.5 py-1.5 font-serif text-[13px] rounded-[2px] outline-none focus:border-magenta text-left cursor-pointer transition-colors hover:border-ink/30"
      >
        <span className={current ? "text-ink truncate" : "text-ink-subtle italic"}>
          {current ? current.label : placeholder}
        </span>
        <span
          className={`text-ink-subtle text-[9px] shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto bg-paper border border-ink/15 rounded-[2px] shadow-lg py-1"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 font-serif text-[13px] cursor-pointer transition-colors hover:bg-magenta/10 ${
                    active ? "text-magenta" : "text-ink"
                  }`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
