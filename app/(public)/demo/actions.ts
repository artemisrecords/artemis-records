"use server";

import { demoSubmissionSchema } from "@/lib/validation/demo";
import { insertDemo } from "@/lib/db/demo-mutations";
import { getLabelNotifyEmail } from "@/lib/db/queries";
import { sendEmail } from "@/lib/email";
import { demoReceiptArtist, demoNewLabel } from "@/lib/demoEmails";
import type { DemoLink } from "@/lib/db/schema";

export type DemoFormState = {
  ok?: boolean;
  errors?: Record<string, string>;
} | null;

function baseUrl() {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export async function submitDemo(
  _prev: DemoFormState,
  formData: FormData,
): Promise<DemoFormState> {
  const raw = {
    artist: String(formData.get("artist") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    email: String(formData.get("email") ?? ""),
    listenUrl: String(formData.get("listenUrl") ?? ""),
    socials: String(formData.get("socials") ?? ""),
    pitch: String(formData.get("pitch") ?? ""),
  };

  const parsed = demoSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
    }
    return { errors };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const links: DemoLink[] = [{ label: "Lien d'écoute", href: data.listenUrl }];
  if (data.socials) links.push({ label: "Réseaux sociaux", href: data.socials });

  // Source de vérité : l'insertion. Si elle échoue, on laisse remonter.
  await insertDemo({
    artist: data.artist,
    contact: data.contact,
    email,
    pitch: data.pitch,
    links,
  });

  // Mails best-effort : un échec ne doit jamais perdre la démo.
  try {
    await sendEmail({ to: email, ...demoReceiptArtist(data.artist) });
  } catch (e) {
    console.warn("[demo] accusé réception échoué:", (e as Error).message);
  }

  try {
    const labelTo = await getLabelNotifyEmail();
    await sendEmail({
      to: labelTo,
      ...demoNewLabel({
        artist: data.artist,
        contact: data.contact,
        email,
        backofficeUrl: `${baseUrl()}/backoffice/demos`,
      }),
    });
  } catch (e) {
    console.warn("[demo] notif label échouée:", (e as Error).message);
  }

  return { ok: true };
}
