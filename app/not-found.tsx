import { Btn, Eyebrow } from "@/components/Primitives";

export default function NotFound() {
  return (
    <section className="px-[clamp(24px,4vw,56px)] py-[clamp(72px,12vw,160px)] text-center">
      <Eyebrow className="inline-block !text-magenta">Erreur · 404</Eyebrow>
      <h1 className="font-display uppercase tracking-display text-[clamp(3rem,10vw,9rem)] my-4.5 mb-2 font-normal leading-none">
        Introuvable
      </h1>
      <p className="italic text-[18px] text-ink-muted max-w-[520px] mx-auto my-4 mb-7.5">
        La page que vous cherchez semble s&apos;être perdue dans la forêt. Nous
        revenons au commencement.
      </p>
      <Btn kind="primary" href="/">
        Retour à l&apos;accueil
      </Btn>
    </section>
  );
}
