// ==========================================
// Logistics & Finance View Module
// ==========================================
import { state, apiFetch, showToast, openModal, closeModal, renderActiveView } from '../app.js';

// ------------------------------------------
// Logistics & Materials View
// ------------------------------------------
export async function renderLogistics(container) {
    const [materials, usages, sites] = await Promise.all([
        apiFetch('/Materials'),
        apiFetch('/MaterialUsage'),
        apiFetch('/Sites')
    ]);
    const isAdmin = state.user?.isAdmin;

    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <select id="logistics-view-filter">
                    <option value="materials">Materials Fleet Stock</option>
                    <option value="usages">Material Usage Logs</option>
                </select>
                ${isAdmin ? `
                <select id="logistics-sort-filter" style="width: auto;">
                    <option value="default">Default Order (ID)</option>
                    <option value="cost">Sorted by Cost (High to Low)</option>
                </select>
                ` : ''}
            </div>
        </div>
        
        <div class="card-section glass">
            <div class="table-container" id="logistics-table-container">
                <!-- Injected by filter -->
            </div>
        </div>
    `;

    const viewFilter = document.getElementById('logistics-view-filter');
    const sortFilter = document.getElementById('logistics-sort-filter');
    const headerActionBtn = document.getElementById('header-action-btn');
    const tableContainer = document.getElementById('logistics-table-container');

    async function drawLogisticsView() {
        const mode = viewFilter.value;
        tableContainer.innerHTML = '';
        if (headerActionBtn) headerActionBtn.classList.add('hidden');
        
        if (mode === 'materials') {
            if (sortFilter) sortFilter.classList.remove('hidden');
            if (isAdmin && headerActionBtn) {
                headerActionBtn.classList.remove('hidden');
                headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Add Material</span>';
                headerActionBtn.onclick = () => openMaterialModal();
            }
            
            let materialsList = materials;
            if (sortFilter && sortFilter.value === 'cost') {
                tableContainer.innerHTML = '<div style="padding: 20px; text-align: center;" class="text-secondary"><i class="fa-solid fa-circle-notch fa-spin"></i> Sorting by cost...</div>';
                try {
                    materialsList = await apiFetch('/Queries/samples/materials-by-cost');
                } catch (err) {
                    materialsList = materials;
                }
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
            materialsList.forEach(m => {
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
            if (sortFilter) sortFilter.classList.add('hidden');
            if (isAdmin && headerActionBtn) {
                headerActionBtn.classList.remove('hidden');
                headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Record Usage</span>';
                headerActionBtn.onclick = () => openUsageModal();
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
    if (sortFilter) sortFilter.addEventListener('change', drawLogisticsView);
    drawLogisticsView();
}

// ------------------------------------------
// Material and Usage CRUD Modals
// ------------------------------------------
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
    const [sites, materials] = await Promise.all([
        apiFetch('/Sites'),
        apiFetch('/Materials')
    ]);

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
// Finance & Costs View
// ------------------------------------------
export async function renderFinance(container) {
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
    const maxCost = Math.max(...costs.map(c => c.totalMaterialCost), 0);

    costs.forEach(c => {
        const pctOfMax = maxCost > 0 ? Math.round((c.totalMaterialCost / maxCost) * 100) : 0;
        const pctOfTotal = totalSpend > 0 ? Math.round((c.totalMaterialCost / totalSpend) * 100) : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.siteName}</strong></td>
            <td><strong>$${c.totalMaterialCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
            <td>
                <div class="progress-bar-container" style="width: 320px;">
                    <div class="progress-meta">
                        <span>Relative Site Spend</span>
                        <span>
                            <strong>${pctOfMax}%</strong>
                            <span class="tooltip-container">
                                <i class="fa-solid fa-circle-info"></i>
                                <span class="tooltip-text">
                                    This site represents ${pctOfTotal}% of total spend ($${totalSpend.toLocaleString(undefined, {maximumFractionDigits: 0})}) and is at ${pctOfMax}% of peak site cost.
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
        tbody.appendChild(tr);
    });
}
