create index if not exists products_shop_status_idx
on public.products (shop_id, status);

create index if not exists shops_owner_status_idx
on public.shops___ (owner_id, status);

create index if not exists analytics_events_shop_created_at_idx
on public.analytics_events (shop_id, created_at desc);