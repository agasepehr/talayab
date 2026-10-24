-- Allow the pre-configured site owner to activate their first Supabase Auth identity
-- through the public login flow. This function exposes only a boolean.

create or replace function public.is_admin_email(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.users
    where lower(coalesce(email,'')) = lower(trim(coalesce(p_email,'')))
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin_email(text) from public;
grant execute on function public.is_admin_email(text) to anon, authenticated;
