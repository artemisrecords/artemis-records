import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Local CLI runs (db:migrate / db:studio) read the dev-branch URL from
// .env.local. On Vercel, DATABASE_URL is already in process.env and this
// no-ops (the file is gitignored / absent), so the build still works.
config({ path: ".env.local" });

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
