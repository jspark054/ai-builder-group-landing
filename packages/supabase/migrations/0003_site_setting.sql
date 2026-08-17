create table if not exists public.site_setting (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_setting enable row level security;

create policy site_setting_public_read on public.site_setting
  for select using (true);

insert into public.site_setting (key, value) values
  ('contact_form_url', 'https://www.pluuug.com/form/JKqzYjCHCH')
on conflict (key) do nothing;