import type { ReactNode } from "react";
import { ChapterTitle } from "./Primitives";

export const LegalPage = ({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) => (
  <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)] max-w-[820px] mx-auto">
    <ChapterTitle
      eyebrow={eyebrow}
      title={title}
      italic="Pour la forme, pour le fond"
      size="md"
    />
    <div className="h-10" />
    <div className="legal-body text-[15px] leading-[1.75]">{children}</div>
  </section>
);
