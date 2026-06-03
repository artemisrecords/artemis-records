import { Btn, Eyebrow } from "./Primitives";

export const NewsletterBand = ({ href }: { href?: string | null }) => {
  const target = href ?? "/contact";
  return (
    <section className="bg-magenta text-white grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-12 items-center px-[clamp(24px,4vw,56px)] py-[clamp(48px,7vw,88px)]">
      <div>
        <Eyebrow inverse className="!text-beige-sable/65">
          Newsletter
        </Eyebrow>
        <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3.25rem)] font-normal mt-2.5 mb-3">
          Restons en contact
        </h2>
        <p className="italic text-[16px] opacity-85 max-w-[480px] m-0">
          Sorties, sessions studio, dates de concert. Une lettre mensuelle, sans
          bruit.
        </p>
      </div>
      <div className="flex md:justify-end">
        <Btn kind="light" href={target} newTab={Boolean(href)}>
          S&apos;inscrire à la newsletter
        </Btn>
      </div>
    </section>
  );
};
