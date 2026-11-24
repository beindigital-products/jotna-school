"use client";

/**
 * LE JEU DE COMPOSANTS DES ESPACES ADULTES (parent, professeur, école).
 *
 * Les trois espaces partagent ces briques pour porter la même mise en page,
 * les mêmes états (chargement, vide, erreur) et les mêmes règles d'accès :
 *
 * - la couleur d'accent vient de la coque (`components/dashboard/shell.tsx`),
 *   par les variables `--dash`, `--dash-strong` et `--dash-soft` ;
 * - toute cible tactile fait au moins 44 px de haut ;
 * - les champs sont en 16 px sur téléphone, sans quoi iOS zoome à la saisie ;
 * - les contrôles viennent de shadcn (`components/ui/`) : aucune liste
 *   déroulante, case à cocher ni boîte de confirmation native du navigateur ;
 * - un état de chargement s'annonce (`role="status"`), une erreur aussi
 *   (`role="alert"`).
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  QUOTE_DEFAULT_DIAL_CODE,
  QUOTE_DIAL_CODES,
  formatQuoteLocalPhone,
  joinQuotePhone,
  quotePhoneExample,
} from "@/convex/quoteRules";
import { fr } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { refusalMessage } from "@/lib/refusalMessage";
import { Button as ShadButton, buttonVariants } from "@/components/ui/button";
import { Input as ShadInput } from "@/components/ui/input";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { Card as ShadCard } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Avatar as ShadAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Boutons ────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** La variante shadcn qui porte chaque bouton du kit. */
const SHAD_VARIANT = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
} as const;

/** 44 px de haut au moins, et le texte passe à la ligne plutôt que de déborder. */
const BUTTON_SIZE =
  "h-auto min-h-11 gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-normal focus-visible:ring-(--dash-strong)/40";

const BUTTON_TONES: Record<ButtonVariant, string> = {
  primary:
    "bg-(--dash-strong) text-white hover:brightness-110 [a]:hover:bg-(--dash-strong)",
  secondary:
    "border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:text-stone-900",
  ghost: "text-stone-700 hover:bg-stone-100 hover:text-stone-900",
  danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700/40",
};

export function buttonClass(variant: ButtonVariant = "primary", extra?: string) {
  return cn(
    buttonVariants({ variant: SHAD_VARIANT[variant] }),
    BUTTON_SIZE,
    BUTTON_TONES[variant],
    extra,
  );
}

export function Button({
  variant = "primary",
  busy = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: Omit<React.ComponentProps<typeof ShadButton>, "variant" | "size" | "className"> & {
  variant?: ButtonVariant;
  busy?: boolean;
  className?: string;
}) {
  return (
    <ShadButton
      type={type}
      variant={SHAD_VARIANT[variant]}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(BUTTON_SIZE, BUTTON_TONES[variant], className)}
      {...props}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </ShadButton>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, className)} {...props}>
      {children}
    </Link>
  );
}

// ── Mise en page ───────────────────────────────────────────────────────────

/** L'en-tête d'une page : retour éventuel, titre, sous-titre, actions. */
export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-3">
      {back && (
        <Link
          href={back.href}
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-stone-600 outline-none hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-(--dash-strong) print:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-stone-600 sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>
        )}
      </div>
    </header>
  );
}

// `flex-row` annule le `flex-col` de la carte shadcn : une carte qui demande
// `flex` aligne ses éléments en ligne, sauf si elle demande `flex-col`.
const CARD_CLASS =
  "block flex-row gap-0 rounded-2xl border border-stone-200 bg-white py-0 text-base text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.04)] ring-0";

/**
 * Une carte shadcn. `as` change la balise qui la porte (`li` dans une liste,
 * `form` pour un formulaire) sans changer son dessin.
 */
export function Card({
  className,
  children,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "li" | "form";
}) {
  if (Tag === "div") {
    return (
      <ShadCard
        className={cn(CARD_CLASS, className)}
        {...(props as React.ComponentProps<"div">)}
      >
        {children}
      </ShadCard>
    );
  }
  const Component = Tag as React.ElementType;
  // Un formulaire ne montre pas les bulles de validation du navigateur : le
  // refus s'affiche dans la page, par un `Notice`, avec le texte du serveur.
  const formProps = Tag === "form" ? { noValidate: true } : null;
  return (
    <Component {...formProps} {...props}>
      <ShadCard className={cn(CARD_CLASS, "h-full", className)}>
        {children}
      </ShadCard>
    </Component>
  );
}

/** Le titre d'une section de page, avec une action à droite. */
export function SectionTitle({
  children,
  action,
  id,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id={id} className="text-lg font-semibold text-stone-900">
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Le titre d'une carte, avec son icône dans une pastille d'accent. */
export function CardTitle({
  icon: Icon,
  children,
  description,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--dash-soft) text-(--dash-strong)">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="font-semibold text-stone-900">{children}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-stone-600">{description}</p>
        )}
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-3 sm:p-5">
      <div className="flex flex-col gap-1 text-xs font-medium text-stone-600 sm:flex-row sm:items-center sm:gap-2 sm:text-sm">
        <Icon className="h-4 w-4 shrink-0 text-(--dash-strong)" aria-hidden />
        <span className="min-w-0">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-stone-900 sm:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
    </Card>
  );
}

// ── États ──────────────────────────────────────────────────────────────────

export function LoadingBlock({ label = "Chargement" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500"
    >
      <Loader2 className="h-8 w-8 animate-spin text-(--dash-strong)" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-3 font-semibold text-stone-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

type NoticeTone = "error" | "success" | "info" | "warning";

const NOTICE_TONES: Record<NoticeTone, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

/** Un message d'état. Une erreur est annoncée tout de suite au lecteur d'écran. */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: NoticeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Alert
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "block rounded-xl px-3 py-2 text-sm",
        NOTICE_TONES[tone],
        className,
      )}
    >
      {children}
    </Alert>
  );
}

// ── Formulaires ────────────────────────────────────────────────────────────

const CONTROL_CLASS =
  "rounded-xl border-stone-300 bg-white px-3 text-base text-stone-900 placeholder:text-stone-400 focus-visible:border-(--dash-strong) focus-visible:ring-(--dash-strong)/30 sm:text-sm";

/** Le champ de saisie shadcn, à la taille des espaces adultes. */
export function Input({
  className,
  ...props
}: React.ComponentProps<typeof ShadInput>) {
  return (
    <ShadInput className={cn("h-11", CONTROL_CLASS, className)} {...props} />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<typeof ShadTextarea>) {
  return (
    <ShadTextarea
      className={cn("min-h-24 py-2", CONTROL_CLASS, className)}
      {...props}
    />
  );
}

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

/**
 * La liste déroulante shadcn. Une valeur vide affiche `placeholder` : il n'y a
 * pas d'option vide à choisir.
 */
export function SelectField<T extends string>({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Choisir",
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: T | "";
  onValueChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Select
      items={options as SelectOption<T>[]}
      value={value === "" ? null : value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next as T);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "w-full data-[size=default]:h-11",
          CONTROL_CLASS,
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="rounded-xl">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="min-h-10 rounded-lg px-2.5 text-sm"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Un jour « AAAA-MM-JJ », lu et écrit à l'heure de l'appareil. */
const toIsoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromIsoDay = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Un champ date : le sélecteur de shadcn (`Popover` + `Calendar`), en
 * français, semaine commençant le lundi, à la place du champ date natif.
 * `value` est un jour « AAAA-MM-JJ », ou `""` ; une croix efface la date.
 */
export function DateField({
  id,
  value,
  onChange,
  placeholder = "Choisir une date",
  disablePast = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disablePast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          className={cn(
            "flex h-11 w-full items-center gap-2 border text-left outline-none focus-visible:ring-3",
            CONTROL_CLASS,
            value && "pr-12",
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
          <span className={value ? "" : "text-stone-400"}>
            {value
              ? fromIsoDay(value).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto rounded-2xl p-2">
          <Calendar
            mode="single"
            locale={fr}
            weekStartsOn={1}
            selected={value ? fromIsoDay(value) : undefined}
            defaultMonth={value ? fromIsoDay(value) : today}
            disabled={disablePast ? { before: today } : undefined}
            onSelect={(date) => {
              onChange(date ? toIsoDay(date) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          aria-label="Effacer la date"
          onClick={() => onChange("")}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 outline-none hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

const DIAL_OPTIONS = QUOTE_DIAL_CODES.map((dial) => ({
  value: dial.code,
  label: `${dial.country} (${dial.code})`,
}));

/** Sépare « +221 77 123 45 67 » en indicatif connu et numéro national. */
function splitPhone(value: string): { dial: string; local: string } {
  const typed = value.trim();
  // Le plus long indicatif d'abord : « +221 » avant « +22 ».
  const known = [...QUOTE_DIAL_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((dial) => typed.startsWith(dial.code));
  if (!known) return { dial: QUOTE_DEFAULT_DIAL_CODE, local: typed };
  return {
    dial: known.code,
    local: formatQuoteLocalPhone(known.code, typed.slice(known.code.length)),
  };
}

/**
 * Un numéro de téléphone : la liste des indicatifs (Sénégal par défaut), puis
 * le numéro national, espacé à la frappe comme dans le pays. Les règles sont
 * celles du formulaire de devis (`convex/quoteRules.ts`).
 *
 * `value` et `onChange` portent le numéro COMPLET (« +221 77 123 45 67 »), ou
 * `""` quand le champ est vide.
 */
export function PhoneField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [dial, setDial] = useState(() => splitPhone(value).dial);
  const [local, setLocal] = useState(() => splitPhone(value).local);

  function update(nextDial: string, typed: string) {
    const nextLocal = formatQuoteLocalPhone(nextDial, typed);
    setDial(nextDial);
    setLocal(nextLocal);
    onChange(nextLocal.trim() === "" ? "" : joinQuotePhone(nextDial, nextLocal));
  }

  return (
    <div className="flex gap-2">
      <Select
        items={DIAL_OPTIONS}
        value={dial}
        onValueChange={(next) => {
          if (next !== null) update(next as string, local);
        }}
      >
        <SelectTrigger
          aria-label="Indicatif du pays"
          className={cn("w-[6.5rem] flex-none data-[size=default]:h-11", CONTROL_CLASS)}
        >
          {/* La liste dit le pays ; le champ fermé ne montre que l'indicatif. */}
          <SelectValue>{(shown: string) => shown}</SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          align="start"
          className="max-h-72 w-64 rounded-xl"
        >
          {DIAL_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-10 rounded-lg px-2.5 text-sm"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ShadInput
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={quotePhoneExample(dial)}
        value={local}
        onChange={(e) => update(dial, e.target.value)}
        className={cn("h-11 min-w-0 flex-1", CONTROL_CLASS)}
      />
    </div>
  );
}

/** Un réglage oui/non : l'interrupteur shadcn, son titre et son explication. */
export function SwitchRow({
  id,
  checked,
  onCheckedChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4">
      <div className="min-w-0">
        <Label
          id={`${id}-label`}
          htmlFor={id}
          className="text-sm font-medium text-stone-900"
        >
          {label}
        </Label>
        {description && (
          <p id={`${id}-description`} className="mt-0.5 text-sm text-stone-600">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        className="mt-1 data-checked:bg-(--dash-strong) data-[size=default]:h-6 data-[size=default]:w-10 *:data-[slot=switch-thumb]:size-5"
      />
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={htmlFor}
        className="mb-1.5 text-sm font-medium text-stone-800"
      >
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

/**
 * Lance une écriture serveur et garde son état : en cours, refusée, réussie.
 *
 * Une mutation Convex refusée rejette sa promesse. Sans ce garde, un clic sur
 * « Retirer » ou un changement de liste déroulante qui échouait ne montrait
 * rien à l'écran et laissait une erreur non rattrapée dans la console.
 */
export function useAsyncAction(fallbackMessage: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(
    async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
      setBusy(true);
      setError(null);
      try {
        return await task();
      } catch (err) {
        if (alive.current) setError(refusalMessage(err, fallbackMessage));
        return undefined;
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [fallbackMessage],
  );

  return { busy, error, run, clearError: () => setError(null) };
}

/**
 * Une action à confirmer, dans une boîte de dialogue shadcn. Rien n'est écrit
 * au premier clic ; un refus du serveur s'affiche dans la boîte, qui reste
 * ouverte.
 */
export function ConfirmAction({
  trigger,
  triggerLabel,
  title,
  message,
  confirmLabel,
  onConfirm,
  danger = true,
  failMessage = "L'action n'a pas pu être faite.",
}: {
  /** Le contenu du bouton d'ouverture (icône, texte). */
  trigger: React.ReactNode;
  /** Le nom accessible du bouton d'ouverture, quand il n'a qu'une icône. */
  triggerLabel?: string;
  /** Le titre de la boîte. Par défaut : le libellé de confirmation, en question. */
  title?: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  danger?: boolean;
  failMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const { busy, error, run, clearError } = useAsyncAction(failMessage);

  return (
    <>
      <ShadButton
        type="button"
        variant="ghost"
        onClick={() => {
          clearError();
          setOpen(true);
        }}
        aria-label={triggerLabel}
        title={triggerLabel}
        className={cn(
          "h-auto min-h-11 min-w-11 gap-1.5 rounded-xl px-2.5 text-sm font-medium focus-visible:ring-(--dash-strong)/40",
          danger
            ? "text-stone-600 hover:bg-red-50 hover:text-red-700"
            : "text-(--dash-strong) hover:bg-(--dash-soft) hover:text-(--dash-strong)",
        )}
      >
        {trigger}
      </ShadButton>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) setOpen(next);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-stone-900">
              {title ?? `${confirmLabel} ?`}
            </AlertDialogTitle>
            {message && (
              <AlertDialogDescription className="text-sm text-stone-600">
                {message}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {error && <Notice tone="error">{error}</Notice>}
          <AlertDialogFooter>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant={danger ? "danger" : "primary"}
              busy={busy}
              onClick={async () => {
                const done = await run(async () => {
                  await onConfirm();
                  return true;
                });
                if (done) setOpen(false);
              }}
            >
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Un formulaire dans une boîte de dialogue shadcn, ouverte par un bouton.
 *
 * La page reste une page à lire : listes et chiffres. Créer, inviter ou
 * modifier s'ouvre par un bouton, au lieu d'un formulaire posé au milieu des
 * listes. `children` reçoit `close` ; il n'est monté qu'à l'ouverture, donc
 * chaque ouverture repart d'un formulaire vide.
 */
export function FormDialog({
  trigger,
  triggerVariant = "primary",
  triggerLabel,
  triggerClassName,
  title,
  description,
  children,
}: {
  trigger: React.ReactNode;
  triggerVariant?: ButtonVariant;
  /** Le nom accessible du bouton, quand son texte ne suffit pas. */
  triggerLabel?: string;
  triggerClassName?: string;
  title: string;
  description?: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={triggerVariant}
        aria-label={triggerLabel}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-2xl border border-stone-200 p-5 sm:p-6">
          <DialogHeader className="items-start gap-1 pr-10 text-left">
            <DialogTitle className="font-sans text-xl font-semibold text-stone-900">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-stone-600">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogClose
            aria-label="Fermer"
            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-stone-600 outline-none hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
          >
            <X className="h-5 w-5" aria-hidden />
          </DialogClose>
          {open && children(() => setOpen(false))}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Deux ou trois façons de faire la même chose, en onglets shadcn. */
export function ChoiceTabs({
  tabs,
}: {
  tabs: { value: string; label: string; content: React.ReactNode }[];
}) {
  return (
    <Tabs defaultValue={tabs[0]?.value} className="gap-4">
      <TabsList className="h-auto w-full rounded-xl bg-stone-100 p-1 group-data-horizontal/tabs:h-auto">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="min-h-10 rounded-lg px-2 text-sm whitespace-normal text-stone-700 data-active:bg-white data-active:text-stone-900"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** Le bas d'un formulaire en dialogue : annuler à gauche, valider à droite. */
export function DialogActions({
  onCancel,
  cancelLabel = "Annuler",
  children,
}: {
  onCancel: () => void;
  cancelLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      {children}
    </div>
  );
}

// ── Données ────────────────────────────────────────────────────────────────

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

const AVATAR_SIZES = {
  sm: "size-9 text-xs",
  md: "size-12 text-sm",
  lg: "size-14 text-base",
} as const;

/** La photo d'une personne, ou ses initiales. L'image est décorative. */
export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof AVATAR_SIZES;
}) {
  return (
    <ShadAvatar aria-hidden className={cn("after:hidden", AVATAR_SIZES[size])}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback
        className={cn(
          "bg-(--dash-soft) font-bold text-(--dash-strong)",
          AVATAR_SIZES[size],
        )}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </ShadAvatar>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  /** De 0 à 100. */
  value: number;
  label: string;
}) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <Progress
      value={safe}
      aria-label={label}
      className="*:data-[slot=progress-track]:h-2 *:data-[slot=progress-track]:bg-stone-100 **:data-[slot=progress-indicator]:bg-(--dash-strong)"
    />
  );
}

/** La note d'un rapport, en couleur ET en mots : la couleur seule ne suffit pas. */
export function scoreTone(percent: number): {
  text: string;
  pill: string;
  word: string;
} {
  if (percent >= 80) {
    return {
      text: "text-emerald-700",
      pill: "bg-emerald-50 text-emerald-800",
      word: "Acquis",
    };
  }
  if (percent >= 50) {
    return {
      text: "text-amber-700",
      pill: "bg-amber-50 text-amber-800",
      word: "En cours",
    };
  }
  return {
    text: "text-red-700",
    pill: "bg-red-50 text-red-800",
    word: "À revoir",
  };
}

export function ScorePill({ percent }: { percent: number }) {
  const tone = scoreTone(percent);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone.pill,
      )}
    >
      <span className="tabular-nums">{percent} %</span>
      <span aria-hidden>·</span>
      <span>{tone.word}</span>
    </span>
  );
}

export function formatDay(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDayTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** « 1 élève », « 3 élèves ». */
export function plural(count: number, singular: string, pluralForm?: string) {
  return `${count} ${count > 1 ? (pluralForm ?? `${singular}s`) : singular}`;
}

// ── Pagination ──────────────────────────────────────────────────────────────

/** Les listes des consoles montrent 40 lignes par page. */
export const PAGE_SIZE = 40;

/**
 * Découpe une liste en pages. `resetKey` ramène à la première page quand il
 * change (une recherche, un onglet) ; une liste qui raccourcit ne laisse
 * jamais sur une page vide.
 */
export function usePagination<T>(
  items: readonly T[],
  resetKey: string = "",
  pageSize: number = PAGE_SIZE,
) {
  const [state, setState] = useState({ page: 1, key: resetKey });
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(state.key === resetKey ? state.page : 1, pageCount);
  const start = (page - 1) * pageSize;
  return {
    page,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
    /** Rang de la première et de la dernière ligne affichées, à partir de 1. */
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, items.length),
    total: items.length,
    setPage: (next: number) =>
      setState({ page: Math.min(Math.max(1, next), pageCount), key: resetKey }),
  };
}

/** « 41 à 80 sur 213 », avec Précédent et Suivant. Rien sur une seule page. */
export function Pagination({
  pagination,
  label,
}: {
  pagination: ReturnType<typeof usePagination>;
  /** Ce que la liste contient, pour le lecteur d'écran : « comptes ». */
  label: string;
}) {
  const { page, pageCount, from, to, total, setPage } = pagination;
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label={`Pages de la liste : ${label}`}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-stone-600" aria-live="polite">
        {from} à {to} sur {total} · page {page} sur {pageCount}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Précédent
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        >
          Suivant
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
