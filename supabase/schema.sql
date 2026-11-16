-- Girl's Hood — database setup
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again; every statement is idempotent.

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 120),
  slug             text not null unique,
  description      text not null default '',
  price            numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  category         text not null,
  sizes            text[] not null default '{}',
  colors           text[] not null default '{}',
  stock            integer not null default 0 check (stock >= 0),
  -- Storage paths inside the "product-images" bucket, first one is the cover.
  images           text[] not null default '{}',
  is_new_arrival   boolean not null default true,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists products_published_created_idx
  on public.products (is_published, created_at desc);
create index if not exists products_category_idx
  on public.products (category);

-- Keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Row Level Security: shoppers (anon key) can only read published products.
-- The admin dashboard writes with the service-role key on the server, which
-- bypasses RLS, so no insert/update/delete policies are needed.
alter table public.products enable row level security;

drop policy if exists "Published products are readable by everyone" on public.products;
create policy "Published products are readable by everyone"
  on public.products for select
  using (is_published = true);

-- ---------------------------------------------------------------------------
-- Image storage
-- ---------------------------------------------------------------------------
-- Public bucket: anyone can view images by URL. Uploads only happen through
-- short-lived signed upload URLs issued by the admin dashboard.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
