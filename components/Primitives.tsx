import Link from "next/link";
import type { ReactNode } from "react";

type WordmarkProps = { inverse?: boolean; size?: number };
export const Wordmark = ({ inverse = false, size = 22 }: WordmarkProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={inverse ? "/assets/logo-clair.png" : "/assets/logo-foncé.png"}
    alt="ARTémis Records"
    style={{ height: size * 1.7 }}
    className="w-auto block transition-[height] duration-300 ease-out"
  />
);

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  inverse?: boolean;
};
export const Eyebrow = ({ children, className = "", inverse }: EyebrowProps) => (
  <div
    className={`font-serif text-[11px] tracking-eyebrow uppercase font-bold ${
      inverse ? "text-beige-sable/60" : "text-ink-subtle"
    } ${className}`}
  >
    {children}
  </div>
);

type ChapterTitleProps = {
  eyebrow?: string;
  title: string;
  italic?: string;
  inverse?: boolean;
  size?: "lg" | "md" | "sm";
};
export const ChapterTitle = ({
  eyebrow,
  title,
  italic,
  inverse,
  size = "lg",
}: ChapterTitleProps) => {
  const sizeClass = {
    lg: "text-[clamp(2.75rem,6vw,5rem)]",
    md: "text-[clamp(2rem,4vw,3.25rem)]",
    sm: "text-[clamp(1.5rem,3vw,2.25rem)]",
  }[size];
  return (
    <div>
      {eyebrow && (
        <Eyebrow inverse={inverse} className="mb-1.5">
          {eyebrow}
        </Eyebrow>
      )}
      <h1
        className={`font-display uppercase tracking-display leading-none mt-1 mb-2 font-normal ${sizeClass} ${
          inverse ? "text-beige-sable" : "text-ink"
        }`}
      >
        {title}
      </h1>
      {italic && (
        <div
          className={`font-serif italic text-[18px] ${
            inverse ? "text-beige-sable/75" : "text-ink-muted"
          }`}
        >
          {italic}
        </div>
      )}
    </div>
  );
};

type BtnKind = "primary" | "secondary" | "accent" | "ghost" | "light";
type BtnProps = {
  kind?: BtnKind;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: "button" | "submit";
  newTab?: boolean;
};

const BTN_BASE =
  "font-serif text-[12px] tracking-[0.2em] uppercase font-bold inline-flex items-center gap-2 rounded-[2px] cursor-pointer no-underline transition-opacity duration-200 ease-out hover:opacity-90";

const BTN_VARIANT: Record<BtnKind, string> = {
  primary: "bg-bleu-nuit-700 text-beige-sable px-[26px] py-[14px] border-0",
  secondary:
    "bg-transparent text-current px-[26px] py-[14px] border border-current",
  accent: "bg-magenta text-white px-[26px] py-[14px] border-0",
  ghost:
    "bg-transparent text-current px-1 py-[13px] tracking-[0.18em] border-0 hover:opacity-100",
  light: "bg-beige-sable text-bleu-nuit-700 px-[26px] py-[14px] border-0",
};

export const Btn = ({
  kind = "primary",
  children,
  onClick,
  href,
  className = "",
  type = "button",
  newTab = false,
}: BtnProps) => {
  const classes = `${BTN_BASE} ${BTN_VARIANT[kind]} ${className}`;
  const content = (
    <>
      {children}
      {kind === "ghost" ? <span className="text-magenta">⟶</span> : null}
    </>
  );
  if (href) {
    const external = /^(https?:|mailto:|tel:|#)/.test(href);
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {content}
    </button>
  );
};

export const BowMark = ({
  size = 56,
  inverse = false,
}: {
  size?: number;
  inverse?: boolean;
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={inverse ? "/assets/icon-clair.png" : "/assets/icon-foncé.png"}
    alt=""
    style={{ width: size, height: size }}
    className="block"
  />
);

type BadgeTone = "neutral" | "magenta" | "draft" | "live" | "inverse";
const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "bg-bleu-nuit-700/10 text-bleu-nuit-700",
  magenta: "bg-magenta text-white",
  draft: "bg-taupe/25 text-taupe-900",
  live: "bg-vert-foret-700/15 text-vert-foret-700",
  inverse: "bg-beige-sable/15 text-beige-sable",
};
export const Badge = ({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) => (
  <span
    className={`inline-block px-2.5 py-1 text-[10px] tracking-eyebrow uppercase font-bold rounded-full ${BADGE_TONE[tone]}`}
  >
    {children}
  </span>
);
