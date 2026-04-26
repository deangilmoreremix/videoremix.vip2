#!/usr/bin/env node

/**
 * AI Marketing Tools Thumbnail Generator
 * 
 * Uses the canvas library to generate professional thumbnails
 * following the "Neural Precision" design philosophy.
 */

import { createCanvas } from 'canvas';
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
  {
    id: 'ai-personalized-content',
    name: 'AI Personalized Content Hub',
    category: 'personalizer',
    icon: 'sparkles',
    accentColor: COLORS.coral
  },
  {
    id: 'funnelcraft-ai',
    name: 'FunnelCraft AI',
    category: 'lead-gen',
    icon: 'funnel',
    accentColor: COLORS.violet
  },
  {
    id: 'ai-skills-monetizer',
    name: 'AI Skills Monetizer',
    category: 'personalizer',
    icon: 'dollar',
    accentColor: COLORS.coral
  },
  {
    id: 'ai-skills-resume',
    name: 'AI Skills & Resume',
    category: 'personalizer',
    icon: 'document',
    accentColor: COLORS.cyan
  },
  {
    id: 'sales-page-builder',
    name: 'Sales Page Builder',
    category: 'lead-gen',
    icon: 'page',
    accentColor: COLORS.violet
  },
  {
    id: 'sales-assistant-pro',
    name: 'Sales Assistant Pro',
    category: 'lead-gen',
    icon: 'assistant',
    accentColor: COLORS.violet
  },
  {
    id: 'ai-personalization-studio',
    name: 'AI Personalization Studio',
    category: 'personalizer',
    icon: 'palette',
    accentColor: COLORS.coral
  },
  {
    id: 'ai-personalizer',
    name: 'AI Personalizer',
    category: 'personalizer',
    icon: 'target',
    accentColor: COLORS.cyan
  },
  {
    id: 'ai-video-transformer',
    name: 'AI Video Transformer',
    category: 'video',
    icon: 'video',
    accentColor: COLORS.coral
  },
  {
    id: 'ai-screen-recorder',
    name: 'AI Screen Recorder',
    category: 'video',
    icon: 'screen',
    accentColor: COLORS.cyan
  },
  {
    id: 'ai-signature',
    name: 'AI Signature',
    category: 'personalizer',
    icon: 'signature',
    accentColor: COLORS.violet
  },
  {
    id: 'ai-thumbnail-generator',
    name: 'AI Thumbnail Generator',
    category: 'personalizer',
    icon: 'image',
    accentColor: COLORS.coral
  },
  {
    id: 'profile-gen',
    name: 'Profile Gen',
    category: 'personalizer',
    icon: 'user',
    accentColor: COLORS.cyan
  },
  {
    id: 'ai-video-editor',
    name: 'AI Video Editor',
    category: 'video',
    icon: 'edit',
    accentColor: COLORS.coral
  },
  {
    id: 'ai-referral-maximizer-pro',
    name: 'AI Referral Maximizer Pro',
    category: 'lead-gen',
    icon: 'network',
    accentColor: COLORS.violet
  },
  {
    id: 'ai-sales-maximizer',
    name: 'AI Sales Maximizer',
    category: 'lead-gen',
    icon: 'chart',
    accentColor: COLORS.violet
  },
  {
    id: 'contentai',
    name: 'ContentAI',
    category: 'creative',
    icon: 'content',
    accentColor: COLORS.coral
  },
  {
    id: 'product-research-ai',
    name: 'Product Research AI',
    category: 'lead-gen',
    icon: 'research',
    accentColor: COLORS.cyan
  }
];

// Helper functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function drawGradientBackground(ctx, colors, steps = 20) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawGridPattern(ctx, opacity = 0.05) {
  ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawNeuralNetwork(ctx, centerX, centerY, radius, density = 0.3) {
  const nodes = [];
  const numNodes = Math.floor(12 * density);
  
  // Create nodes in a circular pattern
  for (let i = 0; i < numNodes; i++) {
    const angle = (i / numNodes) * Math.PI * 2;
    const r = radius * (0.3 + Math.random() * 0.7);
    nodes.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      size: 3 + Math.random() * 4
    });
  }
  
  // Draw connections
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (dist < radius * 0.8) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
  
  // Draw nodes
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.fill();
  });
  
  return nodes;
}

function drawIcon(ctx, iconType, x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  
  switch(iconType) {
    case 'sparkles':
      // Draw sparkles
      for (let i = 0; i < 3; i++) {
        const sx = x + (Math.random() - 0.5) * size * 0.8;
        const sy = y + (Math.random() - 0.5) * size * 0.8;
        const ssize = size * 0.15;
        
        ctx.beginPath();
        ctx.moveTo(sx - ssize, sy);
        ctx.lineTo(sx + ssize, sy);
        ctx.moveTo(sx, sy - ssize);
        ctx.lineTo(sx, sy + ssize);
        ctx.stroke();
        
        // Diagonal lines
        ctx.beginPath();
        ctx.moveTo(sx - ssize * 0.7, sy - ssize * 0.7);
        ctx.lineTo(sx + ssize * 0.7, sy + ssize * 0.7);
        ctx.moveTo(sx + ssize * 0.7, sy - ssize * 0.7);
        ctx.lineTo(sx - ssize * 0.7, sy + ssize * 0.7);
        ctx.stroke();
      }
      break;
      
    case 'funnel':
      // Draw funnel shape
      ctx.beginPath();
      ctx.moveTo(x - size * 0.4, y - size * 0.3);
      ctx.lineTo(x + size * 0.4, y - size * 0.3);
      ctx.lineTo(x + size * 0.15, y + size * 0.1);
      ctx.lineTo(x + size * 0.25, y + size * 0.4);
      ctx.lineTo(x - size * 0.25, y + size * 0.4);
      ctx.lineTo(x - size * 0.15, y + size * 0.1);
      ctx.closePath();
      ctx.stroke();
      break;
      
    case 'dollar':
      // Draw dollar sign
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', x, y);
      break;
      
    case 'document':
      // Draw document icon
      ctx.beginPath();
      ctx.moveTo(x - size * 0.3, y - size * 0.4);
      ctx.lineTo(x + size * 0.2, y - size * 0.4);
      ctx.lineTo(x + size * 0.3, y - size * 0.25);
      ctx.lineTo(x + size * 0.3, y + size * 0.4);
      ctx.lineTo(x - size * 0.3, y + size * 0.4);
      ctx.closePath();
      ctx.stroke();
      // Lines inside
      ctx.beginPath();
      ctx.moveTo(x - size * 0.15, y - size * 0.1);
      ctx.lineTo(x + size * 0.15, y - size * 0.1);
      ctx.moveTo(x - size * 0.15, y + size * 0.05);
      ctx.lineTo(x + size * 0.1, y + size * 0.05);
      ctx.stroke();
      break;
      
    case 'page':
      // Draw page with content
      ctx.beginPath();
      ctx.rect(x - size * 0.35, y - size * 0.4, size * 0.7, size * 0.8);
      ctx.stroke();
      // Content lines
      ctx.beginPath();
      ctx.moveTo(x - size * 0.2, y - size * 0.2);
      ctx.lineTo(x + size * 0.2, y - size * 0.2);
      ctx.moveTo(x - size * 0.2, y);
      ctx.lineTo(x + size * 0.15, y);
      ctx.moveTo(x - size * 0.2, y + size * 0.2);
      ctx.lineTo(x + size * 0.1, y + size * 0.2);
      ctx.stroke();
      break;
      
    case 'assistant':
      // Draw chat bubble
      ctx.beginPath();
      ctx.arc(x, y - size * 0.1, size * 0.35, Math.PI, 0);
      ctx.lineTo(x + size * 0.35, y + size * 0.2);
      ctx.lineTo(x + size * 0.15, y + size * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + size * 0.1, y + size * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.arc(x + size * 0.25, y + size * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'palette':
      // Draw color palette
      ctx.beginPath();
      ctx.arc(x - size * 0.25, y - size * 0.2, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.coral;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - size * 0.25, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.violet;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + size * 0.25, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.cyan;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - size * 0.15, y + size * 0.15, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.coral;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + size * 0.15, y + size * 0.2, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.violet;
      ctx.fill();
      break;
      
    case 'target':
      // Draw target/bullseye
      for (let i = 3; i >= 0; i--) {
        ctx.beginPath();
        ctx.arc(x, y, size * (0.15 + i * 0.15), 0, Math.PI * 2);
        ctx.stroke();
      }
      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'video':
      // Draw play button in rectangle
      ctx.beginPath();
      ctx.rect(x - size * 0.35, y - size * 0.25, size * 0.7, size * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - size * 0.1, y - size * 0.12);
      ctx.lineTo(x - size * 0.1, y + size * 0.12);
      ctx.lineTo(x + size * 0.15, y);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'screen':
      // Draw monitor
      ctx.beginPath();
      ctx.rect(x - size * 0.4, y - size * 0.3, size * 0.8, size * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - size * 0.15, y + size * 0.2);
      ctx.lineTo(x + size * 0.15, y + size * 0.2);
      ctx.lineTo(x + size * 0.25, y + size * 0.35);
      ctx.lineTo(x - size * 0.25, y + size * 0.35);
      ctx.closePath();
      ctx.stroke();
      break;
      
    case 'signature':
      // Draw signature line
      ctx.beginPath();
      ctx.moveTo(x - size * 0.35, y);
      ctx.bezierCurveTo(
        x - size * 0.2, y - size * 0.2,
        x + size * 0.1, y + size * 0.15,
        x + size * 0.35, y - size * 0.1
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - size * 0.35, y + size * 0.2);
      ctx.lineTo(x + size * 0.35, y + size * 0.2);
      ctx.stroke();
      break;
      
    case 'image':
      // Draw image frame
      ctx.beginPath();
      ctx.rect(x - size * 0.35, y - size * 0.25, size * 0.7, size * 0.5);
      ctx.stroke();
      // Mountain/sun inside
      ctx.beginPath();
      ctx.moveTo(x - size * 0.25, y + size * 0.1);
      ctx.lineTo(x - size * 0.05, y - size * 0.1);
      ctx.lineTo(x + size * 0.25, y + size * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + size * 0.15, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      break;
      
    case 'user':
      // Draw person silhouette
      ctx.beginPath();
      ctx.arc(x, y - size * 0.15, size * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y + size * 0.35, size * 0.25, Math.PI, 0);
      ctx.stroke();
      break;
      
    case 'edit':
      // Draw pencil
      ctx.beginPath();
      ctx.moveTo(x + size * 0.3, y - size * 0.3);
      ctx.lineTo(x - size * 0.2, y + size * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - size * 0.2, y + size * 0.2);
      ctx.lineTo(x - size * 0.35, y + size * 0.35);
      ctx.lineTo(x - size * 0.1, y + size * 0.25);
      ctx.stroke();
      break;
      
    case 'network':
      // Draw network nodes
      const netNodes = [
        { x: x, y: y - size * 0.3 },
        { x: x - size * 0.3, y: y + size * 0.1 },
        { x: x + size * 0.3, y: y + size * 0.1 },
        { x: x, y: y + size * 0.3 }
      ];
      // Connections
      ctx.beginPath();
      ctx.moveTo(netNodes[0].x, netNodes[0].y);
      ctx.lineTo(netNodes[1].x, netNodes[1].y);
      ctx.lineTo(netNodes[2].x, netNodes[2].y);
      ctx.lineTo(netNodes[0].x, netNodes[0].y);
      ctx.moveTo(netNodes[1].x, netNodes[1].y);
      ctx.lineTo(netNodes[3].x, netNodes[3].y);
      ctx.lineTo(netNodes[2].x, netNodes[2].y);
      ctx.stroke();
      // Node circles
      netNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
      
    case 'chart':
      // Draw bar chart
      const barWidth = size * 0.15;
      const barHeights = [0.4, 0.7, 0.5, 0.9];
      barHeights.forEach((h, i) => {
        ctx.beginPath();
        ctx.rect(
          x - size * 0.35 + i * (barWidth + size * 0.05),
          y + size * 0.3 - h * size,
          barWidth,
          h * size
        );
        ctx.stroke();
      });
      break;
      
    case 'content':
      // Draw content blocks
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.rect(
          x - size * 0.35,
          y - size * 0.3 + i * size * 0.25,
          size * 0.7,
          size * 0.18
        );
        ctx.stroke();
      }
      break;
      
    case 'research':
      // Draw magnifying glass
      ctx.beginPath();
      ctx.arc(x - size * 0.1, y - size * 0.1, size * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + size * 0.1, y + size * 0.1);
      ctx.lineTo(x + size * 0.3, y + size * 0.3);
      ctx.stroke();
      break;
      
    default:
      // Default circle
      ctx.beginPath();
      ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
  }
}

function drawAppName(ctx, name, x, y) {
  ctx.fillStyle = COLORS.white;
  ctx.font = '600 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add subtle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(name, x, y);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawCategoryLabel(ctx, category, x, y) {
  ctx.fillStyle = COLORS.lightGray;
  ctx.font = '400 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase(), x, y);
}

function drawGradientOverlay(ctx, startY, endY) {
  const gradient = ctx.createLinearGradient(0, startY, 0, endY);
  gradient.addColorStop(0, 'rgba(26, 26, 46, 0)');
  gradient.addColorStop(1, 'rgba(26, 26, 46, 0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, startY, WIDTH, endY - startY);
}

// Generate thumbnail for a single app
function generateThumbnail(app) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  drawGradientBackground(ctx, [COLORS.deepSpace, COLORS.indigo], 30);
  
  // Grid pattern
  drawGridPattern(ctx, 0.03);
  
  // Neural network decoration (top right area)
  drawNeuralNetwork(ctx, WIDTH * 0.75, HEIGHT * 0.25, 120, 0.25);
  
  // Central icon area - gradient circle
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2 - 40;
  const iconSize = 80;
  
  // Glow effect behind icon
  const glowGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, iconSize * 1.5
  );
  glowGradient.addColorStop(0, app.accentColor + '40');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(centerX - iconSize * 2, centerY - iconSize * 2, iconSize * 4, iconSize * 4);
  
  // Draw icon
  drawIcon(ctx, app.icon, centerX, centerY, iconSize, app.accentColor);
  
  // Decorative elements - floating shapes
  ctx.strokeStyle = app.accentColor + '30';
  ctx.lineWidth = 1;
  
  // Corner accents
  ctx.beginPath();
  ctx.moveTo(30, 30);
  ctx.lineTo(80, 30);
  ctx.lineTo(30, 80);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(WIDTH - 30, 30);
  ctx.lineTo(WIDTH - 80, 30);
  ctx.lineTo(WIDTH - 30, 80);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(30, HEIGHT - 30);
  ctx.lineTo(80, HEIGHT - 30);
  ctx.lineTo(30, HEIGHT - 80);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(WIDTH - 30, HEIGHT - 30);
  ctx.lineTo(WIDTH - 80, HEIGHT - 30);
  ctx.lineTo(WIDTH - 30, HEIGHT - 80);
  ctx.stroke();
  
  // Bottom gradient overlay for text
  drawGradientOverlay(ctx, HEIGHT - 150, HEIGHT);
  
  // App name
  drawAppName(ctx, app.name, centerX, HEIGHT - 70);
  
  // Category label
  drawCategoryLabel(ctx, app.category, centerX, HEIGHT - 40);
  
  // Add subtle noise texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
  for (let i = 0; i < 1000; i++) {
    const nx = Math.random() * WIDTH;
    const ny = Math.random() * HEIGHT;
    ctx.fillRect(nx, ny, 1, 1);
  }
  
  return canvas;
}

// Main generation function
async function generateAllThumbnails() {
  console.log('🎨 Generating AI Marketing Tools Thumbnails...\n');
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
      
      const canvas = generateThumbnail(app);
      const filename = `${app.id}.png`;
      const filepath = path.join(outputDir, filename);
      
      // Save as PNG
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filepath, buffer);
      
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
  
  console.log('\n🎉 Thumbnail generation complete!');
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
  
  console.log('\n📋 Next step: Update appsData.ts with these thumbnail URLs');
  
  return results;
}

// Run
generateAllThumbnails().catch(console.error);
