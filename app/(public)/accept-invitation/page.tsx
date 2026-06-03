import Link from "next/link";
import { getValidInvitation } from "@/lib/invitations";
import { BowMark, Eyebrow, Wordmark } from "@/components/Primitives";
import { AcceptForm } from "./AcceptForm";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invitation = token ? await getValidInvitation(token) : null;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-paper">
      {/* Left: immersive */}
      <aside className="relative overflow-hidden bg-bleu-nuit-700 text-beige-sable min-h-[40vh] lg:min-h-screen p-[clamp(28px,4vw,56px)] flex flex-col justify-between">
        <div className="stars" aria-hidden="true" />
        <div className="relative z-10">
          <Link href="/" className="cursor-pointer">
            <Wordmark inverse size={40} />
          </Link>
        </div>

        <div className="relative z-10 py-10 max-w-[620px]">
          <Eyebrow inverse className="!text-magenta mb-3">
            Espace label · Invitation
          </Eyebrow>
          <h1 className="font-display uppercase tracking-display leading-[0.95] font-normal text-[clamp(2.75rem,6vw,5rem)]">
            Bienvenue
            <br />
            <span className="font-serif italic text-magenta normal-case">
              dans l&apos;équipe.
            </span>
          </h1>
          <p className="font-serif italic text-[17px] leading-[1.6] text-beige-sable/80 mt-7 max-w-[460px]">
            Encore une étape : indiquez votre nom pour activer votre accès à
            l&apos;espace d&apos;ARTémis Records.
          </p>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-6 opacity-75">
          <div className="text-[11px] tracking-eyebrow uppercase font-bold">
            ARTémis Records · 2026 · Paris · Menucourt
          </div>
          <BowMark size={48} inverse />
        </div>
      </aside>

      {/* Right: content */}
      <section className="flex items-center justify-center p-[clamp(28px,4vw,64px)] bg-wash-soft">
        <div className="w-full max-w-[440px]">
          {invitation ? (
            <>
              <Eyebrow className="mb-2">Activation du compte</Eyebrow>
              <h2 className="font-display uppercase tracking-display font-normal text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05]">
                Dernière étape
              </h2>
              <p className="font-serif italic text-[14px] text-ink-muted mt-2 leading-[1.55]">
                Vous activez un accès à l&apos;espace label. Pas de mot de passe :
                la connexion se fait toujours par lien sécurisé.
              </p>
              <AcceptForm token={token!} email={invitation.email} />
            </>
          ) : (
            <>
              <Eyebrow className="mb-2 !text-magenta">Lien invalide</Eyebrow>
              <h2 className="font-display uppercase tracking-display font-normal text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05]">
                Invitation expirée
              </h2>
              <p className="font-serif italic text-[14px] text-ink-muted mt-3 leading-[1.6]">
                Ce lien d&apos;invitation est invalide, a déjà été utilisé, ou a
                expiré. Demandez à un administrateur de vous renvoyer une
                invitation.
              </p>
              <Link
                href="/"
                className="inline-block mt-7 font-serif text-[12px] tracking-eyebrow uppercase font-bold text-ink-muted hover:text-ink"
              >
                ← Retour au site
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
