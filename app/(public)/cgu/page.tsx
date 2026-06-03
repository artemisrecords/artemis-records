import { LegalPage } from "@/components/LegalPage";

export default function CguRoute() {
  return (
    <LegalPage title="CGU" eyebrow="Conditions générales">
      <h3>Objet</h3>
      <p>
        Les présentes conditions régissent l&apos;usage du site
        www.artemisrecordslabel.com et des services associés.
      </p>
      <h3>Usage</h3>
      <p>
        Le site est fourni à titre informatif. La consultation est libre et
        gratuite. Vous vous engagez à un usage loyal et respectueux : pas de
        scraping massif, pas de contenu haineux dans les formulaires.
      </p>
      <h3>Responsabilité</h3>
      <p>
        ARTémis Records met tout en œuvre pour assurer l&apos;exactitude des
        informations publiées. Des erreurs peuvent subsister ; elles nous sont
        signalables par courriel.
      </p>
      <h3>Liens externes</h3>
      <p>
        Le site peut contenir des liens vers des sites tiers (Spotify, YouTube,
        réseaux sociaux). Nous ne saurions être tenus responsables de leur
        contenu.
      </p>
      <h3>Modification</h3>
      <p>
        Ces conditions peuvent évoluer. La version en vigueur est celle publiée
        sur cette page à la date de votre consultation.
      </p>
    </LegalPage>
  );
}
