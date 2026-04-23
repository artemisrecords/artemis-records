"use client";

import type { ReactNode } from "react";

export const Field = ({
  label,
  type = "text",
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder?: string;
}) => (
  <div className="mb-5.5">
    <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif text-[15px] text-ink outline-none focus:border-magenta transition-colors"
    />
  </div>
);

export const TextArea = ({
  label,
  placeholder,
  rows = 4,
}: {
  label: string;
  placeholder?: string;
  rows?: number;
}) => (
  <div className="mb-7">
    <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </label>
    <textarea
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif italic text-[15px] text-ink outline-none resize-y focus:border-magenta transition-colors"
    />
  </div>
);

export const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <div className="mb-4.5">
    <div className="italic text-ink-muted text-[12px] mb-1">{label}</div>
    <div className="text-[15px]">{value}</div>
  </div>
);

export const SuccessPanel = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => (
  <div className="bg-bleu-nuit-700 text-beige-sable rounded-[2px] p-10">
    <div className="text-[11px] tracking-eyebrow uppercase font-bold text-magenta">
      Bien reçu
    </div>
    <h3 className="font-display uppercase tracking-display text-[40px] my-3 font-normal">
      {title}
    </h3>
    <p className="italic text-[16px] leading-[1.55] opacity-90 m-0">{body}</p>
  </div>
);
