import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3001,
    host: true,
    open: false,
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-state': ['zustand'],
          'vendor-d3': ['d3'],
          'vendor-three': ['three'],
          'vendor-motion': ['framer-motion', 'gsap'],
          'vendor-arrow': ['apache-arrow'],
          'vendor-search': ['flexsearch'],
          'viz': ['@features/feature-detail', '@viz/FeatureSpace3D'],
          'worker': ['@lib/flexsearch-worker'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'zustand', 'd3', 'three', 'framer-motion', 'gsap', 'flexsearch', 'apache-arrow'],
    exclude: ['@lib/flexsearch-worker'],
  },
  define: {
    'import.meta.env.DEV': JSON.stringify(mode !== 'production'),
    'import.meta.env.MOCK': JSON.stringify(mode === 'mock'),
  },
  worker: {
    format: 'es',
    plugins: () => [],
  },
}));