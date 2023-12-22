import {fileURLToPath} from 'node:url';
import {mergeConfig, defineConfig} from 'vite';
import {configDefaults} from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
      test: {
        css: {
          include: /.+/,
        },
        server: {
          deps: {
            inline: ['vuetify', 'codemirror'],
          },
        },
        deps: {
          optimizer: {
            web: {
              disabled: true,
              transformCss: false,
            },
          },
          web: {
            transformCss: false,
          },
        },
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, 'e2e/*'],
        root: fileURLToPath(new URL('./src/simulator', import.meta.url)),
        transformMode: {
          web: [/\.[jt]sx$/],
        },
      },
    }),
);
