import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { ForWhom } from "@/components/landing/for-whom";
import { FullDemo } from "@/components/landing/full-demo";
import { Gamification } from "@/components/landing/gamification";
import { GetStarted } from "@/components/landing/get-started";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MeetPio } from "@/components/landing/meet-pio";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { QuickPlay } from "@/components/landing/quick-play";
import { ScrollToTop } from "@/components/landing/scroll-to-top";
import { Subjects } from "@/components/landing/subjects";
import { NativeAppGate } from "@/components/native-app-gate";
import { SignupGateProvider } from "@/components/launch/signup-gate";

export default function StorefrontPage() {
  return (
    // Sur iOS et Android, ce composant renvoie vers /login : l'application
    // n'affiche pas la vitrine marchande. Sur le web il est transparent.
    <NativeAppGate>
      {/* AVANT LE LANCEMENT : les boutons d'inscription de la vitrine ouvrent
          la pop-up « Lancement prochainement » posée par ce fournisseur, au
          lieu du formulaire (`components/launch/signup-gate.tsx`). */}
      <SignupGateProvider>
      {/* `overflow-x-clip` et non `-hidden` : `hidden` fait de ce conteneur un
          conteneur de défilement, et le `sticky` de la barre de navigation
          s'y accroche au lieu de suivre la fenêtre. */}
      <div className="flex min-h-screen flex-1 flex-col bg-[#fff8e7] text-[#2b1d0e] overflow-x-clip">
      <Navbar />
      {/* LA PAGE SE PASSE DANS LE MONDE DU JEU (refonte du 24 novembre 2026) :
          le camp de Pio en haut, un mini-jeu juste dessous, la carte des
          mondes, puis les adultes, les étapes et les récompenses, et le camp
          de nuit pour finir.

          Les sections ne sont plus enveloppées d'un fondu d'apparition : après
          un saut depuis le menu, la section visée restait vide une seconde. */}
      <main className="flex-1">
        <Hero />
        <QuickPlay />
        <FullDemo />
        <Subjects />
        <MeetPio />
        <ForWhom />
        <HowItWorks />
        <Gamification />
        <Pricing />
        <FAQ />
        {/* La liste d'attente (`components/landing/waitlist.tsx`) est mise de
            côté, pas supprimée. */}
        <GetStarted />
      </main>
        <Footer />
        <ScrollToTop />
      </div>
      </SignupGateProvider>
    </NativeAppGate>
  );
}
