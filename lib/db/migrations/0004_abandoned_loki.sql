ALTER TABLE "demos" ADD COLUMN "decided_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "demos_decided_idx" ON "demos" USING btree ("decided_at");