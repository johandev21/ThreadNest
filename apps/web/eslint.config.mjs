import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Layering rule: shared cannot import from features or app
    files: ["shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features", "@/app/*", "@/app"],
              message: "Layering violation: shared/ cannot import from features/ or app/.",
            },
          ],
        },
      ],
    },
  },
  {
    // shadcn's generated primitives use setState-in-effect patterns upstream;
    // don't fight vendor code, it gets replaced on component updates.
    files: ["components/ui/**", "hooks/**", "shared/hooks/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
