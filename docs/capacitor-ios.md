# Application iOS — export statique et Capacitor

L'application web tourne aussi comme application iOS native. Le principe est
simple : `next build` produit un site statique dans `out/`, et Capacitor
embarque ce dossier dans un projet Xcode. Aucun serveur Next ne tourne sur le
téléphone. Le seul réseau utilisé est la connexion Convex, exactement comme
dans le navigateur.

## Rebâtir et lancer

```bash
pnpm ios:sync
```

Cette commande enchaîne `next build` et `cap sync ios`. Elle régénère `out/`,
recopie le tout dans `ios/App/App/public`, puis met à jour les dépendances
Swift. Lancez-la après chaque changement de code web.

Ensuite, ouvrez le projet dans Xcode :

```bash
pnpm ios:open
```

Depuis Claude Code, le simulateur se pilote sans Xcode : demandez le build et
le lancement, l'outil intégré s'occupe de `xcodebuild` et de l'installation.

## Le piège : Capacitor sert la racine pour tout chemin sans extension

C'est la contrainte la plus coûteuse de cette plateforme, et elle n'est écrite
nulle part dans la documentation de Capacitor. Son routeur natif dit ceci
(`node_modules/@capacitor/ios/Capacitor/Capacitor/Router.swift`) :

```swift
if pathUrl.pathExtension.isEmpty {
    return basePath + "/index.html"
}
```

Autrement dit, toute navigation de **document** vers `/login`, `/student/home`
ou n'importe quelle route charge la racine `index.html`, jamais le fichier de
cette route. L'application se comporte comme une application à page unique,
même si `next build` produit un fichier HTML par route.

Trois conséquences pratiques :

**N'utilisez jamais `window.location.href` pour une navigation interne.** Elle
recharge la racine et perd la destination. Utilisez `router.replace()` ou
`router.push()` de `next/navigation`, qui ne traversent pas ce routeur. Une
authentification réussie renvoyait ainsi l'élève sur la page d'accueil
marchande, et l'écran donnait l'impression d'un échec de connexion.

**Une page de redirection placée à la racine boucle à l'infini.** Rediriger
vers `/login/` depuis `index.html` recharge `index.html`, qui redirige encore.
Le symptôme est un écran blanc et plusieurs milliers de requêtes.

**L'ouverture se fait donc côté client.** `components/native-app-gate.tsx`
enveloppe la page d'accueil, détecte la plateforme native et appelle
`router.replace("/post-auth")`. Avec une session encore valide, l'enfant
retrouve son camp ; sans session, `post-auth` renvoie sur `/login`. Sur le web
le composant ne fait rien.

La seule navigation de document qui subsiste est la déconnexion
(`components/ui/user-menu.tsx`), et elle est volontaire : le rechargement
complet jette l'état en mémoire, et l'atterrissage sur la racine passe par la
garde ci-dessus, qui renvoie sur la connexion. Les deux plateformes finissent
au même endroit.

## La barre d'état et l'îlot dynamique

Le webview Capacitor dessine sous la barre d'état iOS et sous l'îlot
dynamique. Sans `viewport-fit=cover` dans la balise `viewport`, les valeurs
`env(safe-area-inset-top)` et `env(safe-area-inset-bottom)` valent zéro, et
rien ne peut s'écarter de ces zones : le HUD de l'espace élève passait sous
l'horloge, et la pastille de niveau sous l'îlot.

`app/layout.tsx` exporte donc un `viewport` avec `viewportFit: "cover"`. Les
mises en page qui touchent le haut ou le bas de l'écran ajoutent
`pt-[env(safe-area-inset-top)]` ou `pb-[env(safe-area-inset-bottom)]`. Sur le
web ces valeurs valent zéro et les classes sont sans effet.

Deux écrans n'ont pas d'en-tête et portent donc cet écart eux-mêmes : la
connexion en cours (`app/post-auth/page.tsx`) et la séance d'exercices, seule
route du mode focus, par le `main` de `app/(student)/layout.tsx`. Chargement,
démarrage, affichage d'un exercice et fin du palier passent tous par ce
`main` ; un nouvel écran plein sans en-tête doit faire de même. Le mode focus
pose aussi une barre crème fixe sous la barre d'état, pour que la zone de
l'encoche ne soit pas un bout de décor qui flotte au-dessus de la séance.

L'écran de fin de palier fait exception : son ciel monte jusqu'au bord de
l'écran, encoche comprise, et une barre crème l'aurait coupé d'un trait. Il
rend la barre du mode focus transparente le temps qu'il est affiché (les
variables `--focus-top-bg` et `--focus-top-blur` sur la racine du document,
posées par `useBareStatusBar` dans `components/student/game/palier-result.tsx`)
et pose la sienne, givrée, qui n'apparaît qu'au défilement, comme un en-tête
iOS qui se replie. Au repos, rien ne sépare la barre d'état du héros ; en
défilant, le contenu passe sous un verre crème.

## Ce que l'export statique impose

`output: "export"` interdit les routes dynamiques `[id]`. Next exige de
connaître chaque valeur au moment du build, or nos identifiants viennent de
Convex à l'exécution. Les routes concernées ont donc été converties en
paramètres de requête.

| Avant | Après |
| --- | --- |
| `/student/subjects/[id]` | `/student/subjects?id=` |
| `/student/topics/[id]/session` | `/student/topics/session?id=` |
| `/parent/children/[id]/progress` | `/parent/children/progress?id=` |
| `/parent/children/[id]/reports/[topicId]` | `/parent/children/reports?id=&topicId=` |
| `/teacher/students/[id]` | `/teacher/students/detail?id=` |
| `/teacher/reports/[studentId]/[topicId]` | `/teacher/reports/detail?studentId=&topicId=` |
| `/teacher/exercises/[id]/edit` | `/teacher/exercises/edit?id=` |
| `/teacher/pdf-uploads/[id]` | `/teacher/pdf-uploads/detail?id=` |
| `/admin/ecoles/[id]` | `/admin/ecoles/detail?id=` |
| `/admin/ecoles/[id]/import` | `/admin/ecoles/import?id=` |
| `/admin/eleves/[id]` | `/admin/eleves/detail?id=` |
| `/admin/subjects/[id]` | `/admin/subjects/detail?id=` |
| `/admin/subjects/[id]/topics/[topicId]/edit` | `/admin/subjects/topics/edit?id=&topicId=` |
| `/admin/exercises/[id]/edit` | `/admin/exercises/edit?id=` |
| `/admin/pdf-uploads/[id]` | `/admin/pdf-uploads/detail?id=` |

Le suffixe `detail` sert quand le chemin parent est déjà pris par une page de
liste. `/admin/subjects` liste les matières, `/admin/subjects/detail?id=` en
ouvre une.

Les pages lisent leur identifiant avec `useSearchParams()`. Ce hook force le
rendu côté client, donc chaque page concernée est enveloppée d'un `<Suspense>`.
Ne retirez pas cette enveloppe : le build échoue sans elle.

**Si vous ajoutez une page, n'utilisez pas de segment `[id]`.** Le build se
coupera avec une erreur de `generateStaticParams` manquant. Passez
l'identifiant en paramètre de requête.

## Autres contraintes du mode export

`trailingSlash: true` est obligatoire. Le webview sert des fichiers : sans
cette option, `/student/home` chercherait `student/home.html` au lieu de
`student/home/index.html`.

`images.unoptimized: true` l'est aussi. Il n'y a pas de serveur pour
redimensionner les images à la demande.

Les variables `NEXT_PUBLIC_*` sont figées dans le bundle au moment du build.
Changer l'URL Convex exige donc un nouveau `pnpm ios:sync`, pas seulement un
redémarrage.

## Icône et écran de lancement

L'icône iOS et l'écran de lancement sont générés, pas dessinés à la main :

```bash
pnpm ios:brand
```

`scripts/ios-brand-assets.swift` compose le logo (`public/jotna-logo.png`) et
la pose « hello » de Pio sur un dégradé ciel-sable, en Core Graphics, sans
autre dépendance qu'Xcode. L'icône sort en 1024 × 1024 sans canal alpha, ce
que l'App Store exige. Relancez la commande quand le logo ou Pio change, puis
reconstruisez l'application.

Pour regarder l'export statique dans un navigateur sans l'application :

```bash
pnpm preview:export
```

## Ce qui n'est pas couvert

Il n'y a pas de plugin natif installé : ni notifications, ni caméra, ni
stockage hors ligne. L'application est le site web dans une coque native.

Android n'est pas configuré. La commande `npx cap add android` l'ajouterait,
mais rien n'a été testé de ce côté.

La publication sur l'App Store demande un compte développeur Apple, un
identifiant d'application enregistré, des icônes et un écran de lancement. Rien
de tout cela n'est fait.

## Fichiers générés

`ios/App/App/public` et `ios/App/App/capacitor.config.json` sont recréés par
`cap sync`. Ils sont ignorés par Git. Ne les modifiez pas à la main : le
prochain `pnpm ios:sync` écrasera vos changements.
