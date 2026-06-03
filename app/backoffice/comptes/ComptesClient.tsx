"use client";

import { useActionState, useState } from "react";
import { Eyebrow } from "@/components/Primitives";
import type { Role } from "@/lib/permissions";
import {
  inviteAction,
  revokeInvitationAction,
  deleteUserAction,
  type InviteState,
} from "./actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  artistId: string | null;
  createdAt: Date | string;
};
type PendingRow = {
  id: string;
  email: string;
  role: string;
  artistId: string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
};
type ArtistOpt = { id: string; name: string; linked: boolean };

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super admin",
  admin: "Admin",
  artiste: "Artiste",
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ComptesClient({
  callerId,
  callerRole,
  users,
  pending,
  artists,
}: {
  callerId: string;
  callerRole: Role;
  users: UserRow[];
  pending: PendingRow[];
  artists: ArtistOpt[];
}) {
  const invitableRoles: Role[] =
    callerRole === "superadmin" ? ["admin", "artiste"] : ["artiste"];
  const [state, action, isPending] = useActionState<InviteState, FormData>(
    inviteAction,
    null,
  );
  const [selectedRole, setSelectedRole] = useState<Role>(invitableRoles[0]);
  const freeArtists = artists.filter((a) => !a.linked);

  const artistName = (id: string | null) =>
    id ? (artists.find((a) => a.id === id)?.name ?? id) : null;

  function canDelete(u: UserRow) {
    if (u.id === callerId) return false;
    if (u.role === "superadmin") return false;
    if (callerRole === "admin" && u.role !== "artiste") return false;
    return true;
  }
  function canRevoke(p: PendingRow) {
    return callerRole !== "admin" || p.role === "artiste";
  }

  const inputCls =
    "w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif text-[15px] text-ink outline-none focus:border-magenta transition-colors";
  const labelCls =
    "text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle";

  return (
    <div className="space-y-12 max-w-[820px]">
      <header>
        <Eyebrow>Espace label</Eyebrow>
        <h1 className="font-display uppercase tracking-display font-normal text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.05] mt-1">
          Comptes &amp; accès
        </h1>
        <p className="font-serif italic text-[14px] text-ink-muted mt-2 leading-[1.55]">
          {callerRole === "superadmin"
            ? "Invitez des administrateurs ou des artistes. L'accès se fait par invitation uniquement."
            : "Invitez des artistes et liez-les à leur fiche. L'accès se fait par invitation uniquement."}
        </p>
      </header>

      {/* Inviter */}
      <section className="border border-ink/15 bg-paper-soft p-7">
        <h2 className="font-display uppercase tracking-display text-[18px] font-normal mb-5">
          Inviter quelqu&apos;un
        </h2>
        <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="email" className={labelCls}>
              Courriel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="personne@exemple.fr"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="role" className={labelCls}>
              Rôle
            </label>
            <select
              id="role"
              name="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className={inputCls}
            >
              {invitableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>

          {selectedRole === "artiste" && (
            <div className="sm:col-span-2">
              <label htmlFor="artistId" className={labelCls}>
                Fiche artiste à lier
              </label>
              <select
                id="artistId"
                name="artistId"
                required
                defaultValue=""
                className={inputCls}
              >
                <option value="" disabled>
                  {freeArtists.length
                    ? "Sélectionner une fiche…"
                    : "Aucune fiche disponible"}
                </option>
                {freeArtists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:col-span-2 flex items-center gap-4 flex-wrap">
            <button
              type="submit"
              disabled={isPending}
              className="font-serif text-[12px] tracking-[0.18em] uppercase font-bold bg-bleu-nuit-700 text-beige-sable px-6 py-3.5 rounded-[2px] cursor-pointer hover:bg-bleu-nuit-800 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {isPending ? "Envoi…" : "Envoyer l'invitation"}
            </button>
            {state?.ok && (
              <span className="font-serif italic text-[13px] text-ink-muted">
                {state.message}
              </span>
            )}
            {state?.error && (
              <span className="font-serif italic text-[13px] text-magenta">
                {state.error}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Comptes actifs */}
      <section>
        <h2 className="font-display uppercase tracking-display text-[18px] font-normal mb-4">
          Comptes actifs <span className="text-ink-subtle">({users.length})</span>
        </h2>
        <ul className="divide-y divide-ink/10 border-t border-b border-ink/10">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div className="min-w-0">
                <div className="font-serif text-[15px] text-ink flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{u.name}</span>
                  {u.id === callerId && (
                    <span className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                      vous
                    </span>
                  )}
                </div>
                <div className="font-serif text-[13px] text-ink-muted truncate">
                  {u.email}
                  {u.role === "artiste" && artistName(u.artistId) && (
                    <> · fiche : {artistName(u.artistId)}</>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  {ROLE_LABEL[u.role ?? ""] ?? u.role}
                </span>
                {canDelete(u) && (
                  <form
                    action={deleteUserAction}
                    onSubmit={(e) => {
                      if (
                        !confirm(`Supprimer définitivement le compte de ${u.name} ?`)
                      )
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="font-serif text-[12px] text-ink-subtle hover:text-magenta cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Invitations en attente */}
      <section>
        <h2 className="font-display uppercase tracking-display text-[18px] font-normal mb-4">
          Invitations en attente{" "}
          <span className="text-ink-subtle">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="font-serif italic text-[14px] text-ink-muted">
            Aucune invitation en attente.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 border-t border-b border-ink/10">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <div className="font-serif text-[15px] text-ink truncate">
                    {p.email}
                  </div>
                  <div className="font-serif text-[13px] text-ink-muted">
                    Invité le {fmtDate(p.createdAt)} · expire le{" "}
                    {fmtDate(p.expiresAt)}
                    {p.role === "artiste" && artistName(p.artistId) && (
                      <> · fiche : {artistName(p.artistId)}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                    {ROLE_LABEL[p.role] ?? p.role}
                  </span>
                  {canRevoke(p) && (
                    <form
                      action={revokeInvitationAction}
                      onSubmit={(e) => {
                        if (!confirm(`Annuler l'invitation de ${p.email} ?`))
                          e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="font-serif text-[12px] text-ink-subtle hover:text-magenta cursor-pointer"
                      >
                        Révoquer
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
