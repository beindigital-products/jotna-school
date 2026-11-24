"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, X } from "lucide-react";
import { fr } from "react-day-picker/locale";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";

import { api } from "@/convex/_generated/api";
import {
  cleanQuoteRequest,
  formatQuoteDate,
  formatQuoteLocalPhone,
  joinQuotePhone,
  QUOTE_DEFAULT_DIAL_CODE,
  QUOTE_DIAL_CODES,
  QUOTE_LEVELS,
  QUOTE_LIMITS,
  quotePhoneExample,
  QUOTE_SCHOOL_TYPE_LABELS,
  type QuoteField,
  type QuoteLevel,
  type QuoteSchoolType,
} from "@/convex/quoteRules";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { BTN_PAPER, BTN_SUN } from "./landing-style";

/**
 * LE FORMULAIRE DE DEVIS D'UNE ÉCOLE, ouvert par le bouton « Demander un devis »
 * du bloc des prix (`pricing.tsx`). Il pose les questions dont l'équipe a
 * besoin pour chiffrer, et rien de plus : l'école, la personne qui écrit, le
 * nombre d'élèves et de classes, les classes concernées, le module Arabe &
 * Coran.
 *
 * LES MÊMES RÈGLES DES DEUX CÔTÉS. `cleanQuoteRequest` (`convex/quoteRules.ts`)
 * vérifie la saisie ici, avant l'envoi, puis de nouveau au serveur
 * (`quotes.request`) : le formulaire pose l'erreur sous le bon champ, et un
 * appel direct à la mutation ne contourne rien.
 *
 * La demande est enregistrée puis envoyée par courriel à l'équipe
 * (`convex/quotesEmail.ts`). Aucune adresse n'est affichée ici.
 *
 * LES CHAMPS SONT CEUX DE SHADCN (`components/ui` : `Input`, `Select`,
 * `Checkbox`, `Textarea`, `Label`), habillés aux couleurs de la vitrine par
 * `FIELD`. Pas de `<select>` ni de case à cocher du navigateur : leur liste et
 * leur coche ne se stylent pas.
 */
type Draft = {
  schoolName: string;
  city: string;
  schoolType: QuoteSchoolType;
  contactName: string;
  contactRole: string;
  email: string;
  /** L'indicatif du pays, choisi dans la liste ; `phone` est le numéro sans lui. */
  dialCode: string;
  phone: string;
  studentCount: string;
  classCount: string;
  levels: QuoteLevel[];
  wantsArabic: boolean;
  startWhen: string;
  message: string;
};

const EMPTY: Draft = {
  schoolName: "",
  city: "",
  schoolType: "privee",
  contactName: "",
  contactRole: "",
  email: "",
  dialCode: QUOTE_DEFAULT_DIAL_CODE,
  phone: "",
  studentCount: "",
  classCount: "",
  levels: [...QUOTE_LEVELS],
  wantsArabic: false,
  startWhen: "",
  message: "",
};

const FIELD =
  "mt-1.5 h-11 w-full rounded-xl border-2 border-[#ecd9ac] bg-[#fffdf7] px-3 text-base text-[#2b1d0e] placeholder:text-[#6b563f]/60 focus-visible:border-[#8a4b1f] focus-visible:ring-[#8a4b1f]/25 aria-invalid:border-[#c8452c] md:text-base";

const DIAL_CODES = QUOTE_DIAL_CODES.map((d) => ({ value: d.code, label: `${d.country} (${d.code})` }));

const SCHOOL_TYPES = (Object.keys(QUOTE_SCHOOL_TYPE_LABELS) as QuoteSchoolType[]).map((value) => ({
  value,
  label: QUOTE_SCHOOL_TYPE_LABELS[value],
}));

type Problem = { field: QuoteField | null; message: string };

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="gap-1 text-sm font-semibold leading-5 text-[#2b1d0e]">
        {label}
        {optional ? <span className="font-normal text-[#6b563f]">(facultatif)</span> : null}
      </Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined })}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-[#c8452c]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Un jour du calendrier « AAAA-MM-JJ », lu et écrit à l'heure du visiteur. */
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * LE DÉMARRAGE SOUHAITÉ : le sélecteur de date de shadcn (`Popover` +
 * `Calendar`), en français, la semaine commençant le lundi. Les jours passés
 * sont grisés. Le champ est facultatif : une croix efface la date.
 */
function StartDatePicker({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          {...props}
          className={`${FIELD} flex cursor-pointer items-center gap-2 border-2 text-left outline-none focus-visible:ring-3 ${
            value ? "pr-11" : ""
          }`}
        >
          <CalendarDays aria-hidden className="size-5 flex-none text-[#8a4b1f]" />
          <span className={value ? "" : "text-[#6b563f]/60"}>{value ? formatQuoteDate(value) : "Choisir une date"}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto rounded-2xl border-2 border-[#ecd9ac] bg-[#fffdf7] p-2 text-[#2b1d0e]">
          <Calendar
            mode="single"
            locale={fr}
            weekStartsOn={1}
            selected={value ? fromIso(value) : undefined}
            defaultMonth={value ? fromIso(value) : today}
            disabled={{ before: today }}
            onSelect={(date) => {
              onChange(date ? toIso(date) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <button
          type="button"
          aria-label="Effacer la date"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 mt-[3px] flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#6b563f] outline-none hover:bg-[#fdeecb] focus-visible:ring-2 focus-visible:ring-[#1e2a4a]"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function QuoteRequestButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const send = useMutation(api.quotes.request);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (problem?.field === key) setProblem(null);
  };
  const errorOf = (field: QuoteField) => (problem?.field === field ? problem.message : undefined);

  function toggleLevel(level: QuoteLevel) {
    set(
      "levels",
      draft.levels.includes(level) ? draft.levels.filter((l) => l !== level) : [...draft.levels, level],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    const { dialCode, ...answers } = draft;
    const checked = cleanQuoteRequest({
      ...answers,
      phone: joinQuotePhone(dialCode, draft.phone),
      // Un champ vide donne NaN, que la règle refuse avec le bon message.
      studentCount: draft.studentCount.trim() === "" ? NaN : Number(draft.studentCount),
      classCount: draft.classCount.trim() === "" ? NaN : Number(draft.classCount),
    });
    if (!checked.ok) {
      setProblem({ field: checked.field, message: checked.message });
      return;
    }
    setProblem(null);
    setSending(true);
    try {
      await send(checked.value);
      setSent(true);
      setDraft(EMPTY);
    } catch (error) {
      const data = error instanceof ConvexError ? (error.data as Partial<Problem> | string) : null;
      if (data && typeof data === "object" && typeof data.message === "string") {
        setProblem({ field: data.field ?? null, message: data.message });
      } else {
        setProblem({
          field: null,
          message: "La demande n'a pas pu partir. Vérifiez votre connexion, puis réessayez.",
        });
      }
    } finally {
      setSending(false);
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    // Rouvert après un envoi, le formulaire repart vide.
    if (!next && sent) setSent(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`cursor-pointer ${BTN_PAPER} ${className}`}>
        Demander un devis
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92svh] max-w-2xl overflow-y-auto border-[#ecd9ac] bg-[#fff8e7] p-5 sm:p-7">
          <DialogHeader className="items-start text-left">
            <DialogTitle className="text-[#2b1d0e]">
              {sent ? "Demande envoyée" : "Demander un devis pour mon école"}
            </DialogTitle>
            <DialogDescription className="text-[#6b563f]">
              {sent
                ? "Merci. Nous vous répondrons à l'adresse e-mail indiquée."
                : "Ces informations servent à préparer votre devis, et à rien d'autre."}
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <button type="button" onClick={() => onOpenChange(false)} className={`cursor-pointer ${BTN_SUN}`}>
              Fermer
            </button>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5">
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-1 font-display text-lg font-bold text-[#2b1d0e] sm:col-span-2">L&apos;école</legend>
                <Field label="Nom de l'école" error={errorOf("schoolName")}>
                  {(props) => (
                    <Input
                      {...props}
                      className={FIELD}
                      value={draft.schoolName}
                      maxLength={QUOTE_LIMITS.shortText}
                      autoComplete="organization"
                      onChange={(e) => set("schoolName", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Ville ou commune" error={errorOf("city")}>
                  {(props) => (
                    <Input
                      {...props}
                      className={FIELD}
                      value={draft.city}
                      maxLength={QUOTE_LIMITS.shortText}
                      autoComplete="address-level2"
                      onChange={(e) => set("city", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Type d'établissement">
                  {(props) => (
                    <Select
                      items={SCHOOL_TYPES}
                      value={draft.schoolType}
                      onValueChange={(value) => set("schoolType", value as QuoteSchoolType)}
                    >
                      <SelectTrigger {...props} className={`${FIELD} data-[size=default]:h-11`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 border-[#ecd9ac] bg-[#fffdf7] text-[#2b1d0e]">
                        {SCHOOL_TYPES.map((type) => (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            className="rounded-lg py-2 text-base focus:bg-[#fdeecb] focus:text-[#2b1d0e]"
                          >
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <Field label="Démarrage souhaité" optional error={errorOf("startWhen")}>
                  {(props) => (
                    <StartDatePicker {...props} value={draft.startWhen} onChange={(value) => set("startWhen", value)} />
                  )}
                </Field>
              </fieldset>

              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-1 font-display text-lg font-bold text-[#2b1d0e] sm:col-span-2">Les élèves</legend>
                <Field label="Nombre d'élèves" error={errorOf("studentCount")}>
                  {(props) => (
                    <Input
                      {...props}
                      className={FIELD}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={QUOTE_LIMITS.maxStudents}
                      value={draft.studentCount}
                      onChange={(e) => set("studentCount", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Nombre de classes" error={errorOf("classCount")}>
                  {(props) => (
                    <Input
                      {...props}
                      className={FIELD}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={QUOTE_LIMITS.maxClasses}
                      value={draft.classCount}
                      onChange={(e) => set("classCount", e.target.value)}
                    />
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <p id="quote-levels" className="text-sm font-semibold text-[#2b1d0e]">
                    Classes concernées
                  </p>
                  <div role="group" aria-labelledby="quote-levels" className="mt-1.5 flex flex-wrap gap-2">
                    {QUOTE_LEVELS.map((level) => {
                      const on = draft.levels.includes(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleLevel(level)}
                          className={`min-w-14 cursor-pointer rounded-xl border-2 px-3 py-2 font-display text-base font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#1e2a4a] ${
                            on
                              ? "border-[#8a4b1f] bg-[#8a4b1f] text-[#fff8e7]"
                              : "border-[#ecd9ac] bg-[#fffdf7] text-[#2b1d0e]"
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                  {errorOf("levels") ? (
                    <p role="alert" className="mt-1 text-sm font-medium text-[#c8452c]">
                      {errorOf("levels")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <Checkbox
                    id="quote-arabic"
                    checked={draft.wantsArabic}
                    onCheckedChange={(checked) => set("wantsArabic", checked === true)}
                    className="mt-0.5 size-5 rounded-md border-2 border-[#8a4b1f] bg-[#fffdf7] data-checked:border-[#8a4b1f] data-checked:bg-[#8a4b1f] data-checked:text-[#fff8e7]"
                  />
                  <Label htmlFor="quote-arabic" className="cursor-pointer text-base font-normal leading-6 text-[#2b1d0e]">
                    Nous voulons aussi le module Arabe &amp; Coran.
                  </Label>
                </div>
              </fieldset>

              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-1 font-display text-lg font-bold text-[#2b1d0e] sm:col-span-2">Votre contact</legend>
                <Field label="Votre nom" error={errorOf("contactName")}>
                  {(props) => (
                    <Input
                      {...props}
                      className={FIELD}
                      value={draft.contactName}
                      maxLength={QUOTE_LIMITS.shortText}
                      autoComplete="name"
                      onChange={(e) => set("contactName", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Votre fonction" error={errorOf("contactRole")}>
                  {(props) => (
                    <Input
                      {...props}
                      className={FIELD}
                      value={draft.contactRole}
                      maxLength={QUOTE_LIMITS.shortText}
                      autoComplete="organization-title"
                      placeholder="Par exemple : directrice"
                      onChange={(e) => set("contactRole", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="E-mail" error={errorOf("email")}>
                  {(props) => (
                    <Input
                      {...props}
                      className={FIELD}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={draft.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Téléphone" error={errorOf("phone")}>
                  {(props) => (
                    <div className="flex gap-2">
                      <Select
                        items={DIAL_CODES}
                        value={draft.dialCode}
                        onValueChange={(value) => {
                          // Le numéro déjà tapé est remis en forme pour le nouveau pays.
                          const dial = value as string;
                          setDraft((d) => ({ ...d, dialCode: dial, phone: formatQuoteLocalPhone(dial, d.phone) }));
                          if (problem?.field === "phone") setProblem(null);
                        }}
                      >
                        <SelectTrigger
                          aria-label="Indicatif du pays"
                          className={`${FIELD} w-[6.5rem] flex-none data-[size=default]:h-11`}
                        >
                          {/* La liste dit le pays ; le champ fermé ne montre que l'indicatif. */}
                          <SelectValue>{(value: string) => value}</SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          align="start"
                          className="max-h-72 w-64 rounded-xl border-2 border-[#ecd9ac] bg-[#fffdf7] text-[#2b1d0e]"
                        >
                          {DIAL_CODES.map((dial) => (
                            <SelectItem
                              key={dial.value}
                              value={dial.value}
                              className="rounded-lg py-2 text-base focus:bg-[#fdeecb] focus:text-[#2b1d0e]"
                            >
                              {dial.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        {...props}
                        className={`${FIELD} min-w-0 flex-1`}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder={quotePhoneExample(draft.dialCode)}
                        value={draft.phone}
                        onChange={(e) => set("phone", formatQuoteLocalPhone(draft.dialCode, e.target.value))}
                      />
                    </div>
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Message" optional error={errorOf("message")}>
                    {(props) => (
                      <Textarea
                        {...props}
                        className={`${FIELD} h-auto min-h-24 resize-y py-2.5`}
                        value={draft.message}
                        maxLength={QUOTE_LIMITS.message}
                        onChange={(e) => set("message", e.target.value)}
                      />
                    )}
                  </Field>
                </div>
              </fieldset>

              {problem && problem.field === null ? (
                <p role="alert" className="rounded-xl bg-[#fbe1da] px-4 py-3 text-sm font-medium text-[#8f2c18]">
                  {problem.message}
                </p>
              ) : null}

              <button type="submit" disabled={sending} className={`cursor-pointer disabled:opacity-60 ${BTN_SUN}`}>
                {sending ? "Envoi en cours…" : "Envoyer ma demande"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
