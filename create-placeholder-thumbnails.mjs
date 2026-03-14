#!/usr/bin/env node

/**
 * Placeholder Thumbnail Generator
 * Creates SVG-based placeholder thumbnails that match the dashboard aesthetic
 * These serve as temporary placeholders until AI-generated images are created
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category colors matching the dashboard
const CATEGORY_COLORS = {
  video: { primary: '#22d3ee', rgb: '34,211,238' },
  branding: { primary: '#fbbf24', rgb: '251,191,36' },
  'lead-gen': { primary: '#fb923c', rgb: '251,146,60' },
  'ai-image': { primary: '#34d399', rgb: '52,211,153' },
  personalizer: { primary: '#38bdf8', rgb: '56,189,248' },
  creative: { primary: '#f87171', rgb: '248,113,113' }
};

function createSVGPlaceholder(width, height, category, title, id) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.video;
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const variant = hash % 3;

  // Create dark gradient background
  const gradients = [
    `<linearGradient id="bg${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
      <stop offset="60%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#050505;stop-opacity:1" />
    </linearGradient>`,

    `<linearGradient id="bg${id}" x1="145%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d0d;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#060606;stop-opacity:1" />
    </linearGradient>`,

    `<radialGradient id="bg${id}" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="70%" style="stop-color:#0d0d0d;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#050505;stop-opacity:1" />
    </radialGradient>`
  ];

  // Create glow effect
  const glowRadius = Math.min(width, height) * 0.6;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradients[variant]}

    <radialGradient id="glow${id}" cx="50%" cy="45%">
      <stop offset="0%" style="stop-color:${color.primary};stop-opacity:0.25" />
      <stop offset="40%" style="stop-color:${color.primary};stop-opacity:0.08" />
      <stop offset="70%" style="stop-color:${color.primary};stop-opacity:0" />
    </radialGradient>

    <filter id="blur${id}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg${id})"/>

  <!-- Glow effect -->
  <ellipse cx="${width/2}" cy="${height*0.45}" rx="${glowRadius}" ry="${glowRadius*0.8}" fill="url(#glow${id})"/>

  <!-- Pattern overlay -->
  <g opacity="0.15">
    ${variant === 0 ? createDotPattern(width, height, color.primary) : ''}
    ${variant === 1 ? createLinePattern(width, height, color.primary) : ''}
    ${variant === 2 ? createDiagonalPattern(width, height, color.primary) : ''}
  </g>

  <!-- Corner brackets -->
  <path d="M 24 12 L 12 12 L 12 24" stroke="${color.primary}" stroke-width="2" fill="none" opacity="0.35"/>
  <path d="M ${width-24} 12 L ${width-12} 12 L ${width-12} 24" stroke="${color.primary}" stroke-width="2" fill="none" opacity="0.35"/>
  <path d="M 24 ${height-12} L 12 ${height-12} L 12 ${height-24}" stroke="${color.primary}" stroke-width="2" fill="none" opacity="0.35"/>
  <path d="M ${width-24} ${height-12} L ${width-12} ${height-12} L ${width-12} ${height-24}" stroke="${color.primary}" stroke-width="2" fill="none" opacity="0.35"/>

  <!-- Center geometric shape -->
  ${variant === 0 ? `<circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)*0.12}" fill="none" stroke="${color.primary}" stroke-width="1.5" opacity="0.25"/>` : ''}
  ${variant === 1 ? `<rect x="${width/2-50}" y="${height/2-50}" width="100" height="100" fill="none" stroke="${color.primary}" stroke-width="1.5" opacity="0.25"/>` : ''}
  ${variant === 2 ? `<rect x="${width/2-40}" y="${height/2-40}" width="80" height="80" fill="none" stroke="${color.primary}" stroke-width="1.5" opacity="0.25" transform="rotate(45 ${width/2} ${height/2})"/>` : ''}

  <!-- Accent dots -->
  <circle cx="${width*0.2}" cy="${height*0.25}" r="3" fill="${color.primary}" opacity="0.4"/>
  <circle cx="${width*0.8}" cy="${height*0.65}" r="2.5" fill="${color.primary}" opacity="0.3"/>
  <circle cx="${width*0.35}" cy="${height*0.7}" r="2" fill="${color.primary}" opacity="0.25"/>

  <!-- Title overlay at bottom -->
  <rect x="0" y="${height-60}" width="${width}" height="60" fill="url(#titleGradient${id})"/>
  <linearGradient id="titleGradient${id}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
    <stop offset="100%" style="stop-color:rgba(0,0,0,0.75);stop-opacity:1" />
  </linearGradient>

  <text x="${width/2}" y="${height-20}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="rgba(255,255,255,0.65)" text-anchor="middle">${escapeXml(title)}</text>
</svg>`;
}

function createDotPattern(width, height, color) {
  let dots = '';
  const spacing = 28;
  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      dots += `<circle cx="${x + 2}" cy="${y + 2}" r="1.2" fill="${color}"/>`;
    }
  }
  return dots;
}

function createLinePattern(width, height, color) {
  let lines = '';
  const spacing = 36;
  for (let y = 0; y < height; y += spacing) {
    lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${color}" stroke-width="0.6"/>`;
  }
  for (let x = 0; x < width; x += spacing) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${color}" stroke-width="0.6"/>`;
  }
  return lines;
}

function createDiagonalPattern(width, height, color) {
  let lines = '';
  const spacing = 24;
  for (let i = -height; i < width + height; i += spacing) {
    lines += `<line x1="${i}" y1="0" x2="${i + height}" y2="${height}" stroke="${color}" stroke-width="0.6"/>`;
  }
  return lines;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

// App data
const APPS = [
  { id: 'video-creator', name: 'AI Video Creator', category: 'video' },
  { id: 'promo-generator', name: 'Promo Generator', category: 'video' },
  { id: 'landing-page', name: 'Landing Page Creator', category: 'lead-gen' },
  { id: 'ai-image-tools', name: 'AI Image Tools Collection', category: 'ai-image' },
  { id: 'rebrander-ai', name: 'RE-BRANDER AI', category: 'branding' },
  { id: 'business-brander', name: 'Business Brander Enterprise', category: 'branding' },
  { id: 'branding-analyzer', name: 'Business Branding Analyzer', category: 'branding' },
  { id: 'ai-branding', name: 'AI Branding Accelerator', category: 'branding' },
  { id: 'ai-sales', name: 'AI Sales Maximizer', category: 'branding' },
  { id: 'voice-coach', name: 'AI Voice Coach Pro', category: 'personalizer' },
  { id: 'resume-amplifier', name: 'AI Resume Amplifier', category: 'personalizer' },
  { id: 'storyboard', name: 'Storyboard AI', category: 'creative' },
  { id: 'sales-monetizer', name: 'AI Sales Monetizer', category: 'lead-gen' },
  { id: 'smart-presentations', name: 'Smart Presentations', category: 'creative' },
  { id: 'personalizer-recorder', name: 'AI Screen Recorder', category: 'personalizer' },
  { id: 'personalizer-profile', name: 'AI Profile Generator', category: 'personalizer' },
  { id: 'thumbnail-generator', name: 'AI Thumbnail Generator', category: 'personalizer' },
  { id: 'interactive-outros', name: 'Interactive Video Outros', category: 'creative' },
  { id: 'social-pack', name: 'Social Media Pack', category: 'creative' },
  { id: 'ai-art', name: 'AI Art Generator', category: 'ai-image' },
  { id: 'bg-remover', name: 'AI Background Remover', category: 'ai-image' },
  { id: 'text-to-speech', name: 'Text to Speech', category: 'video' },
  { id: 'niche-script', name: 'AI Niche Script Creator', category: 'video' },
  { id: 'ai-referral-maximizer', name: 'AI Referral Maximizer', category: 'lead-gen' },
  { id: 'smart-crm-closer', name: 'Smart CRM Closer', category: 'lead-gen' },
  { id: 'video-ai-editor', name: 'Video AI Editor', category: 'video' },
  { id: 'ai-video-image', name: 'AI Video & Image', category: 'ai-image' },
  { id: 'ai-skills-monetizer', name: 'AI Skills Monetizer', category: 'personalizer' },
  { id: 'ai-signature', name: 'AI Signature', category: 'personalizer' },
  { id: 'ai-template-generator', name: 'AI Template Generator', category: 'creative' },
  { id: 'funnelcraft-ai', name: 'FunnelCraft AI', category: 'lead-gen' },
  { id: 'interactive-shopping', name: 'Interactive Shopping', category: 'creative' },
  { id: 'personalizer-video-image-transformer', name: 'AI Video & Image Transformer', category: 'ai-image' },
  { id: 'personalizer-url-video-generation', name: 'URL Video Generation Templates & Editor', category: 'video' },
  { id: 'sales-assistant-app', name: 'Sales Assistant App', category: 'lead-gen' },
  { id: 'personalizer-text-ai-editor', name: 'Personalizer Text AI Editor', category: 'personalizer' },
  { id: 'personalizer-advanced-text-video-editor', name: 'Personalizer Advanced Text-Video AI Editor', category: 'personalizer' },
  { id: 'personalizer-writing-toolkit', name: 'Personalizer AI Writing Toolkit', category: 'personalizer' }
];

// Feature data
const FEATURES = [
  { id: 'ai-video-creator', name: 'AI Video Creator', category: 'video' },
  { id: 'ai-editing', name: 'AI-Powered Editing', category: 'video' },
  { id: 'smart-templates', name: 'Smart Templates', category: 'branding' },
  { id: 'content-repurposing', name: 'Content Repurposing', category: 'lead-gen' },
  { id: 'auto-captions', name: 'Automatic Captions', category: 'ai-image' },
  { id: 'collaboration', name: 'Team Collaboration', category: 'personalizer' }
];

async function generatePlaceholders() {
  console.log('Generating placeholder thumbnails...\n');

  // Create directories
  await fs.mkdir('public/thumbnails/apps', { recursive: true });
  await fs.mkdir('public/thumbnails/features', { recursive: true });

  // Generate app thumbnails (280x200 for cards)
  console.log('Apps:');
  for (const app of APPS) {
    const svg = createSVGPlaceholder(280, 200, app.category, app.name, app.id);
    const filePath = path.join(process.cwd(), 'public', 'thumbnails', 'apps', `${app.id}.svg`);
    await fs.writeFile(filePath, svg);
    console.log(`  ✓ ${app.name}`);
  }

  // Generate feature thumbnails (1400x788 for hero images)
  console.log('\nFeatures:');
  for (const feature of FEATURES) {
    const svg = createSVGPlaceholder(1400, 788, feature.category, feature.name, feature.id);
    const filePath = path.join(process.cwd(), 'public', 'thumbnails', 'features', `${feature.id}.svg`);
    await fs.writeFile(filePath, svg);
    console.log(`  ✓ ${feature.name}`);
  }

  console.log(`\n✓ Generated ${APPS.length + FEATURES.length} placeholder thumbnails`);
  console.log('\nThese SVG placeholders match your dashboard aesthetic.');
  console.log('Replace them with AI-generated images using the prompts in thumbnail-generation-data.json');
}

generatePlaceholders().catch(console.error);
