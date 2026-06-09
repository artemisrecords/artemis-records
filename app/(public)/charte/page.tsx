import { Btn, ChapterTitle, Eyebrow } from "@/components/Primitives";

const ENGAGEMENTS = [
  {
    n: "01",
    title: "Respect du travail",
    engagement:
      "Nous rémunérons le travail à sa juste valeur, nous tenons nos délais et nous reconnaissons chaque contribution. Les contrats restent lisibles, les durées courtes, les clauses de sortie négociables — et aucun ne quitte le label sans relecture à deux voix.",
    attendu:
      "Que chacun·e respecte le travail des autres, communique ses contraintes en amont et tienne ses engagements avec le même soin.",
  },
  {
    n: "02",
    title: "Inclusivité",
    engagement:
      "ARTémis est une safe place pour les personnes LGBTQIA+, handicapées, racisées ou porteuses d'une différence. Nous écoutons, nous adaptons, et nous appliquons une tolérance zéro face aux discriminations.",
    attendu:
      "Une attention sincère à l'autre, et le réflexe de signaler ce qui ne va pas plutôt que de le taire.",
  },
  {
    n: "03",
    title: "Féminisme",
    engagement:
      "Nous mettons en avant les femmes et les minorités de genre, trop peu représentées dans l'industrie musicale — à la scène comme dans les métiers de la production.",
    attendu:
      "Que personne ne soit jugé·e sur autre chose que son travail et sa démarche artistique.",
  },
  {
    n: "04",
    title: "Climat",
    engagement:
      "Nous prenons au sérieux notre impact écologique : tournées raisonnées, productions sobres, choix de prestataires responsables quand c'est possible.",
    attendu:
      "Une démarche partagée, où l'on cherche ensemble l'option la plus sobre — sans en faire une contrainte culpabilisante.",
  },
  {
    n: "05",
    title: "Diversité",
    engagement:
      "Nous cultivons un catalogue pluriel — styles, identités, parcours, régions du monde. La différence et l'authenticité priment sur les cases.",
    attendu:
      "La curiosité pour ce qui n'est pas soi, et l'envie de faire dialoguer des univers.",
  },
  {
    n: "06",
    title: "Bienveillance",
    engagement:
      "Nous encourageons la communication ouverte, l'écoute et la bienveillance au quotidien. Le doute et l'erreur ont leur place ; le mépris, non.",
    attendu:
      "De la franchise dans le respect, et la volonté de régler les désaccords par le dialogue.",
  },
] as const;

export default function ChartePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-bleu-nuit-700 text-beige-sable relative overflow-hidden px-[clamp(24px,4vw,56px)] py-[clamp(64px,9vw,110px)]">
        <div className="stars opacity-40" aria-hidden />
        <div className="relative z-10 max-w-[760px]">
          <ChapterTitle
            eyebrow="Charte · Nos engagements"
            title="LA CHARTE"
            italic="Ce qui nous engage, à chaque signature"
            inverse
          />
          <p className="italic text-[clamp(18px,2vw,24px)] leading-[1.6] mt-8 text-beige-sable/85">
            Cette charte dit qui nous sommes et comment nous travaillons. Ce ne
            sont pas des slogans : ce sont les engagements qui guident chaque
            signature, chaque contrat, chaque collaboration au sein d&apos;ARTémis
            Records. Nous nous y tenons — et nous attendons la même chose de
            celles et ceux qui nous rejoignent.
          </p>
        </div>
      </section>

      {/* Engagements */}
      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
        <Eyebrow className="!text-magenta">Six valeurs, six engagements</Eyebrow>
        <div className="h-8" />
        <div className="flex flex-col gap-px bg-ink/10 border border-ink/10">
          {ENGAGEMENTS.map((e) => (
            <article
              key={e.n}
              className="bg-paper grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-x-10 gap-y-5 px-[clamp(20px,3vw,44px)] py-[clamp(28px,4vw,48px)]"
            >
              <div className="flex items-baseline gap-4 lg:flex-col lg:gap-1 lg:w-[180px]">
                <span className="font-display text-[clamp(2.4rem,4vw,3.4rem)] leading-none text-magenta">
                  {e.n}
                </span>
                <h2 className="font-display uppercase tracking-display text-[clamp(1.2rem,2vw,1.6rem)] font-normal">
                  {e.title}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-x-10 gap-y-6">
                <div>
                  <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle mb-2.5">
                    Notre engagement
                  </div>
                  <p className="text-[15px] leading-[1.75] text-ink">
                    {e.engagement}
                  </p>
                </div>
                <div className="sm:border-l sm:border-ink/10 sm:pl-10">
                  <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle mb-2.5">
                    Ce que nous attendons
                  </div>
                  <p className="text-[15px] leading-[1.75] italic text-ink-muted">
                    {e.attendu}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Clôture */}
      <section className="bg-wash-soft px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)] text-center">
        <div className="max-w-[680px] mx-auto">
          <Eyebrow className="!text-magenta">En une phrase</Eyebrow>
          <p className="font-serif italic text-[clamp(20px,2.3vw,28px)] leading-[1.5] mt-5 text-ink">
            « Viser la lune, retomber dans les étoiles » — ensemble, dans le
            respect, la bienveillance et la liberté de chacun·e.
          </p>
          <div className="mt-8 flex gap-3.5 justify-center flex-wrap">
            <Btn kind="ghost" href="/about">
              Lire le manifeste
            </Btn>
            <Btn kind="accent" href="/demo">
              Proposer une démo
            </Btn>
          </div>
        </div>
      </section>
    </div>
  );
}
