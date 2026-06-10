"use client";

import { useEffect, useId, useRef, useState } from "react";

type Option = { value: string; label: string };

/**
 * Dropdown maison rendu dans le DOM — contrairement au popup d'un `<select>`
 * natif (rendu par l'OS), il respecte le curseur personnalisé du site
 * (StarCursor + `cursor: none`) et le langage visuel du backoffice.
 *
 * Contrôlé uniquement : `value` + `onChange`. Si `name` est fourni, la valeur
 * est soumise avec le formulaire via un input caché.
 */
export function AdminDropdown({
  name,
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  ariaLabel,
  variant = "box",
  className = "",
}: {
  name?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  ariaLabel?: string;
  variant?: "box" | "underline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openList() {
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function commit(i: number) {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const triggerCls =
    variant === "underline"
      ? "w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif text-[15px] text-ink text-left outline-none focus:border-magenta transition-colors cursor-pointer flex items-center justify-between gap-2"
      : "bg-paper border border-ink/15 pl-2.5 pr-2 py-1 font-serif text-[12px] text-ink text-left rounded-[2px] outline-none focus:border-magenta transition-colors cursor-pointer inline-flex items-center justify-between gap-2 min-w-[110px]";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={triggerCls}
      >
        <span className={selected ? "truncate" : "italic text-ink-subtle truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <span
          aria-hidden
          className={`text-[11px] text-ink-subtle shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-30 top-full left-0 mt-1 min-w-full max-h-[260px] overflow-y-auto bg-paper border border-ink/15 rounded-[2px] shadow-editorial-lg py-1"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 font-serif italic text-[13px] text-ink-subtle whitespace-nowrap">
              Aucune option disponible
            </li>
          ) : (
            options.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(i)}
                className={`px-3 py-2 font-serif text-[13px] whitespace-nowrap cursor-pointer transition-colors ${
                  i === active ? "bg-paper-soft" : ""
                } ${o.value === value ? "font-bold text-ink" : "text-ink-muted"}`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
