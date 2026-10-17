create unique index if not exists users_email_lower_uidx
on public.users (lower(email))
where email is not null;