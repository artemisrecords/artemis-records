"use server";

import { acceptInvitation } from "@/lib/invitations";

export type AcceptState = { ok?: boolean; email?: string; error?: string } | null;

export async function acceptInvitationAction(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  const firstName = String(formData.get("firstName") ?? "");
  const lastName = String(formData.get("lastName") ?? "");
  try {
    const res = await acceptInvitation({ token, firstName, lastName });
    return { ok: true, email: res.email };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
}
