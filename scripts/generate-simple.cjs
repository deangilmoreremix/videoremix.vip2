#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Category to tonality mapping
const CATEGORY_TO_TONALITY = {
  "video": "Director",
  "ai-image": "Artist",
  "lead-gen": "Growth Hacker",
  "personalizer": "Psychologist",
  "creative": "Creative Genius",
  "ai-agents": "Steve Jobs",
  "branding": "Brand Strategist",
  "default": "Strategic Advisor"
};

// Load apps data
function loadAppsData() {
  const filePath = path.join(__dirname, '../src/data/appsData.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const apps = [];
  const regex = /id:\s*["']([^"']+)["'],\s*name:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["'],\s*category:\s*["']([^"']+)["']/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    apps.push({
      id: match[1],
      name: match[2],
      description: match[3],
      category: match[4]
    });
  }

  return apps;
}

// Generate sales copy
function generateSalesCopy(app) {
  const tonality = CATEGORY_TO_TONALITY[app.category] || CATEGORY_TO_TONALITY['default'];
  const tagline = `Transform Your ${app.category.charAt(0).toUpperCase() + app.category.slice(1)} with ${app.name}`;

  return {
    tonality,
    tagline,
    summary: `${app.name} revolutionizes ${app.category} workflows with AI-powered automation. Deliver professional results in minutes, not hours.`,
    whatItDoes: `${app.name} leverages advanced AI to streamline ${app.category} processes. It automates complex tasks, enhances quality, and scales your output exponentially.`,
    howItWorks: `First, input your requirements. The AI processes and optimizes. Finally, export professional results.`,
    howToProfit: {
      forLocalBusinesses: `Offer ${app.name} services to local businesses. Charge $300-1,000 per project. Generate $3,000-8,000 monthly.`,
      forIndividuals: `Freelance on platforms. Deliver projects for $50-300 each. Earn $1,000-4,000 monthly.`
    },
    whyYouNeedIt: `Manual ${app.category} work is time-consuming. ${app.name} automates the process, ensuring quality and speed.`,
    useCases: [
      {
        industry: app.category === 'video' ? 'Content Marketing' : app.category === 'ai-image' ? 'Design' : 'Business',
        scenario: `Streamline ${app.category} production`,
        outcome: `Reduce time by 70%, increase satisfaction by 40%`
      }
    ],
    testimonials: [
      {
        quote: `${app.name} transformed our workflow. We're delivering twice the work in half the time.`,
        name: 'Business Owner',
        role: 'Manager',
        businessType: 'Company',
        rating: 5
      }
    ]
  };
}

// Main
const apps = loadAppsData();
console.log(`Loaded ${apps.length} apps`);

const extended = {};
apps.forEach(app => {
  extended[app.id] = generateSalesCopy(app);
});

const outputPath = path.join(__dirname, '../src/data/extendedSalesCopy.ts');
const outputContent = `// Auto-generated extended sales copy for all apps
// Generated: ${new Date().toISOString()}
export const extendedSalesCopy = ${JSON.stringify(extended, null, 2)};
`;

fs.writeFileSync(outputPath, outputContent, 'utf-8');
console.log(`Generated sales copy for ${Object.keys(extended).length} apps`);