// https://github.com/francoismassart/eslint-plugin-tailwindcss/issues/280#issuecomment-2029302834

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

// `eslint-plugin-tailwindcss` is not updated for tailwind v4 it seems
// it relies on a tailwindcss lib (resolveConfig) which has been depreciated
// so it cannot resolve config file. however, it seems to still work?
import tailwindPlugin from 'eslint-plugin-tailwindcss';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import ts from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//     baseDirectory: __dirname,
//     resolvePluginsRelativeTo: __dirname,
// });

export default defineConfig([
    { files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'] },
    {
        ignores: [
            'dist/',
            'src/generated/**/*',
            'public/',
            'node_modules/',
            'db/',
            'data/',
            'coverage/',
        ],
    },
    {
        name: 'ts-eslint',
        plugins: { 'typescript-eslint': ts },
        extends: [ts.configs.recommended],
    },
    {
        name: 'react-hooks',
        plugins: { 'react-hooks': reactHooksPlugin },
        rules: reactHooksPlugin.configs.recommended.rules,
    },
    {
        name: 'react',

        plugins: { reactPlugin },
        extends: [reactPlugin.configs.flat.recommended],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
            'import/resolver': {
                typescript: true,
                alias: true,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
        },
    },
    {
        name: 'tailwindcss',
        plugins: { tailwindcss: tailwindPlugin },

        settings: {
            tailwindcss: {
                config: `${__dirname}/src/globals.css`,
                callees: ['cva', 'cn', 'classnames'],
                cssFiles: [
                    '**/*.css',
                    '!**/node_modules',
                    '!**/.*',
                    '!**/dist',
                    '!**/build',
                ],
            },
            rules: {
                'tailwindcss/classnames-order': 'warn',
                'tailwindcss/enforces-shorthand': 'warn',
                'tailwindcss/no-arbitrary-value': 'off',
                'tailwindcss/no-contradicting-classname': 'warn',
                'tailwindcss/no-custom-classname': 'error',
                'tailwindcss/no-unnecessary-arbitrary-value': 'warn',
            },
        },
    },
]);

// const eslintConfig = [
//     // ...compat.extends([
//     //     "eslint:recommended",
//     // "@typescript-eslint/recommended",
//     // "plugin:react/recommended",
//     //     "plugin:react-hooks/recommended",
//     // ]),
//     // ...compat.plugins("@typescript-eslint"),

//     ...compat.plugins('@typescript-eslint'),
//     ...tselint.configs['recommended'],
//     ...compat.plugins('react'),
//     // ...react.configs.flat.recommended,
//     // ...react.configs.flat["jsx-runtime"],
//     ...compat.plugins('react-hooks'),
//     ...compat.plugins('tailwindcss'),
//     ...compat.extends('plugin:react-hooks/recommended'),

//     {
//         ...react.configs.flat.recommended,
//         name: 'react',
//         settings: {
//             react: {
//                 version: 'detect',
//             },
//         },
//         rules: {
//             'react/prop-types': 'off',
//             'react/react-in-jsx-scope': 'off',
//             // 'ts/consistent-type-definitions': ['error', 'type'],
//             'react/prefer-destructuring-assignment': 'off', // Vscode doesn't support automatically destructuring, it's a pain to add a new variable
//         },
//     },
//     {
//         name: 'tailwind',
//         settings: {
//             eslintPluginTailwindCSS: {
//                 config: `${__dirname}/src/globals.css`,
//                 callees: ['cva', 'cn', 'classnames'],
//                 cssFiles: [
//                     '**/*.css',
//                     '!**/node_modules',
//                     '!**/.*',
//                     '!**/dist',
//                     '!**/build',
//                 ],
//             },
//             tailwindcss: {
//                 config: `${__dirname}/src/globals.css`,
//                 callees: ['cva', 'cn', 'classnames'],
//                 cssFiles: [
//                     '**/*.css',
//                     '!**/node_modules',
//                     '!**/.*',
//                     '!**/dist',
//                     '!**/build',
//                 ],
//             },
//         },
//         rules: {
//             'tailwindcss/enforces-shorthand': 'warn',
//             'tailwindcss/no-arbitrary-value': 'off',
//             'tailwindcss/no-custom-classname': 'warn',
//             'tailwindcss/no-contradicting-classname': 'error',
//             'tailwindcss/no-unnecessary-arbitrary-value': 'warn',
//             'tailwindcss/classnames-order': 'warn',
//         },
//     },
//     {
//         files: ['src/**/*.{ts,tsx}'],
//     },
//     {
//         ignores: ['dist/', 'src/generated/**/*', 'public/', 'node_modules/'],
//     },
// ];

// export default eslintConfig;
