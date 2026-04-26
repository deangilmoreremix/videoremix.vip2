import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    // Fetch ALL users with pagination (not just first 50)
    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: usersPage, error: getUserError } = await supabase.auth.admin.listUsers({ page, perPage });

      if (getUserError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users: ' + getUserError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      allUsers = allUsers.concat(usersPage.users);
      if (usersPage.users.length < perPage) break;
      page++;
    }

    const users = { users: allUsers };

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ error: `User with email ${email} not found` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update password: ' + updateError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password updated successfully for ${email}`,
        userId: user.id,
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