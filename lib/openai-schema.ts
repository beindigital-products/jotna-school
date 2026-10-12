/**
 * JSON Schema for OpenAI Structured Outputs.
 *
 * Used by the PDF extraction action to get a well-typed array of exercises
 * from GPT-4 analysis of uploaded PDF content.
 */

export const exerciseExtractionSchema = {
  name: "exercise_extraction",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      suggestedTopic: {
        type: "string" as const,
        description:
          "Nom court du thème global identifié dans le document (ex: 'Les fractions', 'La conjugaison au présent', 'Les adjectifs'). Utilisé si aucun thème n'existe encore dans la matière.",
      },
      exercises: {
        type: "array" as const,
        description:
          "Liste des exercices extraits du document PDF, adaptés au niveau CE2-CM2.",
        items: {
          type: "object" as const,
          properties: {
            type: {
              type: "string" as const,
              enum: ["qcm", "drag-drop", "match", "order", "short-answer"],
              description: "Le type d'exercice.",
            },
            prompt: {
              type: "string" as const,
              description:
                "L'énoncé de l'exercice, clair et adapté au niveau CE2-CM2.",
            },
            payload: {
              type: "string" as const,
              description:
                "Les données spécifiques au type d'exercice, sous forme d'une chaîne JSON sérialisée. Formats attendus selon le type: qcm → {\"options\":[string],\"correctIndex\":number,\"explanation\"?:string}. match → {\"pairs\":[{\"left\":string,\"right\":string}],\"accepted\"?:[{\"left\":string,\"right\":string}]} (accepted : les autres paires tout aussi justes, quand une proposition va à deux éléments). order → {\"correctSequence\":[string]}. drag-drop → {\"zones\":[string],\"items\":[{\"text\":string,\"correctZone\":string}]}. short-answer → {\"acceptedAnswers\":[string],\"tolerance\"?:string}.",
            },
            answerKey: {
              type: "string" as const,
              description:
                "La réponse correcte sous forme de texte lisible, pour référence rapide.",
            },
            hints: {
              type: "array" as const,
              description:
                "Trois indices progressifs, du plus vague au plus précis, pour aider l'élève.",
              items: {
                type: "string" as const,
              },
            },
          },
          required: ["type", "prompt", "payload", "answerKey", "hints"],
          additionalProperties: false,
        },
      },
    },
    required: ["suggestedTopic", "exercises"],
    additionalProperties: false,
  },
} as const;

/** Type for a single extracted exercise from OpenAI (raw, with payload as JSON string) */
export interface ExtractedExercise {
  type: "qcm" | "drag-drop" | "match" | "order" | "short-answer";
  prompt: string;
  payload: string; // JSON-serialized payload, parsed by the action before DB insert
  answerKey: string;
  hints: string[];
}

/** Type for the full extraction response */
export interface ExtractionResponse {
  suggestedTopic: string;
  exercises: ExtractedExercise[];
}
