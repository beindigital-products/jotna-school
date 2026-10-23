/**
 * Les dessins sur quadrillage ne se répètent pas d'un palier à l'autre d'une même thématique.
 *
 * En production, trois paliers de quatre `pixel-copie` tirés dans onze motifs en reprenaient trois (« l'escalier », « la petite
 * fleur », « la croix »). Chaque palier préfère maintenant ses motifs (`pickMotif`, pixel.ts). Ces tests n'en lisent pas la
 * règle : ils fabriquent les paliers d'une thématique par `generateGames`, comme le fait la fabrication, et comparent les dessins.
 */
import { describe, expect, it, vi } from "vitest";
import { generateGames, type GameKind } from "../paliers/games";
import type { PixelArtPayload } from "../paliers/games/types";
import type { VisibleClassName } from "../curriculum";

vi.setConfig({ testTimeout: 30_000 });

const SEEDS = Array.from({ length: 80 }, (_, i) => `motifs-${i}`);

/** Les trois formes de thématique : trois paliers (CI, CP), quatre (CE), cinq (CM). */
const THEMES: { klass: VisibleClassName; palierCount: number }[] = [
  { klass: "CI", palierCount: 3 },
  { klass: "CP", palierCount: 3 },
  { klass: "CE1", palierCount: 4 },
  { klass: "CE2", palierCount: 4 },
  { klass: "CM1", palierCount: 5 },
];

/** Les jeux qui tirent leur dessin dans le catalogue de motifs. */
const DRAWING_KINDS: GameKind[] = ["pixel-copie", "pixel-memoire", "coloriage-magique"];

/** Le groupe d'un niveau, écrit ici : le niveau 1, le niveau 2, puis les niveaux 3 et 4 qui partagent le dernier. */
const groupOf = (level: number) => (level === 1 ? 0 : level === 2 ? 1 : 2);

type Theme = { klass: VisibleClassName; palierCount: number };
type Palier = { level: number; drawings: string[] };

/** Les dessins (leur grille) de chaque palier d'une thématique, pour une graine. */
function themePaliers(theme: Theme, specs: { kind: GameKind; count: number }[], seed: string): Palier[] {
  return Array.from({ length: theme.palierCount }, (_, i) => {
    const games = generateGames(specs, {
      klass: theme.klass,
      palierIndex: i + 1,
      palierCount: theme.palierCount,
      seed: `${seed}-p${i + 1}`,
    });
    const level = (games[0].payload as unknown as { game: { level: number } }).game.level;
    const drawings = games.map((g) => JSON.stringify((g.payload as unknown as PixelArtPayload).target));
    return { level, drawings };
  });
}

/** Les dessins que deux paliers de groupes différents ont en commun, toutes paires confondues. */
function sharedAcrossGroups(paliers: Palier[]): string[] {
  const shared: string[] = [];
  for (const a of paliers) {
    for (const b of paliers) {
      if (groupOf(a.level) >= groupOf(b.level)) continue;
      shared.push(...a.drawings.filter((d) => b.drawings.includes(d)));
    }
  }
  return shared;
}

describe("pickMotif : un dessin ne revient pas d'un palier à l'autre", () => {
  for (const theme of THEMES) {
    for (const kind of DRAWING_KINDS) {
      it(`${theme.klass}, ${theme.palierCount} paliers, ${kind} : quatre dessins par palier, aucun partagé entre deux groupes`, () => {
        for (const seed of SEEDS) {
          const paliers = themePaliers(theme, [{ kind, count: 4 }], seed);
          for (const p of paliers) {
            expect(p.drawings, `${seed}, niveau ${p.level}`).toHaveLength(4);
            expect(new Set(p.drawings).size, `${seed}, niveau ${p.level} : un dessin deux fois`).toBe(4);
          }
          expect(sharedAcrossGroups(paliers), seed).toEqual([]);
        }
      });
    }
  }

  it("un palier qui mêle copier et dessiner de mémoire ne reprend pas non plus un dessin d'un palier à l'autre", () => {
    const specs = [
      { kind: "pixel-copie" as GameKind, count: 2 },
      { kind: "pixel-memoire" as GameKind, count: 2 },
    ];
    for (const theme of THEMES) {
      for (const seed of SEEDS) {
        const paliers = themePaliers(theme, specs, seed);
        for (const p of paliers) expect(new Set(p.drawings).size, `${theme.klass} ${seed}`).toBe(4);
        expect(sharedAcrossGroups(paliers), `${theme.klass} ${seed}`).toEqual([]);
      }
    }
  });

  it("au CE1 et au CE2, le niveau 4 a ses propres dessins : il n'en reprend aucun du niveau 3 (quatre dessins), et au plus un (cinq)", () => {
    for (const theme of THEMES.filter((t) => t.klass === "CE1" || t.klass === "CE2")) {
      for (const seed of SEEDS) {
        const four = themePaliers(theme, [{ kind: "coloriage-magique", count: 4 }], seed);
        const [, , three, fourth] = four;
        expect(three.level, seed).toBe(3);
        expect(fourth.level, seed).toBe(4);
        expect(three.drawings.filter((d) => fourth.drawings.includes(d)), `${theme.klass} ${seed} : niveaux 3 et 4, quatre dessins`).toEqual([]);
        // Cinq dessins par palier (le coloriage magique du CE2) : le groupe du niveau 4 n'en compte que quatre, un seul peut venir d'ailleurs.
        const five = themePaliers(theme, [{ kind: "coloriage-magique", count: 5 }], seed);
        let shared = 0;
        for (let i = 0; i < five.length; i++) for (let j = i + 1; j < five.length; j++) shared += five[i].drawings.filter((d) => five[j].drawings.includes(d)).length;
        expect(shared, `${theme.klass} ${seed} : cinq dessins par palier, toutes paires de paliers`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("au-delà de ses propres motifs, un palier en prend d'autres plutôt que de se répéter", () => {
    for (const theme of THEMES) {
      for (const seed of SEEDS) {
        for (const palier of themePaliers(theme, [{ kind: "pixel-copie", count: 6 }], seed)) {
          expect(palier.drawings, `${theme.klass} ${seed}`).toHaveLength(6);
          expect(new Set(palier.drawings).size, `${theme.klass} ${seed} niveau ${palier.level}`).toBe(6);
        }
      }
    }
  });

  it("chaque palier garde de la variété : sur 80 graines, il sert au moins quatre dessins différents", () => {
    for (const theme of THEMES) {
      const seen = new Map<number, Set<string>>();
      for (const seed of SEEDS) {
        for (const p of themePaliers(theme, [{ kind: "pixel-copie", count: 2 }], seed)) {
          const set = seen.get(p.level) ?? new Set<string>();
          for (const d of p.drawings) set.add(d);
          seen.set(p.level, set);
        }
      }
      for (const [level, set] of seen) expect(set.size, `${theme.klass}, niveau ${level}`).toBeGreaterThanOrEqual(4);
    }
  });
});
