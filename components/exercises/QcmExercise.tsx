"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { ActionButton3D, Reward, Tile3D, type TileState } from "@/components/student/game-kit";
import { graphemeCount, qcmLayout, splitLeadingEmoji } from "@/components/student/game-kit/choix-texte";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { ExerciseActions } from "./game-parts";

interface QcmPayload {
  /** Identifiant d'une image d'énoncé du catalogue (`lib/exercise-images.ts`). */
  image?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
}

interface QcmExerciseProps {
  prompt: string;
  payload: QcmPayload;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

/**
 * LE QCM — l'exercice le plus fréquent, joué comme un choix de jeu.
 *
 * Les options sont des tuiles épaisses (`Tile3D`) : crème au repos, chacune
 * avec sa pastille de couleur ; celle que l'enfant touche se soulève et
 * prend sa teinte, le bouton Valider se redresse et appelle. Juste, la tuile
 * passe au vert et gonfle pendant que la récompense jaillit du milieu des
 * options (`Reward`, plafonnée par le niveau de l'appareil) ; fausse, elle
 * passe à l'ambre et dit non de la tête, sans rouge et sans claquer.
 *
 * LA DISPOSITION SUIT LE CONTENU (`qcmLayout`) : deux colonnes de grosses
 * tuiles centrées pour des émojis, des nombres ou un mot ou deux (le CI), une
 * colonne de tuiles à pastille lettrée pour des phrases. Une option qui
 * commence par un émoji le montre en grand, au-dessus de son mot. La lettre
 * de l'option ouvre toujours le nom accessible du bouton, collée au texte
 * comme avant (« A » puis « le poisson » : les tests de la vitrine cherchent
 * `/^[A-D]7$/`), en texte caché quand la pastille ne s'affiche pas.
 *
 * APRÈS « PAS TOUT À FAIT », la tuile fausse se repose et l'enfant rechoisit :
 * le choix s'efface quand le verdict repasse de faux à rien (la séance garde
 * le composant monté entre deux essais). Après une bonne réponse, la tuile
 * juste reste à pleine lumière, les autres pâlissent.
 *
 * LA BARRE D'ACTION (`ExerciseActions`) : « Valider » y est posé, et pour un
 * enfant qui apprend à lire (CI, CP) le gros bouton bleu « Écouter » vient
 * juste au-dessus ; l'énoncé, lui, prend toute la largeur de la carte. C'est
 * le MODÈLE du câblage des autres écrans.
 *
 * Le contrat ne change pas : mêmes props, la réponse part toujours en
 * `String(index)`.
 */
export default function QcmExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: QcmExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Le verdict précédent, pour voir le passage de « faux » à « on rejoue » :
  // état ajusté pendant le rendu, comme React le recommande.
  const [seenVerdict, setSeenVerdict] = useState(isCorrect);
  if (isCorrect !== seenVerdict) {
    setSeenVerdict(isCorrect);
    if (seenVerdict === false && isCorrect === null) setSelectedIndex(null);
  }

  const options = Array.isArray(payload?.options) ? payload.options.filter((o): o is string => typeof o === "string") : [];

  if (options.length < 2) {
    return (
      <div className="space-y-4">
        <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          <p className="font-display font-extrabold text-amber-900">Cet exercice est cassé, on te le saute.</p>
          <p className="mt-1 text-sm text-amber-700">Pas de souci, ça ne te coûte rien.</p>
          <ActionButton3D tone="white" size="md" onClick={() => onSkip?.()} disabled={disabled} className="mt-1 max-w-xs">
            Suivant
          </ActionButton3D>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (selectedIndex !== null) {
      onSubmit(String(selectedIndex));
    }
  };

  const layout = qcmLayout(options);
  const twoColumns = layout.columns === 2;
  const odd = twoColumns && options.length % 2 === 1;

  return (
    // Les blocs se resserrent avec la hauteur de l'écran (24 px entre l'énoncé
    // et les tuiles sur une tablette, 16 sur un téléphone, 12 sur un écran de
    // 667 px ou moins) : les tuiles restent sur le premier écran
    // (`session-stage.tsx`, le budget de `--stage-pio`). Des paliers qui
    // s'excluent : Tailwind ne garantit pas l'ordre de deux requêtes média.
    <div className="space-y-6 [@media(max-height:960px)_and_(min-height:668px)]:space-y-4 [@media(max-height:667px)]:space-y-3">
      <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />

      {/* Les tuiles, et la récompense qui jaillit de leur milieu. */}
      <div className={`relative ${twoColumns ? "grid grid-cols-2 gap-3 sm:gap-4" : "space-y-3"}`} data-layout={twoColumns ? "deux-colonnes" : "une-colonne"}>
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const state: TileState =
            isCorrect !== null && isSelected ? (isCorrect ? "juste" : "fausse") : isSelected ? "choisie" : "repos";
          const letter = String.fromCharCode(65 + index);
          const tile = (
            <Tile3D
              key={index}
              tone={index}
              state={state}
              badge={twoColumns ? undefined : letter}
              size={layout.size}
              align={twoColumns ? "center" : "left"}
              disabled={disabled}
              onPress={() => setSelectedIndex(index)}
              data-option={index}
            >
              <span className="sr-only">{letter}</span>
              <OptionContent text={option} big={twoColumns} />
            </Tile3D>
          );
          // Une option seule sur la dernière ligne se centre, à la largeur des autres.
          if (odd && index === options.length - 1) {
            return (
              <div key={index} className="col-span-2 flex justify-center">
                <div className="w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)]">{tile}</div>
              </div>
            );
          }
          return tile;
        })}
        <Reward fire={isCorrect === true ? "juste" : null} />
      </div>

      <ExerciseActions>
        <ActionButton3D
          onClick={handleSubmit}
          disabled={disabled || selectedIndex === null}
          shine={!disabled && selectedIndex !== null}
          icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
        >
          Valider
        </ActionButton3D>
      </ExerciseActions>
    </div>
  );
}

/**
 * Le contenu d'une tuile : l'émoji qui ouvre l'option en grand, le mot
 * dessous (deux colonnes) ou à côté (une colonne) ; un nombre ou un mot seul
 * en gros ; une option sans émoji telle quelle. LA HAUTEUR DES GROSSES TUILES
 * SUIT L'ÉCRAN : sur un téléphone debout (960 px ou moins), l'émoji au-dessus
 * de son mot perd la moitié de son souffle (104 px par tuile, 98) ; sur un
 * écran court (667 px ou moins, couché compris), il perd aussi un cran (36 px
 * au lieu de 48, 30 au lieu de 36) et tout son souffle (90) ; en paysage, un
 * nombre seul passe de 30 à 24 px sans souffle (la tuile tient dans ses 64 px).
 * Deux rangées de tuiles à émoji ne tenaient pas au-dessus du dock à 360 × 640
 * ni, avec un énoncé de quatre lignes, à 390 × 844 (mesuré le 18 octobre 2026).
 */
function OptionContent({ text, big }: { text: string; big: boolean }) {
  const { emoji, rest } = splitLeadingEmoji(text);
  if (!emoji) {
    if (!big) return <>{text}</>;
    const short = graphemeCount(text.trim()) <= 3;
    return (
      <span className={`block leading-tight ${short ? "py-1 text-3xl [@media(max-height:480px)]:py-0 [@media(max-height:480px)]:text-2xl" : "text-xl"}`}>
        {text}
      </span>
    );
  }
  if (!rest) {
    return <span className="block py-1 text-5xl leading-none [@media(max-height:667px)]:py-0 [@media(max-height:667px)]:text-4xl">{emoji}</span>;
  }
  if (big) {
    return (
      <span className="flex flex-col items-center gap-1.5 py-1 [@media(max-height:960px)_and_(min-height:668px)]:gap-1 [@media(max-height:960px)_and_(min-height:668px)]:py-0.5 [@media(max-height:667px)]:gap-1 [@media(max-height:667px)]:py-0">
        <span className="text-4xl leading-none [@media(max-height:667px)]:text-3xl">{emoji}</span>
        <span className="text-lg leading-tight">{rest}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-3">
      <span className="text-3xl leading-none">{emoji}</span>
      <span>{rest}</span>
    </span>
  );
}
