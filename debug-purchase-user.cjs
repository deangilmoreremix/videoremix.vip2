const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  // Get one purchase with email info@crownmarketingnj.com
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id, user_id, email')
    .eq('email', 'info@crownmarketingnj.com')
    .limit(1);

  if (error) {
    console.error('Error fetching purchase:', error);
    return;
  }

  if (purchases.length === 0) {
    console.log('No purchase found for info@crownmarketingnj.com');
    return;
  }

  const purchase = purchases[0];
  console.log('Purchase:', purchase);

  // Get the user by id from purchases
  const { data: userById, error: idError } = await supabase.auth.admin.getUserById(purchase.user_id);
  if (idError) {
    console.error('Error fetching user by id:', idError.message);
  } else {
    console.log('User by id:', userById);
  }

  // Get the user by email
  const { data: { users: usersByEmail }, error: emailError } = await supabase.auth.admin.listUsers({
    filters: { email: 'info@crownmarketingnj.com' }
  });
  if (emailError) {
    console.error('Error fetching user by email:', emailError);
  } else {
    console.log('Users by email:', usersByEmail);
  }
}

debug();