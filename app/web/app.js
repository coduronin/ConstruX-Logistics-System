// ==========================================
// ConstruX - Main Application Entry Point
// ==========================================

// Import View Renderers from Modules
import { renderDashboard } from './views/dashboard.js';
import { renderProjects } from './views/projects.js';
import { renderLogistics, renderFinance } from './views/logistics.js';
import { renderLabor, renderSafety } from './views/labor.js';
import { renderEquipment, renderAssignments, renderReports } from './views/equipment.js';

// API Base URL
const API_BASE = `http://${window.location.hostname}:5182/api`;

// Application State
export const state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    activeView: 'dashboard',
    renderedView: null,
    charts: {} // Keep references to active Chart.js instances to destroy/recreate them cleanly
};

// ==========================================
// Toast Notifications
// ==========================================
export function showToast(message, type = 'info') {
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
export async function apiFetch(endpoint, options = {}) {
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
        <a href="#" class="nav-link" data-view="equipment">
            <i class="fa-solid fa-screwdriver-wrench"></i>
            <span>Equipment & Fleet</span>
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
export function switchView(viewName) {
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.value = '';
    }
    const isAdmin = state.user?.isAdmin;
    const restrictedViews = ['logistics', 'finance', 'labor', 'safety', 'reports'];
    
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
    } else if (viewName === 'equipment') {
        document.getElementById('page-title').textContent = 'Equipment & Fleet';
        subtitle.textContent = 'Monitor heavy machinery statuses and maintenance records';
        if (isAdmin) {
            headerActionBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Add Equipment</span>';
            headerActionBtn.classList.remove('hidden');
        } else {
            headerActionBtn.classList.add('hidden');
        }
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
// View Renderers (delegates to modules)
// ==========================================
export async function renderActiveView() {
    const container = document.getElementById('view-workspace');
    
    // Only show the loading spinner if we are switching to a different view.
    // If we are refreshing the same view, update in-place to prevent jarring visual blinks.
    const isRefresh = state.renderedView === state.activeView;
    if (!isRefresh || !container.innerHTML.trim() || container.querySelector('.error-container')) {
        container.innerHTML = '<div class="loader-container"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>';
    }
    
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
        state.renderedView = state.activeView;
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

// ==========================================
// MODAL CONTROLLER
// ==========================================
export function openModal(title, formHtml, onSubmit) {
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

export function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
}

// ==========================================
// NOTIFICATIONS SYSTEM
// ==========================================
let notifications = [
    { id: 1, text: 'Welcome to ConstruX portal! Click to explore your active dashboard.', icon: 'fa-info-circle', type: 'info', time: 'Just now' },
    { id: 2, text: 'New concrete usage recorded for site Marmara Vadi Konakları.', icon: 'fa-circle-check', type: 'success', time: '10 mins ago' },
    { id: 3, text: 'Safety Auditor marked Bodrum Marina site as 100% compliant.', icon: 'fa-shield-halved', type: 'success', time: '1 hour ago' }
];

function renderNotifications() {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-badge');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `<div class="notification-empty">No new notifications.</div>`;
        if (badge) badge.classList.add('hidden');
    } else {
        if (badge) {
            badge.classList.remove('hidden');
            badge.textContent = notifications.length;
        }
        list.innerHTML = notifications.map(n => `
            <div class="notification-item" data-id="${n.id}">
                <div class="notification-icon ${n.type}">
                    <i class="fa-solid ${n.icon}"></i>
                </div>
                <div class="notification-info">
                    <p>${n.text}</p>
                    <span>${n.time}</span>
                </div>
            </div>
        `).join('');
    }
}

// ==========================================
// APP INITIALIZATION
// ==========================================
function init() {
    // Render Notifications Initially
    renderNotifications();

    // Toggle Notifications Dropdown
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('hidden');
        });
        
        // Hide dropdown when clicking anywhere outside
        document.addEventListener('click', (e) => {
            if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn && !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.add('hidden');
            }
        });
    }

    // Clear Notifications
    const clearNotificationsBtn = document.getElementById('btn-clear-notifications');
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifications = [];
            renderNotifications();
            showToast('All notifications cleared.', 'success');
        });
    }

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

    // Global Search event listener - sync with active view filters
    document.getElementById('global-search').addEventListener('input', (e) => {
        const query = e.target.value;
        const activeSearchInputs = ['project-filter-search', 'labor-filter-search'];
        activeSearchInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = query;
                input.dispatchEvent(new Event('input'));
            }
        });
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
