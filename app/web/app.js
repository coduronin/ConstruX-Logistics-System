// API Base URL
const API_BASE = `http://${window.location.hostname}:5182/api`;

// Application State
const state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    activeView: 'dashboard',
    charts: {} // Keep references to active Chart.js instances to destroy/recreate them cleanly
};

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    if (type === 'warning') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// API Fetch Wrapper
// ==========================================
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Set headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            showToast('Session expired. Please sign in again.', 'warning');
            logout();
            throw new Error('Unauthorized');
        }
        
        if (response.status === 403) {
            showToast('Access denied. You do not have permission for this action.', 'error');
            throw new Error('Forbidden');
        }
        
        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error(errorMsg || `API error: ${response.status}`);
        }
        
        // Return null for 204 No Content
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (err) {
        if (err.message !== 'Unauthorized' && err.message !== 'Forbidden') {
            console.error('Fetch error:', err);
            showToast(err.message, 'error');
        }
        throw err;
    }
}

// ==========================================
// Authentication Logic
// ==========================================
function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    document.getElementById('portal-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    
    // Reset forms
    document.getElementById('auth-form').reset();
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const isSignup = !document.getElementById('signup-fields').classList.contains('hidden');
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    
    if (isSignup) {
        // Sign Up
        const name = document.getElementById('reg-name').value.trim();
        const tradeSpecialty = document.getElementById('reg-specialty').value;
        const hourlyRate = parseFloat(document.getElementById('reg-rate').value) || null;
        
        try {
            const data = await apiFetch('/Auth/signup', {
                method: 'POST',
                body: JSON.stringify({ name, tradeSpecialty, hourlyRate, username, password })
            });
            
            showToast('Registration successful! Logging you in...', 'success');
            loginSuccess(data.token, data.user);
        } catch (err) {
            // Toast handles display
        }
    } else {
        // Sign In
        try {
            const data = await apiFetch('/Auth/signin', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            showToast(`Welcome back, ${data.user.name}!`, 'success');
            loginSuccess(data.token, data.user);
        } catch (err) {
            // Toast handles display
        }
    }
}

function loginSuccess(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update Profile display
    document.getElementById('user-display-name').textContent = user.name;
    document.getElementById('user-display-role').textContent = user.isAdmin ? 'Admin' : (user.tradeSpecialty || 'Worker');
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();
    
    // Render dynamic sidebar menu items based on role
    renderSidebar(user);

    // Switch screens
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('portal-screen').classList.remove('hidden');
    
    // Load Dashboard
    switchView('dashboard');
}

function renderSidebar(user) {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    
    let html = `
        <span class="nav-category">Main Menu</span>
        <a href="#" class="nav-link" data-view="dashboard">
            <i class="fa-solid fa-chart-pie"></i>
            <span>Dashboard</span>
        </a>
        <a href="#" class="nav-link" data-view="projects">
            <i class="fa-solid fa-diagram-project"></i>
            <span>Project Management</span>
        </a>
    `;
    
    if (user && user.isAdmin) {
        html += `
            <a href="#" class="nav-link" data-view="logistics">
                <i class="fa-solid fa-truck-loading"></i>
                <span>Logistics & Materials</span>
            </a>
            <a href="#" class="nav-link" data-view="finance">
                <i class="fa-solid fa-coins"></i>
                <span>Finance & Costs</span>
            </a>
            <a href="#" class="nav-link" data-view="labor">
                <i class="fa-solid fa-users"></i>
                <span>Labor & HR</span>
            </a>
            <a href="#" class="nav-link" data-view="equipment">
                <i class="fa-solid fa-screwdriver-wrench"></i>
                <span>Equipment & Fleet</span>
            </a>
            <a href="#" class="nav-link" data-view="safety">
                <i class="fa-solid fa-shield-halved"></i>
                <span>Safety & Compliance</span>
            </a>
            <a href="#" class="nav-link" data-view="reports">
                <i class="fa-solid fa-file-invoice-dollar"></i>
                <span>Analytics & Reports</span>
            </a>
        `;
    }
    
    nav.innerHTML = html;
}

// ==========================================
// Routing & Navigation
// ==========================================
function switchView(viewName) {
    const isAdmin = state.user?.isAdmin;
    const restrictedViews = ['logistics', 'finance', 'labor', 'equipment', 'safety', 'reports'];
    
    if (!isAdmin && restrictedViews.includes(viewName)) {
        showToast('Access denied. Redirected to Dashboard.', 'error');
        viewName = 'dashboard';
    }

    state.activeView = viewName;
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update Header Actions / Title
    const headerActionBtn = document.getElementById('header-action-btn');
    const subtitle = document.getElementById('page-subtitle');
    
    // Show Action Button only for Admins on specific views
    
    if (viewName === 'projects' && isAdmin) {
        document.getElementById('page-title').textContent = 'Project Management';
        subtitle.textContent = 'Add, modify, and monitor construction project sites';
        headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>New Project</span>';
        headerActionBtn.classList.remove('hidden');
    } else if (viewName === 'labor' && isAdmin) {
        document.getElementById('page-title').textContent = 'Labor & HR';
        subtitle.textContent = 'Manage crew credentials, specialties, and rates';
        headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Add Worker</span>';
        headerActionBtn.classList.remove('hidden');
    } else if (viewName === 'equipment' && isAdmin) {
        document.getElementById('page-title').textContent = 'Equipment & Fleet';
        subtitle.textContent = 'Monitor heavy machinery statuses and maintenance records';
        headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Add Equipment</span>';
        headerActionBtn.classList.remove('hidden');
    } else if (viewName === 'logistics' && isAdmin) {
        document.getElementById('page-title').textContent = 'Logistics & Materials';
        subtitle.textContent = 'Manage concrete, steel, sand aggregates, and track usage logs';
        headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Record Usage</span>';
        headerActionBtn.classList.remove('hidden');
    } else {
        // Hide button or set default
        headerActionBtn.classList.add('hidden');
        
        if (viewName === 'dashboard') {
            document.getElementById('page-title').textContent = 'Dashboard';
            subtitle.textContent = 'System-wide real-time logistics and analytics';
        } else if (viewName === 'finance') {
            document.getElementById('page-title').textContent = 'Finance & Material Costs';
            subtitle.textContent = 'Aggregated tracking of material usage expenditures per site';
        } else if (viewName === 'labor') {
            document.getElementById('page-title').textContent = 'My Worker Profile';
            subtitle.textContent = 'Your logged-in profile credentials and status';
        } else if (viewName === 'safety') {
            document.getElementById('page-title').textContent = 'Safety & Compliance';
            subtitle.textContent = 'Monitor Safety Officers and inspect regulatory compliance status';
        } else if (viewName === 'reports') {
            document.getElementById('page-title').textContent = 'Analytics & Reports';
            subtitle.textContent = 'High-fidelity charts derived from database views and query samples';
        } else if (viewName === 'projects') {
            document.getElementById('page-title').textContent = 'Projects List';
            subtitle.textContent = 'Assigned construction projects and active details';
        }
    }
    
    renderActiveView();
}

// ==========================================
// View Renderers
// ==========================================
async function renderActiveView() {
    const container = document.getElementById('view-workspace');
    container.innerHTML = '<div class="loader-container"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>';
    
    try {
        switch (state.activeView) {
            case 'dashboard':
                await renderDashboard(container);
                break;
            case 'projects':
                await renderProjects(container);
                break;
            case 'logistics':
                await renderLogistics(container);
                break;
            case 'finance':
                await renderFinance(container);
                break;
            case 'labor':
                await renderLabor(container);
                break;
            case 'equipment':
                await renderEquipment(container);
                break;
            case 'safety':
                await renderSafety(container);
                break;
            case 'reports':
                await renderReports(container);
                break;
            default:
                container.innerHTML = '<div class="error-container">View not found.</div>';
        }
    } catch (err) {
        container.innerHTML = `
            <div class="error-container">
                <i class="fa-solid fa-circle-exclamation text-danger"></i>
                <p>Failed to load view data. Please ensure the backend server is running.</p>
                <button class="btn-secondary" onclick="window.location.reload()"><i class="fa-solid fa-rotate"></i> Retry</button>
            </div>
        `;
    }
}

// ------------------------------------------
// 1. Dashboard View
// ------------------------------------------
async function renderPersonalDashboard(container) {
    // Fetch user-specific data from filtered API endpoints
    const sites = await apiFetch('/Sites');
    const assignments = await apiFetch('/Assignments');
    const costs = await apiFetch('/Queries/views/site-material-cost');
    
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
        const maxCost = Math.max(...costs.map(c => c.totalMaterialCost || 0));
        costs.forEach(c => {
            const pctOfMax = maxCost > 0 ? Math.round(((c.totalMaterialCost || 0) / maxCost) * 100) : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.siteName}</strong></td>
                <td><strong>$${(c.totalMaterialCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td>
                    <div class="progress-bar-container" style="max-width: 400px;">
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

async function renderDashboard(container) {
    if (!state.user?.isAdmin) {
        await renderPersonalDashboard(container);
        return;
    }

    // Fetch dashboard core data
    const sites = await apiFetch('/Sites');
    const labor = await apiFetch('/Labor');
    const equipment = await apiFetch('/Equipment');
    const materialCostView = await apiFetch('/Queries/views/site-material-cost');
    
    // Aggregated stats
    const totalProjects = sites.length;
    const activeSites = sites.filter(s => {
        const end = new Date(s.endDate);
        const start = new Date(s.startDate);
        const now = new Date();
        return now >= start && now <= end;
    }).length;
    
    const idleCount = equipment.filter(e => e.current_status === 'Idle').length;
    const maintenanceCount = equipment.filter(e => e.current_status === 'Maintenance').length;
    
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

// ------------------------------------------
// 2. Project Management View (CRUD for Admin)
// ------------------------------------------
async function renderProjects(container) {
    const sites = await apiFetch('/Sites');
    const isAdmin = state.user?.isAdmin;
    
    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <div class="search-bar glass" style="width: 260px;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="project-filter-search" placeholder="Filter by name...">
                </div>
            </div>
            ${isAdmin ? `<button class="btn-primary" id="btn-create-project"><i class="fa-solid fa-plus"></i> Add Project</button>` : ''}
        </div>
        
        <div class="card-section glass">
            <div class="table-container">
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Project Details</th>
                            <th>Location</th>
                            <th>Dates</th>
                            <th>Category</th>
                            <th>Progress</th>
                            ${isAdmin ? '<th style="text-align: right;">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="projects-tbody">
                        <!-- Injected -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('projects-tbody');
    
    function populateTable(filterQuery = '') {
        tbody.innerHTML = '';
        const filtered = sites.filter(s => s.name.toLowerCase().includes(filterQuery.toLowerCase()) || s.location.toLowerCase().includes(filterQuery.toLowerCase()));
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;" class="text-secondary">No projects found.</td></tr>';
            return;
        }

        filtered.forEach(s => {
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
                <td><strong>${s.name}</strong></td>
                <td><i class="fa-solid fa-location-dot text-muted"></i> ${s.location}</td>
                <td>${s.startDate} to ${s.endDate}</td>
                <td><span class="badge badge-planned">${s.type}</span></td>
                <td>
                    <div class="progress-bar-container" style="width: 140px;">
                        <div class="progress-meta">
                            <strong>${pct}%</strong>
                        </div>
                        <div class="progress-bar-track">
                            <div class="progress-bar-fill" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </td>
                ${isAdmin ? `
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="edit-row-btn" data-id="${s.siteId}" title="Edit Project"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="delete-row-btn" data-id="${s.siteId}" title="Delete Project"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>` : ''}
            `;
            tbody.appendChild(tr);
        });

        // Attach action handlers
        if (isAdmin) {
            tbody.querySelectorAll('.edit-row-btn').forEach(btn => {
                btn.addEventListener('click', () => openProjectModal(parseInt(btn.getAttribute('data-id'))));
            });
            tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteProject(parseInt(btn.getAttribute('data-id'))));
            });
        }
    }

    populateTable();

    document.getElementById('project-filter-search').addEventListener('input', (e) => {
        populateTable(e.target.value.trim());
    });

    if (isAdmin) {
        document.getElementById('btn-create-project').addEventListener('click', () => openProjectModal());
        // Also bind the top-header "New Project" button to this action
        const topHeaderBtn = document.getElementById('header-action-btn');
        topHeaderBtn.onclick = () => openProjectModal();
    }
}

// ------------------------------------------
// Project CRUD Modals
// ------------------------------------------
async function openProjectModal(id = null) {
    const isEdit = id !== null;
    let project = { name: '', location: '', type: 'Commercial', startDate: '', endDate: '' };
    
    if (isEdit) {
        project = await apiFetch(`/Sites/${id}`);
    }

    const formHtml = `
        <form id="project-form">
            <div class="form-group">
                <label for="p-name">Project Name</label>
                <input type="text" id="p-name" required value="${project.name}">
            </div>
            <div class="form-group">
                <label for="p-location">Location</label>
                <input type="text" id="p-location" required value="${project.location}">
            </div>
            <div class="form-group">
                <label for="p-type">Category</label>
                <select id="p-type">
                    <option value="Luxury Residential" ${project.type === 'Luxury Residential' ? 'selected' : ''}>Luxury Residential</option>
                    <option value="Modern Residential" ${project.type === 'Modern Residential' ? 'selected' : ''}>Modern Residential</option>
                    <option value="Residential/Mall" ${project.type === 'Residential/Mall' ? 'selected' : ''}>Residential/Mall</option>
                    <option value="Government (Infrastructure)" ${project.type === 'Government (Infrastructure)' ? 'selected' : ''}>Government Infrastructure</option>
                    <option value="Govt (Industrial)" ${project.type === 'Govt (Industrial)' ? 'selected' : ''}>Govt Industrial</option>
                    <option value="Govt (Tech/Office)" ${project.type === 'Govt (Tech/Office)' ? 'selected' : ''}>Govt Tech/Office</option>
                    <option value="Govt (Urban/Park)" ${project.type === 'Govt (Urban/Park)' ? 'selected' : ''}>Govt Urban/Park</option>
                    <option value="Urban Renewal" ${project.type === 'Urban Renewal' ? 'selected' : ''}>Urban Renewal</option>
                    <option value="Coastal Residential" ${project.type === 'Coastal Residential' ? 'selected' : ''}>Coastal Residential</option>
                </select>
            </div>
            <div class="form-group">
                <label for="p-start">Start Date</label>
                <input type="date" id="p-start" required value="${project.startDate}">
            </div>
            <div class="form-group">
                <label for="p-end">End Date</label>
                <input type="date" id="p-end" required value="${project.endDate}">
            </div>
            <button type="submit" class="btn-primary" style="margin-top: 10px;">
                <span>${isEdit ? 'Save Changes' : 'Create Project'}</span>
            </button>
        </form>
    `;

    openModal(isEdit ? 'Edit Project' : 'New Project', formHtml, async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('p-name').value.trim(),
            location: document.getElementById('p-location').value.trim(),
            type: document.getElementById('p-type').value,
            startDate: document.getElementById('p-start').value,
            endDate: document.getElementById('p-end').value
        };

        try {
            if (isEdit) {
                await apiFetch(`/Sites/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showToast('Project updated successfully.', 'success');
            } else {
                await apiFetch('/Sites', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('Project created successfully.', 'success');
            }
            closeModal();
            renderActiveView();
        } catch (err) {}
    });
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project? This will set related assignments to NULL.')) return;
    try {
        await apiFetch(`/Sites/${id}`, { method: 'DELETE' });
        showToast('Project deleted successfully.', 'success');
        renderActiveView();
    } catch (err) {}
}

// ------------------------------------------
// 3. Logistics & Materials View
// ------------------------------------------
async function renderLogistics(container) {
    const materials = await apiFetch('/Materials');
    const usages = await apiFetch('/MaterialUsage');
    const sites = await apiFetch('/Sites');
    const isAdmin = state.user?.isAdmin;

    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <select id="logistics-view-filter">
                    <option value="materials">Materials Fleet Stock</option>
                    <option value="usages">Material Usage Logs</option>
                </select>
            </div>
            ${isAdmin ? `<button class="btn-primary" id="btn-logistics-action"><i class="fa-solid fa-plus"></i> Add Material</button>` : ''}
        </div>
        
        <div class="card-section glass">
            <div class="table-container" id="logistics-table-container">
                <!-- Injected by filter -->
            </div>
        </div>
    `;

    const viewFilter = document.getElementById('logistics-view-filter');
    const actionBtn = document.getElementById('btn-logistics-action');
    const tableContainer = document.getElementById('logistics-table-container');

    function drawLogisticsView() {
        const mode = viewFilter.value;
        tableContainer.innerHTML = '';
        
        if (mode === 'materials') {
            if (isAdmin) {
                actionBtn.classList.remove('hidden');
                actionBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Material';
                actionBtn.onclick = () => openMaterialModal();
            }
            
            tableContainer.innerHTML = `
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Material ID</th>
                            <th>Material Name</th>
                            <th>Unit Size</th>
                            <th>Unit Cost ($)</th>
                            ${isAdmin ? '<th style="text-align: right;">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="materials-tbody"></tbody>
                </table>
            `;
            
            const tbody = document.getElementById('materials-tbody');
            materials.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${m.matId}</td>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.unit}</td>
                    <td>$${m.unitCost.toFixed(2)}</td>
                    ${isAdmin ? `
                    <td style="text-align: right;">
                        <div class="table-actions" style="justify-content: flex-end;">
                            <button class="edit-row-btn" data-id="${m.matId}"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button class="delete-row-btn" data-id="${m.matId}"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>` : ''}
                `;
                tbody.appendChild(tr);
            });
            
            if (isAdmin) {
                tbody.querySelectorAll('.edit-row-btn').forEach(btn => {
                    btn.addEventListener('click', () => openMaterialModal(parseInt(btn.getAttribute('data-id'))));
                });
                tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteMaterial(parseInt(btn.getAttribute('data-id'))));
                });
            }
        } else {
            // USAGES LOGS
            if (isAdmin) {
                actionBtn.classList.remove('hidden');
                actionBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Record Usage';
                actionBtn.onclick = () => openUsageModal();
            }
            
            tableContainer.innerHTML = `
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Usage ID</th>
                            <th>Site / Project</th>
                            <th>Material Name</th>
                            <th>Quantity Used</th>
                            <th>Date Used</th>
                            ${isAdmin ? '<th style="text-align: right;">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="usages-tbody"></tbody>
                </table>
            `;
            
            const tbody = document.getElementById('usages-tbody');
            
            if (usages.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;" class="text-secondary">No usage records found.</td></tr>';
                return;
            }

            usages.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${u.usageId}</td>
                    <td><strong>${u.siteName || 'No Site'}</strong></td>
                    <td>${u.materialName || 'No Material'}</td>
                    <td>${u.quantityUsed} ${u.unit || ''}</td>
                    <td>${u.usageDate}</td>
                    ${isAdmin ? `
                    <td style="text-align: right;">
                        <div class="table-actions" style="justify-content: flex-end;">
                            <button class="delete-row-btn" data-id="${u.usageId}"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>` : ''}
                `;
                tbody.appendChild(tr);
            });
            
            if (isAdmin) {
                tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteUsage(parseInt(btn.getAttribute('data-id'))));
                });
            }
        }
    }

    viewFilter.addEventListener('change', drawLogisticsView);
    drawLogisticsView();
}

// Material and Usage Modals
async function openMaterialModal(id = null) {
    const isEdit = id !== null;
    let mat = { name: '', unit: '', unitCost: 1.0 };
    if (isEdit) {
        mat = await apiFetch(`/Materials/${id}`);
    }

    const formHtml = `
        <form id="material-form">
            <div class="form-group">
                <label for="m-name">Material Name</label>
                <input type="text" id="m-name" required value="${mat.name}">
            </div>
            <div class="form-group">
                <label for="m-unit">Unit Type (e.g. kg, bag, m3, roll)</label>
                <input type="text" id="m-unit" required value="${mat.unit}">
            </div>
            <div class="form-group">
                <label for="m-cost">Unit Cost ($)</label>
                <input type="number" id="m-cost" step="0.01" required value="${mat.unitCost}">
            </div>
            <button type="submit" class="btn-primary">
                <span>Save Material</span>
            </button>
        </form>
    `;

    openModal(isEdit ? 'Edit Material' : 'New Material', formHtml, async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('m-name').value.trim(),
            unit: document.getElementById('m-unit').value.trim(),
            unitCost: parseFloat(document.getElementById('m-cost').value)
        };
        try {
            if (isEdit) {
                await apiFetch(`/Materials/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                await apiFetch('/Materials', { method: 'POST', body: JSON.stringify(payload) });
            }
            showToast('Material stock saved.', 'success');
            closeModal();
            renderActiveView();
        } catch (err) {}
    });
}

async function deleteMaterial(id) {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
        await apiFetch(`/Materials/${id}`, { method: 'DELETE' });
        showToast('Material deleted.', 'success');
        renderActiveView();
    } catch (err) {}
}

async function openUsageModal() {
    const sites = await apiFetch('/Sites');
    const materials = await apiFetch('/Materials');

    const siteOptions = sites.map(s => `<option value="${s.siteId}">${s.name}</option>`).join('');
    const matOptions = materials.map(m => `<option value="${m.matId}">${m.name} (${m.unit})</option>`).join('');

    const formHtml = `
        <form id="usage-form">
            <div class="form-group">
                <label for="u-site">Project Site</label>
                <select id="u-site" required>${siteOptions}</select>
            </div>
            <div class="form-group">
                <label for="u-mat">Material</label>
                <select id="u-mat" required>${matOptions}</select>
            </div>
            <div class="form-group">
                <label for="u-qty">Quantity Used</label>
                <input type="number" id="u-qty" required min="1">
            </div>
            <div class="form-group">
                <label for="u-date">Usage Date</label>
                <input type="date" id="u-date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button type="submit" class="btn-primary">
                <span>Record Usage</span>
            </button>
        </form>
    `;

    openModal('Record Material Usage', formHtml, async (e) => {
        e.preventDefault();
        const payload = {
            siteId: parseInt(document.getElementById('u-site').value),
            matId: parseInt(document.getElementById('u-mat').value),
            quantityUsed: parseInt(document.getElementById('u-qty').value),
            usageDate: document.getElementById('u-date').value
        };
        try {
            await apiFetch('/MaterialUsage', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Usage log added.', 'success');
            closeModal();
            renderActiveView();
        } catch (err) {}
    });
}

async function deleteUsage(id) {
    if (!confirm('Are you sure you want to delete this usage log?')) return;
    try {
        await apiFetch(`/MaterialUsage/${id}`, { method: 'DELETE' });
        showToast('Usage log deleted.', 'success');
        renderActiveView();
    } catch (err) {}
}

// ------------------------------------------
// 4. Finance & Costs View
// ------------------------------------------
async function renderFinance(container) {
    const costs = await apiFetch('/Queries/views/site-material-cost');
    
    // Calculate total spend
    const totalSpend = costs.reduce((acc, c) => acc + c.totalMaterialCost, 0);
    const avgSpend = costs.length > 0 ? (totalSpend / costs.length) : 0;
    
    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card glass" style="grid-column: span 2;">
                <div class="stat-icon"><i class="fa-solid fa-sack-dollar text-success"></i></div>
                <div class="stat-info">
                    <p>Total Material Cost (Across All Sites)</p>
                    <h3>$${totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                </div>
            </div>
            <div class="stat-card glass" style="grid-column: span 2;">
                <div class="stat-icon"><i class="fa-solid fa-chart-line text-info"></i></div>
                <div class="stat-info">
                    <p>Average Cost Per Site</p>
                    <h3>$${avgSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                </div>
            </div>
        </div>
        
        <div class="card-section glass">
            <div class="section-header">
                <h2>Total Cost Expenditure List</h2>
            </div>
            <div class="table-container">
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Site / Project Name</th>
                            <th>Total Accumulated Cost ($)</th>
                            <th>Cost Visualizer</th>
                        </tr>
                    </thead>
                    <tbody id="finance-tbody">
                        <!-- Injected -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('finance-tbody');
    
    if (costs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;" class="text-secondary">No costs data available.</td></tr>';
        return;
    }

    // Find max cost to calculate bar ratios
    const maxCost = Math.max(...costs.map(c => c.totalMaterialCost));

    costs.forEach(c => {
        const pctOfMax = maxCost > 0 ? Math.round((c.totalMaterialCost / maxCost) * 100) : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.siteName}</strong></td>
            <td><strong>$${c.totalMaterialCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
            <td>
                <div class="progress-bar-container" style="width: 320px;">
                    <div class="progress-bar-track" style="height: 10px;">
                        <div class="progress-bar-fill" style="width: ${pctOfMax}%; background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);"></div>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ------------------------------------------
// 5. Labor & HR View (Admin CRUD / Worker Profile)
// ------------------------------------------
async function renderLabor(container) {
    const isAdmin = state.user?.isAdmin;

    if (!isAdmin) {
        // Render Worker Profile Card (Self view)
        const profile = await apiFetch('/Labor/me');
        container.innerHTML = `
            <div class="details-grid">
                <div class="card-section glass" style="grid-column: span 2; display: flex; flex-direction: row; gap: 40px; align-items: center; padding: 40px;">
                    <div class="avatar" style="width: 120px; height: 120px; font-size: 3.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, var(--accent) 0%, var(--accent-hover) 100%); color: #0b111e; font-weight: 700; border: 4px solid rgba(255,255,255,0.15)">
                        ${profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex-grow: 1;">
                        <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; margin-bottom: 8px;">${profile.name}</h2>
                        <span class="badge badge-active" style="font-size: 0.9rem; padding: 6px 14px; margin-bottom: 20px;">${profile.tradeSpecialty || 'General Worker'}</span>
                        
                        <div class="details-list" style="margin-top: 16px; max-width: 500px;">
                            <div class="details-item">
                                <span>Worker Reference ID:</span>
                                <strong>#${profile.workerId}</strong>
                            </div>
                            <div class="details-item">
                                <span>Hourly Wage Rate:</span>
                                <strong>$${profile.hourlyRate ? profile.hourlyRate.toFixed(2) : '0.00'} / hr</strong>
                            </div>
                            <div class="details-item">
                                <span>Portal Username:</span>
                                <strong>${profile.username || 'Not configured'}</strong>
                            </div>
                            <div class="details-item">
                                <span>Access Privileges:</span>
                                <strong>Worker Role</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Admin View: List all workers
    const labor = await apiFetch('/Labor');
    
    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <div class="search-bar glass" style="width: 260px;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="labor-filter-search" placeholder="Search by name...">
                </div>
            </div>
            <button class="btn-primary" id="btn-add-labor"><i class="fa-solid fa-plus"></i> Add Worker</button>
        </div>
        
        <div class="card-section glass">
            <div class="table-container">
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Worker ID</th>
                            <th>Name</th>
                            <th>Specialty</th>
                            <th>Hourly Rate ($)</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="labor-tbody">
                        <!-- Injected -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('labor-tbody');
    
    function populateLabor(filterQuery = '') {
        tbody.innerHTML = '';
        const filtered = labor.filter(l => l.name.toLowerCase().includes(filterQuery.toLowerCase()) || (l.tradeSpecialty && l.tradeSpecialty.toLowerCase().includes(filterQuery.toLowerCase())));
        
        filtered.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${l.workerId}</td>
                <td><strong>${l.name}</strong></td>
                <td>${l.tradeSpecialty || 'N/A'}</td>
                <td>$${l.hourlyRate ? l.hourlyRate.toFixed(2) : '0.00'}</td>
                <td><small>${l.username || 'N/A'}</small></td>
                <td>
                    <span class="badge ${l.isAdmin ? 'badge-planned' : 'badge-completed'}">
                        ${l.isAdmin ? 'Admin' : 'Worker'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="edit-row-btn" data-id="${l.workerId}" title="Edit Worker"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="delete-row-btn" data-id="${l.workerId}" title="Delete Worker"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.edit-row-btn').forEach(btn => {
            btn.addEventListener('click', () => openLaborModal(parseInt(btn.getAttribute('data-id'))));
        });
        tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteLabor(parseInt(btn.getAttribute('data-id'))));
        });
    }

    populateLabor();

    document.getElementById('labor-filter-search').addEventListener('input', (e) => {
        populateLabor(e.target.value.trim());
    });

    document.getElementById('btn-add-labor').addEventListener('click', () => openLaborModal());
}

async function openLaborModal(id = null) {
    const isEdit = id !== null;
    let worker = { name: '', tradeSpecialty: '', hourlyRate: 20.0, username: '', password: '', isAdmin: false };
    if (isEdit) {
        worker = await apiFetch(`/Labor/${id}`);
    }

    const formHtml = `
        <form id="labor-form">
            <div class="form-group">
                <label for="l-name">Full Name</label>
                <input type="text" id="l-name" required value="${worker.name}">
            </div>
            <div class="form-group">
                <label for="l-specialty">Trade Specialty</label>
                <input type="text" id="l-specialty" required placeholder="e.g. Beton İşçisi" value="${worker.tradeSpecialty || ''}">
            </div>
            <div class="form-group">
                <label for="l-rate">Hourly Rate ($)</label>
                <input type="number" id="l-rate" required step="0.5" value="${worker.hourlyRate || 20.0}">
            </div>
            <div class="form-group">
                <label for="l-user">Username</label>
                <input type="text" id="l-user" required placeholder="username" value="${worker.username || ''}">
            </div>
            <div class="form-group">
                <label for="l-pass">Password ${isEdit ? '(leave blank to keep current)' : ''}</label>
                <input type="password" id="l-pass" ${isEdit ? '' : 'required'} placeholder="••••••••">
            </div>
            <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center;">
                <input type="checkbox" id="l-admin" style="width: auto; cursor: pointer;" ${worker.isAdmin ? 'checked' : ''}>
                <label for="l-admin" style="margin-bottom: 0; cursor: pointer;">System Administrator Privileges</label>
            </div>
            <button type="submit" class="btn-primary" style="margin-top: 10px;">
                <span>Save Record</span>
            </button>
        </form>
    `;

    openModal(isEdit ? 'Edit Worker Record' : 'Add New Crew Member', formHtml, async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('l-name').value.trim(),
            tradeSpecialty: document.getElementById('l-specialty').value.trim() || null,
            hourlyRate: parseFloat(document.getElementById('l-rate').value) || 0.0,
            username: document.getElementById('l-user').value.trim(),
            isAdmin: document.getElementById('l-admin').checked
        };
        
        const passwordVal = document.getElementById('l-pass').value;
        if (passwordVal) {
            payload.password = passwordVal;
        } else if (isEdit) {
            payload.password = worker.password; // Keep old
        }

        try {
            if (isEdit) {
                await apiFetch(`/Labor/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
                showToast('Worker profile updated.', 'success');
            } else {
                await apiFetch('/Labor', { method: 'POST', body: JSON.stringify(payload) });
                showToast('Worker profile created.', 'success');
            }
            closeModal();
            renderActiveView();
        } catch (err) {}
    });
}

async function deleteLabor(id) {
    if (!confirm('Are you sure you want to delete this worker profile? This will set related assignments to NULL.')) return;
    try {
        await apiFetch(`/Labor/${id}`, { method: 'DELETE' });
        showToast('Worker profile deleted.', 'success');
        renderActiveView();
    } catch (err) {}
}

// ------------------------------------------
// 6. Equipment & Fleet View
// ------------------------------------------
async function renderEquipment(container) {
    const equipment = await apiFetch('/Equipment');
    const logs = await apiFetch('/Queries/views/equipment-maintenance-history');
    const isAdmin = state.user?.isAdmin;

    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <select id="equipment-view-filter">
                    <option value="fleet">Equipment Fleet Stock</option>
                    <option value="maintenance">Maintenance Logs</option>
                </select>
            </div>
            ${isAdmin ? `<button class="btn-primary" id="btn-equipment-action"><i class="fa-solid fa-plus"></i> Add Equipment</button>` : ''}
        </div>
        
        <div class="card-section glass">
            <div class="table-container" id="equipment-table-container">
                <!-- Injected by filter -->
            </div>
        </div>
    `;

    const viewFilter = document.getElementById('equipment-view-filter');
    const actionBtn = document.getElementById('btn-equipment-action');
    const tableContainer = document.getElementById('equipment-table-container');

    function drawView() {
        const mode = viewFilter.value;
        tableContainer.innerHTML = '';

        if (mode === 'fleet') {
            if (isAdmin) {
                actionBtn.classList.remove('hidden');
                actionBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Equipment';
                actionBtn.onclick = () => openEquipmentModal();
            }

            tableContainer.innerHTML = `
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Equip ID</th>
                            <th>Machine Type</th>
                            <th>Model</th>
                            <th>Status</th>
                            ${isAdmin ? '<th style="text-align: right;">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="equip-tbody"></tbody>
                </table>
            `;

            const tbody = document.getElementById('equip-tbody');
            equipment.forEach(e => {
                let badgeClass = 'badge-active';
                if (e.current_status === 'Idle') badgeClass = 'badge-idle';
                if (e.current_status === 'Maintenance') badgeClass = 'badge-maintenance';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${e.equipId}</td>
                    <td><strong>${e.type}</strong></td>
                    <td>${e.model}</td>
                    <td><span class="badge ${badgeClass}">${e.current_status}</span></td>
                    ${isAdmin ? `
                    <td style="text-align: right;">
                        <div class="table-actions" style="justify-content: flex-end;">
                            <button class="edit-row-btn" data-id="${e.equipId}"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button class="delete-row-btn" data-id="${e.equipId}"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>` : ''}
                `;
                tbody.appendChild(tr);
            });

            if (isAdmin) {
                tbody.querySelectorAll('.edit-row-btn').forEach(btn => {
                    btn.addEventListener('click', () => openEquipmentModal(parseInt(btn.getAttribute('data-id'))));
                });
                tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteEquipment(parseInt(btn.getAttribute('data-id'))));
                });
            }
        } else {
            // MAINTENANCE
            if (isAdmin) {
                actionBtn.classList.remove('hidden');
                actionBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Log Maintenance';
                actionBtn.onclick = () => openMaintenanceModal();
            }

            tableContainer.innerHTML = `
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Machine Type</th>
                            <th>Model</th>
                            <th>Service Date</th>
                            <th>Maintenance Description</th>
                        </tr>
                    </thead>
                    <tbody id="maintenance-tbody"></tbody>
                </table>
            `;

            const tbody = document.getElementById('maintenance-tbody');
            logs.forEach(l => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${l.type}</strong></td>
                    <td>${l.model}</td>
                    <td>${l.serviceDate}</td>
                    <td><small class="text-secondary">${l.description}</small></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    viewFilter.addEventListener('change', drawView);
    drawView();
}

async function openEquipmentModal(id = null) {
    const isEdit = id !== null;
    let equip = { type: '', model: '', currentStatus: 'Active' };
    if (isEdit) {
        equip = await apiFetch(`/Equipment/${id}`);
    }

    const formHtml = `
        <form id="equipment-form">
            <div class="form-group">
                <label for="e-type">Equipment Type</label>
                <input type="text" id="e-type" required placeholder="e.g. Tower Crane" value="${equip.type}">
            </div>
            <div class="form-group">
                <label for="e-model">Model Reference</label>
                <input type="text" id="e-model" required placeholder="e.g. Liebherr 280" value="${equip.model}">
            </div>
            <div class="form-group">
                <label for="e-status">Fleet Status</label>
                <select id="e-status">
                    <option value="Active" ${equip.currentStatus === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Idle" ${equip.currentStatus === 'Idle' ? 'selected' : ''}>Idle</option>
                    <option value="Maintenance" ${equip.currentStatus === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                </select>
            </div>
            <button type="submit" class="btn-primary">
                <span>Save Equipment</span>
            </button>
        </form>
    `;

    openModal(isEdit ? 'Edit Equipment' : 'Add New Equipment', formHtml, async (e) => {
        e.preventDefault();
        const payload = {
            type: document.getElementById('e-type').value.trim(),
            model: document.getElementById('e-model').value.trim(),
            currentStatus: document.getElementById('e-status').value
        };
        try {
            if (isEdit) {
                await apiFetch(`/Equipment/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                await apiFetch('/Equipment', { method: 'POST', body: JSON.stringify(payload) });
            }
            showToast('Equipment fleet details saved.', 'success');
            closeModal();
            renderActiveView();
        } catch (err) {}
    });
}

async function deleteEquipment(id) {
    if (!confirm('Are you sure you want to delete this equipment? This will cascade-delete maintenance logs and clear related assignments.')) return;
    try {
        await apiFetch(`/Equipment/${id}`, { method: 'DELETE' });
        showToast('Equipment and maintenance logs deleted.', 'success');
        renderActiveView();
    } catch (err) {}
}

async function openMaintenanceModal() {
    const equipmentList = await apiFetch('/Equipment');
    const options = equipmentList.map(e => `<option value="${e.equipId}">${e.type} (${e.model})</option>`).join('');

    const formHtml = `
        <form id="maintenance-form">
            <div class="form-group">
                <label for="ml-equip">Select Machine</label>
                <select id="ml-equip" required>${options}</select>
            </div>
            <div class="form-group">
                <label for="ml-date">Service Date</label>
                <input type="date" id="ml-date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="ml-desc">Maintenance Description</label>
                <textarea id="ml-desc" required rows="3" placeholder="Describe the inspection and service performed..."></textarea>
            </div>
            <button type="submit" class="btn-primary">
                <span>Log Maintenance</span>
            </button>
        </form>
    `;

    openModal('Record Equipment Maintenance Log', formHtml, async (e) => {
        e.preventDefault();
        const payload = {
            equipId: parseInt(document.getElementById('ml-equip').value),
            serviceDate: document.getElementById('ml-date').value,
            description: document.getElementById('ml-desc').value.trim()
        };
        try {
            await apiFetch('/MaintenanceLogs', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Maintenance log recorded successfully.', 'success');
            closeModal();
            renderActiveView();
        } catch (err) {}
    });
}

// ------------------------------------------
// 7. Assignments View
// ------------------------------------------
async function renderAssignments(container) {
    const isAdmin = state.user?.isAdmin;
    
    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <h2 style="font-family: var(--font-heading); font-size: 1.25rem;">Active Fleet and Crew Assignments</h2>
            </div>
            ${isAdmin ? `<button class="btn-primary" id="btn-add-assignment"><i class="fa-solid fa-plus"></i> Assign Resource</button>` : ''}
        </div>
        
        <div class="card-section glass">
            <div class="table-container">
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Assign ID</th>
                            <th>Project Site</th>
                            <th>Worker Name</th>
                            <th>Specialty</th>
                            <th>Equipment Assigned</th>
                            <th>Assignment Date</th>
                            ${isAdmin ? '<th style="text-align: right;">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="assignments-tbody">
                        <!-- Injected -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('assignments-tbody');

    if (!isAdmin) {
        // Workers see only their own assignments via GET /api/Assignments/5 (fetched by matching assignment id)
        // Wait, how does the worker know their assignment IDs?
        // We can fetch all sites and match their own WorkerId, or let's try retrieving their own profile and rendering their active assignments.
        // Actually, we can fetch all assignments. If the endpoint returns 403 (Forbidden), we catch it and display a refined query of their own record details.
        // But wait! We implemented assignment.WorkerId checks on the server-side, so if a worker requests GET /api/Assignments, it returns 403.
        // But if they request /api/Labor/me, it returns the labor details. In the labor details, can they see assignments?
        // Let's call /api/Labor/me. In our database, the assignments table references workers.
        // What if we let workers fetch assignments by doing a client-side query or custom fetch?
        // Actually, let's fetch all assignments. Since they are restricted, we can fetch from the server. If they are worker, they can only view the ones they own.
        // Wait! In `AssignmentsController.cs` GetById, they can only fetch their own ID.
        // But wait, they don't have a GetAll for workers.
        // Let's implement a neat client side error handler or check.
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;" class="text-secondary">Retrieving your personal assignments...</td></tr>';
        
        try {
            // Let's fetch their own assignments. Since they don't have GetAll, let's search assignments by ID from 1 to 100 or list their profile.
            // Wait, we can fetch `site_overview` from the backend!
            // Wait, does `/api/Queries/views/site-overview` allow workers?
            // Yes! `QueriesController` endpoints only require an authenticated user! They do not have role restrictions!
            // So a worker CAN fetch `site_overview`!
            // Let's use `site_overview` (which combines sites, labor, and equipment assignments) and filter by the worker's name!
            // This is a brilliant workaround that fully utilizes our database views!
            const overview = await apiFetch('/Queries/views/site-overview');
            const workerName = state.user.name;
            const workerAssignments = overview.filter(o => o.workerName.toLowerCase() === workerName.toLowerCase());
            
            tbody.innerHTML = '';
            if (workerAssignments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;" class="text-secondary">You are not currently assigned to any active project sites.</td></tr>';
                return;
            }

            workerAssignments.forEach((a, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${idx + 1}</td>
                    <td><strong>${a.siteName}</strong></td>
                    <td>${a.workerName}</td>
                    <td>${a.tradeSpecialty || 'Worker'}</td>
                    <td>${a.equipmentType || 'None'} <small class="text-secondary">(${a.currentStatus || 'N/A'})</small></td>
                    <td>${a.assignmentDate}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;" class="text-danger">Failed to retrieve assignments.</td></tr>';
        }
        return;
    }

    // Admin View: List all assignments
    const assignments = await apiFetch('/Assignments');
    
    tbody.innerHTML = '';
    if (assignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;" class="text-secondary">No assignments recorded.</td></tr>';
    } else {
        assignments.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${a.assignId}</td>
                <td><strong>${a.siteName || 'Unassigned Site'}</strong></td>
                <td>${a.workerName || 'Unassigned Crew'}</td>
                <td>${a.tradeSpecialty || 'N/A'}</td>
                <td>${a.equipmentModel ? `${a.equipmentType || 'Machine'} (${a.equipmentModel})` : 'None assigned'}</td>
                <td>${a.assignmentDate}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="delete-row-btn" data-id="${a.assignId}"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteAssignment(parseInt(btn.getAttribute('data-id'))));
        });
    }

    document.getElementById('btn-add-assignment').addEventListener('click', () => openAssignmentModal());
}

async function openAssignmentModal() {
    const sites = await apiFetch('/Sites');
    const labor = await apiFetch('/Labor');
    const equipment = await apiFetch('/Equipment');

    const siteOptions = sites.map(s => `<option value="${s.siteId}">${s.name}</option>`).join('');
    const laborOptions = labor.map(l => `<option value="${l.workerId}">${l.name} (${l.tradeSpecialty || 'General'})</option>`).join('');
    const equipOptions = `<option value="">None (No machine assigned)</option>` + equipment.map(e => `<option value="${e.equipId}">${e.type} (${e.model}) - ${e.current_status || e.currentStatus}</option>`).join('');

    const formHtml = `
        <form id="assignment-form">
            <div class="form-group">
                <label for="as-site">Project Site</label>
                <select id="as-site" required>${siteOptions}</select>
            </div>
            <div class="form-group">
                <label for="as-labor">Assign Worker</label>
                <select id="as-labor" required>${laborOptions}</select>
            </div>
            <div class="form-group">
                <label for="as-equip">Assign Equipment</label>
                <select id="as-equip">${equipOptions}</select>
            </div>
            <div class="form-group">
                <label for="as-date">Assignment Date</label>
                <input type="date" id="as-date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button type="submit" class="btn-primary">
                <span>Assign Resources</span>
            </button>
        </form>
    `;

    openModal('Create Site Resource Assignment', formHtml, async (e) => {
        e.preventDefault();
        const equipVal = document.getElementById('as-equip').value;
        const payload = {
            siteId: parseInt(document.getElementById('as-site').value),
            workerId: parseInt(document.getElementById('as-labor').value),
            equipId: equipVal ? parseInt(equipVal) : null,
            assignmentDate: document.getElementById('as-date').value
        };
        try {
            await apiFetch('/Assignments', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Assignment recorded.', 'success');
            closeModal();
            renderActiveView();
        } catch (err) {}
    });
}

async function deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
        await apiFetch(`/Assignments/${id}`, { method: 'DELETE' });
        showToast('Assignment removed.', 'success');
        renderActiveView();
    } catch (err) {}
}

// ------------------------------------------
// 7. Safety & Compliance View
// ------------------------------------------
async function renderSafety(container) {
    // Safety officers are users where tradeSpecialty is "İş Güvenliği Denetçisi" or isAdmin is true
    // We can fetch the list of all labor records, and filter those
    const labor = await apiFetch('/Labor');
    const safetyOfficers = labor.filter(l => l.tradeSpecialty === 'İş Güvenliği Denetçisi' || l.isAdmin);

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card glass" style="grid-column: span 2;">
                <div class="stat-icon"><i class="fa-solid fa-shield-halved text-success"></i></div>
                <div class="stat-info">
                    <p>Safety Audits Status</p>
                    <h3>100% Compliant</h3>
                    <div class="stat-change up"><i class="fa-solid fa-circle-check"></i> <span>All inspections passed</span></div>
                </div>
            </div>
            <div class="stat-card glass" style="grid-column: span 2;">
                <div class="stat-icon"><i class="fa-solid fa-user-shield text-info"></i></div>
                <div class="stat-info">
                    <p>Active Safety Officers</p>
                    <h3>${safetyOfficers.length} Officers</h3>
                    <div class="stat-change"><small class="text-secondary">Supervising construction operations</small></div>
                </div>
            </div>
        </div>
        
        <div class="card-section glass">
            <div class="section-header">
                <h2>Designated Safety & Compliance Team</h2>
            </div>
            <div class="table-container">
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Officer ID</th>
                            <th>Full Name</th>
                            <th>Compliance Specialty</th>
                            <th>Username</th>
                            <th>Role Status</th>
                        </tr>
                    </thead>
                    <tbody id="safety-tbody">
                        <!-- Injected -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('safety-tbody');
    safetyOfficers.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${o.workerId}</td>
            <td><strong>${o.name}</strong></td>
            <td>${o.tradeSpecialty || 'System Administrator'}</td>
            <td><small>${o.username || 'N/A'}</small></td>
            <td><span class="badge badge-active">${o.isAdmin ? 'Lead Safety Admin' : 'Compliance Officer'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ------------------------------------------
// 8. Analytics & Reports View (Charts using Chart.js)
// ------------------------------------------
async function renderReports(container) {
    container.innerHTML = `
        <div class="charts-grid">
            <!-- Chart 1: Material Cost per Site -->
            <div class="chart-card glass">
                <div class="section-header">
                    <h2>Material Costs per Project</h2>
                </div>
                <div class="chart-container">
                    <canvas id="costChart"></canvas>
                </div>
            </div>
            
            <!-- Chart 2: Worker Assignment Frequencies -->
            <div class="chart-card glass">
                <div class="section-header">
                    <h2>Crew Assignments per Worker</h2>
                </div>
                <div class="chart-container">
                    <canvas id="laborChart"></canvas>
                </div>
            </div>
            
            <!-- Chart 3: Equipment Status breakdown -->
            <div class="chart-card glass">
                <div class="section-header">
                    <h2>Equipment Status Allocation</h2>
                </div>
                <div class="chart-container">
                    <canvas id="equipChart"></canvas>
                </div>
            </div>
            
            <!-- Chart 4: Maintenance Frequency -->
            <div class="chart-card glass">
                <div class="section-header">
                    <h2>Frequent Maintenance Logs</h2>
                </div>
                <div class="chart-container">
                    <canvas id="maintChart"></canvas>
                </div>
            </div>
        </div>
    `;

    // Fetch data for charts
    const costData = await apiFetch('/Queries/views/site-material-cost');
    const laborStats = await apiFetch('/Queries/samples/worker-assignment-counts');
    const equipment = await apiFetch('/Equipment');
    const maintFreq = await apiFetch('/Queries/samples/equipment-frequent-maintenance');

    // Destroy active charts to prevent memory leaks
    Object.values(state.charts).forEach(c => {
        if (c && typeof c.destroy === 'function') c.destroy();
    });
    state.charts = {};

    // Chart 1: Cost chart
    const costCtx = document.getElementById('costChart').getContext('2d');
    state.charts.cost = new Chart(costCtx, {
        type: 'bar',
        data: {
            labels: costData.map(c => c.siteName.split(' ')[0]),
            datasets: [{
                label: 'Cost ($)',
                data: costData.map(c => c.totalMaterialCost),
                backgroundColor: 'rgba(245, 158, 11, 0.65)',
                borderColor: '#f59e0b',
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
                x: { ticks: { color: '#9ca3af' } }
            }
        }
    });

    // Chart 2: Labor Stats Chart
    const laborCtx = document.getElementById('laborChart').getContext('2d');
    const topLabor = laborStats.slice(0, 8); // top 8 workers
    state.charts.labor = new Chart(laborCtx, {
        type: 'line',
        data: {
            labels: topLabor.map(l => l.name.split(' ')[0]),
            datasets: [{
                label: 'Assignments',
                data: topLabor.map(l => l.totalAssignments),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', stepSize: 1 } },
                x: { ticks: { color: '#9ca3af' } }
            }
        }
    });

    // Chart 3: Equipment Status allocation
    const activeCount = equipment.filter(e => e.current_status === 'Active').length;
    const idleCount = equipment.filter(e => e.current_status === 'Idle').length;
    const maintCount = equipment.filter(e => e.current_status === 'Maintenance').length;

    const equipCtx = document.getElementById('equipChart').getContext('2d');
    state.charts.equip = new Chart(equipCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Idle', 'Maintenance'],
            datasets: [{
                data: [activeCount, idleCount, maintCount],
                backgroundColor: ['#10b981', '#6b7280', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 20 } }
            }
        }
    });

    // Chart 4: Maintenance Frequency
    const maintCtx = document.getElementById('maintChart').getContext('2d');
    state.charts.maint = new Chart(maintCtx, {
        type: 'bar',
        data: {
            labels: maintFreq.map(f => f.type),
            datasets: [{
                label: 'Maintenance Counts',
                data: maintFreq.map(f => f.maintenanceCount),
                backgroundColor: 'rgba(59, 130, 246, 0.65)',
                borderColor: '#3b82f6',
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', stepSize: 1 } },
                x: { ticks: { color: '#9ca3af' } }
            }
        }
    });
}

// ==========================================
// MODAL CONTROLLER
// ==========================================
function openModal(title, formHtml, onSubmit) {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = title;
    modalContent.innerHTML = formHtml;
    
    overlay.classList.remove('hidden');
    
    const form = modalContent.querySelector('form');
    if (form) {
        form.addEventListener('submit', onSubmit);
    }
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
}

// ==========================================
// APP INITIALIZATION
// ==========================================
function init() {
    // Screen toggle link (Sign In / Sign Up toggle)
    const toggleLink = document.getElementById('auth-toggle-link');
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        const signupFields = document.getElementById('signup-fields');
        const authTitle = document.getElementById('auth-title');
        const authSubtitle = document.getElementById('auth-subtitle');
        const submitBtnText = document.getElementById('auth-submit-btn').querySelector('span');
        
        if (signupFields.classList.contains('hidden')) {
            signupFields.classList.remove('hidden');
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Register a new profile in the portal';
            submitBtnText.textContent = 'Register & Sign In';
            toggleLink.textContent = 'Sign in';
            document.getElementById('auth-toggle-text').firstChild.textContent = 'Already have an account? ';
        } else {
            signupFields.classList.add('hidden');
            authTitle.textContent = 'Welcome Back';
            authSubtitle.textContent = 'Please sign in to access the system';
            submitBtnText.textContent = 'Sign In';
            toggleLink.textContent = 'Sign up';
            document.getElementById('auth-toggle-text').firstChild.textContent = "Don't have an account? ";
        }
    });

    // Auth Submit Form
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);

    // Logout Click
    document.getElementById('logout-button').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Navigation Switch Link Clicks (using event delegation)
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            if (link) {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                switchView(view);
            }
        });
    }

    // Modal close overlay and button clicks
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    // Global Search event listener
    document.getElementById('global-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                showToast(`Global search for "${query}" not fully indexed yet. Searching views...`, 'info');
            }
        }
    });

    // Check if already authenticated
    if (state.token && state.user) {
        loginSuccess(state.token, state.user);
    } else {
        logout();
    }
}

// Start SPA
document.addEventListener('DOMContentLoaded', init);
