// L'adresse du label est stockée en une seule chaîne (réglages backoffice) ;
// on la découpe en lignes pour l'affichage (footer, page contact).
export const addressLines = (address: string) =>
  address.split(/\r?\n|,\s*/).filter(Boolean);
