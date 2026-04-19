# ConstruX: Construction Site Logistics Database

This project is a relational database designed to manage the logistics of large-scale construction sites. The main goal is to solve the "information silo" problem where labor, equipment, and materials are tracked in different systems that don't talk to each other.

By centralizing everything into one SQL-based system, we can prevent common site errors—like scheduling a worker for a machine that is actually down for maintenance, or sending a crew to a site that doesn't have the necessary materials in stock yet.

### The Problem
On most big job sites, data is a mess. Site managers use spreadsheets, maintenance crews use paper logs, and procurement uses different software. This leads to massive idle time and wasted money. ConstruX connects these pieces so you can see exactly who is working where, what machines they are using, and how much material is being consumed in real-time.

### Database Structure
The project is built around 7 core tables that keep the data clean and organized:

- **Sites:** Where the work is happening.
- **Labor:** Our workforce, categorized by trade (Operators, Welders, etc.).
- **Equipment:** The heavy machinery and its current "Active" or "Maintenance" status.
- **Materials:** A catalog of what we use (Concrete, Rebar) and what it costs.
- **Assignments:** The main link between the workers, the machines, and the sites.
- **Material_Usage:** Tracking how much we've spent and used at each project.
- **Maintenance_Logs:** A history of repairs to keep everything safe and compliant.

### Key Features
- **Centralized Deployment:** Using SQL Joins to see a full site manifest in one click.
- **Automated Cost Tracking:** Calculating total site spend automatically using material costs and usage logs.
- **Availability Logic:** Ensuring equipment is only assigned if it's not flagged for maintenance.

### Project Status
The schema and initial data inserts are being finalized. The next phase involves setting up specific Views to make it easier for site managers to pull reports without writing raw SQL.

```text
/schema   -> Table structures
/data     -> Sample site data
/queries  -> Reports and Views
/docs     -> Technical report and ER diagrams
