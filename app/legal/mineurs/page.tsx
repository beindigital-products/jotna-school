import { LegalDocument } from "@/components/legal/legal-document";
import { legalMetadata } from "@/lib/legal/docs";

export const metadata = legalMetadata("mineurs");

export default function Page() {
  return <LegalDocument slug="mineurs" />;
}
