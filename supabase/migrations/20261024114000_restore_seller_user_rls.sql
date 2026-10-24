-- Restore seller self-service RLS while keeping customer registration in a privileged RPC.

drop policy if exists "Users can create own customer profile" on public.users;
drop policy if exists "Users can update own customer profile" on public.users;

create policy "Users can create own profile"
on public.users
for insert
to authenticated
with check (
  auth_user_id = (select auth.uid())
  and lower(coalesce(email,'')) = lower(coalesce((select auth.jwt()->>'email'), ''))
  and coalesce(role,'seller') = 'seller'
);

create policy "Users can update own profile"
on public.users
for update
to authenticated
using (
  auth_user_id = (select auth.uid())
  or (
    auth_user_id is null
    and lower(coalesce(email,'')) = lower(coalesce((select auth.jwt()->>'email'), ''))
  )
)
with check (
  auth_user_id = (select auth.uid())
  and lower(coalesce(email,'')) = lower(coalesce((select auth.jwt()->>'email'), ''))
  and coalesce(role,'seller') = 'seller'
);
