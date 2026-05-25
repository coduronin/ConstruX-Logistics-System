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
('Marmara Otoyol Viyadüğü', 'Silivri, İstanbul', 'Government (Infrastructure)', '2024-11-01', '2025-08-19'),
('Ankara Kentsel Yaşam Evleri', 'Etimesgut, Ankara', 'Modern Residential', '2024-11-15', '2025-10-29'),
('İzmir Liman Depolama Sahası', 'Aliağa, İzmir', 'Govt (Industrial)', '2024-12-01', '2025-11-07'), 
('Bursa Teknoloji Vadisi', 'Nilüfer, Bursa', 'Govt (Tech/Office)', '2024-12-10', '2025-09-14'), 
('Antalya Turizm Kompleksi', 'Serik, Antalya', 'Luxury Residential', '2025-01-05', '2026-03-27'), 
('Karadeniz Lojistik Üssü', 'Sürmene, Trabzon', 'Govt (Industrial)', '2025-01-20', '2025-09-02'), 
('Eskişehir Öğrenci Rezidansı', 'Tepebaşı, Eskişehir', 'Modern Residential', '2025-02-01', '2025-09-01'),
('Adana Enerji Hatları Dağıtım', 'Ceyhan, Adana', 'Government (Infrastructure)', '2025-02-15', '2025-09-13'), 
('Kocaeli Karma Alışveriş Merkezi', 'Gebze, Kocaeli', 'Residential/Mall', '2025-03-01', '2025-09-27'), 
('Muğla Eko-Köy Evleri', 'Milas, Muğla', 'Coastal Residential', '2025-03-15', '2025-09-24'); 

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
(11, 3, 1, '2024-11-05'), 
(11, 1, 3, '2024-11-06'), 
(12, 4, 2, '2024-11-20'),  
(12, 2, 5, '2024-11-22'),  
(13, 8, 9, '2024-12-05'), 
(14, 7, 8, '2024-12-12'),  
(15, 6, 6, '2025-01-10'),  
(16, 9, NULL, '2025-01-25'),
(17, 5, 2, '2025-02-05'), 
(18, 10, NULL, '2025-02-18'),
(19, 3, 1, '2025-03-02'), 
(20, 1, 3, '2025-03-20'); 

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
(11, 1, 752, '2024-11-12'),  
(11, 3, 150, '2024-11-25'),  
(12, 3, 1463, '2024-12-01'), 
(12, 2, 450, '2024-12-15'),   
(13, 4, 1639, '2024-12-20'),  
(14, 5, 256, '2025-01-05'),  
(15, 6, 1205, '2025-02-01'),  
(15, 7, 850, '2025-02-15'),   
(16, 1, 1957, '2025-02-10'),  
(17, 8, 620, '2025-03-01'),   
(18, 10, 310, '2025-03-10'),  
(19, 3, 1895, '2025-04-01'),  
(20, 9, 430, '2025-04-15');   

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
(1, '2024-11-15', 'Hydraulic hose replacement and fluid top-up'),
(2, '2024-12-20', 'Motor brush inspection and electronic control calibration'),
(3, '2025-01-05', 'High-pressure pipe cleaning and valve greasing'),
(5, '2025-01-18', 'Hydraulic cylinder seal kit replacement'),
(8, '2025-02-10', 'Alternator check and radiator flush'),
(9, '2025-03-01', 'Brake pad replacement and front axle alignment'),
(4, '2025-03-25', 'Engine overhaul and undercarriage track adjustment'),
(6, '2025-04-12', 'Vibratory drum shock absorber replacement');
