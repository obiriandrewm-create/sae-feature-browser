# Constraints: SAE Feature Browser

Last reviewed: 2026-11-07 by @obiriandrewm-create

## Floor (always enforced, no setup required)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `# noqa`, `# type: ignore`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`
- No skipped or deleted tests without a reason in the commit message
- No secrets in source
- This file does not get weakened to make a change pass
- Respect `prefers-reduced-motion` — disable jitter/fisheye animation when set
- Clean up Three.js scenes, Canvas contexts, Web Workers in useEffect return

## Enforced with numbers

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Types | Zero type errors | `tsc --noEmit` | every edit |
| Lint | Zero errors from our config | `biome check` | every edit |
| Secrets | No secrets in source | `gitleaks dir . --redact --no-banner` | every edit |
| Coverage | Changed lines ≥ 80% covered | `vitest run --coverage` + `scripts/check-coverage.mjs` | task end, CI |
| Security: code | Nothing at high or above | `semgrep scan --config p/default --strict --json > semgrep-results.json && node scripts/quality-gate.mjs semgrep semgrep-results.json` | CI |
| Security: deps | Nothing at high or above | `osv-scanner scan source -r .` | CI |
| Accessibility | Zero critical or serious | `axe "$PREVIEW_URL" --tags wcag2a,wcag2aa,wcag21aa --stdout > axe-results.json && node scripts/quality-gate.mjs axe axe-results.json` | preview deploy |
| Performance | LCP ≤ 2500ms, CLS ≤ 0.1, Search < 100ms (1M features) | `lighthouse $PREVIEW_URL --output=json --quiet > lh-results.json && node scripts/quality-gate.mjs lighthouse lh-results.json` | preview deploy |
| Bundle size | Main ≤ 150kB gz, viz chunk ≤ 120kB gz, worker ≤ 50kB gz | `size-limit --json` | CI |

## Measured, not yet enforced

| Metric | Today | Direction |
|--------|-------|-----------|
| Project coverage | 0% (new) | must not fall |
| Bundle size (main) | N/A | must not grow |
| Memory (Three.js/Canvas) | N/A | must not leak |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| W1 | `no-explicit-any` | `src/lib/three-helpers.ts` | Three.js types incomplete | @obiriandrewm-create | 2026-12-07 |
| W2 | `no-explicit-any` | `src/lib/canvas-helpers.ts` | Canvas 2D context typing | @obiriandrewm-create | 2026-12-07 |
| W3 | `no-explicit-any` | `src/lib/flexsearch-worker.ts` | Worker message typing | @obiriandrewm-create | 2026-12-07 |

## Scripts (package.json)

```json
{
  "scripts": {
    "check:fast": "tsc --noEmit && biome check . && gitleaks dir . --redact --no-banner",
    "check:task": "npm run check:fast && vitest run --coverage && node scripts/check-coverage.mjs",
    "check:security": "semgrep scan --config p/default --strict --json > semgrep-results.json && node scripts/quality-gate.mjs semgrep semgrep-results.json && osv-scanner scan source -r .",
    "check:a11y": "axe \"$PREVIEW_URL\" --tags wcag2a,wcag2aa,wcag21aa --stdout > axe-results.json && node scripts/quality-gate.mjs axe axe-results.json",
    "check:perf": "lighthouse \"$PREVIEW_URL\" --output=json --quiet > lh-results.json && node scripts/quality-gate.mjs lighthouse lh-results.json",
    "check:size": "size-limit --json",
    "check:full": "npm run check:task && npm run check:security && npm run check:a11y && npm run check:perf && npm run check:size"
  }
}
```