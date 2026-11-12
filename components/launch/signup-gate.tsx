"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pio } from "@/components/student/pio";
import { registerPath, type SignupRole } from "@/lib/signup";

import { InvitationCodeForm } from "./invitation-code-form";
import { LAUNCH_MESSAGE, LAUNCH_TITLE } from "./launch-copy";

/**
 * LA POP-UP « LANCEMENT PROCHAINEMENT ».
 *
 * Tant que Jotna School n'est pas lancé, un bouton d'inscription n'ouvre pas
 * le formulaire : il ouvre cette pop-up, qui annonce le lancement et laisse
 * passer les personnes qui ont un code d'invitation.
 *
 * UNE SEULE POP-UP PAR PAGE, posée par `SignupGateProvider`, et autant de
 * `SignupLink` qu'il y a de boutons. La barre de navigation en a un dans son
 * menu mobile : une pop-up rendue DANS ce menu disparaîtrait avec lui quand il
 * se referme, d'où le fournisseur au-dessus de tout.
 */
type SignupGate = { open: (role?: SignupRole) => void };

const SignupGateContext = createContext<SignupGate | null>(null);

export function SignupGateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  // Le type de compte du bouton cliqué (« Je suis parent »…), pour que la
  // personne invitée arrive sur le bon formulaire.
  const [role, setRole] = useState<SignupRole | undefined>(undefined);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const gate = useMemo<SignupGate>(
    () => ({
      open: (nextRole) => {
        setRole(nextRole);
        setIsOpen(true);
      },
    }),
    [],
  );

  return (
    <SignupGateContext.Provider value={gate}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* Le focus va au titre, pas au champ : sur un téléphone, viser le
            champ ouvrirait le clavier par-dessus l'annonce, que la plupart des
            visiteurs sont venus lire sans avoir de code. */}
        <DialogContent
          initialFocus={titleRef}
          className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto border-amber-100 p-6 sm:p-8"
        >
          <DialogClose
            aria-label="Fermer"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="size-5" aria-hidden />
          </DialogClose>

          <DialogHeader>
            {/* Pio en affiche légère et sans clip, comme partout sur la
                vitrine : un clin d'œil, pas un poids de plus. Sa taille suit
                la hauteur de l'écran, pour que la pop-up tienne entière sur
                un petit téléphone. */}
            <Pio
              state="hello"
              size="clamp(80px, 13svh, 112px)"
              lite
              animated={false}
              className="drop-shadow-[0_8px_10px_rgba(60,30,0,0.2)]"
            />
            <DialogTitle
              ref={titleRef}
              tabIndex={-1}
              className="font-sans text-xl tracking-tight outline-none sm:text-3xl"
            >
              {LAUNCH_TITLE}
            </DialogTitle>
            <DialogDescription className="leading-7">
              {LAUNCH_MESSAGE}
            </DialogDescription>
          </DialogHeader>

          <InvitationCodeForm
            onAccepted={(code) => {
              setIsOpen(false);
              router.push(registerPath({ code, role }));
            }}
          />

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="font-semibold text-amber-700 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </SignupGateContext.Provider>
  );
}

/**
 * Un bouton d'inscription.
 *
 * C'EST UN LIEN VERS `/register`, QUE LA POP-UP INTERCEPTE. Sous un
 * `SignupGateProvider`, le clic ouvre la pop-up et ne quitte pas la page.
 * Sans lui (une section rendue seule, une page qui ne l'a pas posé) ou avant
 * que la page soit interactive, le lien mène à `/register`, qui affiche la
 * même annonce : il n'existe pas de chemin où ce bouton ouvre le formulaire à
 * qui n'a pas de code.
 *
 * Un clic « nouvel onglet » (Ctrl, Cmd, molette) garde son sens de lien.
 *
 * `signupRole` est le type de compte que le bouton annonce (« Je suis
 * parent ») ; il suit la personne jusqu'au formulaire. Ce n'est pas `role`,
 * qui reste l'attribut ARIA du lien.
 */
export function SignupLink({
  signupRole: role,
  onClick,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { signupRole?: SignupRole }) {
  const gate = useContext(SignupGateContext);

  return (
    <Link
      {...props}
      href={registerPath({ role })}
      aria-haspopup={gate ? "dialog" : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (gate === null || event.defaultPrevented) return;
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        gate.open(role);
      }}
    >
      {children}
    </Link>
  );
}
