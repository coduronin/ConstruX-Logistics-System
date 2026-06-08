// ==========================================
// Projects View Module
// ==========================================
import { state, apiFetch, showToast, openModal, closeModal, renderActiveView } from '../app.js';

// ------------------------------------------
// Project Management View (CRUD for Admin)
// ------------------------------------------
export async function renderProjects(container) {
    const sites = await apiFetch('/Sites');
    const isAdmin = state.user?.isAdmin;
    
    container.innerHTML = `
        <div class="list-actions">
            <div class="list-filters">
                <div class="search-bar glass" style="width: 260px; display: none;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="project-filter-search" placeholder="Filter by name...">
                </div>
            </div>
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
                        <button class="view-crew-btn" data-name="${s.name}" title="View Site Crew" style="color: var(--accent);"><i class="fa-solid fa-users"></i></button>
                        <button class="edit-row-btn" data-id="${s.siteId}" title="Edit Project"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="delete-row-btn" data-id="${s.siteId}" title="Delete Project"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>` : ''}
            `;
            tbody.appendChild(tr);
        });

        // Attach action handlers
        if (isAdmin) {
            tbody.querySelectorAll('.view-crew-btn').forEach(btn => {
                btn.addEventListener('click', () => openProjectCrewModal(btn.getAttribute('data-name')));
            });
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
        const val = e.target.value;
        const globalSearch = document.getElementById('global-search');
        if (globalSearch && globalSearch.value !== val) {
            globalSearch.value = val;
        }
        populateTable(val.trim());
    });

    if (isAdmin) {
        const topHeaderBtn = document.getElementById('header-action-btn');
        if (topHeaderBtn) {
            topHeaderBtn.onclick = () => openProjectModal();
        }
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

async function openProjectCrewModal(siteName) {
    openModal(`Site Crew: ${siteName}`, `<div style="text-align: center; padding: 24px; color: var(--text-secondary);"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--accent); margin-bottom: 12px;"></i><br>Loading crew roster...</div>`, () => {});
    
    try {
        const crew = await apiFetch(`/Queries/samples/workers-by-site?siteName=${encodeURIComponent(siteName)}`);
        
        let crewHtml = '';
        if (crew.length === 0) {
            crewHtml = `<div style="padding: 24px; text-align: center;" class="text-secondary">No workers currently assigned to this project site.</div>`;
        } else {
            crewHtml = `
                <div style="max-height: 350px; overflow-y: auto; margin-bottom: 20px;">
                    <table class="responsive-table">
                        <thead>
                            <tr>
                                <th>Worker Name</th>
                                <th>Specialty</th>
                                <th>Assignment Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${crew.map(c => `
                                <tr>
                                    <td><strong>${c.workerName}</strong></td>
                                    <td>${c.tradeSpecialty || 'General Crew'}</td>
                                    <td><small class="text-secondary">${c.assignmentDate || 'N/A'}</small></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        const contentHtml = `
            ${crewHtml}
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="btn-secondary" id="btn-close-crew-modal">Close</button>
            </div>
        `;
        
        openModal(`Site Crew: ${siteName}`, contentHtml, (e) => { e.preventDefault(); });
        document.getElementById('btn-close-crew-modal').onclick = closeModal;
    } catch (err) {
        openModal(`Site Crew: ${siteName}`, `<div class="text-danger" style="padding: 20px; text-align: center;">Failed to load crew assignments. Please try again.</div>`, (e) => { e.preventDefault(); });
    }
}
