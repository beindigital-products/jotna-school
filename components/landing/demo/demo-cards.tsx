"use client";

import { useEffect, useMemo, useState } from "react";

import { loadBank, peekBank } from "./bank";
import { CardFrame, CardGroup, CardShells, LoadFailure } from "./card-frame";
import { classicTypesFor, gamesFor, type GameOffer } from "./demo-matrix";
import DemoPlayer from "./demo-player";
import type { ClassicItem, DemoClass, DemoSubject, SubjectBank } from "./demo-types";
import { makeGame } from "./make-game";
import { toPlayable } from "./playable";

/**
 * LES CARTES JOUABLES d'une matière et d'une classe — le lot que la vitrine
 * charge à la demande, quand le visiteur approche de la section.
 *
 * Il tire avec lui les écrans de l'élève, la règle de correction, les
 * générateurs de jeux, tout ce qu'une page d'accueil ne doit pas télécharger
 * avant qu'on le regarde ; la banque de la matière, elle, arrive à part
 * (`bank/index.ts`). Pendant le chargement, les cartes montrent déjà ce que la
 * classe propose (`CardShells`).
 */

function ClassicCard({ item, subject, klass }: { item: ClassicItem; subject: DemoSubject; klass: DemoClass }) {
  const exercise = useMemo(() => toPlayable(item, subject, klass), [item, subject, klass]);
  return (
    <CardFrame kind={item.type} topic={item.topic} stage={item.stage}>
      <DemoPlayer exercise={exercise} />
    </CardFrame>
  );
}

function GameCard({ offer, subject, klass }: { offer: GameOffer; subject: DemoSubject; klass: DemoClass }) {
  // « Un autre exemple » : une autre graine, la variante suivante, un cran plus dur.
  const [round, setRound] = useState(0);
  const exercise = useMemo(() => makeGame(subject, klass, offer, round), [subject, klass, offer, round]);
  return (
    <CardFrame kind={offer.type} description={exercise.gameLabel} topic={exercise.topic} stage={exercise.stage}>
      <DemoPlayer key={exercise.id} exercise={exercise} onAnother={() => setRound((current) => current + 1)} />
    </CardFrame>
  );
}

function LoadedCards({ bank, subject, klass }: { bank: SubjectBank; subject: DemoSubject; klass: DemoClass }) {
  const items = bank[klass];
  const classic = classicTypesFor(subject, klass).flatMap((type) => {
    const item = items.find((candidate) => candidate.type === type);
    return item ? [item] : [];
  });
  const games = gamesFor(subject, klass);

  return (
    <>
      <CardGroup label={games.length > 0 ? "Les exercices" : undefined}>
        {classic.map((item) => (
          <ClassicCard key={`${subject}-${klass}-${item.type}`} item={item} subject={subject} klass={klass} />
        ))}
      </CardGroup>
      {games.length > 0 && (
        <CardGroup label="Les jeux" sparkles>
          {games.map((offer) => (
            <GameCard key={`${subject}-${klass}-${offer.type}`} offer={offer} subject={subject} klass={klass} />
          ))}
        </CardGroup>
      )}
    </>
  );
}

/**
 * La banque de la matière : tout de suite si elle est déjà arrivée, sinon à
 * l'arrivée du fichier. Un échec se retente (`retry`) au lieu de casser la page.
 */
function useBank(subject: DemoSubject) {
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<{ subject: DemoSubject; attempt: number; bank: SubjectBank | null } | null>(
    null,
  );
  const cached = peekBank(subject);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    loadBank(subject).then(
      (bank) => {
        if (!cancelled) setOutcome({ subject, attempt, bank });
      },
      () => {
        if (!cancelled) setOutcome({ subject, attempt, bank: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [subject, attempt, cached]);

  const mine = outcome && outcome.subject === subject && outcome.attempt === attempt ? outcome : null;
  return {
    bank: cached ?? mine?.bank ?? null,
    failed: !cached && mine !== null && mine.bank === null,
    retry: () => setAttempt((current) => current + 1),
  };
}

export default function DemoCards({ subject, klass }: { subject: DemoSubject; klass: DemoClass }) {
  const { bank, failed, retry } = useBank(subject);
  if (failed) return <LoadFailure onRetry={retry} />;
  // En attendant la banque, les cartes montrent déjà ce que la classe propose.
  if (!bank) return <CardShells subject={subject} klass={klass} />;
  return <LoadedCards bank={bank} subject={subject} klass={klass} />;
}
