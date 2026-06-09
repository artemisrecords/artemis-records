import { z } from "zod";

// Cohérent avec lib/validation/artist.ts / news.ts.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const CONTRACT_STATUSES = ["en_cours", "a_signer", "echu", "archive"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const contractStatusSchema = z.enum(CONTRACT_STATUSES);

const date = z.string().trim().refine((v) => DATE_RE.test(v), "Date au format AAAA-MM-JJ.");

// Champ texte facultatif rattaché à un artiste : "" est traité comme « aucun ».
const optionalArtistId = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const baseContract = {
  title: z.string().trim().min(1, "Le titre est requis.").max(160),
  party: z.string().trim().min(1, "La partie est requise.").max(120),
  artistId: optionalArtistId,
  type: z.string().trim().min(1, "Le type est requis.").max(120),
  startDate: date,
  endDate: date,
  amount: z.string().trim().max(60).optional().default(""),
  status: contractStatusSchema.optional().default("a_signer"),
  notes: z.string().trim().max(4000).optional().default(""),
  signedBy: z.array(z.string().trim().min(1)).optional().default([]),
};

const endsAfterStart = (d: { startDate: string; endDate: string }) => d.endDate >= d.startDate;
const endsAfterStartMsg = {
  message: "La date de fin doit être postérieure ou égale au début.",
  path: ["endDate"],
};

export const createContractSchema = z.object(baseContract).refine(endsAfterStart, endsAfterStartMsg);
export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = z.object(baseContract).refine(endsAfterStart, endsAfterStartMsg);
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
