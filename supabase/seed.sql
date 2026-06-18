-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Seed data (dev / test)
-- ─────────────────────────────────────────────────────────────
-- A realistic dataset: one agency, 7 cars across categories with
-- images, plus confirmed/pending bookings and blocked periods so the
-- availability logic and the public view have something to show.
-- Reference dates assume "today" ≈ 2026-06-18, so all ranges are future.
-- Idempotent via fixed UUIDs + ON CONFLICT.

-- ── Agency (singleton) ─────────────────────────────────────────────
insert into public.agency_settings (
  id, name, name_ar, name_fr, logo_url, primary_color, secondary_color,
  phone, whatsapp_number, email, address, address_ar, lat, lng,
  currency, opening_hours, social_links, locales,
  seo_title, seo_description, og_image_url
) values (
  'a0000000-0000-0000-0000-000000000001',
  'Kira Car Rental', 'كراء لكراء السيارات', 'Kira Location de Voitures',
  'https://placehold.co/240x80/0F3D3E/FFFFFF/png?text=KIRA',
  '#0F3D3E', '#C8A24B',
  '+212522000000', '+212600000000', 'contact@kira.ma',
  '12 Bd Mohammed V, Casablanca', '12 شارع محمد الخامس، الدار البيضاء',
  33.5731, -7.5898,
  'MAD',
  '{"mon_fri":"08:00-20:00","sat":"09:00-18:00","sun":"closed"}'::jsonb,
  '{"instagram":"https://instagram.com/kira","facebook":"https://facebook.com/kira"}'::jsonb,
  array['ar','fr'],
  'Kira — كراء السيارات في المغرب',
  'استأجر سيارتك بسهولة في المغرب: أسطول متنوع، أسعار واضحة، وحجز فوري بدون تسجيل.',
  'https://placehold.co/1200x630/0F3D3E/FFFFFF/png?text=KIRA'
) on conflict (id) do nothing;

-- ── Cars ───────────────────────────────────────────────────────────
insert into public.cars (
  id, slug, name, name_ar, brand, model, year, category, transmission,
  fuel_type, seats, doors, price_per_day, price_per_week, deposit,
  features, description, description_ar, description_fr, is_available, sort_order
) values
  ('c0000000-0000-0000-0000-000000000001','dacia-logan','Dacia Logan','داسيا لوغان','Dacia','Logan',2024,'economy','manual','diesel',5,4,250,1500,2000,
   array['climatisation','bluetooth','usb'],'Reliable and economical sedan.','سيارة اقتصادية وموثوقة.','Berline fiable et économique.',true,10),
  ('c0000000-0000-0000-0000-000000000002','renault-clio','Renault Clio','رينو كليو','Renault','Clio',2024,'economy','manual','gasoline',5,4,280,1700,2000,
   array['climatisation','bluetooth','carplay'],'Compact city car.','سيارة مدينة صغيرة.','Citadine compacte.',true,20),
  ('c0000000-0000-0000-0000-000000000003','peugeot-308','Peugeot 308','بيجو 308','Peugeot','308',2023,'sedan','automatic','diesel',5,4,420,2600,3000,
   array['climatisation','gps','cruise_control','carplay'],'Comfortable family sedan.','سيارة عائلية مريحة.','Berline familiale confortable.',true,30),
  ('c0000000-0000-0000-0000-000000000004','dacia-duster','Dacia Duster','داسيا داستر','Dacia','Duster',2024,'suv','manual','diesel',5,5,600,3800,4000,
   array['climatisation','4x4','gps','bluetooth'],'Versatile SUV for every road.','سيارة دفع رباعي لكل الطرق.','SUV polyvalent pour toutes les routes.',true,40),
  ('c0000000-0000-0000-0000-000000000005','mercedes-c-class','Mercedes C-Class','مرسيدس الفئة C','Mercedes-Benz','C-Class',2023,'luxury','automatic','gasoline',5,4,1500,9500,10000,
   array['climatisation','cuir','gps','toit_ouvrant','cruise_control'],'Premium luxury sedan.','سيارة فاخرة راقية.','Berline de luxe premium.',true,50),
  ('c0000000-0000-0000-0000-000000000006','renault-trafic','Renault Trafic','رينو ترافيك','Renault','Trafic',2022,'van','manual','diesel',9,5,800,5000,5000,
   array['climatisation','9_places','bluetooth'],'Spacious 9-seater van.','حافلة صغيرة بـ9 مقاعد.','Van spacieux 9 places.',true,60),
  ('c0000000-0000-0000-0000-000000000007','volkswagen-golf-gti','VW Golf GTI','فولكسفاغن غولف GTI','Volkswagen','Golf GTI',2023,'sport','automatic','gasoline',5,4,1100,7000,8000,
   array['climatisation','sport_mode','carplay','cruise_control'],'Hot hatch with a punch.','سيارة رياضية قوية.','Compacte sportive performante.',false,70)
on conflict (id) do nothing;

-- ── Car images (one primary each) ──────────────────────────────────
insert into public.car_images (id, car_id, url, storage_path, alt, alt_ar, is_primary, sort_order) values
  ('11111111-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','https://placehold.co/800x600?text=Logan','cars/logan-1.jpg','Dacia Logan','داسيا لوغان',true,0),
  ('11111111-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','https://placehold.co/800x600?text=Clio','cars/clio-1.jpg','Renault Clio','رينو كليو',true,0),
  ('11111111-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000003','https://placehold.co/800x600?text=308','cars/308-1.jpg','Peugeot 308','بيجو 308',true,0),
  ('11111111-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','https://placehold.co/800x600?text=Duster','cars/duster-1.jpg','Dacia Duster','داسيا داستر',true,0),
  ('11111111-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000005','https://placehold.co/800x600?text=C-Class','cars/cclass-1.jpg','Mercedes C-Class','مرسيدس',true,0),
  ('11111111-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000006','https://placehold.co/800x600?text=Trafic','cars/trafic-1.jpg','Renault Trafic','رينو ترافيك',true,0),
  ('11111111-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000007','https://placehold.co/800x600?text=Golf+GTI','cars/golf-1.jpg','VW Golf GTI','غولف',true,0),
  ('11111111-0000-0000-0000-000000000014','c0000000-0000-0000-0000-000000000004','https://placehold.co/800x600?text=Duster+side','cars/duster-2.jpg','Dacia Duster side','داسيا داستر جانب',false,1)
on conflict (id) do nothing;

-- ── Bookings (period is half-open [start, end)) ────────────────────
-- Confirmed bookings reserve the car (enforced by the DB constraint).
insert into public.bookings (
  id, car_id, customer_name, customer_phone, customer_email, period,
  pickup_location, dropoff_location, total_price, status, reference
) values
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Youssef Alaoui','+212611111111','youssef@example.com',
   daterange('2026-07-01','2026-07-05','[)'),'Casablanca Airport','Casablanca Airport',1000,'confirmed','KR-2026-000001'),
  ('b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000004','Sara Bennani','+212622222222',null,
   daterange('2026-07-10','2026-07-14','[)'),'Casablanca City Center',null,2400,'confirmed','KR-2026-000002'),
  ('b0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000005','Karim Idrissi','+212633333333','karim@example.com',
   daterange('2026-06-25','2026-06-28','[)'),'Casablanca City Center',null,4500,'pending','KR-2026-000003')
on conflict (id) do nothing;

-- Seeded references are explicit, so advance the sequence past them to
-- avoid colliding with auto-generated references on the next insert.
select setval('public.booking_reference_seq', 3, true);

-- ── Blocked periods (maintenance / off-platform reservations) ──────
insert into public.blocked_periods (id, car_id, period, reason, note) values
  ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',daterange('2026-08-01','2026-08-05','[)'),'maintenance','Scheduled service'),
  ('d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000006',daterange('2026-07-20','2026-07-25','[)'),'phone_booking','Reserved by phone')
on conflict (id) do nothing;
