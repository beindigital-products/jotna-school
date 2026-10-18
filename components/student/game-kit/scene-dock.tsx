"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

/**
 * LE DOCK — la barre « Écouter + Valider » collée au bas de l'écran.
 *
 * Demande du propriétaire (18 octobre 2026), après avoir vu « Valider »
 * passer sous le bord bas du premier écran sur l'association, la frise, la
 * réponse courte et le glisser-déposer : « colle la barre en bas ». Pendant
 * une séance, la barre d'action ne vit plus au fond de la carte, elle est
 * posée sur le bas de l'écran, toujours visible, quel que soit l'exercice ;
 * le contenu (Pio, l'énoncé, les tuiles) défile au-dessus d'elle.
 *
 * COMMENT ÇA MARCHE. `SceneDockProvider` est la racine de la coque de la
 * séance (`session-stage.tsx`) : il rend ses enfants, puis le panneau du dock
 * en dernier dans le DOM (l'ordre de tabulation reste contenu puis dock), et
 * publie un emplacement par contexte. `ExerciseActions`
 * (`components/exercises/game-parts.tsx`) lit cet emplacement et S'Y
 * TÉLÉPORTE (`createPortal`) ; sans emplacement (la vitrine de la page
 * d'accueil, les aperçus des professeurs, la galerie `/dev/exercices`), la
 * barre reste en ligne au bas de la carte, comme avant. Les props des écrans
 * d'exercice ne changent pas ; la carte garde l'indice sous l'exercice.
 *
 * POURQUOI `position: fixed`, ET PAS `sticky` NI LA BARRE DANS LA CARTE.
 * Collante dans la carte, la barre partirait et reviendrait avec elle à
 * chaque question (la carte est remontée par `AnimatePresence`, clé de
 * l'exercice : un clignotement à chaque passage) ; et `sticky` se cale sur
 * son bloc conteneur : la carte, pas l'écran. Le dock est un seul élément de
 * la coque, qui reste en place d'une question à l'autre : seul son contenu
 * change. Il est `fixed` dans la racine de la coque, qui n'a ni `transform`
 * ni `filter` (la carte en a un pendant son ressort, c'est pour cela que la
 * barre n'est pas `fixed` DANS la carte : elle se serait calée sur la carte ;
 * `answer-feedback.tsx` porte la même leçon). Le prix du `fixed`, c'est le
 * clavier : voir plus bas.
 *
 * LE CONTENU RÉSERVE SA PLACE : la hauteur du panneau est MESURÉE
 * (`ResizeObserver`, jamais une valeur en dur : une rangée ou deux selon
 * l'écran, la barre d'accueil de l'iPhone, le mot « Écouter » ou pas) et
 * publiée dans `--dock-h` sur la racine ; la coque la met en marge basse de
 * son contenu, la dernière tuile se fait toujours défiler au-dessus du dock.
 * `scroll-padding-bottom` du document la reçoit aussi : un `scrollIntoView`
 * (un champ qui prend le focus, Playwright qui amène un bouton dans la vue)
 * s'arrête au-dessus du dock, pas derrière lui. Quand le dock change de
 * hauteur, seule la marge basse de la page change : rien au-dessus ne saute.
 *
 * LE DOCK N'EXISTE QUE S'IL A QUELQUE CHOSE À MONTRER. Chaque barre qui s'y
 * téléporte se déclare (`occupy`) ; sans occupant (un exercice cassé, qui a
 * son propre « Suivant »), le panneau est `visibility: hidden` (pas
 * `display: none` : l'emplacement garde une boîte, la mesure suivante part)
 * et `--dock-h` vaut 0. Entre deux questions, `AnimatePresence mode="wait"`
 * retire l'ancienne carte et pose la nouvelle dans le même rendu : le dock
 * ne se vide jamais à l'écran.
 *
 * LE CLAVIER. Une réponse tapée en lettres ouvre le clavier du téléphone. Sur
 * Android (et dans l'application Android), la fenêtre se redimensionne : le
 * bas de l'écran monte, et un élément `fixed` en bas monte avec lui, rien à
 * faire. Sur iOS (Safari comme le WKWebView de l'application, sans module
 * clavier Capacitor), le clavier RECOUVRE la page sans la redimensionner :
 * le viewport de mise en page garde sa hauteur, seul le viewport visuel
 * rétrécit (`window.visualViewport`). `useKeyboardInset` lit la différence
 * (hauteur du viewport de mise en page, `layoutViewportHeight`, moins hauteur
 * visible moins décalage du haut) à chaque `resize` et `scroll` du viewport
 * visuel, et le dock monte d'autant, par un `transform` (rien d'autre n'est
 * animé) : vérifié dans le WKWebView du simulateur iPhone 17 (le dock se pose
 * sur le haut du clavier, `data-keyboard-inset` dit de combien, 91 à 315 px
 * selon ce que WebKit a fait défiler). Pendant ce temps, la marge de la
 * barre d'accueil n'a plus lieu d'être (elle est sous le clavier) : le dock
 * la retire. Et `--dock-h` COMPTE LE CLAVIER : une page qui tenait dans
 * l'écran ne défile pas, et le champ resterait sous le dock remonté ; avec la
 * place du clavier réservée en bas, la page peut défiler d'autant, et le
 * champ se remonte au-dessus du dock (`ShortAnswerExercise`, `revealField`).
 * Un zoom au pincement rétrécit aussi le viewport visuel : il est ignoré
 * (`scale` > 1), sinon le dock sauterait au milieu de l'écran. La racine dit
 * `data-keyboard-up` tant que le clavier recouvre : l'en-tête collant de la
 * coque se décolle alors (`session-stage.tsx`), sinon, en paysage, l'en-tête
 * (86 px) et le dock remonté ne laissaient rien entre eux et le champ était
 * caché (relu le 18 octobre 2026).
 *
 * LE CLAVIER MATÉRIEL (iOS, un iPad avec clavier, le simulateur piloté par un
 * script) : il ne reste à l'écran que la barre d'accessoires du clavier
 * (68 px), et WebKit ne redimensionne rien mais FAIT DÉFILER le viewport
 * visuel de cette hauteur (`offsetTop` 68, `inset` 0 : le dock, calé au bas
 * du viewport de mise en page, reste au bas de l'écran). L'en-tête collant,
 * lui, se cale sur le viewport de mise en page : il montait de 68 px sous la
 * barre d'état, ses boutons Sons et Quitter sous l'heure et la batterie (vu
 * sur l'iPhone 17 le 18 octobre 2026). La racine publie ce décalage dans
 * `--vv-top`, et l'en-tête l'ajoute à son `top` : il reste sous la barre
 * d'état. Zéro partout ailleurs (Android, le web, un zoom au pincement).
 *
 * CE QUI NE BOUGE PAS : pas de `backdrop-filter` (un flou sous lequel la
 * carte défile se recalcule à chaque image sur le WKWebView), une ombre
 * portée STATIQUE vers le haut et un dégradé au-dessus du liseré, pour que
 * le contenu qui passe dessous se lise comme « derrière ». Même langage que
 * l'en-tête de la séance (`SessionHud` : crème, liseré blanc). LE PANNEAU EST
 * OPAQUE : à 92 %, les tuiles qui passaient dessous se lisaient dans les
 * boutons (« 4 » et « 6 » dans Valider en paysage, relu le 18 octobre 2026) ;
 * le dégradé au-dessus du liseré suffit à dire « derrière ». Ses marges sont
 * en pixels : le texte agrandi grandit les mots des boutons, pas le panneau
 * autour. ELLES SUIVENT LA HAUTEUR DE L'ÉCRAN, par des requêtes média (jamais
 * une valeur en dur dans `--dock-h` : la hauteur reste mesurée) : 12 px en
 * haut et 16 en bas sur une tablette ; sur un téléphone (960 px de haut ou
 * moins) 10 et 12 ; sur un écran court (700 px ou moins) 8 et 12 ; en paysage
 * 8 et 8 ; la barre d'accueil de l'iPhone s'ajoute en bas. Sous les boutons,
 * il faut leur flanc (8 px) : 12 px les laissent respirer, 16 étaient 4 px de
 * plus que le budget du premier écran (le QCM 4 à 360 × 640 et à 375 × 667 :
 * `docs/direction-jeu-exercices.md`, « Le premier écran »).
 */
export type SceneDock = {
  /** L'emplacement où la barre se téléporte ; `null` le temps du premier rendu. */
  slot: HTMLElement | null;
  /** Se déclarer occupant ; la fonction rendue se désinscrit. */
  occupy: () => () => void;
};

const SceneDockContext = createContext<SceneDock | null>(null);

/** Le dock de la séance, ou `null` hors de la coque : la barre reste en ligne. */
export function useSceneDock(): SceneDock | null {
  return useContext(SceneDockContext);
}

/**
 * La racine qui porte le dock : rend ses enfants, puis le panneau, et pose
 * `--dock-h` (la hauteur mesurée du panneau, 0 quand il est vide) sur elle.
 * Les autres props vont à la `div` racine (classes, `data-*`).
 */
export function SceneDockProvider({
  children,
  style,
  ...rest
}: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [occupants, setOccupants] = useState(0);
  const [height, setHeight] = useState(0);

  const occupy = useCallback(() => {
    setOccupants((count) => count + 1);
    return () => setOccupants((count) => count - 1);
  }, []);
  const value = useMemo<SceneDock>(() => ({ slot, occupy }), [slot, occupy]);

  const empty = occupants === 0;
  // La place réservée en bas : le panneau, plus ce que le clavier recouvre
  // (iOS) pour que la page puisse défiler au-dessus de lui ; et le décalage du
  // viewport visuel, pour l'en-tête collant (clavier matériel).
  const { inset, top } = useVisualViewport();
  const dockHeight = (empty ? 0 : height) + inset;

  // Le document s'arrête au-dessus du dock quand il amène quelque chose dans
  // la vue (`scrollIntoView` d'un champ, de Playwright). Retiré avec la coque.
  useEffect(() => {
    const root = document.documentElement;
    if (dockHeight > 0) root.style.setProperty("scroll-padding-bottom", `${dockHeight}px`);
    else root.style.removeProperty("scroll-padding-bottom");
    return () => {
      root.style.removeProperty("scroll-padding-bottom");
    };
  }, [dockHeight]);

  const rootStyle = { ...style, "--dock-h": `${dockHeight}px`, "--vv-top": `${top}px` } as CSSProperties;

  return (
    <SceneDockContext.Provider value={value}>
      <div {...rest} style={rootStyle} data-dock-height={dockHeight} data-keyboard-up={inset > 0 ? "1" : undefined}>
        {children}
        <SceneDockPanel slotRef={setSlot} empty={empty} inset={inset} onHeight={setHeight} />
      </div>
    </SceneDockContext.Provider>
  );
}

/** Le panneau crème collé en bas, et l'emplacement dedans. */
function SceneDockPanel({
  slotRef,
  empty,
  inset,
  onHeight,
}: {
  slotRef: (element: HTMLDivElement | null) => void;
  empty: boolean;
  /** Ce que le clavier recouvre en bas sans redimensionner la fenêtre (iOS), en px. */
  inset: number;
  onHeight: (height: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // La hauteur du panneau, mesurée : marges et barre d'accueil comprises. Une
  // rangée ou deux, le mot « Écouter » ou pas, l'écran qui tourne : tout passe
  // par là. (jsdom n'a pas de `ResizeObserver` : les tests posent le leur.)
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    const measure = () => onHeight(Math.round(panel.getBoundingClientRect().height));
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    measure();
    return () => observer.disconnect();
  }, [onHeight]);

  const panelStyle: CSSProperties = {
    // Le dock monte au-dessus du clavier d'iOS ; au repos, pas de transform
    // du tout (un `fixed` transformé reste `fixed`, mais autant ne rien
    // composer pour rien).
    transform: inset > 0 ? `translate3d(0, -${inset}px, 0)` : undefined,
    // Posé sur le clavier, le dock n'a plus la barre d'accueil sous lui : 12 px
    // sous les boutons (leur flanc de 8 px et un souffle), quelle que soit la
    // hauteur de l'écran ; au repos, les classes décident (voir l'en-tête).
    paddingBottom: inset > 0 ? "12px" : undefined,
  };

  return (
    <div
      ref={panelRef}
      role="group"
      aria-label="Actions de l'exercice"
      data-scene-dock
      data-dock-empty={empty ? "1" : undefined}
      data-keyboard-inset={inset > 0 ? inset : undefined}
      // Le liseré blanc, un trait du flanc des cartes (`#d6c39a`) juste au-dessus
      // (l'épaisseur du plateau), une ombre portée vers le haut : trois ombres
      // STATIQUES, jamais animées. Le dégradé du `before:` fond le contenu qui
      // passe dessous.
      // Les marges en bas : le flanc des boutons et la barre d'accueil ; plus
      // serrées sur un téléphone, un téléphone couché (voir l'en-tête). Des
      // paliers qui s'excluent (Tailwind ne garantit pas l'ordre de deux
      // requêtes média arbitraires), écrits en entier (`scene-action-bar.tsx`).
      className={`gk-motion fixed inset-x-0 bottom-0 z-30 border-t-2 border-white bg-[#fff7e0] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] shadow-[0_-2px_0_#d6c39a,0_-10px_18px_-12px_rgba(60,30,0,0.45)] transition-transform duration-200 ease-out before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-5 before:bg-gradient-to-t before:from-[#fff7e0]/60 before:to-transparent [@media(max-height:960px)_and_(min-height:481px)]:pb-[calc(env(safe-area-inset-bottom,0px)+12px)] [@media(max-height:480px)]:pb-[calc(env(safe-area-inset-bottom,0px)+8px)] ${
        empty ? "invisible" : ""
      }`}
      style={panelStyle}
    >
      {/* Les marges latérales et la largeur de la carte : la barre est alignée sur elle (la page s'élargit en paysage, comme dans la coque). */}
      <div
        ref={slotRef}
        data-scene-dock-slot
        className="mx-auto max-w-2xl px-4 pt-[12px] [@media(max-height:960px)_and_(min-height:701px)]:pt-[10px] [@media(max-height:700px)]:pt-[8px] [@media(max-height:480px)]:max-w-4xl"
      />
    </div>
  );
}

/**
 * De combien le clavier recouvre le bas de la fenêtre sans la redimensionner
 * (iOS) : la hauteur du viewport de mise en page moins ce que le viewport
 * visuel montre. 0 partout où la fenêtre se redimensionne (Android), au repos,
 * et pendant un zoom au pincement.
 */
export function useKeyboardInset(): number {
  return useVisualViewport().inset;
}

/**
 * Le viewport visuel, en deux nombres : `inset`, ce que le clavier recouvre
 * (ci-dessus), et `top`, de combien WebKit a fait défiler le viewport visuel
 * dans celui de mise en page (`offsetTop` ; le clavier matériel d'iOS, voir
 * l'en-tête du fichier). Les deux valent 0 sans `visualViewport` (jsdom), au
 * repos, et pendant un zoom au pincement.
 */
export function useVisualViewport(): { inset: number; top: number } {
  const [state, setState] = useState({ inset: 0, top: 0 });
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const inset = keyboardInset(layoutViewportHeight(), viewport);
      const top = visualViewportTop(viewport);
      setState((current) => (current.inset === inset && current.top === top ? current : { inset, top }));
    };
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    update();
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return state;
}

/** Le décalage du viewport visuel, pur : 0 pendant un zoom au pincement. */
export function visualViewportTop(viewport: { offsetTop: number; scale: number }): number {
  if (viewport.scale > 1.01) return 0;
  return Math.max(0, Math.round(viewport.offsetTop));
}

/**
 * La hauteur du viewport de mise en page, celui où un élément `fixed` se cale.
 * Dans Safari, c'est `innerHeight` (il grandit quand la barre d'outils se
 * replie ; `clientHeight` reste la petite hauteur). Dans le WKWebView de
 * l'application, PAS `innerHeight` : quand le clavier monte, WebKit fait
 * défiler le viewport visuel DANS un viewport de mise en page qui ne bouge pas
 * (`pageTop` = `offsetTop` = `scrollY`, l'en-tête collant n'est plus collé), et
 * `innerHeight` rapporte des valeurs changeantes d'un essai à l'autre (874,
 * 682, 562 pour la même fenêtre de 874 px : mesuré le 18 octobre 2026 sur le
 * simulateur iPhone 17), alors que `documentElement.clientHeight` garde 874.
 * Avec `innerHeight`, le dock se calait 90 à 180 px SOUS le haut du clavier ;
 * le plus grand des deux est juste dans les deux moteurs (Android
 * redimensionne la fenêtre : les deux valent la même chose).
 */
export function layoutViewportHeight(): number {
  return Math.max(window.innerHeight, document.documentElement.clientHeight);
}

/** Le calcul, pur : testé seul. `layoutHeight` vient de `layoutViewportHeight()`. */
export function keyboardInset(
  layoutHeight: number,
  viewport: { height: number; offsetTop: number; scale: number },
): number {
  if (viewport.scale > 1.01) return 0;
  return Math.max(0, Math.round(layoutHeight - viewport.height - viewport.offsetTop));
}
