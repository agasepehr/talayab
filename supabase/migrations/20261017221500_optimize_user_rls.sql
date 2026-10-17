drop policy if exists "Users can create own profile" on public.users;
create policy "Users can create own profile"
on public.users
for insert
to authenticated
with check (
  auth_user_id = (select auth.uid())
  and lower(coalesce(email, ''::text)) =
      lower(coalesce((select (auth.jwt() ->> 'email'::text)), ''::text))
  and coalesce(role, 'seller'::text) = 'seller'::text
);

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
to authenticated
using (
  (auth_user_id = (select auth.uid()))
  or (
    auth_user_id is null
    and lower(coalesce(email, ''::text)) =
        lower(coalesce((select (auth.jwt() ->> 'email'::text)), ''::text))
  )
);
