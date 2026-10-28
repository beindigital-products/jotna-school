/**
 * LES TEXTES LÉGAUX DU SITE — une source, trois lecteurs.
 *
 * Le pied de page (`components/landing/footer.tsx`) tire ses liens d'ici,
 * chaque page `app/legal/<slug>/page.tsx` y lit son texte, et le test
 * (`lib/legal/__tests__/docs.test.ts`) vérifie qu'aucun lien ne mène nulle
 * part. Avant ce fichier, le pied de page annonçait six pages qui n'existaient
 * pas.
 *
 * CE QUE CES TEXTES AFFIRMENT, ET D'OÙ ÇA VIENT. Chaque fait de la politique de
 * confidentialité a été relu dans le code : les champs de `profiles`, la voix
 * qui ne se stocke nulle part (`convex/arabic/voice.ts`), les invites envoyées
 * à l'IA (`convex/paliers/index.ts`, `convex/explainMistake.ts`), l'absence
 * d'outil de mesure d'audience dans `package.json`. Si l'un de ces faits
 * change, le texte doit changer avec lui.
 *
 * CE QUI RESTE À DÉCIDER PAR LE PROPRIÉTAIRE, et que le texte pose par défaut :
 * la durée de conservation, l'accès gratuit pendant le lancement, le tribunal
 * compétent. Ce sont des choix de l'éditeur, pas des faits du code.
 *
 * Ce sont des brouillons rédigés pour être relus par un juriste avant la mise
 * en production. Les écrire en données et non en JSX évite les apostrophes
 * échappées et permet de les tester.
 */

import type { Metadata } from "next";

import { CONTACT_EMAIL, LEGAL_ENTITY } from "./entity";

export type LegalBlock = string | { list: string[] };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  slug: string;
  /** Texte du lien dans le pied de page. */
  label: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

const E = LEGAL_ENTITY;

const mentions: LegalDoc = {
  slug: "mentions",
  label: "Mentions légales",
  title: "Mentions légales",
  description:
    "L'éditeur du site Jotna School, son hébergement, ses droits et ses coordonnées.",
  sections: [
    {
      title: "Éditeur du site",
      blocks: [
        `Le site et l'application Jotna School sont édités par ${E.name}, ${E.form} au capital de ${E.capital}.`,
        {
          list: [
            `Siège social : ${E.address}`,
            `RCCM : ${E.rccm}`,
            `NINEA : ${E.ninea}`,
            `Courriel : ${CONTACT_EMAIL}`,
          ],
        },
        `Directeur de la publication : ${E.publicationDirector}.`,
      ],
    },
    {
      title: "Hébergement",
      blocks: [
        `Les pages du site sont servies par ${E.siteHost}.`,
        "Les comptes, les exercices et les résultats des élèves sont conservés sur l'infrastructure cloud de Convex. La politique de confidentialité détaille les prestataires qui reçoivent des données.",
      ],
    },
    {
      title: "Propriété intellectuelle",
      blocks: [
        "Le site, les textes, les exercices, les images, les voix, le personnage Pio, le nom Jotna et son logo sont protégés par le droit de la propriété intellectuelle.",
        "Toute reproduction, copie, extraction ou réutilisation, même partielle, sans l'accord écrit de l'éditeur est interdite. Cela vaut aussi pour la copie automatisée du contenu pédagogique.",
      ],
    },
    {
      title: "Données personnelles",
      blocks: [
        "Le traitement des données est décrit dans la politique de confidentialité et dans la page sur la protection des mineurs.",
      ],
    },
    {
      title: "Droit applicable",
      blocks: [
        "Le site est soumis au droit sénégalais. En cas de litige qui ne se règle pas à l'amiable, les tribunaux compétents sont ceux du ressort du siège de l'éditeur.",
      ],
    },
    {
      title: "Signaler un contenu",
      blocks: [
        `Pour signaler une erreur dans un exercice ou un contenu qui pose problème, écrivez à ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};

const cgu: LegalDoc = {
  slug: "cgu",
  label: "Conditions générales",
  title: "Conditions générales d'utilisation",
  description:
    "Les règles d'usage de Jotna School pour les écoles, les professeurs, les parents et les élèves.",
  sections: [
    {
      title: "1. Objet",
      blocks: [
        "Jotna School est une plateforme d'exercices pour les élèves du CP au CM2. Ces conditions fixent les règles d'usage du site web et de l'application mobile. Utiliser Jotna vaut acceptation de ces règles.",
      ],
    },
    {
      title: "2. Qui utilise Jotna",
      blocks: [
        "Quatre rôles existent : le directeur et les professeurs d'une école, les parents, et les élèves.",
        "Un élève mineur utilise Jotna sous la responsabilité de son école ou de son représentant légal. L'école ou le parent qui fournit le compte garantit avoir le droit de le faire.",
      ],
    },
    {
      title: "3. Comptes et codes",
      blocks: [
        "Un compte est ouvert par l'école ou, pour un parent, avec le code que l'école lui remet. L'élève se connecte avec le code imprimé sur son billet. Ce code sert à la fois d'identifiant et de mot de passe.",
        {
          list: [
            "Gardez les codes confidentiels. Ne les partagez pas en dehors de la famille et de l'école.",
            "Vous répondez de ce qui est fait avec vos codes. Prévenez-nous dès que vous pensez qu'un code est connu d'un tiers.",
            "Un élève à code ne peut pas réinitialiser seul son accès : un adulte de son école le fait.",
          ],
        },
      ],
    },
    {
      title: "4. Offre et prix",
      blocks: [
        "Pendant la période de lancement, l'accès à Jotna est gratuit. Les écoles qui souscrivent une offre payante sont soumises aux conditions de leur contrat et de leur facture.",
        "Tout changement de prix est annoncé à l'avance par un message dans l'application ou par courriel.",
      ],
    },
    {
      title: "5. Règles d'usage",
      blocks: [
        "Vous vous engagez à ne pas :",
        {
          list: [
            "copier, aspirer ou extraire de façon automatisée les exercices, les images, les voix ou le code ;",
            "contourner les limites d'accès, de quota ou de sécurité ;",
            "essayer d'accéder au compte d'une autre personne ;",
            "publier ou transmettre un contenu illicite, injurieux ou qui porte atteinte à un enfant ;",
            "faire de l'ingénierie inverse du service, sauf si la loi l'autorise.",
          ],
        },
      ],
    },
    {
      title: "6. Exercices, voix et intelligence artificielle",
      blocks: [
        `Une partie des exercices et des explications est fabriquée par le code de Jotna, une autre avec l'aide d'une intelligence artificielle. Nous contrôlons le contenu, mais une erreur reste possible. Signalez-la à ${CONTACT_EMAIL}.`,
        "Jotna complète l'enseignement d'un professeur. Il ne le remplace pas et ne garantit aucun résultat scolaire.",
      ],
    },
    {
      title: "7. Droits sur le contenu",
      blocks: [
        "Jotna vous accorde un droit d'usage personnel, non exclusif et non cessible, pour la durée de votre accès. Les droits sur le service et son contenu restent à l'éditeur (voir les mentions légales).",
        "Les réponses et les résultats d'un élève restent ceux de l'élève. Jotna les utilise pour faire fonctionner le service, comme le décrit la politique de confidentialité.",
      ],
    },
    {
      title: "8. Disponibilité",
      blocks: [
        "Nous faisons de notre mieux pour que le service soit disponible, mais nous ne pouvons pas garantir une absence d'interruption. Certaines fonctions, comme l'écoute de la voix de Pio ou la vérification d'une prononciation, demandent une connexion Internet. L'application mobile garde une partie des contenus pour fonctionner hors connexion.",
      ],
    },
    {
      title: "9. Responsabilité",
      blocks: [
        "Dans les limites permises par la loi, Jotna n'est pas responsable des dommages indirects, des pertes de données dues à l'appareil de l'utilisateur ou d'un usage contraire à ces conditions. Cette clause ne limite aucun droit que la loi vous reconnaît.",
      ],
    },
    {
      title: "10. Suspension et fin d'accès",
      blocks: [
        `L'éditeur peut suspendre un compte qui ne respecte pas ces conditions, après en avoir informé l'école ou le parent quand c'est possible. Vous pouvez demander la fermeture d'un compte à tout moment en écrivant à ${CONTACT_EMAIL}.`,
      ],
    },
    {
      title: "11. Données personnelles",
      blocks: [
        "La politique de confidentialité et la page sur la protection des mineurs font partie de ces conditions.",
      ],
    },
    {
      title: "12. Modification des conditions",
      blocks: [
        "Nous pouvons modifier ces conditions. La date de la dernière révision figure en haut de la page. Un changement important est annoncé dans l'application ou par courriel.",
      ],
    },
    {
      title: "13. Droit applicable et litiges",
      blocks: [
        "Ces conditions sont soumises au droit sénégalais. Avant toute action en justice, écrivez-nous pour chercher une solution amiable. À défaut, les tribunaux compétents sont ceux du ressort du siège de l'éditeur.",
      ],
    },
  ],
};

const confidentialite: LegalDoc = {
  slug: "confidentialite",
  label: "Politique de confidentialité",
  title: "Politique de confidentialité",
  description:
    "Quelles données Jotna School collecte, pourquoi, qui les reçoit et comment exercer vos droits.",
  sections: [
    {
      title: "Qui est responsable de vos données",
      blocks: [
        `Le responsable du traitement est ${E.name} (voir les mentions légales). Contact : ${CONTACT_EMAIL}.`,
        "Ce texte s'appuie sur la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel.",
      ],
    },
    {
      title: "Les données que nous collectons",
      blocks: [
        "Nous collectons le minimum utile au fonctionnement du service.",
        {
          list: [
            "Élève : nom affiché, avatar, niveau de classe, code élève, préférences d'affichage. Pas d'adresse électronique.",
            "Parent, professeur, directeur : nom, adresse électronique, mot de passe (conservé sous forme protégée).",
            "École : nom, ville, personne à contacter, courriel, téléphone et NINEA pour la facture.",
            "Progression : exercices tentés, réponses, scores, étoiles, badges et résultats par thème.",
            "Paiement : facture et état du paiement d'une école.",
            "Liste d'attente du site : adresse électronique et profil (parent, professeur ou école).",
            "Journal technique : les appels à l'intelligence artificielle sont comptés (date, modèle, coût) pour tenir le budget.",
          ],
        },
        "Les informations demandées pour ouvrir un compte sont obligatoires : sans elles, le compte ne peut pas être ouvert. L'avatar et les préférences d'affichage sont facultatifs.",
      ],
    },
    {
      title: "Pourquoi nous utilisons ces données",
      blocks: [
        {
          list: [
            "fournir le compte, les exercices et le suivi de progression ;",
            "montrer aux parents et aux professeurs les résultats de leurs enfants et de leurs élèves ;",
            "envoyer les courriels utiles : réinitialisation de mot de passe, demande de rattachement, bulletin, facture ;",
            "facturer les écoles ;",
            "sécuriser le service et en maîtriser le coût.",
          ],
        },
        "Nous ne vendons pas les données et nous n'affichons aucune publicité.",
      ],
    },
    {
      title: "La voix des enfants",
      blocks: [
        "Dans le module d'arabe, l'enfant peut appuyer sur un bouton pour répéter un mot. Le micro ne s'ouvre qu'à ce moment, pendant huit secondes au plus. L'enregistrement part vers le service de transcription d'ElevenLabs, qui rend un texte. Jotna ne conserve ni l'enregistrement ni la transcription. Il garde seulement la date, l'exercice et le fait que la réponse était juste ou non.",
        "La voix de Pio est une voix de synthèse fabriquée à partir des textes du parcours, jamais à partir de données sur un enfant.",
      ],
    },
    {
      title: "L'intelligence artificielle",
      blocks: [
        "Jotna utilise une intelligence artificielle pour fabriquer des exercices, vérifier certaines réponses courtes et expliquer une erreur. Les demandes décrivent un exercice et, parfois, la réponse donnée par un élève. Elles ne contiennent ni nom ni adresse électronique.",
        "Elles passent par la passerelle Vercel AI Gateway, avec OpenAI en solution de repli.",
      ],
    },
    {
      title: "Qui reçoit des données",
      blocks: [
        "Ces prestataires traitent des données pour notre compte :",
        {
          list: [
            "Convex : base de données et fonctions du service.",
            `${E.siteHost} : hébergement des pages du site.`,
            "ElevenLabs : voix de synthèse et transcription de la voix.",
            "Vercel AI Gateway et OpenAI : intelligence artificielle.",
            "Resend : envoi des courriels.",
            "PayDunya et Bictorys : paiement des écoles.",
          ],
        },
        "Nous ne leur transmettons que ce qui est nécessaire à leur mission. Nous ne communiquons pas les données d'un élève à un autre parent ou à une autre école.",
        "Ces prestataires peuvent se trouver hors du Sénégal. Vos données peuvent donc être transférées à l'étranger.",
      ],
    },
    {
      title: "Combien de temps nous les gardons",
      blocks: [
        "Les données d'un compte sont conservées tant que le compte existe. Sur demande de l'école ou du parent, nous les supprimons ou nous les anonymisons. Les factures sont gardées le temps que la loi comptable l'exige.",
      ],
    },
    {
      title: "Sécurité",
      blocks: [
        `Les connexions sont chiffrées. L'accès aux données est limité par rôle : un parent ne voit que ses enfants, un professeur que ses classes, une école que ses élèves. Aucun service n'est parfait : prévenez-nous à ${CONTACT_EMAIL} si vous constatez un problème.`,
      ],
    },
    {
      title: "Vos droits",
      blocks: [
        "Vous pouvez demander l'accès à vos données, leur correction, leur suppression, ou vous opposer à un usage. Vous pouvez aussi demander à ne plus figurer dans nos fichiers. Pour un élève mineur, le parent ou le représentant légal exerce ces droits.",
        `Écrivez à ${CONTACT_EMAIL}. Nous pouvons demander une preuve d'identité avant d'agir. Nous répondons à une demande de correction ou de suppression dans un délai d'un mois.`,
        "Vous pouvez aussi saisir la Commission de protection des données personnelles (CDP) du Sénégal.",
      ],
    },
    {
      title: "Changements",
      blocks: [
        "Nous mettons ce texte à jour quand le service change. La date de la dernière révision figure en haut de la page.",
      ],
    },
  ],
};

const cookies: LegalDoc = {
  slug: "cookies",
  label: "Cookies",
  title: "Cookies et stockage local",
  description:
    "Ce que Jotna School enregistre dans votre navigateur ou sur votre appareil, et pourquoi.",
  sections: [
    {
      title: "Aucun traceur publicitaire",
      blocks: [
        "Jotna n'utilise ni cookie publicitaire, ni outil de mesure d'audience, ni contenu de réseau social. C'est pourquoi le site n'affiche pas de bannière de consentement.",
      ],
    },
    {
      title: "Ce qui est enregistré, et pourquoi",
      blocks: [
        "Quelques données restent dans le navigateur ou dans l'application parce que le service ne marcherait pas sans elles :",
        {
          list: [
            "le jeton de connexion, qui vous évite de saisir votre code à chaque page ;",
            "les préférences d'affichage et l'avancement de la visite guidée ;",
            "dans l'application mobile, les exercices et les sons téléchargés pour jouer sans connexion.",
          ],
        },
        "Ces données restent sur votre appareil. Elles ne servent pas à vous suivre d'un site à l'autre.",
      ],
    },
    {
      title: "Les effacer",
      blocks: [
        "Se déconnecter supprime le jeton de connexion. Vous pouvez aussi effacer les données du site dans les réglages de votre navigateur, ou désinstaller l'application. Vous devrez alors vous reconnecter.",
      ],
    },
  ],
};

const mineurs: LegalDoc = {
  slug: "mineurs",
  label: "Protection des mineurs",
  title: "Protection des mineurs",
  description:
    "Comment Jotna School protège les enfants du CP au CM2 qui utilisent le service.",
  sections: [
    {
      title: "Un service pour des enfants",
      blocks: [
        "L'espace élève s'adresse à des enfants du CP au CM2. Nous le concevons en conséquence : peu de données, aucune publicité, des consignes lues à voix haute pour les enfants qui apprennent à lire.",
      ],
    },
    {
      title: "Qui ouvre le compte",
      blocks: [
        "Un enfant ne s'inscrit pas seul. Son école crée son compte, ou son parent l'active avec un code remis par l'école. L'enfant se connecte avec un code et n'a pas besoin d'adresse électronique.",
        "En ouvrant ou en activant un compte, l'école ou le parent confirme avoir le droit de le faire pour cet enfant.",
      ],
    },
    {
      title: "Ce que nous collectons sur un enfant",
      blocks: [
        "Son nom affiché, son avatar, son niveau, et ses résultats aux exercices. Nous ne lui demandons ni photo, ni adresse, ni téléphone.",
      ],
    },
    {
      title: "Le micro",
      blocks: [
        "Le micro ne s'ouvre que lorsque l'enfant appuie sur le bouton d'un exercice de prononciation. Il se coupe à la fin de la phrase, au bout de huit secondes au plus, et quand l'enfant quitte l'écran. Aucune voix n'est conservée.",
      ],
    },
    {
      title: "Le rôle des parents et de l'école",
      blocks: [
        {
          list: [
            "Un parent voit la progression de son enfant et règle ses options de bien-être, comme les séries de jours ou la mission du jour.",
            "Un professeur voit les résultats des élèves de ses classes.",
            "Le parent ou l'école peut demander l'accès, la correction ou la suppression des données de l'enfant.",
          ],
        },
        `Pour exercer ces droits ou signaler une inquiétude, écrivez à ${CONTACT_EMAIL}.`,
      ],
    },
    {
      title: "Ce que Jotna ne fait pas",
      blocks: [
        {
          list: [
            "afficher de la publicité ;",
            "vendre ou louer des données d'enfants ;",
            "profiler un enfant pour du marketing.",
          ],
        },
      ],
    },
  ],
};

const accessibilite: LegalDoc = {
  slug: "accessibilite",
  label: "Accessibilité",
  title: "Accessibilité",
  description:
    "L'état de l'accessibilité de Jotna School et comment signaler un problème.",
  sections: [
    {
      title: "Notre engagement",
      blocks: [
        "Jotna veut être utilisable par tous les enfants et par tous les adultes qui les accompagnent. Les consignes des exercices sont lues à voix haute pour les enfants qui apprennent à lire, et l'interface s'adapte aux téléphones, aux tablettes et aux ordinateurs.",
      ],
    },
    {
      title: "État actuel",
      blocks: [
        "Jotna n'a pas encore fait l'objet d'un audit d'accessibilité complet. Nous ne pouvons donc pas déclarer de niveau de conformité à une norme. Certaines parties peuvent encore poser des difficultés, notamment pour les personnes qui utilisent un lecteur d'écran.",
      ],
    },
    {
      title: "Signaler un problème",
      blocks: [
        `Si vous ne parvenez pas à utiliser une page ou un exercice, écrivez à ${CONTACT_EMAIL} en indiquant la page, l'appareil et la difficulté rencontrée. Nous lirons chaque message et nous corrigerons ce qui peut l'être.`,
      ],
    },
  ],
};

export const LEGAL_DOCS: LegalDoc[] = [
  mentions,
  cgu,
  confidentialite,
  cookies,
  mineurs,
  accessibilite,
];

export function getLegalDoc(slug: string): LegalDoc {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug);
  if (!doc) throw new Error(`Texte légal inconnu : ${slug}`);
  return doc;
}

export function legalHref(slug: string): string {
  return `/legal/${slug}`;
}

/** Les liens du pied de page, dans l'ordre d'affichage. */
export const LEGAL_LINKS = LEGAL_DOCS.map((doc) => ({
  label: doc.label,
  href: legalHref(doc.slug),
}));

export function legalMetadata(slug: string): Metadata {
  const doc = getLegalDoc(slug);
  return {
    title: `${doc.title} | Jotna School`,
    description: doc.description,
  };
}
