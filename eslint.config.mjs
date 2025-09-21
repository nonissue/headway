// https://github.com/francoismassart/eslint-plugin-tailwindcss/issues/280#issuecomment-2029302834

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// `eslint-plugin-tailwindcss` is not updated for tailwind v4 it seems
// it relies on a tailwindcss lib (resolveConfig) which has been depreciated
// so it cannot resolve config file. however, it seems to still work?
import tailwind from "eslint-plugin-tailwindcss";
import tselint from "typescript-eslint";
import react from "eslint-plugin-react";
// import eslintPluginTailwindCSS from 'eslint-plugin-tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    resolvePluginsRelativeTo: __dirname,
});

const eslintConfig = [
    // ...compat.extends([
    //     "eslint:recommended",
    // "@typescript-eslint/recommended",
    // "plugin:react/recommended",
    //     "plugin:react-hooks/recommended",
    // ]),
    // ...compat.plugins("@typescript-eslint"),
    // ...tselint.configs("flat/recommended"),
    ...compat.plugins("@typescript-eslint"),
    ...tselint.configs["recommended"],
    ...compat.plugins("react"),
    // ...react.configs.flat.recommended,
    // ...react.configs.flat["jsx-runtime"],
    ...compat.plugins("react-hooks"),
    ...compat.plugins("tailwindcss"),
    ...tailwind.configs["flat/recommended"],
    {
        ...react.configs.flat.recommended,
    },
    {
        settings: {
            // ...react.configs.flat.recommended,

            react: {
                version: "detect",
            },
            eslintPluginTailwindCSS: {
                config: `${__dirname}/src/globals.css`,
                callees: ["cva", "cn", "classnames"],
                cssFiles: [
                    "**/*.css",
                    "!**/node_modules",
                    "!**/.*",
                    "!**/dist",
                    "!**/build",
                ],
            },
            tailwindcss: {
                config: `${__dirname}/src/globals.css`,
                callees: ["cva", "cn", "classnames"],
                cssFiles: [
                    "**/*.css",
                    "!**/node_modules",
                    "!**/.*",
                    "!**/dist",
                    "!**/build",
                ],
            },
        },
        rules: {
            'tailwindcss/enforces-shorthand': 'warn',
            'tailwindcss/no-arbitrary-value': 'off',
            'tailwindcss/no-custom-classname': 'warn',
            'tailwindcss/no-contradicting-classname': 'error',
            'tailwindcss/no-unnecessary-arbitrary-value': 'warn',
            "tailwindcss/classnames-order": "warn",
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",
            // 'ts/consistent-type-definitions': ['error', 'type'], 
            'react/prefer-destructuring-assignment': 'off', // Vscode doesn't support automatically destructuring, it's a pain to add a new variable
   
        },
    },
    {
        files: ["src/**/*.{ts,tsx}"],
    },
    {
        ignores: ["dist/", "src/generated/**/*", "public/", "node_modules/"],
    },
];

export default eslintConfig;
