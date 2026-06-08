// ==========================================
// Labor & Safety View Module
// ==========================================
import { state, apiFetch, showToast, openModal, closeModal, renderActiveView } from '../app.js';

// ------------------------------------------
// Labor & HR View (Admin CRUD / Worker Profile)
// ------------------------------------------
export async function renderLabor(container) {
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
                <div class="search-bar glass" style="width: 260px; display: none;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="labor-filter-search" placeholder="Search by name...">
                </div>
            </div>
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
        const val = e.target.value;
        const globalSearch = document.getElementById('global-search');
        if (globalSearch && globalSearch.value !== val) {
            globalSearch.value = val;
        }
        populateLabor(val.trim());
    });

    if (isAdmin) {
        const topHeaderBtn = document.getElementById('header-action-btn');
        if (topHeaderBtn) {
            topHeaderBtn.onclick = () => openLaborModal();
        }
    }
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
// Safety & Compliance View
// ------------------------------------------
export async function renderSafety(container) {
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
