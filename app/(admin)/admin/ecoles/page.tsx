"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { School, Plus, ChevronRight, MapPin, Search } from "lucide-react";

import {
  Button,
  Card,
  DialogActions,
  EmptyState,
  Field,
  FormDialog,
  Input,
  LoadingBlock,
  Notice,
  PageHeader,
  Pagination,
  PhoneField,
  useAsyncAction,
  usePagination,
} from "@/components/dashboard/ui";

/** Minuscules, sans accents : pour chercher « awa » dans « Àwa ». */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
import { StatusPill, type Tone } from "@/components/admin/console-ui";

/** Libellés des trois statuts de `schools.status` (convex/schema.ts). */
const STATUS_LABEL: Record<string, string> = {
  prospect: "Prospect",
  active: "Active",
  suspended: "Suspendue",
};

const STATUS_TONE: Record<string, Tone> = {
  prospect: "neutral",
  active: "good",
  suspended: "critical",
};

function CreateSchoolForm({ close }: { close: () => void }) {
  const createSchool = useMutation(api.schools.createSchool);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [ninea, setNinea] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);
  // `createSchool` refuse comme les dix autres mutations de `convex/schools.ts` :
  // par une ConvexError dont la donnée est la phrase, que `useAsyncAction` lit.
  const { busy, error, run } = useAsyncAction("Erreur lors de la création");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Le serveur ne contrôle pas ces champs : l'écran les exige, comme le
    // faisait la validation du navigateur, mais dit pourquoi dans la page.
    if (name === "" || contactName === "" || contactEmail === "") {
      setInvalid("Renseignez le nom, le contact et son email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(contactEmail)) {
      setInvalid("L'email du contact n'est pas une adresse valide.");
      return;
    }
    setInvalid(null);
    // Les champs facultatifs partent en `undefined` quand ils sont vides :
    // une chaîne vide stockée se relit comme une valeur renseignée.
    const created = await run(() =>
      createSchool({
        name,
        city: city.trim() || undefined,
        contactName,
        contactEmail,
        contactPhone: contactPhone.trim() || undefined,
        ninea: ninea.trim() || undefined,
      }),
    );
    if (created) close();
  };

  return (
    <form onSubmit={handleCreate} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="school-name">
          <Input
            id="school-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: École Cheikh Anta Diop"
          />
        </Field>
        <Field label="Ville" htmlFor="school-city">
          <Input
            id="school-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="ex: Dakar"
          />
        </Field>
        <Field label="Contact" htmlFor="school-contact">
          <Input
            id="school-contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="ex: Mme Diop, directrice"
          />
        </Field>
        <Field label="Email du contact" htmlFor="school-email">
          <Input
            id="school-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="ex: direction@ecole.sn"
          />
        </Field>
        <Field label="Téléphone" htmlFor="school-phone">
          <PhoneField id="school-phone" value={contactPhone} onChange={setContactPhone} />
        </Field>
        <Field label="NINEA" htmlFor="school-ninea">
          <Input
            id="school-ninea"
            value={ninea}
            onChange={(e) => setNinea(e.target.value)}
            placeholder="identifiant fiscal, pour la facture"
          />
        </Field>
      </div>
      <p className="text-xs text-stone-500">
        Une école est créée au statut « prospect ». Son abonnement se gère
        ailleurs : tant qu&apos;il n&apos;existe pas, les élèves inscrits
        n&apos;ont pas accès à l&apos;application.
      </p>

      {(invalid ?? error) && <Notice tone="error">{invalid ?? error}</Notice>}

      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Créer
        </Button>
      </DialogActions>
    </form>
  );
}

export default function SchoolsPage() {
  const allSchools = useQuery(api.schools.listSchools);
  // L'espace personnel d'un professeur sans école n'est pas une école : il a
  // sa ligne dans Comptes, onglet Professeurs.
  const schools = allSchools?.filter((school) => school.kind !== "personal");
  const [search, setSearch] = useState("");
  const needle = normalize(search.trim());
  const shown = (schools ?? []).filter(
    (school) =>
      !needle ||
      normalize(`${school.name} ${school.city ?? ""} ${school.contactName}`).includes(needle),
  );
  const pagination = usePagination(shown, needle);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Écoles"
        description="Personnel, classes et inscriptions des écoles partenaires"
        actions={
          <FormDialog
            trigger={
              <>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une école
              </>
            }
            title="Nouvelle école"
          >
            {(close) => <CreateSchoolForm close={close} />}
          </FormDialog>
        }
      />

      {schools === undefined ? (
        <LoadingBlock label="Chargement des écoles" />
      ) : schools.length === 0 ? (
        <EmptyState
          icon={School}
          title="Aucune école"
          description="Commencez par créer une école, puis rattachez-lui son personnel."
        />
      ) : (
        <>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <Input
            aria-label="Rechercher une école"
            placeholder="Rechercher par nom, ville ou contact"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-stone-600">
          {shown.length} école{shown.length > 1 ? "s" : ""}
          {needle ? ` sur ${schools.length}` : ""}
        </p>
        <ul className="space-y-3">
          {pagination.pageItems.map((school) => (
            <Card
              as="li"
              key={school._id}
              className="transition-colors hover:border-stone-300"
            >
              <Link
                href={`/admin/ecoles/detail?id=${school._id}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-(--dash-strong) sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--dash-soft) text-(--dash-strong)">
                    <School className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">
                      {school.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                      {school.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {school.city}
                        </span>
                      )}
                      <span>{school.contactName}</span>
                      <span className="break-all">{school.contactEmail}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill tone={STATUS_TONE[school.status] ?? "neutral"}>
                    {STATUS_LABEL[school.status] ?? school.status}
                  </StatusPill>
                  <ChevronRight className="h-5 w-5 text-stone-400" aria-hidden />
                </div>
              </Link>
            </Card>
          ))}
        </ul>
        <Pagination pagination={pagination} label="écoles" />
        </>
      )}
    </div>
  );
}
