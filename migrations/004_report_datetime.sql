-- ZapFatri - Patch 004
-- Adiciona data/hora de primeiro e último clique aos relatórios semanal e mensal.
-- Seguro: apaga somente views de relatório e recria. Não apaga tabelas nem cliques.

drop view if exists public.weekly_report cascade;
drop view if exists public.monthly_report cascade;

create or replace view public.weekly_report as
select
  date_trunc('week', c.clicked_at) as week_start,
  min(c.clicked_at) as first_click_at,
  max(c.clicked_at) as last_click_at,
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

create or replace view public.monthly_report as
select
  date_trunc('month', c.clicked_at) as month,
  min(c.clicked_at) as first_click_at,
  max(c.clicked_at) as last_click_at,
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

notify pgrst, 'reload schema';
