CREATE TABLE "artist_shows" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"date" date NOT NULL,
	"city" text NOT NULL,
	"venue" text NOT NULL,
	"status" text,
	"free" boolean DEFAULT false NOT NULL,
	"ticket_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"genre" text NOT NULL,
	"signed_year" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"portrait_url" text NOT NULL,
	"cover_url" text NOT NULL,
	"primary_color" text,
	"quote" text,
	"bio_short" text NOT NULL,
	"bio_long" text NOT NULL,
	"genres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"socials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embeds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discography" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demands" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"subject" text NOT NULL,
	"name" text NOT NULL,
	"org" text,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'ouverte' NOT NULL,
	"assigned_to" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demos" (
	"id" text PRIMARY KEY NOT NULL,
	"artist" text NOT NULL,
	"contact" text NOT NULL,
	"email" text NOT NULL,
	"city" text,
	"genre" text,
	"duration" text,
	"pitch" text NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'nouveau' NOT NULL,
	"rating" smallint,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assigned_to" text,
	"notes" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" text PRIMARY KEY NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "artist_shows" ADD CONSTRAINT "artist_shows_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artist_shows_date_idx" ON "artist_shows" USING btree ("date");--> statement-breakpoint
CREATE INDEX "artist_shows_artist_idx" ON "artist_shows" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "demands_status_idx" ON "demands" USING btree ("status","received_at");--> statement-breakpoint
CREATE INDEX "demos_status_idx" ON "demos" USING btree ("status","received_at");--> statement-breakpoint
CREATE INDEX "news_date_idx" ON "news" USING btree ("date");