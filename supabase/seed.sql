-- Illustrative placeholder listings: replace with vetted, real data before launch.
with s as (
  insert into spots (name, category, neighborhood, city, coordinates, is_verified) values
  ('Braam Kota Corner', 'Kota / Street food', 'Braamfontein', 'Johannesburg', st_makepoint(28.0330, -26.1930)::geography, false),
  ('Obs Pie Stop',      'Bakery',              'Observatory',  'Cape Town',    st_makepoint(18.4733, -33.9395)::geography, false)
  returning id, name)
insert into meals (spot_id, title, price_zar, deal_type)
select id, 'Double Cheese Kota', 45, 'everyday_budget' from s where name = 'Braam Kota Corner'
union all select id, 'Chicken Pie + Drink', 38, 'lunch_special' from s where name = 'Obs Pie Stop';
