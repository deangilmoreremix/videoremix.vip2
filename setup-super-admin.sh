#!/bin/bash

# Script to assign super admin role after user creation
# Run this after creating the user in Supabase Dashboard

echo "🔄 Assigning super admin role to deanvideoremix.io@gmail.com..."

# Assign role
supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres" --file - << 'EOF'
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT u.id, 'super_admin', now(), now()
FROM auth.users u
WHERE u.email = 'deanvideoremix.io@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  updated_at = now();

INSERT INTO public.admin_profiles (user_id, email, full_name, created_at, updated_at)
SELECT u.id, u.email, 'Dean', now(), now()
FROM auth.users u
WHERE u.email = 'deanvideoremix.io@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Dean',
  updated_at = now();
EOF

echo "✅ Super admin setup complete!"
echo "📧 Email: deanvideoremix.io@gmail.com"
echo "🔑 Password: VideoRemix2026"
echo "🌐 Admin URL: https://videoremix.vip/admin"