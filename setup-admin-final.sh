#!/bin/bash

# One-time script to assign super admin role after user creation
# Run this ONCE after creating the user in Supabase Dashboard

echo "🔄 Assigning super admin role to deanvideoremix.io@gmail.com..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Create a temporary SQL file
cat > temp_admin_setup.sql << 'EOF'
-- Assign super admin role
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT u.id, 'super_admin', now(), now()
FROM auth.users u
WHERE u.email = 'deanvideoremix.io@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  updated_at = now();

-- Create admin profile
INSERT INTO public.admin_profiles (user_id, email, full_name, created_at, updated_at)
SELECT u.id, u.email, 'Dean', now(), now()
FROM auth.users u
WHERE u.email = 'deanvideoremix.io@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Dean',
  updated_at = now();
EOF

# Execute the SQL
supabase db push --file temp_admin_setup.sql

# Clean up
rm temp_admin_setup.sql

echo "✅ Super admin setup complete!"
echo "🌐 Test login at: https://videoremix.vip/admin"
echo "📧 Email: deanvideoremix.io@gmail.com"
echo "🔑 Password: VideoRemix2026"