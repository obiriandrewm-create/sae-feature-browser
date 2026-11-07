// Quality gate enforcement script
// Runs after each check to enforce thresholds from CONSTRAINTS.md

import { readFileSync, writeFileSync } from 'fs';
import { exit } from 'process';

interface GateResult {
  pass: boolean;
  message: string;
  details?: unknown;
}

function parseSemgrepResults(filePath: string): GateResult {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const highOrCritical = data.results?.filter((r: { extra?: { severity?: string } }) => 
      r.extra?.severity === 'ERROR' || r.extra?.severity === 'CRITICAL'
    ) || [];
    
    if (highOrCritical.length > 0) {
      return {
        pass: false,
        message: `Semgrep found ${highOrCritical.length} high/critical issues`,
        details: highOrCritical.map((r: { path?: string; start?: { line?: number }; extra?: { message?: string; severity?: string } }) => ({
          file: r.path,
          line: r.start?.line,
          message: r.extra?.message,
          severity: r.extra?.severity,
        })),
      };
    }
    return { pass: true, message: 'Semgrep: no high/critical issues' };
  } catch (e) {
    return { pass: false, message: `Failed to parse semgrep results: ${e}` };
  }
}

function parseAxeResults(filePath: string): GateResult {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const violations = data.violations || [];
    const criticalOrSerious = violations.filter((v: { impact?: string }) => 
      v.impact === 'critical' || v.impact === 'serious'
    );
    
    if (criticalOrSerious.length > 0) {
      return {
        pass: false,
        message: `Axe found ${criticalOrSerious.length} critical/serious violations`,
        details: criticalOrSerious.map((v: { id?: string; impact?: string; description?: string; help?: string; nodes?: Array<{ target?: string[]; html?: string }> }) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes?.slice(0, 3).map((n) => ({ target: n.target, html: n.html })),
        })),
      };
    }
    return { pass: true, message: 'Axe: no critical/serious violations' };
  } catch (e) {
    return { pass: false, message: `Failed to parse axe results: ${e}` };
  }
}

function parseLighthouseResults(filePath: string): GateResult {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const audits = data.lhr?.audits || {};
    const categories = data.lhr?.categories || {};
    
    const failures: string[] = [];
    
    const lcp = audits['largest-contentful-paint']?.numericValue || 0;
    if (lcp > 2500) failures.push(`LCP: ${lcp}ms > 2500ms`);
    
    const cls = audits['cumulative-layout-shift']?.numericValue || 0;
    if (cls > 0.1) failures.push(`CLS: ${cls} > 0.1`);
    
    const tbt = audits['total-blocking-time']?.numericValue || 0;
    if (tbt > 200) failures.push(`TBT: ${tbt}ms > 200ms`);
    
    const perfScore = categories.performance?.score || 0;
    if (perfScore < 0.9) failures.push(`Performance score: ${perfScore} < 0.9`);
    
    const a11yScore = categories.accessibility?.score || 0;
    if (a11yScore < 1.0) failures.push(`Accessibility score: ${a11yScore} < 1.0`);
    
    if (failures.length > 0) {
      return { pass: false, message: `Lighthouse failures: ${failures.join('; ')}`, details: failures };
    }
    return { pass: true, message: `Lighthouse: LCP=${lcp}ms, CLS=${cls}, TBT=${tbt}ms, Perf=${perfScore}, A11y=${a11yScore}` };
  } catch (e) {
    return { pass: false, message: `Failed to parse lighthouse results: ${e}` };
  }
}

function parseSizeLimitResults(filePath: string): GateResult {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const failures: string[] = [];
    
    for (const result of data) {
      if (result.size > result.limit) {
        failures.push(`${result.name}: ${(result.size / 1024).toFixed(1)}kB > ${(result.limit / 1024).toFixed(1)}kB`);
      }
    }
    
    if (failures.length > 0) {
      return { pass: false, message: `Bundle size failures: ${failures.join('; ')}`, details: failures };
    }
    return { pass: true, message: `Size-limit: all bundles within limits` };
  } catch (e) {
    return { pass: false, message: `Failed to parse size-limit results: ${e}` };
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node quality-gate.mjs <check-type> <results-file>');
    exit(1);
  }
  
  const [checkType, resultsFile] = args;
  let result: GateResult;
  
  switch (checkType) {
    case 'semgrep':
      result = parseSemgrepResults(resultsFile);
      break;
    case 'axe':
      result = parseAxeResults(resultsFile);
      break;
    case 'lighthouse':
      result = parseLighthouseResults(resultsFile);
      break;
    case 'size-limit':
      result = parseSizeLimitResults(resultsFile);
      break;
    default:
      console.error(`Unknown check type: ${checkType}`);
      exit(1);
  }
  
  console.log(result.message);
  if (!result.pass && result.details) {
    console.log(JSON.stringify(result.details, null, 2));
  }
  
  if (!result.pass) {
    exit(1);
  }
}

main().catch((e) => {
  console.error('Quality gate error:', e);
  exit(1);
});