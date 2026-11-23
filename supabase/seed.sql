-- =============================================================================
-- Wakati reference data seed (GENERATED – do not edit by hand)
-- Source: src/lib/reference/*.ts  ·  Regenerate: npm run db:seed:generate
-- Contains categories, regions and cities only. No listings, users or activity.
-- =============================================================================

begin;

-- Regions
insert into public.regions (slug, name_en, name_fr, sort_order) values
  ('adamawa', 'Adamawa', 'Adamaoua', 10),
  ('centre', 'Centre', 'Centre', 20),
  ('east', 'East', 'Est', 30),
  ('far-north', 'Far North', 'Extrême-Nord', 40),
  ('littoral', 'Littoral', 'Littoral', 50),
  ('north', 'North', 'Nord', 60),
  ('north-west', 'North-West', 'Nord-Ouest', 70),
  ('west', 'West', 'Ouest', 80),
  ('south', 'South', 'Sud', 90),
  ('south-west', 'South-West', 'Sud-Ouest', 100)
on conflict (slug) do update set name_en = excluded.name_en, name_fr = excluded.name_fr, sort_order = excluded.sort_order;

-- Cities (each belongs to one region)
insert into public.cities (region_id, slug, name_en, name_fr, is_featured, sort_order) values
  ((select id from public.regions where slug = 'littoral'), 'douala', 'Douala', 'Douala', true, 10),
  ((select id from public.regions where slug = 'centre'), 'yaounde', 'Yaoundé', 'Yaoundé', true, 20),
  ((select id from public.regions where slug = 'north-west'), 'bamenda', 'Bamenda', 'Bamenda', true, 30),
  ((select id from public.regions where slug = 'south-west'), 'buea', 'Buea', 'Buea', true, 40),
  ((select id from public.regions where slug = 'south-west'), 'limbe', 'Limbe', 'Limbe', true, 50),
  ((select id from public.regions where slug = 'west'), 'bafoussam', 'Bafoussam', 'Bafoussam', true, 60),
  ((select id from public.regions where slug = 'north'), 'garoua', 'Garoua', 'Garoua', true, 70),
  ((select id from public.regions where slug = 'far-north'), 'maroua', 'Maroua', 'Maroua', true, 80),
  ((select id from public.regions where slug = 'adamawa'), 'ngaoundere', 'Ngaoundéré', 'Ngaoundéré', true, 90),
  ((select id from public.regions where slug = 'east'), 'bertoua', 'Bertoua', 'Bertoua', true, 100),
  ((select id from public.regions where slug = 'south'), 'kribi', 'Kribi', 'Kribi', true, 110),
  ((select id from public.regions where slug = 'south-west'), 'kumba', 'Kumba', 'Kumba', true, 120)
on conflict (slug) do update set region_id = excluded.region_id, name_en = excluded.name_en, name_fr = excluded.name_fr, is_featured = excluded.is_featured, sort_order = excluded.sort_order;

-- Top-level categories
insert into public.categories (slug, name_en, name_fr, icon, sort_order, has_condition, moderation_level) values
  ('vehicles', 'Vehicles', 'Véhicules', 'vehicles', 10, true, 'standard'),
  ('property', 'Property', 'Immobilier', 'property', 20, false, 'standard'),
  ('electronics', 'Electronics', 'Électronique', 'electronics', 30, true, 'standard'),
  ('home-garden', 'Home & Garden', 'Maison et jardin', 'home-garden', 40, true, 'standard'),
  ('fashion', 'Fashion', 'Mode', 'fashion', 50, true, 'standard'),
  ('jobs-services', 'Jobs & Services', 'Emplois et services', 'jobs-services', 60, false, 'standard'),
  ('agriculture', 'Agriculture', 'Agriculture', 'agriculture', 70, false, 'standard'),
  ('other-items', 'Other Items', 'Autres articles', 'other', 80, true, 'standard')
on conflict (slug) do update set parent_id = null, name_en = excluded.name_en, name_fr = excluded.name_fr, icon = excluded.icon, sort_order = excluded.sort_order, has_condition = excluded.has_condition, moderation_level = excluded.moderation_level;

-- Subcategories
insert into public.categories (parent_id, slug, name_en, name_fr, sort_order, has_condition, moderation_level) values
  ((select id from public.categories where slug = 'vehicles'), 'cars', 'Cars', 'Voitures', 10, true, 'standard'),
  ((select id from public.categories where slug = 'vehicles'), 'motorcycles', 'Motorcycles', 'Motos', 20, true, 'standard'),
  ((select id from public.categories where slug = 'vehicles'), 'commercial-vehicles', 'Commercial Vehicles', 'Véhicules utilitaires', 30, true, 'standard'),
  ((select id from public.categories where slug = 'vehicles'), 'vehicle-parts-accessories', 'Spare Parts & Accessories', 'Pièces détachées et accessoires', 40, true, 'standard'),
  ((select id from public.categories where slug = 'property'), 'houses-for-sale', 'Houses for Sale', 'Maisons à vendre', 10, false, 'standard'),
  ((select id from public.categories where slug = 'property'), 'apartments-for-rent', 'Apartments for Rent', 'Appartements à louer', 20, false, 'standard'),
  ((select id from public.categories where slug = 'property'), 'land', 'Land', 'Terrains', 30, false, 'standard'),
  ((select id from public.categories where slug = 'property'), 'commercial-property', 'Commercial Property', 'Locaux commerciaux', 40, false, 'standard'),
  ((select id from public.categories where slug = 'electronics'), 'mobile-phones', 'Mobile Phones', 'Téléphones mobiles', 10, true, 'standard'),
  ((select id from public.categories where slug = 'electronics'), 'computers', 'Computers', 'Ordinateurs', 20, true, 'standard'),
  ((select id from public.categories where slug = 'electronics'), 'tvs', 'TVs', 'Téléviseurs', 30, true, 'standard'),
  ((select id from public.categories where slug = 'electronics'), 'gaming', 'Gaming', 'Jeux vidéo', 40, true, 'standard'),
  ((select id from public.categories where slug = 'electronics'), 'electronics-accessories', 'Accessories', 'Accessoires', 50, true, 'standard'),
  ((select id from public.categories where slug = 'home-garden'), 'furniture', 'Furniture', 'Meubles', 10, true, 'standard'),
  ((select id from public.categories where slug = 'home-garden'), 'appliances', 'Appliances', 'Électroménager', 20, true, 'standard'),
  ((select id from public.categories where slug = 'home-garden'), 'home-improvement', 'Home Improvement', 'Bricolage et rénovation', 30, true, 'standard'),
  ((select id from public.categories where slug = 'home-garden'), 'garden-equipment', 'Garden Equipment', 'Équipement de jardin', 40, true, 'standard'),
  ((select id from public.categories where slug = 'fashion'), 'clothing', 'Clothing', 'Vêtements', 10, true, 'standard'),
  ((select id from public.categories where slug = 'fashion'), 'shoes', 'Shoes', 'Chaussures', 20, true, 'standard'),
  ((select id from public.categories where slug = 'fashion'), 'watches-accessories', 'Watches & Accessories', 'Montres et accessoires', 30, true, 'standard'),
  ((select id from public.categories where slug = 'jobs-services'), 'jobs', 'Jobs', 'Emplois', 10, false, 'review_required'),
  ((select id from public.categories where slug = 'jobs-services'), 'skilled-services', 'Skilled Services', 'Services qualifiés', 20, false, 'standard'),
  ((select id from public.categories where slug = 'jobs-services'), 'repairs', 'Repairs', 'Réparations', 30, false, 'standard'),
  ((select id from public.categories where slug = 'jobs-services'), 'business-services', 'Business Services', 'Services aux entreprises', 40, false, 'standard'),
  ((select id from public.categories where slug = 'agriculture'), 'farm-equipment', 'Farm Equipment', 'Matériel agricole', 10, true, 'standard'),
  ((select id from public.categories where slug = 'agriculture'), 'farming-supplies', 'Farming Supplies', 'Fournitures agricoles', 20, false, 'standard'),
  ((select id from public.categories where slug = 'agriculture'), 'agricultural-produce', 'Agricultural Produce', 'Produits agricoles', 30, false, 'standard')
on conflict (slug) do update set parent_id = excluded.parent_id, name_en = excluded.name_en, name_fr = excluded.name_fr, sort_order = excluded.sort_order, has_condition = excluded.has_condition, moderation_level = excluded.moderation_level;

-- Category-specific listing fields
insert into public.category_attributes (category_id, key, data_type, label_en, label_fr, options, is_required, is_filterable, min_value, max_value, unit, sort_order) values
  ((select id from public.categories where slug = 'property'), 'offer_type', 'select', 'Rent or sale', 'Location ou vente', '[{"value":"rent","label_en":"For rent","label_fr":"À louer"},{"value":"sale","label_en":"For sale","label_fr":"À vendre"}]'::jsonb, true, true, null, null, null, 10),
  ((select id from public.categories where slug = 'property'), 'property_type', 'select', 'Property type', 'Type de bien', '[{"value":"house","label_en":"House","label_fr":"Maison"},{"value":"apartment","label_en":"Apartment","label_fr":"Appartement"},{"value":"studio","label_en":"Studio","label_fr":"Studio"},{"value":"room","label_en":"Room","label_fr":"Chambre"},{"value":"land","label_en":"Land","label_fr":"Terrain"},{"value":"office","label_en":"Office","label_fr":"Bureau"},{"value":"shop","label_en":"Shop","label_fr":"Boutique"},{"value":"warehouse","label_en":"Warehouse","label_fr":"Entrepôt"}]'::jsonb, true, true, null, null, null, 20),
  ((select id from public.categories where slug = 'property'), 'rooms', 'integer', 'Number of rooms', 'Nombre de pièces', null, false, true, 0, 100, null, 30),
  ((select id from public.categories where slug = 'property'), 'area_m2', 'decimal', 'Area', 'Surface', null, false, true, 1, 10000000, 'm²', 40),
  ((select id from public.categories where slug = 'electronics'), 'brand', 'text', 'Brand', 'Marque', null, false, true, null, null, null, 10),
  ((select id from public.categories where slug = 'electronics'), 'model', 'text', 'Model', 'Modèle', null, false, false, null, null, null, 20),
  ((select id from public.categories where slug = 'cars'), 'make', 'text', 'Make', 'Marque', null, true, true, null, null, null, 10),
  ((select id from public.categories where slug = 'cars'), 'model', 'text', 'Model', 'Modèle', null, true, true, null, null, null, 20),
  ((select id from public.categories where slug = 'cars'), 'year', 'year', 'Year', 'Année', null, true, true, 1950, null, null, 30),
  ((select id from public.categories where slug = 'cars'), 'mileage_km', 'integer', 'Mileage', 'Kilométrage', null, false, true, 0, 2000000, 'km', 40),
  ((select id from public.categories where slug = 'cars'), 'fuel_type', 'select', 'Fuel type', 'Carburant', '[{"value":"petrol","label_en":"Petrol","label_fr":"Essence"},{"value":"diesel","label_en":"Diesel","label_fr":"Diesel"},{"value":"hybrid","label_en":"Hybrid","label_fr":"Hybride"},{"value":"electric","label_en":"Electric","label_fr":"Électrique"},{"value":"lpg","label_en":"LPG","label_fr":"GPL"},{"value":"other","label_en":"Other","label_fr":"Autre"}]'::jsonb, false, true, null, null, null, 50),
  ((select id from public.categories where slug = 'cars'), 'transmission', 'select', 'Transmission', 'Boîte de vitesses', '[{"value":"manual","label_en":"Manual","label_fr":"Manuelle"},{"value":"automatic","label_en":"Automatic","label_fr":"Automatique"}]'::jsonb, false, true, null, null, null, 60),
  ((select id from public.categories where slug = 'motorcycles'), 'make', 'text', 'Make', 'Marque', null, true, true, null, null, null, 10),
  ((select id from public.categories where slug = 'motorcycles'), 'model', 'text', 'Model', 'Modèle', null, true, true, null, null, null, 20),
  ((select id from public.categories where slug = 'motorcycles'), 'year', 'year', 'Year', 'Année', null, true, true, 1950, null, null, 30),
  ((select id from public.categories where slug = 'motorcycles'), 'mileage_km', 'integer', 'Mileage', 'Kilométrage', null, false, true, 0, 2000000, 'km', 40),
  ((select id from public.categories where slug = 'motorcycles'), 'fuel_type', 'select', 'Fuel type', 'Carburant', '[{"value":"petrol","label_en":"Petrol","label_fr":"Essence"},{"value":"diesel","label_en":"Diesel","label_fr":"Diesel"},{"value":"hybrid","label_en":"Hybrid","label_fr":"Hybride"},{"value":"electric","label_en":"Electric","label_fr":"Électrique"},{"value":"lpg","label_en":"LPG","label_fr":"GPL"},{"value":"other","label_en":"Other","label_fr":"Autre"}]'::jsonb, false, true, null, null, null, 50),
  ((select id from public.categories where slug = 'motorcycles'), 'transmission', 'select', 'Transmission', 'Boîte de vitesses', '[{"value":"manual","label_en":"Manual","label_fr":"Manuelle"},{"value":"automatic","label_en":"Automatic","label_fr":"Automatique"}]'::jsonb, false, true, null, null, null, 60),
  ((select id from public.categories where slug = 'commercial-vehicles'), 'make', 'text', 'Make', 'Marque', null, true, true, null, null, null, 10),
  ((select id from public.categories where slug = 'commercial-vehicles'), 'model', 'text', 'Model', 'Modèle', null, true, true, null, null, null, 20),
  ((select id from public.categories where slug = 'commercial-vehicles'), 'year', 'year', 'Year', 'Année', null, true, true, 1950, null, null, 30),
  ((select id from public.categories where slug = 'commercial-vehicles'), 'mileage_km', 'integer', 'Mileage', 'Kilométrage', null, false, true, 0, 2000000, 'km', 40),
  ((select id from public.categories where slug = 'commercial-vehicles'), 'fuel_type', 'select', 'Fuel type', 'Carburant', '[{"value":"petrol","label_en":"Petrol","label_fr":"Essence"},{"value":"diesel","label_en":"Diesel","label_fr":"Diesel"},{"value":"hybrid","label_en":"Hybrid","label_fr":"Hybride"},{"value":"electric","label_en":"Electric","label_fr":"Électrique"},{"value":"lpg","label_en":"LPG","label_fr":"GPL"},{"value":"other","label_en":"Other","label_fr":"Autre"}]'::jsonb, false, true, null, null, null, 50),
  ((select id from public.categories where slug = 'commercial-vehicles'), 'transmission', 'select', 'Transmission', 'Boîte de vitesses', '[{"value":"manual","label_en":"Manual","label_fr":"Manuelle"},{"value":"automatic","label_en":"Automatic","label_fr":"Automatique"}]'::jsonb, false, true, null, null, null, 60)
on conflict (category_id, key) do update set data_type = excluded.data_type, label_en = excluded.label_en, label_fr = excluded.label_fr, options = excluded.options, is_required = excluded.is_required, is_filterable = excluded.is_filterable, min_value = excluded.min_value, max_value = excluded.max_value, unit = excluded.unit, sort_order = excluded.sort_order;

commit;
