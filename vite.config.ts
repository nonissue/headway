import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        tailwindcss(),
        sentryVitePlugin({
            org: 'andy-williams',
            project: 'next-departures',
        }),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: { enabled: true },
            manifest: {
                name: 'NextTrain',
                short_name: 'NextTrain',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#0a0a0a',
                theme_color: '#0a0a0a',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            includeAssets: ['icons/apple-touch-icon-180.png'],
            workbox: { navigateFallback: '/offline.html' },
        }),
    ],
    server: {
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        // this is where your static files will go
        outDir: 'dist/client',

        emptyOutDir: true,
        sourcemap: true,
    },
});
