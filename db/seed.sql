INSERT INTO products (id,name,region,year,price_cents) VALUES
('bordeaux-18','Bordeaux Rouge 2018','Bordeaux',2018,3200),
('burgundy-20','Bourgogne Pinot Noir 2020','Burgundy',2020,4100),
('loire-21','Sancerre Blanc 2021','Loire',2021,2900),
('rhine-19','Riesling Reserve 2019','Rhine',2019,3400)
ON CONFLICT (id) DO NOTHING;
