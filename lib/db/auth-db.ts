import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

/**
 * Connexion DB dédiée à Better Auth.
 *
 * Le reste de l'app utilise le driver Neon HTTP (`lib/db/index.ts`), qui NE
 * supporte PAS les transactions. Or Better Auth en a besoin pour certaines
 * opérations. On lui donne donc une connexion Neon WebSocket (Pool), qui les
 * supporte. Même `DATABASE_URL`, driver différent.
 *
 * Node < 22 n'a pas de `WebSocket` global : on fournit `ws` à neon.
 */
if (!(globalThis as { WebSocket?: unknown }).WebSocket) {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const authDb = drizzle(pool, { schema });
