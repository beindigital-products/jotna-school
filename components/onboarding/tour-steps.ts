/**
 * Les étapes de la visite guidée, par espace. Chaque étape pointe un élément
 * réel de l'écran par sa clé `data-tour` (voir `components/onboarding/tour.tsx`)
 * et dit ce qu'on y fait. Une étape sans cible s'affiche au centre.
 *
 * Les clés de navigation sont posées par les layouts : `nav-` suivi du dernier
 * segment de l'adresse (`/parent/children` donne `nav-children`).
 */

export type TourRole = "parent" | "teacher" | "school" | "student";

export type TourStep = {
  title: string;
  body: string;
  /** Clé `data-tour` de l'élément à éclairer. */
  target?: string;
  position?: "right" | "left" | "top" | "bottom";
  points?: string[];
};

const PARENT: TourStep[] = [
  {
    title: "Votre espace parent",
    body: "Faisons le tour du menu. Chaque page sert à suivre vos enfants.",
  },
  {
    title: "Tableau de bord",
    target: "nav-dashboard",
    position: "right",
    body: "Vos enfants en un coup d'œil, avec un accès direct à leur progression.",
  },
  {
    title: "Mes enfants",
    target: "nav-children",
    position: "right",
    body: "Ici, vous gérez les comptes de la famille.",
    points: [
      "Créer le compte d'un enfant",
      "Son code de connexion, à taper dans l'application",
      "Son code élève, à donner à son professeur",
    ],
  },
  {
    title: "Rapports",
    target: "nav-reports",
    position: "right",
    body: "Les rapports de progression générés pour vos enfants.",
  },
  {
    title: "Paramètres",
    target: "nav-settings",
    position: "right",
    body: "Votre nom, votre photo et la réception des bulletins par courriel.",
  },
  {
    title: "Votre compte",
    target: "user-menu",
    position: "right",
    body: "Votre profil et la déconnexion se trouvent ici.",
  },
];

const TEACHER: TourStep[] = [
  {
    title: "Votre espace professeur",
    body: "Faisons le tour du menu. Chaque page sert à suivre vos classes.",
  },
  {
    title: "Tableau de bord",
    target: "nav-dashboard",
    position: "right",
    body: "Vos premiers pas, vos exercices et les résultats de vos élèves.",
  },
  {
    title: "Mes classes",
    target: "nav-classes",
    position: "right",
    body: "Le cœur de votre espace.",
    points: [
      "Créer une classe et choisir son niveau",
      "Y ajouter vos élèves : créer leur compte ou saisir leur code élève",
    ],
  },
  {
    title: "Mes élèves",
    target: "nav-students",
    position: "right",
    body: "Tous les élèves de vos classes, au même endroit.",
  },
  {
    title: "Rapports",
    target: "nav-reports",
    position: "right",
    body: "Les rapports générés pour vos élèves.",
  },
  {
    title: "Paramètres",
    target: "nav-settings",
    position: "right",
    body: "Votre nom, votre photo et vos préférences.",
  },
  {
    title: "À vous de jouer",
    body: "Ouvrez « Mes classes » : créez votre première classe, puis ajoutez-y votre premier élève.",
  },
];

const SCHOOL: TourStep[] = [
  {
    title: "L'espace de votre école",
    body: "Tout se passe sur une seule page. Voyons ce qu'elle contient.",
  },
  {
    title: "Mon école",
    target: "nav-dashboard",
    position: "right",
    body: "Une seule page, trois blocs.",
    points: [
      "Le code école, à donner à vos professeurs",
      "Les professeurs qui l'ont saisi",
      "Les classes, avec leurs élèves",
    ],
  },
  {
    title: "Votre compte",
    target: "user-menu",
    position: "right",
    body: "Votre profil et la déconnexion se trouvent ici.",
  },
  {
    title: "À vous de jouer",
    body: "Partagez le code école avec vos professeurs, puis créez vos classes.",
  },
];

const STUDENT: TourStep[] = [
  {
    title: "Bienvenue au camp !",
    body: "Pio t'accompagne pour apprendre en t'amusant. Voici où trouver chaque chose.",
  },
  {
    title: "Camp",
    target: "nav-home",
    position: "bottom",
    body: "Ta maison. Tu y retrouves ce que tu as à faire aujourd'hui.",
  },
  {
    title: "Carte",
    target: "nav-map",
    position: "bottom",
    body: "Choisis une matière, puis une thématique, et avance étape par étape.",
  },
  {
    title: "Trophées",
    target: "nav-badges",
    position: "bottom",
    body: "Les badges que tu gagnes en réussissant des exercices.",
  },
  {
    title: "Carnet",
    target: "nav-profil",
    position: "bottom",
    body: "Tes progrès et ton profil.",
  },
];

export const TOUR_STEPS: Record<TourRole, TourStep[]> = {
  parent: PARENT,
  teacher: TEACHER,
  school: SCHOOL,
  student: STUDENT,
};
