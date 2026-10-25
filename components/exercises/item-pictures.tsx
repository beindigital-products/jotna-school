"use client";

/**
 * LES IMAGES SUR LES TUILES : la porte, la résolution et le dessin.
 *
 * Un enfant de CI ne sait pas encore lire « Lion », « La table » ou « midi » :
 * sa tuile montre une vraie image de référence, ET garde son nom écrit
 * (`lib/item-images.ts` dit pourquoi, et quelles images existent ;
 * `lib/item-pictures.ts` dit quelle tuile en reçoit une et quand l'image
 * trahirait l'exercice). Ce fichier est le côté écran, en trois pièces.
 *
 * LA PORTE : `ItemPicturesProvider`. La séance entoure l'exercice de ce
 * fournisseur, comme `PromptReaderProvider` (`prompt-reader.tsx`) l'est pour
 * `isReadingLearnerClass` : `enabled={isPictureTileClass(classe)}`. Hors de
 * lui, ou avec `enabled` faux, `useItemPicturesEnabled` est faux et aucune tuile
 * ne change : le web des autres classes, la galerie, les tests existants
 * restent exactement ce qu'ils sont.
 *
 * LA RÉSOLUTION : `useTilePictures(tuiles, contexte)` rend, pour chaque tuile, son
 * image ou `null`, dans un tableau de la même longueur. Le contexte (`TileContext`,
 * `lib/item-pictures.ts`) dit ce que l'écran sait de l'exercice et que les
 * garde-fous lisent : l'énoncé (`prompt`), les tuiles « que des émojis » de
 * l'autre côté (`glyphTiles`), un QCM (`choice`), les textes de l'autre groupe de
 * tuiles (`counterpart`), l'image d'énoncé (`exerciseImage`), la phrase d'un texte à
 * trous (`sentence`). Rien n'est écrit
 * dans la donnée : le texte de la tuile et la réponse envoyée à `onSubmit` ne
 * changent jamais d'un caractère. Le résultat est mémoïsé sur le CONTENU (les
 * écrans passent un tableau et un objet neufs à chaque rendu), pour qu'il reste le
 * même objet tant que les tuiles ne changent pas.
 *
 * LE DESSIN : `ItemPicture`, une pastille blanche arrondie, l'autocollant d'un
 * imagier : une ombre basse et un flanc crème, ceux d'une tuile 3D (`#d6c39a`),
 * un fin liseré blanc. Elle se détache des tuiles crème au repos comme des
 * tuiles teintées, vertes ou ambre. Sa taille est celle de la PASTILLE, liseré
 * de 2 px compris : 36, 44, 56 ou 72 px (`xs`, `sm`, `md`, `lg`). Le budget de
 * hauteur des écrans la réduit (32 px sur un téléphone, avec les requêtes média
 * de `QcmExercise` pour un QCM, la largeur et le nombre de tuiles de
 * `tile-picture.tsx` pour l'association et le glisser-déposer) ; `className`
 * surcharge la taille, la dernière classe de taille l'emporte :
 *
 *   className="size-8 min-[640px]:size-11"
 *
 * L'IMAGE EST DÉCORATIVE : le nom est écrit à côté, donc `alt` est vide. Elle
 * ne reçoit ni le toucher ni la sélection (`pointer-events-none`,
 * `select-none`, `draggable={false}`) : sans cela, iOS ouvre le menu de
 * l'image sur un appui long, en pleine zone de glisser. Les fichiers sont ceux
 * du site (`public/objets/`, export statique : pas de `next/image`).
 *
 * SI LE FICHIER NE CHARGE PAS, pas d'icône cassée : la pastille cède la place à
 * l'émoji de tête de la tuile, s'il y en a un (en gros caractères, même
 * encombrement : la tuile ne saute pas), sinon elle disparaît.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ITEM_IMAGE_SIZE, itemImageSrc, type ItemImage } from "@/lib/item-images";
import { resolveTilePictures, type TileContext } from "@/lib/item-pictures";
import { cn } from "@/lib/utils";

/* ── La porte ───────────────────────────────────────────────────────────── */

const ItemPicturesContext = createContext(false);

/** Entoure l'exercice : `enabled` dit si les tuiles montrent leur image (`isPictureTileClass`). */
export function ItemPicturesProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return <ItemPicturesContext.Provider value={enabled}>{children}</ItemPicturesContext.Provider>;
}

/** Vrai quand les tuiles de l'exercice affiché montrent leur image. Faux hors fournisseur. */
export function useItemPicturesEnabled(): boolean {
  return useContext(ItemPicturesContext);
}

/* ── La résolution ──────────────────────────────────────────────────────── */

/**
 * Le contexte, réduit à son CONTENU : une chaîne qui sert de clé de mémoïsation, et
 * que `contextOfKey` relit. Les écrans passent un objet neuf à chaque rendu.
 */
function contextKey(ctx: TileContext | undefined): unknown[] {
  return [
    ctx?.prompt ?? null,
    ctx?.glyphTiles ?? null,
    ctx?.choice === true,
    ctx?.counterpart ?? null,
    ctx?.exerciseImage ?? null,
    ctx?.sentence ?? null,
  ];
}

function contextOfKey(parts: unknown[]): TileContext {
  const [prompt, glyphTiles, choice, counterpart, exerciseImage, sentence] = parts as [
    string | null,
    string[] | null,
    boolean,
    string[] | null,
    string | null,
    string | null,
  ];
  return {
    prompt: prompt ?? undefined,
    glyphTiles: glyphTiles ?? undefined,
    choice,
    counterpart: counterpart ?? undefined,
    exerciseImage: exerciseImage ?? undefined,
    sentence: sentence ?? undefined,
  };
}

/**
 * L'image de chaque tuile, dans l'ordre des tuiles, ou `null` : tout `null` quand
 * la porte est fermée, sinon `resolveTilePictures` (garde-fous compris). Le
 * contexte est celui de `TileContext` : l'énoncé, les tuiles « que des émojis » de
 * l'autre côté, un QCM, les textes de l'autre groupe, l'image d'énoncé, la phrase
 * d'un texte à trous.
 */
export function useTilePictures(tiles: readonly string[], ctx?: TileContext): (ItemImage | null)[] {
  const enabled = useItemPicturesEnabled();
  // La clé est le contenu. Le calcul ne relit que la clé : tant qu'elle ne change
  // pas, le tableau rendu est le même objet, quelle que soit l'identité des arguments.
  const key = JSON.stringify([tiles, contextKey(ctx)]);
  return useMemo(() => {
    const [list, parts] = JSON.parse(key) as [string[], unknown[]];
    if (!enabled) return list.map(() => null);
    return resolveTilePictures(list, contextOfKey(parts));
  }, [enabled, key]);
}

/**
 * `useTilePictures` pour plusieurs GROUPES de tuiles qui se résolvent chacun à part,
 * avec le même contexte : les options de chaque trou d'un texte à trous. Les
 * garde-fous jouent groupe par groupe (un trou n'a qu'une bonne option : `choice`).
 * Un tableau par groupe, de la longueur du groupe.
 */
export function useTileGroupPictures(groups: readonly (readonly string[])[], ctx?: TileContext): (ItemImage | null)[][] {
  const enabled = useItemPicturesEnabled();
  const key = JSON.stringify([groups, contextKey(ctx)]);
  return useMemo(() => {
    const [lists, parts] = JSON.parse(key) as [string[][], unknown[]];
    if (!enabled) return lists.map((list) => list.map(() => null));
    const context = contextOfKey(parts);
    return lists.map((list) => resolveTilePictures(list, context));
  }, [enabled, key]);
}

/* ── Le dessin ──────────────────────────────────────────────────────────── */

export type ItemPictureSize = "xs" | "sm" | "md" | "lg";

/* Les classes sont écrites en entier : Tailwind ne voit que ce qui est écrit. */
const SIZE_CLASS: Record<ItemPictureSize, string> = {
  xs: "size-9",
  sm: "size-11",
  md: "size-14",
  lg: "size-18",
};

const STICKER =
  "inline-flex shrink-0 items-center justify-center rounded-xl bg-white p-0.5 shadow-[0_2px_0_#d6c39a,0_3px_8px_-3px_rgb(60_30_0_/_0.4)] ring-1 ring-white";

export function ItemPicture({
  image,
  emoji,
  size = "md",
  className,
}: {
  image: ItemImage;
  /** L'émoji de tête de la tuile : il remplace l'image si son fichier ne charge pas. */
  emoji?: string;
  size?: ItemPictureSize;
  className?: string;
}) {
  // L'identifiant de l'image en échec, pas un booléen : si la tuile change
  // d'image (une mise en ordre qui se réarrange), la nouvelle a sa chance.
  const [failedId, setFailedId] = useState<string | null>(null);
  const imageId = image.id;

  // Une image déjà en échec quand React la saisit : dans une page pré-rendue,
  // l'événement `error` part avant l'hydratation et personne ne l'entend ; elle
  // se reconnaît à ses deux marques (terminée, sans largeur). La fonction est
  // stable (elle ne change qu'avec l'image) : une fonction neuve à chaque rendu
  // serait détachée puis rattachée par React à chaque rendu, pour rien. Elle est
  // posée AVANT le retour du repli : l'ordre des hooks ne dépend pas de l'échec.
  const settle = useCallback(
    (element: HTMLImageElement | null) => {
      if (element && element.complete && element.naturalWidth === 0) setFailedId(imageId);
    },
    [imageId],
  );

  if (failedId === image.id) {
    if (!emoji) return null;
    // Le repli : l'émoji, aussi grand que la pastille le permet (`cqw` : les
    // moteurs sans unités de conteneur gardent la taille du texte voisin, un
    // émoji plus petit mais jamais cassé).
    return (
      <span
        aria-hidden
        data-item-picture="repli"
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center [container-type:inline-size]",
          SIZE_CLASS[size],
          className,
        )}
      >
        <span className="block leading-none [font-size:72cqw]">{emoji}</span>
      </span>
    );
  }

  return (
    <span data-item-picture={image.id} className={cn(STICKER, SIZE_CLASS[size], className)}>
      {/* Pas `next/image` : export statique, sans serveur d'optimisation. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={settle}
        src={itemImageSrc(image.id)}
        alt=""
        width={ITEM_IMAGE_SIZE}
        height={ITEM_IMAGE_SIZE}
        decoding="async"
        draggable={false}
        onError={() => setFailedId(image.id)}
        className="pointer-events-none size-full select-none rounded-lg object-contain"
      />
    </span>
  );
}
