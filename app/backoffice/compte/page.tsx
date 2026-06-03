import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { CompteClient } from "./CompteClient";

export default async function ComptePage() {
  const user = await getCurrentUser();
  // Le layout backoffice garde déjà la route ; filet de sécurité au cas où.
  if (!user) redirect("/auth");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="11"
        eyebrow="Profil de connexion"
        title="Compte"
        italic="Vos informations personnelles pour accéder au backoffice."
      />

      <CompteClient
        firstName={user.firstName ?? ""}
        lastName={user.lastName ?? ""}
        email={user.email}
        role={user.role ?? null}
        createdAt={
          user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : String(user.createdAt)
        }
      />
    </div>
  );
}
