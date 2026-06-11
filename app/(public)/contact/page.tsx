import { ChapterTitle, Eyebrow } from "@/components/Primitives";
import { InfoRow } from "@/components/FormFields";
import { getLabelSettings, LABEL_DEFAULTS } from "@/lib/db/queries";
import { addressLines } from "@/lib/address";
import { ContactForm } from "./ContactForm";

export default async function ContactPage() {
  const label = await getLabelSettings().catch(() => LABEL_DEFAULTS);

  return (
    <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
      <ChapterTitle
        eyebrow="2026 · Écrivons-nous"
        title="CONTACT"
        italic="Restons en contact"
      />
      <div className="h-12" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-16">
        <ContactForm />

        <aside>
          <Eyebrow>Le label</Eyebrow>
          <div className="mt-5.5 font-serif text-[15px] leading-[1.9]">
            {label.phones.length > 0 && (
              <InfoRow
                label="Téléphone"
                value={label.phones.map((phone) => (
                  <div key={phone}>{phone}</div>
                ))}
              />
            )}
            {label.emails.length > 0 && (
              <InfoRow
                label="Courriel"
                value={label.emails.map((email) => (
                  <div key={email}>{email}</div>
                ))}
              />
            )}
            {label.address && (
              <InfoRow
                label="Adresse"
                value={addressLines(label.address).map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              />
            )}
          </div>
          <div className="mt-10">
            <Eyebrow>Nous suivre</Eyebrow>
            <div className="flex gap-2.5 flex-wrap mt-3.5">
              {["Instagram", "YouTube", "TikTok", "Facebook"].map((s) => (
                <span
                  key={s}
                  className="font-serif text-[11px] tracking-[0.2em] uppercase font-bold px-4 py-2.5 border border-ink/30 rounded-full cursor-pointer hover:border-ink/60"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
