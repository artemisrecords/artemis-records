import { LegalPage } from "@/components/LegalPage";

export default function LegalRoute() {
  return (
    <LegalPage title="MENTIONS LÉGALES" eyebrow="Information légale">
      <h3>Éditeur</h3>
      <p>
        ARTémis Records, 22 rue des Épinettes, 95180 Menucourt, France.
        Contact : artemis.inscriptions@gmail.com · 07 78 47 22 30.
      </p>
      <h3>Directrice de publication</h3>
      <p>Alix M., fondatrice.</p>
      <h3>Hébergement</h3>
      <p>
        Ce prototype est statique, hébergé sur l&apos;infrastructure fournie par
        la plateforme de démonstration.
      </p>
      <h3>Propriété intellectuelle</h3>
      <p>
        L&apos;ensemble des contenus (textes, photographies, logos, marques) est
        la propriété d&apos;ARTémis Records ou de ses artistes, sauf mention
        contraire. Toute reproduction est soumise à autorisation préalable.
      </p>
      <h3>Crédits</h3>
      <p>
        Identité visuelle : charte graphique ARTémis Records (2025).
        Typographies : Catchy Mager, Libre Baskerville. Photographies :
        artistes et contributeurs, tous droits réservés.
      </p>
    </LegalPage>
  );
}
