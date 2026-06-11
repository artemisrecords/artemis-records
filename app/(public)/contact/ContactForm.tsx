"use client";

import { useState } from "react";
import Link from "next/link";
import { Btn, Eyebrow } from "@/components/Primitives";
import { Field, SuccessPanel, TextArea } from "@/components/FormFields";

const SUBJECTS = [
  ["custom", "Personnalisé"],
  ["presse", "Média / Presse"],
  ["demo", "Envoyer une Démo"],
] as const;

export function ContactForm() {
  const [subject, setSubject] = useState<string>("custom");
  const [submitted, setSubmitted] = useState(false);

  const chipBase =
    "text-[11px] tracking-[0.18em] uppercase font-bold px-3.5 py-2 rounded-full border border-ink/30 cursor-pointer transition-colors";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      {submitted ? (
        <SuccessPanel
          title="Merci."
          body="Nous écoutons chaque message avec attention. Vous recevrez une réponse sous sept jours ouvrés."
        />
      ) : (
        <>
          <Eyebrow>Votre message</Eyebrow>
          <h2 className="font-display uppercase tracking-display text-[clamp(1.75rem,3vw,2.5rem)] my-2 mb-7 font-normal">
            Dites-nous tout
          </h2>

          <Eyebrow className="mb-2.5">Sujet</Eyebrow>
          <div className="flex gap-2 flex-wrap mb-6.5">
            {SUBJECTS.map(([k, l]) => {
              const active = subject === k;
              const classes = `${chipBase} ${
                active
                  ? "bg-bleu-nuit-700 text-beige-sable border-bleu-nuit-700"
                  : "bg-transparent text-ink hover:border-ink/50"
              }`;
              if (k === "demo") {
                return (
                  <Link
                    key={k}
                    href="/demo"
                    className={`${classes} inline-flex items-center gap-1.5`}
                  >
                    {l}
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M8 7h9v9" />
                    </svg>
                  </Link>
                );
              }
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSubject(k)}
                  className={classes}
                >
                  {l}
                </button>
              );
            })}
          </div>

          <Field label="Nom" type="text" placeholder="Votre nom" />
          <Field label="Courriel" type="email" placeholder="vous@exemple.fr" />
          {subject === "presse" && (
            <Field
              label="Média"
              type="text"
              placeholder="Nom du média / de la publication"
            />
          )}
          <Field
            label="Objet"
            type="text"
            placeholder="Sujet de votre message"
          />

          <TextArea label="Message" placeholder="Parlez-nous librement." />

          <Btn kind="primary" type="submit">
            Envoyer
          </Btn>
        </>
      )}
    </form>
  );
}
