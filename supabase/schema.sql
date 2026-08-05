-- ============================================================
-- NEXUS — Supabase schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- ============================================================

-- 1. PRODUCTS -------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('laptops', 'iphones', 'samsung')),
  brand text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  description text,
  specs jsonb default '{}'::jsonb,       -- e.g. {"Chip":"M3 Pro","RAM":"18GB","Storage":"512GB"}
  image_url text,
  stock int default 10,
  featured boolean default false,
  rating numeric(2,1) default 4.5,
  reviews_count int default 0,
  created_at timestamptz default now()
);

alter table products enable row level security;

-- Anyone (including anonymous shoppers) can read products.
create policy "Public can view products"
  on products for select
  using (true);

-- Only signed-in admins can add/edit/delete. You'll manage products
-- from the Supabase Table Editor while logged into your own account,
-- so no public insert/update/delete policy is needed.

-- 2. ORDERS -----------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  paypal_order_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address text,
  items jsonb,            -- snapshot of the cart at checkout time
  total numeric(10,2),
  status text default 'pending',
  created_at timestamptz default now()
);

alter table orders enable row level security;

-- The storefront needs to CREATE an order after PayPal confirms
-- payment, but customers should never be able to read other
-- people's orders — so insert is public, select/update are not.
create policy "Public can create orders"
  on orders for insert
  with check (true);

-- 3. STOCK COUNT DECREASES (optional but recommended) -----------
-- If you want stock to drop automatically after a paid order,
-- add this trigger. It reads the `items` jsonb array on insert
-- and decrements matching product stock. Safe to skip at first.
create or replace function decrement_stock()
returns trigger as $$
declare
  item jsonb;
begin
  if new.status = 'paid' then
    for item in select * from jsonb_array_elements(new.items)
    loop
      update products
      set stock = greatest(0, stock - (item->>'qty')::int)
      where id = (item->>'id')::uuid;
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger orders_decrement_stock
  after insert on orders
  for each row execute function decrement_stock();

-- 4. SEED PRODUCTS ------------------------------------------------
insert into products (name, category, brand, price, compare_at_price, description, specs, image_url, stock, featured, rating, reviews_count) values
('MacBook Pro 14" M3 Pro', 'laptops', 'Apple', 1999.00, 2199.00,
  'The 14-inch MacBook Pro with the M3 Pro chip handles everything from code compiles to 4K exports without breaking a sweat.',
  '{"Chip":"Apple M3 Pro","RAM":"18GB","Storage":"512GB SSD","Display":"14.2\" Liquid Retina XDR","Battery":"Up to 18 hrs"}',
  'images/laptop-macbook-pro-14.svg', 8, true, 4.9, 214),
('Dell XPS 13 Plus', 'laptops', 'Dell', 1349.00, null,
  'A compact 13-inch flagship with a near-borderless InfinityEdge display and a capacitive touch function row.',
  '{"CPU":"Intel Core i7-1360P","RAM":"16GB","Storage":"512GB SSD","Display":"13.4\" FHD+","Weight":"1.24kg"}',
  'images/laptop-dell-xps-13.svg', 12, true, 4.6, 98),
('Lenovo ThinkPad X1 Carbon', 'laptops', 'Lenovo', 1499.00, 1699.00,
  'Business-grade durability meets a featherweight carbon-fiber chassis, MIL-SPEC tested for the road.',
  '{"CPU":"Intel Core i7-1355U","RAM":"16GB","Storage":"1TB SSD","Display":"14\" 2.8K OLED","Weight":"1.12kg"}',
  'images/laptop-thinkpad-x1.svg', 6, false, 4.7, 143),
('ASUS ROG Zephyrus G14', 'laptops', 'ASUS', 1699.00, null,
  'A 14-inch gaming laptop that doesn''t look like one — RTX-class graphics in a slab you''ll actually carry around.',
  '{"CPU":"AMD Ryzen 9 8945HS","GPU":"RTX 4060","RAM":"32GB","Storage":"1TB SSD","Display":"14\" QHD+ 165Hz"}',
  'images/laptop-rog-zephyrus.svg', 5, false, 4.8, 76),

('iPhone 16 Pro', 'iphones', 'Apple', 999.00, null,
  'Titanium design, the A18 Pro chip, and a 48MP main camera with 5x telephoto zoom.',
  '{"Chip":"A18 Pro","Storage":"256GB","Display":"6.3\" Super Retina XDR","Camera":"48MP Triple","Color":"Natural Titanium"}',
  'images/iphone-16-pro.svg', 20, true, 4.9, 512),
('iPhone 16', 'iphones', 'Apple', 799.00, 849.00,
  'The everyday flagship — A18 chip, Camera Control, and all-day battery life in a durable aluminum frame.',
  '{"Chip":"A18","Storage":"128GB","Display":"6.1\" Super Retina XDR","Camera":"48MP Dual","Color":"Ultramarine"}',
  'images/iphone-16.svg', 25, true, 4.8, 389),
('iPhone 15', 'iphones', 'Apple', 699.00, null,
  'Dynamic Island, USB-C, and a 48MP main camera — last year''s flagship, still very much current.',
  '{"Chip":"A16 Bionic","Storage":"128GB","Display":"6.1\" Super Retina XDR","Camera":"48MP Dual","Color":"Black"}',
  'images/iphone-15.svg', 15, false, 4.6, 267),
('iPhone SE', 'iphones', 'Apple', 429.00, null,
  'The A15 chip and Touch ID in the compact form factor people keep asking Apple to bring back.',
  '{"Chip":"A15 Bionic","Storage":"64GB","Display":"4.7\" Retina HD","Camera":"12MP","Color":"Midnight"}',
  'images/iphone-se.svg', 10, false, 4.4, 154),

('Samsung Galaxy S25 Ultra', 'samsung', 'Samsung', 1299.00, 1419.00,
  'A built-in S Pen, a 200MP sensor, and Galaxy AI baked into every corner of the interface.',
  '{"Chip":"Snapdragon 8 Elite","RAM":"12GB","Storage":"256GB","Display":"6.9\" Dynamic AMOLED 2X","Camera":"200MP Quad"}',
  'images/samsung-s25-ultra.svg', 14, true, 4.8, 302),
('Samsung Galaxy Z Fold 6', 'samsung', 'Samsung', 1899.00, null,
  'A phone that opens into a tablet — for the person who wants two screens and one device.',
  '{"Chip":"Snapdragon 8 Gen 3","RAM":"12GB","Storage":"512GB","Display":"7.6\" Foldable AMOLED","Camera":"50MP Triple"}',
  'images/samsung-z-fold-6.svg', 4, false, 4.7, 88),
('Samsung Galaxy S25', 'samsung', 'Samsung', 799.00, 859.00,
  'Flagship-grade cameras and Galaxy AI features in Samsung''s standard-size body.',
  '{"Chip":"Snapdragon 8 Elite","RAM":"8GB","Storage":"128GB","Display":"6.2\" Dynamic AMOLED 2X","Camera":"50MP Triple"}',
  'images/samsung-s25.svg', 18, true, 4.6, 221),
('Samsung Galaxy A55', 'samsung', 'Samsung', 449.00, null,
  'Mid-range done right — an AMOLED display and IP67 water resistance well under flagship pricing.',
  '{"Chip":"Exynos 1480","RAM":"8GB","Storage":"128GB","Display":"6.6\" Super AMOLED","Camera":"50MP Triple"}',
  'images/samsung-a55.svg', 22, false, 4.5, 176);
