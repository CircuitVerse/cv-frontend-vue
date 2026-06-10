/**
 * Rollup config for building the synthesis Web Worker as a standalone bundle.
 * This separate Rollup build bypasses
 * Vite entirely — Rollup handles BigInt with no issues.
 * Output: public/assets/synthesisWorker.js
 */
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// Strip shebang from yosys2digitaljs CLI entry (starts with #!/usr/bin/env node)
function stripShebang() {
    return {
        name: 'strip-shebang',
        transform(code, id) {
            if (id.includes('yosys2digitaljs') && code.startsWith('#!')) {
                return { code: code.replace(/^#!.*/, ''), map: null };
            }
            return null;
        }
    };
}

export default {
    input: 'v1/src/simulator/src/synthesis/synthesisWorker.js',
    output: {
        file: 'public/assets/synthesisWorker.js',
        format: 'es',
    },
    plugins: [
        stripShebang(),
        nodeResolve({
            browser: true,
            preferBuiltins: false,
        }),
        commonjs(),
    ],
};
