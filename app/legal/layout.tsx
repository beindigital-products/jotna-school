import { Brand } from "@/components/landing/brand";
import { Footer } from "@/components/landing/footer";

/**
 * LA COQUE DES PAGES LÉGALES — le logo en haut, le pied de page en bas.
 *
 * Pas de barre de navigation de la vitrine : ses liens sont des ancres
 * (`#comment`, `#faq`) qui ne mènent nulle part hors de l'accueil. Le logo
 * ramène à `/`, ce qui suffit pour sortir de la page.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <header className="border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-3xl items-center px-5 py-4 sm:px-8">
          <Brand size="sm" priority />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
