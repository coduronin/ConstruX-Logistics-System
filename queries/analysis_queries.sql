-- Combines site, worker, and equipment assignments
CREATE VIEW site_overview AS
SELECT 
    s.name AS site_name,
    l.name AS worker_name,
    l.trade_specialty,
    e.type AS equipment_type,
    e.current_status,
    a.assignment_date
FROM assignments a
JOIN sites s ON a.site_id = s.site_id
JOIN labor l ON a.worker_id = l.worker_id
LEFT JOIN equipment e ON a.equip_id = e.equip_id;


-- Calculates total material cost per site
CREATE VIEW site_material_cost AS
SELECT 
    s.name AS site_name,
    SUM(mu.quantity_used * m.unit_cost) AS total_material_cost
FROM material_usage mu
JOIN sites s ON mu.site_id = s.site_id
JOIN materials m ON mu.mat_id = m.mat_id
GROUP BY s.site_id;


-- Shows maintenance history of equipment
CREATE VIEW equipment_maintenance_history AS
SELECT 
    e.type,
    e.model,
    m.service_date,
    m.description
FROM maintenance_logs m
JOIN equipment e ON m.equip_id = e.equip_id;


-- Lists equipment that is currently idle
CREATE VIEW idle_equipment AS
SELECT 
    equip_id,
    type,
    model
FROM equipment
WHERE current_status = 'Idle';
