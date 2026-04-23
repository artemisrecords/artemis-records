export type Embed = {
  type: "spotify" | "youtube";
  title: string;
  src: string;
};

export type DiscoItem = {
  id: string;
  kind: string;
  title: string;
  year: string;
  cover: string;
  note?: string;
};

export type Show = {
  id: string;
  date: string;
  city: string;
  venue: string;
  status?: string;
  free?: boolean;
  ticketUrl?: string;
};

export type Artist = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  genre: string;
  signed: string;
  published: boolean;
  portrait: string;
  cover: string;
  primaryColor?: string;
  quote?: string;
  bioShort: string;
  bioLong: string;
  genres: string[];
  socials: Record<string, string>;
  embeds: Embed[];
  discography: DiscoItem[];
  shows: Show[];
  gallery: string[];
};

export type NewsItem = {
  id: string;
  published: boolean;
  date: string;
  category: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
};

export const ARTISTS: Artist[] = [
  {
    id: "caelya",
    name: "Caëlya",
    slug: "caelya",
    tagline: "Folk mythologique — écritures boisées",
    genre: "Folk · Pop onirique",
    signed: "2025",
    published: true,
    portrait: "/assets/caelya.webp",
    cover: "/assets/caelya.webp",
    primaryColor: "#7800a8",
    quote: "J'écris en marchant dans les forêts qui n'existent plus.",
    bioShort:
      "Caëlya puise dans les mythes et la nature une pop folk sobre, portée par une voix feutrée.",
    bioLong: `Caëlya rejoint ARTémis Records en 2025 avec un premier EP en préparation, *Les Ruisseaux*. Ses chansons, écrites en français, convoquent les figures féminines de la mythologie — Artémis, bien sûr, mais aussi Diane, Écho, les nymphes — pour raconter des histoires d'aujourd'hui. La production, volontairement dépouillée, laisse respirer la voix et les textes.

Formée au conservatoire de Cergy, elle écrit depuis l'adolescence et se produit régulièrement en solo sur la scène francilienne. Un premier single, *Lune de cendre*, est attendu pour l'automne.`,
    genres: ["Folk", "Pop française", "Chanson"],
    socials: {
      instagram: "https://instagram.com",
      youtube: "https://youtube.com",
      tiktok: "https://tiktok.com",
      spotify: "https://spotify.com",
      bandcamp: "https://bandcamp.com",
    },
    embeds: [
      {
        type: "spotify",
        title: "Lune de cendre (extrait)",
        src: "https://open.spotify.com/embed/track/3n3Ppam7vgaVa1iaRUc9Lp",
      },
      {
        type: "youtube",
        title: "Session acoustique — forêt de Marly",
        src: "https://www.youtube.com/embed/jNQXAC9IVRw",
      },
    ],
    discography: [
      {
        id: "d1",
        kind: "Single",
        title: "Lune de cendre",
        year: "2025",
        cover:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
      },
      {
        id: "d2",
        kind: "EP",
        title: "Les Ruisseaux",
        year: "2026",
        cover:
          "https://images.unsplash.com/photo-1502236317378-f5d8b74cca6d?w=600&q=80",
        note: "À venir · automne 2026",
      },
    ],
    shows: [
      {
        id: "s1",
        date: "2026-05-18",
        city: "Paris",
        venue: "Le Pop-Up du Label",
        status: "Complet",
      },
      {
        id: "s2",
        date: "2026-06-02",
        city: "Lyon",
        venue: "Le Sonic",
        status: "Billetterie ouverte",
      },
      {
        id: "s3",
        date: "2026-06-21",
        city: "Cergy",
        venue: "Fête de la musique",
        status: "Gratuit",
        free: true,
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
      "https://images.unsplash.com/photo-1514533212735-5df27d970db0?w=900&q=80",
      "https://images.unsplash.com/photo-1499415479124-43c32433a620?w=900&q=80",
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=900&q=80",
    ],
  },
  {
    id: "allicyone",
    name: "Allicyone",
    slug: "allicyone",
    tagline: "Pop française — voix intime, production chaleureuse",
    genre: "Pop française · Soul",
    signed: "2024",
    published: true,
    portrait: "/assets/allicyone.webp",
    cover: "/assets/allicyone.webp",
    primaryColor: "#a87848",
    quote:
      "J'écris ce que je n'ai pas réussi à dire — et je le chante pour l'entendre enfin.",
    bioShort:
      "Allicyone écrit une pop française feutrée, à la croisée de la soul et de la chanson à texte.",
    bioLong: `Allicyone rejoint ARTémis Records en 2024 avec *Confidences*, un premier EP de sept titres. Les textes — littéraires, sans fard — racontent les liens, les doutes, la reconstruction. La production, signée au studio ARTémis, mêle piano acoustique, nappes synthétiques et arrangements de cordes discrets.

Le clip d'*Alice*, premier extrait de son prochain projet, marque une nouvelle direction : plus affirmée, plus lumineuse. Allicyone prépare une tournée des petites salles à l'automne 2026.`,
    genres: ["Pop française", "Soul", "Chanson"],
    socials: {
      instagram: "https://instagram.com",
      youtube: "https://youtube.com",
      tiktok: "https://tiktok.com",
      spotify: "https://spotify.com",
      facebook: "https://facebook.com",
    },
    embeds: [
      {
        type: "spotify",
        title: "Alice",
        src: "https://open.spotify.com/embed/track/6rqhFgbbKwnb9MLmUQDhG6",
      },
      {
        type: "youtube",
        title: "Alice — clip officiel",
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        type: "spotify",
        title: "Confidences (EP)",
        src: "https://open.spotify.com/embed/album/0JGOiO34nwfUdDrD612dOp",
      },
    ],
    discography: [
      {
        id: "d1",
        kind: "EP",
        title: "Confidences",
        year: "2024",
        cover:
          "https://images.unsplash.com/photo-1446057032654-9d8885db76c6?w=600&q=80",
      },
      {
        id: "d2",
        kind: "Single",
        title: "Alice",
        year: "2026",
        cover:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
      },
      {
        id: "d3",
        kind: "Clip",
        title: "Alice (vidéo)",
        year: "2026",
        cover:
          "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80",
      },
    ],
    shows: [
      {
        id: "s1",
        date: "2026-05-14",
        city: "Paris",
        venue: "Les Étoiles",
        status: "Quelques places",
      },
      {
        id: "s2",
        date: "2026-05-28",
        city: "Bordeaux",
        venue: "Rock School Barbey",
        status: "Billetterie ouverte",
      },
      {
        id: "s3",
        date: "2026-09-10",
        city: "Bruxelles",
        venue: "Botanique",
        status: "Annoncé",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80",
      "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=900&q=80",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&q=80",
      "https://images.unsplash.com/photo-1501612780327-45045538702b?w=900&q=80",
    ],
  },
];

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    published: true,
    date: "2026-04-02",
    category: "Sortie",
    title: "Alice — le clip dévoilé",
    excerpt:
      "Premier extrait du nouveau projet d'Allicyone, *Alice* pose la direction d'un deuxième EP plus lumineux.",
    body: "Texte complet à venir…",
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1400&q=80",
  },
  {
    id: "n2",
    published: true,
    date: "2026-03-18",
    category: "Signature",
    title: "Caëlya rejoint le label",
    excerpt:
      "Nous accueillons Caëlya, dont la pop folk mythologique trouve naturellement sa place chez ARTémis.",
    body: "Texte complet à venir…",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400&q=80",
  },
  {
    id: "n3",
    published: true,
    date: "2026-02-10",
    category: "Label",
    title: "Un an d'ARTémis — bilan en sept images",
    excerpt:
      "Retour sur la première année d'activité du label — signatures, scènes, studio, rencontres.",
    body: "Texte complet à venir…",
    image:
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1400&q=80",
  },
];

export const findArtist = (id: string) =>
  ARTISTS.find((a) => a.id === id || a.slug === id);

export const findNews = (id: string) => NEWS.find((n) => n.id === id);

export const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};
