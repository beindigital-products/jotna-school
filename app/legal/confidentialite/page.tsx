import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Jotna School",
  description:
    "Quelles données Jotna School collecte, pourquoi, qui les reçoit et comment les parents gardent la main.",
};

const CONTACT = "contact@jotnaschool.com";
const UPDATED = "9 octobre 2026";

type Section = { title: string; body: Array<string | string[]> };

// Un tableau de chaînes dans `body` s'affiche comme une liste à puces.
const SECTIONS: Section[] = [
  {
    title: "Qui est responsable de vos données",
    body: [
      "Jotna School est éditée par Be In Digital. Be In Digital décide pourquoi et comment les données décrites ici sont utilisées.",
      `Pour toute question ou demande sur vos données, écrivez à ${CONTACT}.`,
    ],
  },
  {
    title: "À qui s'adresse cette page",
    body: [
      "Jotna School est une application de révision pour les élèves du CP au CM2. Elle est utilisée avec un parent, un professeur ou une école, qui ouvrent le compte de l'enfant.",
      "Un enfant ne crée jamais seul son compte avec ses données personnelles. Le compte de l'élève est ouvert par un adulte, ou par son école.",
    ],
  },
  {
    title: "Les données que nous collectons",
    body: [
      "Pour l'élève :",
      [
        "son prénom ou le nom affiché sur son profil, et son avatar ;",
        "son niveau de classe (CP à CM2), fourni par l'école ou le parent ;",
        "son code élève et son code de connexion ;",
        "ses résultats : réponses aux exercices, étoiles, trophées, niveau et progression par thème.",
      ],
      "Pour les parents, les professeurs et les écoles :",
      [
        "le nom, l'adresse e-mail et, s'il est renseigné, le numéro de téléphone ;",
        "pour une école ou une classe, son nom et la liste des élèves rattachés ;",
        "les liens entre un parent et ses enfants.",
      ],
      "Pour les exercices de prononciation en arabe :",
      [
        "la voix de l'enfant, enregistrée pendant 8 secondes au plus, quand il appuie sur le bouton micro. L'enregistrement n'est jamais conservé : il sert à vérifier la prononciation, puis il est effacé. Nous gardons seulement le résultat (juste, presque ou à refaire).",
      ],
      "Nous ne collectons ni la position de l'appareil, ni les contacts, ni les photos, ni l'identifiant publicitaire.",
    ],
  },
  {
    title: "Pourquoi nous utilisons ces données",
    body: [
      [
        "faire fonctionner les comptes, la connexion et les classes ;",
        "proposer à chaque élève des exercices de son niveau et suivre sa progression ;",
        "envoyer aux parents et aux professeurs les bilans de progression ;",
        "vérifier la prononciation et faire parler l'application ;",
        "protéger le service contre les abus et corriger les erreurs.",
      ],
      "Nous ne vendons aucune donnée. Nous n'affichons aucune publicité et nous ne faisons aucun profilage publicitaire.",
    ],
  },
  {
    title: "Qui reçoit les données",
    body: [
      "Nous faisons appel à quelques prestataires techniques. Ils traitent les données pour notre compte, et seulement pour cela :",
      [
        "Convex : base de données et serveur de l'application ;",
        "Vercel : hébergement du site ;",
        "ElevenLabs : transformation de la voix de l'enfant en texte pour vérifier la prononciation, et voix de synthèse de l'application ;",
        "OpenAI : aide à la préparation d'exercices et à l'explication des erreurs, ainsi que lecture des documents de cours que les professeurs envoient ;",
        "Resend : envoi des e-mails (bilans, changement de mot de passe).",
      ],
      "Certains de ces prestataires sont situés hors du Sénégal, notamment aux États-Unis ou dans l'Union européenne. Nous ne leur transmettons que les données utiles à leur service.",
    ],
  },
  {
    title: "Combien de temps nous gardons les données",
    body: [
      "Nous gardons les données du compte tant que le compte existe. Si le compte est supprimé, les données de l'élève et ses résultats sont supprimés avec lui, sauf ce que la loi nous oblige à conserver.",
      "Les enregistrements de voix ne sont pas conservés.",
    ],
  },
  {
    title: "Vos droits et ceux de votre enfant",
    body: [
      "Vous pouvez demander à tout moment l'accès aux données, leur correction, leur suppression ou la clôture du compte. Un parent exerce ces droits pour son enfant.",
      `Écrivez à ${CONTACT} en indiquant le nom du compte concerné. Nous répondons dans un délai d'un mois.`,
      "Vous pouvez aussi vous adresser à l'autorité de protection des données de votre pays. Au Sénégal, c'est la Commission de protection des données personnelles (CDP), selon la loi n° 2008-12.",
    ],
  },
  {
    title: "Sécurité",
    body: [
      "Les échanges entre l'application et nos serveurs sont chiffrés. L'accès aux données est limité aux personnes qui en ont besoin pour faire fonctionner le service. Aucun système n'est parfait : si une faille touchait vos données, nous vous préviendrions.",
    ],
  },
  {
    title: "Changements de cette page",
    body: [
      "Si cette politique change, nous mettons la date en haut de page à jour. Pour un changement important, nous prévenons aussi les parents par e-mail.",
    ],
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Dernière mise à jour : {UPDATED}
        </p>
        <p className="mt-6 leading-7 text-gray-700">
          Cette page explique, en mots simples, ce que Jotna School fait des
          données de vos enfants et des vôtres. Elle couvre le site{" "}
          <Link href="/" className="underline">
            jotnaschool.com
          </Link>{" "}
          et l&apos;application Android Jotna School.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3 leading-7 text-gray-700">
              {section.body.map((block, i) =>
                Array.isArray(block) ? (
                  <ul key={i} className="list-disc space-y-1.5 pl-6">
                    {block.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{block}</p>
                ),
              )}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
