create index if not exists users_email_lower_idx
on public.users (lower(email))
where email is not null;