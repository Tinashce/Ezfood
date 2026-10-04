-- EzFood: crowdsourced meals under R200 (Johannesburg & Cape Town)
create extension if not exists postgis;

create table spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,                       -- 'Kota / Street food', 'Bakery', 'Takeaway', 'Sit-down'
  neighborhood text,
  city text not null check (city in ('Johannesburg', 'Cape Town')),
  coordinates geography(Point, 4326) not null,
  address text,
  is_verified boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_spots_coordinates on spots using gist (coordinates);

create table meals (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id) on delete cascade,
  title text not null,
  description text,
  price_zar numeric(6,2) not null check (price_zar > 0 and price_zar < 200),
  image_url text,
  deal_type text not null default 'everyday_budget'
    check (deal_type in ('everyday_budget', 'lunch_special', 'surplus_rescue')),
  available_days text[] not null default '{Mon,Tue,Wed,Thu,Fri,Sat,Sun}',
  start_time time,
  end_time time,
  status text not null default 'active' check (status in ('active', 'review', 'removed')),
  last_confirmed_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_meals_price on meals (price_zar) where status = 'active';

create table deal_verifications (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  status text not null check (status in ('still_available', 'price_increased', 'closed')),
  verified_at timestamptz not null default now()
);
create index idx_verifications_meal on deal_verifications (meal_id, verified_at desc);

-- "Still valid?" taps refresh the listing; 3 negative reports in 7 days send it to review.
create function apply_verification() returns trigger language plpgsql security definer as $$
begin
  if new.status = 'still_available' then
    update meals set last_confirmed_at = new.verified_at where id = new.meal_id;
  elsif (select count(distinct user_id) from deal_verifications
          where meal_id = new.meal_id and status <> 'still_available'
            and verified_at > now() - interval '7 days') >= 3 then
    update meals set status = 'review' where id = new.meal_id and status = 'active';
  end if;
  return new;
end $$;
create trigger trg_apply_verification after insert on deal_verifications
  for each row execute function apply_verification();

-- Radius search: active meals under a price ceiling near a point.
create function nearby_meals(
  user_lat double precision, user_lng double precision,
  radius_m integer default 3000, max_price numeric default 200
) returns table (
  meal_id uuid, title text, description text, price_zar numeric, image_url text,
  deal_type text, start_time time, end_time time, last_confirmed_at timestamptz,
  spot_id uuid, spot_name text, neighborhood text, city text,
  lat double precision, lng double precision, distance_m double precision
) language sql stable as $$
  select m.id, m.title, m.description, m.price_zar, m.image_url, m.deal_type,
         m.start_time, m.end_time, m.last_confirmed_at,
         s.id, s.name, s.neighborhood, s.city,
         st_y(s.coordinates::geometry), st_x(s.coordinates::geometry),
         st_distance(s.coordinates, st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography)
  from meals m join spots s on s.id = m.spot_id
  where m.status = 'active'
    and m.price_zar <= least(max_price, 199.99)
    and st_dwithin(s.coordinates, st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography, radius_m)
  order by 17 asc;
$$;

-- Row level security
alter table spots enable row level security;
alter table meals enable row level security;
alter table deal_verifications enable row level security;

create policy "spots readable" on spots for select using (true);
create policy "spots insert" on spots for insert to authenticated with check (created_by = auth.uid());
create policy "meals readable" on meals for select using (status <> 'removed');
create policy "meals insert" on meals for insert to authenticated with check (created_by = auth.uid());
create policy "verifications insert" on deal_verifications for insert to authenticated with check (user_id = auth.uid());
create policy "verifications readable" on deal_verifications for select using (true);
