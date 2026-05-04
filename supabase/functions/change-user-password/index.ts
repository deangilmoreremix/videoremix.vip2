import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id, provider) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }
  return data.encrypted_api_key;
}

// Verify JWT token to get user_id
async function verifyUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};


  // Verify authentication and get user's API key
  const { user_id } = await verifyUser(req);
  if (!user_id) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get user's openai API key
  const userApiKey = await getUserApiKey(user_id, 'openai');
  if (!userApiKey) {
    return jsonResponse({ 
      error: 'API_KEY_MISSING',
      message: 'Please add your openai API key in your profile.',
      provider: 'openai'
    }, 403);
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    // body remains undefined for non-JSON requests
  }
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Email and newPassword are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength (same as frontend)
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Note: No email verification performed - allows password changes without authentication

    // Find the user by email
    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: users, error: getUserError } = await supabase.auth.admin.listUsers({ page, perPage });
      if (getUserError) {
        return new Response(
          JSON.stringify({ error: 'Unable to update password at this time.' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      allUsers = allUsers.concat(users.users);
      if (users.users.length < perPage) break;
      page++;
    }

    const user = allUsers.find(u => u.email === email);

    if (!user) {
      // Return success even if user doesn't exist to avoid email enumeration
      return new Response(
        JSON.stringify({
          success: true,
          message: `Password updated successfully for ${email}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        password: newPassword,
        // CRITICAL: This invalidates ALL existing sessions for the user
        // Without this, users cannot login with new password until sessions expire
        revokeRefreshTokens: true
      }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Unable to update password at this time.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password updated successfully for ${email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});