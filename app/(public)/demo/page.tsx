"use client";

import { useActionState } from "react";
import { Btn, ChapterTitle, Eyebrow } from "@/components/Primitives";
import { Field, SuccessPanel, TextArea } from "@/components/FormFields";
import { submitDemo, type DemoFormState } from "./actions";

const CHECKLIST = [
  ["Des démos finalisées", "Pas besoin de master, mais un mix lisible."],
  ["Deux à quatre titres", "De quoi entendre une direction."],
  ["Un mot sur vous", "Votre histoire, vos influences, vos envies."],
  ["Vos liens publics", "Un endroit où écouter / vous voir en live."],
] as const;

export default function DemoPage() {
  const [state, formAction, pending] = useActionState<DemoFormState, FormData>(
    submitDemo,
    null,
  );
  const errors = state?.errors;

  return (
    <section className="bg-paper px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
      <ChapterTitle
        eyebrow="Soumettre · Démarche artiste"
        title="PROPOSER UNE DÉMO"
        italic="Écrivons la suite ensemble"
      />
      <div className="h-8" />
      <p className="italic text-[17px] text-ink-muted max-w-[640px]">
        Nous accueillons les démarches avec attention. Parlez-nous de vous, de
        votre musique, de vos envies. Réponse sous quinze jours ouvrés.
      </p>
      <div className="h-10" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-14">
        {state?.ok ? (
          <SuccessPanel
            title="Bien reçu."
            body="Nous écoutons votre démo sous quinze jours. Merci de votre confiance."
          />
        ) : (
          <form action={formAction}>
            <Field
              name="artist"
              label="Nom d'artiste"
              placeholder="Votre projet"
              required
              error={errors?.artist}
            />
            <Field
              name="contact"
              label="Nom civil"
              placeholder="Nom, prénom"
              required
              error={errors?.contact}
            />
            <Field
              name="email"
              label="Courriel"
              type="email"
              placeholder="vous@exemple.fr"
              required
              error={errors?.email}
            />
            <Field
              name="listenUrl"
              label="Lien d'écoute"
              type="url"
              placeholder="SoundCloud, Bandcamp, YouTube…"
              required
              error={errors?.listenUrl}
            />
            <Field
              name="socials"
              label="Réseaux sociaux"
              placeholder="Instagram, TikTok"
              error={errors?.socials}
            />
            <TextArea
              name="pitch"
              label="Votre démarche"
              placeholder="Qui êtes-vous ? Quelle musique ? Quelles envies ?"
              rows={6}
              error={errors?.pitch}
            />
            <div className="text-[12px] italic text-ink-muted mb-5">
              En envoyant ce formulaire, vous acceptez que nous conservions vos
              informations pendant 12 mois.
            </div>
            <Btn kind="accent" type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer la démo"}
            </Btn>
          </form>
        )}
        <aside>
          <Eyebrow>Ce que nous écoutons</Eyebrow>
          <div className="mt-4.5">
            {CHECKLIST.map(([h, p]) => (
              <div key={h} className="py-4.5 border-t border-ink/15">
                <div className="font-display uppercase tracking-caps text-[16px] text-magenta mb-1.5 font-normal">
                  {h}
                </div>
                <div className="text-[14px] text-ink-muted italic">{p}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
