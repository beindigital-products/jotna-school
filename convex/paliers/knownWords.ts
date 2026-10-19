/**
 * LE VOCABULAIRE FERMÉ DU CI ET DU CP : les mots qu'une phrase à trous de
 * lettre ou de syllabe peut faire écrire à un enfant de cinq à sept ans.
 *
 * UN TROU QUI FORME UN MOT INCONNU EST UN TROU FAUX (« ___ngue » avec « m »
 * écrit « mngue »). Sans dictionnaire, le contrôleur (`exerciseAudit.ts`,
 * `fill_blank_word_unknown`) ne sait pas lire un mot : il le cherche ici. La
 * liste tient les mots de la banque écrite à la main de la vitrine
 * (`components/landing/demo/bank`) et des mots courants de l'école, de la
 * maison, de la cuisine, des animaux et des lieux du Sénégal. Écrits sans
 * accents ni majuscules, comme `fold` les rend.
 *
 * ELLE EST FERMÉE ET ELLE PEUT MANQUER UN BON MOT : l'exercice écarté se
 * refait, et le mot manquant s'ajoute ici. Ajoute-le sans accent, en
 * minuscules, dans l'ordre alphabétique.
 */
const WORDS = `
a abeille abime abiment aboli abolition abondantes abord abri accent accepte accident accompagne
accompagner accord accorde accorder accords accueillir achat achete achetees achetent acheter
acteurs action activite activites addition additionne additions adjectif administratif adulte
adultes adverbe adversaire aere aerer aeroport affaires affiche africain africaine africaines
afrique afternoon age agee agence agences ages agriculture ahmadou ai aide aider aient aigu aigues
aiguilles aigus ailleurs aime aiment aimerais ainsi air aire aires airs ais aissatou ait ajoute
ajouter alboury aliment alimentaire alimentation aliments aline allait alle allees aller allume
allumee allumer alors alphabetique alterner always am amerique ami amie amies aminata amis ampoule
an ananas ancien ancienne anciennes anciens ane anglais anglaise angles animal animaux annee
anniversaire annoncent anophele ans answer aof aout apparaissent apparait appareils appartient
appeles appelle appelles applaudir apple apportaient apporte apportent apprend appuie apres arachide
arachides arachidier arbre arbres arc archet arcs ardoise are argent argile armee armes armoire
arranger arrestation arrete arretee arretent arriere arrivais arrive arrivee arrivent arriver
arrives arrondie arrondissement arrose arroser arrosoir art arteres article as asc assemble
assembler assembles asseoir assez assiette assis association associe at ation atlantique atteindre
attend attendre attendu attention attrape attraper attribut au aube aucun august aujourd aussi
autant auto automobile autorite autorites autoroute autour autre autrefois autrement autres aux
auxiliaire avaient avait avale avance avancee avant avec avez avion avis avoir avons avril awa axe
axes ba baby bag baigne baissees balafon balai balaie balayer ballon ballons bamba banana banane
bananes bancs bande bandes bank banlieue banque baobab baol barbe barre bas base basse bassin bateau
bathroom batiment battements battent battre bavardant bavarde bceao be beau beaucoup bebe bebes bed
bedroom beignets belle benefice berceuse besoin beurre bi bien bientot bignona billes billet
birthday bissap bissau blaise blanc blanche blancs blank blesse blesses blessure bleu bleue bleus
blue bo bobo boire bois boisson boit boite bol bols bon bonbon bonbons bonjour bonne bonnes bons
book books bord borne boubou bouche boucher bouchere boudent bouge bought bougie boulanger
boulangere bour bourba boussole bout bouteille boutique bouton bouts brak brancher branchies bras
brasse bread breakfast brique bronches brother brousse bruit bruler bu bulletin bulletins bureaux
bus but buy bzzz ca cache cacher cadeau cadenas caf cafe cahier cahiers caille caillou caisse calcul
calcule calebasse calendrier calme calmer calque camarade camion campagne campagnes can canard
canards candidats cans capitale car cardinal cardinaux carnet carotte carottes carre carreau carree
carrees carres cartable carte cas casamance case cases casque casse cause cayor ce cedeao cela
celebre celle celles celui centaines centieme centiemes centre cercle certain certaines certains
cerveau ces cet cette ceux cfee ch chacun chacune chagrin chaine chaise chaleur chaleureusement
champ champs change changer chanson chante chantent chanter chantons chants chapeau chaque charbon
charge chargee charrette chassaient chasseurs chat chats chaud chaude chaudes chauffe chauffer
chauffes chaussure chaussures chef cheikh chemin chemise cher cherche cherchent chercher cheval
chevaux cheveux chevre chevres chez chien chiens chiffre chiffres chimiques choisi choisir choisis
choisissant choisit choix chose choses chuchoter chute ciel cilss cinema cinq cio circonstanciel
circonstanciels circuit circulation circule ciseaux citee citron citrons civisme clair claire
clairon classe classes cle climat climats clock clou cloudy cm co coco cod coeur coi coin coins cold
colere collage colle collective coller colline colonial coloniale colonies colonisateurs
colonisation colonne colonnes colorees coloriage colorie combat combattu combien comedien comediens
comite comme commence commencent commences comment commercant commerce commissariat communaute
commune communication communiquer comparaison compare comparer compas complement complements complet
complete completement completer compose comprendre compris comprise compromis comptant compte
compter comptines concerne condensation conditionnel conducteur conduit confiance conflit conflits
congelateur conjugue connais connait connaitre conquete conseil conseiller conseillers consequence
consequences consigne consignes consonne consonnes constitution construction construisent construit
consultations contacts contenances content contente contiennent contient continent continue contour
contraire contraires contre conversions conviennent convient cooperative coq corde cordes corps
correspondre costume cote cotes cotise coton couche coucher coule couler couleur couleurs coup coupe
couper coups cour courant courbe courir cours court courte courts cousin cousine coute couteau
coutent couvercle couvert couvrir cow craie craies crane cranienne crayon crayons creation creee
creuse criant crie crier crocodile croissant croit cu cube cueillaient cueille cueilleurs cuillere
cuire cuisine cuisiner cuit cultivaient cultive cultiver culture cylindre da dakar dame damel damier
danger dans danse danser date dates davantage de debordent debout debrancher debut debuts decaler
decembre dechets decide decimal decimaux declenche decor decore decoree decorer decoupage decoupe
decoupee decouper decouverte decouvertes decouvrir decrire decrit decrivent dedans defendre
definitivement deforestation deja dejeuner dekheule delicieux demain demande demander demi demonter
denominateur dense densite dent dents depart departement departemental deplacements deplacer deplie
depouille depuis depute deputes dernier derniere deroulement derriere des descend descendent
description desert designe desseche dessin dessine dessinee dessiner dessines dessins dessous dessus
detruit deux deuxieme devant developpe developpent devienne deviennent devient devise devoir devoirs
di diagne diakhou dialogue diatta diaye dictionnaire differences differentes differents digestion
dimanche dine diner diop dior diourbel dire directement directeur direction directrice dirige
dirigent diriger dis disent disparaitre dispensaire dispute dissout distance distribue dit diviser
divisibilite divisible division dix dixieme dixiemes dizaine dizaines djembe djolof dl do dodo dog
doigt doigts dois doit doivent domestique domestiques domine donc donnant donne donnent donner dont
door dorment dormir dors dos double douce doucement doux douze drag drapeau dress driver droit
droite droites droits drop du dur dure duree durees ear eau eaux ecartement echelle eclair eclaire
eclairer eclate ecole economiques ecoute ecouter ecrier ecrire ecris ecrit ecrite ecrits ecriture
ecrivant ecrivent ed education efface egales egaux egg egouts eight electeurs election electricite
electrique electriques element elephant elevage eleve eleven eleves elimination elle elles eloigne
elu elus embrasse emettre emmene emotion emotions empan empereur empire empires emploi emploie
emportent en encore endormir endroit energetiques energie enfant enfants enfoncer enleve enlever
enseigne ensemble ensembles ensuite ent entend entends entier entiere entoure entouree entraide
entraider entrainent entre entrer environnement envoie envoyer epaules epuise equipe equiper equipes
equivalent er ere es escalier esclavage espace essaie est estomac et etage etaient etait etape
etapes etat ete eteignent eteindre eteins etendue etes etiquette etoile etoiles etre etres etudies
eu eur europe europeens eux evaporation evenements evening eviter exacte exactement exception excuse
exemple exercice exil exile existe existent exode expliquent eye fa fabrique fabriquee fabriquer
face faces facile facon facons faire fais fait faits false famille familles fao farmer father fatick
fatou faut faute faux fe federation feminin femme femmes fenetre fenetres fer ferait ferez ferlo
ferme fermee fermer fertiles fete feu feuille feuilles feux fevrier fi fievre fifa fifteen figures
file filet filets fill fille filles fils fin fines fini finie finir finirais finiras finis finissent
finisses finissons finit fisherman five fixe fixer flamme fleche fleur fleurs fleuve flute flutiste
fo foi fois fonction fond fondamentale fondateur fonde fonio font fontaine football force foret
forme forment formes formule fort forte foulard fourchette fourmi fouta fraction fractions fraiche
frais francais francaises frappant frappe frappent frappes fredonne freins frequence frere frigo
frise frises froid froide froides from froncer fronces frontiere frotte frottent frotter fruit
fruits fu fumee futur future ga gabon gabou gagne gagner gai gambie garcon garcons garde garder
gaspiller gate gateau gauche gaz gendarmes generation genou genre gens gentil gentille gerer germe
geste gestes ghana ght gingembre girafe glace glacon glacons glisse go goat going golfe gomme good
goodbye got gouttes gouvernement gouverneur grace graine graines grammaticaux grand grande grandes
grandi grandir grandissent grandit grandmother grands grave graves green grille grimpe gris grise
gros grosse grossesse grossissent groupe groupement gu guerir guerit guerre guidon guiers guinee
guineen guirlandes guitare habiller habitants habitat habiter habitude harmattan has haut haute
hauteur have hcr he hello herbe heure heures hier hippopotame histoire hivernage homme hommes
homonymes homophones honnete honnetete horse hospitalite how hui huile huilerie huit humain hygiene
hymne ibrahima ici iez il ile illustration illustrer ils image images imagine immobile imparfait
imperatif impregnee impregnees in incendies inconnu independance indicatif indice indien
individuelle infinitif infirmier informer ing initiale installe installent institutions instrument
instruments interieur internationales internet interrogation interroger interrupteur intestins
intrus invention inventions inverse invitation invite inviter invites ions irregulier irreguliers is
it ivre jachere jamais jambe jambes janvier jaune je jeter jetes jette jeu jeudi jeune jeunes jeux
joal joie joli jolie jouant joue jouee jouent jouer jouerons joues joueur jour journee jours
jugement juges juillet juin jupe jus jusqu juste kaolack kayar kedougou keita keur kg kilo
kilogramme kilometre kilometres kitchen km kolda kora koumbi la lac laisse laissent laisser lait
lames lampe lances langue langues lapin lapins laquelle large largeurs larmes lat lavage lave lavent
laver laves le lecons lecture left legende leger legers legumes lent lente lents leopold lequel les
lettre lettres leur leurs leve lever li liaison lieu lieux ligne lignes like lilas linge lion lions
liquefaction liquide lire lis liste listen lit livre livres lo local loger loi loin lois lola long
longs longtemps longue longueur longueurs look loto louga louis loupe lourd lourde lourds lu lui lumiere
lundi lune lunettes lutter ma maba mafe magique mai maigre mailles main mains maintenant maire
mairie mais maison maisons maitre maitresse majuscule mal malade maladie maladies mali mama maman
mame mami mange mangeant mangee mangees manger manges mango mangoes mangue mangues manguier maniere
manque manquent mansa many mar marchands marchant marche marcher marches mardi mares mariama marines
market marmite marron mars marteau masculin massar masses mat matam match materiel matin matinee
mauritanie mbour me mecque mediateur mediation medicament meilleur melangeant melanger melodie
melodies membre meme memes memoire menace mene menent mental mentalement mer merci mercredi mere mes
message messages mesure mesurent mesurer mesures met metier metiers metre mets mettre mi midi mieux
mil milieu milk mille milliard milliards milliers millions mimer mimes mimi min mini ministres minute
miroir mise mission mo mobile modele modeler modou moi moins mois moisi moitie moities molle moment
moments mon monday monde monkey monnaie monsieur montagne monte montent montre montrent montrer
moque moqueries morceau more morning mort mosquee mot mother motif motifs moto motos mots mouches
mouillees mouiller moussa mousse moustiquaire moustiquaires moustique moustiques mouth mouton
moutons mouvement moyens mu much mule multiplication multiplier municipal mur muraille mure mures
murmurer murs muscles musicien my na nageoires nager naissance naisse nappe natal nation national
nationale nature naturel navetanes ndiadiane ndiaye ne nee negriere neige nettoie nettoyer neuf
neutre neuvieme never next nez ni nid nids night nine no noel noir noire nom nombre nombres nombreux
noms non nord nos nose not note notes notre nourrir nourrissent nourriture nous nouveau nouveaux
nouvelle nouvelles now nu nuage nuages nuisible nuisibles nuit nul numerateur objet objets observer
occupe ocean octobre oeil oesophage oeuf oeufs offre oignon oignons oiseau oiseaux old olive
olympiques oms omvg omvs on oncle ons ont onu onze open operation operations opinion oppose or orage
orages orange oranges order ordre ordres ordures oreille oreilles organes organisation organisations
organise organiser os ou oublie oublier ouest oui ouies ours ousmane outil outils ouvert ouverte
ouvrant ouvre ouvres ouvrir ovipare pa pacifique pagne paie pain paix paludisme panier pantalon papa
papaye papier papiers paquets par paraitre parasites parcourt pardon pareil pareille pareilles
pareils parents parfois parlant parle parlent parler parles parmi parole paroles pars part partage
partagent partager partant partent participe partie parties partir parts pas passage passe passent
passer paturages pauvre pave paye payes pays paysan pe peau peche pecheur pecheurs pecheuse pedales
peindre peine peintre pelerinage penda pendant pensant pense penser percussions perd perdre perdu
pere permet permis personnage personnages personne personnel personnes petales petit petite petites
petits petrole peu peule peuls peuple peuplee peut peuvent peux phenomene phenomenes photo photos
phrase phrases physiques pi piece pied pieds pierre pietons pikine pile pincant pince pinceau
pincent pineapple piquant pique piqure pirogue pirogues place placee placer plage plaines plaisir
plait plan plante planter plantes plastiques plat please plein pleine pleines pleure pleut pli
pliage pliages plie plier pluie pluies plumes pluriel plus plusieurs po poche pochoir poeme poesie
poete poignet poings point pointe pointes points pointue poire poires poisson poissons policiers
polio pomme pommes pompiers pond pont population port portable portail porte portent porter portes
portugais pose posee poser possede possessif possible postnatales potable poteau poterie potier pots
poubelle pouce poule poules poulet pouls poumons poupee pour pourquoi pourra pousse poussent pousser
poussiere pouvoir pratique precedente prefere prefet prefixe prefixes prehistoire premier premiere
premieres premiers prenais prenait prenatales prend prends prennent prenom prepare preparer pres
present presenter president presidentielle presque presse prevenir priere primaires principale pris
prix probleme problemes proche proclame produit produits profite profondes profondeur progres pronom
pronoms prononcent propose propre propres proprete proprietaire protection protege protegees
protegent proteger prudent pu public puis puisse puits puni pur pyramide qcm qu quadrillage quand
quantite quartier quartiers quatorze quatre quatrieme que quel quelle quelles quelqu quelque
quelques quels question questions queue qui quinze quittent quoi ra racine racines raconte racontent
raconter radio rafraichir rai rainy raison ralentissent ramasser ramene ramenent rang range rangee
rangees rangent ranger rapide rappelle rappellent rapport rapportent rapproche rapprochees ras
rassemblent rat rats re realite reboisement reboiser recensement recent recente recevoir rechauffer
recipient recit recite recoit recolte recolter recommence reconcilie reconcilient reconnaitre
recopier recreation recreations rectangle rectangulaires recus red redessine redevient reelle
refaire reflechis reflet refroidir refroidit refugies refuse regarde regardent regardes region
regions registre regle reglement regler regulier reine releve relie relief relire relis relit
remerciement remercier remets remonte remonter remplace remplacent remplacer remplissent remue
rencontre rend rendent rendez rendre rendue renouvelle rentre rentrent repandu repare repas repasser
repere reperer reperes repete repeter replanter replie repondre reponse repose reposer representant
representants represente representent reproduire republique resistait resistant resistants resiste
resister resoudre respect respecte respecter respiration respire respirer responsabilite
responsabilites responsable ressemblent ressources restaurer reste restent rester resultat resultats
retenue retenues retiennent retiens retient retour retourner retrouve retrouver reunit reveiller
revend reviennent revient reviser revisions revoir rez ri rice richard riche richesse richesses rien
rime rincer riti riviere riz ro robe robes robinet roi rois role roles rond ronde rondes ronds rons
ront rosace rosaces rose roue rouge rougeole rouges roule rouler route royaume royaumes ru rue
rufisque run running rural rythme rythmes sa sabar sable sac sachet sachets sad sahara sahelien
saint sais saison saisons sait salade sale salee saleh salit salon saloum salue samedi sandale
sandales sang sanguins sans sante sapeurs saute sauter sautillants sauvage sauvages savaient savoir
savon savonner saynete scene sciences scolaire scolaires scorpion se seau seaux sec seche secher
secheresse seches seconde secourent secours secret securite sedar sedhiou seize sel selle selon
semaine semaines semblable seme semee semer senegal senegalais senghor sens sent sentiment
sentiments separe sept september septembre sera serait serere sereres serpent serre serrer sert
servent servir ses seul seule seulement seventeen sh she sheep short si siecle sigle sigles signe
signes simple simples sine singe singes singulier sinon sirene sirop sister sisters sitoe situation
situe situer six sixteen so soeur soient soif soigne soigner soin soir sois soit sol soleil solide
solides solution sombre sometimes somme sommes sommet son songhai sonne sonner sons sont sors sort
sorte sortie soudanien soufflant souffle soundiata source sourcils sourire souris sourit sous
soustractions souvenirs souvent souviens special spectacle spectateur spectateurs sport sports stade
steppe straight student stylo su subjonctif substances sucre sucree sud suffixe suffixes suffrage
suis suit suite suivant suivent suivi suivre sujet sunny superposent sur surface surnom surpeche
surtout swim swimming swims syllabe syllabes symboles symetrie symetries symetrique symetriser
synonymes ta tabaski table tableau tableaux tables taches taillee tall taller tam tama tambacounda
tambour tambours tante tape tapis tas tasse tata taxi te tea teacher technique techniques teen
teigne tel tele telephone television temps ten tenir ter teraanga teranga terminaison terminaisons
termine terminent terrain terre terres terrestre territoire tes tete texte than thank that the
theatre thiebou thieboudienne thies ti tiens tient tion titre titres to today toi toit toll tomate
tomates tomato tomatoes tomatos tombe tombent tomorrow ton tontine torche tortue tot toto touba
touch touche toucher toujours tour tourisme tourne tournent tourner tournes tournois tous tout toute
toutes trace tracer traces trader tradition train trainer trait traite traits trajet tranches
transforme transmet transmettent transmis travail travaille travailler travers traverse traverser
treize tres triangle triangles triste tristesse trois troisieme tronc trop trou troue troupeaux
trous trouvait trouve trouver true tu tube tuesday tuile turn tuyau tuyaux tv twelve twenty two type
un une unesco unhcr uni unicef unie union unite unites universel uns usage usines usually utile
utiles utilise utiliser va vacances vaccin vacciner vaccins vache vaches vagues vais vaisseaux
vaisselle valeur valeurs vallee vapeur vas ve vecu vegetation veines velo velos venaient vend
vendent vendre vendredi vendue venir vent vente ventre verbe verbes verdure verifie verifier verre
vers vert verte verticales verts vetements veto veulent veut veux vi viande vide vie vieillard viendra
viennent viens vient vih village ville villes vingt violence violet virgule visage visible visit
visite visited visites visiting visits vit vitamines vite vitesse vivaient vivants vivent vivipare
vivipares vivre vo voici voies voila voile voir vois voisin voisine voisins voit voiture voitures
voix vole voler voleurs volume volumes vont vote votent voter votre vous voyage voyager voyelle vrai
vu vue walo was watch watches watchs water wednesday when where who why windy wolof wolofs would
write xalam xive xixe xve yassa years yellow yes yesterday yeux you your zebre ziguinchor zigzag
`;

export const KNOWN_WORDS: ReadonlySet<string> = new Set(WORDS.split(/\s+/).filter(Boolean));
