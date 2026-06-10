import type { demos, demands, subscribers } from "./db/schema";

export type DemoStatus = "nouveau" | "retenu" | "refuse";
export type DemandCategory =
  | "presse"
  | "booking"
  | "partenariat"
  | "licence"
  | "autre";

export type Demo = typeof demos.$inferSelect;
export type Demand = typeof demands.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;

export const DEMO_STATUS_LABEL: Record<DemoStatus, string> = {
  nouveau: "Nouveau",
  retenu: "Retenu",
  refuse: "Refusé",
};

export const DEMAND_CATEGORY_LABEL: Record<DemandCategory, string> = {
  presse: "Presse",
  booking: "Booking",
  partenariat: "Partenariat",
  licence: "Synchro / Licence",
  autre: "Autre",
};

export const DEMAND_STATUS_LABEL = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  close: "Close",
} as const;
