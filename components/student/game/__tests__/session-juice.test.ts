import { describe, expect, it } from "vitest";
import type { AnswerOutcome } from "../answer-feedback";
import { COMBO_MIN, initialJuice, nextJuice, type JuiceState } from "../session-juice";

const right = (): AnswerOutcome => ({ correct: true, attemptsRemaining: 5 });
const wrong = (left: number): AnswerOutcome => ({ correct: false, attemptsRemaining: left });

/** Une bonne réponse du premier coup, puis la question suivante. */
function winFirstTry(state: JuiceState, starsAfter: number): JuiceState {
  const answered = nextJuice(state, { outcome: right(), failedAttempts: 0, stars: starsAfter });
  return nextJuice(answered, { outcome: null, failedAttempts: 0, stars: starsAfter });
}

describe("nextJuice — la série et le gain d'une séance", () => {
  it("ne change rien tant que rien ne change : le même objet revient", () => {
    const state = initialJuice(null, 0);
    expect(nextJuice(state, { outcome: null, failedAttempts: 0, stars: 0 })).toBe(state);
  });

  it("la série monte à chaque réussite du premier coup, et la flamme s'allume à deux", () => {
    let state = initialJuice(null, 0);
    state = winFirstTry(state, 3);
    expect(state.combo).toBe(1);
    expect(state.combo >= COMBO_MIN).toBe(false);
    state = winFirstTry(state, 6);
    expect(state.combo).toBe(2);
    expect(state.combo >= COMBO_MIN).toBe(true);
  });

  it("une erreur éteint la série, et une réponse trouvée après une erreur ne la rallume pas", () => {
    let state = initialJuice(null, 6, 2);
    state = nextJuice(state, { outcome: wrong(4), failedAttempts: 1, stars: 6 });
    expect(state.combo).toBe(0);
    state = nextJuice(state, { outcome: null, failedAttempts: 1, stars: 6 });
    state = nextJuice(state, { outcome: right(), failedAttempts: 1, stars: 8 });
    expect(state.combo).toBe(0);
    // La réussite suivante, du premier coup, repart à un.
    state = nextJuice(state, { outcome: null, failedAttempts: 0, stars: 8 });
    state = winFirstTry(state, 11);
    expect(state.combo).toBe(1);
  });

  it("le gain est ce que la réponse vient de rapporter, et s'efface à la question suivante", () => {
    let state = initialJuice(null, 4);
    state = nextJuice(state, { outcome: right(), failedAttempts: 0, stars: 7 });
    expect(state.gained).toBe(3);
    expect(state.gainKey).toBe(1);
    state = nextJuice(state, { outcome: null, failedAttempts: 0, stars: 7 });
    expect(state.gained).toBe(0);
    // Une réponse juste qui ne rapporte aucune étoile ne ressort pas le gain d'avant.
    state = nextJuice(state, { outcome: right(), failedAttempts: 3, stars: 7 });
    expect(state.gained).toBe(0);
    expect(state.gainKey).toBe(1);
  });

  it("le palier qui recommence remet la série et le gain à zéro", () => {
    let state = initialJuice(null, 9, 3);
    state = nextJuice(state, { outcome: null, failedAttempts: 0, stars: 0 });
    expect(state.combo).toBe(0);
    expect(state.gained).toBe(0);
    expect(state.stars).toBe(0);
  });
});
