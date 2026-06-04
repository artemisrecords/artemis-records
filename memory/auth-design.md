---
name: auth-design
description: Auth stack decision for the backoffice + artist space (Better Auth, magic-link-only, invite-only, 3 roles)
metadata:
  type: project
---

Auth for artemis-records was designed on 2026-05-22 (see `docs/superpowers/specs/2026-05-22-auth-better-auth-design.md`). Decisions, chosen over the spec's older Clerk pick:

- **Better Auth** (direct, not Neon Auth managed, not Clerk).
- **Magic link only**: no password, no Google. `magicLink({ disableSignUp: true })` so only emails already in the DB get a link (invite-only).
- **Invitation flow with acceptance page**: custom `invitation` table (token + role + optional artistId) → Resend email → `/accept-invitation`.
- **Roles**: `superadmin` (manages admins) > `admin` (manages artist accounts + label CRUD) > `artiste` (sees/edits only own artist record). Via `createAccessControl` + admin plugin; `role` is a `user` field with `input: false`.
- **Artist space** lives at separate `/espace` (not the `/backoffice` admin chrome).
- **Session** quasi-permanent (long expiresIn + rolling refresh, revoked on signOut).
- **Email**: env-based transport behind a single `lib/email.ts` `sendEmail()`. Selected on `VERCEL_ENV`: dev=Mailpit (Nodemailer SMTP localhost:1025, webmail :8025), preview=Nodemailer SMTP sandbox (Mailtrap/Ethereal via SMTP_* vars), prod=Resend (prepared but NOT implemented yet — branch throws until wired). **Env**: BETTER_AUTH_SECRET, BETTER_AUTH_URL, EMAIL_FROM, SMTP_HOST/PORT/USER/PASS, RESEND_API_KEY (prod only, later).
- **DB driver gotcha**: app uses Neon `neon-http` (no transactions); Better Auth needs a dedicated Neon WebSocket Pool connection.
- First superadmin is seeded via `scripts/seed.ts` (cannot be invited).

**Why:** captures a multi-turn design decision not yet in code, so it survives context loss.
**How to apply:** when implementing/touching auth, follow this; supersedes [[auth-not-installed]] once built. Next.js 16 uses `proxy.ts`, not `middleware.ts`, for route gating.
