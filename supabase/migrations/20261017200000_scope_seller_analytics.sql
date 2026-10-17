create or replace function public.get_seller_analytics(p_days integer default 30)
returns jsonb
language sql
set search_path to 'public'
as $function$
  with params as (
    select greatest(1, least(coalesce(p_days, 90), 366)) as days
  ),
  seller_shop as (
    select s.id
    from public.shops___ s
    join public.users u on u.id = s.owner_id
    where u.auth_user_id = auth.uid()
    order by s.id
    limit 1
  ),
  events as (
    select
      ae.id,
      ae.shop_id,
      ae.product_id,
      ae.event_type,
      ae.visitor_id,
      ae.created_at
    from public.analytics_events ae
    cross join params
    where ae.shop_id = (select id from seller_shop)
      and ae.created_at >= now() - make_interval(days => params.days)
  ),
  summary as (
    select
      count(*) filter (where event_type = 'product_view') as views,
      count(distinct visitor_id) filter (
        where event_type = 'product_view' and visitor_id is not null
      ) as unique_views,
      count(*) filter (where event_type = 'contact_click') as contact_clicks,
      count(*) filter (where event_type = 'map_click') as map_clicks,
      count(*) filter (where event_type = 'instagram_click') as instagram_clicks,
      count(*) filter (where event_type = 'list_impression') as list_impressions,
      count(*) filter (where event_type = 'store_page_view') as store_page_views
    from events
  ),
  product_stats as (
    select
      p.id,
      p.title as name,
      c.name as category,
      p.weight,
      p.status,
      count(*) filter (where e.event_type = 'product_view') as views,
      count(distinct e.visitor_id) filter (
        where e.event_type = 'product_view' and e.visitor_id is not null
      ) as unique_views,
      count(*) filter (where e.event_type = 'contact_click') as contact_clicks,
      count(*) filter (where e.event_type = 'map_click') as map_clicks,
      count(*) filter (where e.event_type = 'instagram_click') as instagram_clicks,
      count(*) filter (where e.event_type = 'list_impression') as list_impressions,
      count(*) filter (where e.event_type = 'store_page_view') as store_page_views
    from public.products p
    join seller_shop ss on ss.id = p.shop_id
    left join events e on e.product_id = p.id
    left join public.categories c on c.id = p.category_id
    group by p.id, p.title, c.name, p.weight, p.status
    order by p.id
  )
  select jsonb_build_object(
    'summary', (select to_jsonb(summary) from summary),
    'products', coalesce(
      (select jsonb_agg(to_jsonb(product_stats) order by product_stats.id) from product_stats),
      '[]'::jsonb
    )
  );
$function$;
