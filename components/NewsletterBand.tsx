"use client";

import { Btn, Eyebrow } from "./Primitives";

export const NewsletterBand = () => (
  <section className="bg-magenta text-white grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-12 items-center px-[clamp(24px,4vw,56px)] py-[clamp(48px,7vw,88px)]">
    <div>
      <Eyebrow inverse className="!text-beige-sable/65">
        Newsletter
      </Eyebrow>
      <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3.25rem)] font-normal mt-2.5 mb-3">
        Restons en contact
      </h2>
      <p className="italic text-[16px] opacity-85 max-w-[480px] m-0">
        Sorties, sessions studio, dates de concert — une lettre mensuelle, sans
        bruit.
      </p>
    </div>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert("Merci, nous vous écrivons bientôt.");
      }}
      className="flex gap-2.5 flex-wrap"
    >
      <input
        type="email"
        placeholder="votre@adresse.fr"
        required
        className="flex-[1_1_240px] bg-transparent border border-white/50 text-white px-4 py-3.5 font-serif text-[14px] rounded-[2px] outline-none placeholder:text-white/75 focus:border-white"
      />
      <Btn kind="light" type="submit">
        S&apos;inscrire
      </Btn>
    </form>
  </section>
);
