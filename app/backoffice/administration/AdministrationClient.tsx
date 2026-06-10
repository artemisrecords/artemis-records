"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eyebrow } from "@/components/Primitives";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import type { Role } from "@/lib/permissions";
import {
  inviteAction,
  revokeInvitationAction,
  deleteUserAction,
  changeRoleAction,
  type InviteState,
  type ChangeRoleState,
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

/**
 * Sélecteur de rôle inline (superadmin uniquement, jamais sur soi-même).
 * Passer en artiste exige de lier une fiche libre ; le changement révoque
 * les sessions du compte ciblé.
 */
function RoleEditor({
  u,
  freeArtists,
}: {
  u: UserRow;
  freeArtists: ArtistOpt[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ChangeRoleState, FormData>(
    changeRoleAction,
    null,
  );
  const [role, setRole] = useState<Role>((u.role ?? "artiste") as Role);
  const [ficheId, setFicheId] = useState("");
  const dirty = role !== u.role;

  // Après application, le rôle vient des données serveur : on force leur
  // rafraîchissement puis on réaligne la sélection locale dessus.
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  useEffect(() => {
    setRole((u.role ?? "artiste") as Role);
    setFicheId("");
  }, [u.role]);

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={action}
        onSubmit={(e) => {
          if (
            !confirm(
              `Passer ${u.name} en ${ROLE_LABEL[role]} ? Ses sessions seront déconnectées.`,
            )
          )
            e.preventDefault();
        }}
        className="flex items-center gap-2 flex-wrap justify-end"
      >
        <input type="hidden" name="id" value={u.id} />
        <AdminDropdown
          name="role"
          ariaLabel={`Rôle de ${u.name}`}
          value={role}
          onChange={(v) => setRole(v as Role)}
          options={(["superadmin", "admin", "artiste"] as Role[]).map((r) => ({
            value: r,
            label: ROLE_LABEL[r],
          }))}
        />
        {dirty && role === "artiste" && (
          <AdminDropdown
            name="artistId"
            ariaLabel="Fiche artiste à lier"
            value={ficheId}
            onChange={setFicheId}
            placeholder={freeArtists.length ? "Fiche à lier…" : "Aucune fiche libre"}
            options={freeArtists.map((a) => ({ value: a.id, label: a.name }))}
          />
        )}
        {dirty && (
          <button
            type="submit"
            disabled={pending}
            className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:text-ink cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {pending ? "…" : "Appliquer"}
          </button>
        )}
      </form>
      {state?.error && (
        <span className="font-serif italic text-[12px] text-magenta">
          {state.error}
        </span>
      )}
      {state?.ok && !dirty && (
        <span className="font-serif italic text-[12px] text-ink-muted">
          {state.message}
        </span>
      )}
    </div>
  );
}

export function AdministrationClient({
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
    callerRole === "superadmin"
      ? ["admin", "artiste", "superadmin"]
      : ["artiste"];
  const [state, action, isPending] = useActionState<InviteState, FormData>(
    inviteAction,
    null,
  );
  const [selectedRole, setSelectedRole] = useState<Role>(invitableRoles[0]);
  const [inviteArtistId, setInviteArtistId] = useState("");
  const freeArtists = artists.filter((a) => !a.linked);

  // Invitation envoyée : on vide la sélection de fiche (l'email, champ non
  // contrôlé, est déjà réinitialisé par React).
  useEffect(() => {
    if (state?.ok) setInviteArtistId("");
  }, [state]);

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
    "block text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle";

  return (
    <div className="space-y-12 max-w-[820px]">
      <header>
        <Eyebrow>Comptes &amp; accès</Eyebrow>
        <h1 className="font-display uppercase tracking-display font-normal text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.05] mt-1">
          Administration
        </h1>
        <p className="font-serif italic text-[14px] text-ink-muted mt-2 leading-[1.55]">
          {callerRole === "superadmin"
            ? "Invitez des super admins, des administrateurs ou des artistes. L'accès se fait par invitation uniquement."
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
            <span className={labelCls}>Rôle</span>
            <AdminDropdown
              name="role"
              ariaLabel="Rôle"
              variant="underline"
              value={selectedRole}
              onChange={(v) => setSelectedRole(v as Role)}
              options={invitableRoles.map((r) => ({
                value: r,
                label: ROLE_LABEL[r],
              }))}
            />
          </div>

          {selectedRole === "artiste" && (
            <div className="sm:col-span-2">
              <span className={labelCls}>Fiche artiste à lier</span>
              <AdminDropdown
                name="artistId"
                ariaLabel="Fiche artiste à lier"
                variant="underline"
                value={inviteArtistId}
                onChange={setInviteArtistId}
                placeholder={
                  freeArtists.length
                    ? "Sélectionner une fiche…"
                    : "Aucune fiche disponible"
                }
                options={freeArtists.map((a) => ({
                  value: a.id,
                  label: a.name,
                }))}
              />
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
                {callerRole === "superadmin" && u.id !== callerId ? (
                  <RoleEditor u={u} freeArtists={freeArtists} />
                ) : (
                  <span className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                    {ROLE_LABEL[u.role ?? ""] ?? u.role}
                  </span>
                )}
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
