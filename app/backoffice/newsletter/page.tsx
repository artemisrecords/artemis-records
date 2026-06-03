import { PageHeader } from "@/components/admin/AdminPrimitives";
import { getArtists, getNewsletterSettings } from "@/lib/db/queries";
import { NewsletterAdminClient } from "./NewsletterAdminClient";

export default async function NewsletterPage() {
  const [settings, allArtists] = await Promise.all([
    getNewsletterSettings(),
    getArtists(),
  ]);

  const artists = allArtists.map((a) => ({
    id: a.id,
    name: a.name,
    newsletterUrl: a.newsletterUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="07"
        eyebrow="Lien direct"
        title="Newsletter"
        italic="Le label confie ses envois à un prestataire externe. On garde ici les liens : le formulaire public, le dashboard, et la newsletter de chaque artiste."
      />

      <NewsletterAdminClient
        signupUrl={settings.signupUrl}
        dashboardUrl={settings.dashboardUrl}
        artists={artists}
      />
    </div>
  );
}
