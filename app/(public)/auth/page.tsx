"use client";

import { useState } from "react";
import Link from "next/link";
import { BowMark, Eyebrow, Wordmark } from "@/components/Primitives";

type Mode = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [submitted, setSubmitted] = useState(false);

  const copy = {
    signin: {
      title: "Bon retour parmi nous",
      italic: "Identifiez-vous pour accéder au backoffice du label.",
      cta: "Se connecter",
    },
    signup: {
      title: "Créer un compte",
      italic: "Demandez un accès à l'espace label.",
      cta: "Demander un accès",
    },
    forgot: {
      title: "Mot de passe oublié",
      italic: "Recevez un lien de réinitialisation par courriel.",
      cta: "Envoyer le lien",
    },
  }[mode];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-paper">
      {/* Left — immersive */}
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
            Le backoffice d&apos;ARTémis Records — pour écouter les démos
            reçues, gérer les artistes, répondre aux demandes, publier le
            journal.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-5 max-w-[520px]">
            {[
              ["Démos", "écoute & triage"],
              ["Artistes", "fiches & roster"],
              ["Journal", "actualités"],
            ].map(([h, p]) => (
              <div
                key={h}
                className="border-l border-beige-sable/25 pl-3.5"
              >
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
            ARTémis Records · 2026 · Paris — Menucourt
          </div>
          <BowMark size={48} inverse />
        </div>
      </aside>

      {/* Right — form */}
      <section className="flex items-center justify-center p-[clamp(28px,4vw,64px)] bg-wash-soft">
        <div className="w-full max-w-[440px]">
          <Eyebrow className="mb-2">Accès réservé · Prototype</Eyebrow>
          <h2 className="font-display uppercase tracking-display font-normal text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05]">
            {copy.title}
          </h2>
          <p className="font-serif italic text-[14px] text-ink-muted mt-2 leading-[1.55]">
            {copy.italic}
          </p>

          {/* Tabs */}
          {mode !== "forgot" && (
            <div className="mt-7 flex gap-0 border-b border-ink/15">
              {(
                [
                  ["signin", "Connexion"],
                  ["signup", "Créer un compte"],
                ] as const
              ).map(([k, l]) => {
                const active = mode === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMode(k)}
                    className={`relative font-serif text-[11px] tracking-eyebrow uppercase font-bold px-0 py-3 mr-6 cursor-pointer transition-colors ${
                      active ? "text-ink" : "text-ink-subtle hover:text-ink"
                    }`}
                  >
                    {l}
                    <span
                      className={`absolute left-0 right-0 -bottom-px h-[2px] ${
                        active ? "bg-magenta" : "bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {submitted ? (
            <div className="mt-8 border border-ink/15 p-7 bg-paper-soft">
              <Eyebrow className="!text-magenta">Bien reçu</Eyebrow>
              <div className="font-display uppercase tracking-display text-[28px] mt-2 font-normal">
                Maquette — pas d&apos;effet réel
              </div>
              <p className="italic text-[14px] text-ink-muted mt-3 leading-[1.6]">
                L&apos;authentification sera branchée une fois la charte du
                label entérinée. En attendant, vous pouvez{" "}
                <Link href="/backoffice" className="text-magenta underline">
                  ouvrir le backoffice en mode démo
                </Link>{" "}
                pour feuilleter les pages.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="font-serif text-[12px] tracking-eyebrow uppercase font-bold text-ink-muted hover:text-ink cursor-pointer"
                >
                  ← Réessayer
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="mt-7"
            >
              {mode === "signup" && (
                <AuthField label="Nom complet" placeholder="Votre nom" />
              )}
              <AuthField
                label="Courriel"
                type="email"
                placeholder="vous@exemple.fr"
              />
              {mode !== "forgot" && (
                <AuthField
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  rightLink={
                    mode === "signin" ? (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="font-serif italic text-[12px] text-ink-muted hover:text-ink cursor-pointer"
                      >
                        oublié&nbsp;?
                      </button>
                    ) : null
                  }
                />
              )}

              {mode === "signin" && (
                <label className="flex items-center gap-2.5 mt-2 mb-6 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="appearance-none w-4 h-4 border border-ink/35 bg-transparent checked:bg-bleu-nuit-700 checked:border-bleu-nuit-700 transition-colors"
                  />
                  <span className="font-serif italic text-[13px] text-ink-muted">
                    Garder ma session active
                  </span>
                </label>
              )}

              <button
                type="submit"
                className="w-full font-serif text-[12px] tracking-[0.22em] uppercase font-bold bg-bleu-nuit-700 text-beige-sable px-6 py-4 rounded-[2px] cursor-pointer hover:bg-bleu-nuit-800 transition-colors mt-4 flex items-center justify-center gap-2"
              >
                {copy.cta}
                <span className="text-magenta">⟶</span>
              </button>

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="block mt-4 font-serif italic text-[13px] text-ink-muted hover:text-ink cursor-pointer"
                >
                  ← Retour à la connexion
                </button>
              )}

              <div className="my-8 flex items-center gap-3 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                <span className="h-px flex-1 bg-ink/15" />
                <span>ou</span>
                <span className="h-px flex-1 bg-ink/15" />
              </div>

              <button
                type="button"
                className="w-full font-serif text-[12px] tracking-[0.18em] uppercase font-bold bg-paper-soft text-ink px-6 py-3.5 rounded-[2px] cursor-pointer border border-ink/20 hover:border-ink/40 transition-colors flex items-center justify-center gap-3"
              >
                <span className="w-4 h-4 rounded-full border border-magenta flex items-center justify-center text-magenta text-[10px]">
                  G
                </span>
                Continuer avec Google
              </button>

              <p className="mt-8 font-serif italic text-[12px] text-ink-subtle leading-[1.7]">
                Maquette — aucune donnée n&apos;est transmise. Besoin
                d&apos;aide&nbsp;?{" "}
                <Link
                  href="/contact"
                  className="text-magenta hover:underline"
                >
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

function AuthField({
  label,
  type = "text",
  placeholder,
  rightLink,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  rightLink?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
          {label}
        </label>
        {rightLink}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif text-[15px] text-ink outline-none focus:border-magenta transition-colors"
      />
    </div>
  );
}
