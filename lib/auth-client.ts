import { createAuthClient } from "better-auth/react";
import { magicLinkClient, adminClient } from "better-auth/client/plugins";
import { ac, superadmin, admin, artiste } from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    adminClient({ ac, roles: { superadmin, admin, artiste } }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
