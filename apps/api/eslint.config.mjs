import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["test/**/*.mjs"],
    languageOptions: {
      globals: {
        AbortSignal: "readonly",
        Response: "readonly",
        process: "readonly",
        URL: "readonly",
        fetch: "readonly",
      },
    },
  },
);
