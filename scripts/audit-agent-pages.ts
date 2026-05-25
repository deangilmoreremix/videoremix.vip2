#!/usr/bin/env node

/**
 * Agent Page UI/UX Audit Script
 *
 * Scans all agent pages in src/pages/agents/ and scores them based on
 * completeness criteria. Produces a detailed audit report with scores
 * and prioritized upgrade batches.
 *
 * Usage: npx tsx scripts/audit-agent-pages.ts
 *
 * Output: audit-report.json + audit-report.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root: session directory containing src/
const projectRoot = path.resolve(__dirname, '..');
const agentsDir = path.join(projectRoot, 'src', 'pages', 'agents');

interface AuditResult {
  appId: string;
  fileName: string;
  scores: {
    total: number; // 0-100
    inputs: number;
    placeholders: number;
    helperText: number;
    resultDisplay: number;
    loadingStates: number;
    errorHandling: number;
    emptyStates: number;
    persistence: number;
    responsive: number;
    accessibility: number;
    animations: number;
  };
  metrics: {
    totalInputs: number;
    descriptivePlaceholders: number;
    emptyPlaceholders: number;
    hasHelperText: boolean;
    resultFormat: 'raw-json' | 'pre-tag' | 'styled-components' | 'none';
    hasLoadingIndicator: boolean;
    hasErrorHandling: boolean;
    hasEmptyStates: boolean;
    hasLocalStorage: boolean;
    usesResponsiveGrid: boolean;
    hasAriaLabels: boolean;
    hasFramerMotion: boolean;
  };
  qualityTier: 'complete' | 'partial' | 'minimal';
  upgradePriority: 'high' | 'medium' | 'low';
}

interface AuditReport {
  scanned: number;
  results: AuditResult[];
  summary: {
    complete: number;
    partial: number;
    minimal: number;
    avgScore: number;
    totalEmptyPlaceholders: number;
  };
  batches: {
    batchA: string[]; // High priority: popular + revenue apps
    batchB: string[]; // Medium-high: new + core apps
    batchC: string[]; // Medium: specialty agents
    batchD: string[]; // Standard: remaining apps
  };
}

// Quality thresholds
const TIER_THRESHOLDS = {
  COMPLETE: 80,
  PARTIAL: 50,
};

// Priority indicators (from appsData.ts)
const POPULAR_APPS = [
  'salesforce-ai',
  'launchrocket-ai',
  'consultpro-ai',
  'podcastify-ai',
  'socialbuzz-ai',
  'contentgenius-ai',
  'datamaster-ai',
];

const NEW_APPS = [
  'ai-headshot-studio',
  'nano-banana-studio',
  'seedance-v2-studio',
];

// Known complete reference pages (gold standards)
const KNOWN_COMPLETE = new Set([
  'FinanceAgentPage',
  'WebScrapingAgentPage',
  'ReasoningAgentPage',
]);

// Patterns to detect in code
const PLACEHOLDER_PATTERNS = {
  EMPTY: /placeholder\s*=\s*["']\s*["']/,
  GENERIC: /placeholder\s*=\s*["']Enter\s+(?:auto-detected\s+)?input["']/i,
  DESCRIPTIVE: /placeholder\s*=\s*["'][^"']{15,}["']/, // >15 chars = descriptive
};

const RESULT_DISPLAY_PATTERNS = {
  RAW_JSON: /JSON\.stringify\s*\(/,
  PRE_TAG: /<pre[\s>]/,
  STYLED: /<(ResultCard|ResultGrid|Card|div)\s+className/,
};

const HELPER_TEXT_PATTERNS = [
  /<p[^>]*className[^>]*text-xs|text-sm.*?text-gray/i, // small gray text
  /id=["'][^"']*-help["']/, // aria-describedby pattern
  /Helper text|Example|Format|Tip/i,
];

const LOADING_PATTERNS = [
  /<Loader|Loading|Spinner/,
  /stockLoading|isLoading|processing/i,
];

const ERROR_PATTERNS = [
  /<ErrorMessage|ErrorAlert/,
  /className[^]*bg-red|border-red|text-red/,
  /setError\(/,
];

const EMPTY_STATE_PATTERNS = [
  /messages\.length\s*===\s*0/,
  /!data|!result/,
  /EmptyState|empty-state/,
  /Start a conversation|No data|Nothing yet/i,
];

const LOCALSTORAGE_PATTERNS = [
  /localStorage\.getItem/,
  /useLocalStorage/,
];

const RESPONSIVE_PATTERNS = [
  /grid-cols-1\s+lg:grid-cols/,
  /md:grid-cols/,
  /sm:|md:|lg:/,
];

const ARIA_PATTERNS = [
  /aria-label/,
  /aria-describedby/,
  /role=["']/,
];

const ANIMATION_PATTERNS = [
  /motion\./,
  /framer-motion/,
  /AnimatePresence/,
];

function slugify(filename: string): string {
  return filename
    .replace(/Page\.tsx$/i, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function countInputs(content: string): number {
  const matches = content.match(/<Input|<Textarea|<Select|<Button.*type\s*=\s*["'](?:submit|button)["']/gi) || [];
  return matches.length;
}

function analyzePlaceholders(content: string): { total: number; empty: number; descriptive: number } {
  const inputMatches = content.match(/<Input[^>]*>/gi) || [];
  let total = inputMatches.length;
  let empty = 0;
  let descriptive = 0;

  for (const match of inputMatches) {
    if (PLACEHOLDER_PATTERNS.EMPTY.test(match)) {
      empty++;
    } else if (PLACEHOLDER_PATTERNS.DESCRIPTIVE.test(match)) {
      descriptive++;
    }
    // Generic patterns don't count as descriptive but aren't completely empty
  }

  return { total, empty, descriptive };
}

function hasHelperText(content: string): boolean {
  for (const pattern of HELPER_TEXT_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }
  return false;
}

function detectResultFormat(content: string): 'raw-json' | 'pre-tag' | 'styled-components' | 'none' {
  if (RESULT_DISPLAY_PATTERNS.RAW_JSON.test(content)) return 'raw-json';
  if (RESULT_DISPLAY_PATTERNS.PRE_TAG.test(content)) return 'pre-tag';
  if (RESULT_DISPLAY_PATTERNS.STYLED.test(content)) return 'styled-components';
  return 'none';
}

function hasPattern(content: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(content));
}

function calculateScores(
  metrics: AuditResult['metrics']
): AuditResult['scores'] {
  const maxScore = (threshold: number) => (metrics.totalInputs > 0 ? threshold : 0);

  const scores: AuditResult['scores'] = {
    total: 0,
    inputs: 0,
    placeholders: 0,
    helperText: 0,
    resultDisplay: 0,
    loadingStates: 0,
    errorHandling: 0,
    emptyStates: 0,
    persistence: 0,
    responsive: 0,
    accessibility: 0,
    animations: 0,
  };

  // Inputs exist check
  scores.inputs = metrics.totalInputs > 0 ? 10 : 0;

  // Placeholder quality (0-10)
  if (metrics.totalInputs > 0) {
    const { total, empty, descriptive } = {
      total: metrics.totalInputs,
      empty: metrics.emptyPlaceholders,
      descriptive: metrics.descriptivePlaceholders,
    };
    const goodRatio = descriptive / total;
    const emptyRatio = empty / total;
    scores.placeholders = Math.round((goodRatio * 10) - (emptyRatio * 5) + 5);
    scores.placeholders = Math.max(0, Math.min(10, scores.placeholders));
  }

  // Helper text (0-10)
  scores.helperText = metrics.hasHelperText ? 10 : 0;

  // Result display (0-10)
  switch (metrics.resultFormat) {
    case 'styled-components': scores.resultDisplay = 10; break;
    case 'pre-tag': scores.resultDisplay = 5; break;
    case 'raw-json': scores.resultDisplay = 2; break;
    default: scores.resultDisplay = 0;
  }

  // Loading states (0-10)
  scores.loadingStates = metrics.hasLoadingIndicator ? 10 : 0;

  // Error handling (0-10)
  scores.errorHandling = metrics.hasErrorHandling ? 10 : 0;

  // Empty states (0-10)
  scores.emptyStates = metrics.hasEmptyStates ? 10 : 0;

  // Persistence (0-10)
  scores.persistence = metrics.hasLocalStorage ? 10 : 0;

  // Responsive (0-10)
  scores.responsive = metrics.usesResponsiveGrid ? 10 : 0;

  // Accessibility (0-10)
  scores.accessibility = metrics.hasAriaLabels ? 10 : 0;

  // Animations (0-10)
  scores.animations = metrics.hasFramerMotion ? 5 : 0; // Lower weight

  // Total
  scores.total = Object.values(scores).reduce((a, b) => a + b, 0);

  return scores;
}

function determineQualityTier(total: number): 'complete' | 'partial' | 'minimal' {
  if (total >= TIER_THRESHOLDS.COMPLETE) return 'complete';
  if (total >= TIER_THRESHOLDS.PARTIAL) return 'partial';
  return 'minimal';
}

function determineUpgradePriority(result: AuditResult): 'high' | 'medium' | 'low' {
  const slug = result.appId;

  if (POPULAR_APPS.some(p => slug.includes(p))) return 'high';
  if (NEW_APPS.some(n => slug.includes(n))) return 'high';
  if (KNOWN_COMPLETE.has(result.fileName.replace('.tsx', ''))) return 'low'; // Already good

  // External VideoRemix Core apps are already functional
  if (['video-ai-editor', 'ai-video-image', 'personalized-video-creator'].some(p => slug.includes(p))) {
    return 'low';
  }

  return 'medium';
}

function auditPage(filePath: string, fileName: string): AuditResult {
  const content = readFileContent(filePath);

  const appId = slugify(fileName);

  const totalInputs = countInputs(content);
  const placeholderMetrics = analyzePlaceholders(content);

  const metrics: AuditResult['metrics'] = {
    totalInputs,
    descriptivePlaceholders: placeholderMetrics.descriptive,
    emptyPlaceholders: placeholderMetrics.empty,
    hasHelperText: hasHelperText(content),
    resultFormat: detectResultFormat(content),
    hasLoadingIndicator: hasPattern(content, LOADING_PATTERNS),
    hasErrorHandling: hasPattern(content, ERROR_PATTERNS),
    hasEmptyStates: hasPattern(content, EMPTY_STATE_PATTERNS),
    hasLocalStorage: hasPattern(content, LOCALSTORAGE_PATTERNS),
    usesResponsiveGrid: hasPattern(content, RESPONSIVE_PATTERNS),
    hasAriaLabels: hasPattern(content, ARIA_PATTERNS),
    hasFramerMotion: hasPattern(content, ANIMATION_PATTERNS),
  };

  const scores = calculateScores(metrics);
  const qualityTier = determineQualityTier(scores.total);
  const upgradePriority = determineUpgradePriority({ appId, fileName, scores, metrics, qualityTier, upgradePriority: 'medium' });

  return {
    appId,
    fileName,
    scores,
    metrics,
    qualityTier,
    upgradePriority,
  };
}

function scanAgentPages(): AuditResult[] {
  const agentsDir = path.join(projectRoot, 'src', 'pages', 'agents');
  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.tsx'));

  const results: AuditResult[] = [];

  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    const result = auditPage(filePath, file);
    results.push(result);
  }

  return results.sort((a, b) => b.scores.total - a.scores.total);
}

function generateReport(results: AuditResult[]): AuditReport {
  const scanned = results.length;
  const complete = results.filter(r => r.qualityTier === 'complete').length;
  const partial = results.filter(r => r.qualityTier === 'partial').length;
  const minimal = results.filter(r => r.qualityTier === 'minimal').length;
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.scores.total, 0) / scanned);
  const totalEmptyPlaceholders = results.reduce((sum, r) => sum + r.metrics.emptyPlaceholders, 0);

  const batchA = results
    .filter(r => r.upgradePriority === 'high' && r.qualityTier !== 'complete')
    .map(r => r.fileName.replace('.tsx', ''));

  const batchB = results
    .filter(r => r.upgradePriority === 'medium' && r.qualityTier === 'partial')
    .slice(0, 10)
    .map(r => r.fileName.replace('.tsx', ''));

  const remaining = results.filter(r => r.upgradePriority !== 'low' && !batchA.includes(r.fileName.replace('.tsx', '')) && !batchB.includes(r.fileName.replace('.tsx', '')));
  const batchC = remaining.slice(0, 20).map(r => r.fileName.replace('.tsx', ''));
  const batchD = remaining.slice(20).map(r => r.fileName.replace('.tsx', ''));

  return {
    scanned,
    results,
    summary: { complete, partial, minimal, avgScore, totalEmptyPlaceholders },
    batches: { batchA, batchB, batchC, batchD },
  };
}

function writeReport(report: AuditReport): void {
  const outputDir = path.join(projectRoot, 'docs', 'audits');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // JSON output
  const jsonPath = path.join(outputDir, 'audit-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✅ Audit JSON saved: ${jsonPath}`);

  // Markdown summary
  const mdContent = generateMarkdownReport(report);
  const mdPath = path.join(outputDir, 'audit-report.md');
  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Audit report saved: ${mdPath}`);
}

function generateMarkdownReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push('# Agent Page UI/UX Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total Pages Scanned:** ${report.scanned}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count | Percentage |');
  lines.push('|--------|-------|------------|');
  lines.push(`| Complete (≥80) | ${report.summary.complete} | ${((report.summary.complete / report.scanned) * 100).toFixed(1)}% |`);
  lines.push(`| Partial (50-79) | ${report.summary.partial} | ${((report.summary.partial / report.scanned) * 100).toFixed(1)}% |`);
  lines.push(`| Minimal (<50) | ${report.summary.minimal} | ${((report.summary.minimal / report.scanned) * 100).toFixed(1)}% |`);
  lines.push(`| **Average Score** | **${report.summary.avgScore}** | |`);
  lines.push(`| Empty Placeholders Found | **${report.summary.totalEmptyPlaceholders}** | |`);
  lines.push('');
  lines.push('## Quality Distribution');
  lines.push('');

  // Group by tier
  const tierOrder = ['complete', 'partial', 'minimal'];
  for (const tier of tierOrder) {
    const tierResults = report.results.filter(r => r.qualityTier === tier);
    if (tierResults.length === 0) continue;

    lines.push(`### ${tier.charAt(0).toUpperCase() + tier.slice(1)} Apps (${tierResults.length})`);
    lines.push('');
    lines.push('| Page | Score | Inputs | Placeholders | Helper Text | Result Display |');
    lines.push('|------|-------|--------|--------------|-------------|----------------|');

    for (const r of tierResults.sort((a, b) => b.scores.total - a.scores.total).slice(0, 10)) {
      const placeholders = `${r.metrics.descriptivePlaceholders}/${r.metrics.totalInputs}`;
      const helper = r.metrics.hasHelperText ? '✅' : '❌';
      const result = r.metrics.resultFormat === 'styled-components' ? 'styled' : r.metrics.resultFormat;
      lines.push(`| ${r.fileName} | ${r.scores.total} | ${r.metrics.totalInputs} | ${placeholders} | ${helper} | ${result} |`);
    }

    if (tierResults.length > 10) {
      lines.push(`| ... and ${tierResults.length - 10} more | | | | | |`);
    }
    lines.push('');
  }

  lines.push('## Upgrade Batches');
  lines.push('');
  lines.push('### Batch A: High Priority (Popular + Revenue Apps)');
  lines.push(`**Count:** ${report.batches.batchA.length} apps`);
  lines.push('');
  lines.push('These 7 popular apps drive the most revenue and visibility. Upgrade first.');
  lines.push('');
  for (const app of report.batches.batchA) {
    lines.push(`- ${app}`);
  }
  lines.push('');

  lines.push('### Batch B: Medium-High Priority (Core + New Apps)');
  lines.push(`**Count:** ${report.batches.batchB.length} apps`);
  lines.push('');
  lines.push('Core functionality apps and newly added features that need polish.');
  lines.push('');
  for (const app of report.batches.batchB) {
    lines.push(`- ${app}`);
  }
  lines.push('');

  lines.push('### Batch C: Medium Priority (Specialty Agents)');
  lines.push(`**Count:** ${report.batches.batchC.length} apps`);
  lines.push('');
  lines.push('Specialized agents in RAG, Voice, Creative, and Business categories.');
  lines.push('');
  for (const app of report.batches.batchC) {
    lines.push(`- ${app}`);
  }
  lines.push('');

  lines.push('### Batch D: Standard Priority (Remaining Apps)');
  lines.push(`**Count:** ${report.batches.batchD.length} apps`);
  lines.push('');
  lines.push('Framework tutorials, experimental apps, and lower-traffic tools.');
  lines.push('');

  lines.push('## Detailed Scoring Breakdown (Top 20 by Score)');
  lines.push('');
  lines.push('| Rank | Page | Total | Input | Placeholder | Helper | Result | Loading | Error | Empty | Persist | Responsive | A11y | Anim |');
  lines.push('|------|------|-------|-------|-------------|--------|--------|---------|-------|-------|---------|------------|------|------|');

  const sorted = [...report.results].sort((a, b) => b.scores.total - a.scores.total).slice(0, 20);
  sorted.forEach((r, i) => {
    const s = r.scores;
    lines.push(`| ${i + 1} | ${r.fileName} | ${s.total} | ${s.inputs} | ${s.placeholders} | ${s.helperText} | ${s.resultDisplay} | ${s.loadingStates} | ${s.errorHandling} | ${s.emptyStates} | ${s.persistence} | ${s.responsive} | ${s.accessibility} | ${s.animations} |`);
  });

  lines.push('');
  lines.push('## Key Findings');
  lines.push('');
  lines.push(`1. **${report.summary.complete} pages** (${((report.summary.complete / report.scanned) * 100).toFixed(1)}%) meet completeness standard (≥80/100)`);
  lines.push(`2. **~${Math.round(report.summary.totalEmptyPlaceholders)} empty placeholder inputs** need descriptive text added`);
  lines.push(`3. **${report.results.filter(r => r.metrics.resultFormat === 'raw-json').length} pages** display raw JSON - needs formatted result components`);
  lines.push(`4. **${report.results.filter(r => !r.metrics.hasHelperText).length} pages** lack helper text/guidance`);
  lines.push(`5. **${report.results.filter(r => !r.metrics.hasErrorHandling).length} pages** need better error handling`);
  lines.push('');
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Review and confirm batch assignments');
  lines.push('2. Build Smart UI component library (14 components)');
  lines.push('3. Execute upgrade batches in parallel using subagents');
  lines.push('4. Test, polish, and document');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Agent Page UI/UX Audit Script*');

  return lines.join('\n');
}

// Main execution
console.log('🔍 Starting Agent Page UI/UX Audit...\n');

try {
  const results = scanAgentPages();
  const report = generateReport(results);

  console.log(`\n📊 Audit Complete:`);
  console.log(`   Scanned: ${report.scanned} pages`);
  console.log(`   Complete: ${report.summary.complete}`);
  console.log(`   Partial: ${report.summary.partial}`);
  console.log(`   Minimal: ${report.summary.minimal}`);
  console.log(`   Avg Score: ${report.summary.avgScore}/100`);
  console.log(`   Empty Placeholders: ${report.summary.totalEmptyPlaceholders}`);
  console.log(`\n🎯 Batch A (High Priority): ${report.batches.batchA.length} apps`);
  console.log(`   Batch B (Medium-High): ${report.batches.batchB.length} apps`);
  console.log(`   Batch C (Medium): ${report.batches.batchC.length} apps`);
  console.log(`   Batch D (Standard): ${report.batches.batchD.length} apps`);

  writeReport(report);

  console.log('\n✅ Audit reports generated successfully!');
  console.log('   Review docs/audits/audit-report.md before proceeding to Phase 2.');
} catch (error) {
  console.error('❌ Audit failed:', error);
  process.exit(1);
}
