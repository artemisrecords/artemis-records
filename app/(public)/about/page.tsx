import { Btn, ChapterTitle, Eyebrow } from "@/components/Primitives";

const buildWavePath = ({
  width = 47,
  side = "right" as "right" | "left",
  waves = 5,
  amplitude = 6,
  phase = 79,
}) => {
  const w = Math.max(5, Math.min(100, width));
  const H = 1000;
  const baseX = side === "right" ? 100 - w : w;
  const outerX = side === "right" ? 100 : 0;
  const n = Math.max(1, Math.round(waves));
  const amp = amplitude / 10;
  const phaseRad = (phase / 100) * Math.PI * 2;
  const steps = 60;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * H;
    const wave = Math.sin(t * Math.PI * 2 * n + phaseRad) * amp;
    const sign = side === "right" ? -1 : 1;
    pts.push([baseX + sign * wave, y]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]} `;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += `Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2} `;
  }
  d += `L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]} `;
  d += `L ${outerX} ${H} L ${outerX} 0 Z`;
  return d;
};

const VALUES = [
  ["Inclusivité", "Une safe place pour les personnes LGBTQIA+, handicapées, racisées, ou porteuses d'une différence."],
  ["Féminisme", "Nous nous engageons à mettre en avant les femmes, trop peu représentées dans l'industrie musicale."],
  ["Climat", "Nous prenons au sérieux notre impact écologique : tournées raisonnées, productions sobres."],
  ["Diversité", "Un catalogue pluriel : styles, identités, régions du monde."],
  ["Respect", "Le respect du travail, des conditions de travail, et des personnes."],
  ["Bienveillance", "Nous encourageons la communication, le respect et la bienveillance au quotidien."],
] as const;

const POSITIONS = [
  ["Formel", "Détendu", 0.55],
  ["Simple", "Complexe", 0.38],
  ["Moderne", "Classique", 0.68],
  ["Industriel", "Naturel", 0.78],
] as const;

export default function AboutPage() {
  const angle = 28;
  const flip = true;
  const d = buildWavePath({ width: 47, side: "right", waves: 5, amplitude: 6, phase: 79 });

  return (
    <div>
      <section className="relative overflow-hidden bg-paper text-ink px-[clamp(24px,4vw,56px)] -mt-[100px] pt-[calc(clamp(72px,10vw,130px)+100px)] pb-[clamp(72px,10vw,130px)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          className="absolute -top-[calc(60%+100px)] -left-[60%] w-[220%] h-[calc(220%+200px)] z-0 pointer-events-none"
          style={{
            transform: `rotate(${angle}deg)${flip ? " scaleY(-1)" : ""}`,
            transformOrigin: "center",
          }}
        >
          <path d={d} fill="var(--color-bleu-nuit-700)" />
        </svg>

        {/* Stars masked to the wave shape. This layer mirrors the wave SVG
            above 1:1 — same 220% box, same offset, same transform, same path
            drawn in the same 100x1000 viewBox — so the stars fill the entire
            blue wave, corners included, not just the section-sized slice. */}
        {(() => {
          const maskSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 1000' preserveAspectRatio='none'><path d='${d}' fill='white'/></svg>`;
          const maskUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(maskSvg)}")`;
          return (
            <div
              aria-hidden="true"
              className="absolute -top-[calc(60%+100px)] -left-[60%] w-[220%] h-[calc(220%+200px)] z-0 pointer-events-none overflow-hidden"
              style={{
                transform: `rotate(${angle}deg)${flip ? " scaleY(-1)" : ""}`,
                transformOrigin: "center",
                WebkitMaskImage: maskUrl,
                maskImage: maskUrl,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            >
              {/* Repeating star tiles that pan upward forever; the scroll and
                  density live in .stars-dense / .stars-rise (globals.css). */}
              <div className="stars stars-dense stars-rise absolute inset-0" />
            </div>
          );
        })()}

        <div className="relative z-10">
          <ChapterTitle
            eyebrow="À propos de nous"
            title="ORIGINES"
            italic="Histoire d'un label et ses fondatrices"
          />
          <p className="italic text-[clamp(20px,2vw,26px)] leading-[1.5] max-w-[560px] mt-8 text-ink-muted">
            ARTémis RECORDS est né d&apos;une idée commune : faire du monde de
            la musique une{" "}
            <em className="text-magenta not-italic uppercase font-display tracking-[0.12em]">
              safe place
            </em>{" "}
            pour tous.
          </p>
        </div>
      </section>

      {/* Origines */}
      <section className="bg-wash-soft px-[clamp(24px,4vw,56px)] py-[clamp(72px,9vw,110px)] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-14 items-center">
        <div>
          <Eyebrow>2025 · Commencements</Eyebrow>
          <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3.25rem)] mt-2.5 mb-6 font-normal">
            Deux cousines,
            <br />
            un label.
          </h2>
          <p className="text-[16px] leading-[1.75] max-w-[560px]">
            Créé en 2025 par <strong>Chloé</strong> et{" "}
            <strong>Shanna Bourguignon</strong> (<em>Allicyone</em> et{" "}
            <em>Caëlya</em>), deux cousines passionnées de musique, ARTémis
            Records voit le jour en été 2025 et se positionne comme label
            engagé.
          </p>
          <p className="text-[16px] leading-[1.75] max-w-[560px]">
            Axé sur le respect du travail, les conditions et le bien-être des
            artistes, le but d&apos;ARTémis Records est d&apos;accompagner au
            mieux ces dernier·es dans leurs projets artistiques.
          </p>
        </div>
        <div
          className="aspect-[7/2] w-[88%] mx-auto"
          style={{ background: "center/cover no-repeat url(/assets/logo-foncé.png)" }}
        />
      </section>

      {/* Chloé */}
      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(72px,9vw,110px)] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-14 items-center">
        <div
          className="grain aspect-[4/5] w-[64%] mx-auto"
          style={{ background: "center/cover no-repeat url(/assets/allicyone.webp)" }}
        />
        <div>
          <Eyebrow className="!text-magenta">Chloé · Allicyone</Eyebrow>
          <h3 className="font-display uppercase tracking-display text-[clamp(1.8rem,3.2vw,2.6rem)] mt-2.5 mb-5 font-normal">
            De la scène
            <br />à la production.
          </h3>
          <p className="text-[16px] leading-[1.75] max-w-[560px]">
            Après une licence d&apos;Anglais et 3 années au Cours Florent
            Musique, Chloé (Allicyone) cherche à se diversifier dans
            l&apos;univers de la musique. Elle se passionne rapidement pour la
            production phonographique et audiovisuelle en parallèle de son
            propre projet artistique.
          </p>
          <p className="text-[16px] leading-[1.75] max-w-[560px]">
            Grâce aux compétences et aux connaissances acquises pendant sa
            formation, elle a développé une volonté d&apos;aider d&apos;autres
            artistes dans leur carrière.
          </p>
        </div>
      </section>

      {/* Shanna */}
      <section className="bg-wash-soft px-[clamp(24px,4vw,56px)] py-[clamp(72px,9vw,110px)] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-14 items-center">
        <div>
          <Eyebrow className="!text-magenta">Shanna · Caëlya</Eyebrow>
          <h3 className="font-display uppercase tracking-display text-[clamp(1.8rem,3.2vw,2.6rem)] mt-2.5 mb-5 font-normal">
            La production
            <br />
            comme vocation.
          </h3>
          <p className="text-[16px] leading-[1.75] max-w-[560px]">
            À la suite d&apos;une formation en chargé de production, Shanna
            (Caëlya) souhaite créer une structure pour d&apos;autres artistes et
            son projet personnel.
          </p>
          <p className="text-[16px] leading-[1.75] max-w-[560px]">
            À côté, elle entre en 3e année de Bachelor en Industries Culturelles
            et Créatives et se spécialise dans la branche production.
          </p>
        </div>
        <div
          className="grain aspect-[4/5] w-[64%] mx-auto"
          style={{ background: "center/cover no-repeat url(/assets/caelya.webp)" }}
        />
      </section>

      {/* Une évidence */}
      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(64px,9vw,110px)] text-center">
        <div className="max-w-[780px] mx-auto">
          <Eyebrow>Une évidence</Eyebrow>
          <p className="font-serif italic text-[clamp(22px,2.4vw,30px)] leading-[1.5] mt-5 text-ink">
            « L&apos;association entre les deux jeunes filles arrive lors de
            leur dernière année au Cours Florent. C&apos;est alors une évidence
            pour elles : créer un label, une{" "}
            <em className="text-magenta not-italic uppercase font-display tracking-[0.12em] text-[0.72em]">
              safe place
            </em>
            , un endroit de partage où la musique serait l&apos;élément
            principal. »
          </p>
        </div>
      </section>

      {/* Manifeste + positionnement */}
      <section className="bg-bleu-nuit-700 text-beige-sable px-[clamp(24px,4vw,56px)] py-[clamp(72px,9vw,110px)] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-16 items-center">
        <div>
          <Eyebrow inverse className="!text-magenta">
            Manifeste
          </Eyebrow>
          <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3.25rem)] mt-2.5 mb-5 font-normal text-beige-sable">
            Notre vision
          </h2>
          <p className="text-[16px] leading-[1.75] max-w-[620px] text-beige-sable/90">
            Le label est une structure qui accompagne les artistes émergents. Il
            est axé sur le respect du travail, des conditions de travail et du
            bien-être des artistes, afin de pouvoir les accompagner au mieux
            dans leurs projets.
          </p>
          <p className="text-[16px] leading-[1.75] max-w-[620px] text-beige-sable/90">
            ARTémis Records promeut des valeurs d&apos;inclusivité et de
            diversité, et souhaite se différencier en rendant l&apos;industrie
            de la musique plus saine. En toute bienveillance, le label
            s&apos;engage à aider les artistes dans leur carrière, afin de
            rendre la musique plus accessible.
          </p>
          <p className="text-[16px] leading-[1.75] max-w-[620px] italic text-beige-sable/65">
            ARTémis RECORDS valorise la différence, l&apos;authenticité des
            artistes qui sortent du lot ou des codes sociaux.
          </p>
        </div>
        <div>
          <Eyebrow inverse className="!text-magenta">
            Positionnement
          </Eyebrow>
          <div className="h-3" />
          <div className="flex flex-col gap-4">
            {POSITIONS.map(([l, r, pos], i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px] tracking-eyebrow uppercase text-beige-sable/60 font-bold mb-2">
                  <span>{l}</span>
                  <span>{r}</span>
                </div>
                <div className="relative h-0.5 bg-beige-sable/20">
                  <div
                    className="absolute -top-1.5 w-3.5 h-3.5 bg-magenta rounded-full"
                    style={{ left: `calc(${pos * 100}% - 7px)` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="bg-wash-soft px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
        <ChapterTitle
          eyebrow="Valeurs"
          title="CE QUI NOUS GUIDE"
          italic="Six mots, six engagements"
          size="md"
        />
        <div className="h-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {VALUES.map(([h, p]) => (
            <div key={h} className="bg-white p-7 shadow-editorial-xs">
              <h4 className="font-display uppercase tracking-caps text-[18px] mb-3 text-magenta font-normal">
                {h}
              </h4>
              <p className="text-[14px] leading-[1.65] m-0 text-ink-muted">
                {p}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Équipe */}
      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
        <ChapterTitle
          eyebrow="Équipe"
          title="NOUS"
          italic="Un duo, deux voix, une même exigence"
          size="md"
        />
        <div className="h-8" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 max-w-[900px] mx-auto">
          {[
            {
              n: "Caelya",
              r: "Co-fondatrice · Direction artistique",
              img: "/assets/caelya.webp",
              bio: "Artiste signée et co-fondatrice. Elle défend un label où l'on n'a pas à choisir entre liberté et structure.",
            },
            {
              n: "Allicyone",
              r: "Co-fondatrice · A&R & Production",
              img: "/assets/allicyone.webp",
              bio: "Artiste signée et co-fondatrice. Elle repère, accompagne et produit les voix qui refusent le moule.",
            },
          ].map(({ n, r, img, bio }) => (
            <div key={n}>
              <div
                className="grain aspect-[4/5] mb-4 w-[64%] mx-auto"
                style={{ background: `center/cover no-repeat url(${img})` }}
              />
              <div className="font-display uppercase tracking-display text-[24px]">
                {n}
              </div>
              <div className="italic text-[13px] text-ink-muted mt-1 tracking-[0.04em]">
                {r}
              </div>
              <div className="text-[14px] leading-[1.6] text-ink-muted mt-3 max-w-[380px]">
                {bio}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-bleu-nuit-700 text-beige-sable px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)] text-center">
        <div className="max-w-[640px] mx-auto">
          <Eyebrow inverse className="!text-magenta">
            Vous êtes artiste ?
          </Eyebrow>
          <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3.25rem)] my-3 mb-4.5 font-normal">
            Écrivons-nous.
          </h2>
          <p className="italic text-[17px] leading-[1.55] opacity-85">
            Nous écoutons chaque démo avec attention. Parlez-nous de votre
            démarche, de votre musique, de vos envies.
          </p>
          <div className="mt-7 flex gap-3.5 justify-center flex-wrap">
            <Btn kind="accent" href="/demo">
              Proposer une démo
            </Btn>
            <Btn kind="secondary" href="/contact">
              Nous écrire
            </Btn>
          </div>
        </div>
      </section>
    </div>
  );
}
