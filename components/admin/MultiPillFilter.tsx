"use client";

export type MultiPillFilterOption<K extends string> = {
  k: K;
  label: string;
  count?: number;
};

type Props<K extends string, A extends string> = {
  all: A;
  options: MultiPillFilterOption<K | A>[];
  selected: Set<K>;
  onChange: (next: Set<K>) => void;
  variant?: "pill" | "subtle";
  label?: string;
  hint?: string;
};

const DEFAULT_HINT =
  "Cliquez plusieurs filtres pour les combiner · recliquez pour désélectionner.";

export function MultiPillFilter<K extends string, A extends string>({
  all,
  options,
  selected,
  onChange,
  variant = "pill",
  label,
  hint = DEFAULT_HINT,
}: Props<K, A>) {
  const isActive = (k: K | A) =>
    k === all ? selected.size === 0 : selected.has(k as K);

  const handleClick = (k: K | A) => {
    if (k === all) {
      onChange(new Set());
      return;
    }
    const next = new Set(selected);
    const key = k as K;
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={
          variant === "pill"
            ? "flex gap-2 flex-wrap items-center"
            : "flex items-center gap-2 flex-wrap text-[10px] tracking-eyebrow uppercase font-bold"
        }
      >
        {label && variant === "subtle" && (
          <span className="text-ink-subtle">{label}</span>
        )}
        {options.map((opt) => {
          const active = isActive(opt.k);
          const classes =
            variant === "pill"
              ? `font-serif text-[11px] tracking-eyebrow uppercase font-bold px-3.5 py-2 rounded-full border cursor-pointer transition-colors ${
                  active
                    ? "bg-bleu-nuit-700 border-bleu-nuit-700 text-beige-sable"
                    : "bg-paper-soft border-ink/15 text-ink-muted hover:text-ink hover:border-ink/40"
                }`
              : `px-2.5 py-1.5 rounded-full cursor-pointer transition-colors ${
                  active
                    ? "text-magenta bg-magenta/10"
                    : "text-ink-muted hover:text-ink"
                }`;
          return (
            <button
              key={opt.k}
              type="button"
              onClick={() => handleClick(opt.k)}
              className={classes}
              aria-pressed={active}
            >
              {opt.label}
              {typeof opt.count === "number" && (
                <span
                  className={`ml-2 ${
                    variant === "pill"
                      ? active
                        ? "text-beige-sable/70"
                        : "text-ink-subtle"
                      : "text-ink-subtle"
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="font-serif italic text-[11px] text-ink-subtle m-0">
        {hint}
      </p>
    </div>
  );
}
