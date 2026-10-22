import { Fragment } from "react";

import { getLegalDoc, type LegalBlock } from "@/lib/legal/docs";
import { LEGAL_UPDATED, PENDING } from "@/lib/legal/entity";

/**
 * UN TEXTE LÉGAL, MIS EN PAGE.
 *
 * Le contenu vit dans `lib/legal/docs.ts`. Ce composant ne fait que le
 * dessiner, et surligner chaque champ de l'éditeur encore à renseigner
 * (`PENDING`), pour qu'on ne le publie pas par oubli.
 */

function Text({ children }: { children: string }) {
  const parts = children.split(PENDING);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 ? (
            <mark className="rounded bg-amber-100 px-1 text-amber-900">
              {PENDING}
            </mark>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return (
      <p className="mt-3 text-base leading-7 text-gray-700">
        <Text>{block}</Text>
      </p>
    );
  }
  return (
    <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-gray-700">
      {block.list.map((item) => (
        <li key={item}>
          <Text>{item}</Text>
        </li>
      ))}
    </ul>
  );
}

export function LegalDocument({ slug }: { slug: string }) {
  const doc = getLegalDoc(slug);
  return (
    <article>
      <h1 className="font-sans text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        {doc.title}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Dernière mise à jour : {LEGAL_UPDATED}
      </p>
      {doc.sections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}
    </article>
  );
}
