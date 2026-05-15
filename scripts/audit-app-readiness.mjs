#!/usr/bin/env node

/**
 * App Production Readiness Auditor
 * Scans all apps and verifies completeness of UI, features, and data
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const APPS_DATA_PATH = resolve('./src/data/appsData.ts');
const APP_PAGES_PATH = resolve('./src/pages/AppPage.tsx');
const APP_COMPONENTS_PATH = resolve('./src/components');

function auditApps() {
  console.log('🔍 Starting App Production Readiness Audit\n');

  // Read apps data
  const content = readFileSync(APPS_DATA_PATH, 'utf-8');

  // Extract app objects using regex (simple approach)
  const appMatches = content.matchAll(/{\s*id:\s*"([^"]+)"[^}]+}/gs);
  const apps = Array.from(appMatches).map(m => {
    const obj = m[0];
    const idMatch = obj.match(/id:\s*"([^"]+)"/);
    const priceMatch = obj.match(/price:\s*(\d+)/);
    const premiumMatch = obj.match(/premium:\s*(true|false)/);
    const categoryMatch = obj.match(/category:\s*"([^"]+)"/);

    return {
      id: idMatch ? idMatch[1] : null,
      raw: obj,
      price: priceMatch ? parseInt(priceMatch[1]) : null,
      isPremium: premiumMatch === 'true',
      category: categoryMatch ? categoryMatch[1] : null,
      hasLongDescription: obj.includes('longDescription:'),
      hasBenefits: obj.includes('benefits:'),
      hasFeatures: obj.includes('features:'),
      hasSteps: obj.includes('steps:'),
      hasUseCases: obj.includes('useCases:'),
      hasTestimonials: obj.includes('testimonials:'),
      hasFaqs: obj.includes('faqs:'),
      hasTags: obj.includes('tags:'),
      hasSalesCopy: obj.includes('salesCopy:')
    };
  }).filter(app => app.id !== null);

  console.log(`📊 Found ${apps.length} total apps\n`);

  // Categorize
  const premiumApps = apps.filter(a => a.isPremium);
  const standardApps = apps.filter(a => !a.isPremium);

  console.log(`💰 Premium Apps ($${premiumApps.length}): $197 each`);
  console.log(`💎 Standard Apps ($${standardApps.length}): $97 each\n`);

  // Audit each app
  const results = [];
  let issuesFound = 0;

  apps.forEach(app => {
    const issues = [];

    // Check required fields
    if (!app.price) issues.push('❌ Missing price field');
    if (!app.category) issues.push('❌ Missing category');

    // Check optional but important fields
    if (!app.hasLongDescription) issues.push('⚠️  Missing longDescription');
    if (!app.hasBenefits) issues.push('⚠️  Missing benefits array');
    if (!app.hasFeatures) issues.push('⚠️  Missing features array');
    if (!app.hasSteps) issues.push('⚠️  Missing steps array');
    if (!app.hasUseCases) issues.push('⚠️  Missing useCases array');
    if (!app.hasTestimonials) issues.push('⚠️  Missing testimonials array');
    if (!app.hasFaqs) issues.push('⚠️  Missing faqs array');
    if (!app.hasTags) issues.push('⚠️  Missing tags array');
    if (!app.hasSalesCopy) issues.push('⚠️  Missing salesCopy');

    if (issues.length > 0) {
      results.push({ id: app.id, issues });
      issuesFound++;
    }
  });

  // Report
  console.log('📋 Production Readiness Report\n');

  if (results.length === 0) {
    console.log('✅ All apps are 100% production ready!');
  } else {
    console.log(`⚠️  ${results.length} apps have missing elements:\n`);
    results.slice(0, 20).forEach(r => {
      console.log(`   ${r.id}:`);
      r.issues.forEach(i => console.log(`     ${i}`));
    });
    if (results.length > 20) {
      console.log(`   ... and ${results.length - 20} more`);
    }
  }

  // Summary stats
  console.log('\n📈 Summary:');
  console.log(`   Total Apps: ${apps.length}`);
  console.log(`   Premium: ${premiumApps.length} (${(premiumApps.length/apps.length*100).toFixed(1)}%)`);
  console.log(`   Standard: ${standardApps.length} (${(standardApps.length/apps.length*100).toFixed(1)}%)`);
  console.log(`   Apps with issues: ${results.length} (${(results.length/apps.length*100).toFixed(1)}%)`);

  // Category breakdown
  console.log('\n📁 By Category:');
  const categories = {};
  apps.forEach(a => {
    categories[a.category] = (categories[a.category] || 0) + 1;
  });
  Object.entries(categories)
    .sort((a,b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} apps`);
    });

  process.exit(results.length > 0 ? 1 : 0);
}

auditApps();
