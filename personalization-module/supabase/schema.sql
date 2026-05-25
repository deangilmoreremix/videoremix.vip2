-- Personalization module schema

create table if not exists app_registry (
  id uuid primary key default gen_random_uuid(),
  app_id text unique not null,
  app_name text not null,
  app_url text,
  app_category text,
  default_mode text,
  output_types jsonb,
  prompt_profile jsonb,
  theme jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists prospect_scans (
  id uuid primary key default gen_random_uuid(),
  app_id text not null,
  prospect_name text,
  website text,
  username text,
  industry text,
  offer text,
  goal text,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

create table if not exists prospect_profiles (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references prospect_scans(id) on delete cascade,
  platform text,
  profile_url text,
  status text,
  confidence_score numeric,
  category text,
  raw_data jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists personalization_outputs (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references prospect_scans(id) on delete cascade,
  output_type text,
  title text,
  content text,
  model_used text,
  created_at timestamp with time zone default now()
);

create table if not exists personalization_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  default_offer text,
  default_tone text,
  default_cta text,
  default_industry text,
  created_at timestamp with time zone default now()
);

create table if not exists personalizer_templates (
  id uuid primary key default gen_random_uuid(),
  mode text not null,
  template_name text,
  system_prompt text,
  user_prompt text,
  output_schema jsonb,
  created_at timestamp with time zone default now()
);
