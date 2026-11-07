// Check coverage for changed lines only
// Reads lcov and intersects with git diff

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { exit } from 'process';

interface CoverageData {
  lines: { [file: string]: { [line: number]: number } };
}

function getChangedLines(): { [file: string]: number[] } {
  try {
    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' }).trim();
    if (!diff) return {};
    
    const files = diff.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    const result: { [file: string]: number[] } = {};
    
    for (const file of files) {
      try {
        const fileDiff = execSync(`git diff HEAD -- "${file}"`, { encoding: 'utf-8' });
        const lines = parseDiffLines(fileDiff);
        if (lines.length > 0) {
          result[file] = lines;
        }
      } catch {
        // Ignore files that can't be diffed
      }
    }
    
    return result;
  } catch {
    return {};
  }
}

function parseDiffLines(diff: string): number[] {
  const lines: number[] = [];
  const hunks = diff.split('@@');
  
  for (const hunk of hunks) {
    const match = hunk.match(/^\+(\d+)(?:,(\d+))?/);
    if (match) {
      const start = parseInt(match[1], 10);
      const count = match[2] ? parseInt(match[2], 10) : 1;
      for (let i = 0; i < count; i++) {
        lines.push(start + i);
      }
    }
  }
  
  return [...new Set(lines)].sort((a, b) => a - b);
}

function parseLcov(filePath: string): CoverageData {
  const content = readFileSync(filePath, 'utf-8');
  const lines: { [file: string]: { [line: number]: number } } = {};
  let currentFile = '';
  
  for (const line of content.split('\n')) {
    if (line.startsWith('SF:')) {
      currentFile = line.slice(3);
      lines[currentFile] = {};
    } else if (line.startsWith('DA:') && currentFile) {
      const [, lineNum, hits] = line.split(',');
      lines[currentFile][parseInt(lineNum, 10)] = parseInt(hits, 10);
    }
  }
  
  return { lines };
}

function main() {
  const lcovPath = process.argv[2] || 'coverage/lcov.info';
  const threshold = parseFloat(process.env.COVERAGE_THRESHOLD || '0.8');
  
  const changedLines = getChangedLines();
  const coverage = parseLcov(lcovPath);
  
  let totalChanged = 0;
  let coveredChanged = 0;
  const uncoveredFiles: string[] = [];
  
  for (const [file, lines] of Object.entries(changedLines)) {
    const fileCoverage = coverage.lines[file] || {};
    
    for (const line of lines) {
      totalChanged++;
      if (fileCoverage[line] && fileCoverage[line] > 0) {
        coveredChanged++;
      } else {
        uncoveredFiles.push(`${file}:${line}`);
      }
    }
  }
  
  const coveragePercent = totalChanged > 0 ? coveredChanged / totalChanged : 1;
  const passed = coveragePercent >= threshold;
  
  console.log(`Changed lines coverage: ${(coveragePercent * 100).toFixed(2)}% (${coveredChanged}/${totalChanged})`);
  console.log(`Threshold: ${(threshold * 100).toFixed(0)}%`);
  console.log(passed ? 'PASSED' : 'FAILED');
  
  if (!passed && uncoveredFiles.length > 0) {
    console.log('\nUncovered changed lines (first 20):');
    for (const u of uncoveredFiles.slice(0, 20)) {
      console.log(`  ${u}`);
    }
    if (uncoveredFiles.length > 20) {
      console.log(`  ... and ${uncoveredFiles.length - 20} more`);
    }
  }
  
  if (!passed) {
    exit(1);
  }
}

main().catch((e) => {
  console.error('Coverage check error:', e);
  exit(1);
});