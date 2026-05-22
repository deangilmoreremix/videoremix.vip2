# AI App Runner - Supabase Storage Setup (for Save to Project)

The "Save to Project" feature in `AIAppRunnerPage.tsx` stores AI app results in Supabase Storage under the path:

```
user-workspaces/{userId}/ai-runs/{appSlug}/{timestamp}.json
```

## Required One-time Setup (Production Readiness)

1. **Create the bucket** (in Supabase Dashboard → Storage):
   - Name: `user-workspaces`
   - Public: **false** (private)
   - File size limit: 50 MB (or higher)
   - Allowed MIME types: `application/json`, `text/plain`, `application/pdf` (optional)

2. **RLS Policies** (Storage policies for the bucket):

   **Policy 1: Users can upload their own results**
   ```sql
   CREATE POLICY "Users can upload own ai-runs"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'user-workspaces'
     AND (storage.foldername(name))[1] = 'user-workspaces'
     AND (storage.foldername(name))[2] = auth.uid()::text
   );
   ```

   **Policy 2: Users can read their own results**
   ```sql
   CREATE POLICY "Users can read own ai-runs"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'user-workspaces'
     AND (storage.foldername(name))[1] = 'user-workspaces'
     AND (storage.foldername(name))[2] = auth.uid()::text
   );
   ```

   **Policy 3: Users can update/delete their own results** (optional but recommended)
   ```sql
   CREATE POLICY "Users can manage own ai-runs"
   ON storage.objects FOR UPDATE, DELETE
   TO authenticated
   USING (
     bucket_id = 'user-workspaces'
     AND (storage.foldername(name))[1] = 'user-workspaces'
     AND (storage.foldername(name))[2] = auth.uid()::text
   );
   ```

3. **(Optional but recommended) Create supporting table** for metadata / audit:
   ```sql
   CREATE TABLE IF NOT EXISTS public.ai_app_runs (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     app_slug text NOT NULL,
     storage_path text NOT NULL,
     created_at timestamptz DEFAULT now(),
     metadata jsonb
   );

   ALTER TABLE public.ai_app_runs ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view their own runs" ON public.ai_app_runs
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own runs" ON public.ai_app_runs
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

## Current Behavior (Graceful Degradation)

- If the bucket or policies are not yet configured, `Save to Project` automatically falls back to a local JSON download and shows a helpful message.
- This allows the 10 Batch 1 apps to be fully usable and demoable even before the storage bucket is provisioned.

## Files that reference this path
- `src/pages/AIAppRunnerPage.tsx` (the actual upload logic + fallback)
- This note (single source of truth for ops)

Once the bucket + policies exist, the Save feature becomes fully cloud-persisted and appears in the user's workspace.

---
**Status for Batch 1 (Sales/Lead Gen)**: The 10 apps are production-ready from a UI + Edge + wiring perspective. Storage is the only remaining infra step (standard for new features).
