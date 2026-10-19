"use client";

/**
 * LE CONTENU D'UNE TUILE QUI MONTRE SON IMAGE, pour l'association et le
 * glisser-déposer : la pastille d'imagier (`ItemPicture`) AU-DESSUS du nom
 * écrit sur un téléphone, À CÔTÉ de lui sur un écran large. Un enfant de CI ne
 * sait pas encore lire « la girafe » : sa tuile lui montre la girafe, et garde
 * le mot. `lib/item-pictures.ts` dit quelle tuile en reçoit une,
 * `item-pictures.tsx` fournit la porte et le dessin ; ce fichier est la mise en
 * page de ces deux écrans.
 *
 * AU-DESSUS SUR UN TÉLÉPHONE DEBOUT (moins de 640 px de large). Ces tuiles sont
 * étroites : une colonne d'association fait 132 px à 360 px d'écran (112 px de
 * texte, bords et remplissage ôtés), l'intérieur d'une boîte de glisser-déposer
 * 114 px. Une pastille de 36 px, 8 px d'écart et « l'éléphant » (95 px) font
 * 139 px : ils n'y tiennent pas côte à côte ; en pile, ils tiennent toujours. Une
 * disposition choisie tuile par tuile (à côté quand le mot tient, dessous sinon)
 * a été essayée : à 390 px, « le chat » se rangeait à côté de son image et « le
 * chien » dessous, dans la même colonne. Toutes les tuiles d'un écran sont donc
 * dans la même disposition, choisie par la LARGEUR de l'écran, jamais par le mot.
 *
 * À CÔTÉ À 640 PX ET PLUS (une tablette, un écran large, un téléphone couché). La
 * colonne y fait 250 px et plus : la pastille de 44 px (56 px au-delà de 960 px de
 * haut, 36 px sur un téléphone couché), son écart et le mot y tiennent, et la tuile
 * garde les 56 px qu'elle avait sans image. C'est là que la pile coûtait le plus : une
 * association de quatre paires à image défilait de 94 px à 1024 × 768 et de 82 px à
 * 768 × 1024 et à 844 × 390 (relu le 19 octobre 2026), contre rien en rangée.
 *
 * ET LA PILE SE PAIE AU PLUS JUSTE. Une tuile 3D mesure 56 px au moins
 * (`min-h-14`) ; l'image et le mot empilés en demandent plus. Les leviers, mesurés
 * le 19 octobre 2026 dans la séance factice (CI, dock compris) : la pastille mesure
 * 36 px, 32 px dès QUATRE tuiles (`DENSE_TILE_COUNT` : quatre paires ou quatre
 * étiquettes, le cas courant du CI) ; elle déborde du remplissage de la tuile, de
 * 6 px en haut, de 10 px en bas (la face garde 6 px de jour sous la pastille et 2 px
 * sous le mot, dont l'interligne laisse le reste) et de 8 px de chaque côté ; le mot
 * serre son interligne (`leading-tight`) ; la colonne d'association qui montre des
 * images serre aussi ses tuiles de 12 px à 8 px (`MatchExercise`). Une tuile de
 * pastille de 32 px mesure 68,5 px au lieu de 56 (72,5 px avec celle de 36 px, 85 px
 * avec les 44 px de la première version), et 16 px de moins en largeur : trois étiquettes
 * de glisser-déposer tiennent sur UNE rangée à 360 px. Le coût sur le premier
 * écran, en pixels de la carte que le dock recouvre, est dans la documentation
 * (`docs/paliers-et-exercices.md`) : l'association de quatre paires tient de
 * nouveau à 390 × 844 et à 375 × 812, où elle tenait sans image. Plus petite, la
 * pastille ne se reconnaît plus ; plus serrée, la tuile colle l'image à son bord.
 *
 * LE MOT RESTE ÉCRIT SANS L'ÉMOJI DE TÊTE que la pastille remplace (`tileName`) :
 * « [chien] le chien » ([chien] tient lieu de l'émoji) montre le chien dessiné et
 * « le chien ». Si le fichier ne charge pas, la pastille cède la place à cet
 * émoji (`ItemPicture`). Le texte de la tuile n'est jamais changé : la réponse
 * envoyée à `onSubmit` est faite des textes d'origine, émoji compris.
 *
 * SANS IMAGE, RIEN NE CHANGE : `TilePicture` rend alors `TileGlyphs`, le nœud
 * d'avant. C'est ce qui garde le DOM de la vitrine, de la galerie et des
 * autres classes tel qu'il était.
 */

import type { ItemImage } from "@/lib/item-images";
import { isGlyphTile, splitTile } from "@/lib/item-pictures";
import { isGlyphOnly, TileGlyphs } from "@/components/student/game-kit/gestes-glyphes";
import { ItemPicture } from "./item-pictures";

/**
 * Les tuiles « que des glyphes » d'un côté, à passer à l'AUTRE côté comme
 * `glyphTiles` (garde-fou c de `lib/item-pictures.ts` : une image sur le mot ne
 * doit pas donner la réponse quand l'autre côté la montre en émojis).
 * `isGlyphOnly` (le kit) dit « aucune lettre » : des émojis, des chiffres, des
 * formes, un petit calcul, seize signes au plus ; `isGlyphTile` (la lib) dit
 * « que des émojis », quelle que soit la longueur de la rangée. Les deux se
 * complètent : une rangée de dix-huit mangues n'est plus un glyphe pour le kit,
 * et reste une rangée d'émojis.
 */
export function glyphTilesOf(texts: readonly string[]): string[] {
  return texts.filter((text) => typeof text === "string" && (isGlyphOnly(text) || isGlyphTile(text)));
}

/**
 * Le nom écrit d'une tuile : son texte sans l'émoji de tête quand une image le
 * remplace, son texte entier sinon.
 */
export function tileName(text: string, image: ItemImage | null | undefined): string {
  if (!image) return text;
  return splitTile(text).rest || text;
}

/**
 * À PARTIR DE QUATRE TUILES, la colonne ou le bac est dense : la pastille se serre
 * (32 px au lieu de 36), parce que quatre paires ou quatre étiquettes sont le cas
 * courant du CI et que leur hauteur est celle que le dock ne pardonne pas (mesuré le
 * 19 octobre 2026 : une association de quatre paires tenait à 390 × 844 et à
 * 375 × 812 sans image, et défilait avec). Même seuil que la mise en ordre
 * (`stickerFor`, `OrderExercise`).
 */
export const DENSE_TILE_COUNT = 4;

/** Vrai quand un groupe de `count` tuiles est dense (voir `DENSE_TILE_COUNT`). */
export function isDenseTileCount(count: number): boolean {
  return count >= DENSE_TILE_COUNT;
}

/*
 * LA TAILLE DE LA PASTILLE SUIT LA LARGEUR, PUIS LA DENSITÉ. Les classes sont écrites
 * en entier : Tailwind ne voit que ce qui est écrit. Deux mises en page, séparées par
 * la largeur de 640 px (`min-[640px]`, le `sm` de Tailwind), et des tailles qui
 * s'excluent (Tailwind ne garantit pas l'ordre de deux requêtes média) :
 *   - un téléphone debout (moins de 640 px de large), la pastille AU-DESSUS du mot :
 *     36 px, 32 px quand le groupe est dense. Une pastille plus grande ne tient pas
 *     dans la hauteur de quatre tuiles ;
 *   - une tablette, un écran large, un téléphone couché (640 px et plus), la
 *     pastille À CÔTÉ du mot : la tuile garde sa hauteur d'avant (56 px), et la
 *     pastille mesure 44 px, 56 px sur un grand écran (plus de 960 px de haut), 36 px
 *     sur un écran court (480 px de haut ou moins : un téléphone couché).
 */
const STICKER_STACKED = "size-9";
const STICKER_STACKED_DENSE = "size-8";
const STICKER_BESIDE =
  "min-[640px]:[@media(min-height:481px)_and_(max-height:960px)]:size-11 min-[640px]:[@media(min-height:961px)]:size-14 min-[640px]:[@media(max-height:480px)]:size-9";

/** Les classes de taille de la pastille d'une tuile : pile ou côte à côte, dense ou non. */
export function stickerSizeClass(dense: boolean): string {
  return `${dense ? STICKER_STACKED_DENSE : STICKER_STACKED} ${STICKER_BESIDE}`;
}

/**
 * La pastille d'une tuile (ou du nom d'une boîte). `text` est le texte d'origine
 * de la tuile : son émoji de tête tient lieu de repli si l'image ne charge pas.
 * `dense` : le groupe porte quatre tuiles ou plus (`isDenseTileCount`).
 */
export function TileSticker({ image, text, dense = false }: { image: ItemImage; text: string; dense?: boolean }) {
  return <ItemPicture image={image} emoji={splitTile(text).emoji} className={stickerSizeClass(dense)} />;
}

/**
 * La mise en page d'une tuile à image : la pastille et le nom en pile centrée (un
 * téléphone debout), en rangée centrée (640 px de large et plus). Elle déborde du
 * remplissage de la tuile, de 8 px de chaque côté (`-mx-2`) et de 6 px en haut et en
 * bas en pile (`-my-1.5` : la face garde 6 px de jour), de 8 px en rangée (`-my-2`,
 * pour que la pastille de 44 px ne grandisse pas la tuile) ; le nom serre son
 * interligne (`leading-tight`).
 */
export const PICTURE_TILE_LAYOUT =
  "-mx-2 -mt-1.5 -mb-2.5 flex flex-col items-center gap-0.5 leading-tight min-[640px]:-my-2 min-[640px]:flex-row min-[640px]:justify-center min-[640px]:gap-2.5";

/**
 * Ce que montre une tuile : la pastille au-dessus (ou à côté) du nom quand `image`
 * existe, le même `TileGlyphs` qu'avant sinon. `dense` : le groupe porte quatre
 * tuiles ou plus.
 */
export function TilePicture({
  text,
  image,
  dense = false,
}: {
  text: string;
  image: ItemImage | null | undefined;
  dense?: boolean;
}) {
  if (!image) return <TileGlyphs text={text} />;
  return (
    <span className={PICTURE_TILE_LAYOUT}>
      <TileSticker image={image} text={text} dense={dense} />
      <TileGlyphs text={tileName(text, image)} />
    </span>
  );
}
