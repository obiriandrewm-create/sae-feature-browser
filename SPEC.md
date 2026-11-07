# Spec: SAE Feature Browser (Sparse Autoencoder Interpretability)

## Objective
Build an interactive, scalable feature exploration interface for Anthropic-style Sparse Autoencoder (SAE) interpretability research. Must handle millions of features: search/filter by activation strength, semantic labels, layer; visualize activation distributions, token highlights, cross-layer comparisons; support focus+context navigation (fisheye), organic micro-interactions (jitter), and researcher workflows (bookmark, compare, export). Target users: Interpretability researchers, AI safety engineers. Success = sub-100ms search on 1M+ features, 60fps interactions, zero critical a11y, 80%+ changed-lines coverage.

## Tech Stack
- **Framework:** React 18 + TypeScript 5 + Vite 5
- **Styling:** CSS Modules + CSS Variables (design tokens) + CSS Grid/Subgrid
- **State:** TanStack Query v5 (server state) + Zustand (client state: filters, selection, bookmarks)
- **Search:** FlexSearch (client-side full-text) + Web Worker for indexing
- **Charts/Viz:** D3.js v7 (activation histograms, token highlights), Three.js r160 (3D feature space projection), Canvas API (fisheye distortion, jitter effects)
- **Animation:** Framer Motion 11 + GSAP 3 (Flip, ScrollTrigger, custom easings)
- **Data:** Apache Arrow / Parquet (efficient columnar), WASM for heavy compute
- **Testing:** Vitest 2 (unit), Playwright 1.45 (e2e), axe-core (a11y)
- **Lint/Format:** Biome 1.8 + TypeScript strict
- **CI/CD:** GitHub Actions + Lighthouse CI + size-limit
- **Deploy:** Vercel/Netlify preview + production

## Commands
```bash
# Development
npm run dev                 # Vite dev server + mock data
npm run dev:mock            # Dev with mock SAE data generator

# Build & Typecheck
npm run build               # Production build (typecheck + minify)
npm run typecheck           # tsc --noEmit
npm run lint                # Biome check --apply

# Testing
npm run test                # Vitest run --coverage
npm run test:watch          # Vitest watch
npm run test:e2e            # Playwright test
npm run test:a11y           # axe-core against preview URL

# Quality Gates
npm run check:fast          # typecheck + lint + gitleaks (diff only)
npm run check:task          # check:fast + test (changed lines coverage)
npm run check:security      # semgrep + osv-scanner
npm run check:full          # check:task + check:security + lighthouse + axe
npm run check:perf          # lighthouse $PREVIEW_URL --budget=./.lighthouseci.json
npm run check:size          # size-limit

# Data
npm run data:generate       # Generate mock SAE datasets (Arrow/Parquet)
npm run data:index          # Build FlexSearch index (Web Worker)

# Deploy
npm run preview             # Vite preview
npm run deploy:preview      # Deploy to preview environment
npm run deploy:prod         # Deploy to production
```

## Project Structure
```
sae-feature-browser/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-preview.yml
│       ├── deploy-prod.yml
│       └── lighthouse.yml
├── .vscode/
│   └── settings.json
├── public/
│   ├── mock-data/              # Static mock Arrow/Parquet files
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers/
│   ├── components/
│   │   ├── ui/                 # Design system (Button, Input, Select, Tooltip, Modal, Card, etc.)
│   │   ├── layout/             # Bento grid, Sidebar, Header, ResizablePanel, FocusContextLayout
│   │   ├── charts/             # D3: Histogram, TokenHighlighter, ActivationSparklines
│   │   ├── viz/                # Three.js: FeatureSpace3D, LayerProjection
│   │   ├── canvas/             # Canvas: FisheyeDistortion, JitterLayer, OrganicNoise
│   │   ├── browser/            # FeatureBrowser, FeatureCard, FeatureDetail, ComparisonView
│   │   └── common/             # Loading, ErrorBoundary, EmptyState, VirtualList
│   ├── features/
│   │   ├── feature-search/     # Search bar, filters, FacetedSearch, FlexSearch integration
│   │   ├── feature-list/       # Virtualized list, sorting, selection, bookmarks
│   │   ├── feature-detail/     # Activation distribution, token examples, metadata
│   │   ├── comparison/         # Side-by-side, overlay, diff view
│   │   ├── focus-context/      # Fisheye viewport, focus management, transition
│   │   └── workspace/          # Bookmarks, annotations, export, session persistence
│   ├── hooks/
│   │   ├── useFeatureData.ts   # TanStack Query + Arrow parsing
│   │   ├── useFlexSearch.ts    # Web Worker search index
│   │   ├── useFisheye.ts       # Fisheye distortion controller
│   │   ├── useJitter.ts        # Organic noise/jitter animator
│   │   ├── useThreeScene.ts    # Three.js lifecycle, resize, cleanup
│   │   └── useResponsive.ts
│   ├── lib/
│   │   ├── api.ts              # API client (REST + Arrow streaming)
│   │   ├── mock.ts             # Mock SAE data generator
│   │   ├── arrow-helpers.ts    # Apache Arrow parsing, column access
│   │   ├── flexsearch-worker.ts# Web Worker for FlexSearch indexing
│   │   ├── d3-helpers.ts
│   │   ├── three-helpers.ts
│   │   ├── canvas-helpers.ts
│   │   ├── fisheye.ts          # Fisheye distortion math (polar mapping)
│   │   ├── jitter.ts           # Perlin/Simplex noise, animation loop
│   │   ├── tokens.ts
│   │   └── utils.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tokens.css
│   │   ├── layout.css
│   │   ├── themes.css
│   │   └── canvas.css          # Canvas-specific styles (overlay, pointer-events)
│   └── types/
│       ├── api.ts
│       ├── sae.ts              # Feature, Activation, Layer, Model types
│       └── ui.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── a11y/
│   ├── visual/
│   └── fixtures/
├── scripts/
│   ├── quality-gate.mjs
│   ├── generate-mocks.mjs
│   ├── check-coverage.mjs
│   └── build-search-index.mjs
├── CONSTRAINTS.md
├── SPEC.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── biome.json
├── .lighthouseci.json
├── size-limit.config.js
├── .gitignore
├── .eslintignore
├── README.md
└── ARCHITECTURE.md
```

## Code Style
```tsx
// FeatureCard: compound component with focus+context awareness
// File: src/components/browser/FeatureCard/FeatureCard.tsx
import { forwardRef, useMemo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import styles from './FeatureCard.module.css';
import { ActivationSparkline } from '@/components/charts/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter';

export interface FeatureCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  feature: Feature;
  variant?: 'compact' | 'detailed' | 'comparison';
  isFocused?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark: (id: string) => void;
  onSelect: (id: string) => void;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      feature,
      variant = 'detailed',
      isFocused = false,
      isBookmarked = false,
      onToggleBookmark,
      onSelect,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const cardStyle = useMemo(() => ({
      ...style,
      // Fisheye scale passed via CSS variable from parent
      transform: isFocused ? 'var(--fisheye-scale, 1)' : undefined,
    }), [style, isFocused]);

    return (
      <motion.div
        ref={ref}
        className={cn(styles.card, styles[variant], className)}
        style={cardStyle as React.CSSProperties}
        whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
        tapHighlight={{ opacity: 0.8 }}
        onTap={() => onSelect(feature.id)}
        {...props}
      >
        <div className={styles.header}>
          <span className={cn(styles.layerBadge, `layer-${feature.layer}`)}>
            Layer {feature.layer}
          </span>
          <button
            className={cn(styles.bookmarkBtn, isBookmarked && styles.active)}
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(feature.id); }}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            aria-pressed={isBookmarked}
          >
            ★
          </button>
        </div>

        <div className={styles.activation}>
          <ActivationSparkline
            data={feature.activationHistogram}
            maxActivation={feature.maxActivation}
            className={styles.sparkline}
          />
          <span className={styles.maxAct}>{feature.maxActivation.toFixed(2)}</span>
        </div>

        {variant !== 'compact' && (
          <TokenHighlighter
            tokens={feature.topTokens}
            activations={feature.tokenActivations}
            className={styles.tokens}
            maxTokens={5}
          />
        )}

        <div className={styles.semanticLabel}>
          {feature.semanticLabel || <em>Unlabeled</em>}
        </div>
      </motion.div>
    )
  }
);
FeatureCard.displayName = 'FeatureCard';
```

**Key Conventions:**
- **Components:** Compound, forwardRef, Framer Motion for animation, CSS Modules + cn()
- **Canvas/Three.js:** Cleanup in useEffect, resize observers, requestAnimationFrame loops
- **Web Workers:** Type-safe messaging via Comlink or custom protocol
- **Types:** Discriminated unions for feature states, branded types for IDs
- **Performance:** Virtualized lists (react-window), memoization, Web Workers for search/indexing
- **Animation:** Framer Motion for React, GSAP for complex/sequenced, Canvas for per-frame

## Testing Strategy
- **Unit (Vitest):** Pure functions (fisheye math, jitter noise, token parsing, Arrow helpers), hooks, utils — 100% coverage
- **Integration (Vitest):** Search pipeline (FlexSearch worker), feature list + detail sync, bookmark persistence
- **E2E (Playwright):** Search → select → detail → compare → bookmark → export flow; fisheye focus transition; jitter respects reduced-motion
- **Visual (Playwright):** Feature cards at variants, histograms, token highlighter, 3D projection, fisheye distortion
- **Accessibility (axe-core):** Zero critical/serious; keyboard navigation for all interactions; screen reader labels
- **Performance (Lighthouse CI):** LCP ≤ 2500ms, CLS ≤ 0.1, search <100ms on 1M features
- **Bundle (size-limit):** Main ≤ 150kB, viz chunk (Three.js/D3) ≤ 120kB, worker ≤ 50kB
- **Coverage Gate:** Changed lines ≥ 80%

## Boundaries
- **Always:**
  - Run `npm run check:fast` before commit
  - Follow component/hook/canvas patterns above
  - Validate API inputs with Zod
  - Write tests FIRST (TDD)
  - Zero `@ts-ignore`, `eslint-disable`, skipped tests without reason
  - No secrets in source (gitleaks --redact)
  - Respect `prefers-reduced-motion` (disable jitter/fisheye animation)
  - Clean up Three.js/Canvas/Web Workers in useEffect return
- **Ask First:**
  - Adding heavy dependencies (Three.js, D3, Arrow already approved)
  - Changing CI config or quality thresholds
  - Modifying design tokens
  - Architecture decisions (new state lib, worker strategy)
  - Real data pipeline (Arrow/Parquet streaming vs. REST)
- **Never:**
  - Commit directly to main
  - Weaken CONSTRAINTS.md
  - Remove failing tests without approval
  - Hardcode colors/spacing/motion values
  - Use `any` type
  - Leak Web Workers/Three.js scenes (memory leaks)
  - Block main thread >16ms (use workers/WASM)

## Success Criteria
1. **Functional:**
   - Search 1M features in <100ms (FlexSearch + Web Worker)
   - Fisheye focus transition 60fps, smooth zoom
   - Jitter effects subtle, respect reduced-motion
   - Virtualized list handles 100K+ rendered items
   - Comparison view: side-by-side + overlay + diff
   - Bookmarks persist across sessions (localStorage/IndexedDB)
   - Export: CSV, JSON, shareable URL with filters

2. **Quality:**
   - `npm run check:full` passes on CI
   - Zero critical/serious axe violations
   - Lighthouse CI budgets met
   - Bundle size within limits
   - Changed-lines coverage ≥ 80%
   - No memory leaks (Three.js/Canvas/Workers cleaned up)

3. **Developer Experience:**
   - `npm run dev` starts in <3s with mock data
   - HMR works for all files including workers
   - TypeScript errors in editor
   - Mock data generator produces realistic SAE distributions

## Open Questions
1. Real SAE data format? (Assume Arrow/Parquet with columns: feature_id, layer, activation_histogram, top_tokens, token_activations, semantic_label, max_activation)
2. Authentication? (Assume token header for now)
3. Cross-model comparison? (v1: single model; v2: multi-model)
4. Real-time updates? (v1: static snapshots; v2: streaming activations)
5. Collaboration features? (v2: shared bookmarks, annotations)