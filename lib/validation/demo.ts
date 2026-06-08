import { z } from "zod";

// Validations regex maison pour rester indépendant des variations d'API
// email()/url() entre versions de zod.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URL_RE = /^https?:\/\/.+/i;

export const demoSubmissionSchema = z.object({
  artist: z.string().trim().min(1, "Indiquez votre nom d'artiste."),
  contact: z.string().trim().min(1, "Indiquez votre nom civil."),
  email: z
    .string()
    .trim()
    .min(1, "Indiquez votre courriel.")
    .refine((v) => EMAIL_RE.test(v), "Courriel invalide."),
  listenUrl: z
    .string()
    .trim()
    .min(1, "Indiquez un lien d'écoute.")
    .refine((v) => URL_RE.test(v), "Lien d'écoute invalide (commencez par http…)."),
  socials: z.string().trim().optional().default(""),
  pitch: z.string().trim().optional().default(""),
});

export type DemoSubmission = z.infer<typeof demoSubmissionSchema>;
