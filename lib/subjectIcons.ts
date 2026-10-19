/**
 * L'EMOJI D'UNE MATIÈRE, depuis la clé `subject.icon` du catalogue.
 *
 * Le catalogue range des noms d'icônes (« Calculator », « Book »…) ; sur les
 * écrans de l'enfant, on préfère un pictogramme coloré à un trait de
 * bibliothèque. Une clé inconnue retombe sur les deux premières lettres,
 * comme le faisait déjà l'accueil : jamais une case vide.
 */
const EMOJI: Record<string, string> = {
  Calculator: "🧮",
  Book: "📖",
  BookOpen: "📖",
  Flask: "🔬",
  Globe: "🌍",
  Music: "🎵",
  Palette: "🎨",
  Code: "💻",
  Hash: "#",
  Languages: "🗣️",
  Pencil: "✏️",
  History: "🏺",
  Leaf: "🌿",
  Star: "⭐",
  Users: "🤝",
};

export function subjectEmoji(icon: string | undefined | null): string {
  if (!icon) return "📚";
  return EMOJI[icon] ?? icon.slice(0, 2).toUpperCase();
}
