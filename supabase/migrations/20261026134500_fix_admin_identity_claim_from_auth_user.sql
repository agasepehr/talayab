create or replace function public.claim_admin_identity()
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_auth_id uuid;
  v_email text;
  v_user_id bigint;
begin
  v_auth_id := auth.uid();

  if v_auth_id is null then
    raise exception 'not_authenticated';
  end if;

  select lower(email)
    into v_email
  from auth.users
  where id = v_auth_id
  limit 1;

  if coalesce(v_email, '') = '' then
    raise exception 'auth_email_not_found';
  end if;

  select id
    into v_user_id
  from public.users
  where lower(email) = v_email
    and role = 'admin'
  order by id
  limit 1;

  if v_user_id is null then
    raise exception 'admin_account_not_configured';
  end if;

  update public.users
  set auth_user_id = v_auth_id
  where id = v_user_id;

  return jsonb_build_object(
    'status', 'linked',
    'user_id', v_user_id
  );
end;
$function$;
