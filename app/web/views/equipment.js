// ==========================================
// Equipment, Assignments & Reports View Module
// ==========================================
import { state, apiFetch, showToast, openModal, closeModal, renderActiveView } from '../app.js';

// ------------------------------------------
// Equipment & Fleet View
// ------------------------------------------
export async function renderEquipment(container) {
    const [equipment, logs] = await Promise.all([
        apiFetch('/Equipment'),
        apiFetch('/Queries/views/equipment-maintenance-history')
    ]);
    const isAdmin = state.user?.isAdmin;

    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <select id="equipment-view-filter">
                    <option value="fleet">Equipment Fleet Stock</option>
                    <option value="maintenance">Maintenance Logs</option>
                    ${isAdmin ? `
                    <option value="idle">Idle Equipment (Available)</option>
                    <option value="under-maint">Equipment Under Maintenance</option>
                    ` : ''}
                </select>
            </div>
        </div>
        
        <div class="card-section glass">
            <div class="table-container" id="equipment-table-container">
                <!-- Injected by filter -->
            </div>
        </div>
    `;

    const viewFilter = document.getElementById('equipment-view-filter');
    const headerActionBtn = document.getElementById('header-action-btn');
    const tableContainer = document.getElementById('equipment-table-container');

    async function drawView() {
        const mode = viewFilter.value;
        tableContainer.innerHTML = '';
        if (headerActionBtn) headerActionBtn.classList.add('hidden');

        if (mode === 'fleet') {
            if (isAdmin && headerActionBtn) {
                headerActionBtn.classList.remove('hidden');
                headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Add Equipment</span>';
                headerActionBtn.onclick = () => openEquipmentModal();
            }

            tableContainer.innerHTML = `
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>Equip ID</th>
                            <th>Machine Type</th>
                            <th>Model</th>
                            <th>Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="equip-tbody"></tbody>
                </table>
            `;

            const tbody = document.getElementById('equip-tbody');
            equipment.forEach(e => {
                let badgeClass = 'badge-active';
                if (e.currentStatus === 'Idle') badgeClass = 'badge-idle';
                if (e.currentStatus === 'Maintenance') badgeClass = 'badge-maintenance';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${e.equipId}</td>
                    <td><strong>${e.type}</strong></td>
                    <td>${e.model}</td>
                    <td><span class="badge ${badgeClass}">${e.currentStatus}</span></td>
                    <td style="text-align: right;">
                        <div class="table-actions" style="justify-content: flex-end;">
                            <button class="edit-row-btn" data-id="${e.equipId}" title="Edit Status"><i class="fa-regular fa-pen-to-square"></i></button>
                            ${isAdmin ? `<button class="delete-row-btn" data-id="${e.equipId}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Attach edit handlers for all users
            tbody.querySelectorAll('.edit-row-btn').forEach(btn => {
                btn.addEventListener('click', () => openEquipmentModal(parseInt(btn.getAttribute('data-id'))));
            });
            // Attach delete handlers for admins only
            if (isAdmin) {
                tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteEquipment(parseInt(btn.getAttribute('data-id'))));
                });
            }
        } else if (mode === 'maintenance') {
            if (isAdmin && headerActionBtn) {
                headerActionBtn.classList.remove('hidden');
                headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Log Maintenance</span>';
                headerActionBtn.onclick = () => openMaintenanceModal();
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
        } else if (mode === 'idle') {
            tableContainer.innerHTML = '<div style="padding: 20px; text-align: center;" class="text-secondary"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading idle fleet...</div>';
            try {
                const idleList = await apiFetch('/Queries/views/idle-equipment');
                tableContainer.innerHTML = `
                    <table class="responsive-table">
                        <thead>
                            <tr>
                                <th>Equip ID</th>
                                <th>Machine Type</th>
                                <th>Model</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="idle-tbody"></tbody>
                    </table>
                `;
                const tbody = document.getElementById('idle-tbody');
                if (idleList.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;" class="text-secondary">No idle equipment found. All fleet is active.</td></tr>';
                } else {
                    idleList.forEach(e => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>#${e.equipId}</td>
                            <td><strong>${e.type}</strong></td>
                            <td>${e.model}</td>
                            <td><span class="badge badge-idle">Idle (Available)</span></td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } catch (err) {
                tableContainer.innerHTML = '<div style="padding: 20px; text-align: center;" class="text-danger">Failed to load idle fleet.</div>';
            }
        } else if (mode === 'under-maint') {
            tableContainer.innerHTML = '<div style="padding: 20px; text-align: center;" class="text-secondary"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading maintenance list...</div>';
            try {
                const maintList = await apiFetch('/Queries/samples/under-maintenance');
                tableContainer.innerHTML = `
                    <table class="responsive-table">
                        <thead>
                            <tr>
                                <th>Equip ID</th>
                                <th>Machine Type</th>
                                <th>Model</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="maint-list-tbody"></tbody>
                    </table>
                `;
                const tbody = document.getElementById('maint-list-tbody');
                if (maintList.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;" class="text-secondary">No equipment is currently under maintenance.</td></tr>';
                } else {
                    maintList.forEach(e => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>#${e.equipId}</td>
                            <td><strong>${e.type}</strong></td>
                            <td>${e.model}</td>
                            <td><span class="badge badge-maintenance">In Maintenance</span></td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } catch (err) {
                tableContainer.innerHTML = '<div style="padding: 20px; text-align: center;" class="text-danger">Failed to load maintenance list.</div>';
            }
        }
    }

    viewFilter.addEventListener('change', drawView);
    drawView();
}

async function openEquipmentModal(id = null) {
    const isEdit = id !== null;
    const isAdmin = state.user?.isAdmin;
    let equip = { type: '', model: '', currentStatus: 'Active' };
    if (isEdit) {
        equip = await apiFetch(`/Equipment/${id}`);
    }

    const formHtml = `
        <form id="equipment-form">
            <div class="form-group">
                <label for="e-type">Equipment Type</label>
                <input type="text" id="e-type" required placeholder="e.g. Tower Crane" value="${equip.type}" ${!isAdmin ? 'disabled' : ''}>
            </div>
            <div class="form-group">
                <label for="e-model">Model Reference</label>
                <input type="text" id="e-model" required placeholder="e.g. Liebherr 280" value="${equip.model}" ${!isAdmin ? 'disabled' : ''}>
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
// Assignments View
// ------------------------------------------
export async function renderAssignments(container) {
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;" class="text-secondary">Retrieving your personal assignments...</td></tr>';
        
        try {
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
    const [sites, labor, equipment] = await Promise.all([
        apiFetch('/Sites'),
        apiFetch('/Labor'),
        apiFetch('/Equipment')
    ]);

    const siteOptions = sites.map(s => `<option value="${s.siteId}">${s.name}</option>`).join('');
    const laborOptions = labor.map(l => `<option value="${l.workerId}">${l.name} (${l.tradeSpecialty || 'General'})</option>`).join('');
    const equipOptions = `<option value="">None (No machine assigned)</option>` + equipment.map(e => `<option value="${e.equipId}">${e.type} (${e.model}) - ${e.currentStatus}</option>`).join('');

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
        const dateVal = document.getElementById('as-date').value;
        const payload = {
            siteId: parseInt(document.getElementById('as-site').value),
            workerId: parseInt(document.getElementById('as-labor').value),
            equipId: equipVal ? parseInt(equipVal) : null,
            assignmentDate: dateVal
        };

        if (payload.equipId) {
            try {
                const isAssigned = await apiFetch(`/Assignments/check-availability?equipId=${payload.equipId}&date=${payload.assignmentDate}`);
                if (isAssigned) {
                    showToast('Equipment is already assigned on this date!', 'error');
                    return;
                }
            } catch (err) {
                // Proceed and let DB constraint handle it if API check errors out
            }
        }

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
// Analytics & Reports View (Charts using Chart.js)
// ------------------------------------------
export async function renderReports(container) {
    container.innerHTML = `
        <div class="card-section glass" style="margin-bottom: 24px; border-left: 4px solid var(--accent); background: rgba(245, 158, 11, 0.05); padding: 20px;">
            <div style="display: flex; gap: 16px; align-items: center;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--accent);"></i>
                <div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">System Notice: Analytics Modules Under Maintenance</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">Please note that the Analytics & Reports section is currently undergoing scheduled backend data migration and active system development. Some real-time charts may experience temporary refresh latencies.</p>
                </div>
            </div>
        </div>
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

    // Fetch data for charts in parallel
    const [costData, laborStats, equipment, maintFreq] = await Promise.all([
        apiFetch('/Queries/views/site-material-cost'),
        apiFetch('/Queries/samples/worker-assignment-counts'),
        apiFetch('/Equipment'),
        apiFetch('/Queries/samples/equipment-frequent-maintenance')
    ]);

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
            labels: topLabor.map(l => l.workerName.split(' ')[0]),
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
    const activeCount = equipment.filter(e => e.currentStatus === 'Active').length;
    const idleCount = equipment.filter(e => e.currentStatus === 'Idle').length;
    const maintCount = equipment.filter(e => e.currentStatus === 'Maintenance').length;

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
