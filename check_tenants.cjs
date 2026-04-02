const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*');

  if (error) {
    console.error('Error fetching tenants:', error);
    process.exit(1);
  }

  console.log('Tenants:', tenants);
  if (tenants.length === 0) {
    console.log('No tenants found. You may need to create a default tenant.');
  } else {
    console.log(`Found ${tenants.length} tenant(s).`);
    // Use the first tenant's ID as default
    const tenantId = tenants[0].id;
    console.log(`Default tenant ID: ${tenantId}`);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});