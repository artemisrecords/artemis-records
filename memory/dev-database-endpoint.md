---
name: dev-database-endpoint
description: Which Neon endpoint is the real dev DB, and the stale POSTGRES_* env vars gotcha
metadata:
  type: project
---

The app's dev database is the Neon endpoint `ep-solitary-sunset-alfpphsv` (project `summer-resonance-40791422`), user-confirmed as correct.

Both `lib/db/index.ts` (runtime client) and `drizzle.config.ts` (migrations) read **only `DATABASE_URL`**, which points to `ep-solitary-sunset`.

**Gotcha:** `.env.local` also contains `POSTGRES_*` / `PG*` vars (Vercel/Prisma-style) that point to a *different* endpoint, `ep-long-waterfall-al195qq9`. Likely a stale leftover from an old Vercel sync. Nothing in the code reads them, so no impact today, but any tool/script that grabs `POSTGRES_URL` instead of `DATABASE_URL` would hit the wrong DB.

**Why:** env file has two Neon endpoints with identical user/password/db name (`neondb`), easy to confuse.
**How to apply:** trust `DATABASE_URL` (= solitary-sunset) as the source of truth for dev; treat `POSTGRES_*` as suspect. See [[auth-not-installed]] for related stack state.
