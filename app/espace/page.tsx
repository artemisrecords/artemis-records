import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { findArtist } from "@/lib/db/queries";
import { ArtistEditClient } from "@/app/backoffice/artistes/[id]/ArtistEditClient";

export const metadata = { title: "Espace artiste · ARTémis Records" };

export default async function EspacePage() {
  // Le layout garantit session + rôle artiste ; on relit pour l'artistId.
  const session = await auth.api.getSession({ headers: await headers() });
  const artistId = session?.user.artistId ?? null;
  const artist = artistId ? await findArtist(artistId) : null;

  if (!artist) {
    return (
      <div className="max-w-[560px] mx-auto text-center py-20">
        <h1 className="font-display uppercase tracking-display text-[28px] mb-4">
          Aucune fiche liée
        </h1>
        <p className="italic text-[14px] text-ink-muted leading-[1.65]">
          Votre compte n&apos;est encore relié à aucune fiche artiste. Contactez
          l&apos;équipe du label pour faire le lien.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta mb-2">
          Votre fiche publique
        </div>
        <p className="italic text-[13px] text-ink-muted leading-[1.6] max-w-[640px]">
          Tout ce que vous enregistrez ici est publié sur votre page du site
          ARTémis Records. La mise en ligne de la fiche reste gérée par le label.
        </p>
      </div>
      <ArtistEditClient artist={artist} mode="artiste" />
    </div>
  );
}
