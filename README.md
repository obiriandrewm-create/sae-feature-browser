# SAE Feature Browser

Interactive feature exploration interface for Sparse Autoencoder (SAE) interpretability research. Handles millions of features with search, visualization, focus+context navigation, and organic micro-interactions.

## Features

- **Feature Search** — Sub-100ms full-text search across 1M+ features (FlexSearch + Web Worker)
- **Feature List** — Virtualized, sortable, filterable with bookmarks
- **Feature Detail** — Activation histograms, token highlights, metadata
- **Comparison View** — Side-by-side, overlay, diff modes
- **Focus+Context** — Fisheye distortion for focus+context navigation
- **Organic Motion** — Subtle jitter effects (respects `prefers-reduced-motion`)
- **Workspace** — Bookmarks, annotations, session persistence, export

## Tech Stack

- **Framework:** React 18 + TypeScript 5 + Vite 5
- **Search:** FlexSearch (Web Worker) + Apache Arrow
- **Visualization:** D3.js v7, Three.js r160, Canvas API
- **Animation:** Framer Motion 11 + GSAP 3
- **State:** TanStack Query v5 + Zustand + IndexedDB
- **Testing:** Vitest 2 + Playwright 1.45 + axe-core
- **Quality:** Biome, TypeScript strict, size-limit, Lighthouse CI

## Getting Started

```bash
# Install dependencies
npm install

# Generate mock SAE data
npm run data:generate

# Build search index
npm run data:index

# Start development server
npm run dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build

# Preview production build
npm run preview
```

## Quality Gates

```bash
# Fast checks (run on every edit)
npm run check:fast

# Task completion checks
npm run check:task

# Security scan
npm run check:security

# Accessibility audit (requires preview URL)
PREVIEW_URL=https://your-preview-url npm run check:a11y

# Performance audit (requires preview URL)
PREVIEW_URL=https://your-preview-url npm run check:perf

# Full CI pipeline
npm run check:full
```

## Project Structure

```
src/
├── app/                 # App root, routing, providers
├── components/
│   ├── ui/              # Design system primitives
│   ├── layout/          # Bento grid, focus+context layout
│   ├── charts/          # D3: Histogram, TokenHighlighter
│   ├── viz/             # Three.js: FeatureSpace3D
│   ├── canvas/          # Canvas: Fisheye, Jitter
│   ├── browser/         # FeatureBrowser, FeatureCard, ComparisonView
│   └── common/          # Shared components
├── features/
│   ├── feature-search/
│   ├── feature-list/
│   ├── feature-detail/
│   ├── comparison/
│   ├── focus-context/
│   └── workspace/
├── hooks/               # Custom hooks (search, fisheye, jitter, Three.js)
├── lib/                 # Utilities, API, Arrow, FlexSearch worker
├── styles/              # CSS variables, tokens, themes
└── types/               # TypeScript types
```

## Data Format

Expects Apache Arrow/Parquet files with columns:
- `feature_id` (string)
- `layer` (int32)
- `feature_index` (int32)
- `max_activation` (float64)
- `activation_histogram` (list<float64>)
- `top_tokens` (list<string>)
- `token_activations` (list<float64>)
- `semantic_label` (string, nullable)
- `description` (string, nullable)

Mock generator: `npm run data:generate` (configurable via `FEATURE_COUNT` env)

## Focus+Context (Fisheye)

The fisheye distortion implements polar coordinate mapping:
- Focus point follows cursor/selection
- Smooth transition zone (configurable radius)
- Preserves angles (conformal) for readability
- GPU-accelerated via Canvas/WebGL

## Organic Jitter

Subtle stochastic motion using Perlin/Simplex noise:
- Position: 1-3px
- Rotation: 0.5-2°
- Scale: 0.5-2%
- Respects `prefers-reduced-motion`
- Seeded for reproducibility

## Deployment

- **Preview:** Auto-deployed on PR via GitHub Actions
- **Production:** Auto-deployed on merge to main
- **Lighthouse CI:** Performance budgets enforced on preview

## Constraints

See `CONSTRAINTS.md` for enforced quality standards:
- Zero TypeScript errors
- Zero Biome lint errors
- Zero critical/serious accessibility violations
- Changed-lines coverage ≥ 80%
- Bundle size limits (main ≤ 150kB, viz ≤ 120kB, worker ≤ 50kB)
- Lighthouse performance budgets
- Search < 100ms on 1M features

## License

MIT