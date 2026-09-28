import { useId } from "react";
import {
  Award,
  BookOpen,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Dumbbell,
  EyeOff,
  Feather,
  Flame,
  Footprints,
  GraduationCap,
  Heart,
  Infinity as InfinityIcon,
  Lightbulb,
  Lock,
  Medal,
  Moon,
  Mountain,
  Music,
  Palette,
  Pencil,
  Puzzle,
  Rabbit,
  RefreshCw,
  Rocket,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  Trophy,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { RarityTier } from "@/lib/badges";

/**
 * Maps the `badges.icon` string (a Lucide icon name) to the actual component.
 * Static map keeps lucide tree-shakable. Add new entries here when seeding
 * new badge icons; unknown names fall back to Trophy (a friendly default).
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  BookOpen,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Dumbbell,
  EyeOff,
  Feather,
  Flame,
  Footprints,
  GraduationCap,
  Heart,
  Infinity: InfinityIcon,
  Lightbulb,
  Medal,
  Moon,
  Mountain,
  Music,
  Palette,
  Pencil,
  Puzzle,
  Rabbit,
  RefreshCw,
  Rocket,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  Trophy,
  Wand2,
  Zap,
};

export function BadgeIcon({
  name,
  className,
  fallback = Trophy,
}: {
  name: string;
  className?: string;
  fallback?: LucideIcon;
}) {
  const Icon = ICON_MAP[name] ?? fallback;
  return <Icon className={className} aria-hidden />;
}

// ---------------------------------------------------------------------------
// BadgeShield — écusson de trophée procédural, rendu en SVG « premium ».
//
// L'ancienne version posait un aplat pastel et une icône filaire dans une
// pastille : lisible, mais plat, un air de démonstrateur. Ici, chaque trophée
// est une médaille. Le CADRE dit la rareté par son métal — bronze, acier
// saphir, améthyste, or — et se soulève par un biseau ; le MÉDAILLON est bombé
// et verni, l'icône y est détourée en blanc ; les hauts rangs gagnent un halo,
// des rayons et des éclats. La FORME (écu, rond, hexagone, bannière) et la
// TEINTE du médaillon restent tirées du nom : des dizaines de trophées se
// distinguent d'un coup d'œil, sans image à peindre.
//
// AUCUN filtre SVG ni CSS `drop-shadow` : l'ombre portée est une copie sombre
// décalée. Sous WKWebView, un `filter` posé sous une transform animée — les
// cartes de l'étagère grandissent au survol — fige son tampon et le promène,
// le même piège que Pio (voir `docs/capacitor-ios.md`). Tout est donc peint à
// plat, gradients compris.
//
// Les identifiants de gradients sont UNIQUES par instance (`useId`) : deux
// médailles sur une même étagère ne partagent pas un `id`, sinon la seconde
// écraserait la première (les `id` d'un `<defs>` sont globaux au document).
//
// API inchangée : iconName, badgeName, tier, locked, size.
// ---------------------------------------------------------------------------

type ShieldShape = "shield" | "round" | "hexagon" | "banner";

const SHAPES: ShieldShape[] = ["shield", "round", "hexagon", "banner"];

// Palette du MÉDAILLON, tirée du nom : inner (saturé) au centre du dégradé
// radial, accent (plus foncé) au bord. L'icône blanche s'y détache.
const PALETTES: Array<{
  outer: string;
  mid: string;
  inner: string;
  accent: string;
}> = [
  // blue
  { outer: "#bfdbfe", mid: "#93c5fd", inner: "#60a5fa", accent: "#3b82f6" },
  // green
  { outer: "#bbf7d0", mid: "#86efac", inner: "#4ade80", accent: "#22c55e" },
  // purple
  { outer: "#e9d5ff", mid: "#d8b4fe", inner: "#c084fc", accent: "#a855f7" },
  // orange
  { outer: "#fed7aa", mid: "#fdba74", inner: "#fb923c", accent: "#f97316" },
  // pink
  { outer: "#fbcfe8", mid: "#f9a8d4", inner: "#f472b6", accent: "#ec4899" },
  // teal
  { outer: "#99f6e4", mid: "#5eead4", inner: "#2dd4bf", accent: "#14b8a6" },
  // amber
  { outer: "#fde68a", mid: "#fcd34d", inner: "#fbbf24", accent: "#f59e0b" },
  // indigo
  { outer: "#c7d2fe", mid: "#a5b4fc", inner: "#818cf8", accent: "#6366f1" },
];

/**
 * Le MÉTAL du cadre, par rareté. rimA/rimB : le dégradé du pourtour, clair en
 * haut-gauche, sombre en bas-droite, ce qui simule une lumière rasante.
 * faceA/faceB : la face biseautée, un cran plus foncée. stud : rivets et
 * gemmes du pourtour. glow : le halo arrière (épique, légendaire). ray : les
 * rayons (légendaire seul).
 */
type Metal = {
  rimA: string;
  rimB: string;
  faceA: string;
  faceB: string;
  stud: string;
  glow: string;
  ray: string;
};

const METAL: Record<RarityTier, Metal> = {
  // Bronze chaud, sobre : le trophée commun ne crie pas.
  common: {
    rimA: "#f4cd94",
    rimB: "#7d451a",
    faceA: "#d68a3c",
    faceB: "#a5602c",
    stud: "#ffe6c2",
    glow: "transparent",
    ray: "transparent",
  },
  // Acier saphir : un halo bleu discret le décolle du fond.
  rare: {
    rimA: "#dcefff",
    rimB: "#1e5fa8",
    faceA: "#5aa8e8",
    faceB: "#2f74c0",
    stud: "#eaf6ff",
    glow: "rgba(56,160,232,0.45)",
    ray: "transparent",
  },
  // Améthyste : gemmes violettes, halo plus franc.
  epic: {
    rimA: "#efdcff",
    rimB: "#6b21a8",
    faceA: "#b06bf0",
    faceB: "#8b3fd0",
    stud: "#f6ecff",
    glow: "rgba(168,85,247,0.5)",
    ray: "transparent",
  },
  // Or : halo doré, rayons, éclats. Le sommet de la vitrine.
  legendary: {
    rimA: "#fff0b8",
    rimB: "#a9700f",
    faceA: "#ffd24d",
    faceB: "#edad1e",
    stud: "#fff6d6",
    glow: "rgba(251,191,36,0.55)",
    ray: "rgba(255,214,84,0.6)",
  },
};

// Trophée fermé : tout vire au métal froid, l'icône cède au cadenas.
const LOCKED_METAL: Metal = {
  rimA: "#e2e8f0",
  rimB: "#64748b",
  faceA: "#cbd5e1",
  faceB: "#94a3b8",
  stud: "#f1f5f9",
  glow: "transparent",
  ray: "transparent",
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickShape(name: string): ShieldShape {
  return SHAPES[hashString(name) % SHAPES.length];
}

function pickPalette(
  name: string,
  tier: RarityTier,
): (typeof PALETTES)[number] {
  // Légendaire toujours ambre ; épique toujours violet ; le reste par le nom.
  if (tier === "legendary") return PALETTES[6];
  if (tier === "epic") return PALETTES[2];
  return PALETTES[hashString(name) % PALETTES.length];
}

/**
 * Le tracé coloré de la forme, dans un espace 100 × 100 centré en (50, 50).
 * `scale` pose une copie rentrée, pour le biseau du cadre.
 */
function ShapePath({
  shape,
  fill,
  scale = 1,
}: {
  shape: ShieldShape;
  fill: string;
  scale?: number;
}) {
  const inner =
    shape === "round" ? (
      <circle cx="50" cy="50" r="42" fill={fill} />
    ) : (
      <path
        d={
          shape === "shield"
            ? "M 50 8 L 86 22 L 86 56 Q 86 78 50 92 Q 14 78 14 56 L 14 22 Z"
            : shape === "hexagon"
              ? "M 50 8 L 86 28 L 86 72 L 50 92 L 14 72 L 14 28 Z"
              : "M 18 14 Q 18 8 24 8 L 76 8 Q 82 8 82 14 L 82 70 L 50 86 L 18 70 Z"
        }
        fill={fill}
      />
    );

  if (scale === 1) return inner;
  return (
    <g transform={`translate(50 50) scale(${scale}) translate(-50 -50)`}>
      {inner}
    </g>
  );
}

/** Rayons dorés derrière la médaille légendaire. */
function Rays({ color }: { color: string }) {
  const spokes = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <g>
      {spokes.map((a) => (
        <path
          key={a}
          d="M 50 50 L 46.5 1 L 53.5 1 Z"
          fill={color}
          transform={`rotate(${a} 50 50)`}
        />
      ))}
    </g>
  );
}

/** Un éclat à quatre branches, la petite étincelle qui fait « waouh ». */
function Sparkle({
  x,
  y,
  r,
  color = "#ffffff",
  opacity = 0.95,
}: {
  x: number;
  y: number;
  r: number;
  color?: string;
  opacity?: number;
}) {
  const k = r * 0.16;
  return (
    <path
      d={`M ${x} ${y - r} Q ${x + k} ${y - k} ${x + r} ${y} Q ${x + k} ${y + k} ${x} ${y + r} Q ${x - k} ${y + k} ${x - r} ${y} Q ${x - k} ${y - k} ${x} ${y - r} Z`}
      fill={color}
      opacity={opacity}
    />
  );
}

/**
 * Rivets et gemmes du pourtour, plus riches à mesure que le rang monte :
 *   - commun     : deux rivets aux épaules
 *   - rare       : deux rivets + deux côtés
 *   - épique     : gemmes aux épaules + gemme de tête
 *   - légendaire : couronne de gemmes
 */
function RimStuds({ tier, metal }: { tier: RarityTier; metal: Metal }) {
  const stud = (cx: number, cy: number, rad: number) => (
    <g key={`s-${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={rad} fill={metal.rimB} opacity={0.6} />
      <circle cx={cx} cy={cy} r={rad * 0.72} fill={metal.stud} />
      <circle cx={cx - rad * 0.28} cy={cy - rad * 0.28} r={rad * 0.28} fill="#ffffff" opacity={0.9} />
    </g>
  );

  // Gemme : un losange facetté, un ton clair, une pointe de blanc.
  const gem = (cx: number, cy: number, rad: number) => (
    <g key={`g-${cx}-${cy}`}>
      <path
        d={`M ${cx} ${cy - rad} L ${cx + rad} ${cy} L ${cx} ${cy + rad} L ${cx - rad} ${cy} Z`}
        fill={metal.stud}
        stroke={metal.rimB}
        strokeWidth={0.7}
        strokeOpacity={0.5}
      />
      <path d={`M ${cx} ${cy - rad} L ${cx + rad} ${cy} L ${cx} ${cy} Z`} fill="#ffffff" opacity={0.55} />
    </g>
  );

  return (
    <g>
      {tier === "common" && (
        <>
          {stud(26, 20, 3)}
          {stud(74, 20, 3)}
        </>
      )}
      {tier === "rare" && (
        <>
          {stud(24, 20, 3.2)}
          {stud(76, 20, 3.2)}
          {stud(15, 50, 2.6)}
          {stud(85, 50, 2.6)}
        </>
      )}
      {tier === "epic" && (
        <>
          {gem(50, 9, 4)}
          {gem(22, 26, 3.4)}
          {gem(78, 26, 3.4)}
        </>
      )}
      {tier === "legendary" && (
        <>
          {gem(50, 7.5, 4.6)}
          {gem(21, 24, 3.6)}
          {gem(79, 24, 3.6)}
          {gem(15, 52, 3)}
          {gem(85, 52, 3)}
        </>
      )}
    </g>
  );
}

function IconAtSize({
  name,
  pixels,
  color,
}: {
  name: string;
  pixels: number;
  color: string;
}) {
  const Icon = ICON_MAP[name] ?? Trophy;
  return (
    <Icon
      style={{ width: pixels, height: pixels, color }}
      strokeWidth={2.4}
      aria-hidden
    />
  );
}

export function BadgeShield({
  iconName,
  badgeName,
  tier,
  locked,
  size = 96,
}: {
  iconName: string;
  badgeName: string;
  tier: RarityTier;
  locked: boolean;
  size?: number;
}) {
  // `useId` renvoie un jeton avec des « : » : on ne garde que l'alphanumérique
  // pour un `id` sûr dans une `url(#...)`.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const shape = pickShape(badgeName);
  const pal = pickPalette(badgeName, tier);
  const metal = locked ? LOCKED_METAL : METAL[tier];

  // Le médaillon : saturé au centre, plus foncé au bord, l'icône blanche
  // dessus. Fermé, il vire au gris et l'icône cède au cadenas sombre.
  const discC0 = locked ? "#cbd5e1" : pal.inner;
  const discC1 = locked ? "#94a3b8" : pal.accent;

  const showGlow = !locked && (tier === "epic" || tier === "legendary");
  const showRays = !locked && tier === "legendary";
  const showSparkle = !locked && (tier === "epic" || tier === "legendary");

  const frameId = `bf${uid}`;
  const faceId = `bc${uid}`;
  const discId = `bd${uid}`;
  const glossId = `bg${uid}`;
  const glowId = `bh${uid}`;
  const discClip = `bk${uid}`;

  const DISC_R = 21;
  const iconPx = Math.round(size * 0.26);

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={frameId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={metal.rimA} />
            <stop offset="100%" stopColor={metal.rimB} />
          </linearGradient>
          <linearGradient id={faceId} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={metal.faceA} />
            <stop offset="100%" stopColor={metal.faceB} />
          </linearGradient>
          <radialGradient id={discId} cx="0.5" cy="0.42" r="0.62">
            <stop offset="0%" stopColor={discC0} />
            <stop offset="100%" stopColor={discC1} />
          </radialGradient>
          <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {showGlow && (
            <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
              <stop offset="55%" stopColor={metal.glow} />
              <stop offset="100%" stopColor={metal.glow} stopOpacity="0" />
            </radialGradient>
          )}
          <clipPath id={discClip}>
            <circle cx="50" cy="50" r={DISC_R} />
          </clipPath>
        </defs>

        {/* Halo arrière (épique, légendaire) */}
        {showGlow && <circle cx="50" cy="50" r="49" fill={`url(#${glowId})`} />}

        {/* Rayons (légendaire) */}
        {showRays && <Rays color={metal.ray} />}

        {/* Ombre portée : une copie sombre décalée, sans filtre. */}
        <g transform="translate(0 3)">
          <ShapePath shape={shape} fill="rgba(60,35,10,0.28)" />
        </g>

        {/* Cadre métallique + biseau */}
        <ShapePath shape={shape} fill={`url(#${frameId})`} />
        <ShapePath shape={shape} fill={`url(#${faceId})`} scale={0.8} />

        {/* Rivets et gemmes du pourtour */}
        <RimStuds tier={tier} metal={metal} />

        {/* Médaillon : liseré blanc, disque verni, reflet, anneau intérieur */}
        <circle cx="50" cy="50" r={DISC_R + 2.4} fill="#ffffff" />
        <circle cx="50" cy="50" r={DISC_R} fill={`url(#${discId})`} />
        <g clipPath={`url(#${discClip})`}>
          <ellipse
            cx="50"
            cy={50 - DISC_R * 0.42}
            rx={DISC_R * 0.82}
            ry={DISC_R * 0.5}
            fill={`url(#${glossId})`}
          />
        </g>
        <circle cx="50" cy="50" r={DISC_R} fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />

        {/* Éclats (épique, légendaire) */}
        {showSparkle && (
          <>
            <Sparkle x={74} y={30} r={4.5} />
            <Sparkle x={30} y={70} r={3} opacity={0.85} />
            {tier === "legendary" && <Sparkle x={78} y={62} r={2.4} opacity={0.8} />}
          </>
        )}
      </svg>

      {/* L'icône (ou le cadenas), en surimpression, centrée sur le médaillon. */}
      <div className="absolute inset-0 flex items-center justify-center">
        {locked ? (
          <Lock
            style={{ width: iconPx, height: iconPx, color: "#475569" }}
            strokeWidth={2.5}
            aria-hidden
          />
        ) : (
          <IconAtSize name={iconName} pixels={iconPx} color="#ffffff" />
        )}
      </div>
    </div>
  );
}
