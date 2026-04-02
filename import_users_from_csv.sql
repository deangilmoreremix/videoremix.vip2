-- Import users from CSV into Supabase
-- This script handles:
-- 1. Creating/updating users in auth.users and public.profiles
-- 2. Processing pipe-separated products from CSV
-- 3. Creating purchase records
-- 4. Granting app access based on products_catalog

-- First, create a staging table that matches our CSV structure
DROP TABLE IF EXISTS stg_user_import;
CREATE TEMP TABLE stg_user_import (
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    total_spend TEXT,
    total_orders TEXT,
    last_purchase TEXT,
    segment TEXT,
    products_purchased TEXT
);

-- Copy CSV data into staging table
-- NOTE: In practice, you would use \copy or psql to load the actual CSV file
-- For this script, we'll assume the data is already loaded or will be loaded externally
-- Example: \copy stg_user_import FROM '/path/to/users_to_import.csv' CSV HEADER;

-- For demonstration, we'll insert a few sample rows
-- In production, remove these INSERT statements and load the actual CSV
INSERT INTO stg_user_import (first_name, last_name, email, total_spend, total_orders, last_purchase, segment, products_purchased) VALUES
('Bruce', 'Chinn', 'bruce.chinn@icloud.com', '$3,053.00', '50', '2025-12-17', 'Mid Tier ($2k–$5k)', 'Smart Analytics - Special Offer | Video List Builder - Pay What You Want | VideoRemix - Connect - VideoRemix Connect - Monthly - Christmas Special | VideoRemix Connect - Yearly - Special'),
('Alan', 'Howard', 'alan.luckybuginc@gmail.com', '$9,206.25', '210', '2025-12-15', 'High Value ($5k–$10k)', 'GO-AI Bundle | Smart Apps - One Time | Smart Marketing Hub - Life Time Access | SmartVideo Automation - Yearly'),
('J D', 'Clement', 'jd.clement@gmail.com', '$21,014.00', '176', '2025-12-13', 'VIP Buyer ($10k+)', 'Smart Conversion Kit - Yearly | SmartVideo Evolution - Elite - FE (One Time) | SmartVideo Evolution - Template Collective  - (Monthly) | SmartVideo Evolution - Template Collective  - OTO1 (One Time) | SmartVideo Evolution - White Label  - (Monthly) | SmartVideo Evolution Agency Accelerator - (One Time) | SmartVideo Evolution by VideoRemix - SmartVideo Evolution - Template Collective  - (Monthly) | Social Media Pack - Webinar Special | Video List Builder - Pay What You Want | VideoRemix Connect - Yearly - Special');

-- Process the import in a transaction
DO $$
DECLARE
    tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    platform_const TEXT := 'stripe'; -- Using stripe as default platform for import
    v_user_id UUID;
    v_profile_id UUID;
    v_product_id UUID;
    v_purchase_id UUID;
    v_app_slug TEXT;
    v_product_name TEXT;
    v_email TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_full_name TEXT;
    v_products TEXT;
    v_single_product TEXT;
    v_pos INTEGER;
    v_delimiter CONSTANT TEXT := '|';
    v_exists BOOLEAN;
BEGIN
    -- Process each user in the staging table
    FOR v_user_record IN 
        SELECT first_name, last_name, email, products_purchased
        FROM stg_user_import
        WHERE email IS NOT NULL AND email <> ''
    LOOP
        v_first_name := trim(v_user_record.first_name);
        v_last_name := trim(v_user_record.last_name);
        v_email := lower(trim(v_user_record.email));
        v_full_name := trim(v_user_record.first_name || ' ' || v_user_record.last_name);
        v_products := trim(v_user_record.products_purchased);
        
        -- Skip if products_purchased is 'nan' or empty
        IF v_products IS NULL OR v_products = 'nan' OR v_products = '' THEN
            v_products := NULL;
        END IF;
        
        -- Check if user already exists in auth.users by email
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = v_email;
        
        IF v_user_id IS NULL THEN
            -- Create new user in auth.users
            INSERT INTO auth.users (
                email,
                encrypted_password,
                email_confirmed_at,
                confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                role,
                is_super_admin
            ) VALUES (
                v_email,
                crypt(gen_random_uuid()::text, gen_salt('bf')), -- Random password
                now(),
                now(),
                '{"provider":"email","providers":["email"]}',
                jsonb_build_object(
                    'full_name', v_full_name,
                    'first_name', v_first_name,
                    'last_name', v_last_name
                ),
                now(),
                now(),
                'authenticated',
                false
            )
            RETURNING id INTO v_user_id;
            
            RAISE NOTICE 'Created new user: %', v_email;
        ELSE
            RAISE NOTICE 'Found existing user: %', v_email;
        END IF;
        
        -- Upsert into public.profiles (update if exists, insert if not)
        SELECT id INTO v_profile_id
        FROM public.profiles
        WHERE user_id = v_user_id;
        
        IF v_profile_id IS NULL THEN
            -- Insert new profile
            INSERT INTO public.profiles (
                user_id,
                email,
                full_name,
                created_at,
                updated_at,
                tenant_id
            ) VALUES (
                v_user_id,
                v_email,
                v_full_name,
                now(),
                now(),
                tenant_id
            )
            RETURNING id INTO v_profile_id;
            
            RAISE NOTICE 'Created profile for user: %', v_email;
        ELSE
            -- Update existing profile
            UPDATE public.profiles
            SET 
                email = v_email,
                full_name = v_full_name,
                updated_at = now()
            WHERE id = v_profile_id;
            
            RAISE NOTICE 'Updated profile for user: %', v_email;
        END IF;
        
        -- Process products if they exist
        IF v_products IS NOT NULL THEN
            -- Split pipe-separated products and process each one
            v_pos := 1;
            LOOP
                EXIT WHEN v_pos > length(v_products);
                
                v_single_product := trim(
                    split_part(v_products, v_delimiter, v_pos)
                );
                
                EXIT WHEN v_single_product IS NULL OR v_single_product = '';
                
                -- Find product in catalog by name
                SELECT id, name INTO v_product_id, v_product_name
                FROM public.products_catalog
                WHERE name ILIKE v_single_product
                  AND is_active = true
                LIMIT 1;
                
                IF v_product_id IS NOT NULL THEN
                    -- Check if purchase already exists for this user/product
                    SELECT EXISTS(
                        SELECT 1 FROM public.purchases
                        WHERE user_id = v_user_id
                          AND product_id = v_product_id
                    ) INTO v_exists;
                    
                    IF NOT v_exists THEN
                        -- Create purchase record
                        INSERT INTO public.purchases (
                            user_id,
                            email,
                            platform,
                            platform_transaction_id,
                            platform_customer_id,
                            product_id,
                            product_name,
                            amount,
                            currency,
                            status,
                            is_subscription,
                            purchase_date,
                            processed,
                            processed_at,
                            tenant_id
                        ) VALUES (
                            v_user_id,
                            v_email,
                            platform_const,
                            'import_' || gen_random_uuid()::text, -- placeholder transaction ID
                            'import_customer_' || gen_random_uuid()::text, -- placeholder customer ID
                            v_product_id,
                            v_product_name,
                            0, -- amount unknown from CSV, set to 0
                            'USD',
                            'completed',
                            false, -- not a subscription
                            now(),
                            true, -- processed
                            now(),
                            tenant_id
                        )
                        RETURNING id INTO v_purchase_id;
                        
                        RAISE NOTICE 'Created purchase for user % and product %', v_email, v_product_name;
                    ELSE
                        -- Get existing purchase ID
                        SELECT id INTO v_purchase_id
                        FROM public.purchases
                        WHERE user_id = v_user_id
                          AND product_id = v_product_id
                        LIMIT 1;
                        
                        RAISE NOTICE 'Using existing purchase for user % and product %', v_email, v_product_name;
                    END IF;
                    
                    -- Grant app access for each app in the product's apps_granted
                    FOR v_app_slug IN
                        SELECT jsonb_array_elements_text(apps_granted)
                        FROM public.products_catalog
                        WHERE id = v_product_id
                          AND is_active = true
                    LOOP
                        -- Check if active access already exists
                        SELECT EXISTS(
                            SELECT 1 FROM public.user_app_access
                            WHERE user_id = v_user_id
                              AND app_slug = v_app_slug
                              AND is_active = true
                        ) INTO v_exists;
                        
                        IF NOT v_exists THEN
                            -- Create app access grant
                            INSERT INTO public.user_app_access (
                                user_id,
                                app_slug,
                                purchase_id,
                                access_type,
                                is_active,
                                granted_at,
                                created_at,
                                updated_at,
                                tenant_id
                            ) VALUES (
                                v_user_id,
                                v_app_slug,
                                v_purchase_id,
                                'lifetime', -- Assuming lifetime access for imported purchases
                                true,
                                now(),
                                now(),
                                now(),
                                tenant_id
                            );
                            
                            RAISE NOTICE 'Granted access to % for user %', v_app_slug, v_email;
                        ELSE
                            RAISE NOTICE 'Access to % already exists for user %', v_app_slug, v_email;
                        END IF;
                    END LOOP;
                ELSE
                    RAISE WARNING 'Product not found for user %: %', v_email, v_single_product;
                END IF;
                
                v_pos := v_pos + 1;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Clean up
DROP TABLE stg_user_import;

RAISE NOTICE 'Import process completed.';