DROP TABLE IF EXISTS sites;
CREATE TABLE sites (
    site_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    type TEXT,
    start_date DATE,
    end_date DATE
);

DROP TABLE IF EXISTS labor;
CREATE TABLE labor (
    worker_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trade_specialty TEXT,
    hourly_rate DECIMAL CHECK (hourly_rate > 0)
);

DROP TABLE IF EXISTS equipment;
CREATE TABLE equipment (
    equip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    model TEXT,
    current_status TEXT
);

DROP TABLE IF EXISTS materials;
CREATE TABLE materials (
    mat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    unit TEXT,
    unit_cost DECIMAL
);

DROP TABLE IF EXISTS assignments;
CREATE TABLE assignments (
    assign_id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    worker_id INTEGER,
    equip_id INTEGER,
    assignment_date DATE,

    FOREIGN KEY (site_id) REFERENCES sites(site_id),
    FOREIGN KEY (worker_id) REFERENCES labor(worker_id),
    FOREIGN KEY (equip_id) REFERENCES equipment(equip_id)
);

DROP TABLE IF EXISTS material_usage;
CREATE TABLE material_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    mat_id INTEGER,
    quantity_used DECIMAL,
    date DATE,

    FOREIGN KEY (site_id) REFERENCES sites(site_id),
    FOREIGN KEY (mat_id) REFERENCES materials(mat_id)
);

DROP TABLE IF EXISTS maintenance_logs;
CREATE TABLE maintenance_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    equip_id INTEGER,
    service_date DATE,
    description TEXT,

    FOREIGN KEY (equip_id) REFERENCES equipment(equip_id) ON DELETE CASCADE 
);
