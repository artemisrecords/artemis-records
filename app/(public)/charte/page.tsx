import {
  BowMark,
  Btn,
  ChapterTitle,
  Eyebrow,
  Wordmark,
} from "@/components/Primitives";

const COLORS = [
  ["Bleu nuit", "#1C1F4A", "#EDE0D4"],
  ["Beige sable", "#EDE0D4", "#1C1F4A"],
  ["Taupe clair", "#8D7B68", "#fff"],
  ["Vert forêt", "#23340F", "#EDE0D4"],
  ["Magenta arc", "#9F2063", "#fff"],
] as const;

export default function ChartePage() {
  return (
    <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
      <ChapterTitle
        eyebrow="Identité visuelle · 2025"
        title="CHARTE GRAPHIQUE"
        italic="Écrivons notre passion"
      />
      <div className="h-12" />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
        <div>
          <Eyebrow>Logo</Eyebrow>
          <div className="mt-3.5 p-10 bg-beige-sable text-center">
            <Wordmark size={34} />
          </div>
          <div className="mt-3 p-10 bg-bleu-nuit-700 text-center">
            <Wordmark size={34} inverse />
          </div>
          <div className="mt-3 p-10 bg-beige-sable text-center">
            <BowMark size={80} />
          </div>
        </div>

        <div>
          <Eyebrow>Couleurs</Eyebrow>
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            {COLORS.map(([n, h, fg]) => (
              <div
                key={n}
                className="min-h-[100px] px-4 py-5.5 flex flex-col justify-between"
                style={{ background: h, color: fg }}
              >
                <div className="text-[10px] tracking-eyebrow uppercase font-bold">
                  {n}
                </div>
                <div className="font-display text-[18px] tracking-display">
                  {h}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Eyebrow>Typographies</Eyebrow>
          <div className="mt-3.5 bg-wash-soft px-6 py-7">
            <div className="text-[11px] tracking-eyebrow uppercase text-ink-subtle font-bold">
              Display · Catchy Mager
            </div>
            <div className="font-display uppercase tracking-display text-[56px] leading-none mt-2.5 mb-1.5">
              ARTÉMIS
            </div>
            <div className="text-[11px] italic text-ink-muted">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ — 0123456789
            </div>
            <div className="h-6" />
            <div className="text-[11px] tracking-eyebrow uppercase text-ink-subtle font-bold">
              Texte · Libre Baskerville
            </div>
            <div className="italic text-[22px] leading-[1.4] mt-2.5 mb-1.5">
              Viser la lune, retomber dans les étoiles.
            </div>
            <div className="text-[14px] leading-[1.7]">
              Le label accompagne les artistes émergents dans le respect de leur
              travail.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Btn kind="ghost" href="/about">
          Lire le manifeste
        </Btn>
      </div>
    </section>
  );
}
