"use client";

import { useState } from "react";
import Link from "next/link";
import { BowMark, Eyebrow, Wordmark } from "@/components/Primitives";
import { authClient } from "@/lib/auth-client";

type Status = "idle" | "loading" | "sent" | "error";

export default function AuthClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    try {
      // Message volontairement neutre quoi qu'il arrive : si l'email n'est pas
      // en base (invite-only), Better Auth n'envoie rien, mais on n'en dit rien
      // (anti-énumération des comptes).
      await authClient.signIn.magicLink({
        email: trimmed,
        callbackURL: "/auth/landing",
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-paper">
      {/* Left: immersive */}
      <aside className="relative overflow-hidden bg-bleu-nuit-700 text-beige-sable min-h-[40vh] lg:min-h-screen p-[clamp(28px,4vw,56px)] flex flex-col justify-between">
        <div className="stars" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <Wordmark inverse size={40} />
          </Link>
          <Link
            href="/"
            className="font-serif italic text-[13px] text-beige-sable/70 hover:text-beige-sable"
          >
            ← Retour au site
          </Link>
        </div>

        <div className="relative z-10 py-10 max-w-[620px]">
          <Eyebrow inverse className="!text-magenta mb-3">
            Espace label · Accès privé
          </Eyebrow>
          <h1 className="font-display uppercase tracking-display leading-[0.95] font-normal text-[clamp(2.75rem,6vw,5rem)]">
            Viser la lune,
            <br />
            <span className="font-serif italic text-magenta normal-case">
              piloter le label.
            </span>
          </h1>
          <p className="font-serif italic text-[17px] leading-[1.6] text-beige-sable/80 mt-7 max-w-[460px]">
            Le backoffice d&apos;ARTémis Records, pour écouter les démos
            reçues, gérer les artistes, répondre aux demandes, publier le
            journal.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-5 max-w-[520px]">
            {[
              ["Démos", "écoute & triage"],
              ["Artistes", "fiches & roster"],
              ["Journal", "actualités"],
            ].map(([h, p]) => (
              <div key={h} className="border-l border-beige-sable/25 pl-3.5">
                <div className="font-display uppercase tracking-eyebrow text-[13px] text-magenta font-normal">
                  {h}
                </div>
                <div className="italic text-[12px] opacity-75 mt-1 leading-[1.5]">
                  {p}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-6 opacity-75">
          <div className="text-[11px] tracking-eyebrow uppercase font-bold">
            ARTémis Records · 2026 · Paris · Menucourt
          </div>
          <BowMark size={48} inverse />
        </div>
      </aside>

      {/* Right: form */}
      <section className="flex items-center justify-center p-[clamp(28px,4vw,64px)] bg-wash-soft">
        <div className="w-full max-w-[440px]">
          <Eyebrow className="mb-2">Accès réservé</Eyebrow>
          <h2 className="font-display uppercase tracking-display font-normal text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05]">
            {status === "sent" ? "Vérifiez vos emails" : "Bon retour parmi nous"}
          </h2>
          <p className="font-serif italic text-[14px] text-ink-muted mt-2 leading-[1.55]">
            {status === "sent"
              ? "Si un compte correspond à cette adresse, un lien de connexion vient d'être envoyé."
              : "Recevez un lien de connexion sécurisé par courriel. Pas de mot de passe."}
          </p>

          {status === "sent" ? (
            <div className="mt-8 border border-ink/15 p-7 bg-paper-soft">
              <Eyebrow className="!text-magenta">Lien envoyé</Eyebrow>
              <div className="font-display uppercase tracking-display text-[24px] mt-2 font-normal break-words">
                {email.trim()}
              </div>
              <p className="italic text-[14px] text-ink-muted mt-3 leading-[1.6]">
                Ouvrez le courriel et cliquez sur le lien pour accéder à votre
                espace. Le lien expire dans 15 minutes et ne fonctionne
                qu&apos;une fois.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="font-serif text-[12px] tracking-eyebrow uppercase font-bold text-ink-muted hover:text-ink cursor-pointer"
                >
                  ← Utiliser une autre adresse
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8">
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle"
                >
                  Courriel
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className="mt-1.5 w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif text-[15px] text-ink outline-none focus:border-magenta transition-colors"
                />
              </div>

              {status === "error" && (
                <p className="font-serif italic text-[13px] text-magenta mb-4">
                  Une erreur est survenue. Réessayez dans un instant.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full font-serif text-[12px] tracking-[0.22em] uppercase font-bold bg-bleu-nuit-700 text-beige-sable px-6 py-4 rounded-[2px] cursor-pointer hover:bg-bleu-nuit-800 transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
              >
                {status === "loading" ? "Envoi…" : "Recevoir mon lien"}
                {status !== "loading" && <span className="text-magenta">⟶</span>}
              </button>

              <p className="mt-8 font-serif italic text-[12px] text-ink-subtle leading-[1.7]">
                L&apos;accès se fait sur invitation. Besoin d&apos;aide&nbsp;?{" "}
                <Link href="/contact" className="text-magenta hover:underline">
                  Écrivez-nous
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
