create or replace function public.get_admin_market_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_current public.market_prices%rowtype;
  v_latest public.market_price_updates%rowtype;
  v_history jsonb;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid()
  limit 1;

  if coalesce(v_role, '') <> 'admin' then
    raise exception 'not_authorized';
  end if;

  select * into v_current
  from public.market_prices
  where id = 1
  limit 1;

  select * into v_latest
  from public.market_price_updates
  order by fetched_at desc
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'gold18_toman', gold18_toman,
        'gold18_rial', gold18_rial,
        'source', source,
        'source_url', source_url,
        'fetched_at', fetched_at,
        'status', status,
        'error_message', error_message
      )
      order by fetched_at desc
    ),
    '[]'::jsonb
  )
  into v_history
  from (
    select *
    from public.market_price_updates
    order by fetched_at desc
    limit 50
  ) recent;

  return jsonb_build_object(
    'current', jsonb_build_object(
      'gold18_toman', v_current.gold18,
      'updated_at', v_current.updated_at,
      'last_status', coalesce(v_latest.status, 'unknown'),
      'last_source', coalesce(v_latest.source, 'TGJU'),
      'last_source_url', coalesce(v_latest.source_url, 'https://www.tgju.org/profile/geram18')
    ),
    'history', v_history
  );
end;
$$;

create or replace function public.admin_refresh_gold18_price()
returns jsonb
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_role text;
  v_request_id bigint;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid()
  limit 1;

  if coalesce(v_role, '') <> 'admin' then
    raise exception 'not_authorized';
  end if;

  v_request_id := public.queue_gold18_price_fetch();

  return jsonb_build_object(
    'status', 'queued',
    'request_id', v_request_id
  );
end;
$$;

revoke execute on function public.get_admin_market_dashboard() from public, anon;
grant execute on function public.get_admin_market_dashboard() to authenticated;

revoke execute on function public.admin_refresh_gold18_price() from public, anon;
grant execute on function public.admin_refresh_gold18_price() to authenticated;
