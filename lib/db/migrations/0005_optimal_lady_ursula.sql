CREATE TABLE "contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"party" text NOT NULL,
	"artist_id" text,
	"type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"amount" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'a_signer' NOT NULL,
	"notes" text,
	"signed_by" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status","end_date");