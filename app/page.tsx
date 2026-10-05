import { ExerciseTypes } from "@/components/landing/exercise-types";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { ForWhom } from "@/components/landing/for-whom";
import { Gamification } from "@/components/landing/gamification";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { ScrollToTop } from "@/components/landing/scroll-to-top";
import { Waitlist } from "@/components/landing/waitlist";
import { FadeIn, ScaleIn } from "@/components/ui/motion-wrapper";
import { NativeAppGate } from "@/components/native-app-gate";

export default function StorefrontPage() {
  return (
    // Sur iOS et Android, ce composant renvoie vers /login : l'application
    // n'affiche pas la vitrine marchande. Sur le web il est transparent.
    <NativeAppGate>
      <div className="flex min-h-screen flex-1 flex-col bg-white text-gray-900 overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FadeIn direction="up" delay={0.1}>
          <HowItWorks />
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <ExerciseTypes />
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
        <ScaleIn delay={0.1}>
          <Waitlist />
        </ScaleIn>
      </main>
        <Footer />
        <ScrollToTop />
      </div>
    </NativeAppGate>
  );
}
