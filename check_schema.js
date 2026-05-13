import pg from 'pg';
const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  await client.connect();
  
  console.log('=== user_roles TABLE ACTUAL COLUMNS ===\n');
  const { rows } = await client.query(\`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles'
    ORDER BY ordinal_position;
  \`);
  
  if (rows.length === 0) {
    console.log('No columns found - table might not exist?');
  } else {
    console.log('Columns in user_roles:');
    rows.forEach(col => {
      console.log(\`  - \${col.column_name} (\${col.data_type}) \${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} \${col.column_default ? 'DEFAULT ' + col.column_default : ''}\`);
    });
  }
  
  console.log('\n=== Actual user_roles data (first 3 rows) ===\n');
  const { rows: data } = await client.query('SELECT * FROM user_roles LIMIT 3');
  if (data.length === 0) {
    console.log('Table is empty');
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
  
  await client.end();
}

checkSchema().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
