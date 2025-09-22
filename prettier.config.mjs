/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindStylesheet: './src/globals.css',
    tailwindFunctions: ['cn', 'cva', 'clsx', 'classname'],
    trailingComma: 'es5',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
};

export default config;
