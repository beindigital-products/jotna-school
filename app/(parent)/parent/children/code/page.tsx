"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  Avatar,
  Button,
  Card,
  Field,
  Notice,
  PageHeader,
  Input,
  useAsyncAction,
} from "@/components/dashboard/ui";

/**
 * Le parent saisit le code imprimé sur le billet remis par l'école.
 *
 * DEUX TEMPS, ET LE PREMIER N'ÉCRIT RIEN. On montre d'abord le prénom de
 * l'enfant que le code désigne, et on attend une confirmation. C'est ce qui
 * rattrape la faute de frappe qui tomberait par malchance sur un code valide
 * d'un autre élève — et rien dans le dépôt ne défait un `studentGuardians`,
 * donc le rattachement est difficilement réversible.
 */
export default function ChildCodePage() {
  const router = useRouter();
  const redeem = useMutation(api.parentLink.redeemCode);

  const [code, setCode] = useState("");
  const [checked, setChecked] = useState("");
  const { busy, error, run, clearError } = useAsyncAction(
    "Ce code n'a pas pu être utilisé.",
  );

  const preview = useQuery(
    api.parentLink.previewCode,
    checked ? { code: checked } : "skip",
  );

  async function handleConfirm() {
    const done = await run(async () => {
      await redeem({ code: checked });
      return true;
    });
    if (done) router.push("/parent/children");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        back={{ href: "/parent/children", label: "Mes enfants" }}
        title="Code du billet de l'école"
        description="L'école vous a remis un billet portant un code. Saisissez-le pour retrouver votre enfant dans votre espace."
      />

      <Card
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          clearError();
          setChecked(code.trim());
        }}
        className="space-y-4 p-5 sm:p-6"
      >
        <Field
          label="Code du billet"
          htmlFor="parent-code"
          hint="Le code ne contient ni O, ni I, ni zéro : seulement des caractères qui ne se confondent pas."
        >
          <Input
            id="parent-code"
            required
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              // Un code modifié n'est plus celui qu'on a vérifié.
              setChecked("");
            }}
            placeholder="PIO-7C4K2M"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-lg uppercase tracking-wider sm:text-lg"
          />
        </Field>
        <Button type="submit" className="w-full">
          Vérifier le code
        </Button>
      </Card>

      <div aria-live="polite" className="space-y-4">
        {checked && preview === undefined && (
          <p className="text-sm text-stone-600">Vérification…</p>
        )}

        {checked && preview === null && (
          <Notice tone="error">
            Ce code n&apos;existe pas. Vérifiez chaque caractère du billet, ou
            demandez-en un nouveau à l&apos;école.
          </Notice>
        )}

        {preview?.status === "expired" && (
          <Notice tone="warning">
            Ce code a expiré. L&apos;école peut en imprimer un nouveau.
          </Notice>
        )}

        {preview?.status === "redeemed" && (
          <Notice tone="warning">
            Ce code a déjà été utilisé. Si c&apos;est un autre adulte de la
            famille, demandez un second billet à l&apos;école.
          </Notice>
        )}

        {preview?.status === "ready" && (
          <Card className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Avatar name={preview.name} />
              <div className="min-w-0">
                <p className="text-sm text-stone-600">Ce code désigne</p>
                <p className="break-words text-lg font-semibold text-stone-900">
                  {preview.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-700">
              Confirmez seulement s&apos;il s&apos;agit bien de votre enfant :
              ce rattachement vous donne accès à sa progression.
            </p>
            <Button onClick={handleConfirm} busy={busy} className="w-full">
              {!busy && <CheckCircle className="h-4 w-4" aria-hidden />}
              Oui, c&apos;est mon enfant
            </Button>
          </Card>
        )}

        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </div>
  );
}
