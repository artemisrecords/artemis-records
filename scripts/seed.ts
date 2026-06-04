import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { put } from "@vercel/blob";
import { db } from "../lib/db/index";
import {
  artists,
  artistShows,
  news,
  demos,
  demands,
  subscribers,
  settings,
  user,
} from "../lib/db/schema";

type SeedArtist = {
  id: string;
  name: string;
  tagline: string;
  genre: string;
  signedYear: string;
  published: boolean;
  portrait: string;
  cover: string;
  primaryColor?: string;
  quote?: string;
  bioShort: string;
  bioLong: string;
  newsletterUrl?: string;
  genres: string[];
  socials: Record<string, string>;
  embeds: { type: "spotify" | "youtube"; title: string; src: string }[];
  discography: {
    id: string;
    kind: string;
    title: string;
    year: string;
    cover: string;
    note?: string;
  }[];
  shows: {
    id: string;
    date: string;
    city: string;
    venue: string;
    status?: string;
    free?: boolean;
    ticketUrl?: string;
  }[];
  gallery: string[];
};

const SEED_ARTISTS: SeedArtist[] = [
  {
    id: "caelya",
    name: "Caëlya",
    tagline: "Folk mythologique, écritures boisées",
    genre: "Folk · Pop onirique",
    signedYear: "2025",
    published: true,
    portrait: "/assets/caelya.webp",
    cover: "/assets/caelya.webp",
    primaryColor: "#7800a8",
    // TODO quote/bioShort/bioLong/tagline/genre/shows : encore fictifs, à remplacer par les vrais textes + dates du label
    quote: "J'écris en marchant dans les forêts qui n'existent plus.",
    bioShort:
      "Caëlya puise dans les mythes et la nature une pop folk sobre, portée par une voix feutrée.",
    bioLong: `Caëlya rejoint ARTémis Records en 2025 avec un premier EP en préparation, *Les Ruisseaux*. Ses chansons, écrites en français, convoquent les figures féminines de la mythologie (Artémis, bien sûr, mais aussi Diane, Écho, les nymphes) pour raconter des histoires d'aujourd'hui. La production, volontairement dépouillée, laisse respirer la voix et les textes.

Formée au conservatoire de Cergy, elle écrit depuis l'adolescence et se produit régulièrement en solo sur la scène francilienne. Un premier single, *Lune de cendre*, est attendu pour l'automne.`,
    newsletterUrl: "https://get.formulaire.info/form?p=E9FbbpNa",
    genres: ["Folk", "Pop française", "Chanson"],
    socials: {
      instagram: "https://instagram.com/caelya_off",
      youtube: "https://www.youtube.com/@CA%C3%8BLYAofficial",
      tiktok: "https://www.tiktok.com/@caelya_off",
      spotify: "https://open.spotify.com/artist/5ZHk2e2L8PPuJKLuMKPItp",
      facebook: "https://www.facebook.com/people/Caëlya/61572844830789",
      patreon: "https://patreon.com/caelya",
    },
    embeds: [
      {
        type: "spotify",
        title: "SOUVENIRS (EP)",
        src: "https://open.spotify.com/embed/album/668VWNUYAvVY6tKggLNDh8",
      },
      {
        type: "youtube",
        title: "Lune Calme · Clip officiel",
        src: "https://www.youtube.com/embed/xw0BKRUgV78",
      },
    ],
    // TODO années à confirmer (Spotify ne renvoie pas les dates de sortie)
    discography: [
      {
        id: "d1",
        kind: "EP",
        title: "SOUVENIRS",
        year: "2025",
        cover:
          "https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b2736f3d64f289829aef5a5eb12e",
      },
      {
        id: "d2",
        kind: "Single",
        title: "STAR",
        year: "2025",
        cover:
          "https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b273df2ac6f2b028e48946629db4",
      },
      {
        id: "d3",
        kind: "Single",
        title: "Saison de la mer",
        year: "2026",
        cover:
          "https://images.unsplash.com/photo-1502236317378-f5d8b74cca6d?w=600&q=80",
        note: "À venir",
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
    tagline: "Pop française, voix intime, production chaleureuse",
    genre: "Pop française · Soul",
    signedYear: "2024",
    published: true,
    portrait: "/assets/allicyone.webp",
    cover: "/assets/allicyone.webp",
    primaryColor: "#a87848",
    // TODO quote/bioShort/bioLong/tagline/genre/shows : encore fictifs, à remplacer par les vrais textes + dates du label
    quote:
      "J'écris ce que je n'ai pas réussi à dire, et je le chante pour l'entendre enfin.",
    bioShort:
      "Allicyone écrit une pop française feutrée, à la croisée de la soul et de la chanson à texte.",
    bioLong: `Allicyone rejoint ARTémis Records en 2024 avec *Confidences*, un premier EP de sept titres. Les textes (littéraires, sans fard) racontent les liens, les doutes, la reconstruction. La production, signée au studio ARTémis, mêle piano acoustique, nappes synthétiques et arrangements de cordes discrets.

Le clip d'*Alice*, premier extrait de son prochain projet, marque une nouvelle direction : plus affirmée, plus lumineuse. Allicyone prépare une tournée des petites salles à l'automne 2026.`,
    newsletterUrl: "https://get.formulaire.info/form?p=k5DLu77P",
    genres: ["Pop française", "Soul", "Chanson"],
    socials: {
      instagram: "https://instagram.com/allicyone",
      youtube: "https://www.youtube.com/@Allicyone",
      tiktok: "https://www.tiktok.com/@allicyone",
      spotify: "https://open.spotify.com/artist/285mwpEqyCKT0Y3liIdR0q",
      facebook: "https://www.facebook.com/profile.php?id=61575923956280",
    },
    embeds: [
      {
        type: "spotify",
        title: "Alice",
        src: "https://open.spotify.com/embed/track/19pmxKlRw5FnuRNX3mXrZ7",
      },
      {
        type: "youtube",
        title: "Alice · clip officiel",
        src: "https://www.youtube.com/embed/QVJS9At8xAQ",
      },
      {
        type: "spotify",
        title: "Confidences (EP)",
        src: "https://open.spotify.com/embed/album/2f9jCzjKwm8GqhVyqn13fo",
      },
    ],
    // TODO années à confirmer (Spotify ne renvoie pas les dates de sortie)
    discography: [
      {
        id: "d1",
        kind: "EP",
        title: "Confidences",
        year: "2025",
        cover:
          "https://image-cdn-fa.spotifycdn.com/image/ab67616d0000b273566958766c59c307374747f7",
      },
      {
        id: "d2",
        kind: "Single",
        title: "Yokohama",
        year: "2025",
        cover:
          "https://image-cdn-fa.spotifycdn.com/image/ab67616d0000b273a74ffa4668838da60ccb5bce",
      },
      {
        id: "d3",
        kind: "Single",
        title: "Sad Kid",
        year: "2025",
        cover:
          "https://image-cdn-fa.spotifycdn.com/image/ab67616d0000b27364ab43028b08b6adb02d490e",
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

const SEED_NEWS = [
  {
    id: "n1",
    published: true,
    date: "2026-04-02",
    category: "Sortie",
    title: "Alice : le clip dévoilé",
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
    title: "Un an d'ARTémis : bilan en sept images",
    excerpt:
      "Retour sur la première année d'activité du label : signatures, scènes, studio, rencontres.",
    body: "Texte complet à venir…",
    image:
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1400&q=80",
  },
];

const SEED_DEMOS = [
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
      { label: "SoundCloud · EP démo", href: "#" },
      { label: "Google Drive · stems", href: "#" },
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
    links: [{ label: "Bandcamp · Single 'Brume'", href: "#" }],
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
      { label: "Spotify · EP 'Pellicule'", href: "#" },
      { label: "YouTube · clip 'Sous la langue'", href: "#" },
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
    links: [
      { label: "Bandcamp", href: "#" },
      { label: "IG", href: "#" },
    ],
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

const SEED_DEMANDS = [
  {
    id: "rq-1089",
    category: "presse",
    subject: "Interview Allicyone · Les Inrocks",
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
    subject: "Programmation festival · Printemps de Bourges 2027",
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
    subject: "Collab capsule · Maison Cler",
    name: "Éloïse Ménard",
    org: "Maison Cler",
    email: "eloise@maison-cler.fr",
    received: "2026-04-20",
    message:
      "Nous aimons beaucoup la direction artistique du label et aimerions vous proposer une collaboration : édition limitée et playlist curatée pour notre lancement d'automne.",
    status: "ouverte",
  },
  {
    id: "rq-1086",
    category: "licence",
    subject: "Synchro · Arte documentaire",
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
    subject: "Portrait label · Libération",
    name: "Clémentine Rey",
    org: "Libération",
    email: "c.rey@liberation.fr",
    received: "2026-04-16",
    message:
      "Portrait pour la rubrique culture : focus sur les labels indépendants qui émergent hors des circuits majors.",
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
    subject: "Première partie · Tournée Pomme 2027",
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

const SEED_SUBSCRIBERS = [
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

const SEED_SETTINGS = [
  {
    key: "newsletter_signup_url",
    value: "https://artemisrecords.substack.com/subscribe",
  },
  { key: "newsletter_dashboard_url", value: "https://substack.com/home" },
];

const uploadCache = new Map<string, string>();

async function uploadLocalAsset(localPath: string, blobPath: string): Promise<string> {
  const cached = uploadCache.get(localPath);
  if (cached) return cached;
  const abs = resolve(process.cwd(), "public" + localPath);
  const buf = await readFile(abs);
  const result = await put(blobPath, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
    allowOverwrite: true,
  });
  uploadCache.set(localPath, result.url);
  return result.url;
}

async function mapUrl(u: string, blobPath: string): Promise<string> {
  if (u.startsWith("/assets/")) {
    return uploadLocalAsset(u, blobPath);
  }
  return u;
}

async function main() {
  console.log("▸ Uploading assets + seeding artists…");
  for (const a of SEED_ARTISTS) {
    const portraitUrl = await mapUrl(a.portrait, `artists/${a.id}/portrait.webp`);
    const coverUrl = await mapUrl(a.cover, `artists/${a.id}/cover.webp`);
    const gallery = await Promise.all(
      a.gallery.map((g, i) => mapUrl(g, `artists/${a.id}/gallery/${i}.webp`)),
    );
    const discography = await Promise.all(
      a.discography.map(async (d) => ({
        ...d,
        cover: await mapUrl(d.cover, `artists/${a.id}/discography/${d.id}.webp`),
      })),
    );

    await db
      .insert(artists)
      .values({
        id: a.id,
        name: a.name,
        tagline: a.tagline,
        genre: a.genre,
        signedYear: a.signedYear,
        published: a.published,
        portraitUrl,
        coverUrl,
        primaryColor: a.primaryColor,
        quote: a.quote,
        bioShort: a.bioShort,
        bioLong: a.bioLong,
        newsletterUrl: a.newsletterUrl,
        genres: a.genres,
        socials: a.socials,
        embeds: a.embeds,
        discography,
        gallery,
      })
      .onConflictDoUpdate({
        target: artists.id,
        set: {
          name: a.name,
          tagline: a.tagline,
          genre: a.genre,
          signedYear: a.signedYear,
          published: a.published,
          portraitUrl,
          coverUrl,
          primaryColor: a.primaryColor,
          quote: a.quote,
          bioShort: a.bioShort,
          bioLong: a.bioLong,
          newsletterUrl: a.newsletterUrl,
          genres: a.genres,
          socials: a.socials,
          embeds: a.embeds,
          discography,
          gallery,
          updatedAt: new Date(),
        },
      });

    for (const s of a.shows) {
      await db
        .insert(artistShows)
        .values({
          id: `${a.id}-${s.id}`,
          artistId: a.id,
          date: s.date,
          city: s.city,
          venue: s.venue,
          status: s.status,
          free: s.free ?? false,
          ticketUrl: s.ticketUrl,
        })
        .onConflictDoUpdate({
          target: artistShows.id,
          set: {
            date: s.date,
            city: s.city,
            venue: s.venue,
            status: s.status,
            free: s.free ?? false,
            ticketUrl: s.ticketUrl,
          },
        });
    }
  }

  console.log("▸ Seeding news…");
  for (const n of SEED_NEWS) {
    const imageUrl = await mapUrl(n.image, `news/${n.id}/hero.webp`);
    await db
      .insert(news)
      .values({
        id: n.id,
        published: n.published,
        date: n.date,
        category: n.category,
        title: n.title,
        excerpt: n.excerpt,
        body: n.body,
        imageUrl,
      })
      .onConflictDoUpdate({
        target: news.id,
        set: {
          published: n.published,
          date: n.date,
          category: n.category,
          title: n.title,
          excerpt: n.excerpt,
          body: n.body,
          imageUrl,
          updatedAt: new Date(),
        },
      });
  }

  console.log("▸ Seeding demos…");
  for (const d of SEED_DEMOS) {
    await db
      .insert(demos)
      .values({
        id: d.id,
        artist: d.artist,
        contact: d.contact,
        email: d.email,
        city: d.city,
        genre: d.genre,
        duration: d.duration,
        pitch: d.pitch,
        links: d.links ?? [],
        status: d.status,
        rating: d.rating,
        tags: d.tags ?? [],
        assignedTo: d.assignedTo,
        receivedAt: new Date(d.received),
      })
      .onConflictDoNothing();
  }

  console.log("▸ Seeding demands…");
  for (const d of SEED_DEMANDS) {
    await db
      .insert(demands)
      .values({
        id: d.id,
        category: d.category,
        subject: d.subject,
        name: d.name,
        org: d.org,
        email: d.email,
        phone: d.phone,
        message: d.message,
        status: d.status,
        assignedTo: d.assignedTo,
        receivedAt: new Date(d.received),
      })
      .onConflictDoNothing();
  }

  console.log("▸ Seeding subscribers…");
  for (const s of SEED_SUBSCRIBERS) {
    await db
      .insert(subscribers)
      .values({
        id: s.id,
        email: s.email,
        name: s.name,
        tags: s.tags ?? [],
        confirmedAt: new Date(s.subscribed),
        subscribedAt: new Date(s.subscribed),
      })
      .onConflictDoNothing();
  }

  console.log("▸ Seeding settings…");
  for (const s of SEED_SETTINGS) {
    await db
      .insert(settings)
      .values({ key: s.key, value: s.value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: s.value, updatedAt: new Date() },
      });
  }

  // Premier superadmin : ne peut pas être invité (personne pour l'inviter).
  // Connexion par magic link uniquement, donc pas de mot de passe ici : une
  // ligne `user` suffit (Better Auth crée la session au clic du lien).
  console.log("▸ Seeding superadmin…");
  const SUPERADMIN_EMAIL =
    process.env.SEED_SUPERADMIN_EMAIL ?? "matheuskopsguedes@gmail.com";
  // Prénom « Super Admin », nom vide. `name` (nom complet) = prénom seul.
  await db
    .insert(user)
    .values({
      id: "usr-superadmin",
      name: "Super Admin",
      firstName: "Super Admin",
      lastName: null,
      email: SUPERADMIN_EMAIL,
      emailVerified: true,
      role: "superadmin",
    })
    .onConflictDoUpdate({
      target: user.id,
      set: {
        name: "Super Admin",
        firstName: "Super Admin",
        lastName: null,
        email: SUPERADMIN_EMAIL,
        role: "superadmin",
      },
    });
  console.log(`   superadmin → ${SUPERADMIN_EMAIL}`);

  console.log("✅ Seed done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
