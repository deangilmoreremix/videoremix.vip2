-- Enable RLS on apps table
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view apps (active apps for all, all apps for admins)
CREATE POLICY "Users can view apps" 
ON public.apps 
FOR SELECT 
TO authenticated 
USING (
  is_active = true 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Super Admin', 'Tenant Admin', 'Tenant Owner')
  )
);

-- Policy: Super Admins can manage all apps
CREATE POLICY "Super Admins manage apps" 
ON public.apps 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Super Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Super Admin'
  )
);
