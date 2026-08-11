import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // These React Compiler-oriented rules are not part of this React 18
      // project's runtime contract. Keep the established Hooks checks while
      // avoiding a false migration requirement during the Next.js upgrade.
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off"
    }
  },
  globalIgnores([".next/**", ".netlify/**", "node_modules/**", "next-env.d.ts"])
]);
