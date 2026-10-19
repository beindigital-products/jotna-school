/**
 * LA BANQUE DES EXERCICES CLASSIQUES, matière par matière.
 *
 * Un fichier par matière, chargé À LA DEMANDE : la vitrine ne télécharge que la
 * matière que le visiteur regarde (une quinzaine de kilo-octets compressés),
 * pas les huit. La promesse est gardée pour la durée de la page, et la banque
 * déjà arrivée se lit sans attendre (`peekBank`) : revenir à une matière déjà
 * vue ne recharge rien et n'affiche pas de cartes vides.
 */
import type { DemoSubject, SubjectBank } from "../demo-types";

const LOADERS: Record<DemoSubject, () => Promise<SubjectBank>> = {
  francais: () => import("./francais").then((module) => module.BANK),
  mathematiques: () => import("./mathematiques").then((module) => module.BANK),
  "eveil-scientifique": () => import("./eveil-scientifique").then((module) => module.BANK),
  histoire: () => import("./histoire").then((module) => module.BANK),
  geographie: () => import("./geographie").then((module) => module.BANK),
  "instruction-civique": () => import("./instruction-civique").then((module) => module.BANK),
  "education-artistique": () => import("./education-artistique").then((module) => module.BANK),
  anglais: () => import("./anglais").then((module) => module.BANK),
};

const loaded = new Map<DemoSubject, Promise<SubjectBank>>();
const ready = new Map<DemoSubject, SubjectBank>();

/** La banque d'une matière déjà chargée, ou `undefined` : de quoi s'afficher sans attendre. */
export function peekBank(subject: DemoSubject): SubjectBank | undefined {
  return ready.get(subject);
}

export function loadBank(subject: DemoSubject): Promise<SubjectBank> {
  let promise = loaded.get(subject);
  if (!promise) {
    const pending = LOADERS[subject]();
    promise = pending;
    loaded.set(subject, pending);
    pending.then(
      (bank) => {
        ready.set(subject, bank);
      },
      () => {
        // Un échec (le réseau tombe) ne se garde pas : « Réessayer » redemande le fichier.
        if (loaded.get(subject) === pending) loaded.delete(subject);
      },
    );
  }
  return promise;
}
