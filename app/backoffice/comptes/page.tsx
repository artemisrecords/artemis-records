import { isNotNull } from "drizzle-orm";
import { requireRole } from "@/lib/auth-helpers";
import { listAccounts } from "@/lib/invitations";
import { db } from "@/lib/db";
import { artists, user } from "@/lib/db/schema";
import { ComptesClient } from "./ComptesClient";

export default async function ComptesPage() {
  const { user: caller, role } = await requireRole("superadmin", "admin");
  const { users, pending } = await listAccounts();

  const allArtists = await db
    .select({ id: artists.id, name: artists.name })
    .from(artists)
    .orderBy(artists.name);
  const linkedRows = await db
    .select({ artistId: user.artistId })
    .from(user)
    .where(isNotNull(user.artistId));
  const linked = new Set(linkedRows.map((r) => r.artistId));
  const artistOptions = allArtists.map((a) => ({
    id: a.id,
    name: a.name,
    linked: linked.has(a.id),
  }));

  return (
    <ComptesClient
      callerId={caller.id}
      callerRole={role}
      users={users}
      pending={pending}
      artists={artistOptions}
    />
  );
}
