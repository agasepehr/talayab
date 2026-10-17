alter policy "Users can update own profile"
on public.users
to authenticated
using (
  (auth_user_id = (select auth.uid()))
  or (
    auth_user_id is null
    and lower(coalesce(email, ''::text)) = lower(coalesce((select (auth.jwt() ->> 'email'::text)), ''::text))
  )
)
with check (
  auth_user_id = (select auth.uid())
  and lower(coalesce(email, ''::text)) = lower(coalesce((select (auth.jwt() ->> 'email'::text)), ''::text))
  and coalesce(role, 'seller'::text) = 'seller'::text
);

alter table public.products
  add constraint products_weight_positive
  check (weight is null or weight > 0),
  add constraint products_karat_valid
  check (karat is null or (karat >= 1 and karat <= 24)),
  add constraint products_wage_nonnegative
  check (wage_value is null or wage_value >= 0),
  add constraint products_profit_nonnegative
  check (profit_percent is null or profit_percent >= 0),
  add constraint products_extra_fee_nonnegative
  check (extra_fee is null or extra_fee >= 0);
