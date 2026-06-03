import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Ressources et actions gérables dans l'app, en plus des ressources `user` /
 * `session` apportées par le plugin admin (`defaultStatements`).
 *
 * Hiérarchie : superadmin > admin > artiste.
 * La restriction fine « un admin n'invite que des artistes, un superadmin que
 * des admins » est aussi re-vérifiée côté Server Actions (defense in depth) ;
 * ces rôles donnent la structure de permissions de base.
 */
export const statement = {
  ...defaultStatements,
  adminAccounts: ["create", "list", "revoke"],
  artistAccounts: ["create", "list", "revoke"],
  artists: ["create", "update", "delete", "publish"],
  journal: ["create", "update", "delete", "publish"],
  demos: ["read", "update"],
  demands: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

/** Aucun pouvoir d'admin. L'espace artiste est géré hors access-control. */
export const artiste = ac.newRole({});

/** Gère les comptes artistes + le CRUD du label. */
export const admin = ac.newRole({
  user: ["create", "list"],
  artistAccounts: ["create", "list", "revoke"],
  artists: ["create", "update", "delete", "publish"],
  journal: ["create", "update", "delete", "publish"],
  demos: ["read", "update"],
  demands: ["read", "update"],
});

/** Gère les comptes admins + tout ce que peut faire un admin. */
export const superadmin = ac.newRole({
  ...adminAc.statements,
  adminAccounts: ["create", "list", "revoke"],
  artistAccounts: ["create", "list", "revoke"],
  artists: ["create", "update", "delete", "publish"],
  journal: ["create", "update", "delete", "publish"],
  demos: ["read", "update"],
  demands: ["read", "update"],
});

export const ROLES = ["superadmin", "admin", "artiste"] as const;
export type Role = (typeof ROLES)[number];
