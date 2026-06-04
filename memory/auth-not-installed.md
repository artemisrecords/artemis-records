---
name: auth-not-installed
description: No auth library is installed yet; auth is UI-only mock
metadata:
  type: project
---

As of 2026-05-22, no auth library is installed (no Clerk, NextAuth/Auth.js, Lucia, etc.). Confirmed via `package.json`. An `AUTH_SECRET` exists in `.env.local` but nothing consumes it.

Auth is UI-mocked only: `/auth` authenticates nothing and `/backoffice/**` is publicly reachable. The migration spec lists Clerk as TBD.

**How to apply:** if asked to wire up auth, expect a from-scratch install. Don't assume any provider is already present. Related: [[dev-database-endpoint]].
