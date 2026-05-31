/**
 * Core Frontend Script - EventFlow SQL (Student Portal)
 * Manages Toast Notifications, Session checking, Tabbed Panels, and Student Actions.
 */

let CURRENT_USER = null;

// =======================================================
// 1. TOAST NOTIFICATION UTILITY
// =======================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Select emoji as lightweight icon
    let emoji = 'ℹ️';
    if (type === 'success') emoji = '⚡';
    if (type === 'error') emoji = '⚠️';
    if (type === 'info') emoji = '📡';

    toast.innerHTML = `
        <div class="toast-icon" style="font-size: 1.1rem;">${emoji}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Fade out and remove toast after 4.5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 350);
    }, 4500);
}

// =======================================================
// 2. SESSION SECURITY CHECK (STUDENT PORTAL)
// =======================================================
async function verifyUserSession() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (!data.loggedIn || data.user.role !== 'student') {
            console.warn("[Session Shield] Unauthenticated student attempt. Redirecting...");
            window.location.href = 'auth.html';
            return;
        }

        CURRENT_USER = data.user;
        
        // Update profile text
        document.getElementById('user-display-name').innerText = CURRENT_USER.name;
        document.getElementById('user-avatar').innerText = CURRENT_USER.name.charAt(0).toUpperCase();
        document.getElementById('welcome-name').innerText = CURRENT_USER.name;

        // Populate details section
        document.getElementById('profile-id').innerText = `#STU-0${CURRENT_USER.id}`;
        document.getElementById('profile-roll').innerText = CURRENT_USER.usn;
        document.getElementById('profile-email').innerText = CURRENT_USER.email;

        // In home stats
        document.getElementById('metrics-my-dept').innerText = CURRENT_USER.department;

        // Pull active DB logs immediately
        fetchStudentDashboardData();

    } catch (err) {
        console.error("Session verification failure:", err);
        window.location.href = 'auth.html';
    }
}

// =======================================================
// 3. TABBED PANELS CONTROLLER
// =======================================================
function showDashboardPanel(panelName) {
    // Hide all panels
    const panels = document.querySelectorAll('.dashboard-panel');
    panels.forEach(p => p.classList.remove('active'));

    // Deactivate all sidebar buttons
    const buttons = document.querySelectorAll('.sidebar-menu .menu-item-btn');
    buttons.forEach(b => b.classList.remove('active'));

    // Show selected panel
    const targetPanel = document.getElementById(`panel-${panelName}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    // Activate corresponding sidebar button
    const targetBtn = document.getElementById(`btn-tab-${panelName}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // Update headers dynamically
    const headerTitle = document.getElementById('dash-panel-title');
    const headerSubtitle = document.getElementById('dash-panel-subtitle');

    if (panelName === 'home') {
        headerTitle.innerText = "Student Portal Hub";
        headerSubtitle.innerText = "Access student utilities, profile details, and active logs.";
        fetchStudentDashboardData(); // Refresh overview numbers
    } else if (panelName === 'events') {
        headerTitle.innerText = "Campus Events Catalog";
        headerSubtitle.innerText = "Browse live events and register before capacities are filled.";
        fetchEvents();
    } else if (panelName === 'registrations') {
        headerTitle.innerText = "My Registration Records";
        headerSubtitle.innerText = "Review details of events you have registered to attend.";
        fetchMyRegistrations();
    }
}

// =======================================================
// 4. BROWSE & SEARCH EVENTS ENGINE
// =======================================================
let ALL_EVENTS = [];

async function fetchEvents() {
    const grid = document.getElementById('events-grid-container');
    const loader = document.getElementById('events-loader');

    loader.style.display = 'flex';
    grid.style.display = 'none';

    try {
        const response = await fetch('/api/events');
        const resData = await response.json();

        if (resData.success) {
            ALL_EVENTS = resData.data;
            renderEventsGrid(ALL_EVENTS);
        } else {
            showToast("Failed to fetch events catalog.", "error");
        }
    } catch (err) {
        console.error("Fetch events error:", err);
        showToast("Error connecting to events server.", "error");
    } finally {
        loader.style.display = 'none';
        grid.style.display = 'grid';
    }
}

function renderEventsGrid(events) {
    const grid = document.getElementById('events-grid-container');
    grid.innerHTML = '';

    if (events.length === 0) {
        grid.innerHTML = `
            <div class="glass-panel" style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">
                <h4>No Events Found</h4>
                <p style="font-size: 0.85rem; margin-top: 5px;">No active events match your current filter query.</p>
            </div>
        `;
        return;
    }

    events.forEach(e => {
        const seatsLeft = e.capacity - e.registered_count;
        const isFull = seatsLeft <= 0;
        const catClass = `badge-${e.category.toLowerCase()}`;

        // Build elegant Action Button depending on student status and seat capacity
        let actionBtnHtml = '';
        if (e.is_registered) {
            actionBtnHtml = `<button class="btn btn-danger" style="width: 100%; font-size: 0.85rem;" onclick="cancelRegistration(${e.event_id}, '${e.title}')">Cancel Registration</button>`;
        } else if (isFull) {
            actionBtnHtml = `<button class="btn btn-outline" style="width: 100%; font-size: 0.85rem; cursor: not-allowed; opacity: 0.6;" disabled>Fully Booked (0 Seats)</button>`;
        } else {
            actionBtnHtml = `<button class="btn btn-primary" style="width: 100%; font-size: 0.85rem;" onclick="registerForEvent(${e.event_id}, '${e.title}')">Register Now</button>`;
        }

        // Format Date beautifully
        const dateObj = new Date(e.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        
        // Clean Time format
        const formattedTime = e.time.substring(0, 5); // Take HH:MM from HH:MM:SS

        const card = document.createElement('div');
        card.className = "event-card glass-panel";
        card.innerHTML = `
            <div>
                <div class="event-card-header">
                    <span class="badge ${catClass}">${e.category}</span>
                    <span class="badge" style="background: rgba(255,255,255,0.03); color: var(--text-muted);">ID: #0${e.event_id}</span>
                </div>
                <div class="event-card-body">
                    <h3 class="event-card-title">${e.title}</h3>
                    <p class="event-card-desc">${e.description || 'No description provided.'}</p>
                    <div class="event-card-details">
                        <div class="event-detail-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                            <span>${formattedDate} at ${formattedTime}</span>
                        </div>
                        <div class="event-detail-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>${e.venue}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div class="event-card-footer">
                    <span class="event-seats-left ${isFull ? 'full' : 'available'}">
                        ${isFull ? 'Seats Full' : `${seatsLeft} of ${e.capacity} Seats Left`}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${e.registered_count} Booked</span>
                </div>
                <div style="padding: 0 24px 24px 24px;">
                    ${actionBtnHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function handleEventSearch() {
    const term = document.getElementById('event-search-input').value.toLowerCase().trim();
    if (!term) {
        renderEventsGrid(ALL_EVENTS);
        return;
    }

    const filtered = ALL_EVENTS.filter(e => {
        return e.title.toLowerCase().includes(term) ||
               e.venue.toLowerCase().includes(term) ||
               e.category.toLowerCase().includes(term) ||
               (e.description && e.description.toLowerCase().includes(term));
    });

    renderEventsGrid(filtered);
}

// =======================================================
// 5. REGISTRATIONS & CANCELLATIONS ACTIONS
// =======================================================
async function registerForEvent(eventId, eventTitle) {
    showToast(`Submitting registration for ${eventTitle}...`, "info");

    try {
        const response = await fetch('/api/events/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId })
        });
        
        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            // Refresh current panel views
            fetchEvents();
        } else {
            showToast(data.message || "Registration failed.", "error");
        }
    } catch (err) {
        console.error("Register event error:", err);
        showToast("Server connection error during registration.", "error");
    }
}

async function cancelRegistration(eventId, eventTitle) {
    if (!confirm(`Are you sure you want to cancel your registration for '${eventTitle}'?`)) {
        return;
    }

    showToast("Cancelling registration record...", "info");

    try {
        const response = await fetch('/api/events/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId })
        });
        
        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            // Refresh views depending on what active panel is open
            const activePanel = document.querySelector('.dashboard-panel.active').id;
            if (activePanel === 'panel-events') {
                fetchEvents();
            } else if (activePanel === 'panel-registrations') {
                fetchMyRegistrations();
            }
        } else {
            showToast(data.message || "Cancellation failed.", "error");
        }
    } catch (err) {
        console.error("Cancel registration error:", err);
        showToast("Server connection error during cancellation.", "error");
    }
}

async function fetchMyRegistrations() {
    const loader = document.getElementById('regs-loader');
    const tableContainer = document.getElementById('regs-table-container');
    const emptyState = document.getElementById('regs-empty-state');
    const tbody = document.getElementById('regs-table-body');

    loader.style.display = 'flex';
    tableContainer.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        const response = await fetch('/api/events/my-registrations');
        const resData = await response.json();

        if (resData.success) {
            const regs = resData.data;
            tbody.innerHTML = '';

            if (regs.length === 0) {
                emptyState.style.display = 'block';
            } else {
                regs.forEach(r => {
                    const dateObj = new Date(r.date);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    const timeStr = r.time.substring(0, 5);

                    // Registration Timestamp
                    const regTimestamp = new Date(r.registered_at).toLocaleString();

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-family: monospace; font-weight:600; color:var(--primary-light);">#REG-0${r.registration_id}</td>
                        <td style="font-weight: 600; color: #fff;">${r.title}</td>
                        <td>📅 ${formattedDate} at ${timeStr}</td>
                        <td>📍 ${r.venue}</td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);">${regTimestamp}</td>
                        <td style="text-align: right;">
                            <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.4); color: var(--error);" onclick="cancelRegistration(${r.event_id}, '${r.title}')">
                                Cancel signup
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                tableContainer.style.display = 'block';
            }
        } else {
            showToast("Failed to compile registration history.", "error");
        }
    } catch (err) {
        console.error("Fetch registrations logs error:", err);
        showToast("Error communicating with active logging stream.", "error");
    } finally {
        loader.style.display = 'none';
    }
}

// =======================================================
// 6. DASHBOARD METRICS LOADER (PANEL A DATA)
// =======================================================
async function fetchStudentDashboardData() {
    try {
        // Fetch registrations list length for counter
        const regRes = await fetch('/api/events/my-registrations');
        const regData = await regRes.json();
        
        const eventRes = await fetch('/api/events');
        const eventData = await eventRes.json();

        if (regData.success && eventData.success) {
            document.getElementById('metrics-my-regs').innerText = regData.data.length;
            document.getElementById('metrics-total-events').innerText = eventData.data.length;
        }
    } catch (err) {
        console.error("Failed to compile homepage metrics:", err);
    }
}

// =======================================================
// 7. GLOBAL LOGOUT UTILITY
// =======================================================
async function handleLogout() {
    if (!confirm("Are you sure you want to sign out of the system?")) {
        return;
    }

    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            showToast("Session closed successfully! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showToast("Failed to log out. Try closing your browser.", "error");
        }
    } catch (err) {
        console.error("Logout failure:", err);
        window.location.href = 'index.html';
    }
}
