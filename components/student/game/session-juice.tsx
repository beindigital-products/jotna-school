"use client";

import { createContext, useContext, useState } from "react";
import type { AnswerOutcome } from "./answer-feedback";

/**
 * CE QUE LA SÉANCE FÊTE — la série de bonnes réponses et les étoiles gagnées.
 *
 * Deux petites choses qui font d'une suite d'exercices une partie :
 *   - LA SÉRIE : les bonnes réponses trouvées DU PREMIER COUP, d'affilée. À
 *     partir de deux, une flamme s'allume dans l'en-tête (« ×3 ») et la scène
 *     de réponse le dit. Une erreur l'éteint, sans un mot : rien n'est perdu,
 *     rien n'est repris à l'enfant, la flamme repart à la prochaine réussite.
 *   - LE GAIN : les étoiles que la dernière réponse vient de rapporter. Le
 *     compteur de l'en-tête gonfle, un « +3 » s'en détache, et la scène de
 *     réponse montre les étoiles une à une.
 *
 * RIEN N'EST ENREGISTRÉ. C'est de la mise en scène, tenue par la coque
 * (`session-stage.tsx`) à partir de ce que les deux séances lui passent déjà :
 * la réponse en cours, les essais ratés, les étoiles de la séance. Le serveur
 * (ou l'appareil, hors ligne) reste seul à compter les étoiles et les cauris.
 * Une séance reprise après une pause repart avec une série à zéro.
 *
 * `nextJuice` est pur : les tests le lisent sans monter la coque.
 */
export type SessionJuice = {
  /** Bonnes réponses du premier coup, d'affilée. */
  combo: number;
  /** Étoiles rapportées par la dernière réponse ; 0 dès que la question suivante arrive. */
  gained: number;
  /** Change à chaque gain : rejoue l'animation du compteur. */
  gainKey: number;
};

export type JuiceState = SessionJuice & {
  /** La dernière réponse vue (par identité : une réponse, un objet). */
  seen: AnswerOutcome | null;
  /** Les étoiles de la séance au dernier rendu. */
  stars: number;
};

/** À partir de combien de réussites d'affilée la flamme s'allume. */
export const COMBO_MIN = 2;

export function initialJuice(outcome: AnswerOutcome | null, stars: number, combo = 0): JuiceState {
  return { seen: outcome, stars, combo: Math.max(0, combo), gained: 0, gainKey: 0 };
}

export function nextJuice(
  state: JuiceState,
  input: { outcome: AnswerOutcome | null; failedAttempts: number; stars: number },
): JuiceState {
  let { combo, gained, gainKey } = state;

  if (input.outcome !== state.seen) {
    if (input.outcome === null) {
      // La scène de réponse est partie : le gain a été montré.
      gained = 0;
    } else if (input.outcome.correct) {
      // Du premier coup, la série monte ; trouvée après une erreur, elle reste éteinte.
      combo = input.failedAttempts === 0 ? combo + 1 : 0;
    } else {
      combo = 0;
    }
  }

  if (input.stars > state.stars) {
    gained = input.stars - state.stars;
    gainKey += 1;
  } else if (input.stars < state.stars) {
    // Le palier recommence : tout repart de zéro.
    combo = 0;
    gained = 0;
  }

  if (
    input.outcome === state.seen &&
    input.stars === state.stars &&
    combo === state.combo &&
    gained === state.gained &&
    gainKey === state.gainKey
  ) {
    return state;
  }
  return { seen: input.outcome, stars: input.stars, combo, gained, gainKey };
}

/**
 * L'état tenu par la coque. Il se calcule PENDANT le rendu (le motif « état
 * dérivé des props » de React) : la flamme et le « +3 » sont dans la même
 * image que la réponse, pas une image plus tard.
 */
export function useSessionJuiceState(
  outcome: AnswerOutcome | null,
  failedAttempts: number,
  stars: number | undefined,
  comboStart = 0,
): SessionJuice {
  const [state, setState] = useState<JuiceState>(() => initialJuice(outcome, stars ?? 0, comboStart));
  const next = nextJuice(state, { outcome, failedAttempts, stars: stars ?? 0 });
  if (next !== state) setState(next);
  return next;
}

const NONE: SessionJuice = { combo: 0, gained: 0, gainKey: 0 };

const SessionJuiceContext = createContext<SessionJuice>(NONE);

export const SessionJuiceProvider = SessionJuiceContext.Provider;

/** Hors d'une séance (la vitrine, la galerie) : ni série ni gain. */
export function useSessionJuice(): SessionJuice {
  return useContext(SessionJuiceContext);
}
