"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { ActionButton3D, Reward, Tile3D, type TileState } from "@/components/student/game-kit";
import { graphemeCount, qcmLayout, splitLeadingEmoji } from "@/components/student/game-kit/choix-texte";
import { typesetTile } from "@/components/student/game-kit/tile-typeset";
import type { ItemImage } from "@/lib/item-images";
import { splitTile } from "@/lib/item-pictures";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { payloadScene } from "./SceneClip";
import { ExerciseActions } from "./game-parts";
import { ItemPicture, useTilePictures } from "./item-pictures";
import { useTileVoice } from "./prompt-reader";

interface QcmPayload {
  /** Identifiant d'une image d'énoncé du catalogue (`lib/exercise-images.ts`). */
  image?: string;
  /** Identifiant du clip d'une scène du CI, au catalogue (`lib/scene-clips.ts`) : il passe au-dessus de l'énoncé. */
  scene?: string;
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
 * EN CI, UNE TUILE QUI NOMME UNE CHOSE MONTRE SON IMAGE (`item-pictures.tsx`) :
 * un enfant de six ans ne lit pas encore « Lion » ni « La table », et l'émoji
 * collé à « la souris » est trop petit pour la reconnaître. Les images se
 * résolvent UNE fois pour toutes les options (`useTilePictures`, avec l'énoncé :
 * un énoncé qui demande de lire, de décoder ou de nommer, ou qui montre l'émoji
 * ou l'image de la réponse, n'en laisse aucune). Un QCM n'a qu'une bonne tuile :
 * ses images sont toutes ou aucune (`choice`), car la seule tuile illustrée, ou
 * la seule tuile nue, la désignerait par élimination. Une tuile qui en reçoit une
 * pose sa pastille d'imagier à la place de son émoji de tête et garde son mot
 * écrit au même endroit, dessous (deux colonnes) ou à gauche (une colonne). Rien
 * ne change dans la donnée : `options` reste ce que le serveur a envoyé, et la
 * réponse part toujours en `String(index)`. Sans `ItemPicturesProvider` (les
 * autres classes, la vitrine, les aperçus des professeurs) ou pour une option
 * sans image, le rendu est celui d'avant, au caractère près : les classes de la
 * branche « émoji et mot » sont celles d'avant, un test les compare à la chaîne
 * d'origine.
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
 * LE TEXTE D'UNE OPTION EST COMPOSÉ À L'ÉCRAN (`typesetTile`) : l'espace avant
 * « ? ! : ; » y est insécable, comme dans l'énoncé, et un calcul ne se coupe pas
 * autour de ses opérateurs. `options` n'en est pas touché.
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
  // Les images des tuiles (CI) : un seul calcul pour toutes les options, avant le
  // retour anticipé pour que l'ordre des hooks ne dépende pas du contenu. `choice` :
  // un QCM n'a qu'une bonne tuile, ses images sont toutes ou aucune.
  const pictures = useTilePictures(options, { prompt, choice: true, exerciseImage: payloadImage(payload) });
  // La voix des tuiles (CI) : Pio dit les propositions après la consigne, la tuile
  // qui parle s'allume, et un toucher la redit. `null` hors CI, en anglais, ou quand
  // l'énoncé demande de lire (`prompt-reader.tsx`) : rien ne change alors.
  const tileVoice = useTileVoice(options, prompt, { autoRead: true });

  if (options.length < 2) {
    return (
      <div className="space-y-4">
        <ExercisePrompt prompt={prompt} image={payloadImage(payload)} scene={payloadScene(payload)} />
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
      <ExercisePrompt prompt={prompt} image={payloadImage(payload)} scene={payloadScene(payload)} />

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
              // Choisir, c'est aussi ENTENDRE ce qu'on a choisi : un second toucher le redit.
              onPress={() => {
                setSelectedIndex(index);
                tileVoice?.hear(index);
              }}
              speaking={tileVoice?.speaking === index}
              data-option={index}
            >
              <span className="sr-only">{letter}</span>
              <OptionContent text={option} big={twoColumns} image={pictures[index] ?? null} />
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
 * La pile « émoji au-dessus du mot » d'une tuile d'émoji, en deux colonnes : les
 * classes d'avant les images, au caractère près (un test les compare à cette
 * chaîne). Hors CI, une tuile d'émoji ne change pas, même en paysage.
 */
export const EMOJI_OPTION_STACK =
  "flex flex-col items-center gap-1.5 py-1 [@media(max-height:960px)_and_(min-height:668px)]:gap-1 [@media(max-height:960px)_and_(min-height:668px)]:py-0.5 [@media(max-height:667px)]:gap-1 [@media(max-height:667px)]:py-0";

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
function OptionContent({ text, big, image }: { text: string; big: boolean; image: ItemImage | null }) {
  if (image) return <PictureOption text={text} big={big} image={image} />;
  const { emoji, rest } = splitLeadingEmoji(text);
  if (!emoji) {
    if (!big) return <>{typesetTile(text)}</>;
    const short = graphemeCount(text.trim()) <= 3;
    return (
      <span className={`block leading-tight ${short ? "py-1 text-3xl [@media(max-height:480px)]:py-0 [@media(max-height:480px)]:text-2xl" : "text-xl"}`}>
        {typesetTile(text)}
      </span>
    );
  }
  if (!rest) {
    return <span className="block py-1 text-5xl leading-none [@media(max-height:667px)]:py-0 [@media(max-height:667px)]:text-4xl">{emoji}</span>;
  }
  if (big) {
    return (
      <span className={EMOJI_OPTION_STACK}>
        <span className="text-4xl leading-none [@media(max-height:667px)]:text-3xl">{emoji}</span>
        <span className="text-lg leading-tight">{typesetTile(rest)}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-3">
      <span className="text-3xl leading-none">{emoji}</span>
      <span>{typesetTile(rest)}</span>
    </span>
  );
}

/**
 * La pile « pastille au-dessus du mot » d'une tuile à image, en deux colonnes : celle
 * de la tuile d'émoji, plus, EN PAYSAGE (480 px de haut ou moins), la rangée centrée
 * (la pastille à gauche du mot). Elle n'est qu'ici : la tuile d'émoji, elle, ne
 * change pas (`EMOJI_OPTION_STACK`).
 */
export const PICTURE_OPTION_STACK =
  "flex flex-col items-center gap-1.5 py-1 [@media(max-height:960px)_and_(min-height:668px)]:gap-1 [@media(max-height:960px)_and_(min-height:668px)]:py-0.5 [@media(max-height:667px)_and_(min-height:481px)]:gap-1 [@media(max-height:667px)]:py-0 [@media(max-height:480px)]:flex-row [@media(max-height:480px)]:justify-center [@media(max-height:480px)]:gap-2.5";

/**
 * La taille de la pastille en deux colonnes selon la hauteur de l'écran : 56, 44 et
 * 36 px aux seuils de l'émoji, et 32 px en paysage (480 px de haut ou moins), où la
 * pastille de 36 px poussait la tuile de 64 à 68 px et recouvrait de 8 px la
 * deuxième rangée sur un iPhone à encoche.
 */
export const PICTURE_OPTION_STICKER =
  "[@media(max-height:960px)_and_(min-height:820px)]:size-14 [@media(max-height:819px)_and_(min-height:668px)]:size-11 [@media(max-height:667px)_and_(min-height:481px)]:size-9 [@media(max-height:480px)]:size-8";

/**
 * Une tuile qui montre son image (CI) : la pastille d'imagier prend la place de
 * l'émoji de tête, le mot (le reste du texte, sans l'émoji) reste écrit. Même
 * disposition qu'une tuile à émoji : la pastille au-dessus du mot en deux
 * colonnes, à sa gauche en une colonne. Même budget de hauteur aussi, avec les
 * mêmes requêtes média, et cinq tailles de pastille en deux colonnes : 72 px
 * sur une tablette (plus de 960 px de haut), 56 px sur un grand téléphone (820 à
 * 960 px : 390 × 844, 412 × 915), 44 px sur un téléphone moyen (668 à 819 px),
 * 36 px sur un écran court (481 à 667 px), où l'émoji faisait 30 px, 32 px en
 * paysage (480 px ou moins, voir plus bas). Mesuré le
 * 19 octobre 2026 : quatre tuiles à image restent entièrement au-dessus du dock
 * de 360 × 640 (74 px de jour, énoncé de deux lignes) à 820 × 1180 (315 px). LE
 * SEUIL DE 820 PX COMPTE L'ENCOCHE : la requête média voit la hauteur entière d'un
 * iPhone (844 px) quand l'écran n'en offre que 763 ; à 56 px, il garde 60 px de
 * jour sous quatre tuiles (37 px avec un énoncé de trois lignes), 71 px pour celui
 * de 874 px. EN PAYSAGE (480 px de haut ou moins), la pastille passe à gauche du
 * mot, comme en une colonne, et se serre à 32 px : la tuile mesure 64 px au lieu de
 * 95 (à 36 px elle en mesurait 68, et la deuxième rangée passait de 8 px sous le dock
 * sur un iPhone à encoche), et les quatre tuiles tiennent à 844 × 390 (21 px de jour,
 * 0 px avec l'encoche d'un iPhone couché) et à 667 × 375 (6 px de jour) ; les deux
 * colonnes y laissent 150 px de large à la pastille et au mot. En une colonne, la
 * pastille (44 px, 36 px sur un écran court) déborde de 2 px dans le remplissage de
 * la tuile (`-my-0.5`) : la tuile garde les 72 px que lui donne la pastille de sa
 * lettre. Les paliers de hauteur s'excluent (`min-height`) : Tailwind ne garantit
 * pas l'ordre de deux requêtes média.
 */
function PictureOption({ text, big, image }: { text: string; big: boolean; image: ItemImage }) {
  const { emoji, rest } = splitTile(text);
  const word = rest || text;
  if (big) {
    return (
      <span className={PICTURE_OPTION_STACK}>
        <ItemPicture image={image} emoji={emoji} size="lg" className={PICTURE_OPTION_STICKER} />
        <span className="text-lg leading-tight">{typesetTile(word)}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-3">
      <ItemPicture image={image} emoji={emoji} size="sm" className="-my-0.5 [@media(max-height:667px)]:size-9" />
      <span>{typesetTile(word)}</span>
    </span>
  );
}
