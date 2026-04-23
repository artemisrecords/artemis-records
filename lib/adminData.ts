export type DemoStatus = "nouveau" | "ecoute" | "retenu" | "refuse";

export type Demo = {
  id: string;
  artist: string;
  contact: string;
  email: string;
  city: string;
  genre: string;
  received: string;
  duration: string;
  status: DemoStatus;
  pitch: string;
  links: { label: string; href: string }[];
  rating?: number; // 0–5
  tags?: string[];
  assignedTo?: string;
};

export type DemandCategory =
  | "presse"
  | "booking"
  | "partenariat"
  | "licence"
  | "autre";

export type Demand = {
  id: string;
  category: DemandCategory;
  subject: string;
  name: string;
  org?: string;
  email: string;
  phone?: string;
  received: string;
  message: string;
  status: "ouverte" | "en_cours" | "close";
  assignedTo?: string;
};

export type Subscriber = {
  id: string;
  email: string;
  name?: string;
  subscribed: string;
  tags: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
};

export const DEMOS: Demo[] = [
  {
    id: "dm-2041",
    artist: "Naéva Lune",
    contact: "Naéva Lasalle",
    email: "naeva.lune@proton.me",
    city: "Lille",
    genre: "Pop · Dream pop",
    received: "2026-04-21",
    duration: "3 titres · 11 min",
    status: "nouveau",
    pitch:
      "Trois démos écrites en confinement, autour de la maternité et des nuits blanches. Voix feutrée, production maison, arrangements de cordes au clavier.",
    links: [
      { label: "SoundCloud — EP démo", href: "#" },
      { label: "Google Drive — stems", href: "#" },
    ],
    tags: ["feutré", "écriture", "chanson"],
  },
  {
    id: "dm-2040",
    artist: "Marais Rouge",
    contact: "Thaïs R.",
    email: "marais.rouge.musique@gmail.com",
    city: "Nantes",
    genre: "Indie folk",
    received: "2026-04-20",
    duration: "1 titre · 4 min",
    status: "ecoute",
    pitch:
      "Single enregistré en live dans une grange. Guitare acoustique, voix, une fiddle discrète. Cherche un label pour sortir un premier EP à l'automne.",
    links: [{ label: "Bandcamp — Single 'Brume'", href: "#" }],
    rating: 4,
    tags: ["live", "acoustique"],
    assignedTo: "Margaux",
  },
  {
    id: "dm-2039",
    artist: "Isadora",
    contact: "Isadora M.",
    email: "isadora.mus@outlook.fr",
    city: "Marseille",
    genre: "Pop soul",
    received: "2026-04-19",
    duration: "4 titres · 16 min",
    status: "retenu",
    pitch:
      "Projet très abouti, mastering pro. Références évidentes : Clara Luciani, Pomme, Angèle. Cherche un label pour accompagner une tournée des salles moyennes.",
    links: [
      { label: "Spotify — EP 'Pellicule'", href: "#" },
      { label: "YouTube — clip 'Sous la langue'", href: "#" },
      { label: "Press kit PDF", href: "#" },
    ],
    rating: 5,
    tags: ["prio", "rdv", "signature?"],
    assignedTo: "Jules",
  },
  {
    id: "dm-2038",
    artist: "SKR",
    contact: "S. Karimi",
    email: "skr.prod@gmail.com",
    city: "Paris",
    genre: "Rap · Drill",
    received: "2026-04-17",
    duration: "2 titres · 6 min",
    status: "refuse",
    pitch: "Projet hors roster. Répondu cordialement.",
    links: [{ label: "YouTube", href: "#" }],
    tags: ["hors-ligne"],
  },
  {
    id: "dm-2037",
    artist: "Héra Collective",
    contact: "Pauline Arnould",
    email: "hera@collectif.fr",
    city: "Toulouse",
    genre: "Pop expérimentale",
    received: "2026-04-15",
    duration: "5 titres · 22 min",
    status: "ecoute",
    pitch:
      "Collectif de cinq musiciennes. Projet polyphonique, textures étranges. Intéressant, à écouter au calme.",
    links: [{ label: "Bandcamp", href: "#" }, { label: "IG", href: "#" }],
    rating: 3,
    tags: ["à écouter", "curieux"],
  },
  {
    id: "dm-2036",
    artist: "Valentin Loyer",
    contact: "V. Loyer",
    email: "valentin.l@icloud.com",
    city: "Rennes",
    genre: "Folk",
    received: "2026-04-14",
    duration: "3 titres · 14 min",
    status: "nouveau",
    pitch:
      "Voix claire, textes littéraires. Demande un retour critique plutôt qu'une signature. Mention d'une lecture publique au printemps.",
    links: [{ label: "Lien WeTransfer (expire 24 avril)", href: "#" }],
  },
  {
    id: "dm-2035",
    artist: "Orée",
    contact: "Nadia P.",
    email: "oree.music@gmail.com",
    city: "Lausanne",
    genre: "Indie pop",
    received: "2026-04-12",
    duration: "2 titres · 7 min",
    status: "nouveau",
    pitch:
      "Projet jeune (20 ans), en cours d'écriture. Envoie deux maquettes home-studio.",
    links: [{ label: "SoundCloud", href: "#" }],
  },
];

export const DEMANDS: Demand[] = [
  {
    id: "rq-1089",
    category: "presse",
    subject: "Interview Allicyone — Les Inrocks",
    name: "Léa Bertrand",
    org: "Les Inrockuptibles",
    email: "l.bertrand@lesinrocks.com",
    phone: "06 12 34 56 78",
    received: "2026-04-22",
    message:
      "Bonjour, je prépare un papier sur la nouvelle scène féminine française et j'aimerais rencontrer Allicyone autour de la sortie d'Alice. Disponible la première semaine de mai sur Paris.",
    status: "ouverte",
  },
  {
    id: "rq-1088",
    category: "booking",
    subject: "Programmation festival — Printemps de Bourges 2027",
    name: "Youssef Haddad",
    org: "Printemps de Bourges",
    email: "programmation@printemps-bourges.com",
    received: "2026-04-22",
    message:
      "Intéressés par Caëlya pour la scène découvertes 2027. Pouvons-nous caler un appel la semaine prochaine ?",
    status: "en_cours",
    assignedTo: "Margaux",
  },
  {
    id: "rq-1087",
    category: "partenariat",
    subject: "Collab capsule — Maison Cler",
    name: "Éloïse Ménard",
    org: "Maison Cler",
    email: "eloise@maison-cler.fr",
    received: "2026-04-20",
    message:
      "Nous aimons beaucoup la direction artistique du label et aimerions vous proposer une collaboration — édition limitée et playlist curatée pour notre lancement d'automne.",
    status: "ouverte",
  },
  {
    id: "rq-1086",
    category: "licence",
    subject: "Synchro — Arte documentaire",
    name: "Samuel Kiefer",
    org: "Arte France",
    email: "s.kiefer@arte.tv",
    received: "2026-04-18",
    message:
      "Nous recherchons un morceau instrumental pour un documentaire consacré aux rivières oubliées. 'Les Ruisseaux' correspondrait parfaitement. Budget synchro disponible.",
    status: "en_cours",
    assignedTo: "Jules",
  },
  {
    id: "rq-1085",
    category: "presse",
    subject: "Portrait label — Libération",
    name: "Clémentine Rey",
    org: "Libération",
    email: "c.rey@liberation.fr",
    received: "2026-04-16",
    message:
      "Portrait pour la rubrique culture — focus sur les labels indépendants qui émergent hors des circuits majors.",
    status: "close",
    assignedTo: "Margaux",
  },
  {
    id: "rq-1084",
    category: "autre",
    subject: "Candidature stage production",
    name: "Arthur Lemoine",
    email: "arthur.lemoine.pro@gmail.com",
    received: "2026-04-15",
    message:
      "Étudiant en M2 management culturel, je recherche un stage de 6 mois à partir de septembre dans votre équipe.",
    status: "ouverte",
  },
  {
    id: "rq-1083",
    category: "booking",
    subject: "Première partie — Tournée Pomme 2027",
    name: "Salomé G.",
    org: "Asterios",
    email: "salome@asterios.fr",
    received: "2026-04-12",
    message:
      "Nous cherchons une première partie féminine pour les dates françaises de Pomme en 2027. Allicyone nous semble parfaite.",
    status: "close",
    assignedTo: "Jules",
  },
];

export const SUBSCRIBERS: Subscriber[] = [
  {
    id: "s1",
    email: "alice.bernard@gmail.com",
    name: "Alice Bernard",
    subscribed: "2026-04-14",
    tags: ["newsletter", "concerts"],
  },
  {
    id: "s2",
    email: "j.petit@wanadoo.fr",
    name: "Julien Petit",
    subscribed: "2026-04-10",
    tags: ["newsletter"],
  },
  {
    id: "s3",
    email: "camille@ableton.fr",
    subscribed: "2026-04-05",
    tags: ["newsletter", "pro"],
  },
  {
    id: "s4",
    email: "m.dubois@hotmail.com",
    name: "Marine Dubois",
    subscribed: "2026-03-29",
    tags: ["newsletter", "sorties"],
  },
];

export const TEAM: TeamMember[] = [
  {
    id: "u1",
    name: "Margaux Villeneuve",
    role: "Direction artistique",
    email: "margaux@artemis-records.fr",
  },
  {
    id: "u2",
    name: "Jules Antonin",
    role: "Production & tournées",
    email: "jules@artemis-records.fr",
  },
  {
    id: "u3",
    name: "Inès Rocher",
    role: "Presse & communication",
    email: "ines@artemis-records.fr",
  },
];

export const DEMO_STATUS_LABEL: Record<DemoStatus, string> = {
  nouveau: "Nouveau",
  ecoute: "À écouter",
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
