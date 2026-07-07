/// <reference types="vitest" />
import { configDefaults, coverageConfigDefaults, defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        exclude: [...configDefaults.exclude, '**/.claude/**'],
        coverage: {
            enabled: true,
            exclude: [
                ...coverageConfigDefaults.exclude,
                'src/components/ui/command.tsx',
                'src/components/ui/dialog.tsx',
                'src/components/ui/popover.tsx',
                'src/components/ui/scroll-area.tsx',
            ],
        },
        open: true,
        ui: true,
    },
});
