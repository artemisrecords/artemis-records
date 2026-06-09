import { z } from "zod";

// Cohérent avec lib/validation/artist.ts.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const newsSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis."),
  excerpt: z.string().trim().optional().default(""),
  body: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  date: z.string().trim().refine((v) => DATE_RE.test(v), "Date au format AAAA-MM-JJ."),
});
export type NewsInput = z.infer<typeof newsSchema>;

export const createNewsSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis."),
  slug: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  date: z.string().trim().optional().default(""),
});
export type CreateNewsInput = z.infer<typeof createNewsSchema>;
