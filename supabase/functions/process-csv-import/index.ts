import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CSVRow {
  'Customer Name': string;
  'Customer Email': string;
  'Campaign': string;
  'Product': string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || (roleData.role !== 'super_admin' && roleData.role !== 'admin')) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { importName, filename, fileSize, csvContent, headers } = body;

    const { data: importRecord, error: importError } = await supabase
      .from("csv_imports")
      .insert({
        import_name: importName,
        filename,
        file_size: fileSize,
        import_source: 'manual',
        status: 'processing',
        csv_headers: headers,
        imported_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (importError || !importRecord) {
      throw new Error('Failed to create import record');
    }

    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    const csvHeaders = lines[0].split(',').map((h: string) => h.trim());

    const rows: CSVRow[] = lines.slice(1).map((line: string, index: number) => {
      const values = line.split(',').map((v: string) => v.trim());
      return {
        'Customer Name': values[0] || '',
        'Customer Email': values[1] || '',
        'Campaign': values[2] || '',
        'Product': values[3] || '',
      };
    });

    const uniqueProducts = new Map<string, { name: string; campaign: string; count: number; emails: Set<string> }>();

    rows.forEach(row => {
      const productKey = `${row.Product}|${row.Campaign}`;
      if (!uniqueProducts.has(productKey)) {
        uniqueProducts.set(productKey, {
          name: row.Product,
          campaign: row.Campaign,
          count: 0,
          emails: new Set(),
        });
      }
      const product = uniqueProducts.get(productKey)!;
      product.count++;
      if (row['Customer Email']) {
        product.emails.add(row['Customer Email'].toLowerCase());
      }
    });

    const existingProductsMap = new Map<string, string>();
    const { data: existingProducts } = await supabase
      .from('import_products')
      .select('id, normalized_name');

    if (existingProducts) {
      existingProducts.forEach(p => {
        existingProductsMap.set(p.normalized_name, p.id);
      });
    }

    const productsToInsert = [];
    const productIdMap = new Map<string, string>();

    for (const [key, productData] of uniqueProducts) {
      const normalizedName = productData.name.toLowerCase().trim().replace(/\s+/g, '_');

      if (existingProductsMap.has(normalizedName)) {
        productIdMap.set(key, existingProductsMap.get(normalizedName)!);

        await supabase
          .from('import_products')
          .update({
            total_occurrences: productData.count,
            unique_user_count: productData.emails.size,
          })
          .eq('normalized_name', normalizedName);
      } else {
        productsToInsert.push({
          product_name: productData.name,
          normalized_name: normalizedName,
          campaign_name: productData.campaign || null,
          first_seen_in_import_id: importRecord.id,
          total_occurrences: productData.count,
          unique_user_count: productData.emails.size,
          is_mapped: false,
          mapping_status: 'unmapped',
        });
      }
    }

    let newProductsAdded = 0;
    if (productsToInsert.length > 0) {
      const { data: insertedProducts } = await supabase
        .from('import_products')
        .insert(productsToInsert)
        .select('id, normalized_name, campaign_name, product_name');

      if (insertedProducts) {
        newProductsAdded = insertedProducts.length;
        insertedProducts.forEach(p => {
          const key = `${p.product_name}|${p.campaign_name || ''}`;
          productIdMap.set(key, p.id);
        });
      }
    }

    const userRecordsToInsert = [];
    let newUsersCreated = 0;
    let existingUsersUpdated = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row['Customer Email']) continue;

      const email = row['Customer Email'].toLowerCase().trim();
      const productKey = `${row.Product}|${row.Campaign}`;
      const productId = productIdMap.get(productKey);

      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);

      let userId: string | null = null;

      if (!existingUser) {
        const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: row['Customer Name']?.split(' ')[0] || '',
            last_name: row['Customer Name']?.split(' ').slice(1).join(' ') || '',
          },
        });

        if (!createError && newUser) {
          userId = newUser.user.id;
          newUsersCreated++;

          await supabase.from('user_roles').insert({
            user_id: userId,
            role: 'user',
          });
        }
      } else {
        userId = existingUser.id;
        existingUsersUpdated++;
      }

      userRecordsToInsert.push({
        csv_import_id: importRecord.id,
        customer_name: row['Customer Name'] || null,
        customer_email: email,
        campaign: row.Campaign || null,
        product_name: row.Product,
        user_id: userId,
        import_product_id: productId,
        processing_status: userId ? 'processed' : 'failed',
        row_number: i + 1,
        raw_data: row,
        processed_at: new Date().toISOString(),
      });
    }

    if (userRecordsToInsert.length > 0) {
      await supabase.from('import_user_records').insert(userRecordsToInsert);
    }

    await supabase
      .from('csv_imports')
      .update({
        status: 'completed',
        total_rows: rows.length,
        processed_rows: rows.length,
        successful_rows: userRecordsToInsert.filter(r => r.processing_status === 'processed').length,
        failed_rows: userRecordsToInsert.filter(r => r.processing_status === 'failed').length,
        unique_products_found: uniqueProducts.size,
        new_products_added: newProductsAdded,
        new_users_created: newUsersCreated,
        existing_users_updated: existingUsersUpdated,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          importId: importRecord.id,
          stats: {
            totalRows: rows.length,
            newProducts: newProductsAdded,
            newUsers: newUsersCreated,
            updatedUsers: existingUsersUpdated,
          },
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error processing CSV:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
