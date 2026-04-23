-- Add super_admin role for dean@smartcrm.vip
INSERT INTO public.user_roles (user_id, role, tenant_id)
VALUES ('12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd', 'super_admin', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
