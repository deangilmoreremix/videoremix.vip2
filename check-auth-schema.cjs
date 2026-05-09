const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try to query the auth.users table directly via SQL
  const { data, error } = await supabase
    .from('auth.users')
    .select('id, email')
    .order('id');

  if (error) {
    console.error('Error querying auth.users:', error.message);
    // Maybe we need to use the schema? Actually, the auth schema is not exposed via the REST API?
    // Let's try to use rpc to run SQL?
  } else {
    console.log(`Found ${data.length} users in auth.users via REST API`);
    const targetEmails = [
      'larrylawrence1@gmail.com',
      'trcole3@theritegroup.com',
      'ejo1ed@gmail.com'
    ];
    for (const email of targetEmails) {
      const user = data.find(u => u.email === email);
      if (user) {
        console.log(`Found in auth.users: ${email}`);
      } else {
        console.log(`Not found in auth.users: ${email}`);
      }
    }
  }

  // Now try to run raw SQL using rpc? Or we can use the `supabase` client's `sql` method? Actually, there isn't one.
  // Let's try to use the `postgrest` builder to select from the auth schema? We already did that.

  // Alternatively, let's try to list all tables in the database to see what's available.
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables'); // This is a custom function? We don't have it.

  // Instead, let's try to query the information_schema via the public schema? We can't because we don't have access? Actually, we do with service role.
  const { data: schemaInfo, error: schemaError } = await supabase
    .from('information_schema.tables')
    .select('table_schema, table_name')
    .eq('table_schema', 'auth');

  if (schemaError) {
    console.error('Error querying information_schema:', schemaError.message);
  } else {
    console.log('Tables in auth schema:', schemaInfo);
  }
}

main().catch(console.error);