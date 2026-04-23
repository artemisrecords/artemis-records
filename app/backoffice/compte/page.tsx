"use client";

import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  PageHeader,
} from "@/components/admin/AdminPrimitives";

export default function ComptePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="11"
        eyebrow="Profil de connexion"
        title="Compte"
        italic="Vos informations personnelles pour accéder au backoffice."
      />

      <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7 max-w-[720px]">
        <AdminEyebrow className="mb-4">Mon compte</AdminEyebrow>
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Nom" defaultValue="Margaux Villeneuve" />
          <AdminField label="Rôle" defaultValue="Direction artistique" />
        </div>
        <AdminField
          label="Courriel"
          defaultValue="margaux@artemis-records.fr"
        />
        <div className="flex items-center gap-3 pt-4 border-t border-ink/10">
          <AdminBtn kind="accent">Enregistrer</AdminBtn>
          <AdminBtn kind="ghost">Annuler</AdminBtn>
        </div>
      </section>
    </div>
  );
}
