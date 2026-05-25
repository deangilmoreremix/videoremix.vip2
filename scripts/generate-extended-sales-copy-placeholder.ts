#!/usr/bin/env tsx

/**
 * Quick Extended Sales Copy Generator (Placeholder Version)
 * Generates structured placeholder content for all 134 apps without API calls
 * Run with: npx tsx scripts/generate-extended-sales-copy-placeholder.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// LOAD DATA
// ============================================
function loadAppSalesCopy(): Record<string, { tonality: string }> {
  const filePath = path.join(__dirname, '../src/data/appSalesCopy.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const result: Record<string, { tonality: string }> = {};
  const regex = /'([^']+)':\s*\{[^}]*tonality:\s*'([^']+)'/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const appId = match[1];
    const tonality = match[2];
    result[appId] = { tonality };
  }

  return result;
}

function loadAppsData(): any[] {
  const filePath = path.join(__dirname, '../src/data/appsData.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const apps: any[] = [];
  const appRegex = /\{\s*id:\s*["']([^"']+)["']\s*,\s*name:\s*["']([^"']+)["']\s*,\s*description:\s*["']([^"']+)["']\s*,\s*category:\s*["']([^"']+)["'][^}]*\}/g;
  
  let match;
  while ((match = appRegex.exec(content)) !== null) {
    const [, id, name, description, category] = match;
    apps.push({ id, name, description, category });
  }

  console.log(`📦 Extracted ${apps.length} apps from appsData.ts`);
  return apps;
}

// Category-specific profit hints
const PROFIT_HINTS: Record<string, {business: string, individual: string}> = {
  'video': {
    business: 'Offer video editing services for local businesses, charging $500-2000 per project. Create promotional videos, social content, and marketing campaigns for restaurants, real estate agents, and healthcare providers.',
    individual: 'Provide video editing services on Fiverr/Upwork. Specialize in short-form content for YouTubers and TikTok creators. Time: 10-15 hrs/week. Income: $800-3000/month.'
  },
  'ai-image': {
    business: 'Provide AI image generation services for e-commerce product images, marketing materials, and social media graphics. Charge $100-500 per image or $300-1500 per project for local businesses.',
    individual: 'Offer custom AI art on platforms like Midjourney community, Fiverr, or direct commissions. Focus on specific niches (pet portraits, business logos). 5-10 hrs/week, $200-1000/month.'
  },
  'creative': {
    business: 'Offer design and creative services: branding packages ($800-3000), social media templates ($200-800/mo), and content creation ($500-2000/project) for local businesses.',
    individual: 'Sell creative assets on marketplaces (Creative Market, Etsy) or offer custom design services. Build templates and digital products for passive income. 10 hrs/week, $300-1500/month.'
  },
  'lead-gen': {
    business: 'Provide lead generation services: cold outreach campaigns ($1000-5000/mo), lead database building ($500-2000), and appointment setting ($50-200/lead) for local service businesses.',
    individual: 'Offer lead generation as a service on Upwork/Fiverr. Specialize in a niche (real estate, SaaS, agencies). Work 15-20 hrs/week, earn $1000-5000/month.'
  },
  'personalizer': {
    business: 'Create personalized content services for local businesses: custom video messages ($100-500 each), personalized email campaigns ($500-3000/mo), and targeted marketing assets.',
    individual: 'Offer personalization services on freelance platforms. Help businesses create custom messaging for their customers. 8-12 hrs/week, $400-2000/month.'
  },
  'branding': {
    business: 'Offer branding services: logo design ($500-3000), brand identity packages ($2000-10000), and brand strategy consulting ($150-300/hr) for local businesses and startups.',
    individual: 'Provide branding design services or sell brand identity templates. Focus on specific industries for higher rates. 15-20 hrs/week, $1000-6000/month.'
  }
};

// Default fallback
const DEFAULT_PROFIT = {
  business: 'Offer this as a service to local businesses. Charge $200-800 per project. Target small businesses that need this solution. Potential monthly revenue: $2,000-8,000.',
  individual: 'Provide this service on Fiverr or Upwork. Skill level: beginner friendly. Invest 5-10 hours weekly. Income potential: $500-2,000/month.'
};

// ============================================
// MAIN GENERATION
// ============================================
function generatePlaceholderCopy(app: any, tonality: string): any {
  const category = app.category || 'default';
  const profit = PROFIT_HINTS[category] || DEFAULT_PROFIT;
  
  // Generate tonality-appropriate tagline
  const taglines: Record<string, string> = {
    'Steve Jobs': `The revolutionary way to ${app.name.toLowerCase()}.`,
    'Seth Godin': `Be remarkable with ${app.name}.`,
    'Chris Voss': `Master your ${app.category} conversations with ${app.name}.`,
    'Jeff Bezos': `Customer-obsessed ${app.name} for day one growth.`,
    'Challenger Sale': `Challenge the status quo with ${app.name}.`,
    'Trusted Advisor': `Your trusted partner for ${app.name}.`,
    'Cormac McCarthy': `A new approach to ${app.name}.`,
    'Hemingway': `${app.name}: Simple, direct, effective.`,
    'Value-Based': `Maximum ROI from ${app.name}.`,
    'Pain Point Research': `Solve your ${app.category} problems with ${app.name}.`,
    'David Ogilvy': `The benefit-driven way to ${app.name}.`,
    'Growth Hacker': `Growth loops with ${app.name}.`
  };
  
  const tagline = taglines[tonality] || `Transform your ${app.category} with ${app.name}.`;

  return {
    tonality,
    tagline,
    summary: `${app.name} helps you create amazing content with AI. Simple, fast, professional.`,
    whatItDoes: `${app.description} It streamlines workflows and boosts productivity for local businesses and entrepreneurs.`,
    howItWorks: `First, enter your basic information or upload content. Then, let AI analyze and generate optimized results. Finally, refine and export your professional output.`,
    howToProfit: {
      forLocalBusinesses: profit.business,
      forIndividuals: profit.individual
    },
    whyYouNeedIt: `Struggling with ${app.description}? This tool automates the heavy lifting, delivering professional results in minutes not hours. Start today before your competitors do.`,
    useCases: [
      {
        industry: app.category,
        scenario: `Use ${app.name} for routine ${app.category} tasks`,
        outcome: `Save time and improve quality`
      },
      {
        industry: 'Small Business',
        scenario: `Integrate ${app.name} into your workflow`,
        outcome: `Increase efficiency and revenue`
      }
    ],
    testimonials: [
      {
        quote: `This tool changed how we work. Highly recommended!`,
        name: "Local Business Owner",
        role: "Manager",
        businessType: "Small Business",
        rating: 5
      },
      {
        quote: `Finally, a tool that delivers on its promises.`,
        name: "Solopreneur",
        role: "Founder",
        businessType: "Startup",
        rating: 5
      }
    ]
  };
}

// ============================================
// MAIN
// ============================================
function generateExtendedSalesCopy() {
  console.log('🚀 Starting extended sales copy generation (PLACEHOLDER MODE)...\n');

  const salesCopyData = loadAppSalesCopy();
  const appsData = loadAppsData();

  const totalApps = appsData.length;
  console.log(`📊 Total apps to process: ${totalApps}\n`);

  const extended: any = {};
  const failedApps: string[] = [];

  for (let i = 0; i < totalApps; i++) {
    const app = appsData[i];
    const salesCopy = salesCopyData[app.id];
    
    if (!salesCopy) {
      console.warn(`⚠️  No tonality data for app: ${app.id} (${app.name}) - skipping`);
      failedApps.push(`${app.id} (no tonality)`);
      continue;
    }

    const tonality = salesCopy.tonality;
    
    try {
      const extendedCopy = generatePlaceholderCopy(app, tonality);
      extended[app.id] = extendedCopy;
      console.log(`✅ ${app.name} (${tonality})`);
    } catch (error: any) {
      console.error(`❌ Failed: ${app.name}`, error.message);
      failedApps.push(`${app.id} (${error.message})`);
    }
  }

  // Write output file
  const outputPath = path.join(__dirname, '../src/data/extendedSalesCopy.ts');
  const outputContent = `// Auto-generated extended sales copy for all apps\n` +
    `// Generated: ${new Date().toISOString()}\n` +
    `// Total: ${Object.keys(extended).length} / ${totalApps}\n\n` +
    `import type { ExtendedSalesCopy } from './appSalesCopy';\n\n` +
    `export const extendedSalesCopy: Record<string, ExtendedSalesCopy> = ${JSON.stringify(extended, null, 2)};\n`;

  fs.writeFileSync(outputPath, outputContent, 'utf-8');

  // Report
  console.log('\n' + '='.repeat(60));
  console.log('🎉 GENERATION COMPLETE (PLACEHOLDER)');
  console.log('='.repeat(60));
  console.log(`✅ Successfully generated: ${Object.keys(extended).length}/${totalApps}`);
  console.log(`❌ Failed: ${failedApps.length}`);
  
  if (failedApps.length > 0) {
    console.log('\nFailed apps:');
    failedApps.forEach(app => console.log(`  - ${app}`));
  }
  
  console.log(`\n📁 Output written to: ${outputPath}`);
  console.log('='.repeat(60) + '\n');
}

// Run
generateExtendedSalesCopy();
