import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL\n');
  
  const adminUserId = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
  
  // Get tenant
  const { rows: tenants } = await client.query('SELECT id FROM tenants WHERE slug = $1', ['videoremix']);
  if (tenants.length === 0) {
    console.log('ERROR: Tenant not found');
    await client.end();
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  console.log('Tenant ID:', tenantId);
  
  // Delete any existing role
  await client.query('DELETE FROM user_roles WHERE user_id = $1', [adminUserId]);
  
  // Insert admin role
  const { rows: result } = await client.query(
    'INSERT INTO user_roles (user_id, role, tenant_id) VALUES ($1, $2, $3) RETURNING *',
    [adminUserId, 'admin', tenantId]
  );
  console.log('✅ Admin role assigned:', result[0]);
  
  await client.end();
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
