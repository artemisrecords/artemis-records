import {
  pgTable,
  text,
  boolean,
  jsonb,
  timestamp,
  date,
  smallint,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Tables gérées par Better Auth (user/session/account/verification), générées
// par `@better-auth/cli generate`. Ré-exportées ici pour que les clients db
// (lib/db/index.ts, lib/db/auth-db.ts) et drizzle-kit voient tout le schéma
// depuis un seul point d'entrée.
export * from "./auth-schema";

export type Embed = { type: "spotify" | "youtube"; title: string; src: string };
export type DiscoItem = {
  id: string;
  kind: string;
  title: string;
  year: string;
  cover: string;
  note?: string;
};
export type DemoLink = { label: string; href: string };
export type DemoFile = { name: string; url: string; size: number };

export const artists = pgTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  genre: text("genre").notNull(),
  signedYear: text("signed_year").notNull(),
  published: boolean("published").notNull().default(false),
  portraitUrl: text("portrait_url").notNull(),
  coverUrl: text("cover_url").notNull(),
  primaryColor: text("primary_color"),
  quote: text("quote"),
  bioShort: text("bio_short").notNull(),
  bioLong: text("bio_long").notNull(),
  newsletterUrl: text("newsletter_url"),
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  socials: jsonb("socials").$type<Record<string, string>>().notNull().default({}),
  embeds: jsonb("embeds").$type<Embed[]>().notNull().default([]),
  discography: jsonb("discography").$type<DiscoItem[]>().notNull().default([]),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const artistShows = pgTable(
  "artist_shows",
  {
    id: text("id").primaryKey(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    city: text("city").notNull(),
    venue: text("venue").notNull(),
    status: text("status"),
    free: boolean("free").notNull().default(false),
    ticketUrl: text("ticket_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("artist_shows_date_idx").on(t.date),
    index("artist_shows_artist_idx").on(t.artistId),
  ],
);

export const news = pgTable(
  "news",
  {
    id: text("id").primaryKey(),
    published: boolean("published").notNull().default(false),
    date: date("date").notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_date_idx").on(t.date)],
);

export const demos = pgTable(
  "demos",
  {
    id: text("id").primaryKey(),
    artist: text("artist").notNull(),
    contact: text("contact").notNull(),
    email: text("email").notNull(),
    city: text("city"),
    genre: text("genre"),
    duration: text("duration"),
    pitch: text("pitch").notNull(),
    links: jsonb("links").$type<DemoLink[]>().notNull().default([]),
    files: jsonb("files").$type<DemoFile[]>().notNull().default([]),
    status: text("status").notNull().default("nouveau"),
    rating: smallint("rating"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    assignedTo: text("assigned_to"),
    notes: text("notes"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("demos_status_idx").on(t.status, t.receivedAt)],
);

export const demands = pgTable(
  "demands",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    subject: text("subject").notNull(),
    name: text("name").notNull(),
    org: text("org"),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    status: text("status").notNull().default("ouverte"),
    assignedTo: text("assigned_to"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("demands_status_idx").on(t.status, t.receivedAt)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Invitations à l'espace label. Un compte ne se crée que par invitation
 * (superadmin → admins, admin → artistes). À l'acceptation, on crée le `user`
 * avec ce rôle (+ `artistId` pour un artiste) et on marque l'invitation acceptée.
 */
export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    // Renseigné seulement pour un compte artiste : la fiche à lier.
    artistId: text("artist_id").references(() => artists.id, {
      onDelete: "set null",
    }),
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("invitation_token_idx").on(t.token),
    index("invitation_email_idx").on(t.email),
  ],
);

export type InvitationRow = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
export type ArtistShow = typeof artistShows.$inferSelect;
export type NewsRow = typeof news.$inferSelect;
export type DemoRow = typeof demos.$inferSelect;
export type DemandRow = typeof demands.$inferSelect;
export type SubscriberRow = typeof subscribers.$inferSelect;
export type SettingRow = typeof settings.$inferSelect;
