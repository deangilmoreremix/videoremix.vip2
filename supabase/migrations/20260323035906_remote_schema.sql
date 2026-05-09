drop extension if exists "pg_net";


  create table "public"."agent_configurations" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "agent_id" uuid,
    "config_key" character varying(100) not null,
    "config_value" jsonb not null,
    "is_encrypted" boolean default false,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."agent_configurations" enable row level security;


  create table "public"."agent_executions" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "agent_id" uuid,
    "user_id" uuid,
    "status" character varying(50) default 'pending'::character varying,
    "input_data" jsonb default '{}'::jsonb,
    "output_data" jsonb default '{}'::jsonb,
    "error_message" text,
    "started_at" timestamp without time zone,
    "completed_at" timestamp without time zone,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."agent_executions" enable row level security;


  create table "public"."agent_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "agent_id" uuid,
    "schedule_type" character varying(50) not null,
    "cron_expression" character varying(100),
    "scheduled_for" timestamp without time zone not null,
    "is_active" boolean default true,
    "last_run_at" timestamp without time zone,
    "next_run_at" timestamp without time zone,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."agent_schedules" enable row level security;


  create table "public"."app_tenants" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) not null default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "tenant_name" character varying(255) not null,
    "status" character varying(50) default 'active'::character varying,
    "settings" jsonb default '{}'::jsonb,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."app_tenants" enable row level security;


  create table "public"."calendar_availability" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "user_id" uuid,
    "day_of_week" integer not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "is_available" boolean default true,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."calendar_availability" enable row level security;


  create table "public"."calendar_events" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "user_id" uuid,
    "title" character varying(255) not null,
    "description" text,
    "event_type" character varying(100) not null,
    "start_time" timestamp without time zone not null,
    "end_time" timestamp without time zone not null,
    "all_day" boolean default false,
    "timezone" character varying(100) default 'UTC'::character varying,
    "location" character varying(500),
    "meeting_url" text,
    "attendees" jsonb default '[]'::jsonb,
    "reminders" jsonb default '[]'::jsonb,
    "recurrence_rule" text,
    "status" character varying(50) default 'confirmed'::character varying,
    "is_recurring" boolean default false,
    "parent_event_id" uuid,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."calendar_events" enable row level security;


  create table "public"."calendar_integrations" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "user_id" uuid,
    "provider" character varying(50) not null,
    "access_token" text,
    "refresh_token" text,
    "token_expires_at" timestamp without time zone,
    "calendar_id" text,
    "is_active" boolean default true,
    "sync_enabled" boolean default true,
    "last_sync_at" timestamp without time zone,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."calendar_integrations" enable row level security;


  create table "public"."pipeline_stages" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "pipeline_id" uuid,
    "name" character varying(100) not null,
    "position" integer not null default 0,
    "color" character varying(20),
    "probability" integer default 50,
    "is_won" boolean default false,
    "is_lost" boolean default false,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."pipeline_stages" enable row level security;


  create table "public"."pipelines" (
    "id" uuid not null default gen_random_uuid(),
    "app_slug" character varying(50) default 'smartcrm'::character varying,
    "tenant_id" uuid not null,
    "name" character varying(100) not null,
    "description" text,
    "is_default" boolean default false,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."pipelines" enable row level security;

CREATE UNIQUE INDEX agent_configurations_agent_id_config_key_key ON public.agent_configurations USING btree (agent_id, config_key);

CREATE UNIQUE INDEX agent_configurations_pkey ON public.agent_configurations USING btree (id);

CREATE UNIQUE INDEX agent_executions_pkey ON public.agent_executions USING btree (id);

CREATE UNIQUE INDEX agent_schedules_pkey ON public.agent_schedules USING btree (id);

CREATE UNIQUE INDEX app_tenants_app_slug_tenant_id_key ON public.app_tenants USING btree (app_slug, tenant_id);

CREATE UNIQUE INDEX app_tenants_pkey ON public.app_tenants USING btree (id);

CREATE UNIQUE INDEX calendar_availability_pkey ON public.calendar_availability USING btree (id);

CREATE UNIQUE INDEX calendar_events_pkey ON public.calendar_events USING btree (id);

CREATE UNIQUE INDEX calendar_integrations_pkey ON public.calendar_integrations USING btree (id);

CREATE INDEX idx_agent_executions_app_tenant ON public.agent_executions USING btree (app_slug, tenant_id);

CREATE INDEX idx_agent_executions_status ON public.agent_executions USING btree (status);

CREATE INDEX idx_agent_schedules_app_tenant ON public.agent_schedules USING btree (app_slug, tenant_id);

CREATE INDEX idx_agents_app_tenant ON public.agent_configurations USING btree (app_slug, tenant_id);

CREATE INDEX idx_app_tenants_app ON public.app_tenants USING btree (app_slug);

CREATE INDEX idx_app_tenants_tenant ON public.app_tenants USING btree (tenant_id);

CREATE INDEX idx_calendar_availability_app_tenant ON public.calendar_availability USING btree (app_slug, tenant_id);

CREATE INDEX idx_calendar_events_app_tenant ON public.calendar_events USING btree (app_slug, tenant_id);

CREATE INDEX idx_calendar_events_user ON public.calendar_events USING btree (user_id, start_time);

CREATE INDEX idx_calendar_integrations_app_tenant ON public.calendar_integrations USING btree (app_slug, tenant_id);

CREATE INDEX idx_pipeline_stages_app_tenant ON public.pipeline_stages USING btree (app_slug, tenant_id);

CREATE INDEX idx_pipeline_stages_pipeline ON public.pipeline_stages USING btree (pipeline_id);

CREATE INDEX idx_pipelines_app_tenant ON public.pipelines USING btree (app_slug, tenant_id);

CREATE UNIQUE INDEX pipeline_stages_pkey ON public.pipeline_stages USING btree (id);

CREATE UNIQUE INDEX pipelines_pkey ON public.pipelines USING btree (id);

alter table "public"."agent_configurations" add constraint "agent_configurations_pkey" PRIMARY KEY using index "agent_configurations_pkey";

alter table "public"."agent_executions" add constraint "agent_executions_pkey" PRIMARY KEY using index "agent_executions_pkey";

alter table "public"."agent_schedules" add constraint "agent_schedules_pkey" PRIMARY KEY using index "agent_schedules_pkey";

alter table "public"."app_tenants" add constraint "app_tenants_pkey" PRIMARY KEY using index "app_tenants_pkey";

alter table "public"."calendar_availability" add constraint "calendar_availability_pkey" PRIMARY KEY using index "calendar_availability_pkey";

alter table "public"."calendar_events" add constraint "calendar_events_pkey" PRIMARY KEY using index "calendar_events_pkey";

alter table "public"."calendar_integrations" add constraint "calendar_integrations_pkey" PRIMARY KEY using index "calendar_integrations_pkey";

alter table "public"."pipeline_stages" add constraint "pipeline_stages_pkey" PRIMARY KEY using index "pipeline_stages_pkey";

alter table "public"."pipelines" add constraint "pipelines_pkey" PRIMARY KEY using index "pipelines_pkey";

alter table "public"."agent_configurations" add constraint "agent_configurations_agent_id_config_key_key" UNIQUE using index "agent_configurations_agent_id_config_key_key";

alter table "public"."agent_executions" add constraint "agent_executions_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."agent_executions" validate constraint "agent_executions_status_check";

alter table "public"."agent_executions" add constraint "agent_executions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."agent_executions" validate constraint "agent_executions_user_id_fkey";

alter table "public"."agent_schedules" add constraint "agent_schedules_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.agent_configurations(id) ON DELETE CASCADE not valid;

alter table "public"."agent_schedules" validate constraint "agent_schedules_agent_id_fkey";

alter table "public"."agent_schedules" add constraint "agent_schedules_schedule_type_check" CHECK (((schedule_type)::text = ANY ((ARRAY['once'::character varying, 'recurring'::character varying, 'cron'::character varying])::text[]))) not valid;

alter table "public"."agent_schedules" validate constraint "agent_schedules_schedule_type_check";

alter table "public"."app_tenants" add constraint "app_tenants_app_slug_tenant_id_key" UNIQUE using index "app_tenants_app_slug_tenant_id_key";

alter table "public"."app_tenants" add constraint "app_tenants_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying])::text[]))) not valid;

alter table "public"."app_tenants" validate constraint "app_tenants_status_check";

alter table "public"."calendar_availability" add constraint "calendar_availability_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."calendar_availability" validate constraint "calendar_availability_day_of_week_check";

alter table "public"."calendar_availability" add constraint "calendar_availability_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."calendar_availability" validate constraint "calendar_availability_user_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_parent_event_id_fkey" FOREIGN KEY (parent_event_id) REFERENCES public.calendar_events(id) ON DELETE SET NULL not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_parent_event_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_status_check" CHECK (((status)::text = ANY ((ARRAY['confirmed'::character varying, 'tentative'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_status_check";

alter table "public"."calendar_events" add constraint "calendar_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_user_id_fkey";

alter table "public"."calendar_integrations" add constraint "calendar_integrations_provider_check" CHECK (((provider)::text = ANY ((ARRAY['google'::character varying, 'outlook'::character varying, 'caldav'::character varying, 'apple'::character varying])::text[]))) not valid;

alter table "public"."calendar_integrations" validate constraint "calendar_integrations_provider_check";

alter table "public"."calendar_integrations" add constraint "calendar_integrations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."calendar_integrations" validate constraint "calendar_integrations_user_id_fkey";

alter table "public"."pipeline_stages" add constraint "pipeline_stages_pipeline_id_fkey" FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE not valid;

alter table "public"."pipeline_stages" validate constraint "pipeline_stages_pipeline_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_app_slug()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN 'smartcrm';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (auth.jwt()->>'tenant_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$function$
;

grant delete on table "public"."agent_configurations" to "anon";

grant insert on table "public"."agent_configurations" to "anon";

grant references on table "public"."agent_configurations" to "anon";

grant select on table "public"."agent_configurations" to "anon";

grant trigger on table "public"."agent_configurations" to "anon";

grant truncate on table "public"."agent_configurations" to "anon";

grant update on table "public"."agent_configurations" to "anon";

grant delete on table "public"."agent_configurations" to "authenticated";

grant insert on table "public"."agent_configurations" to "authenticated";

grant references on table "public"."agent_configurations" to "authenticated";

grant select on table "public"."agent_configurations" to "authenticated";

grant trigger on table "public"."agent_configurations" to "authenticated";

grant truncate on table "public"."agent_configurations" to "authenticated";

grant update on table "public"."agent_configurations" to "authenticated";

grant delete on table "public"."agent_configurations" to "service_role";

grant insert on table "public"."agent_configurations" to "service_role";

grant references on table "public"."agent_configurations" to "service_role";

grant select on table "public"."agent_configurations" to "service_role";

grant trigger on table "public"."agent_configurations" to "service_role";

grant truncate on table "public"."agent_configurations" to "service_role";

grant update on table "public"."agent_configurations" to "service_role";

grant delete on table "public"."agent_executions" to "anon";

grant insert on table "public"."agent_executions" to "anon";

grant references on table "public"."agent_executions" to "anon";

grant select on table "public"."agent_executions" to "anon";

grant trigger on table "public"."agent_executions" to "anon";

grant truncate on table "public"."agent_executions" to "anon";

grant update on table "public"."agent_executions" to "anon";

grant delete on table "public"."agent_executions" to "authenticated";

grant insert on table "public"."agent_executions" to "authenticated";

grant references on table "public"."agent_executions" to "authenticated";

grant select on table "public"."agent_executions" to "authenticated";

grant trigger on table "public"."agent_executions" to "authenticated";

grant truncate on table "public"."agent_executions" to "authenticated";

grant update on table "public"."agent_executions" to "authenticated";

grant delete on table "public"."agent_executions" to "service_role";

grant insert on table "public"."agent_executions" to "service_role";

grant references on table "public"."agent_executions" to "service_role";

grant select on table "public"."agent_executions" to "service_role";

grant trigger on table "public"."agent_executions" to "service_role";

grant truncate on table "public"."agent_executions" to "service_role";

grant update on table "public"."agent_executions" to "service_role";

grant delete on table "public"."agent_schedules" to "anon";

grant insert on table "public"."agent_schedules" to "anon";

grant references on table "public"."agent_schedules" to "anon";

grant select on table "public"."agent_schedules" to "anon";

grant trigger on table "public"."agent_schedules" to "anon";

grant truncate on table "public"."agent_schedules" to "anon";

grant update on table "public"."agent_schedules" to "anon";

grant delete on table "public"."agent_schedules" to "authenticated";

grant insert on table "public"."agent_schedules" to "authenticated";

grant references on table "public"."agent_schedules" to "authenticated";

grant select on table "public"."agent_schedules" to "authenticated";

grant trigger on table "public"."agent_schedules" to "authenticated";

grant truncate on table "public"."agent_schedules" to "authenticated";

grant update on table "public"."agent_schedules" to "authenticated";

grant delete on table "public"."agent_schedules" to "service_role";

grant insert on table "public"."agent_schedules" to "service_role";

grant references on table "public"."agent_schedules" to "service_role";

grant select on table "public"."agent_schedules" to "service_role";

grant trigger on table "public"."agent_schedules" to "service_role";

grant truncate on table "public"."agent_schedules" to "service_role";

grant update on table "public"."agent_schedules" to "service_role";

grant delete on table "public"."app_tenants" to "anon";

grant insert on table "public"."app_tenants" to "anon";

grant references on table "public"."app_tenants" to "anon";

grant select on table "public"."app_tenants" to "anon";

grant trigger on table "public"."app_tenants" to "anon";

grant truncate on table "public"."app_tenants" to "anon";

grant update on table "public"."app_tenants" to "anon";

grant delete on table "public"."app_tenants" to "authenticated";

grant insert on table "public"."app_tenants" to "authenticated";

grant references on table "public"."app_tenants" to "authenticated";

grant select on table "public"."app_tenants" to "authenticated";

grant trigger on table "public"."app_tenants" to "authenticated";

grant truncate on table "public"."app_tenants" to "authenticated";

grant update on table "public"."app_tenants" to "authenticated";

grant delete on table "public"."app_tenants" to "service_role";

grant insert on table "public"."app_tenants" to "service_role";

grant references on table "public"."app_tenants" to "service_role";

grant select on table "public"."app_tenants" to "service_role";

grant trigger on table "public"."app_tenants" to "service_role";

grant truncate on table "public"."app_tenants" to "service_role";

grant update on table "public"."app_tenants" to "service_role";

grant delete on table "public"."calendar_availability" to "anon";

grant insert on table "public"."calendar_availability" to "anon";

grant references on table "public"."calendar_availability" to "anon";

grant select on table "public"."calendar_availability" to "anon";

grant trigger on table "public"."calendar_availability" to "anon";

grant truncate on table "public"."calendar_availability" to "anon";

grant update on table "public"."calendar_availability" to "anon";

grant delete on table "public"."calendar_availability" to "authenticated";

grant insert on table "public"."calendar_availability" to "authenticated";

grant references on table "public"."calendar_availability" to "authenticated";

grant select on table "public"."calendar_availability" to "authenticated";

grant trigger on table "public"."calendar_availability" to "authenticated";

grant truncate on table "public"."calendar_availability" to "authenticated";

grant update on table "public"."calendar_availability" to "authenticated";

grant delete on table "public"."calendar_availability" to "service_role";

grant insert on table "public"."calendar_availability" to "service_role";

grant references on table "public"."calendar_availability" to "service_role";

grant select on table "public"."calendar_availability" to "service_role";

grant trigger on table "public"."calendar_availability" to "service_role";

grant truncate on table "public"."calendar_availability" to "service_role";

grant update on table "public"."calendar_availability" to "service_role";

grant delete on table "public"."calendar_events" to "anon";

grant insert on table "public"."calendar_events" to "anon";

grant references on table "public"."calendar_events" to "anon";

grant select on table "public"."calendar_events" to "anon";

grant trigger on table "public"."calendar_events" to "anon";

grant truncate on table "public"."calendar_events" to "anon";

grant update on table "public"."calendar_events" to "anon";

grant delete on table "public"."calendar_events" to "authenticated";

grant insert on table "public"."calendar_events" to "authenticated";

grant references on table "public"."calendar_events" to "authenticated";

grant select on table "public"."calendar_events" to "authenticated";

grant trigger on table "public"."calendar_events" to "authenticated";

grant truncate on table "public"."calendar_events" to "authenticated";

grant update on table "public"."calendar_events" to "authenticated";

grant delete on table "public"."calendar_events" to "service_role";

grant insert on table "public"."calendar_events" to "service_role";

grant references on table "public"."calendar_events" to "service_role";

grant select on table "public"."calendar_events" to "service_role";

grant trigger on table "public"."calendar_events" to "service_role";

grant truncate on table "public"."calendar_events" to "service_role";

grant update on table "public"."calendar_events" to "service_role";

grant delete on table "public"."calendar_integrations" to "anon";

grant insert on table "public"."calendar_integrations" to "anon";

grant references on table "public"."calendar_integrations" to "anon";

grant select on table "public"."calendar_integrations" to "anon";

grant trigger on table "public"."calendar_integrations" to "anon";

grant truncate on table "public"."calendar_integrations" to "anon";

grant update on table "public"."calendar_integrations" to "anon";

grant delete on table "public"."calendar_integrations" to "authenticated";

grant insert on table "public"."calendar_integrations" to "authenticated";

grant references on table "public"."calendar_integrations" to "authenticated";

grant select on table "public"."calendar_integrations" to "authenticated";

grant trigger on table "public"."calendar_integrations" to "authenticated";

grant truncate on table "public"."calendar_integrations" to "authenticated";

grant update on table "public"."calendar_integrations" to "authenticated";

grant delete on table "public"."calendar_integrations" to "service_role";

grant insert on table "public"."calendar_integrations" to "service_role";

grant references on table "public"."calendar_integrations" to "service_role";

grant select on table "public"."calendar_integrations" to "service_role";

grant trigger on table "public"."calendar_integrations" to "service_role";

grant truncate on table "public"."calendar_integrations" to "service_role";

grant update on table "public"."calendar_integrations" to "service_role";

grant delete on table "public"."pipeline_stages" to "anon";

grant insert on table "public"."pipeline_stages" to "anon";

grant references on table "public"."pipeline_stages" to "anon";

grant select on table "public"."pipeline_stages" to "anon";

grant trigger on table "public"."pipeline_stages" to "anon";

grant truncate on table "public"."pipeline_stages" to "anon";

grant update on table "public"."pipeline_stages" to "anon";

grant delete on table "public"."pipeline_stages" to "authenticated";

grant insert on table "public"."pipeline_stages" to "authenticated";

grant references on table "public"."pipeline_stages" to "authenticated";

grant select on table "public"."pipeline_stages" to "authenticated";

grant trigger on table "public"."pipeline_stages" to "authenticated";

grant truncate on table "public"."pipeline_stages" to "authenticated";

grant update on table "public"."pipeline_stages" to "authenticated";

grant delete on table "public"."pipeline_stages" to "service_role";

grant insert on table "public"."pipeline_stages" to "service_role";

grant references on table "public"."pipeline_stages" to "service_role";

grant select on table "public"."pipeline_stages" to "service_role";

grant trigger on table "public"."pipeline_stages" to "service_role";

grant truncate on table "public"."pipeline_stages" to "service_role";

grant update on table "public"."pipeline_stages" to "service_role";

grant delete on table "public"."pipelines" to "anon";

grant insert on table "public"."pipelines" to "anon";

grant references on table "public"."pipelines" to "anon";

grant select on table "public"."pipelines" to "anon";

grant trigger on table "public"."pipelines" to "anon";

grant truncate on table "public"."pipelines" to "anon";

grant update on table "public"."pipelines" to "anon";

grant delete on table "public"."pipelines" to "authenticated";

grant insert on table "public"."pipelines" to "authenticated";

grant references on table "public"."pipelines" to "authenticated";

grant select on table "public"."pipelines" to "authenticated";

grant trigger on table "public"."pipelines" to "authenticated";

grant truncate on table "public"."pipelines" to "authenticated";

grant update on table "public"."pipelines" to "authenticated";

grant delete on table "public"."pipelines" to "service_role";

grant insert on table "public"."pipelines" to "service_role";

grant references on table "public"."pipelines" to "service_role";

grant select on table "public"."pipelines" to "service_role";

grant trigger on table "public"."pipelines" to "service_role";

grant truncate on table "public"."pipelines" to "service_role";

grant update on table "public"."pipelines" to "service_role";


  create policy "agent_configurations_insert"
  on "public"."agent_configurations"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_configurations_select"
  on "public"."agent_configurations"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_configurations_update"
  on "public"."agent_configurations"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_executions_insert"
  on "public"."agent_executions"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_executions_select"
  on "public"."agent_executions"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_executions_update"
  on "public"."agent_executions"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_schedules_insert"
  on "public"."agent_schedules"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_schedules_select"
  on "public"."agent_schedules"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "agent_schedules_update"
  on "public"."agent_schedules"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "app_tenants_insert"
  on "public"."app_tenants"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "app_tenants_select"
  on "public"."app_tenants"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "app_tenants_update"
  on "public"."app_tenants"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "calendar_availability_insert"
  on "public"."calendar_availability"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) OR (user_id = auth.uid()))));



  create policy "calendar_availability_select"
  on "public"."calendar_availability"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) OR (user_id = auth.uid()))));



  create policy "calendar_availability_update"
  on "public"."calendar_availability"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) OR (user_id = auth.uid()))));



  create policy "calendar_events_delete"
  on "public"."calendar_events"
  as permissive
  for delete
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) OR (user_id = auth.uid()))));



  create policy "calendar_events_insert"
  on "public"."calendar_events"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) OR (user_id = auth.uid()))));



  create policy "calendar_events_select"
  on "public"."calendar_events"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) OR (user_id = auth.uid()))));



  create policy "calendar_events_update"
  on "public"."calendar_events"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) OR (user_id = auth.uid()))));



  create policy "calendar_integrations_insert"
  on "public"."calendar_integrations"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND (user_id = auth.uid())));



  create policy "calendar_integrations_select"
  on "public"."calendar_integrations"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (user_id = auth.uid())));



  create policy "calendar_integrations_update"
  on "public"."calendar_integrations"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (user_id = auth.uid())));



  create policy "pipeline_stages_insert"
  on "public"."pipeline_stages"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "pipeline_stages_select"
  on "public"."pipeline_stages"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "pipeline_stages_update"
  on "public"."pipeline_stages"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "pipelines_delete"
  on "public"."pipelines"
  as permissive
  for delete
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "pipelines_insert"
  on "public"."pipelines"
  as permissive
  for insert
  to public
with check ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "pipelines_select"
  on "public"."pipelines"
  as permissive
  for select
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



  create policy "pipelines_update"
  on "public"."pipelines"
  as permissive
  for update
  to public
using ((((app_slug)::text = 'smartcrm'::text) AND (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)));



