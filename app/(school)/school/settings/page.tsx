"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Save, School } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { AccountSettings } from "@/components/dashboard/account-settings";
import {
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  Notice,
  useAsyncAction,
} from "@/components/dashboard/ui";
import { useServerFormSync } from "@/hooks/use-server-form-sync";

export default function SchoolSettingsPage() {
  return (
    <AccountSettings
      description="Votre compte et les informations de l'école."
      after={<SchoolIdentityCard />}
    />
  );
}

/** Le nom et la ville de l'école, tels que les voient professeurs et parents. */
function SchoolIdentityCard() {
  const data = useQuery(api.schoolSpace.mySchool);
  const updateMySchool = useMutation(api.schoolSpace.updateMySchool);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAsyncAction("L'école n'a pas pu être modifiée.");

  useServerFormSync(
    data?.school,
    (school) => JSON.stringify([school.name, school.city]),
    (school) => {
      setName(school.name);
      setCity(school.city ?? "");
    },
  );

  if (!data?.school) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const done = await run(async () => {
      await updateMySchool({ name, city: city || undefined });
      return true;
    });
    if (done) setSaved(true);
  }

  return (
    <Card as="form" onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      <CardTitle
        icon={School}
        description="Ces informations s'affichent aux professeurs et aux parents."
      >
        Mon école
      </CardTitle>
      <Field label="École" htmlFor="school-identity-name">
        <Input
          id="school-identity-name"
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
        />
      </Field>
      <Field label="Ville (facultatif)" htmlFor="school-identity-city">
        <Input
          id="school-identity-city"
          type="text"
          maxLength={80}
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setSaved(false);
          }}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
        <Button type="submit" busy={busy}>
          {!busy && <Save className="h-4 w-4" aria-hidden />}
          Enregistrer
        </Button>
        {saved && <Notice tone="success">École mise à jour.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Card>
  );
}
