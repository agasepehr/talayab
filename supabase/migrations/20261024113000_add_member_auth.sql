-- Member authentication and registration
create or replace function public.complete_member_registration(
  p_full_name text,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_user public.users%rowtype;
begin
  if v_uid is null or v_email = '' then
    raise exception 'not_authenticated';
  end if;

  if coalesce(trim(p_full_name),'') = '' then
    raise exception 'full_name_required';
  end if;

  select * into v_user
  from public.users
  where auth_user_id = v_uid
     or lower(coalesce(email,'')) = v_email
  order by case when auth_user_id = v_uid then 0 else 1 end, id
  limit 1;

  if v_user.id is null then
    insert into public.users(full_name,phone,email,role,auth_user_id,created_at)
    values(trim(p_full_name),nullif(trim(p_phone),''),v_email,'customer',v_uid,now())
    returning * into v_user;
  else
    update public.users
    set full_name = trim(p_full_name),
        phone = nullif(trim(p_phone),''),
        email = v_email,
        auth_user_id = v_uid
    where id = v_user.id
    returning * into v_user;
  end if;

  return jsonb_build_object(
    'id',v_user.id,
    'full_name',v_user.full_name,
    'email',v_user.email,
    'phone',v_user.phone,
    'role',coalesce(v_user.role,'customer')
  );
end;
$$;

revoke execute on function public.complete_member_registration(text,text) from public, anon;
grant execute on function public.complete_member_registration(text,text) to authenticated;

create or replace function public.get_my_role()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select role into v_role
  from public.users
  where auth_user_id = auth.uid()
  order by id
  limit 1;

  return jsonb_build_object('role',coalesce(v_role,'customer'));
end;
$$;

revoke execute on function public.get_my_role() from public, anon;
grant execute on function public.get_my_role() to authenticated;

drop policy if exists "Users can create own profile" on public.users;
create policy "Users can create own customer profile"
on public.users
for insert
to authenticated
with check (
  auth_user_id = (select auth.uid())
  and lower(coalesce(email,'')) = lower(coalesce((select auth.jwt()->>'email'), ''))
  and coalesce(role,'customer') = 'customer'
);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own customer profile"
on public.users
for update
to authenticated
using (
  auth_user_id = (select auth.uid())
)
with check (
  auth_user_id = (select auth.uid())
  and lower(coalesce(email,'')) = lower(coalesce((select auth.jwt()->>'email'), ''))
  and coalesce(role,'customer') = 'customer'
);
