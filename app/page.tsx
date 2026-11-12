import { ExerciseTypes } from "@/components/landing/exercise-types";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { ForWhom } from "@/components/landing/for-whom";
import { Gamification } from "@/components/landing/gamification";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MeetPio } from "@/components/landing/meet-pio";
import { Subjects } from "@/components/landing/subjects";
import { Navbar } from "@/components/landing/navbar";
import { ScrollToTop } from "@/components/landing/scroll-to-top";
import { GetStarted } from "@/components/landing/get-started";
import { FadeIn, ScaleIn } from "@/components/ui/motion-wrapper";
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
      <div className="flex min-h-screen flex-1 flex-col bg-white text-gray-900 overflow-x-clip">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FadeIn direction="up" delay={0.1}>
          <HowItWorks />
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <MeetPio />
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <ExerciseTypes />
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <Subjects />
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <ForWhom />
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <Gamification />
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <FAQ />
        </FadeIn>
        {/* La liste d'attente (`components/landing/waitlist.tsx`) est mise de
            côté, pas supprimée. */}
        <ScaleIn delay={0.1}>
          <GetStarted />
        </ScaleIn>
      </main>
        <Footer />
        <ScrollToTop />
      </div>
      </SignupGateProvider>
    </NativeAppGate>
  );
}
