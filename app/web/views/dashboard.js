// ==========================================
// Dashboard View Module
// ==========================================
import { state, apiFetch, showToast, switchView } from '../app.js';

// ------------------------------------------
// Personal Dashboard (Worker View)
// ------------------------------------------
async function renderPersonalDashboard(container) {
    // Fetch user-specific data from filtered API endpoints in parallel
    const [sites, assignments, costs] = await Promise.all([
        apiFetch('/Sites'),
        apiFetch('/Assignments'),
        apiFetch('/Queries/views/site-material-cost')
    ]);
    
    // Aggregated stats
    const totalProjects = sites.length;
    const activeTasks = assignments.length;
    
    const totalMaterialCost = costs.reduce((acc, c) => acc + (c.totalMaterialCost || 0), 0);

    // Filter assignments that have equipment
    const equipmentAssignments = assignments.filter(a => a.equipmentModel);
    const totalEquipment = equipmentAssignments.length;

    container.innerHTML = `
        <!-- Stats Summary Row -->
        <div class="dashboard-grid">
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-diagram-project"></i></div>
                <div class="stat-info">
                    <p>My Assigned Projects</p>
                    <h3>${totalProjects}</h3>
                    <div class="stat-change"><small class="text-secondary">Active construction sites</small></div>
                </div>
            </div>
            
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-tasks"></i></div>
                <div class="stat-info">
                    <p>My Active Tasks</p>
                    <h3>${activeTasks}</h3>
                    <div class="stat-change"><small class="text-secondary">Assigned site roles</small></div>
                </div>
            </div>
            
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
                <div class="stat-info">
                    <p>My Equipment Assignments</p>
                    <h3>${totalEquipment}</h3>
                    <div class="stat-change"><small class="text-secondary">Machines allocated to you</small></div>
                </div>
            </div>
            
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-coins"></i></div>
                <div class="stat-info">
                    <p>My Site Material Costs</p>
                    <h3>$${totalMaterialCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                    <div class="stat-change"><small class="text-secondary">Accumulated site expenditure</small></div>
                </div>
            </div>
        </div>
        
        <!-- Main Layout Row -->
        <div class="dashboard-row-2">
            <!-- Project List -->
            <div class="card-section glass">
                <div class="section-header">
                    <h2>My Assigned Projects</h2>
                    <a href="#" class="section-link" id="dash-personal-view-projects">View All <i class="fa-solid fa-arrow-right"></i></a>
                </div>
                <div class="table-container">
                    <table class="responsive-table">
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Location</th>
                                <th>Duration</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody id="personal-projects-tbody">
                            <!-- Injected below -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Assigned Equipment & Tasks -->
            <div class="card-section glass">
                <div class="section-header">
                    <h2>My Assigned Equipment & Fleet</h2>
                </div>
                <div class="table-container">
                    <table class="responsive-table">
                        <thead>
                            <tr>
                                <th>Equipment Model</th>
                                <th>Assigned Site</th>
                                <th>Assignment Date</th>
                            </tr>
                        </thead>
                        <tbody id="personal-equipment-tbody">
                            <!-- Injected below -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Material Cost Summary Section -->
        <div class="card-section glass" style="margin-top: 30px;">
            <div class="section-header">
                <h2>My Material Usage & Cost Summary</h2>
            </div>
            <div class="table-container">
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Site / Project Name</th>
                            <th>Total Material Cost</th>
                            <th>Relative Site Spend</th>
                        </tr>
                    </thead>
                    <tbody id="personal-material-tbody">
                        <!-- Injected below -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Populate Projects Table
    const projectsTbody = document.getElementById('personal-projects-tbody');
    if (sites.length === 0) {
        projectsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;" class="text-secondary">No projects assigned to you.</td></tr>';
    } else {
        sites.forEach(s => {
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            const now = new Date();
            let pct = 0;
            if (now >= start && now <= end) {
                pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
            } else if (now > end) {
                pct = 100;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.name}</strong><br><small class="text-secondary">${s.type}</small></td>
                <td><i class="fa-solid fa-location-dot text-muted"></i> ${s.location}</td>
                <td><small>${s.startDate} to ${s.endDate}</small></td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-meta">
                            <strong>${pct}%</strong>
                        </div>
                        <div class="progress-bar-track">
                            <div class="progress-bar-fill" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </td>
            `;
            projectsTbody.appendChild(tr);
        });
    }

    // Populate Equipment Table
    const equipTbody = document.getElementById('personal-equipment-tbody');
    if (equipmentAssignments.length === 0) {
        equipTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;" class="text-secondary">No equipment assigned to you.</td></tr>';
    } else {
        equipmentAssignments.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${a.equipmentModel}</strong></td>
                <td>${a.siteName || 'No Site'}</td>
                <td><small>${a.assignmentDate}</small></td>
            `;
            equipTbody.appendChild(tr);
        });
    }

    // Populate Material Costs
    const matTbody = document.getElementById('personal-material-tbody');
    if (costs.length === 0) {
        matTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;" class="text-secondary">No material expenditure logs for your sites.</td></tr>';
    } else {
        const maxCost = Math.max(...costs.map(c => c.totalMaterialCost || 0), 0);
        costs.forEach(c => {
            const pctOfMax = maxCost > 0 ? Math.round(((c.totalMaterialCost || 0) / maxCost) * 100) : 0;
            const pctOfTotal = totalMaterialCost > 0 ? Math.round(((c.totalMaterialCost || 0) / totalMaterialCost) * 100) : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.siteName}</strong></td>
                <td><strong>$${(c.totalMaterialCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td>
                    <div class="progress-bar-container" style="max-width: 400px;">
                        <div class="progress-meta">
                            <span>Relative Site Spend</span>
                            <span>
                                <strong>${pctOfMax}%</strong>
                                <span class="tooltip-container">
                                    <i class="fa-solid fa-circle-info"></i>
                                    <span class="tooltip-text">
                                        This project accounts for ${pctOfTotal}% of total spend ($${totalMaterialCost.toLocaleString(undefined, {maximumFractionDigits: 0})}) and is at ${pctOfMax}% of peak site cost.
                                    </span>
                                </span>
                            </span>
                        </div>
                        <div class="progress-bar-track" style="height: 10px;">
                            <div class="progress-bar-fill" style="width: ${pctOfMax}%; background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);"></div>
                        </div>
                    </div>
                </td>
            `;
            matTbody.appendChild(tr);
        });
    }

    // Attach click handler for projects link
    document.getElementById('dash-personal-view-projects').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('projects');
    });
}

// ------------------------------------------
// Admin Dashboard View
// ------------------------------------------
export async function renderDashboard(container) {
    if (!state.user?.isAdmin) {
        await renderPersonalDashboard(container);
        return;
    }

    // Fetch dashboard core data in parallel
    const [sites, labor, equipment, materialCostView] = await Promise.all([
        apiFetch('/Sites'),
        apiFetch('/Labor'),
        apiFetch('/Equipment'),
        apiFetch('/Queries/views/site-material-cost')
    ]);
    
    // Aggregated stats
    const totalProjects = sites.length;
    const activeSites = sites.filter(s => {
        const end = new Date(s.endDate);
        const start = new Date(s.startDate);
        const now = new Date();
        return now >= start && now <= end;
    }).length;
    
    const idleCount = equipment.filter(e => e.currentStatus === 'Idle').length;
    const maintenanceCount = equipment.filter(e => e.currentStatus === 'Maintenance').length;
    
    // Calculate average progress
    let avgProgress = 67; // Mock default if empty
    if (sites.length > 0) {
        let totalPct = 0;
        const now = new Date();
        sites.forEach(s => {
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            if (now < start) totalPct += 0;
            else if (now > end) totalPct += 100;
            else {
                const totalDuration = end - start;
                const elapsed = now - start;
                totalPct += Math.round((elapsed / totalDuration) * 100);
            }
        });
        avgProgress = Math.round(totalPct / sites.length);
    }

    container.innerHTML = `
        <!-- Stats Summary Row -->
        <div class="dashboard-grid">
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-diagram-project"></i></div>
                <div class="stat-info">
                    <p>Total Projects</p>
                    <h3>${totalProjects}</h3>
                    <div class="stat-change up"><i class="fa-solid fa-arrow-up"></i> <span>+4 this month</span></div>
                </div>
            </div>
            
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-location-dot"></i></div>
                <div class="stat-info">
                    <p>Active Sites</p>
                    <h3>${activeSites}</h3>
                    <div class="stat-change up"><i class="fa-solid fa-arrow-up"></i> <span>2 newly started</span></div>
                </div>
            </div>
            
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div>
                <div class="stat-info">
                    <p>Avg Progress</p>
                    <h3>${avgProgress}%</h3>
                    <div class="stat-change up"><i class="fa-solid fa-arrow-up"></i> <span>+4% vs last week</span></div>
                </div>
            </div>
            
            <div class="stat-card glass">
                <div class="stat-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
                <div class="stat-info">
                    <p>Fleet Status</p>
                    <h3>${idleCount} Idle / ${maintenanceCount} Maint</h3>
                    <div class="stat-change down"><i class="fa-solid fa-arrow-down"></i> <span>Check logs</span></div>
                </div>
            </div>
        </div>
        
        <!-- Table & Timeline Section -->
        <div class="dashboard-row-2">
            <!-- Project List -->
            <div class="card-section glass">
                <div class="section-header">
                    <h2>Project List</h2>
                    <a href="#" class="section-link" id="dash-view-all-projects">View All <i class="fa-solid fa-arrow-right"></i></a>
                </div>
                <div class="table-container">
                    <table class="responsive-table">
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Location</th>
                                <th>Duration</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="dash-projects-tbody">
                            <!-- Injected below -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Milestone timeline -->
            <div class="card-section glass">
                <div class="section-header">
                    <h2>Milestone Tracking</h2>
                </div>
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker done"><i class="fa-solid fa-check"></i></div>
                        <div class="timeline-info">
                            <h4>Foundation Excavation</h4>
                            <p>Completed on site Marmara Vadi</p>
                        </div>
                        <div class="timeline-date">Mar 2026</div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker done"><i class="fa-solid fa-check"></i></div>
                        <div class="timeline-info">
                            <h4>Concrete Pouring (Floor 1-3)</h4>
                            <p>Completed on site Yıldız Şehir</p>
                        </div>
                        <div class="timeline-date">May 2026</div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker active"><i class="fa-solid fa-spinner fa-spin"></i></div>
                        <div class="timeline-info">
                            <h4>Steel Framing Installation</h4>
                            <p>In progress at Anadolu Raylı Sistem</p>
                        </div>
                        <div class="timeline-date">Jun 2026</div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-info">
                            <h4>Electrical & Pipe Fitting</h4>
                            <p>Planned for Bodrum Marina</p>
                        </div>
                        <div class="timeline-date">Jul 2026</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Active Site Status -->
        <div class="section-header">
            <h2>Active Site Status</h2>
        </div>
        <div class="active-sites-grid" id="dash-active-sites-grid">
            <!-- Injected below -->
        </div>
    `;

    // Populate Projects Table (take top 5)
    const tbody = document.getElementById('dash-projects-tbody');
    const topSites = sites.slice(0, 5);
    
    topSites.forEach(s => {
        const start = new Date(s.startDate);
        const end = new Date(s.endDate);
        const now = new Date();
        
        let pct = 0;
        let badgeClass = 'badge-planned';
        let badgeText = 'Planned';
        
        if (now >= start && now <= end) {
            const elapsed = now - start;
            pct = Math.min(100, Math.max(0, Math.round((elapsed / (end - start)) * 100)));
            badgeClass = 'badge-active';
            badgeText = 'Active';
        } else if (now > end) {
            pct = 100;
            badgeClass = 'badge-completed';
            badgeText = 'Completed';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.name}</strong><br><small class="text-secondary">${s.type}</small></td>
            <td><i class="fa-solid fa-location-dot text-muted"></i> ${s.location}</td>
            <td><small>${s.startDate} to ${s.endDate}</small></td>
            <td>
                <div class="progress-bar-container">
                    <div class="progress-meta">
                        <span>Progress</span>
                        <strong>${pct}%</strong>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
            </td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        `;
        tbody.appendChild(tr);
    });

    // Populate Active Site Cards
    const sitesGrid = document.getElementById('dash-active-sites-grid');
    const activeSitesList = sites.filter(s => {
        const start = new Date(s.startDate);
        const end = new Date(s.endDate);
        const now = new Date();
        return now >= start && now <= end;
    }).slice(0, 3);
    
    const weatherList = ['Sunny, 28°C', 'Partly Cloudy, 22°C', 'Light Rain, 17°C'];
    
    activeSitesList.forEach((s, idx) => {
        const start = new Date(s.startDate);
        const end = new Date(s.endDate);
        const now = new Date();
        const pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));

        const div = document.createElement('div');
        div.className = 'site-card glass';
        div.innerHTML = `
            <div class="site-card-header">
                <h3>${s.name}</h3>
                <span><i class="fa-solid fa-cloud-sun"></i> ${weatherList[idx % weatherList.length]}</span>
            </div>
            <div class="site-card-body">
                <div class="site-stat">
                    <span><i class="fa-solid fa-users text-muted"></i> Workers Assigned:</span>
                    <strong>${10 + (idx * 4)} crew</strong>
                </div>
                <div class="site-stat">
                    <span><i class="fa-solid fa-location-crosshairs text-muted"></i> Location:</span>
                    <strong>${s.location.split(',')[0]}</strong>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-meta">
                        <span>Overall Progress</span>
                        <strong>${pct}%</strong>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>
        `;
        sitesGrid.appendChild(div);
    });

    // Register Click listener for dashboard view-all link
    document.getElementById('dash-view-all-projects').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('projects');
    });
}
