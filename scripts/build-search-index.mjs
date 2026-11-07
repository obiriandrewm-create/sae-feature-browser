// Build script for FlexSearch worker
// Bundles FlexSearch indexer for Web Worker

import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const outputDir = join(__dirname, '..', 'public', 'workers');
  mkdirSync(outputDir, { recursive: true });
  
  await build({
    entryPoints: [join(__dirname, '..', 'src', 'lib', 'flexsearch-worker.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
    outfile: join(outputDir, 'flexsearch-worker.js'),
    external: ['flexsearch'],
    banner: {
      js: 'import { FlexSearch } from "flexsearch";',
    },
  });
  
  console.log('FlexSearch worker built successfully!');
}

main().catch((e) => {
  console.error('Build failed:', e);
  process.exit(1);
});