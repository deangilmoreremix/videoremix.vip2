-- Assign 'user' role to all users who don't have any role in user_roles
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT 
  u.id as user_id,
  'user' as role,
  '00000000-0000-0000-0000-000000000001' as tenant_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
