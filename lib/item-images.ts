/**
 * LES IMAGES DES TUILES : UN CATALOGUE FERMÉ, FABRIQUÉ À L'AVANCE.
 *
 * Un enfant de CI a six ans, et il ne sait pas encore lire. Une tuile « Lion »,
 * « La table » ou « midi » ne lui dit rien ; même « [souris] la souris » ne lui
 * montre qu'un émoji minuscule collé au mot ([souris] tient lieu de l'émoji).
 * Le propriétaire a joué une séance de CI en production, et l'a dit (demande du
 * 19 octobre 2026) : pour ranger des animaux du plus grand au plus petit, l'élève
 * doit VOIR de quel animal on parle. La règle : EN CI, TOUTE TUILE QUI NOMME UNE
 * CHOSE (animal, aliment, plante, partie du corps, objet, véhicule, signal de
 * route, lieu, solide, moment du jour, forme) MONTRE UNE VRAIE IMAGE DE
 * RÉFÉRENCE, un dessin propre, ET GARDE SON NOM ÉCRIT.
 *
 * ELLE SE RÉSOUT À L'AFFICHAGE, depuis ce catalogue fermé : aucune donnée ne
 * change, rien n'est régénéré, un déploiement du site suffit. Le texte d'une
 * tuile reste la chaîne que le serveur a envoyée, et la réponse qui part à
 * `onSubmit` ne change jamais d'un caractère. `lib/item-pictures.ts` reconnaît la
 * chose nommée par le texte de la tuile, avec ses règles et ses garde-fous (une
 * image ne doit jamais donner la réponse d'un exercice qui demande de relier un
 * mot à une image, ou de lire) ; l'écran s'en sert par
 * `components/exercises/item-pictures.tsx`, et ne la montre qu'aux classes de
 * `PICTURE_TILE_CLASSES`.
 *
 * LE CATALOGUE EST FERMÉ POUR DEUX RAISONS. Le serveur de production n'a pas
 * accès au studio d'images : une image ne se crée pas à la volée, elle se
 * fabrique à l'avance, et on la regarde avant de la garder. Et une tuile n'est
 * reconnue que si TOUTE sa chaîne est un nom du catalogue : « Fruits du
 * baobab », « les chats », « 3 pommes » ne reçoivent rien, parce qu'une image
 * posée sur une tuile qui ne dit pas ce qu'elle montre est pire que pas d'image.
 *
 * LES FICHIERS SONT DES FICHIERS DU SITE (`public/objets/<id>.webp`, 384 x 384,
 * fond blanc), comme ceux des images d'énoncé : ils partent dans l'application
 * (export statique, Capacitor), donc ils s'affichent aussi hors ligne.
 *
 * CE N'EST PAS LE CATALOGUE DES IMAGES D'ÉNONCÉ (`lib/exercise-images.ts`,
 * `public/exercices/`, `ExerciseImage`) : celles-là illustrent une QUESTION
 * (« Quel animal vois-tu ? ») et c'est le modèle qui les choisit, dans
 * `payload.image` ; celles-ci nomment une TUILE, et le modèle n'en choisit
 * aucune. Les deux ne se mélangent pas, sauf sur un point : une image d'énoncé
 * qui est aussi une image de tuile (le chat, la banane…) trahirait la tuile
 * qui la nomme, et `lib/item-pictures.ts` retire alors toutes les images.
 *
 * LES CHAMPS. `words` : les noms FRANÇAIS au singulier, sans article ; accents
 * et casse sont libres, `normalizeWord` les efface avant de comparer. `english` :
 * les noms anglais, À PART, parce qu'un mot anglais seul n'est pas fiable : « pen »
 * (le stylo) est aussi la première syllabe de « Penda », « car » une conjonction.
 * Un nom anglais n'est reconnu qu'avec un témoin (l'émoji de la chose en tête, ou
 * un autre nom anglais dans le même groupe de tuiles : « cat, dog, fish » est une
 * leçon d'anglais, « pen » entre « lo » et « lou » est une syllabe ;
 * `lib/item-pictures.ts`). `emoji` : les glyphes qui désignent la chose, avec
 * leur sélecteur U+FE0F quand l'émoji en porte un (ne pas les « nettoyer ») ; ils
 * servent de garde-fou à l'énoncé (un émoji de l'énoncé qui désigne la chose
 * trahirait la tuile) et de repli à une tuile qui commence par l'émoji
 * (« [chien] Rex »). Ils sont PRUDENTS : un glyphe qui dirait aussi autre chose
 * (le rond rouge, la couleur) n'y figure pas, sinon « [rond rouge] rouge »
 * recevrait l'image du rond. `guardEmoji` : les glyphes EN PLUS que seuls les
 * garde-fous lisent, plus larges (les ronds, les carrés, le dé, la brique, la
 * boîte de conserve, la goutte) : « Quel est le nom de cette forme ? [carré noir] »
 * ne doit pas laisser l'image du carré sur la bonne tuile. `ambiguousBare` : le
 * mot SEUL peut dire autre chose (« orange » : la couleur ; « Pierre » : le
 * prénom) ; l'image n'est alors donnée qu'avec un article (« une orange ») ou avec
 * l'émoji de la chose en tête. `bareInGroup` : le groupe peut lever le doute (l'orange
 * seule prend son image quand une autre tuile du groupe est un aliment : « pomme,
 * orange, banane »). `about` : ce qu'on a demandé au générateur d'images (le studio,
 * `bfl/flux-3-image`, en anglais : la langue qu'il lit le mieux), pour refaire une
 * image à l'identique ; pour les six formes, que le code dessine, c'est une
 * phrase en français.
 *
 * AJOUTER UNE IMAGE : voir `docs/paliers-et-exercices.md`, section « Des images
 * sur les tuiles (CI) ». En bref : fabriquer l'image avec le studio (un seul
 * sujet, fond blanc, sans texte, regardée avant d'être gardée), la convertir avec
 * `node scripts/build-item-images.mjs --raw <dossier> --ids <id>` (384 x 384, fond
 * blanc), ajouter l'entrée ci-dessous, puis lancer
 * `npx vitest run lib/__tests__/item-images.test.ts` : chaque entrée a son
 * fichier, chaque fichier son entrée, et aucun mot ni émoji n'est donné à deux
 * images.
 *
 * TROIS IMAGES ONT ÉTÉ REFAITES : le cylindre, le matin et le pilon, refusés après
 * trois tours de studio à la première vague, sont revenus au quatrième tour avec les
 * consignes que la documentation avait écrites pour eux (un bleu vif et opaque, un
 * coq sur une barrière, un pilon d'une pièce). Sept images se sont ajoutées pour les
 * mots les plus fréquents des paliers de CI qui n'en avaient pas (l'eau, la fleur, la
 * feuille, le lit, le bissap, le fromager) et pour la moto, qui empruntait l'image
 * du scooter : sans elles, une tuile sans image au milieu de tuiles illustrées
 * désigne la bonne réponse par élimination.
 *
 * LA RÈGLE EST PERMANENTE (AGENTS.md, « Les élèves de CI ne lisent pas »), pas une
 * liste à compléter un jour : la consigne de génération emprunte ses mots à ce
 * catalogue (`tilePicturesRule`, `convex/paliers/prompts.ts`), le contrôleur signale
 * une tuile qui nomme une chose absente d'ici (`ci_tile_without_picture`,
 * `convex/paliers/exerciseAudit.ts`), et `convex/__tests__/templatePictures.test.ts`
 * casse si un gabarit du code en nomme une. Une chose sans image n'a qu'une issue :
 * son image, ajoutée ici AVANT le contenu qui la nomme.
 *
 * LA VAGUE 2 a ajouté soixante-dix images, pour les mots que les paliers de CI en
 * production nommaient encore sans image : les parties de la plante, les plats, le
 * corps et les cinq sens, les feux et le passage piéton, des lieux et des scènes (la
 * savane, la ferme, le marché, la salle de classe), des objets, des vêtements et
 * l'après-midi. Les groupes `plantes`, `corps` et `signalisation` sont nouveaux.
 *
 * Module pur, sans dépendance : il sert à l'écran, aux garde-fous et aux tests.
 */

export type ItemImageGroup =
  | "animaux"
  | "aliments"
  | "plantes"
  | "corps"
  | "objets"
  | "vetements"
  | "transports"
  | "signalisation"
  | "lieux"
  | "solides"
  | "moments"
  | "formes";

export type ItemImage = {
  /** Minuscules, chiffres et tirets : c'est aussi le nom du fichier. */
  id: string;
  /** Ce que lit un lecteur d'écran. Court, en français, sans dire « image de ». */
  alt: string;
  group: ItemImageGroup;
  /** Les noms FRANÇAIS de la chose au singulier, sans article. */
  words: readonly string[];
  /** Les noms anglais, reconnus seulement avec un témoin (voir l'en-tête). */
  english?: readonly string[];
  /** Les glyphes qui désignent la chose (avec leur U+FE0F s'ils en portent un) : prudents. */
  emoji: readonly string[];
  /** Les glyphes en plus que seuls les garde-fous lisent : plus larges que `emoji`. */
  guardEmoji?: readonly string[];
  /** Le mot seul est ambigu (une couleur, un prénom…) : image seulement avec un article ou l'émoji de la chose. */
  ambiguousBare?: boolean;
  /**
   * Le mot seul prend pourtant son image quand une autre tuile du groupe est de ce
   * groupe d'images (« orange » parmi des aliments). Absent : le groupe n'y change
   * rien (« Pierre » parmi des lieux reste un prénom).
   */
  bareInGroup?: ItemImageGroup;
  /** La description donnée au générateur d'images (une phrase en français pour une forme dessinée par le code). */
  about: string;
};

/**
 * Les images fabriquées. Une entrée = un fichier `public/objets/<id>.webp`.
 * L'ordre est celui de l'inventaire : les animaux, les aliments, les objets, les
 * vêtements, les transports, les lieux, les solides, les moments du jour, les formes ;
 * la vague 2 vient à la suite, groupe par groupe.
 */
export const ITEM_IMAGES: readonly ItemImage[] = [
  // Les animaux
  { id: "chat", alt: "Un chat", group: "animaux", words: ["chat"], english: ["cat"], emoji: ["🐈", "🐱"],
    about: "an orange tabby cat sitting, seen from the side, tail curled around its feet" },
  { id: "chien", alt: "Un chien", group: "animaux", words: ["chien"], english: ["dog"], emoji: ["🐕", "🐶"],
    about: "a friendly brown and white dog with floppy ears, sitting, seen from the side" },
  { id: "poisson", alt: "Un poisson", group: "animaux", words: ["poisson"], english: ["fish"], emoji: ["🐟", "🐠"],
    about: "a single orange fish seen from the side, with fins and a tail, no water" },
  { id: "oiseau", alt: "Un oiseau", group: "animaux", words: ["oiseau"], english: ["bird"], emoji: ["🐦"],
    about: "a small blue songbird perched on nothing, seen from the side, with a short beak, wing and tail" },
  { id: "lion", alt: "Un lion", group: "animaux", words: ["lion"], emoji: ["🦁"],
    about: "a male lion with a big brown mane, sitting, seen from the side, friendly face" },
  { id: "poule", alt: "Une poule", group: "animaux", words: ["poule"], english: ["chicken", "hen"], emoji: ["🐔"],
    about: "a hen standing, seen from the side, red comb, brown and yellow feathers" },
  { id: "mouton", alt: "Un mouton", group: "animaux", words: ["mouton"], english: ["sheep"], emoji: ["🐑", "🐏"],
    about: "a white woolly sheep standing, seen from the side, dark face and legs" },
  { id: "singe", alt: "Un singe", group: "animaux", words: ["singe"], english: ["monkey"], emoji: ["🐒", "🐵"],
    about: "a brown monkey sitting, light face, long curled tail, friendly" },
  { id: "crocodile", alt: "Un crocodile", group: "animaux", words: ["crocodile"], emoji: ["🐊"],
    about: "a green crocodile seen from the side, long snout with a few teeth, bumpy back and tail, friendly cartoon" },
  { id: "ane", alt: "Un âne", group: "animaux", words: ["âne"], english: ["donkey"], emoji: ["🫏"],
    about: "a grey donkey standing, seen from the side, very long ears, small tail" },
  { id: "chevre", alt: "Une chèvre", group: "animaux", words: ["chèvre"], english: ["goat"], emoji: ["🐐"],
    about: "a white goat standing, seen from the side, small curved horns and a little beard" },
  { id: "hyene", alt: "Une hyène", group: "animaux", words: ["hyène"], english: ["hyena"], emoji: [],
    about: "a spotted hyena standing, seen from the side, sloping back, round ears, friendly cartoon" },
  { id: "vache", alt: "Une vache", group: "animaux", words: ["vache"], english: ["cow"], emoji: ["🐄", "🐮"],
    about: "a brown and white cow standing, seen from the side, small horns, pink udder" },
  { id: "elephant", alt: "Un éléphant", group: "animaux", words: ["éléphant"], emoji: ["🐘"],
    about: "a grey elephant standing, seen from the side, big ears, long trunk, white tusks" },
  { id: "girafe", alt: "Une girafe", group: "animaux", words: ["girafe"], english: ["giraffe"], emoji: ["🦒"],
    about: "a giraffe seen from the side, standing, long neck, orange-yellow body with brown patches, two small horns" },
  { id: "souris", alt: "Une souris", group: "animaux", words: ["souris"], english: ["mouse"], emoji: ["🐭", "🐁"],
    about: "a small grey mouse seen from the side, round ears, pink nose, long thin tail" },
  { id: "fourmi", alt: "Une fourmi", group: "animaux", words: ["fourmi"], english: ["ant"], emoji: ["🐜"],
    about: "a black ant seen from the side, three body parts, six legs and two antennae" },
  { id: "cheval", alt: "Un cheval", group: "animaux", words: ["cheval"], english: ["horse"], emoji: ["🐴", "🐎"],
    about: "a brown horse standing, seen from the side, dark mane and tail" },
  { id: "poussin", alt: "Un poussin", group: "animaux", words: ["poussin"], english: ["chick"], emoji: ["🐤", "🐥", "🐣"],
    about: "a fluffy yellow baby chick standing, tiny orange beak, seen from the side" },
  { id: "chaton", alt: "Un chaton", group: "animaux", words: ["chaton"], english: ["kitten"], emoji: [],
    about: "a tiny orange kitten sitting, big round head and big eyes, seen from the front" },
  { id: "oeuf", alt: "Un œuf", group: "animaux", words: ["œuf"], english: ["egg"], emoji: ["🥚"],
    about: "a single white hen's egg, plain oval, slightly tilted" },

  // Les aliments
  { id: "banane", alt: "Une banane", group: "aliments", words: ["banane"], english: ["banana"], emoji: ["🍌"],
    about: "a ripe yellow banana, curved, with a small brown tip" },
  { id: "mangue", alt: "Une mangue", group: "aliments", words: ["mangue"], english: ["mango"], emoji: ["🥭"],
    about: "a ripe mango, plump kidney-shaped fruit, yellow-orange with a red blush, one green leaf on top" },
  { id: "orange", alt: "Une orange", group: "aliments", words: ["orange"], emoji: ["🍊"], ambiguousBare: true, bareInGroup: "aliments",
    about: "an orange citrus fruit, perfectly round, with a small green leaf" },
  { id: "pomme", alt: "Une pomme", group: "aliments", words: ["pomme"], english: ["apple"], emoji: ["🍎", "🍏"],
    about: "a red apple with a brown stem and one green leaf" },
  { id: "ananas", alt: "Un ananas", group: "aliments", words: ["ananas"], english: ["pineapple"], emoji: ["🍍"],
    about: "a pineapple with its spiky green crown and golden diamond-patterned skin" },
  { id: "pasteque", alt: "Une pastèque", group: "aliments", words: ["pastèque"], english: ["watermelon"], emoji: ["🍉"],
    about: "a wedge slice of watermelon, red flesh with black seeds, green rind" },
  { id: "citron", alt: "Un citron", group: "aliments", words: ["citron"], english: ["lemon"], emoji: ["🍋"],
    about: "a yellow lemon, oval with two small pointed ends, with a green leaf" },
  { id: "fraise", alt: "Une fraise", group: "aliments", words: ["fraise"], english: ["strawberry"], emoji: ["🍓"],
    about: "a red strawberry with tiny seeds and a green leafy top" },
  { id: "aubergine", alt: "Une aubergine", group: "aliments", words: ["aubergine"], english: ["eggplant"], emoji: ["🍆"],
    about: "a purple eggplant (aubergine) with a green cap" },
  { id: "carotte", alt: "Une carotte", group: "aliments", words: ["carotte"], english: ["carrot"], emoji: ["🥕"],
    about: "an orange carrot with green leafy top" },
  { id: "concombre", alt: "Un concombre", group: "aliments", words: ["concombre"], english: ["cucumber"], emoji: ["🥒"],
    about: "a green cucumber, long, with light stripes" },
  { id: "brocoli", alt: "Un brocoli", group: "aliments", words: ["brocoli"], english: ["broccoli"], emoji: ["🥦"],
    about: "a green broccoli with a bushy floret top and a pale stem" },
  { id: "tomate", alt: "Une tomate", group: "aliments", words: ["tomate"], english: ["tomato"], emoji: ["🍅"],
    about: "a round red tomato with a green star-shaped top" },
  { id: "arachide", alt: "Des arachides", group: "aliments", words: ["arachide", "cacahuète"], english: ["peanut"], emoji: ["🥜"],
    about: "two peanut pods in their light brown shells, one open showing two nuts" },
  { id: "riz", alt: "Un bol de riz", group: "aliments", words: ["riz"], english: ["rice"], emoji: ["🍚"],
    about: "a bowl of white rice with steam, simple blue bowl" },
  { id: "mil", alt: "Du mil", group: "aliments", words: ["mil", "millet"], emoji: [],
    about: "a stalk of millet: a green stem with leaves and a dense golden-brown cylindrical grain head at the top" },
  { id: "lait-caille", alt: "Du lait caillé", group: "aliments", words: ["lait caillé"], emoji: [],
    about: "a white bowl full of thick white curdled milk, with a wooden spoon" },
  { id: "eau", alt: "De l'eau", group: "aliments", words: ["eau"], english: ["water"], emoji: [], guardEmoji: ["💧"],
    about: "a tall drinking glass full of water: saturated sky-blue water inside a clear glass with a thick dark outline, a white highlight stripe on the glass, a few small bubbles, no straw" },
  { id: "bissap", alt: "Du bissap", group: "aliments", words: ["bissap"], emoji: [],
    about: "a tall glass full of deep red hibiscus drink (bissap) with a few ice cubes, and one red hibiscus flower lying beside the glass" },

  // Les objets
  { id: "chaise", alt: "Une chaise", group: "objets", words: ["chaise"], english: ["chair"], emoji: ["🪑"],
    about: "a simple wooden chair with four legs and a backrest, seen slightly from the side" },
  { id: "table", alt: "Une table", group: "objets", words: ["table"], emoji: [],
    about: "a simple wooden table with four straight legs, seen slightly from the front and above, light brown top" },
  { id: "seau", alt: "Un seau", group: "objets", words: ["seau"], english: ["bucket"], emoji: ["🪣"],
    about: "a blue plastic bucket with a metal handle" },
  { id: "assiette", alt: "Une assiette", group: "objets", words: ["assiette"], english: ["plate"], emoji: ["🍽️"],
    about: "an empty round white plate with a blue rim, seen slightly from above" },
  { id: "ordinateur", alt: "Un ordinateur", group: "objets", words: ["ordinateur", "ordinateur portable"], english: ["laptop", "computer"], emoji: ["💻"],
    about: "an open laptop computer, screen glowing light blue with no text, keyboard visible" },
  { id: "velo", alt: "Un vélo", group: "objets", words: ["vélo", "bicyclette"], english: ["bicycle", "bike"], emoji: ["🚲"],
    about: "a simple red bicycle seen from the side, two wheels, handlebar, seat" },
  { id: "ciseaux", alt: "Des ciseaux", group: "objets", words: ["ciseaux"], english: ["scissors"], emoji: ["✂️"],
    about: "a pair of scissors with red handles, slightly open" },
  { id: "balai", alt: "Un balai", group: "objets", words: ["balai"], english: ["broom"], emoji: ["🧹"],
    about: "a broom with a long wooden handle and yellow bristles, standing upright" },
  { id: "marteau", alt: "Un marteau", group: "objets", words: ["marteau"], english: ["hammer"], emoji: ["🔨"],
    about: "a hammer with a brown wooden handle and a grey metal head" },
  { id: "mortier", alt: "Un mortier", group: "objets", words: ["mortier"], english: ["mortar"], emoji: [],
    about: "a traditional wooden mortar, a thick wooden bowl on a base, with a long wooden pestle standing in it" },
  { id: "arrosoir", alt: "Un arrosoir", group: "objets", words: ["arrosoir"], english: ["watering can"], emoji: [],
    about: "a green watering can with a long spout and a handle, a few water drops falling from the spout" },
  { id: "cahier", alt: "Un cahier", group: "objets", words: ["cahier"], english: ["notebook"], emoji: ["📓", "📒"],
    about: "a closed notebook with a blue cover and a spiral binding, plain cover without any writing" },
  { id: "stylo", alt: "Un stylo", group: "objets", words: ["stylo"], emoji: ["🖊️", "🖋️"],
    about: "a blue ballpoint pen with a cap, lying diagonally" },
  { id: "regle", alt: "Une règle", group: "objets", words: ["règle"], english: ["ruler"], emoji: ["📏"],
    about: "a flat yellow ruler with small plain tick marks and no numbers" },
  { id: "crayon", alt: "Un crayon", group: "objets", words: ["crayon"], english: ["pencil"], emoji: ["✏️"],
    about: "a yellow pencil, sharpened, with a pink eraser, lying diagonally" },
  { id: "ballon", alt: "Un ballon", group: "objets", words: ["ballon"], english: ["ball"], emoji: ["⚽"],
    about: "a black and white football" },
  { id: "lampe", alt: "Une lampe", group: "objets", words: ["lampe"], english: ["lamp"], emoji: [],
    about: "a small desk lamp with a round shade, switched on, with a soft yellow glow" },
  { id: "poupee", alt: "Une poupée", group: "objets", words: ["poupée"], english: ["doll"], emoji: [],
    about: "a rag doll with brown skin, braided black hair and a colourful dress, standing" },
  { id: "livre", alt: "Un livre", group: "objets", words: ["livre", "livres"], english: ["book"], emoji: ["📕", "📖", "📚"],
    about: "a closed book with a red cover, plain cover without a title" },
  { id: "savon", alt: "Un savon", group: "objets", words: ["savon"], english: ["soap"], emoji: ["🧼"],
    about: "a rectangular bar of blue soap with white bubbles on top" },
  { id: "robinet", alt: "Un robinet", group: "objets", words: ["robinet"], english: ["tap", "faucet"], emoji: ["🚰"],
    about: "a metal water tap with a drop of blue water falling from it" },
  { id: "lit", alt: "Un lit", group: "objets", words: ["lit"], english: ["bed"], emoji: ["🛏️"],
    about: "a simple child's bed seen from the side and slightly from above: a wooden frame with four short legs, a white pillow, a bright blue blanket" },
  { id: "pilon", alt: "Un pilon", group: "objets", words: ["pilon"], english: ["pestle"], emoji: [],
    about: "one single thick, chunky wooden pestle carved from one piece, smooth continuous outline, a gently narrower hand grip in the middle swelling into big rounded pounding ends, one end clearly larger, plain clean light-brown wood, tilted diagonally with wide margins" },

  // Les vêtements
  { id: "tee-shirt", alt: "Un tee-shirt", group: "vetements", words: ["tee-shirt", "t-shirt", "tee shirt"], emoji: ["👕"],
    about: "a red short-sleeved t-shirt, plain, laid flat" },
  { id: "robe", alt: "Une robe", group: "vetements", words: ["robe"], english: ["dress"], emoji: ["👗"],
    about: "a yellow dress with short sleeves and a wide skirt, laid flat" },
  { id: "chapeau", alt: "Un chapeau", group: "vetements", words: ["chapeau"], english: ["hat"], emoji: ["👒"],
    about: "a straw hat with a wide brim and a red ribbon" },

  // Les transports
  { id: "voiture", alt: "Une voiture", group: "transports", words: ["voiture", "auto"], english: ["car"], emoji: ["🚗"],
    about: "a small orange car seen from the side, four wheels, windows" },
  { id: "bus", alt: "Un bus", group: "transports", words: ["bus"], emoji: ["🚌"],
    about: "a yellow bus seen from the side, with windows and wheels" },
  { id: "scooter", alt: "Un scooter", group: "transports", words: ["scooter"], emoji: ["🛵"],
    about: "a small blue motor scooter seen from the side, two wheels" },
  { id: "bateau", alt: "Un bateau", group: "transports", words: ["bateau"], english: ["boat"], emoji: ["⛵", "🚤"],
    about: "a small boat with a white sail and a red hull, no water" },
  { id: "pirogue", alt: "Une pirogue", group: "transports", words: ["pirogue"], emoji: [],
    about: "a long colourful wooden fishing canoe (pirogue) painted with blue, red and yellow stripes, no water, nobody inside" },
  { id: "charrette", alt: "Une charrette", group: "transports", words: ["charrette"], english: ["cart"], emoji: [],
    about: "a wooden two-wheeled cart (charrette) with an empty flat bed and two long pull shafts, no animal" },
  { id: "moto", alt: "Une moto", group: "transports", words: ["moto"], english: ["motorbike", "motorcycle"], emoji: ["🏍️"],
    about: "a red motorcycle seen from the side: two big wheels, a long seat, a handlebar, a fuel tank and a round headlight, no rider" },

  // Les lieux et la nature
  { id: "baobab", alt: "Un baobab", group: "lieux", words: ["baobab"], emoji: [],
    about: "a baobab tree: a very thick bottle-shaped grey-brown trunk with a flat crown of short bare branches and a few leaves" },
  { id: "manguier", alt: "Un manguier", group: "lieux", words: ["manguier"], english: ["mango tree"], emoji: [],
    about: "a leafy green mango tree with a brown trunk and yellow-orange mangoes hanging among the leaves" },
  { id: "mosquee", alt: "Une mosquée", group: "lieux", words: ["mosquée"], english: ["mosque"], emoji: ["🕌"],
    about: "a simple white mosque with a green dome and one tall minaret tower, clean flat style" },
  { id: "portail", alt: "Un portail", group: "lieux", words: ["portail"], english: ["gate"], emoji: [],
    about: "a closed double metal gate with vertical bars painted green, between two short white pillars" },
  { id: "arbre", alt: "Un arbre", group: "lieux", words: ["arbre"], english: ["tree"], emoji: ["🌳"],
    about: "a green leafy tree with a brown trunk and a round crown" },
  { id: "pierre", alt: "Une pierre", group: "lieux", words: ["pierre"], english: ["stone"], emoji: ["🪨"], ambiguousBare: true, bareInGroup: "lieux",
    about: "a single smooth grey stone, rounded and a little flat" },
  { id: "sable", alt: "Du sable", group: "lieux", words: ["sable"], english: ["sand"], emoji: [],
    about: "a small heap of golden yellow sand shaped like a mound" },
  { id: "maison", alt: "Une maison", group: "lieux", words: ["maison"], english: ["house"], emoji: ["🏠", "🏡"],
    about: "a small house with a red roof, a door and two windows" },
  { id: "fromager", alt: "Un fromager", group: "lieux", words: ["fromager"], emoji: [],
    about: "a giant silk-cotton tree (a fromager, a ceiba): a very tall grey trunk with small cone-shaped thorns, flaring at the base into huge flat buttress roots like walls, and a wide flat umbrella-shaped crown of green leaves" },
  { id: "fleur", alt: "Une fleur", group: "lieux", words: ["fleur", "fleurs"], english: ["flower"], emoji: ["🌸", "🌼", "🌷", "🌹", "🌺", "🌻"],
    about: "a single flower with a long green stem and two green leaves: one big pink flower with round petals and a yellow center" },
  { id: "feuille", alt: "Une feuille", group: "lieux", words: ["feuille", "feuilles"], english: ["leaf"], emoji: ["🍃", "🍂", "🍁"],
    about: "a single green leaf with a central vein, side veins and a short stem, bright fresh green, tilted a little" },

  // Les solides
  { id: "cube", alt: "Un cube", group: "solides", words: ["cube"], emoji: [], guardEmoji: ["🎲", "🧊"],
    about: "a plain light orange cube (a solid with six equal square faces, three faces visible)" },
  { id: "boule", alt: "Une boule", group: "solides", words: ["boule", "sphère"], emoji: [], guardEmoji: ["🏀", "⚾", "🎾"],
    about: "a smooth light blue sphere with a soft white highlight, plain" },
  { id: "pave", alt: "Un pavé", group: "solides", words: ["pavé"], english: ["rectangular prism"], emoji: [], guardEmoji: ["🧱", "📦"],
    about: "a long rectangular block (cuboid) like a brick, light green, three faces visible" },
  { id: "cylindre", alt: "Un cylindre", group: "solides", words: ["cylindre"], english: ["cylinder"], emoji: [], guardEmoji: ["🥫", "🛢️"],
    about: "a plain smooth cylinder like a tin can without a label: bright saturated sky blue (about #3FA9F5), fully opaque, solid flat colour with one darker side band, a single flat elliptical top, thick dark-brown outline" },

  // Les moments du jour (des scènes carrées : le ciel clair reste intact)
  { id: "midi", alt: "Midi", group: "moments", words: ["midi"], english: ["noon"], emoji: [],
    about: "a square scene: a bright yellow sun high at the top of a clear blue sky above a green field" },
  { id: "soir", alt: "Le soir", group: "moments", words: ["soir"], english: ["evening"], emoji: [],
    about: "a square sunset scene: an orange-red sun low on the horizon behind a dark green hill, orange and purple sky" },
  { id: "nuit", alt: "La nuit", group: "moments", words: ["nuit"], english: ["night"], emoji: [],
    about: "a square night scene: a white crescent moon and a few yellow stars in a deep blue sky" },
  { id: "matin", alt: "Le matin", group: "moments", words: ["matin"], english: ["morning"], emoji: [],
    about: "a square morning scene: a big orange half sun rising behind bright green hills under a golden-yellow sky, a cartoon rooster crowing on a low wooden fence in the foreground" },

  // Les formes (dessinées par le code, pas par le studio)
  { id: "carre", alt: "Un carré", group: "formes", words: ["carré"], english: ["square"], emoji: [], guardEmoji: ["⬛", "⬜", "🔲", "🔳", "🟥", "🟦", "🟧", "🟨", "🟩", "🟪", "🟫"],
    about: "un carré bleu dessiné par scripts/build-item-images.mjs" },
  { id: "rond", alt: "Un rond", group: "formes", words: ["rond", "cercle", "disque"], english: ["circle"], emoji: [], guardEmoji: ["🔴", "🔵", "⚫", "⚪", "🟠", "🟡", "🟢", "🟣", "🟤", "⭕"],
    about: "un rond rouge dessiné par scripts/build-item-images.mjs" },
  { id: "triangle", alt: "Un triangle", group: "formes", words: ["triangle"], emoji: [], guardEmoji: ["🔺", "🔻"],
    about: "un triangle vert dessiné par scripts/build-item-images.mjs" },
  { id: "rectangle", alt: "Un rectangle", group: "formes", words: ["rectangle"], emoji: [],
    about: "un rectangle orange dessiné par scripts/build-item-images.mjs" },
  { id: "coeur", alt: "Un cœur", group: "formes", words: ["cœur"], english: ["heart"], emoji: [], guardEmoji: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💗", "💓", "💕", "💞", "💝"],
    about: "un cœur rose dessiné par scripts/build-item-images.mjs" },
  { id: "etoile", alt: "Une étoile", group: "formes", words: ["étoile"], english: ["star"], emoji: [], guardEmoji: ["⭐", "🌟"],
    about: "une étoile jaune dessinée par scripts/build-item-images.mjs" },

  // LA VAGUE 2 (19 octobre 2026) : les choses que les paliers de CI nommaient encore sans
  // image. Mêmes champs, mêmes règles. Les scènes (le ciel, la savane, la ferme, le jardin,
  // le marché, la salle de classe, la montagne, le passage piéton, l'après-midi) remplissent
  // tout le carré : elles sont listées dans `SCENES`, scripts/build-item-images.mjs.
  // Les plantes et leurs parties (vague 2)
  { id: "tige", alt: "Une tige", group: "plantes", words: ["tige"], emoji: [],
    about: "a single upright green plant stem (stalk) with two small leaves, no flower, no roots" },
  { id: "racine", alt: "Des racines", group: "plantes", words: ["racine", "racines"], emoji: [],
    about: "the brown branching roots of a plant hanging down with a few crumbs of soil, the roots alone" },
  { id: "graine", alt: "Des graines", group: "plantes", words: ["graine", "graines"], emoji: [],
    about: "three large brown plant seeds lying together, plain oval seeds" },
  { id: "fruit", alt: "Un fruit", group: "plantes", words: ["fruit"], emoji: [],
    about: "a round orange-red fruit hanging from a short green twig with two green leaves" },
  { id: "plante", alt: "Une plante", group: "plantes", words: ["plante"], emoji: ["🪴"],
    about: "a small green potted plant with several leaves in a terracotta pot" },
  { id: "arachidier", alt: "Un arachidier", group: "plantes", words: ["arachidier"], emoji: [],
    about: "a small green peanut plant with oval leaves, showing a few peanut pods hanging from its roots in brown soil" },
  { id: "fruit-du-baobab", alt: "Un fruit du baobab", group: "plantes", words: ["fruit du baobab", "fruits du baobab"], emoji: [],
    about: "a baobab fruit: one big oval velvety light-brown pod with a short stem, plain" },
  { id: "fruit-du-fromager", alt: "Un fruit du fromager", group: "plantes", words: ["fruit du fromager", "fruits du fromager"], emoji: [],
    about: "a kapok (fromager) tree fruit: a long green-brown pod split open showing white fluffy cotton" },
  { id: "grains-de-mil", alt: "Des grains de mil", group: "plantes", words: ["grains de mil", "grain de mil"], emoji: [],
    about: "a small heap of tiny round golden millet grains" },
  // Les aliments, les plats et les boissons (vague 2)
  { id: "yassa", alt: "Du yassa", group: "aliments", words: ["yassa", "poulet yassa"], emoji: [],
    about: "a plate of white rice topped with pieces of grilled chicken and lots of caramelised golden onions in sauce, with a slice of lemon" },
  { id: "mafe", alt: "Du mafé", group: "aliments", words: ["mafé", "mafe"], emoji: [],
    about: "a plate of white rice with a thick brown peanut sauce, chunks of meat, a piece of potato and a piece of carrot" },
  { id: "thieboudienne", alt: "Du thiéboudienne", group: "aliments", words: ["thiéboudienne", "thieb"], emoji: [],
    about: "a big plate of orange-red rice with a whole fish, carrot pieces, cabbage wedges and cassava pieces on top" },
  { id: "fonio", alt: "Du fonio", group: "aliments", words: ["fonio"], emoji: [],
    about: "a small white bowl of cooked fonio, pale yellow fluffy tiny grains, with a wooden spoon" },
  { id: "pizza", alt: "Une pizza", group: "aliments", words: ["pizza"], emoji: ["🍕"],
    about: "a round pizza with one slice pulled away, tomato sauce, melted cheese and a few green olives" },
  { id: "cafe", alt: "Un café", group: "aliments", words: ["café", "cafe"], emoji: ["☕"],
    about: "a white cup of hot coffee on a saucer with a little steam" },
  { id: "bonbon", alt: "Un bonbon", group: "aliments", words: ["bonbon"], emoji: ["🍬"],
    about: "a wrapped candy with twisted ends, red and white wrapper" },
  { id: "chocolat", alt: "Du chocolat", group: "aliments", words: ["chocolat"], emoji: ["🍫"],
    about: "a bar of dark brown chocolate partly unwrapped, square pieces visible, no writing on the wrapper" },
  { id: "olive", alt: "Une olive", group: "aliments", words: ["olive"], emoji: ["🫒"],
    about: "two green olives on a short twig with one leaf" },
  { id: "sel", alt: "Du sel", group: "aliments", words: ["sel"], emoji: ["🧂"],
    about: "a small glass salt shaker with a silver cap, full of white salt" },
  { id: "viande", alt: "De la viande", group: "aliments", words: ["viande"], emoji: ["🥩"],
    about: "a piece of juicy grilled beef steak with dark grill marks" },
  { id: "lait", alt: "Du lait", group: "aliments", words: ["lait"], emoji: ["🥛"],
    about: "a tall glass full of white milk" },
  { id: "goyave", alt: "Une goyave", group: "aliments", words: ["goyave"], english: ["guava"], emoji: [],
    about: "a round yellow-green guava fruit with one green leaf" },
  { id: "ngalakh", alt: "Du ngalakh", group: "aliments", words: ["ngalakh"], emoji: [],
    about: "a bowl of ngalakh, a thick light-brown sweet millet pudding topped with crushed peanuts" },
  // Les animaux (vague 2)
  { id: "rat", alt: "Un rat", group: "animaux", words: ["rat"], emoji: ["🐀"],
    about: "a grey-brown rat sitting, seen from the side, pointed snout, small round ears, long thin bare tail, bigger than a mouse" },
  { id: "chevreau", alt: "Un chevreau", group: "animaux", words: ["chevreau"], emoji: [],
    about: "a baby goat (kid) standing, small, white, tiny horn buds, big ears, friendly" },
  { id: "lionceau", alt: "Un lionceau", group: "animaux", words: ["lionceau"], emoji: [],
    about: "a lion cub sitting, fluffy golden fur, round face, small round ears, no mane, friendly" },
  { id: "etoile-de-mer", alt: "Une étoile de mer", group: "animaux", words: ["étoile de mer"], emoji: [],
    about: "an orange starfish with five arms and tiny bumps" },
  // Le corps et les cinq sens (vague 2)
  { id: "mains", alt: "Des mains", group: "corps", words: ["main", "mains"], emoji: [],
    about: "two open hands side by side, palms facing the viewer, brown skin, friendly cartoon" },
  { id: "bouche", alt: "Une bouche", group: "corps", words: ["bouche"], emoji: ["👄"],
    about: "a smiling human mouth seen from the front, red lips and white teeth, cartoon, the mouth alone" },
  { id: "dents", alt: "Des dents", group: "corps", words: ["dent", "dents"], emoji: ["🦷"],
    about: "a smile showing two clean rows of white teeth and pink gums, cartoon, no lips" },
  { id: "yeux", alt: "Des yeux", group: "corps", words: ["yeux", "oeil"], emoji: ["👀"],
    about: "a pair of brown eyes with eyebrows seen from the front, cartoon, the eyes alone" },
  { id: "ongles", alt: "Des ongles", group: "corps", words: ["ongle", "ongles"], emoji: [],
    about: "a child's hand seen from the back with five short clean fingernails, brown skin" },
  { id: "nez", alt: "Un nez", group: "corps", words: ["nez"], emoji: ["👃"],
    about: "a human nose seen from the front with two nostrils, brown skin, cartoon, the nose alone" },
  { id: "oreille", alt: "Une oreille", group: "corps", words: ["oreille", "oreilles"], emoji: ["👂"],
    about: "one human ear seen from the side, brown skin, cartoon, the ear alone" },
  { id: "langue", alt: "Une langue", group: "corps", words: ["langue"], emoji: ["👅"],
    about: "a big pink tongue sticking out of a smiling mouth with red lips, cartoon" },
  { id: "tete", alt: "Une tête", group: "corps", words: ["tête", "tete"], emoji: [],
    about: "a smiling child's head and neck seen from the front, brown skin, short black hair, cartoon" },
  { id: "cheveux", alt: "Des cheveux", group: "corps", words: ["cheveu", "cheveux"], emoji: [],
    about: "a girl's head seen from behind with long black braided hair, cartoon" },
  { id: "bras", alt: "Un bras", group: "corps", words: ["bras"], emoji: ["💪"],
    about: "a child's brown arm bent at the elbow with the hand closed, seen from the side, the arm alone, cartoon" },
  { id: "jambes", alt: "Des jambes", group: "corps", words: ["jambe", "jambes"], emoji: ["🦵"],
    about: "two brown child legs wearing yellow shorts, standing, seen from the front, the legs and feet alone, cartoon" },
  { id: "pieds", alt: "Des pieds", group: "corps", words: ["pied", "pieds"], emoji: ["🦶"],
    about: "two bare brown feet side by side seen from the front and slightly above, cartoon" },
  { id: "doigts", alt: "Un doigt", group: "corps", words: ["doigt", "doigts"], emoji: ["☝\uFE0F"],
    about: "a single brown hand pointing up with the index finger, the other fingers folded, cartoon" },
  // La route (vague 2)
  { id: "feu-rouge", alt: "Le feu rouge", group: "signalisation", words: ["feu rouge"], emoji: [],
    about: "a vertical traffic light, a black box with three round lights, the RED light on top lit bright, the yellow and green lights dark" },
  { id: "feu-jaune", alt: "Le feu jaune", group: "signalisation", words: ["feu jaune", "feu orange"], emoji: [],
    about: "a vertical traffic light, a black box with three round lights, the YELLOW light in the middle lit bright, the red and green lights dark" },
  { id: "feu-vert", alt: "Le feu vert", group: "signalisation", words: ["feu vert"], emoji: [],
    about: "a vertical traffic light, a black box with three round lights, the GREEN light at the bottom lit bright, the red and yellow lights dark" },
  { id: "passage-pour-pietons", alt: "Un passage pour piétons", group: "signalisation", words: ["passage pour piétons", "passage piéton"], emoji: [],
    about: "a zebra pedestrian crossing: wide white stripes on grey asphalt seen from slightly above, plain road, no people, no cars" },
  // Les lieux et la nature (vague 2)
  { id: "ciel", alt: "Le ciel", group: "lieux", words: ["ciel"], emoji: [],
    about: "a bright blue sky with a few fluffy white clouds, nothing else" },
  { id: "soleil", alt: "Le soleil", group: "lieux", words: ["soleil"], emoji: ["☀\uFE0F", "🌞"],
    about: "a bright yellow sun with short rays all around, no face" },
  { id: "savane", alt: "La savane", group: "lieux", words: ["savane"], emoji: [],
    about: "an African savanna landscape: golden grass, one flat-topped acacia tree, distant hills, warm sky" },
  { id: "montagne", alt: "Une montagne", group: "lieux", words: ["montagne"], emoji: ["⛰\uFE0F"],
    about: "a big green mountain with a rocky peak under a blue sky" },
  { id: "ferme", alt: "La ferme", group: "lieux", words: ["ferme"], emoji: [], ambiguousBare: true, bareInGroup: "lieux",
    about: "a small farm: a red barn, a wooden fence, green grass and a couple of hens" },
  { id: "jardin", alt: "Un jardin", group: "lieux", words: ["jardin"], emoji: [],
    about: "a vegetable garden with neat rows of green plants and a watering can on brown soil" },
  { id: "marche", alt: "Le marché", group: "lieux", words: ["marché"], emoji: [], ambiguousBare: true, bareInGroup: "lieux",
    about: "a colourful African market stall with a striped canopy and baskets of fruits and vegetables" },
  { id: "abri", alt: "Un abri", group: "lieux", words: ["abri"], emoji: [],
    about: "a small simple wooden shed with a tin roof and an open door" },
  { id: "tente", alt: "Une tente", group: "lieux", words: ["tente"], emoji: ["⛺"], ambiguousBare: true, bareInGroup: "lieux",
    about: "a small orange camping tent with its door open" },
  { id: "salle-de-classe", alt: "Une salle de classe", group: "lieux", words: ["salle de classe", "classe"], emoji: [],
    about: "a classroom: a green blackboard with no writing, a wooden teacher's desk and two small student desks" },
  // Les objets (vague 2)
  { id: "fenetre", alt: "Une fenêtre", group: "objets", words: ["fenêtre", "fenetre"], emoji: [],
    about: "a square window with a white wooden frame and four light-blue glass panes" },
  { id: "toit", alt: "Un toit", group: "objets", words: ["toit", "toit de maison"], emoji: [],
    about: "a red tiled triangular house roof seen from the front, the roof alone" },
  { id: "armoire", alt: "Une armoire", group: "objets", words: ["armoire"], emoji: [],
    about: "a tall brown wooden wardrobe with two doors and small round knobs" },
  { id: "tiroir", alt: "Un tiroir", group: "objets", words: ["tiroir"], emoji: [],
    about: "a small brown wooden chest of drawers with one drawer pulled open" },
  { id: "drapeau", alt: "Un drapeau", group: "objets", words: ["drapeau", "drapeau du sénégal"], emoji: ["🇸🇳"],
    about: "the flag of Senegal on a pole: three vertical stripes green, yellow, red, with a small green five-pointed star in the yellow stripe" },
  { id: "radio", alt: "Une radio", group: "objets", words: ["radio"], emoji: ["📻"],
    about: "an old-style radio with a round speaker grille, two knobs and a short antenna, light brown and cream" },
  { id: "loupe", alt: "Une loupe", group: "objets", words: ["loupe"], emoji: ["🔍"],
    about: "a magnifying glass with a wooden handle and a round glass" },
  { id: "balle", alt: "Une balle", group: "objets", words: ["balle"], emoji: [],
    about: "a small yellow-green tennis ball with a white curved line" },
  { id: "boite-a-outils", alt: "Une boîte à outils", group: "objets", words: ["boîte à outils"], emoji: ["🧰"],
    about: "a red metal toolbox with a carrying handle, closed" },
  { id: "poussette", alt: "Une poussette", group: "objets", words: ["poussette"], emoji: [],
    about: "a baby stroller with a hood and four small wheels, blue and grey, empty" },
  { id: "cartable", alt: "Un cartable", group: "objets", words: ["cartable"], emoji: ["🎒"],
    about: "a blue school backpack with a front pocket and two straps" },
  // Les vêtements (vague 2)
  { id: "pantalon", alt: "Un pantalon", group: "vetements", words: ["pantalon"], emoji: ["👖"],
    about: "blue jeans trousers laid flat, plain, no logo" },
  { id: "chaussette", alt: "Une chaussette", group: "vetements", words: ["chaussette"], emoji: ["🧦"],
    about: "a single red and white striped sock laid flat" },
  { id: "foulard", alt: "Un foulard", group: "vetements", words: ["foulard"], emoji: ["🧣"],
    about: "a colourful red and yellow patterned scarf (foulard), loosely folded" },
  // Les moments de la journée (vague 2)
  { id: "apres-midi", alt: "L'après-midi", group: "moments", words: ["après-midi", "apres-midi"], emoji: [],
    about: "a square scene: a warm golden sun halfway down a bright sky over green fields, a few small white clouds, a lone acacia tree" },
];

/** Où les fichiers sont servis (dossier `public/objets/`). */
export const ITEM_IMAGE_DIR = "/objets";

/** Le côté d'un fichier, en pixels : toutes les images sont carrées. */
export const ITEM_IMAGE_SIZE = 384;

export const ITEM_IMAGE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function itemImageSrc(id: string): string {
  return `${ITEM_IMAGE_DIR}/${id}.webp`;
}

/* Les caractères invisibles sont construits par leur code : écrits en clair, ils
   seraient invisibles dans la source. Le sélecteur de variation émoji (U+FE0F)
   décide seulement du dessin d'un glyphe (couleur ou texte) : jamais de son sens.
   Le joncteur sans chasse (U+200D) ne s'efface pas d'un mot : « chat » suivi de
   lui est « chat » ; les deux marques de sens de l'écriture (U+200E, U+200F) non plus. */
const VARIATION_SELECTOR = String.fromCharCode(0xfe0f);
const INVISIBLE = new RegExp(
  `[${[0x00ad, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2060, 0xfeff].map((code) => String.fromCharCode(code)).join("")}]`,
  "g",
);
/* Les apostrophes courbes (‘ ’ ʼ ′) deviennent l'apostrophe droite, avec l'accent
   grave et l'accent aigu écrits seuls (U+0060, U+00B4) : un clavier de téléphone les
   donne pour une apostrophe. Ces deux-là sont construits par leur code. */
const CURLY_APOSTROPHES = new RegExp(`[‘’ʼ′${String.fromCharCode(0x60, 0xb4)}]`, "g");
/* Le trait d'union (U+2010) et le trait d'union insécable (U+2011) deviennent « - » :
   « tee‑shirt » écrit avec lui reste un tee-shirt. Construits par leur code, car ils
   ressemblent au trait d'union ordinaire. */
const TYPOGRAPHIC_HYPHENS = new RegExp(`[${String.fromCharCode(0x2010, 0x2011)}]`, "g");
/* La ponctuation qui ferme un mot ou une phrase. */
const TRAILING_PUNCTUATION = new Set([".", ",", ";", ":", "!", "?", "…"]);
const WHITESPACE = /\s/u;

/**
 * Retire la ponctuation finale (. , ; : ! ? …) et les espaces qui la précèdent ou
 * la suivent, en lisant la fin du texte une fois : une expression régulière
 * `[\s.,;:!?…]+$` y relit tout le texte à chaque signe, et une longue suite de
 * ponctuation suivie d'une lettre coûtait un temps quadratique.
 */
function trimTrailingPunctuation(text: string): string {
  let end = text.length;
  while (end > 0) {
    const char = text[end - 1];
    if (!TRAILING_PUNCTUATION.has(char) && !WHITESPACE.test(char)) break;
    end--;
  }
  return text.slice(0, end);
}

/**
 * Un mot ou une tuile, ramené à la forme qui se compare : sans accent ni
 * diacritique, « œ » devenu « oe » et « æ » « ae », en minuscules, l'apostrophe
 * courbe redressée, le trait d'union typographique ramené au trait d'union, les
 * espaces repliés en un seul, rogné, et la ponctuation finale (. , ; : ! ? …)
 * retirée. « L’Éléphant ! » donne « l'elephant ».
 * Rien d'autre n'est touché : « tee-shirt » garde son tiret, « 3 pommes » son chiffre.
 */
export function normalizeWord(text: string): string {
  const folded = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(INVISIBLE, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(CURLY_APOSTROPHES, "'")
    .replace(TYPOGRAPHIC_HYPHENS, "-")
    .replace(/\s+/g, " ")
    .trim();
  return trimTrailingPunctuation(folded);
}

/** Un glyphe sans son sélecteur de variation, ni espaces autour : avec ou sans lui, c'est le même. */
function bareGlyph(glyph: string): string {
  return glyph.split(VARIATION_SELECTOR).join("").trim();
}

type Index = {
  byWord: Map<string, ItemImage>;
  byEnglish: Map<string, ItemImage>;
  byEmoji: Map<string, ItemImage>;
  byGuardEmoji: Map<string, ItemImage>;
};

/* L'index d'un catalogue, construit une fois (la clé est le tableau lui-même : un
   catalogue qu'on modifie après coup n'est pas relu, personne ne le fait). */
const indexes = new WeakMap<readonly ItemImage[], Index>();

function indexOf(catalogue: readonly ItemImage[]): Index {
  let index = indexes.get(catalogue);
  if (!index) {
    index = { byWord: new Map(), byEnglish: new Map(), byEmoji: new Map(), byGuardEmoji: new Map() };
    for (const image of catalogue) {
      // Le premier venu garde le mot : le test du catalogue refuse un mot donné à deux images.
      for (const word of image.words) {
        const key = normalizeWord(word);
        if (key && !index.byWord.has(key)) index.byWord.set(key, image);
      }
      for (const word of image.english ?? []) {
        const key = normalizeWord(word);
        if (key && !index.byEnglish.has(key)) index.byEnglish.set(key, image);
      }
      for (const glyph of image.emoji) {
        const key = bareGlyph(glyph);
        if (key && !index.byEmoji.has(key)) index.byEmoji.set(key, image);
        if (key && !index.byGuardEmoji.has(key)) index.byGuardEmoji.set(key, image);
      }
      for (const glyph of image.guardEmoji ?? []) {
        const key = bareGlyph(glyph);
        if (key && !index.byGuardEmoji.has(key)) index.byGuardEmoji.set(key, image);
      }
    }
    indexes.set(catalogue, index);
  }
  return index;
}

/** Une image trouvée par un mot, et la langue de ce mot : le français, ou l'anglais (qui demande un témoin). */
export type WordMatch = { image: ItemImage; english: boolean };

/**
 * L'image dont le mot est celui-ci, ou `null` : le singulier FRANÇAIS d'abord, puis
 * l'anglais, que `english` signale. La comparaison se fait après `normalizeWord`, sur
 * le mot ENTIER : « chat » trouve le chat, « chats » et « le chat » ne trouvent rien
 * (l'article, c'est `pictureForTile` qui le retire). Un mot français et un mot
 * anglais qui s'écrivent pareil sans leurs accents (« éléphant », « elephant ») sont
 * le même mot français.
 */
export function lookupItemImageWord(
  word: string,
  catalogue: readonly ItemImage[] = ITEM_IMAGES,
): WordMatch | null {
  if (typeof word !== "string") return null;
  const key = normalizeWord(word);
  if (!key) return null;
  const index = indexOf(catalogue);
  const french = index.byWord.get(key);
  if (french) return { image: french, english: false };
  const english = index.byEnglish.get(key);
  return english ? { image: english, english: true } : null;
}

/**
 * L'image dont le mot est celui-ci (le singulier français, puis l'anglais), ou
 * `null`, sans dire dans quelle langue : `lookupItemImageWord` la donne.
 */
export function findItemImageByWord(
  word: string,
  catalogue: readonly ItemImage[] = ITEM_IMAGES,
): ItemImage | null {
  return lookupItemImageWord(word, catalogue)?.image ?? null;
}

/**
 * L'image que ce glyphe désigne, ou `null`. Le sélecteur U+FE0F ne compte pas : les
 * ciseaux, écrits avec ou sans lui, sont les mêmes ciseaux. Seulement les glyphes
 * PRUDENTS (`emoji`) : c'est la lecture du repli par l'émoji de tête.
 */
export function findItemImageByEmoji(
  glyph: string,
  catalogue: readonly ItemImage[] = ITEM_IMAGES,
): ItemImage | null {
  if (typeof glyph !== "string") return null;
  const key = bareGlyph(glyph);
  if (!key) return null;
  return indexOf(catalogue).byEmoji.get(key) ?? null;
}

/**
 * L'image que ce glyphe désigne pour les GARDE-FOUS, ou `null` : les glyphes prudents
 * (`emoji`) et les glyphes larges (`guardEmoji`) : le carré noir, le dé, la brique.
 */
export function findItemImageByGuardEmoji(
  glyph: string,
  catalogue: readonly ItemImage[] = ITEM_IMAGES,
): ItemImage | null {
  if (typeof glyph !== "string") return null;
  const key = bareGlyph(glyph);
  if (!key) return null;
  return indexOf(catalogue).byGuardEmoji.get(key) ?? null;
}
