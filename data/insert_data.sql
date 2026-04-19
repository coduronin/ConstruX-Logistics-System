INSERT INTO sites (name, location, type, start_date, end_date)
VALUES
('Marmara Vadi Konakları', 'Başakşehir, İstanbul', 'Luxury Residential', '2024-01-15', '2026-06-30'),
('Yıldız Şehir Parkı', 'Beşiktaş, İstanbul', 'Residential/Mall', '2024-02-01', '2027-03-15'),
('Anadolu Raylı Sistem Hattı', 'Kadıköy-Sabiha Gökçen', 'Government (Infrastructure)', '2024-03-10', '2027-12-01'),
('Gökkuşağı Rezidans', 'Çankaya, Ankara', 'Modern Residential', '2024-04-05', '2025-11-30'),
('Ege Esintisi Villaları', 'Bodrum, Muğla', 'Coastal Residential', '2024-05-20', '2026-02-28'),
('Başkent Millet Bahçesi', 'Altındağ, Ankara', 'Govt (Urban/Park)', '2024-06-12', '2027-09-01'),
('Kuzey Marmara Lojistik Merkezi', 'Arnavutköy, İstanbul', 'Govt (Industrial)', '2024-07-01', '2025-12-31'),
('Altın Boynuz Kentsel Dönüşüm', 'Fatih, İstanbul', 'Urban Renewal', '2024-08-15', '2028-06-30'),
('Boğaziçi Panorama Evleri', 'Sarıyer, İstanbul', 'Luxury Residential', '2024-09-03', '2028-04-15'),
('Teknopark İstanbul Genişleme', 'Pendik, İstanbul', 'Govt (Tech/Office)', '2024-10-01', '2026-08-31');

INSERT INTO labor (name, trade_specialty, hourly_rate)
VALUES
('Ahmet Yılmaz', 'Beton İşçisi', 18.5),
('Mehmet Kaya', 'Elektrik Teknisyeni', 24),
('Fatih Demir', 'Operatör', 32),
('Ali Celik', 'Sertifikalı Kaynakçı', 27.5),
('Emre Sahin', 'Tesisat Ustası', 22),
('Burak Arslan', 'İskeleci', 19),
('Hasan Ozturk', 'Çelik Konstrüksiyon İşçisi', 26),
('Can Koc', 'Ağır Vasıta Operatörü', 30),
('Selim Aydin', 'İnşaat Marangozu', 21),
('Mustafa Gunes', 'İş Güvenliği Denetçisi', 35);

INSERT INTO equipment (type, model, current_status)
VALUES
('Excavator', 'CAT 320', 'Active'),
('Tower Crane', 'Liebherr 280 EC-H', 'Active'),
('Concrete Pump', 'Schwing S 43 SX', 'Active'),
('Bulldozer', 'Komatsu D65EX', 'Maintenance'),
('Forklift', 'Toyota 8FBN25', 'Active'),
('Compactor', 'Bomag BW 213 D-5', 'Active'),
('Wheel Loader', 'Volvo L120H', 'Idle'),
('Generator', 'Caterpillar C15', 'Active'),
('Dump Truck', 'Mercedes Arocs 3245', 'Active'),
('Drilling Rig', 'Atlas Copco ROC D7C', 'Maintenance');

INSERT INTO materials (name, unit, unit_cost)
VALUES
('Grade 60 Rebar', 'kg', 0.85),
('Portland Cement Type I', 'bag (50kg)', 8.5),
('Ready-Mix Concrete C30', 'm3', 95),
('Structural Steel I-Beam', 'kg', 1.2),
('Plywood Formwork 18mm', 'sheet', 22),
('Construction Sand', 'm3', 18),
('Crushed Gravel 20mm', 'm3', 25),
('Ceramic Floor Tile', 'm2', 12.5),
('Rockwool Insulation', 'm2', 7.8),
('PVC Drainage Pipe 100mm', 'm', 4.2);

INSERT INTO assignments (site_id, worker_id, equip_id, assignment_date)
VALUES
(1, 3, 2, '2024-01-20'),
(1, 1, 3, '2024-01-22'),
(2, 4, 1, '2024-02-05'),
(3, 8, 4, '2024-03-15'),
(4, 2, 5, '2024-04-10'),
(5, 6, 6, '2024-05-25'),
(6, 7, 9, '2024-06-18'),
(7, 9, NULL, '2024-07-08'),
(8, 5, 8, '2024-08-20'),
(9, 10, NULL, '2024-09-10');

INSERT INTO material_usage (site_id, mat_id, quantity_used, date)
VALUES
(1, 1, 5000, '2024-01-25'),
(1, 3, 200, '2024-01-28'),
(2, 4, 3000, '2024-02-10'),
(3, 2, 500, '2024-03-20'),
(4, 5, 120, '2024-04-15'),
(5, 6, 300, '2024-05-28'),
(6, 7, 400, '2024-06-22'),
(7, 8, 800, '2024-07-15'),
(8, 9, 1500, '2024-08-25'),
(9, 10, 600, '2024-09-15');

INSERT INTO maintenance_logs (equip_id, service_date, description)
VALUES
(4, '2024-02-01', 'Oil change and filter replacement'),
(10, '2024-03-05', 'Drill bit set replaced, lubrication service'),
(2, '2024-04-10', 'Cable inspection and tension adjustment'),
(1, '2024-05-12', 'Track replacement and hydraulic system check'),
(7, '2024-06-20', 'Battery replacement and fork alignment'),
(3, '2024-07-18', 'Pump seal and valve replacement'),
(8, '2024-08-05', 'Fuel injector cleaning and load test'),
(5, '2024-09-10', 'Mast lubrication and brake adjustment'),
(6, '2024-10-01', 'Belt replacement and vibration plate calibration'),
(9, '2024-10-20', 'Transmission service and rear tire rotation');
