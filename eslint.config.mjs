import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Convention déjà suivie dans le code : un nom préfixé par `_` est
      // inutilisé exprès, et `const { id, ...rest } = args` sert à retirer `id`.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Projets natifs Capacitor : aucun JS n'y est versionné. Ce qu'eslint y
    // trouvait, ce sont les copies de `out/` posées par `cap sync` (dans
    // `android/app/src/main/assets/public`, `ios/App/App/public`) et par
    // Gradle (`android/app/build`) : 18 000 avertissements sur du code minifié.
    "android/**",
    "ios/**",
    // Code engendré par `npx convex dev`, réécrit à chaque génération.
    "convex/_generated/**",
    // Projet vidéo Remotion autonome, avec ses propres dépendances.
    "motion/**",
  ]),
]);

export default eslintConfig;
