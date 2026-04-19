-- Retrieves workers assigned to a specific site
SELECT 
    l.name AS worker_name,
    l.trade_specialty,
    s.name AS site_name
FROM assignments a
JOIN labor l ON a.worker_id = l.worker_id
JOIN sites s ON a.site_id = s.site_id
WHERE s.name = 'Marmara Vadi Konakları';


-- Lists equipment currently under maintenance
SELECT 
    equip_id,
    type,
    model
FROM equipment
WHERE current_status = 'Maintenance';


-- Shows materials sorted by cost (most expensive first)
SELECT 
    name,
    unit_cost
FROM materials
ORDER BY unit_cost DESC;


-- Counts how many assignments each worker has
SELECT 
    l.name,
    COUNT(a.assign_id) AS total_assignments
FROM labor l
LEFT JOIN assignments a ON l.worker_id = a.worker_id
GROUP BY l.worker_id;


-- Finds equipment that has more than one maintenance record
SELECT 
    e.type,
    e.model,
    COUNT(m.log_id) AS maintenance_count
FROM equipment e
JOIN maintenance_logs m ON e.equip_id = m.equip_id
GROUP BY e.equip_id
HAVING COUNT(m.log_id) > 1;
