-- RLS policies for personalization module tables

alter table if exists prospect_scans enable row level security;
alter table if exists prospect_profiles enable row level security;
alter table if exists personalization_outputs enable row level security;
alter table if exists personalization_settings enable row level security;
alter table if exists personalizer_templates enable row level security;

create policy if not exists "users can insert scans" on prospect_scans
  for insert with check (true);

create policy if not exists "users can select scans" on prospect_scans
  for select using (true);

create policy if not exists "users can insert profiles" on prospect_profiles
  for insert with check (true);

create policy if not exists "users can select profiles" on prospect_profiles
  for select using (true);

create policy if not exists "users can insert outputs" on personalization_outputs
  for insert with check (true);

create policy if not exists "users can select outputs" on personalization_outputs
  for select using (true);

create policy if not exists "users can insert settings" on personalization_settings
  for insert with check (true);

create policy if not exists "users can select settings" on personalization_settings
  for select using (true);

create policy if not exists "users can insert templates" on personalizer_templates
  for insert with check (true);

create policy if not exists "users can select templates" on personalizer_templates
  for select using (true);
