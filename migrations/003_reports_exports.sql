-- ZapFatri - Patch 003
-- Relatórios limpos, colunas de localização e exportação semanal/mensal.
-- Rode este arquivo no SQL Editor do Supabase depois do 001 e 002.

alter table click_events add column if not exists timezone text;
alter table click_events add column if not exists latitude text;
alter table click_events add column if not exists longitude text;
alter table click_events add column if not exists postal_code text;
alter table click_events add column if not exists colo text;
alter table click_events add column if not exists asn text;
alter table click_events add column if not exists as_organization text;

create index if not exists idx_click_events_country on click_events(country);
create index if not exists idx_click_events_city on click_events(city);
create index if not exists idx_click_events_campaign on click_events(campaign);
create index if not exists idx_click_events_medium on click_events(medium);

-- Atualiza a função usada pelo Cloudflare Worker para também salvar localização enriquecida.
create or replace function zapfatri_log_click_by_slug(
  p_slug text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_id uuid;
begin
  select id
    into v_link_id
  from tracked_links
  where slug = p_slug
    and active = true
  limit 1;

  insert into click_events (
    tracked_link_id,
    raw_slug,
    source,
    medium,
    campaign,
    video,
    post,
    placement,
    referrer,
    user_agent,
    ip_hash,
    country,
    region,
    city,
    timezone,
    latitude,
    longitude,
    postal_code,
    colo,
    asn,
    as_organization,
    device_type,
    browser,
    os,
    is_bot,
    query_params,
    destination_url,
    edge_runtime
  )
  values (
    v_link_id,
    p_slug,
    nullif(p_payload->>'source', ''),
    nullif(p_payload->>'medium', ''),
    nullif(p_payload->>'campaign', ''),
    nullif(p_payload->>'video', ''),
    nullif(p_payload->>'post', ''),
    nullif(p_payload->>'placement', ''),
    nullif(p_payload->>'referrer', ''),
    nullif(p_payload->>'user_agent', ''),
    nullif(p_payload->>'ip_hash', ''),
    nullif(p_payload->>'country', ''),
    nullif(p_payload->>'region', ''),
    nullif(p_payload->>'city', ''),
    nullif(p_payload->>'timezone', ''),
    nullif(p_payload->>'latitude', ''),
    nullif(p_payload->>'longitude', ''),
    nullif(p_payload->>'postal_code', ''),
    nullif(p_payload->>'colo', ''),
    nullif(p_payload->>'asn', ''),
    nullif(p_payload->>'as_organization', ''),
    nullif(p_payload->>'device_type', ''),
    nullif(p_payload->>'browser', ''),
    nullif(p_payload->>'os', ''),
    coalesce((p_payload->>'is_bot')::boolean, false),
    coalesce(p_payload->'query_params', '{}'::jsonb),
    nullif(p_payload->>'destination_url', ''),
    coalesce(nullif(p_payload->>'edge_runtime', ''), 'cloudflare-worker')
  );
end;
$$;

create or replace view weekly_report as
select
  date_trunc('week', c.clicked_at) as week_start,
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
  c.country,
  c.region,
  c.city,
  c.device_type,
  c.browser,
  c.os,
  count(*) as total_clicks,
  count(*) filter (where c.is_bot = false) as human_clicks,
  count(*) filter (where c.is_bot = true) as bot_clicks
from click_events c
left join tracked_links l on l.id = c.tracked_link_id
group by
  date_trunc('week', c.clicked_at),
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
  c.placement,
  c.country,
  c.region,
  c.city,
  c.device_type,
  c.browser,
  c.os;

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
  c.country,
  c.region,
  c.city,
  c.device_type,
  c.browser,
  c.os,
  count(*) as total_clicks,
  count(*) filter (where c.is_bot = false) as human_clicks,
  count(*) filter (where c.is_bot = true) as bot_clicks
from click_events c
left join tracked_links l on l.id = c.tracked_link_id
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
  c.placement,
  c.country,
  c.region,
  c.city,
  c.device_type,
  c.browser,
  c.os;

create or replace view location_report as
select
  date_trunc('month', c.clicked_at) as month,
  c.country,
  c.region,
  c.city,
  count(*) as total_clicks,
  count(*) filter (where c.is_bot = false) as human_clicks,
  count(*) filter (where c.is_bot = true) as bot_clicks
from click_events c
group by
  date_trunc('month', c.clicked_at),
  c.country,
  c.region,
  c.city;
