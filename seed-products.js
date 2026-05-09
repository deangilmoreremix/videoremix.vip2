import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const missingProducts = [
  // Personalizer Products
  { name: 'Personalizer AI Agency', slug: 'personalizer', product_type: 'subscription', apps_granted: ['personalizer'] },
  { name: 'Personalizer AI Agency (Monthly)', slug: 'personalizer', product_type: 'subscription', apps_granted: ['personalizer'] },
  { name: 'Personalizer AI Agency (Yearly)', slug: 'personalizer', product_type: 'subscription', apps_granted: ['personalizer'] },
  { name: 'Personalizer AI Agency (Lifetime)', slug: 'personalizer', product_type: 'one_time', apps_granted: ['personalizer'] },
  { name: 'Personalizer AI Writing Toolkit (Lifetime)', slug: 'personalizer', product_type: 'one_time', apps_granted: ['personalizer'] },
  { name: 'Personalizer Advanced Text-Video AI Editor (Lifetime)', slug: 'personalizer', product_type: 'one_time', apps_granted: ['personalizer'] },
  { name: 'Personalizer Interactive Shopping (Lifetime)', slug: 'personalizer', product_type: 'one_time', apps_granted: ['personalizer'] },

  // SmartVideo Products
  { name: 'SmartVideo Interactive Design Club', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Interactive Design Club - Monthly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Ultimate', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Ultra - Monthly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Upgrade 1 (OTO1) - Monthly', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Main - Yearly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Evolution Beta Launch - Monthly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Evolution Beta Launch - Yearly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Evolution - Template Collective', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'SmartVideo Evolution A.I. Access', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'Smart AI Designer Package - Bundle Package', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },
  { name: 'Smart Marketer Elite - Private Promo Yearly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'VideoRemix Link-ED (YEARLY)', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'VideoRemix Insider Training - Monthly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'VideoRemix Connect - Yearly - Special', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'Video Remix Google Smart Maps - Annual', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'Smart AI Mentor Unlimited - Upgrade', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },
  { name: 'Smart AI Mentor Millionaires Club', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'Smart AI Mentor Millionaires Club - Two Pay', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'GO-AI Design Club: GO-AI OTO1', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },
  { name: 'GO-AI Professional: GO-AI Main', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },
  { name: 'GO-AI Bundle', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },

  // Social Video Products
  { name: 'Social Media Personalized Video Prospecting Bundle', slug: 'social_video', product_type: 'one_time', apps_granted: ['social_video'] },

  // Agency & Growth
  { name: 'Agency Growth Accelerator - Yearly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'Financial Accelerator - Yearly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'Local360 - Template Vault - Monthly (Special Promo) - OTO1', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },

  // Lead Gen
  { name: 'Attorney Lead Generator - Yearly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },
  { name: 'Lead Generator Agency - One Time Special', slug: 'smartvideo', product_type: 'one_time', apps_granted: ['smartvideo'] },

  // Conversion Kit
  { name: 'Smart Conversion Kit - Monthly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] },

  // White Label
  { name: 'VideoRemix White Label - Basics - Monthly', slug: 'smartvideo', product_type: 'subscription', apps_granted: ['smartvideo'] }
];

async function seedProducts() {
  console.log('Seeding missing products...\n');
  
  let added = 0;
  let skipped = 0;
  
  for (const product of missingProducts) {
    try {
      const { error } = await supabase
        .from('products_catalog')
        .insert({
          name: product.name,
          slug: product.slug,
          product_type: product.product_type,
          description: product.apps_granted.join(', '),
          apps_granted: product.apps_granted,
          is_active: true
        });
      
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          console.log(`  ℹ Already exists: ${product.name}`);
          skipped++;
        } else {
          console.error(`  ✗ Error adding ${product.name}:`, error.message);
          skipped++;
        }
      } else {
        console.log(`  ✓ Added: ${product.name}`);
        added++;
      }
    } catch (err) {
      console.error(`  ✗ Unexpected error for ${product.name}:`, err.message);
      skipped++;
    }
  }
  
  console.log(`\n✅ Seeding complete: ${added} added, ${skipped} skipped`);
}

seedProducts().catch(console.error);