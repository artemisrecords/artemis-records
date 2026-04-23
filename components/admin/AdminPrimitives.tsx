"use client";

import type { ReactNode } from "react";

export const AdminEyebrow = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`font-serif text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle ${className}`}
  >
    {children}
  </div>
);

export const AdminTitle = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <h1
    className={`font-display uppercase tracking-display leading-[1.05] font-normal text-[clamp(1.9rem,3.4vw,2.6rem)] text-ink ${className}`}
  >
    {children}
  </h1>
);

export const PageHeader = ({
  eyebrow,
  title,
  italic,
  actions,
  chapter,
}: {
  eyebrow?: string;
  title: string;
  italic?: string;
  actions?: ReactNode;
  chapter?: string;
}) => (
  <header className="flex items-end justify-between gap-6 flex-wrap pb-6 border-b border-ink/15 relative">
    {chapter && (
      <span
        aria-hidden
        className="absolute -top-3 right-0 font-display text-[clamp(6rem,14vw,11rem)] text-magenta/5 leading-none select-none tracking-[0.01em]"
      >
        {chapter}
      </span>
    )}
    <div className="relative">
      {eyebrow && <AdminEyebrow className="mb-2">{eyebrow}</AdminEyebrow>}
      <AdminTitle>{title}</AdminTitle>
      {italic && (
        <div className="font-serif italic text-[15px] text-ink-muted mt-1.5 max-w-[56ch]">
          {italic}
        </div>
      )}
    </div>
    {actions && <div className="flex items-center gap-3 relative">{actions}</div>}
  </header>
);

export const RuledDivider = ({ label }: { label?: string }) => (
  <div className="flex items-center gap-4 py-2">
    <span className="h-px flex-1 bg-ink/15" />
    {label && (
      <span className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle shrink-0">
        {label}
      </span>
    )}
    <span className="h-px flex-1 bg-ink/15" />
  </div>
);

export const PageChapterNumber = ({
  n,
  title,
  italic,
}: {
  n: string;
  title: string;
  italic?: string;
}) => (
  <div className="flex items-baseline gap-4 mb-3">
    <span className="font-display text-[11px] tracking-eyebrow uppercase font-bold text-magenta">
      Chapitre {n}
    </span>
    <span className="h-px flex-1 bg-ink/15" />
    {italic && (
      <span className="italic text-[12px] text-ink-muted">{italic}</span>
    )}
  </div>
);

type PillTone =
  | "neutral"
  | "magenta"
  | "draft"
  | "live"
  | "info"
  | "warn"
  | "mute";
const PILL: Record<PillTone, string> = {
  neutral: "bg-bleu-nuit-700/10 text-bleu-nuit-700",
  magenta: "bg-magenta/15 text-magenta",
  draft: "bg-taupe/20 text-taupe-900",
  live: "bg-vert-foret-700/15 text-vert-foret-700",
  info: "bg-bleu-nuit-100/50 text-bleu-nuit-700",
  warn: "bg-[#C8A74E]/20 text-[#7A5D14]",
  mute: "bg-ink/8 text-ink-muted",
};

export const Pill = ({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-eyebrow uppercase font-bold rounded-full ${PILL[tone]} ${className}`}
  >
    {children}
  </span>
);

export const Card = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-paper-soft border border-ink/10 rounded-[2px] ${className}`}
  >
    {children}
  </div>
);

export const AdminBtn = ({
  children,
  onClick,
  type = "button",
  kind = "primary",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  kind?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  className?: string;
}) => {
  const base =
    "font-serif text-[11px] tracking-[0.18em] uppercase font-bold inline-flex items-center gap-2 rounded-[2px] cursor-pointer transition-colors px-4 py-2.5";
  const variant = {
    primary:
      "bg-bleu-nuit-700 text-beige-sable hover:bg-bleu-nuit-800",
    secondary:
      "bg-transparent text-ink border border-ink/25 hover:border-ink/50",
    ghost: "bg-transparent text-ink-muted hover:text-ink px-1 py-2",
    danger:
      "bg-transparent text-magenta border border-magenta/40 hover:bg-magenta hover:text-white",
    accent: "bg-magenta text-white hover:opacity-90",
  }[kind];
  return (
    <button type={type} onClick={onClick} className={`${base} ${variant} ${className}`}>
      {children}
    </button>
  );
};

export const AdminField = ({
  label,
  type = "text",
  placeholder,
  defaultValue,
  hint,
  name,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  name?: string;
}) => (
  <div className="mb-5">
    <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
    />
    {hint && (
      <div className="mt-1.5 font-serif italic text-[12px] text-ink-subtle">
        {hint}
      </div>
    )}
  </div>
);

export const AdminTextarea = ({
  label,
  placeholder,
  defaultValue,
  rows = 4,
  name,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
  name?: string;
}) => (
  <div className="mb-5">
    <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </label>
    <textarea
      name={name}
      rows={rows}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px] resize-y leading-[1.55]"
    />
  </div>
);

export const AdminSelect = ({
  label,
  options,
  defaultValue,
  name,
}: {
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  name?: string;
}) => (
  <div className="mb-5">
    <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </label>
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export const KPI = ({
  label,
  value,
  delta,
  hint,
  spark,
}: {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  spark?: ReactNode;
}) => (
  <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5 flex flex-col gap-1 relative overflow-hidden">
    <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </div>
    <div className="flex items-end justify-between gap-3 mt-2">
      <div className="font-display text-[clamp(2rem,3.2vw,2.75rem)] text-ink font-normal leading-[1]">
        {value}
      </div>
      {spark && <div className="shrink-0">{spark}</div>}
    </div>
    <div className="flex items-center justify-between mt-1.5">
      {hint ? (
        <div className="italic text-[12px] text-ink-muted">{hint}</div>
      ) : (
        <span />
      )}
      {delta && (
        <span className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
          {delta}
        </span>
      )}
    </div>
  </div>
);

export const PullQuote = ({
  children,
  author,
}: {
  children: ReactNode;
  author?: string;
}) => (
  <figure className="relative py-6">
    <span
      aria-hidden
      className="absolute -top-4 -left-2 font-display text-[80px] leading-none text-magenta/30 select-none pointer-events-none"
    >
      «
    </span>
    <blockquote className="font-display uppercase tracking-display text-[clamp(1.35rem,2.4vw,1.9rem)] leading-[1.15] text-ink pl-8 pr-4 font-normal">
      {children}
    </blockquote>
    {author && (
      <figcaption className="pl-8 mt-3 italic text-[13px] text-ink-muted">
        — {author}
      </figcaption>
    )}
  </figure>
);

export const PageFooter = ({
  page,
  chapter,
}: {
  page: string;
  chapter?: string;
}) => (
  <footer className="mt-10 pt-6 border-t border-ink/15 flex items-center justify-between text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
    <span>ARTémis Records · Backoffice</span>
    {chapter && <span className="italic font-serif normal-case tracking-normal text-[11px] text-ink-muted">{chapter}</span>}
    <span>— {page} —</span>
  </footer>
);

export const EmptyState = ({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) => (
  <div className="border border-dashed border-ink/25 rounded-[2px] py-14 px-8 text-center flex flex-col items-center gap-3 relative overflow-hidden bg-paper">
    <div
      aria-hidden
      className="absolute -right-8 -bottom-6 font-display text-[140px] leading-none text-magenta/5 select-none"
    >
      ✦
    </div>
    <div className="relative flex flex-col items-center gap-3">
      {icon ?? (
        <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden className="text-ink-subtle">
          <path
            d="M12 0 L13.2 10.8 L24 12 L13.2 13.2 L12 24 L10.8 13.2 L0 12 L10.8 10.8 Z"
            fill="currentColor"
            fillOpacity="0.6"
          />
        </svg>
      )}
      <div className="font-display uppercase tracking-display text-[24px] font-normal">
        {title}
      </div>
      {body && (
        <div className="italic text-[13px] text-ink-muted max-w-[440px] leading-[1.55]">
          {body}
        </div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  </div>
);

export const Skeleton = ({
  className = "",
  rounded = "2px",
}: {
  className?: string;
  rounded?: string;
}) => (
  <div
    aria-hidden
    className={`bg-ink/8 animate-pulse ${className}`}
    style={{ borderRadius: rounded }}
  />
);
