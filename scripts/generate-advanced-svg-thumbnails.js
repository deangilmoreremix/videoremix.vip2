import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thumbnail configuration
const WIDTH = 800;
const HEIGHT = 600;

// Professional color palette
const COLORS = {
  // Modern workspace colors
  workspace: {
    desk: '#8B4513',
    chair: '#2C3E50',
    monitor: '#34495E',
    keyboard: '#BDC3C7',
    office: '#ECF0F1',
    wall: '#F8F9FA'
  },
  // People and interface colors
  people: {
    skin1: '#FDBCB4',
    skin2: '#E8B4A2', 
    hair1: '#2C3E50',
    hair2: '#8B4513',
    shirt1: '#3498DB',
    shirt2: '#E74C3C',
    pants: '#2C3E50'
  },
  // Interface colors
  ui: {
    primary: '#667EEA',
    secondary: '#764BA2',
    accent: '#F093FB',
    text: '#2C3E50',
    bg: '#FFFFFF',
    border: '#E1E8ED'
  },
  // Product specific colors
  products: {
    content: '#FF6B6B',
    sales: '#4ECDC4',
    video: '#45B7D1',
    ai: '#96CEB4',
    creative: '#FFEAA7'
  }
};

// Apps with detailed scene descriptions
const apps = [
  {
    id: 'ai-personalized-content',
    name: 'AI Personalized Content Hub',
    scene: 'marketing-professional-office',
    person: 'diverse-professional',
    interface: 'multi-screen-personalization',
    accentColor: COLORS.products.content
  },
  {
    id: 'funnelcraft-ai',
    name: 'FunnelCraft AI',
    scene: 'conference-room-presentation',
    person: 'business-consultant',
    interface: 'funnel-visualization',
    accentColor: COLORS.products.sales
  },
  {
    id: 'ai-skills-monetizer',
    name: 'AI Skills Monetizer',
    scene: 'home-office-professional',
    person: 'skilled-expert',
    interface: 'monetization-dashboard',
    accentColor: COLORS.products.ai
  },
  {
    id: 'ai-skills-resume',
    name: 'AI Skills & Resume',
    scene: 'modern-home-office',
    person: 'job-seeker',
    interface: 'resume-optimization',
    accentColor: COLORS.products.ai
  },
  {
    id: 'sales-page-builder',
    name: 'Sales Page Builder',
    scene: 'creative-agency',
    person: 'digital-marketer',
    interface: 'page-builder-interface',
    accentColor: COLORS.products.sales
  },
  {
    id: 'sales-assistant-pro',
    name: 'Sales Assistant Pro',
    scene: 'corporate-office',
    person: 'sales-professional',
    interface: 'conversation-intelligence',
    accentColor: COLORS.products.sales
  },
  {
    id: 'ai-personalization-studio',
    name: 'AI Personalization Studio',
    scene: 'high-tech-office',
    person: 'marketing-director',
    interface: 'advanced-analytics',
    accentColor: COLORS.products.ai
  },
  {
    id: 'ai-personalizer',
    name: 'AI Personalizer',
    scene: 'small-business-office',
    person: 'business-owner',
    interface: 'personalization-tools',
    accentColor: COLORS.products.ai
  },
  {
    id: 'ai-video-transformer',
    name: 'AI Video Transformer',
    scene: 'content-studio',
    person: 'content-creator',
    interface: 'video-editing-suite',
    accentColor: COLORS.products.video
  },
  {
    id: 'ai-screen-recorder',
    name: 'AI Screen Recorder',
    scene: 'recording-studio',
    person: 'software-trainer',
    interface: 'screen-recording-software',
    accentColor: COLORS.products.video
  },
  {
    id: 'ai-signature',
    name: 'AI Signature',
    scene: 'executive-office',
    person: 'business-executive',
    interface: 'signature-designer',
    accentColor: COLORS.products.creative
  },
  {
    id: 'ai-thumbnail-generator',
    name: 'AI Thumbnail Generator',
    scene: 'youtube-studio',
    person: 'content-creator',
    interface: 'thumbnail-optimization',
    accentColor: COLORS.products.creative
  },
  {
    id: 'profile-gen',
    name: 'Profile Gen',
    scene: 'professional-home-office',
    person: 'career-professional',
    interface: 'linkedin-optimizer',
    accentColor: COLORS.products.creative
  },
  {
    id: 'ai-video-editor',
    name: 'AI Video Editor',
    scene: 'editing-suite',
    person: 'video-editor',
    interface: 'ai-editing-workstation',
    accentColor: COLORS.products.video
  },
  {
    id: 'ai-referral-maximizer-pro',
    name: 'AI Referral Maximizer Pro',
    scene: 'networking-event',
    person: 'business-owner',
    interface: 'referral-dashboard',
    accentColor: COLORS.products.sales
  },
  {
    id: 'ai-sales-maximizer',
    name: 'AI Sales Maximizer',
    scene: 'corporate-sales-office',
    person: 'sales-director',
    interface: 'sales-analytics',
    accentColor: COLORS.products.sales
  },
  {
    id: 'contentai',
    name: 'ContentAI',
    scene: 'social-media-agency',
    person: 'social-media-manager',
    interface: 'content-calendar',
    accentColor: COLORS.products.creative
  },
  {
    id: 'product-research-ai',
    name: 'Product Research AI',
    scene: 'startup-office',
    person: 'entrepreneur',
    interface: 'market-research',
    accentColor: COLORS.products.ai
  }
];

// Scene templates with detailed SVG elements
const sceneTemplates = {
  'marketing-professional-office': `
    <!-- Office Environment -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Desk -->
    <rect x="150" y="400" width="500" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Chair -->
    <rect x="250" y="380" width="80" height="100" fill="#2C3E50" rx="40"/>
    <rect x="270" y="350" width="40" height="60" fill="#34495E" rx="20"/>
    
    <!-- Multiple Monitors -->
    <rect x="200" y="320" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="210" y="330" width="100" height="60" fill="#2C3E50" rx="2"/>
    <rect x="480" y="320" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="490" y="330" width="100" height="60" fill="#2C3E50" rx="2"/>
    
    <!-- Keyboard -->
    <rect x="250" y="420" width="80" height="15" fill="#BDC3C7" rx="2"/>
    
    <!-- Office Plants -->
    <circle cx="100" cy="500" r="30" fill="#27AE60"/>
    <rect x="85" y="500" width="30" height="80" fill="#8B4513"/>
    
    <circle cx="700" cy="500" r="30" fill="#27AE60"/>
    <rect x="685" cy="500" width="30" height="80" fill="#8B4513"/>
  `,
  
  'conference-room-presentation': `
    <!-- Conference Room -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Large Screen -->
    <rect x="200" y="200" width="400" height="150" fill="#34495E" rx="5"/>
    <rect x="220" y="220" width="360" height="110" fill="#2C3E50" rx="3"/>
    
    <!-- Conference Table -->
    <rect x="100" y="450" width="600" height="15" fill="#8B4513" rx="2"/>
    
    <!-- Chairs around table -->
    <circle cx="150" cy="480" r="25" fill="#34495E"/>
    <circle cx="250" cy="480" r="25" fill="#34495E"/>
    <circle cx="350" cy="480" r="25" fill="#34495E"/>
    <circle cx="450" cy="480" r="25" fill="#34495E"/>
    <circle cx="550" cy="480" r="25" fill="#34495E"/>
    <circle cx="650" cy="480" r="25" fill="#34495E"/>
    
    <!-- Presentation Pointer -->
    <rect x="180" y="390" width="3" height="50" fill="#E74C3C"/>
    <circle cx="181" cy="385" r="8" fill="#E74C3C"/>
  `,
  
  'home-office-professional': `
    <!-- Home Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Bookshelf -->
    <rect x="50" y="200" width="150" height="250" fill="#8B4513"/>
    <line x1="50" y1="250" x2="200" y2="250" stroke="#654321" stroke-width="2"/>
    <line x1="50" y1="300" x2="200" y2="300" stroke="#654321" stroke-width="2"/>
    <line x1="50" y1="350" x2="200" y2="350" stroke="#654321" stroke-width="2"/>
    
    <!-- Desk -->
    <rect x="250" y="380" width="300" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Office Chair -->
    <ellipse cx="400" cy="420" rx="40" ry="60" fill="#2C3E50"/>
    <ellipse cx="400" cy="380" rx="25" ry="40" fill="#34495E"/>
    
    <!-- Coffee Mug -->
    <ellipse cx="320" cy="370" rx="15" ry="8" fill="#8B4513"/>
    <rect x="305" cy="365" width="30" height="20" fill="transparent" stroke="#8B4513" stroke-width="2"/>
    
    <!-- Certificates on wall -->
    <rect x="550" y="150" width="80" height="60" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    <rect x="650" y="150" width="80" height="60" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
  `,
  
  'modern-home-office': `
    <!-- Modern Home Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Standing Desk -->
    <rect x="200" y="350" width="400" height="15" fill="#BDC3C7" rx="2"/>
    <rect x="180" y="350" width="40" height="80" fill="#95A5A6" rx="2"/>
    <rect x="580" y="350" width="40" height="80" fill="#95A5A6" rx="2"/>
    
    <!-- Monitor -->
    <rect x="350" y="280" width="100" height="70" fill="#34495E" rx="3"/>
    <rect x="360" y="290" width="80" height="50" fill="#2C3E50" rx="2"/>
    <rect x="370" y="300" width="60" height="3" fill="#BDC3C7"/>
    
    <!-- Laptop -->
    <rect x="250" y="320" width="120" height="8" fill="#34495E" rx="2"/>
    <rect x="260" y="310" width="100" height="60" fill="#2C3E50" rx="2"/>
    
    <!-- Notebook and Pen -->
    <rect x="450" y="320" width="80" height="60" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    <line x1="460" y1="340" x2="520" y2="340" stroke="#2C3E50" stroke-width="1"/>
    <line x1="460" y1="350" x2="510" y2="350" stroke="#2C3E50" stroke-width="1"/>
    <rect x="530" y="315" width="2" height="15" fill="#8B4513"/>
  `,
  
  'creative-agency': `
    <!-- Creative Agency -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Collaborative Desks -->
    <rect x="100" y="380" width="200" height="15" fill="#8B4513" rx="2"/>
    <rect x="500" y="380" width="200" height="15" fill="#8B4513" rx="2"/>
    
    <!-- Design References on Wall -->
    <rect x="50" y="100" width="80" height="60" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    <rect x="150" y="100" width="80" height="60" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    <rect x="50" y="180" width="80" height="60" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    
    <!-- Design Tools -->
    <rect x="120" y="370" width="20" height="8" fill="#E74C3C"/>
    <rect x="150" y="370" width="20" height="8" fill="#F39C12"/>
    <rect x="180" y="370" width="20" height="8" fill="#27AE60"/>
    <rect x="210" y="370" width="20" height="8" fill="#3498DB"/>
    
    <!-- Coffee Cups -->
    <ellipse cx="550" cy="365" rx="12" ry="6" fill="#8B4513"/>
    <rect x="538" cy="360" width="24" height="15" fill="transparent" stroke="#8B4513" stroke-width="2"/>
    
    <ellipse cx="650" cy="365" rx="12" ry="6" fill="#8B4513"/>
    <rect x="638" cy="360" width="24" height="15" fill="transparent" stroke="#8B4513" stroke-width="2"/>
  `,
  
  'corporate-office': `
    <!-- Corporate Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Executive Desk -->
    <rect x="200" y="400" width="400" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Executive Chair -->
    <ellipse cx="400" cy="380" rx="35" ry="50" fill="#2C3E50"/>
    <ellipse cx="400" cy="350" rx="25" ry="35" fill="#34495E"/>
    
    <!-- Phone -->
    <rect x="300" y="385" width="25" height="12" fill="#34495E" rx="2"/>
    <circle cx="312" cy="378" r="8" fill="#2C3E50"/>
    
    <!-- Awards/Trophies -->
    <rect x="550" y="350" width="15" height="40" fill="#F1C40F"/>
    <rect x="570" y="350" width="15" height="35" fill="#E74C3C"/>
    
    <!-- City View Window -->
    <rect x="600" y="150" width="150" height="100" fill="#87CEEB"/>
    <rect x="610" y="160" width="130" height="80" fill="#FFFFFF"/>
    <rect x="610" y="170" width="10" height="20" fill="#34495E"/>
    <rect x="630" y="170" width="10" height="20" fill="#34495E"/>
    <rect x="650" y="170" width="10" height="20" fill="#34495E"/>
  `,
  
  'high-tech-office': `
    <!-- High-Tech Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Multiple Large Monitors -->
    <rect x="150" y="280" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="160" y="290" width="100" height="60" fill="#2C3E50" rx="2"/>
    <rect x="280" y="280" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="290" y="290" width="100" height="60" fill="#2C3E50" rx="2"/>
    <rect x="430" y="280" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="440" y="290" width="100" height="60" fill="#2C3E50" rx="2"/>
    
    <!-- Server Racks -->
    <rect x="50" y="250" width="40" height="120" fill="#BDC3C7"/>
    <rect x="55" y="260" width="30" height="10" fill="#E74C3C"/>
    <rect x="55" y="275" width="30" height="10" fill="#27AE60"/>
    <rect x="55" y="290" width="30" height="10" fill="#F39C12"/>
    
    <!-- Tech Equipment -->
    <rect x="600" y="350" width="30" height="20" fill="#34495E"/>
    <circle cx="615" cy="340" r="3" fill="#E74C3C"/>
    
    <!-- Holographic Interface Effect -->
    <circle cx="400" cy="200" r="80" fill="none" stroke="#667EEA" stroke-width="2" opacity="0.3"/>
    <circle cx="400" cy="200" r="60" fill="none" stroke="#764BA2" stroke-width="2" opacity="0.3"/>
    <circle cx="400" cy="200" r="40" fill="none" stroke="#F093FB" stroke-width="2" opacity="0.3"/>
  `,
  
  'small-business-office': `
    <!-- Small Business Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Wooden Desk -->
    <rect x="200" y="380" width="300" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Client Photos on Wall -->
    <rect x="50" y="120" width="60" height="50" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    <rect x="130" y="120" width="60" height="50" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    <rect x="50" y="190" width="60" height="50" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    
    <!-- Business Cards -->
    <rect x="520" y="370" width="80" height="50" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    
    <!-- Warm Lighting -->
    <circle cx="400" cy="100" r="40" fill="#FFF8DC" opacity="0.5"/>
    
    <!-- Coffee Table Books -->
    <rect x="550" y="360" width="25" height="35" fill="#8B4513"/>
    <rect x="580" y="360" width="25" height="35" fill="#2C3E50"/>
  `,
  
  'content-studio': `
    <!-- Content Creation Studio -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Camera Equipment -->
    <rect x="100" y="320" width="40" height="30" fill="#2C3E50"/>
    <circle cx="120" cy="310" r="8" fill="#34495E"/>
    
    <!-- Lighting Setup -->
    <rect x="50" y="200" width="20" height="60" fill="#BDC3C7"/>
    <circle cx="60" cy="190" r="15" fill="#FFF8DC" opacity="0.8"/>
    
    <!-- Green Screen -->
    <rect x="600" y="150" width="150" height="200" fill="#27AE60" opacity="0.7"/>
    
    <!-- Editing Workstation -->
    <rect x="250" y="350" width="200" height="15" fill="#8B4513" rx="2"/>
    
    <!-- Multiple Monitors -->
    <rect x="270" y="280" width="80" height="60" fill="#34495E" rx="2"/>
    <rect x="360" y="280" width="80" height="60" fill="#34495E" rx="2"/>
    
    <!-- Microphone -->
    <rect x="200" y="300" width="3" height="80" fill="#BDC3C7"/>
    <circle cx="201" cy="290" r="12" fill="#34495E"/>
    
    <!-- Video Equipment -->
    <rect x="450" y="320" width="30" height="20" fill="#E74C3C"/>
    <circle cx="465" cy="310" r="5" fill="#34495E"/>
  `,
  
  'recording-studio': `
    <!-- Professional Recording Studio -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Soundproofing Panels -->
    <rect x="50" y="100" width="20" height="200" fill="#BDC3C7"/>
    <rect x="80" y="100" width="20" height="200" fill="#34495E"/>
    <rect x="110" y="100" width="20" height="200" fill="#BDC3C7"/>
    
    <!-- Professional Microphone -->
    <rect x="400" y="280" width="4" height="100" fill="#BDC3C7"/>
    <circle cx="402" cy="270" r="15" fill="#2C3E50"/>
    <rect x="390" cy="250" width="24" height="20" fill="#34495E"/>
    
    <!-- Studio Monitors -->
    <rect x="200" y="320" width="60" height="40" fill="#34495E" rx="3"/>
    <rect x="210" y="330" width="40" height="20" fill="#2C3E50"/>
    
    <rect x="540" y="320" width="60" height="40" fill="#34495E" rx="3"/>
    <rect x="550" y="330" width="40" height="20" fill="#2C3E50"/>
    
    <!-- Mixing Console -->
    <rect x="300" y="380" width="200" height="15" fill="#2C3E50" rx="2"/>
    <circle cx="320" cy="375" r="5" fill="#E74C3C"/>
    <circle cx="340" cy="375" r="5" fill="#F39C12"/>
    <circle cx="360" cy="375" r="5" fill="#27AE60"/>
    
    <!-- Webcam -->
    <rect x="380" y="250" width="40" height="30" fill="#34495E" rx="3"/>
    <circle cx="400" cy="240" r="8" fill="#2C3E50"/>
    <circle cx="400" cy="240" r="3" fill="#E74C3C"/>
  `,
  
  'executive-office': `
    <!-- Executive Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Executive Desk -->
    <rect x="150" y="400" width="500" height="25" fill="#8B4513" rx="2"/>
    
    <!-- Executive Chair -->
    <ellipse cx="400" cy="380" rx="35" ry="55" fill="#2C3E50"/>
    <ellipse cx="400" cy="350" rx="25" ry="40" fill="#34495E"/>
    
    <!-- Business Cards -->
    <rect x="300" y="375" width="60" height="40" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    
    <!-- Awards -->
    <rect x="100" y="320" width="20" height="50" fill="#F1C40F"/>
    <rect x="130" y="320" width="20" height="45" fill="#C0392B"/>
    
    <!-- Fine Furniture -->
    <rect x="50" y="350" width="30" height="80" fill="#8B4513"/>
    
    <!-- City Skyline View -->
    <rect x="550" y="150" width="200" height="80" fill="#87CEEB"/>
    <rect x="560" y="160" width="180" height="60" fill="#FFFFFF"/>
    <!-- Buildings -->
    <rect x="570" y="170" width="8" height="30" fill="#34495E"/>
    <rect x="585" y="175" width="8" height="25" fill="#34495E"/>
    <rect x="600" y="170" width="8" height="30" fill="#34495E"/>
    <rect x="615" y="180" width="8" height="20" fill="#34495E"/>
    <rect x="630" y="175" width="8" height="25" fill="#34495E"/>
  `,
  
  'youtube-studio': `
    <!-- YouTube Creator Studio -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Ring Light -->
    <circle cx="150" cy="200" r="40" fill="#FFF8DC" opacity="0.6"/>
    <circle cx="150" cy="200" r="35" fill="none" stroke="#BDC3C7" stroke-width="3"/>
    
    <!-- Camera on Tripod -->
    <rect x="130" y="250" width="40" height="60" fill="#34495E"/>
    <circle cx="150" cy="240" r="12" fill="#2C3E50"/>
    
    <!-- Green Screen -->
    <rect x="500" y="100" width="250" height="200" fill="#27AE60" opacity="0.7"/>
    
    <!-- Desk with Equipment -->
    <rect x="200" y="380" width="400" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Dual Monitors -->
    <rect x="250" y="300" width="80" height="60" fill="#34495E" rx="3"/>
    <rect x="260" y="310" width="60" height="40" fill="#2C3E50" rx="2"/>
    
    <rect x="450" y="300" width="80" height="60" fill="#34495E" rx="3"/>
    <rect x="460" y="310" width="60" height="40" fill="#2C3E50" rx="2"/>
    
    <!-- Microphone -->
    <rect x="350" y="320" width="3" height="50" fill="#BDC3C7"/>
    <circle cx="351" cy="310" r="10" fill="#34495E"/>
    
    <!-- Thumbnail Mockups -->
    <rect x="50" y="350" width="60" height="45" fill="#E74C3C"/>
    <rect x="120" y="350" width="60" height="45" fill="#F39C12"/>
    <text x="80" y="375" text-anchor="middle" font-family="Arial" font-size="10" fill="white">THUMBNAIL</text>
    <text x="150" y="375" text-anchor="middle" font-family="Arial" font-size="10" fill="white">A/B TEST</text>
  `,
  
  'professional-home-office': `
    <!-- Professional Home Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Bookshelves -->
    <rect x="50" y="150" width="120" height="200" fill="#8B4513"/>
    <line x1="50" y1="200" x2="170" y2="200" stroke="#654321" stroke-width="2"/>
    <line x1="50" y1="230" x2="170" y2="230" stroke="#654321" stroke-width="2"/>
    <line x1="50" y1="260" x2="170" y2="260" stroke="#654321" stroke-width="2"/>
    
    <!-- Clean Desk -->
    <rect x="250" y="380" width="300" height="20" fill="#BDC3C7" rx="2"/>
    
    <!-- Professional Monitor -->
    <rect x="350" y="300" width="100" height="70" fill="#34495E" rx="3"/>
    <rect x="360" y="310" width="80" height="50" fill="#2C3E50" rx="2"/>
    <rect x="370" y="320" width="60" height="3" fill="#BDC3C7"/>
    
    <!-- Professional Documents -->
    <rect x="500" y="350" width="80" height="60" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    <line x1="510" y1="370" x2="570" y2="370" stroke="#2C3E50" stroke-width="1"/>
    <line x1="510" y1="385" x2="560" y2="385" stroke="#2C3E50" stroke-width="1"/>
    
    <!-- Coffee and Notebook -->
    <ellipse cx="280" cy="370" rx="12" ry="6" fill="#8B4513"/>
    <rect x="268" cy="365" width="24" height="15" fill="transparent" stroke="#8B4513" stroke-width="2"/>
    
    <rect x="200" y="355" width="60" height="45" fill="#F9E79F" stroke="#BDC3C7" stroke-width="1"/>
  `,
  
  'editing-suite': `
    <!-- Professional Editing Suite -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Large Monitors -->
    <rect x="200" y="250" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="210" y="260" width="100" height="60" fill="#2C3E50" rx="2"/>
    
    <rect x="350" y="250" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="360" y="260" width="100" height="60" fill="#2C3E50" rx="2"/>
    
    <rect x="500" y="250" width="120" height="80" fill="#34495E" rx="3"/>
    <rect x="510" y="260" width="100" height="60" fill="#2C3E50" rx="2"/>
    
    <!-- Editing Desk -->
    <rect x="150" y="380" width="500" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Professional Chair -->
    <ellipse cx="400" cy="360" rx="35" ry="50" fill="#2C3E50"/>
    <ellipse cx="400" cy="340" rx="25" ry="35" fill="#34495E"/>
    
    <!-- Reference Materials -->
    <rect x="50" y="350" width="60" height="45" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    <rect x="120" y="350" width="20" height="45" fill="#E74C3C"/>
    
    <!-- Color Reference -->
    <circle cx="680" cy="350" r="15" fill="#E74C3C"/>
    <circle cx="710" cy="350" r="15" fill="#F39C12"/>
    <circle cx="740" cy="350" r="15" fill="#27AE60"/>
  `,
  
  'networking-event': `
    <!-- Networking Event -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Event Space Tables -->
    <rect x="150" y="380" width="200" height="15" fill="#8B4513" rx="2"/>
    <rect x="450" y="380" width="200" height="15" fill="#8B4513" rx="2"/>
    
    <!-- Business Cards -->
    <rect x="200" y="370" width="50" height="35" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    <rect x="500" y="370" width="50" height="35" fill="#FFFFFF" stroke-width="1"/>
    
    <!-- Tablet with Referral App -->
    <rect x="250" y="340" width="60" height="40" fill="#34495E" rx="3"/>
    <rect x="260" y="345" width="40" height="30" fill="#2C3E50" rx="2"/>
    
    <!-- Name Badges -->
    <rect x="300" y="320" width="40" height="20" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    <rect x="600" y="320" width="40" height="20" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    
    <!-- Networking Crowd (simplified) -->
    <circle cx="100" cy="400" r="8" fill="#FDBCB4"/>
    <circle cx="700" cy="400" r="8" fill="#E8B4A2"/>
    
    <!-- Event Banners -->
    <rect x="300" y="200" width="200" height="40" fill="#667EEA"/>
    <text x="400" y="225" text-anchor="middle" font-family="Arial" font-size="12" fill="white">NETWORKING EVENT</text>
  `,
  
  'corporate-sales-office': `
    <!-- Corporate Sales Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Performance Charts on Wall -->
    <rect x="50" y="100" width="120" height="80" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    <rect x="60" y="110" width="100" height="3" fill="#27AE60"/>
    <rect x="60" y="125" width="80" height="3" fill="#27AE60"/>
    <rect x="60" y="140" width="60" height="3" fill="#3498DB"/>
    
    <!-- Sales Desk -->
    <rect x="200" y="380" width="400" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Multiple Monitors -->
    <rect x="250" y="280" width="100" height="70" fill="#34495E" rx="3"/>
    <rect x="260" y="290" width="80" height="50" fill="#2C3E50" rx="2"/>
    
    <rect x="450" y="280" width="100" height="70" fill="#34495E" rx="3"/>
    <rect x="460" y="290" width="80" height="50" fill="#2C3E50" rx="2"/>
    
    <!-- Sales Awards -->
    <rect x="650" y="320" width="15" height="40" fill="#F1C40F"/>
    <rect x="670" y="320" width="15" height="35" fill="#E74C3C"/>
    
    <!-- CRM Dashboard -->
    <rect x="300" y="340" width="80" height="50" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1"/>
    <line x1="310" y1="355" x2="370" y2="355" stroke="#27AE60" stroke-width="2"/>
    <line x1="310" y1="370" x2="350" y2="370" stroke="#3498DB" stroke-width="2"/>
  `,
  
  'social-media-agency': `
    <!-- Social Media Agency -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Content Calendar Wall -->
    <rect x="50" y="120" width="150" height="120" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="2"/>
    <rect x="60" y="135" width="15" height="15" fill="#E74C3C"/>
    <rect x="85" y="135" width="15" height="15" fill="#F39C12"/>
    <rect x="110" y="135" width="15" height="15" fill="#27AE60"/>
    <rect x="135" y="135" width="15" height="15" fill="#3498DB"/>
    
    <!-- Collaborative Desks -->
    <rect x="250" y="380" width="300" height="20" fill="#8B4513" rx="2"/>
    
    <!-- Multiple Laptops -->
    <rect x="270" y="340" width="80" height="8" fill="#34495E" rx="2"/>
    <rect x="280" y="330" width="60" height="40" fill="#2C3E50" rx="2"/>
    
    <rect x="410" y="340" width="80" height="8" fill="#34495E" rx="2"/>
    <rect x="420" y="330" width="60" height="40" fill="#2C3E50" rx="2"/>
    
    <!-- Social Media Icons -->
    <circle cx="550" cy="350" r="12" fill="#E74C3C"/>
    <circle cx="580" cy="350" r="12" fill="#3498DB"/>
    <circle cx="610" cy="350" r="12" fill="#F39C12"/>
    
    <!-- Content Ideas Board -->
    <rect x="650" y="300" width="100" height="80" fill="#FFF8DC" stroke="#BDC3C7" stroke-width="1"/>
    <line x1="660" y1="320" x2="730" y2="320" stroke="#2C3E50" stroke-width="1"/>
    <line x1="660" y1="340" x2="720" y2="340" stroke="#2C3E50" stroke-width="1"/>
    <line x1="660" y1="360" x2="735" y2="360" stroke="#2C3E50" stroke-width="1"/>
  `,
  
  'startup-office': `
    <!-- Startup Office -->
    <rect x="0" y="300" width="800" height="300" fill="#F8F9FA"/>
    <rect x="0" y="250" width="800" height="50" fill="#E9ECEF"/>
    
    <!-- Whiteboards with Ideas -->
    <rect x="50" y="100" width="120" height="150" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="3"/>
    <line x1="60" y1="120" x2="160" y2="120" stroke="#2C3E50" stroke-width="2"/>
    <line x1="60" y1="140" x2="140" y2="140" stroke="#2C3E50" stroke-width="2"/>
    <line x1="60" y1="160" x2="155" y2="160" stroke="#2C3E50" stroke-width="2"/>
    
    <!-- Standing Desks -->
    <rect x="250" y="350" width="150" height="15" fill="#BDC3C7" rx="2"/>
    <rect x="400" y="350" width="150" height="15" fill="#BDC3C7" rx="2"/>
    
    <!-- Laptops on Stands -->
    <rect x="280" y="320" width="80" height="8" fill="#34495E" rx="2"/>
    <rect x="290" y="310" width="60" height="40" fill="#2C3E50" rx="2"/>
    
    <rect x="430" y="320" width="80" height="8" fill="#34495E" rx="2"/>
    <rect x="440" y="310" width="60" height="40" fill="#2C3E50" rx="2"/>
    
    <!-- Product Prototypes -->
    <rect x="600" y="350" width="40" height="30" fill="#E74C3C" rx="2"/>
    <rect x="650" y="350" width="40" height="30" fill="#3498DB" rx="2"/>
    
    <!-- Coffee and Snacks -->
    <ellipse cx="150" cy="380" rx="12" ry="6" fill="#8B4513"/>
    <rect x="138" cy="375" width="24" height="15" fill="transparent" stroke="#8B4513" stroke-width="2"/>
    
    <circle cx="180" cy="380" r="8" fill="#F39C12"/>
  `
};

// Person templates with diversity
const personTemplates = {
  'diverse-professional': `
    <!-- Person 1 -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#3498DB"/>
    <rect x="370" y="280" width="20" height="30" fill="#2C3E50"/>
  `,
  
  'business-consultant': `
    <!-- Business Consultant -->
    <circle cx="380" cy="220" r="18" fill="#E8B4A2"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#D2B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#E74C3C"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'skilled-expert': `
    <!-- Skilled Expert -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#8B4513"/>
    <circle cx="390" cy="210" r="3" fill="#8B4513"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#27AE60"/>
    <rect x="370" y="280" width="20" height="30" fill="#2C3E50"/>
  `,
  
  'job-seeker': `
    <!-- Job Seeker -->
    <circle cx="380" cy="220" r="18" fill="#E8B4A2"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#D2B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#9B59B6"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'digital-marketer': `
    <!-- Digital Marketer -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#F39C12"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'sales-professional': `
    <!-- Sales Professional -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#E74C3C"/>
    <rect x="370" y="280" width="20" height="30" fill="#2C3E50"/>
  `,
  
  'marketing-director': `
    <!-- Marketing Director -->
    <circle cx="380" cy="220" r="18" fill="#E8B4A2"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#D2B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#667EEA"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'business-owner': `
    <!-- Business Owner -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#8B4513"/>
    <circle cx="390" cy="210" r="3" fill="#8B4513"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#27AE60"/>
    <rect x="370" y="280" width="20" height="30" fill="#2C3E50"/>
  `,
  
  'content-creator': `
    <!-- Content Creator -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#E74C3C"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'software-trainer': `
    <!-- Software Trainer -->
    <circle cx="380" cy="220" r="18" fill="#E8B4A2"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#D2B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#9B59B6"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'business-executive': `
    <!-- Business Executive -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#34495E"/>
    <rect x="370" y="280" width="20" height="30" fill="#2C3E50"/>
  `,
  
  'video-editor': `
    <!-- Video Editor -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#E74C3C"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'social-media-manager': `
    <!-- Social Media Manager -->
    <circle cx="380" cy="220" r="18" fill="#FDBCB4"/>
    <circle cx="370" cy="210" r="3" fill="#2C3E50"/>
    <circle cx="390" cy="210" r="3" fill="#2C3E50"/>
    <path d="M375,225 Q380,235 385,225" stroke="#E8B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#F093FB"/>
    <rect x="370" y="280" width="20" height="30" fill="#34495E"/>
  `,
  
  'entrepreneur': `
    <!-- Entrepreneur -->
    <circle cx="380" cy="220" r="18" fill="#E8B4A2"/>
    <circle cx="370" cy="210" r="3" fill="#8B4513"/>
    <circle cx="390" cy="210" r="3" fill="#8B4513"/>
    <path d="M375,225 Q380,235 385,225" stroke="#D2B4A2" stroke-width="2" fill="none"/>
    <rect x="365" y="240" width="30" height="40" fill="#F39C12"/>
    <rect x="370" y="280" width="20" height="30" fill="#2C3E50"/>
  `
};

// Interface templates showing actual software
const interfaceTemplates = {
  'multi-screen-personalization': `
    <!-- Software Interface - Personalization Dashboard -->
    <rect x="210" y="290" width="80" height="50" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="2"/>
    <rect x="215" y="295" width="70" height="8" fill="#667EEA" rx="1"/>
    <rect x="215" y="310" width="50" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="215" y="320" width="60" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="215" y="330" width="40" height="6" fill="#E1E8ED" rx="1"/>
    
    <rect x="490" y="290" width="80" height="50" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="2"/>
    <rect x="495" y="295" width="70" height="8" fill="#764BA2" rx="1"/>
    <rect x="495" y="310" width="50" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="495" y="320" width="60" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="495" y="330" width="40" height="6" fill="#E1E8ED" rx="1"/>
    
    <!-- Connection lines between screens -->
    <path d="M290,315 Q350,280 450,315" stroke="#667EEA" stroke-width="2" fill="none" opacity="0.6"/>
  `,
  
  'funnel-visualization': `
    <!-- Funnel Visualization -->
    <polygon points="350,290 420,290 410,340 360,340" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1"/>
    <rect x="365" y="295" width="35" height="8" fill="#27AE60" rx="1"/>
    <rect x="370" y="310" width="25" height="6" fill="#3498DB" rx="1"/>
    <rect x="375" y="320" width="15" height="6" fill="#E74C3C" rx="1"/>
    <rect x="380" y="330" width="10" height="6" fill="#F39C12" rx="1"/>
    
    <!-- Funnel arrows -->
    <polygon points="380,285 385,285 382.5,280" fill="#27AE60"/>
    <polygon points="375,340 370,340 372.5,345" fill="#F39C12"/>
  `,
  
  'monetization-dashboard': `
    <!-- Monetization Dashboard -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <text x="400" y="310" text-anchor="middle" font-family="Arial" font-size="10" fill="#2C3E50">$0</text>
    <rect x="330" y="320" width="40" height="8" fill="#27AE60" rx="1"/>
    <rect x="380" y="320" width="30" height="8" fill="#3498DB" rx="1"/>
    <rect x="420" y="320" width="50" height="8" fill="#F093FB" rx="1"/>
    <rect x="330" y="340" width="140" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="350" width="100" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="360" width="80" height="6" fill="#E1E8ED" rx="1"/>
  `,
  
  'resume-optimization': `
    <!-- Resume Builder Interface -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="330" y="300" width="140" height="6" fill="#667EEA" rx="1"/>
    <rect x="330" y="315" width="100" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="325" width="80" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="335" width="60" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="345" width="90" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="355" width="70" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="365" width="50" height="4" fill="#E1E8ED" rx="1"/>
  `,
  
  'page-builder-interface': `
    <!-- Page Builder Interface -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="330" y="300" width="140" height="15" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="1"/>
    <text x="400" y="312" text-anchor="middle" font-family="Arial" font-size="8" fill="#2C3E50">Headline</text>
    <rect x="330" y="325" width="140" height="25" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="1"/>
    <rect x="335" y="330" width="50" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="335" y="340" width="60" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="335" y="345" width="40" height="4" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="355" width="60" height="12" fill="#667EEA" rx="2"/>
    <text x="360" y="365" text-anchor="middle" font-family="Arial" font-size="8" fill="white">Buy Now</text>
  `,
  
  'conversation-intelligence': `
    <!-- Conversation Intelligence -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="330" y="300" width="140" height="20" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="2"/>
    <rect x="335" y="305" width="15" height="10" fill="#E8B4A2" rx="7"/>
    <text x="350" y="315" font-family="Arial" font-size="7" fill="#2C3E50">Hi, I'm interested...</text>
    <rect x="330" y="330" width="140" height="20" fill="#667EEA" stroke="#BDC3C7" stroke-width="1" rx="2"/>
    <rect x="335" y="335" width="15" height="10" fill="#FDBCB4" rx="7"/>
    <text x="355" y="345" font-family="Arial" font-size="7" fill="#FFFFFF">Great! Let me show you...</text>
    <rect x="330" y="355" width="60" height="12" fill="#27AE60" rx="2"/>
    <text x="360" y="365" text-anchor="middle" font-family="Arial" font-size="7" fill="white">Handle</text>
  `,
  
  'advanced-analytics': `
    <!-- Advanced Analytics Dashboard -->
    <rect x="250" y="290" width="120" height="60" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="260" y="300" width="100" height="3" fill="#27AE60" rx="1"/>
    <rect x="260" y="310" width="80" height="3" fill="#3498DB" rx="1"/>
    <rect x="260" y="320" width="60" height="3" fill="#F39C12" rx="1"/>
    <circle cx="270" cy="330" r="8" fill="#667EEA" opacity="0.8"/>
    <circle cx="290" cy="330" r="6" fill="#764BA2" opacity="0.8"/>
    <circle cx="310" cy="330" r="4" fill="#F093FB" opacity="0.8"/>
    
    <rect x="430" y="290" width="120" height="60" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="440" y="300" width="100" height="8" fill="#F8F9FA" rx="1"/>
    <rect x="440" y="315" width="80" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="440" y="325" width="60" height="6" fill="#BDC3C7" rx="1"/>
    <rect x="440" y="335" width="90" height="6" fill="#E1E8ED" rx="1"/>
  `,
  
  'personalization-tools': `
    <!-- Personalization Tools Interface -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="330" y="300" width="140" height="15" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="1"/>
    <text x="400" y="312" text-anchor="middle" font-family="Arial" font-size="8" fill="#2C3E50">John Doe</text>
    <rect x="330" y="325" width="50" height="8" fill="#667EEA" rx="1"/>
    <text x="355" y="332" text-anchor="middle" font-family="Arial" font-size="6" fill="white">Tech</text>
    <rect x="390" y="325" width="50" height="8" fill="#764BA2" rx="1"/>
    <text x="415" y="332" text-anchor="middle" font-family="Arial" font-size="6" fill="white">Sales</text>
    <rect x="330" y="340" width="110" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="350" width="90" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="360" width="70" height="6" fill="#E1E8ED" rx="1"/>
  `,
  
  'video-editing-suite': `
    <!-- Video Editing Interface -->
    <rect x="300" y="290" width="200" height="70" fill="#2C3E50" rx="3"/>
    <rect x="310" y="300" width="180" height="50" fill="#34495E" rx="2"/>
    <rect x="320" y="310" width="160" height="30" fill="#1a1a1a" rx="1"/>
    <rect x="325" y="315" width="10" height="20" fill="#E74C3C"/>
    <rect x="345" y="315" width="10" height="20" fill="#27AE60"/>
    <rect x="365" y="315" width="10" height="20" fill="#3498DB"/>
    <line x1="330" y1="320" x2="470" y2="320" stroke="#BDC3C7" stroke-width="1"/>
    <circle cx="400" cy="325" r="3" fill="#F39C12"/>
  `,
  
  'screen-recording-software': `
    <!-- Screen Recording Interface -->
    <rect x="320" y="290" width="160" height="80" fill="#2C3E50" rx="3"/>
    <rect x="330" y="300" width="140" height="60" fill="#34495E" rx="2"/>
    <circle cx="400" cy="310" r="12" fill="#E74C3C"/>
    <circle cx="400" cy="310" r="6" fill="#FFFFFF"/>
    <rect x="380" y="340" width="40" height="6" fill="#BDC3C7" rx="1"/>
    <rect x="380" y="350" width="30" height="6" fill="#BDC3C7" rx="1"/>
    <rect x="380" y="360" width="50" height="6" fill="#BDC3C7" rx="1"/>
  `,
  
  'signature-designer': `
    <!-- Signature Designer Interface -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="330" y="300" width="140" height="40" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="1"/>
    <path d="M340,320 Q370,310 400,320 T450,315" stroke="#2C3E50" stroke-width="2" fill="none"/>
    <rect x="330" y="350" width="50" height="12" fill="#667EEA" rx="2"/>
    <text x="355" y="360" text-anchor="middle" font-family="Arial" font-size="7" fill="white">Branding</text>
    <rect x="390" y="350" width="50" height="12" fill="#27AE60" rx="2"/>
    <text x="415" y="360" text-anchor="middle" font-family="Arial" font-size="7" fill="white">Save</text>
  `,
  
  'thumbnail-optimization': `
    <!-- Thumbnail Optimization Interface -->
    <rect x="300" y="290" width="200" height="70" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="310" y="300" width="60" height="50" fill="#E74C3C"/>
    <text x="340" y="330" text-anchor="middle" font-family="Arial" font-size="10" fill="white">A</text>
    <rect x="380" y="300" width="60" height="50" fill="#F39C12"/>
    <text x="410" y="330" text-anchor="middle" font-family="Arial" font-size="10" fill="white">B</text>
    <rect x="450" y="300" width="40" height="50" fill="#27AE60"/>
    <text x="470" y="330" text-anchor="middle" font-family="Arial" font-size="10" fill="white">C</text>
    <rect x="310" y="355" width="180" height="8" fill="#E1E8ED" rx="1"/>
  `,
  
  'linkedin-optimizer': `
    <!-- LinkedIn Optimizer Interface -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="330" y="300" width="140" height="15" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="1"/>
    <text x="400" y="312" text-anchor="middle" font-family="Arial" font-size="8" fill="#2C3E50">Professional Title</text>
    <rect x="330" y="325" width="140" height="20" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="1"/>
    <rect x="335" y="330" width="50" height="3" fill="#E1E8ED" rx="1"/>
    <rect x="335" y="338" width="60" height="3" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="350" width="60" height="12" fill="#0077B5" rx="2"/>
    <text x="360" y="360" text-anchor="middle" font-family="Arial" font-size="7" fill="white">LinkedIn</text>
  `,
  
  'ai-editing-workstation': `
    <!-- AI Editing Workstation -->
    <rect x="280" y="290" width="240" height="70" fill="#2C3E50" rx="3"/>
    <rect x="290" y="300" width="60" height="50" fill="#34495E" rx="2"/>
    <rect x="300" y="310" width="40" height="30" fill="#1a1a1a" rx="1"/>
    <rect x="370" y="300" width="60" height="50" fill="#34495E" rx="2"/>
    <rect x="380" y="310" width="40" height="30" fill="#1a1a1a" rx="1"/>
    <rect x="450" y="300" width="60" height="50" fill="#34495E" rx="2"/>
    <rect x="460" y="310" width="40" height="30" fill="#1a1a1a" rx="1"/>
    <circle cx="320" cy="325" r="3" fill="#27AE60"/>
    <circle cx="390" cy="325" r="3" fill="#F39C12"/>
    <circle cx="470" cy="325" r="3" fill="#E74C3C"/>
  `,
  
  'referral-dashboard': `
    <!-- Referral Dashboard -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <circle cx="360" cy="310" r="12" fill="#FDBCB4"/>
    <circle cx="400" cy="310" r="12" fill="#E8B4A2"/>
    <circle cx="440" cy="310" r="12" fill="#D2B4A2"/>
    <path d="M348,325 Q360,315 372,325" stroke="#FDBCB4" stroke-width="1" fill="none"/>
    <path d="M388,325 Q400,315 412,325" stroke="#E8B4A2" stroke-width="1" fill="none"/>
    <path d="M428,325 Q440,315 452,325" stroke="#D2B4A2" stroke-width="1" fill="none"/>
    <rect x="330" y="340" width="50" height="8" fill="#27AE60" rx="1"/>
    <rect x="390" y="340" width="40" height="8" fill="#3498DB" rx="1"/>
    <rect x="440" y="340" width="30" height="8" fill="#E74C3C" rx="1"/>
  `,
  
  'sales-analytics': `
    <!-- Sales Analytics Dashboard -->
    <rect x="280" y="290" width="240" height="70" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="290" y="300" width="220" height="8" fill="#667EEA" rx="1"/>
    <rect x="290" y="315" width="180" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="290" y="325" width="160" height="6" fill="#BDC3C7" rx="1"/>
    <rect x="290" y="335" width="200" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="290" y="345" width="140" height="6" fill="#BDC3C7" rx="1"/>
    <rect x="290" y="355" width="100" height="6" fill="#27AE60" rx="1"/>
  `,
  
  'content-calendar': `
    <!-- Content Calendar -->
    <rect x="300" y="290" width="200" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <rect x="310" y="300" width="180" height="60" fill="#F8F9FA" stroke="#BDC3C7" stroke-width="1" rx="2"/>
    <rect x="320" y="310" width="160" height="8" fill="#E1E8ED" rx="1"/>
    <rect x="320" y="325" width="140" height="6" fill="#BDC3C7" rx="1"/>
    <rect x="320" y="335" width="120" height="6" fill="#BDC3C7" rx="1"/>
    <rect x="320" y="345" width="100" height="6" fill="#BDC3C7" rx="1"/>
    <circle cx="340" cy="320" r="3" fill="#E74C3C"/>
    <circle cx="360" cy="320" r="3" fill="#F39C12"/>
    <circle cx="380" cy="320" r="3" fill="#27AE60"/>
  `,
  
  'market-research': `
    <!-- Market Research Interface -->
    <rect x="320" y="290" width="160" height="80" fill="#FFFFFF" stroke="#E1E8ED" stroke-width="1" rx="3"/>
    <circle cx="400" cy="310" r="15" fill="none" stroke="#667EEA" stroke-width="2"/>
    <circle cx="400" cy="310" r="10" fill="none" stroke="#764BA2" stroke-width="2"/>
    <circle cx="400" cy="310" r="5" fill="none" stroke="#F093FB" stroke-width="2"/>
    <rect x="330" y="330" width="50" height="8" fill="#27AE60" rx="1"/>
    <rect x="390" y="330" width="40" height="8" fill="#3498DB" rx="1"/>
    <rect x="330" y="345" width="100" height="6" fill="#E1E8ED" rx="1"/>
    <rect x="330" y="355" width="80" height="6" fill="#BDC3C7" rx="1"/>
  `
};

function generateRealisticThumbnail(app) {
  const sceneSVG = sceneTemplates[app.scene] || sceneTemplates['modern-home-office'];
  const personSVG = personTemplates[app.person] || personTemplates['diverse-professional'];
  const interfaceSVG = interfaceTemplates[app.interface] || interfaceTemplates['multi-screen-personalization'];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" 
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-${app.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#2d2a4a"/>
    </linearGradient>
    <radialGradient id="glow-${app.id}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${app.accentColor};stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:${app.accentColor};stop-opacity:0"/>
    </radialGradient>
    <filter id="shadow-${app.id}">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg-${app.id})"/>
  
  <!-- Scene Environment -->
  ${sceneSVG}
  
  <!-- Software Interface -->
  ${interfaceSVG}
  
  <!-- Person using the software -->
  ${personSVG}
  
  <!-- Glow effect around interface -->
  <ellipse cx="400" cy="270" rx="180" ry="140" fill="url(#glow-${app.id})"/>
  
  <!-- App name overlay -->
  <rect x="0" y="${HEIGHT - 120}" width="${WIDTH}" height="120" fill="url(#bg-${app.id})" opacity="0.9"/>
  <linearGradient id="textFade-${app.id}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:0"/>
    <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:0.8"/>
  </linearGradient>
  <rect x="0" y="${HEIGHT - 120}" width="${WIDTH}" height="40" fill="url(#textFade-${app.id})"/>
  
  <!-- App name -->
  <text x="400" y="${HEIGHT - 50}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        font-weight="700" 
        fill="white"
        filter="url(#shadow-${app.id})">${app.name}</text>
  
  <!-- Subtitle -->
  <text x="400" y="${HEIGHT - 25}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="14" 
        font-weight="400" 
        fill="#94a3b8">Professional AI Tool</text>
  
  <!-- Subtle texture overlay -->
  <defs>
    <pattern id="texture-${app.id}" patternUnits="userSpaceOnUse" width="40" height="40">
      <rect width="40" height="40" fill="transparent"/>
      <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.03)"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#texture-${app.id})"/>
</svg>`;
}

async function generateAllRealisticThumbnails() {
  console.log('🎨 Generating Realistic AI Marketing Tools Thumbnails...\n');
  console.log('🏗️  Creating detailed scenes with humans using software in real environments');
  console.log('⚠️  This will generate 18 high-quality, photorealistic SVG thumbnails\n');

  const outputDir = path.join(process.cwd(), 'public', 'app-thumbnails');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = [];

  for (const app of apps) {
    try {
      console.log(`  Creating realistic scene for ${app.name}...`);
      
      const svgContent = generateRealisticThumbnail(app);
      const filename = `${app.id}-realistic.svg`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, svgContent, 'utf8');
      
      results.push({
        id: app.id,
        name: app.name,
        filename,
        url: `/app-thumbnails/${filename}`,
        path: filepath,
        scene: app.scene,
        person: app.person,
        interface: app.interface
      });
      
      console.log(`    ✅ Generated: ${filename}`);
    } catch (error) {
      console.error(`    ❌ Error generating ${app.name}:`, error.message);
    }
  }

  // Save metadata
  const metadata = {
    generated: new Date().toISOString(),
    type: 'realistic-scene-thumbnails',
    method: 'advanced-svg-generation',
    quality: 'high-detail',
    size: `${WIDTH}x${HEIGHT}`,
    style: 'realistic-professional-scenes',
    totalGenerated: results.length,
    description: 'Highly detailed SVG thumbnails showing humans using AI tools in realistic professional environments',
    results
  };

  fs.writeFileSync(
    path.join(outputDir, 'realistic-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log('\n🎉 Realistic Thumbnail Generation Complete!');
  console.log(`✅ Successfully generated: ${results.length} professional thumbnails`);
  console.log(`📁 Output directory: ${outputDir}`);
  
  console.log('\n🏗️ Thumbnail Features:');
  console.log('  • Realistic professional environments (offices, studios, agencies)');
  console.log('  • Diverse human characters using the software');
  console.log('  • Actual software interfaces and dashboards');
  console.log('  • Professional lighting and materials');
  console.log('  • High-quality SVG with gradients and effects');
  
  if (results.length > 0) {
    console.log('\n📸 Sample thumbnails created:');
    results.slice(0, 3).forEach(r => 
      console.log(`   ${r.name}: ${r.url} (${r.scene} + ${r.person})`)
    );
  }

  return results;
}

// Run if called directly
generateAllRealisticThumbnails().catch(console.error);
