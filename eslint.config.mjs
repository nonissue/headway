import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// https://github.com/antfu/eslint-config#customization
import antfu from "@antfu/eslint-config";

// workaround for flat config not being supported yet by eslint-plugin-tailwindcss
// https://github.com/francoismassart/eslint-plugin-tailwindcss/issues/280
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const compat = new FlatCompat();

export default antfu(
    {
        // Customize the stylistic rules
        stylistic: {
            quotes: "double", // or 'double'
            semi: true,
        },
        rules: {
            // Changing the default, we don't like this because when you rename ie. a field then things break
            "object-shorthand": ["warn", "never"],

            // We like our curly braces. Always.
            "curly": ["warn", "all"],

            // Keep line length below 120 characters
            "max-len": ["error", { code: 120 }],

            // Experimenting too much for now.
            // TODO evaluate if we need to enable this again
            "no-console": "warn",
        },
        formatters: {
            graphql: "prettier",
            css: "prettier",
            markdown: "prettier",
            html: "prettier",
            prettierOptions: {
            },
        },
    },
    {
        files: ["*.json"],
        rules: {
            "max-len": "off",
        },
    },
    ...compat.config({
        // https://github.com/francoismassart/eslint-plugin-tailwindcss
        extends: ["plugin:tailwindcss/recommended"],
        settings: {
            tailwindcss: {
                config: `${__dirname}/src/globals.css`
            }, 
            callees: ['cva', 'cn', 'classnames', 'clsx'],
            cssFiles: [
                'src/globals.css',
                'src/**/*.css',
                '!**/node_modules',
                '!**/.*',
                '!**/dist',
                '!**/build',
            ],
        },
        rules: {
            'tailwindcss/classnames-order': 'warn',
            'tailwindcss/no-unnecessary-arbitrary-value': 'warn',
            'tailwindcss/enforces-shorthand': 'warn',
            'tailwindcss/no-contradicting-classname': 'warn',
            'tailwindcss/no-custom-classname': 'warn',
            // Allow arbitrary values in Tailwind v4
            'tailwindcss/no-arbitrary-value': 'off',
        },
    }),
    {
        ignores: ["**/generated.*", "**/locales/generated/**"],
    },
);
