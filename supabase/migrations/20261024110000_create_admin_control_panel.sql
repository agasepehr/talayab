-- TheTala admin control panel RPCs
-- Schema changes are intentionally limited to privileged, authenticated admin operations.

create or replace function public.admin_assert()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.users
    where auth_user_id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'not_authorized';
  end if;
end;
$$;

revoke execute on function public.admin_assert() from public, anon;
grant execute on function public.admin_assert() to authenticated;

create or replace function public.admin_get_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_market public.market_prices%rowtype;
  v_latest public.market_price_updates%rowtype;
begin
  perform public.admin_assert();

  select * into v_market
  from public.market_prices
  order by id desc
  limit 1;

  select * into v_latest
  from public.market_price_updates
  order by fetched_at desc
  limit 1;

  select jsonb_build_object(
    'shops_total', (select count(*) from public.shops___),
    'shops_active', (select count(*) from public.shops___ where coalesce(status,'active')='active'),
    'shops_inactive', (select count(*) from public.shops___ where coalesce(status,'active')<>'active'),
    'products_total', (select count(*) from public.products),
    'products_active', (select count(*) from public.products where coalesce(status,'active')='active'),
    'products_inactive', (select count(*) from public.products where coalesce(status,'active')<>'active'),
    'users_total', (select count(*) from public.users),
    'sellers_total', (select count(*) from public.users where role='seller'),
    'admins_total', (select count(*) from public.users where role='admin'),
    'categories_total', (select count(*) from public.categories),
    'events_30d', (select count(*) from public.analytics_events where created_at >= now() - interval '30 days'),
    'product_views_30d', (select count(*) from public.analytics_events where event_type='product_view' and created_at >= now() - interval '30 days'),
    'contact_clicks_30d', (select count(*) from public.analytics_events where event_type='contact_click' and created_at >= now() - interval '30 days'),
    'store_views_30d', (select count(*) from public.analytics_events where event_type='store_page_view' and created_at >= now() - interval '30 days'),
    'market_gold18', v_market.gold18,
    'market_updated_at', v_market.updated_at,
    'market_status', coalesce(v_latest.status,'unknown')
  )
  into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_get_dashboard() from public, anon;
grant execute on function public.admin_get_dashboard() to authenticated;

create or replace function public.admin_get_shops()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'owner_id', s.owner_id,
        'owner_name', u.full_name,
        'owner_email', u.email,
        'shop_name', s.shop_name,
        'logo', s.logo,
        'description', s.description,
        'city', s.city,
        'phone', s.phone,
        'instagram', s.instagram,
        'latitude', s.latitude,
        'longitude', s.longitude,
        'status', coalesce(s.status,'active'),
        'created_at', s.created_at
      )
      order by s.id desc
    )
    from public.shops___ s
    left join public.users u on u.id = s.owner_id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_get_shops() from public, anon;
grant execute on function public.admin_get_shops() to authenticated;

create or replace function public.admin_save_shop(
  p_id bigint default null,
  p_owner_id bigint default null,
  p_shop_name text default null,
  p_logo text default null,
  p_description text default null,
  p_city text default null,
  p_phone text default null,
  p_instagram text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_status text default 'active'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.shops___%rowtype;
begin
  perform public.admin_assert();

  if coalesce(trim(p_shop_name),'') = '' then
    raise exception 'shop_name_required';
  end if;

  if p_owner_id is not null and not exists(select 1 from public.users where id=p_owner_id) then
    raise exception 'owner_not_found';
  end if;

  if coalesce(p_status,'active') not in ('active','inactive') then
    raise exception 'invalid_status';
  end if;

  if p_id is null then
    insert into public.shops___ (
      owner_id, shop_name, logo, description, city, phone, instagram,
      latitude, longitude, status
    )
    values (
      p_owner_id, trim(p_shop_name), nullif(trim(p_logo),''),
      nullif(trim(p_description),''), nullif(trim(p_city),''),
      nullif(trim(p_phone),''), nullif(trim(p_instagram),''),
      p_latitude, p_longitude, coalesce(p_status,'active')
    )
    returning * into v_row;
  else
    update public.shops___
    set owner_id = p_owner_id,
        shop_name = trim(p_shop_name),
        logo = nullif(trim(p_logo),''),
        description = nullif(trim(p_description),''),
        city = nullif(trim(p_city),''),
        phone = nullif(trim(p_phone),''),
        instagram = nullif(trim(p_instagram),''),
        latitude = p_latitude,
        longitude = p_longitude,
        status = coalesce(p_status,'active')
    where id=p_id
    returning * into v_row;

    if not found then
      raise exception 'shop_not_found';
    end if;
  end if;

  return jsonb_build_object(
    'id', v_row.id, 'owner_id', v_row.owner_id, 'shop_name', v_row.shop_name,
    'logo', v_row.logo, 'description', v_row.description, 'city', v_row.city,
    'phone', v_row.phone, 'instagram', v_row.instagram, 'latitude', v_row.latitude,
    'longitude', v_row.longitude, 'status', v_row.status, 'created_at', v_row.created_at
  );
end;
$$;

revoke execute on function public.admin_save_shop(bigint,bigint,text,text,text,text,text,text,numeric,numeric,text) from public, anon;
grant execute on function public.admin_save_shop(bigint,bigint,text,text,text,text,text,text,numeric,numeric,text) to authenticated;

create or replace function public.admin_get_products()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id, 'shop_id', p.shop_id, 'shop_name', s.shop_name,
        'category_id', p.category_id, 'category_name', c.name,
        'title', p.title, 'description', p.description, 'weight', p.weight,
        'karat', p.karat, 'wage_type', p.wage_type, 'wage_value', p.wage_value,
        'profit_percent', p.profit_percent, 'extra_fee', p.extra_fee,
        'image', p.image, 'status', coalesce(p.status,'active'), 'created_at', p.created_at
      )
      order by p.id desc
    )
    from public.products p
    left join public.shops___ s on s.id=p.shop_id
    left join public.categories c on c.id=p.category_id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_get_products() from public, anon;
grant execute on function public.admin_get_products() to authenticated;

create or replace function public.admin_save_product(
  p_id bigint default null,
  p_shop_id bigint default null,
  p_category_id bigint default null,
  p_title text default null,
  p_description text default null,
  p_weight numeric default null,
  p_karat bigint default 18,
  p_wage_type text default 'percent',
  p_wage_value numeric default 0,
  p_profit_percent numeric default 0,
  p_extra_fee numeric default 0,
  p_image text default null,
  p_status text default 'active'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.products%rowtype;
begin
  perform public.admin_assert();

  if p_shop_id is null or not exists(select 1 from public.shops___ where id=p_shop_id) then
    raise exception 'shop_not_found';
  end if;

  if p_category_id is not null and not exists(select 1 from public.categories where id=p_category_id) then
    raise exception 'category_not_found';
  end if;

  if coalesce(trim(p_title),'') = '' then
    raise exception 'title_required';
  end if;

  if p_status is not null and p_status not in ('active','inactive') then
    raise exception 'invalid_status';
  end if;

  if p_id is null then
    insert into public.products (
      shop_id, category_id, title, description, weight, karat, wage_type,
      wage_value, profit_percent, extra_fee, image, status
    )
    values (
      p_shop_id, p_category_id, trim(p_title), nullif(trim(p_description),''),
      p_weight, p_karat, coalesce(p_wage_type,'percent'), coalesce(p_wage_value,0),
      coalesce(p_profit_percent,0), coalesce(p_extra_fee,0), nullif(trim(p_image),''),
      coalesce(p_status,'active')
    )
    returning * into v_row;
  else
    update public.products
    set shop_id=p_shop_id, category_id=p_category_id, title=trim(p_title),
        description=nullif(trim(p_description),''), weight=p_weight, karat=p_karat,
        wage_type=coalesce(p_wage_type,'percent'), wage_value=coalesce(p_wage_value,0),
        profit_percent=coalesce(p_profit_percent,0), extra_fee=coalesce(p_extra_fee,0),
        image=nullif(trim(p_image),''), status=coalesce(p_status,'active')
    where id=p_id
    returning * into v_row;

    if not found then
      raise exception 'product_not_found';
    end if;
  end if;

  return jsonb_build_object(
    'id', v_row.id, 'shop_id', v_row.shop_id, 'category_id', v_row.category_id,
    'title', v_row.title, 'description', v_row.description, 'weight', v_row.weight,
    'karat', v_row.karat, 'wage_type', v_row.wage_type, 'wage_value', v_row.wage_value,
    'profit_percent', v_row.profit_percent, 'extra_fee', v_row.extra_fee,
    'image', v_row.image, 'status', v_row.status, 'created_at', v_row.created_at
  );
end;
$$;

revoke execute on function public.admin_save_product(bigint,bigint,bigint,text,text,numeric,bigint,text,numeric,numeric,numeric,text,text) from public, anon;
grant execute on function public.admin_save_product(bigint,bigint,bigint,text,text,numeric,bigint,text,numeric,numeric,numeric,text,text) to authenticated;

create or replace function public.admin_get_categories()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', c.id, 'name', c.name, 'image', c.image,
        'parent_id', c.parent_id, 'created_at', c.created_at
      )
      order by c.id
    )
    from public.categories c
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_get_categories() from public, anon;
grant execute on function public.admin_get_categories() to authenticated;

create or replace function public.admin_save_category(
  p_id bigint default null,
  p_name text default null,
  p_image text default null,
  p_parent_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.categories%rowtype;
begin
  perform public.admin_assert();

  if coalesce(trim(p_name),'')='' then
    raise exception 'category_name_required';
  end if;

  if p_parent_id is not null and p_parent_id=p_id then
    raise exception 'invalid_parent';
  end if;

  if p_parent_id is not null and not exists(select 1 from public.categories where id=p_parent_id) then
    raise exception 'parent_not_found';
  end if;

  if p_id is null then
    insert into public.categories(name,image,parent_id)
    values(trim(p_name), nullif(trim(p_image),''), p_parent_id)
    returning * into v_row;
  else
    update public.categories
    set name=trim(p_name), image=nullif(trim(p_image),''), parent_id=p_parent_id
    where id=p_id
    returning * into v_row;

    if not found then
      raise exception 'category_not_found';
    end if;
  end if;

  return jsonb_build_object(
    'id', v_row.id, 'name', v_row.name, 'image', v_row.image,
    'parent_id', v_row.parent_id, 'created_at', v_row.created_at
  );
end;
$$;

revoke execute on function public.admin_save_category(bigint,text,text,bigint) from public, anon;
grant execute on function public.admin_save_category(bigint,text,text,bigint) to authenticated;

create or replace function public.admin_get_users()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', u.id, 'full_name', u.full_name, 'email', u.email, 'phone', u.phone,
        'role', coalesce(u.role,'seller'), 'created_at', u.created_at,
        'auth_user_id', u.auth_user_id
      )
      order by u.id desc
    )
    from public.users u
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_get_users() from public, anon;
grant execute on function public.admin_get_users() to authenticated;

create or replace function public.admin_set_user_role(
  p_id bigint,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.users%rowtype;
  v_actor_id bigint;
begin
  perform public.admin_assert();

  if p_role not in ('admin','seller') then
    raise exception 'invalid_role';
  end if;

  select id into v_actor_id
  from public.users
  where auth_user_id=auth.uid() and role='admin'
  limit 1;

  if p_id=v_actor_id and p_role<>'admin' then
    raise exception 'cannot_demote_self';
  end if;

  if p_role<>'admin' and (select count(*) from public.users where role='admin')<=1 then
    raise exception 'cannot_remove_last_admin';
  end if;

  update public.users
  set role=p_role
  where id=p_id
  returning * into v_row;

  if not found then
    raise exception 'user_not_found';
  end if;

  return jsonb_build_object(
    'id', v_row.id, 'full_name', v_row.full_name, 'email', v_row.email,
    'phone', v_row.phone, 'role', v_row.role, 'created_at', v_row.created_at,
    'auth_user_id', v_row.auth_user_id
  );
end;
$$;

revoke execute on function public.admin_set_user_role(bigint,text) from public, anon;
grant execute on function public.admin_set_user_role(bigint,text) to authenticated;

create or replace function public.admin_get_analytics(
  p_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days,30),365));
  v_from timestamptz := now() - make_interval(days=>greatest(1, least(coalesce(p_days,30),365)));
begin
  perform public.admin_assert();

  return jsonb_build_object(
    'days', v_days,
    'summary', jsonb_build_object(
      'events', (select count(*) from public.analytics_events where created_at>=v_from),
      'product_views', (select count(*) from public.analytics_events where event_type='product_view' and created_at>=v_from),
      'contact_clicks', (select count(*) from public.analytics_events where event_type='contact_click' and created_at>=v_from),
      'map_clicks', (select count(*) from public.analytics_events where event_type='map_click' and created_at>=v_from),
      'instagram_clicks', (select count(*) from public.analytics_events where event_type='instagram_click' and created_at>=v_from),
      'list_impressions', (select count(*) from public.analytics_events where event_type='list_impression' and created_at>=v_from),
      'store_page_views', (select count(*) from public.analytics_events where event_type='store_page_view' and created_at>=v_from),
      'unique_visitors', (select count(distinct visitor_id) from public.analytics_events where created_at>=v_from and visitor_id is not null)
    ),
    'top_products', coalesce((
      select jsonb_agg(row_to_json(x) order by x.views desc)
      from (
        select p.id, p.title, s.shop_name,
               count(*) filter (where e.event_type='product_view') as views,
               count(*) filter (where e.event_type='contact_click') as contact_clicks,
               count(distinct e.visitor_id) filter (where e.event_type='product_view' and e.visitor_id is not null) as unique_views
        from public.analytics_events e
        join public.products p on p.id=e.product_id
        left join public.shops___ s on s.id=p.shop_id
        where e.created_at>=v_from and e.product_id is not null
        group by p.id, p.title, s.shop_name
        order by count(*) filter (where e.event_type='product_view') desc
        limit 10
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.admin_get_analytics(integer) from public, anon;
grant execute on function public.admin_get_analytics(integer) to authenticated;
