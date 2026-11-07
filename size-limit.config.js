import { defineConfig } from 'size-limit';
import { presetSmallLib } from '@size-limit/preset-small-lib';
import { presetBigLib } from '@size-limit/preset-big-lib';

export default defineConfig([
  {
    name: 'Main bundle',
    pattern: 'dist/assets/index-*.js',
    limit: '150 kB',
    gzip: true,
    preset: presetSmallLib,
  },
  {
    name: 'Viz bundle',
    pattern: 'dist/assets/viz-*.js',
    limit: '120 kB',
    gzip: true,
    preset: presetBigLib,
  },
  {
    name: 'Worker bundle',
    pattern: 'dist/assets/worker-*.js',
    limit: '50 kB',
    gzip: true,
    preset: presetSmallLib,
  },
]);