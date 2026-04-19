# ConstruX: Integrated Site Logistics & Resource Management System

### Team Members & Roles
* **Architect:** [Name] - Database Design & Schema
* **SQL Developer:** [Name] - Query Development
* **QA Lead:** [Name] - Data Integrity & Testing
* **Documentation Lead:** [Name] - Technical Writing & Repo Management

---

## Project Overview
ConstruX is a relational database solution designed to solve "Information Silos" in large-scale construction projects. By centralizing labor, equipment, and material data, the system allows site managers to calculate the **Critical Path of Resources**, reducing equipment idle time and preventing material stock-outs.

## Database Schema
The system consists of 7 interconnected tables:
1. **Sites:** Active construction locations.
2. **Labor:** Workforce registry with trade specialties.
3. **Equipment:** Heavy machinery inventory and status.
4. **Materials:** Catalog of consumable resources.
5. **Assignments:** Junction table linking workers and machines to sites.
6. **Material_Usage:** Tracking consumption per site.
7. **Maintenance_Logs:** Service history for equipment.

## Setup Instructions
To rebuild this environment, execute the SQL files in the following order:
1. `schema/create_tables.sql`
2. `data/insert_data.sql`
3. `queries/sample_queries.sql`

## Sample Queries & Business Logic
* **Deployment Tracking:** Uses LEFT JOINs to show all worker assignments, including those without heavy machinery.
* **Financial Analysis:** Aggregates material costs per site to identify budget overruns.
* **Safety Compliance:** Tracks maintenance frequency to ensure all equipment meets safety standards.
