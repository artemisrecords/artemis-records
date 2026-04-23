import Link from "next/link";
import type { Artist } from "@/lib/data";

export const ArtistCard = ({
  artist,
  featured = false,
}: {
  artist: Artist;
  featured?: boolean;
}) => (
  <Link
    href={`/artists/${artist.id}`}
    className={`grain group relative overflow-hidden flex flex-col justify-end rounded-[2px] p-6 cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-0.5 ${
      featured ? "min-h-[460px]" : "min-h-[380px]"
    }`}
    style={{
      background: `center/cover no-repeat url(${artist.portraitUrl || artist.coverUrl})`,
    }}
  >
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,31,74,0)_40%,rgba(28,31,74,0.85)_100%)]" />
    <div className="relative text-beige-sable">
      <div className="text-[10px] tracking-eyebrow uppercase text-magenta font-bold mb-1.5">
        Signée {artist.signedYear} · {artist.genre}
      </div>
      <div
        className={`font-display uppercase tracking-display leading-none ${
          featured ? "text-[clamp(2.25rem,4vw,3.25rem)]" : "text-[32px]"
        }`}
      >
        {artist.name}
      </div>
      <div className="italic text-[14px] opacity-90 mt-2 max-w-[320px]">
        {artist.tagline}
      </div>
      <div className="mt-3.5 text-[10px] tracking-eyebrow uppercase font-bold">
        Découvrir <span className="text-magenta">⟶</span>
      </div>
    </div>
  </Link>
);
