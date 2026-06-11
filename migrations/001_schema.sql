-- ZapFatri MVP - Supabase schema
-- Rode este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists tracked_links (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text unique not null,

  link_type text not null check (link_type in ('whatsapp', 'url')),
  destination_url text,

  whatsapp_phone text,
  whatsapp_message text,

  client text,
  campaign text,
  default_source text,

  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint tracked_links_destination_check check (
    (link_type = 'url' and destination_url is not null)
    or
    (link_type = 'whatsapp' and whatsapp_phone is not null)
  )
);

create table if not exists click_events (
  id bigserial primary key,

  tracked_link_id uuid references tracked_links(id) on delete cascade,

  clicked_at timestamptz default now(),

  source text,
  medium text,
  campaign text,
  video text,
  post text,
  placement text,

  referrer text,
  user_agent text,
  ip_hash text,

  country text,
  region text,
  city text,

  device_type text,
  browser text,
  os text,

  is_bot boolean default false,
  query_params jsonb
);

create index if not exists idx_click_events_link_id on click_events(tracked_link_id);
create index if not exists idx_click_events_clicked_at on click_events(clicked_at);
create index if not exists idx_click_events_source on click_events(source);
create index if not exists idx_tracked_links_slug on tracked_links(slug);
create index if not exists idx_tracked_links_active on tracked_links(active);

create or replace view report_by_link as
select
  l.id as link_id,
  l.name,
  l.slug,
  l.link_type,
  l.whatsapp_phone,
  l.destination_url,
  l.client,
  l.campaign,
  l.default_source,
  l.active,
  count(c.id) as total_clicks,
  count(c.id) filter (where c.is_bot = false) as human_clicks,
  count(c.id) filter (where c.is_bot = true) as bot_clicks,
  min(c.clicked_at) as first_click,
  max(c.clicked_at) as last_click
from tracked_links l
left join click_events c on c.tracked_link_id = l.id
group by
  l.id,
  l.name,
  l.slug,
  l.link_type,
  l.whatsapp_phone,
  l.destination_url,
  l.client,
  l.campaign,
  l.default_source,
  l.active;

create or replace view monthly_report as
select
  date_trunc('month', c.clicked_at) as month,
  l.id as link_id,
  l.name,
  l.slug,
  l.link_type,
  l.whatsapp_phone,
  l.client,
  coalesce(c.campaign, l.campaign) as campaign,
  coalesce(c.source, l.default_source) as source,
  c.medium,
  c.video,
  c.placement,
  count(*) as total_clicks,
  count(*) filter (where c.is_bot = false) as human_clicks,
  count(*) filter (where c.is_bot = true) as bot_clicks
from click_events c
join tracked_links l on l.id = c.tracked_link_id
group by
  date_trunc('month', c.clicked_at),
  l.id,
  l.name,
  l.slug,
  l.link_type,
  l.whatsapp_phone,
  l.client,
  coalesce(c.campaign, l.campaign),
  coalesce(c.source, l.default_source),
  c.medium,
  c.video,
  c.placement;

-- RLS ligado. O backend usa SERVICE_ROLE_KEY no Render.
alter table tracked_links enable row level security;
alter table click_events enable row level security;

-- Sem policies públicas neste MVP.
-- Acesso administrativo pelo backend usando service_role.
