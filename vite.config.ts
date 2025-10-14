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

        VitePWA({
            registerType: 'autoUpdate',
            disable: process.env.NODE_ENV === 'development',
            devOptions: {
                enabled: true,
                type: 'module',
            },
            pwaAssets: {
                image: 'public/favicon.svg',
                overrideManifestIcons: true,
            },
            manifest: {
                name: 'Headway',
                short_name: 'Headway',
                description:
                    'Quickly access nearby LRT departure times in Edmonton',
                id: '/',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#242424',
                theme_color: '#242424',
                orientation: 'portrait',
            },
            includeAssets: ['favicon.svg'],
            workbox: {
                navigateFallback: '/offline.html',
                skipWaiting: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        urlPattern: /^\/api\/.*/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 10,
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
        }),
        sentryVitePlugin({
            org: 'andy-williams',
            project: 'next-departures',
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
