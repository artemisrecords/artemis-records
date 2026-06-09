import { z } from "zod";

// Regex maison, cohérent avec lib/validation/demo.ts (indépendant des variations
// d'API url()/email() entre versions de Zod).
const URL_RE = /^https?:\/\/[^\s]+/i;
const HEX_RE = /^#?[0-9a-fA-F]{3,8}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const url = z.string().trim().refine((v) => URL_RE.test(v), "URL invalide (commencez par http…).");
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((v) => v === "" || URL_RE.test(v), "URL invalide.");

export const identitySchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  tagline: z.string().trim().default(""),
  genre: z.string().trim().default(""),
  signedYear: z.string().trim().default(""),
  primaryColor: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || HEX_RE.test(v), "Couleur hex invalide (ex. #cc2244)."),
  quote: z.string().trim().optional().default(""),
  genres: z.array(z.string().trim().min(1)).default([]),
});
export type IdentityInput = z.infer<typeof identitySchema>;

export const bioSchema = z.object({
  bioShort: z.string().trim().max(280, "La bio courte doit faire 280 caractères max.").default(""),
  bioLong: z.string().trim().default(""),
});
export type BioInput = z.infer<typeof bioSchema>;

export const discoItemSchema = z.object({
  id: z.string().min(1),
  kind: z.string().trim().min(1, "Type requis."),
  title: z.string().trim().min(1, "Titre requis."),
  year: z.string().trim().min(1, "Année requise."),
  cover: url,
  note: z.string().trim().optional().default(""),
});
export const discographySchema = z.array(discoItemSchema);

export const showSchema = z.object({
  date: z.string().trim().refine((v) => DATE_RE.test(v), "Date au format AAAA-MM-JJ."),
  city: z.string().trim().min(1, "Ville requise."),
  venue: z.string().trim().min(1, "Lieu requis."),
  status: z.string().trim().optional().default(""),
  free: z.boolean().default(false),
  ticketUrl: optionalUrl,
});
export type ShowInput = z.infer<typeof showSchema>;

export const embedSchema = z.object({
  type: z.enum(["spotify", "youtube"]),
  title: z.string().trim().min(1, "Titre requis."),
  src: url,
});
export const embedsSchema = z.array(embedSchema);

export const socialsSchema = z.record(
  z.string().trim().min(1),
  z.string().trim().refine((v) => v === "" || URL_RE.test(v), "URL invalide."),
);

export const createArtistSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  slug: z.string().trim().optional().default(""),
  tagline: z.string().trim().optional().default(""),
  genre: z.string().trim().optional().default(""),
  signedYear: z.string().trim().optional().default(""),
  bioShort: z.string().trim().max(280).optional().default(""),
});
export type CreateArtistInput = z.infer<typeof createArtistSchema>;
