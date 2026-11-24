/**
 * DÉMARRER EN TROIS ÉTAPES, sur une piste : une étape, une phrase. Les deux
 * premières s'adressent aux adultes (vouvoiement), la troisième à l'enfant
 * (tutoiement). Le détail par rôle est dans les questions fréquentes (`faq.tsx`)
 * et sous les boutons de la dernière section (`get-started.tsx`).
 */
const STEPS = [
  {
    who: "École, professeur ou parent",
    title: "Créez votre compte",
    text: "Un seul compte parent suffit pour plusieurs enfants. Une école partage son code école avec ses professeurs.",
  },
  {
    who: "Professeur ou parent",
    title: "Créez le compte de l'enfant",
    text: "Indiquez son nom et sa classe : il reçoit son code de connexion.",
  },
  {
    who: "Enfant",
    title: "Connecte-toi et apprends",
    text: "Saisis ton code sur le site et fais les exercices de ta classe. Pio t'attend.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">Comment ça marche</p>
        <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-[1.1] text-[#2b1d0e] sm:text-[42px]">
          Démarrer en 3 étapes.
        </h2>
      </div>

      <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
        <span
          aria-hidden
          className="absolute left-[10%] right-[10%] top-[30px] hidden border-t-[5px] border-dashed border-savanna-sand md:block"
        />
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative flex flex-col items-center text-center">
            <span className="flex size-[60px] items-center justify-center rounded-full bg-[#8a4b1f] font-display text-2xl font-bold text-[#fff8e7] shadow-[0_5px_0_#5e3112]">
              {i + 1}
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.06em] text-[#a5602c]">Pour : {step.who}</p>
            <h3 className="mt-1.5 font-display text-xl font-bold text-[#2b1d0e]">{step.title}</h3>
            <p className="mt-2 max-w-[32ch] text-[15px] leading-6 text-[#6b563f]">{step.text}</p>
          </li>
        ))}
      </ol>

      <p className="mx-auto mt-10 max-w-2xl text-center text-[15px] leading-6 text-[#6b563f]">
        Tout se fait sur le site, depuis un ordinateur, une tablette ou un téléphone. Application iOS et
        Android : à venir.
      </p>
    </section>
  );
}
