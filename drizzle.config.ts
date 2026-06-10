import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Local CLI runs (db:migrate / db:studio) read the dev-branch URL from
// .env.local, with .env as fallback (dotenv never overrides a var already
// set, so .env.local keeps priority — same precedence as Next.js). On
// Vercel, DATABASE_URL is already in process.env and both calls no-op.
config({ path: ".env.local" });
config({ path: ".env" });

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
