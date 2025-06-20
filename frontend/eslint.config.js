import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import prettier from "eslint-config-prettier";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["dist/**", "build/**", "node_modules/**", "coverage/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parser: parser,
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        Blob: "readonly",
        MediaRecorder: "readonly",
        MediaStream: "readonly",
        HTMLAudioElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLCanvasElement: "readonly",
        HTMLSelectElement: "readonly",
        Audio: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        FormData: "readonly",
        GeolocationPositionError: "readonly",
        RecordingState: "readonly",
        NodeJS: "readonly",
        alert: "readonly",
        process: "readonly",
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
        WebSocket: "readonly",
        URLSearchParams: "readonly",
        Event: "readonly",
        CloseEvent: "readonly",
        React: "readonly",
        File: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      react: react,
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-undef": "warn",
      "no-empty": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Configuration for TypeScript declaration files
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },
  // Configuration for config files
  {
    files: ["*.config.js", ".prettierrc.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        module: "writable",
        exports: "writable",
        require: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
  prettier,
];
