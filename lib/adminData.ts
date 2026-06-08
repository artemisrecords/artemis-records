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

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
};

export const TEAM: TeamMember[] = [
  {
    id: "u1",
    name: "Margaux Villeneuve",
    role: "Direction artistique",
    email: "margaux@artemisrecordslabel.com",
  },
  {
    id: "u2",
    name: "Jules Antonin",
    role: "Production & tournées",
    email: "jules@artemisrecordslabel.com",
  },
  {
    id: "u3",
    name: "Inès Rocher",
    role: "Presse & communication",
    email: "ines@artemisrecordslabel.com",
  },
];

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
