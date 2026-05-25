#!/usr/bin/env node

/**
 * AI Marketing Tools SVG Thumbnail Generator
 * 
 * Generates SVG thumbnails following the "Neural Precision" design philosophy.
 * SVGs can be used directly or converted to PNG.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thumbnail configuration
const WIDTH = 800;
const HEIGHT = 600;

// Color palette from "Neural Precision" philosophy
const COLORS = {
  deepSpace: '#1a1a2e',
  indigo: '#2d2a4a',
  violet: '#7c3aed',
  coral: '#f97316',
  cyan: '#06b6d4',
  white: '#ffffff',
  lightGray: '#94a3b8',
  darkGray: '#334155'
};

// App definitions with their visual characteristics
const apps = [
  { id: 'ai-personalized-content', name: 'AI Personalized Content Hub', category: 'personalizer', icon: 'sparkles', accentColor: '#f97316' },
  { id: 'funnelcraft-ai', name: 'FunnelCraft AI', category: 'lead-gen', icon: 'funnel', accentColor: '#7c3aed' },
  { id: 'ai-skills-monetizer', name: 'AI Skills Monetizer', category: 'personalizer', icon: 'dollar', accentColor: '#f97316' },
  { id: 'ai-skills-resume', name: 'AI Skills & Resume', category: 'personalizer', icon: 'document', accentColor: '#06b6d4' },
  { id: 'sales-page-builder', name: 'Sales Page Builder', category: 'lead-gen', icon: 'page', accentColor: '#7c3aed' },
  { id: 'sales-assistant-pro', name: 'Sales Assistant Pro', category: 'lead-gen', icon: 'assistant', accentColor: '#7c3aed' },
  { id: 'ai-personalization-studio', name: 'AI Personalization Studio', category: 'personalizer', icon: 'palette', accentColor: '#f97316' },
  { id: 'ai-personalizer', name: 'AI Personalizer', category: 'personalizer', icon: 'target', accentColor: '#06b6d4' },
  { id: 'ai-video-transformer', name: 'AI Video Transformer', category: 'video', icon: 'video', accentColor: '#f97316' },
  { id: 'ai-screen-recorder', name: 'AI Screen Recorder', category: 'video', icon: 'screen', accentColor: '#06b6d4' },
  { id: 'ai-signature', name: 'AI Signature', category: 'personalizer', icon: 'signature', accentColor: '#7c3aed' },
  { id: 'ai-thumbnail-generator', name: 'AI Thumbnail Generator', category: 'personalizer', icon: 'image', accentColor: '#f97316' },
  { id: 'profile-gen', name: 'Profile Gen', category: 'personalizer', icon: 'user', accentColor: '#06b6d4' },
  { id: 'ai-video-editor', name: 'AI Video Editor', category: 'video', icon: 'edit', accentColor: '#f97316' },
  { id: 'ai-referral-maximizer-pro', name: 'AI Referral Maximizer Pro', category: 'lead-gen', icon: 'network', accentColor: '#7c3aed' },
  { id: 'ai-sales-maximizer', name: 'AI Sales Maximizer', category: 'lead-gen', icon: 'chart', accentColor: '#7c3aed' },
  { id: 'contentai', name: 'ContentAI', category: 'creative', icon: 'content', accentColor: '#f97316' },
  { id: 'product-research-ai', name: 'Product Research AI', category: 'lead-gen', icon: 'research', accentColor: '#06b6d4' }
];

function generateIconSVG(iconType, size, color) {
  const iconSize = size * 0.5;
  
  const icons = {
    sparkles: `
      <g transform="translate(${size/2}, ${size/2})">
        <g stroke="${color}" stroke-width="2" fill="none">
          <line x1="-15" y1="-15" x2="15" y2="15" opacity="0.8"/>
          <line x1="15" y1="-15" x2="-15" y2="15" opacity="0.6"/>
          <line x1="0" y1="-20" x2="0" y2="20" opacity="0.7"/>
          <line x1="-20" y1="0" x2="20" y2="0" opacity="0.5"/>
        </g>
        <circle cx="0" cy="0" r="8" fill="${color}" opacity="0.9"/>
      </g>
    `,
    funnel: `
      <g transform="translate(${size/2}, ${size/2})">
        <path d="M-25,-25 L25,-25 L10,0 L15,25 L-15,25 L-10,0 Z" 
              stroke="${color}" stroke-width="2.5" fill="none"/>
      </g>
    `,
    dollar: `
      <g transform="translate(${size/2}, ${size/2})">
        <text x="0" y="10" text-anchor="middle" 
              font-family="Arial, sans-serif" font-weight="bold" font-size="50" fill="${color}">$</text>
      </g>
    `,
    document: `
      <g transform="translate(${size/2}, ${size/2})">
        <rect x="-25" y="-35" width="50" height="70" rx="3"
              stroke="${color}" stroke-width="2.5" fill="none"/>
        <line x1="-15" y1="-15" x2="15" y2="-15" stroke="${color}" stroke-width="2"/>
        <line x1="-15" y1="0" x2="10" y2="0" stroke="${color}" stroke-width="2"/>
        <line x1="-15" y1="15" x2="5" y2="15" stroke="${color}" stroke-width="2"/>
      </g>
    `,
    page: `
      <g transform="translate(${size/2}, ${size/2})">
        <rect x="-30" y="-35" width="60" height="70" rx="2"
              stroke="${color}" stroke-width="2.5" fill="none"/>
        <line x1="-20" y1="-15" x2="20" y2="-15" stroke="${color}" stroke-width="2"/>
        <line x1="-20" y1="0" x2="15" y2="0" stroke="${color}" stroke-width="2"/>
        <line x1="-20" y1="15" x2="10" y2="15" stroke="${color}" stroke-width="2"/>
      </g>
    `,
    assistant: `
      <g transform="translate(${size/2}, ${size/2})">
        <path d="M-30,-15 Q-30,-35 0,-35 Q30,-35 30,-15 L30,10 Q30,20 20,20 L5,20 L-10,35 L-10,20 L-20,20 Q-30,20 -30,10 Z"
              stroke="${color}" stroke-width="2.5" fill="none"/>
        <circle cx="-10" cy="-5" r="4" fill="${color}"/>
        <circle cx="8" cy="-5" r="4" fill="${color}"/>
      </g>
    `,
    palette: `
      <g transform="translate(${size/2}, ${size/2})">
        <circle cx="-18" cy="-12" r="10" fill="#f97316" opacity="0.9"/>
        <circle cx="0" cy="-18" r="10" fill="#7c3aed" opacity="0.9"/>
        <circle cx="18" cy="-8" r="10" fill="#06b6d4" opacity="0.9"/>
        <circle cx="-10" cy="12" r="10" fill="#f97316" opacity="0.7"/>
        <circle cx="10" cy="15" r="10" fill="#7c3aed" opacity="0.7"/>
      </g>
    `,
    target: `
      <g transform="translate(${size/2}, ${size/2})">
        <circle cx="0" cy="0" r="35" stroke="${color}" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="25" stroke="${color}" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="15" stroke="${color}" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="6" fill="${color}"/>
      </g>
    `,
    video: `
      <g transform="translate(${size/2}, ${size/2})">
        <rect x="-35" y="-22" width="70" height="44" rx="3"
              stroke="${color}" stroke-width="2.5" fill="none"/>
        <path d="M-8,-12 L-8,12 L15,0 Z" fill="${color}"/>
      </g>
    `,
    screen: `
      <g transform="translate(${size/2}, ${size/2})">
        <rect x="-40" y="-30" width="80" height="50" rx="3"
              stroke="${color}" stroke-width="2.5" fill="none"/>
        <line x1="-15" y1="20" x2="15" y2="20" stroke="${color}" stroke-width="2"/>
        <line x1="0" y1="20" x2="0" y2="32" stroke="${color}" stroke-width="2"/>
      </g>
    `,
    signature: `
      <g transform="translate(${size/2}, ${size/2})">
        <path d="M-35,0 Q-20,-25 0,0 T35,-10" 
              stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <line x1="-35" y1="20" x2="35" y2="20" stroke="${color}" stroke-width="2"/>
      </g>
    `,
    image: `
      <g transform="translate(${size/2}, ${size/2})">
        <rect x="-35" y="-25" width="70" height="50" rx="2"
              stroke="${color}" stroke-width="2.5" fill="none"/>
        <circle cx="-12" cy="-10" r="8" stroke="${color}" stroke-width="1.5" fill="none"/>
        <path d="M-30,20 L-10,-5 L5,15 L20,5 L30,20 Z" stroke="${color}" stroke-width="1.5" fill="none"/>
      </g>
    `,
    user: `
      <g transform="translate(${size/2}, ${size/2})">
        <circle cx="0" cy="-15" r="14" stroke="${color}" stroke-width="2.5" fill="none"/>
        <path d="M-30,40 Q-30,10 0,10 Q30,10 30,40" stroke="${color}" stroke-width="2.5" fill="none"/>
      </g>
    `,
    edit: `
      <g transform="translate(${size/2}, ${size/2})">
        <path d="M25,-25 L-15,25 L-25,35 L-15,25 L-5,15" 
              stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <line x1="-25" y1="35" x2="10" y2="0" stroke="${color}" stroke-width="2.5"/>
      </g>
    `,
    network: `
      <g transform="translate(${size/2}, ${size/2})">
        <line x1="0" y1="-25" x2="-25" y2="15" stroke="${color}" stroke-width="2"/>
        <line x1="0" y1="-25" x2="25" y2="15" stroke="${color}" stroke-width="2"/>
        <line x1="-25" y1="15" x2="0" y2="35" stroke="${color}" stroke-width="2"/>
        <line x1="25" y1="15" x2="0" y2="35" stroke="${color}" stroke-width="2"/>
        <circle cx="0" cy="-25" r="8" fill="${color}"/>
        <circle cx="-25" cy="15" r="8" fill="${color}"/>
        <circle cx="25" cy="15" r="8" fill="${color}"/>
        <circle cx="0" cy="35" r="8" fill="${color}"/>
      </g>
    `,
    chart: `
      <g transform="translate(${size/2}, ${size/2})">
        <rect x="-35" y="25" width="15" height="20" stroke="${color}" stroke-width="2" fill="none"/>
        <rect x="-15" y="5" width="15" height="40" stroke="${color}" stroke-width="2" fill="none"/>
        <rect x="5" y="15" width="15" height="30" stroke="${color}" stroke-width="2" fill="none"/>
        <rect x="25" y="-15" width="15" height="60" stroke="${color}" stroke-width="2" fill="none"/>
      </g>
    `,
    content: `
      <g transform="translate(${size/2}, ${size/2})">
        <rect x="-35" y="-30" width="70" height="18" rx="2" stroke="${color}" stroke-width="2" fill="none"/>
        <rect x="-35" y="-5" width="70" height="18" rx="2" stroke="${color}" stroke-width="2" fill="none"/>
        <rect x="-35" y="20" width="70" height="18" rx="2" stroke="${color}" stroke-width="2" fill="none"/>
      </g>
    `,
    research: `
      <g transform="translate(${size/2}, ${size/2})">
        <circle cx="-5" cy="-5" r="22" stroke="${color}" stroke-width="2.5" fill="none"/>
        <line x1="12" y1="12" x2="30" y2="30" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      </g>
    `
  };
  
  return icons[iconType] || icons.sparkles;
}

function generateNeuralSVG(centerX, centerY, radius) {
  return `
    <g opacity="0.25">
      <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.3}" fill="#7c3aed" opacity="0.3"/>
      <circle cx="${centerX - radius * 0.5}" cy="${centerY - radius * 0.3}" r="4" fill="#06b6d4"/>
      <circle cx="${centerX + radius * 0.4}" cy="${centerY - radius * 0.4}" r="3" fill="#06b6d4"/>
      <circle cx="${centerX - radius * 0.3}" cy="${centerY + radius * 0.4}" r="5" fill="#06b6d4"/>
      <circle cx="${centerX + radius * 0.5}" cy="${centerY + radius * 0.3}" r="4" fill="#06b6d4"/>
      <circle cx="${centerX}" cy="${centerY + radius * 0.5}" r="3" fill="#06b6d4"/>
      <line x1="${centerX - radius * 0.5}" y1="${centerY - radius * 0.3}" x2="${centerX + radius * 0.4}" y2="${centerY - radius * 0.4}" stroke="#7c3aed" stroke-width="1"/>
      <line x1="${centerX - radius * 0.5}" y1="${centerY - radius * 0.3}" x2="${centerX - radius * 0.3}" y2="${centerY + radius * 0.4}" stroke="#7c3aed" stroke-width="1"/>
      <line x1="${centerX + radius * 0.4}" y1="${centerY - radius * 0.4}" x2="${centerX + radius * 0.5}" y2="${centerY + radius * 0.3}" stroke="#7c3aed" stroke-width="1"/>
      <line x1="${centerX - radius * 0.3}" y1="${centerY + radius * 0.4}" x2="${centerX}" y2="${centerY + radius * 0.5}" stroke="#7c3aed" stroke-width="1"/>
      <line x1="${centerX + radius * 0.5}" y1="${centerY + radius * 0.3}" x2="${centerX}" y2="${centerY + radius * 0.5}" stroke="#7c3aed" stroke-width="1"/>
    </g>
  `;
}

function generateThumbnailSVG(app) {
  const accent = app.accentColor;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" 
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-${app.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#2d2a4a"/>
    </linearGradient>
    <radialGradient id="glow-${app.id}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0"/>
    </radialGradient>
    <filter id="noise-${app.id}">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend in="SourceGraphic" in2="noise" mode="multiply" result="blend"/>
      <feComposite in="blend" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg-${app.id})"/>
  
  <!-- Grid pattern -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    ${Array.from({length: 20}, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="${HEIGHT}"/>`).join('')}
    ${Array.from({length: 15}, (_, i) => `<line x1="0" y1="${i * 40}" x2="${WIDTH}" y2="${i * 40}"/>`).join('')}
  </g>
  
  <!-- Neural network decoration -->
  ${generateNeuralSVG(650, 120, 100)}
  
  <!-- Glow effect -->
  <ellipse cx="${WIDTH/2}" cy="${HEIGHT/2 - 30}" rx="150" ry="120" fill="url(#glow-${app.id})"/>
  
  <!-- Corner accents -->
  <g stroke="${accent}" stroke-width="2" fill="none" opacity="0.4">
    <path d="M30,30 L80,30 L30,80"/>
    <path d="M${WIDTH-30},30 L${WIDTH-80},30 L${WIDTH-30},80"/>
    <path d="M30,${HEIGHT-30} L80,${HEIGHT-30} L30,${HEIGHT-80}"/>
    <path d="M${WIDTH-30},${HEIGHT-30} L${WIDTH-80},${HEIGHT-30} L${WIDTH-30},${HEIGHT-80}"/>
  </g>
  
  <!-- Icon -->
  <g transform="translate(${WIDTH/2}, ${HEIGHT/2 - 40}) scale(1.2)">
    ${generateIconSVG(app.icon, 100, accent)}
  </g>
  
  <!-- Bottom gradient overlay -->
  <rect x="0" y="${HEIGHT - 140}" width="${WIDTH}" height="140" fill="url(#bg-${app.id})" opacity="0.85"/>
  <linearGradient id="textFade-${app.id}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:0"/>
    <stop offset="100%" style="stop-color:#1a1a2e"/>
  </linearGradient>
  <rect x="0" y="${HEIGHT - 140}" width="${WIDTH}" height="60" fill="url(#textFade-${app.id})"/>
  
  <!-- App name -->
  <text x="${WIDTH/2}" y="${HEIGHT - 70}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="28" 
        font-weight="600" 
        fill="white">${app.name}</text>
  
  <!-- Category label -->
  <text x="${WIDTH/2}" y="${HEIGHT - 40}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="14" 
        font-weight="400" 
        fill="#94a3b8" 
        letter-spacing="2">${app.category.toUpperCase()}</text>
  
  <!-- Noise texture overlay (very subtle) -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="rgba(255,255,255,0.01)" opacity="0.3"/>
</svg>`;
}

async function generateAllThumbnails() {
  console.log('🎨 Generating AI Marketing Tools SVG Thumbnails...\n');
  console.log(`📐 Canvas size: ${WIDTH}x${HEIGHT}`);
  console.log(`🎯 Design philosophy: "Neural Precision"\n`);
  
  const outputDir = path.join(__dirname, '../public/app-thumbnails');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const results = [];
  
  for (const app of apps) {
    try {
      console.log(`  Generating: ${app.name}...`);
      
      const svg = generateThumbnailSVG(app);
      const filename = `${app.id}.svg`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, svg, 'utf8');
      
      const url = `/app-thumbnails/${filename}`;
      results.push({
        id: app.id,
        name: app.name,
        filename,
        url,
        path: filepath
      });
      
      console.log(`    ✅ Saved: ${filename}`);
    } catch (error) {
      console.error(`    ❌ Error generating ${app.name}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 SVG Thumbnail generation complete!');
  console.log(`✅ Successfully generated: ${results.length} thumbnails`);
  console.log(`📁 Output directory: ${outputDir}`);
  
  // Generate metadata file
  const metadata = {
    generated: new Date().toISOString(),
    philosophy: 'Neural Precision',
    canvas: { width: WIDTH, height: HEIGHT },
    apps: results
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('\n📋 Thumbnail URLs for appsData.ts:');
  console.log('----------------------------------------');
  results.forEach(r => {
    console.log(`  "${r.id}": "${r.url}",`);
  });
  
  return results;
}

// Run
generateAllThumbnails().catch(console.error);
