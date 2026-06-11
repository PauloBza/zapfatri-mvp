-- ZapFatri - Patch Cloudflare Worker
-- Rode este arquivo no SQL Editor do Supabase depois do 001_schema.sql.

alter table click_events
  add column if not exists raw_slug text;

alter table click_events
  add column if not exists destination_url text;

alter table click_events
  add column if not exists edge_runtime text;

create index if not exists idx_click_events_raw_slug on click_events(raw_slug);
create index if not exists idx_click_events_edge_runtime on click_events(edge_runtime);

-- Função usada pelo Cloudflare Worker para registrar cliques em segundo plano.
-- Ela recebe o slug e um payload JSON, resolve o link cadastrado e insere o evento.
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
