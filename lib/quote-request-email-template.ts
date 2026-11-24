import { formatQuoteDate, QUOTE_SCHOOL_TYPE_LABELS, type QuoteRequest } from "../convex/quoteRules";
import { emailBrandHtml } from "./email-brand";

/**
 * LE COURRIEL D'UNE DEMANDE DE DEVIS, reçu par l'équipe : un tableau, une
 * ligne par réponse du formulaire (`components/landing/quote-request.tsx`).
 *
 * TOUT CE QUI VIENT DU FORMULAIRE EST ÉCHAPPÉ. Ces textes sont saisis par un
 * visiteur sans compte : un nom d'école qui contiendrait une balise ne doit pas
 * devenir du balisage dans la boîte de l'équipe.
 */
export interface QuoteRequestEmailData {
  /** Le logo de marque, quand le déploiement en publie un. */
  logoUrl?: string;
  request: QuoteRequest;
}

export function quoteRequestRows(request: QuoteRequest): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ["École", request.schoolName],
    ["Ville", request.city],
    ["Type", QUOTE_SCHOOL_TYPE_LABELS[request.schoolType]],
    ["Contact", request.contactName],
    ["Fonction", request.contactRole],
    ["E-mail", request.email],
    ["Téléphone", request.phone],
    ["Nombre d'élèves", String(request.studentCount)],
    ["Nombre de classes", String(request.classCount)],
    ["Classes concernées", request.levels.join(", ")],
    ["Module Arabe & Coran", request.wantsArabic ? "Oui" : "Non"],
  ];
  if (request.startWhen) rows.push(["Démarrage souhaité", formatQuoteDate(request.startWhen)]);
  if (request.message) rows.push(["Message", request.message]);
  return rows;
}

export function generateQuoteRequestEmailHtml(data: QuoteRequestEmailData): string {
  const rows = quoteRequestRows(data.request)
    .map(
      ([label, value]) => `
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:15px;line-height:1.5;">${escapeHtml(value).replace(/\n/g, "<br />")}</td>
                </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Demande de devis</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#0d9488;padding:24px 32px;">
              ${emailBrandHtml({ subtitle: "Demande de devis d'une école", logoUrl: data.logoUrl })}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0;color:#111827;font-size:16px;line-height:1.5;">
                Une école demande un devis depuis la page d'accueil. « Répondre » écrit à son contact.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${rows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
