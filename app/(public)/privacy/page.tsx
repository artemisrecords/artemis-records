import { LegalPage } from "@/components/LegalPage";

export default function PrivacyRoute() {
  return (
    <LegalPage title="CONFIDENTIALITÉ" eyebrow="Protection des données">
      <h3>Données collectées</h3>
      <p>
        Nous collectons uniquement les données nécessaires au traitement de vos
        demandes (formulaire de contact, soumission de démo, inscription à la
        newsletter) : nom, courriel, organisation éventuelle, contenu du
        message, liens fournis.
      </p>
      <h3>Durée de conservation</h3>
      <p>
        Demandes générales : 24 mois. Démos : 12 mois après la dernière réponse.
        Newsletter : jusqu&apos;au désabonnement.
      </p>
      <h3>Destinataires</h3>
      <p>
        Vos données sont strictement réservées à l&apos;équipe d&apos;ARTémis
        Records. Elles ne sont ni cédées ni revendues.
      </p>
      <h3>Vos droits</h3>
      <p>
        Accès, rectification, effacement, opposition, portabilité — à tout
        moment sur simple demande écrite à artemis.inscriptions@gmail.com.
      </p>
      <h3>Cookies</h3>
      <p>
        Le site ne dépose qu&apos;un cookie fonctionnel de session. Aucune
        mesure d&apos;audience tierce n&apos;est activée par défaut.
      </p>
    </LegalPage>
  );
}
