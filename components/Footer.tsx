"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eyebrow, Wordmark } from "./Primitives";
import type { LabelSettings } from "@/lib/db/queries";
import { addressLines } from "@/lib/address";

export const Footer = ({ label }: { label: LabelSettings }) => {
  const pathname = usePathname() || "/";
  if (
    pathname === "/auth" ||
    pathname === "/accept-invitation" ||
    pathname.startsWith("/backoffice") ||
    pathname.startsWith("/espace")
  )
    return null;
  return (
  <footer className="bg-bleu-nuit-700 text-beige-sable font-serif grid grid-cols-2 gap-x-10 gap-y-12 sm:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-10 px-[clamp(24px,4vw,56px)] pt-14 sm:pt-[72px] pb-9">
    <div className="col-span-2 sm:col-span-3 lg:col-span-1">
      <Wordmark inverse size={22} />
      <p className="italic text-[13px] opacity-80 mt-[18px] leading-[1.65] max-w-[340px]">
        Label français dédié aux artistes émergents. Respect du travail, des
        conditions et du bien-être. Nos valeurs guident chaque signature.
      </p>
      <div className="mt-[18px] text-[11px] tracking-eyebrow uppercase font-bold opacity-55">
        « Viser plus haut, rêver plus grand. »
      </div>
    </div>

    <div>
      <Eyebrow className="!text-beige-sable/55 mb-3.5">Le label</Eyebrow>
      {[
        { href: "/about", l: "À propos" },
        { href: "/news", l: "Journal" },
        { href: "/charte", l: "Notre charte" },
        { href: "/demo", l: "Proposer une démo" },
      ].map((x) => (
        <div key={x.href} className="text-[12px] mb-2.5 opacity-85 italic">
          <Link href={x.href}>{x.l}</Link>
        </div>
      ))}
    </div>

    <div>
      <Eyebrow className="!text-beige-sable/55 mb-3.5">Artistes</Eyebrow>
      {[
        { id: "allicyone", name: "Allicyone" },
        { id: "caelya", name: "Caëlya" },
      ].map((x) => (
        <div key={x.id} className="text-[12px] mb-2.5 opacity-85 italic">
          <Link href={`/artists/${x.id}`}>{x.name}</Link>
        </div>
      ))}
      <div className="text-[12px] mb-2.5 opacity-85 italic">
        <Link href="/artists">Roster complet</Link>
      </div>
    </div>

    <div className="col-span-2 sm:col-span-1">
      <Eyebrow className="!text-beige-sable/55 mb-3.5">Contact</Eyebrow>
      {label.phones.map((phone) => (
        <div key={phone} className="text-[12px] mb-2 opacity-85">
          {phone}
        </div>
      ))}
      {label.emails.map((email) => (
        <div key={email} className="text-[12px] mb-2 opacity-85">
          {email}
        </div>
      ))}
      {label.address && (
        <div className="text-[12px] mb-2 opacity-85 leading-[1.55]">
          {addressLines(label.address).map((line, i) => (
            <span key={line}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2.5 mt-3.5">
        {["IG", "YT", "TK", "FB"].map((s) => (
          <span
            key={s}
            className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-beige-sable/30 text-[9px] tracking-[0.12em] font-bold cursor-pointer"
          >
            {s}
          </span>
        ))}
      </div>
    </div>

    <div className="col-span-full border-t border-beige-sable/20 pt-5 mt-5 text-[10px] tracking-eyebrow uppercase opacity-60 flex justify-between flex-wrap gap-3">
      <span>© 2026 ARTémis Records</span>
      <div className="flex flex-wrap gap-x-[22px] gap-y-2">
        <Link href="/auth">Espace label</Link>
        <Link href="/legal">Mentions légales</Link>
        <Link href="/privacy">Confidentialité</Link>
        <Link href="/cgu">CGU</Link>
        <Link href="/charte-graphique">Charte graphique</Link>
      </div>
    </div>
  </footer>
  );
};
