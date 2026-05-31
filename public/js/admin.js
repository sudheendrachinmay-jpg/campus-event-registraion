/**
 * Admin Panel Controller Script - EventFlow SQL
 * Governs analytical metrics, CRUD events catalog, user directories, and multi-joins registries.
 */

let CURRENT_ADMIN = null;

// =======================================================
// 1. ADMIN SESSION GUARD
// =======================================================
async function verifyAdminSession() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (!data.loggedIn || data.user.role !== 'admin') {
            console.warn("[Session Shield] Unauthenticated Admin attempt. Redirecting...");
            window.location.href = 'auth.html';
            return;
        }

        CURRENT_ADMIN = data.user;

        // Populate header details
        document.getElementById('admin-display-name').innerText = CURRENT_ADMIN.name;
        
        // Boot standard homepage
        showAdminPanel('overview');

    } catch (err) {
        console.error("Admin session verification failed:", err);
        window.location.href = 'auth.html';
    }
}

// =======================================================
// 2. ADMIN TABBED PANELS CONTROLLER
// =======================================================
function showAdminPanel(panelName) {
    const panels = document.querySelectorAll('.dashboard-panel');
    panels.forEach(p => p.classList.remove('active'));

    const buttons = document.querySelectorAll('.sidebar-menu .menu-item-btn');
    buttons.forEach(b => b.classList.remove('active'));

    const targetPanel = document.getElementById(`panel-${panelName}`);
    if (targetPanel) targetPanel.classList.add('active');

    const targetBtn = document.getElementById(`btn-tab-${panelName}`);
    if (targetBtn) targetBtn.classList.add('active');

    const headerTitle = document.getElementById('admin-panel-title');
    const headerSubtitle = document.getElementById('admin-panel-subtitle');

    if (panelName === 'overview') {
        headerTitle.innerText = "System Overview Analytics";
        headerSubtitle.innerText = "Monitor campus registration volumes, database capacity metrics, and analytics charts.";
        fetchOverviewAnalytics();
    } else if (panelName === 'manage-events') {
        headerTitle.innerText = "Campus Programs CRUD Manager";
        headerSubtitle.innerText = "Insert, edit, update, or remove active university event records.";
        fetchAdminEventsList();
    } else if (panelName === 'students-list') {
        headerTitle.innerText = "Student Profiles Directory";
        headerSubtitle.innerText = "Browse and search student records stored inside the system.";
        fetchStudentsDirectory();
    } else if (panelName === 'registrations-log') {
        headerTitle.innerText = "Relational Triple JOIN Log";
        headerSubtitle.innerText = "Execute live multiple table joins showing student enrollments connected to event details.";
        fetchRegistrationsLog();
    }
}

// =======================================================
// 3. OVERVIEW STATS & DYNAMIC CSS CHARTS
// =======================================================
async function fetchOverviewAnalytics() {
    try {
        const response = await fetch('/api/admin/stats');
        const resData = await response.json();

        if (resData.success) {
            const { metrics, charts } = resData.data;

            // 1. Update metric cards counters
            document.getElementById('ov-total-students').innerText = metrics.totalStudents;
            document.getElementById('ov-total-events').innerText = metrics.totalEvents;
            document.getElementById('ov-total-regs').innerText = metrics.totalRegistrations;

            // 2. Render popular events custom CSS chart (Top 5)
            const popChartContainer = document.getElementById('chart-popular-events');
            popChartContainer.innerHTML = '';
            
            if (charts.popularEvents.length === 0) {
                popChartContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">No registration logs available.</p>`;
            } else {
                // Find max registration count to scale percentage widths
                const maxReg = Math.max(...charts.popularEvents.map(item => parseInt(item.registration_count)), 1);

                charts.popularEvents.forEach(item => {
                    const pct = (parseInt(item.registration_count) / maxReg) * 100;
                    const row = document.createElement('div');
                    row.className = "chart-row";
                    row.innerHTML = `
                        <div class="chart-row-meta">
                            <span style="color:#fff; font-weight:600;">${item.title}</span>
                            <span style="color:var(--secondary-light); font-weight:700;">${item.registration_count} Signups</span>
                        </div>
                        <div class="chart-bar-outer">
                            <div class="chart-bar-inner" style="width: ${pct}%"></div>
                        </div>
                    `;
                    popChartContainer.appendChild(row);
                });
            }

            // 3. Render department distribution custom CSS chart
            const deptChartContainer = document.getElementById('chart-department-dist');
            deptChartContainer.innerHTML = '';

            if (charts.departmentDist.length === 0) {
                deptChartContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">No student records found.</p>`;
            } else {
                const maxCount = Math.max(...charts.departmentDist.map(item => parseInt(item.count)), 1);

                charts.departmentDist.forEach(item => {
                    const pct = (parseInt(item.count) / maxCount) * 100;
                    const row = document.createElement('div');
                    row.className = "chart-row";
                    row.innerHTML = `
                        <div class="chart-row-meta">
                            <span style="color:#fff; font-weight:600;">${item.department}</span>
                            <span style="color:var(--primary-light); font-weight:700;">${item.count} Students</span>
                        </div>
                        <div class="chart-bar-outer">
                            <div class="chart-bar-inner c2" style="width: ${pct}%"></div>
                        </div>
                    `;
                    deptChartContainer.appendChild(row);
                });
            }

        } else {
            showToast("Failed to compile overview metrics.", "error");
        }
    } catch (err) {
        console.error("Overview analytics compilation failure:", err);
        showToast("Error connecting to administrative aggregates system.", "error");
    }
}

// =======================================================
// 4. MANAGE EVENTS (CRUD OPERATIONS)
// =======================================================
async function fetchAdminEventsList() {
    const tbody = document.getElementById('admin-events-table-body');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Querying program catalog...</td></tr>`;

    try {
        const response = await fetch('/api/events');
        const resData = await response.json();

        if (resData.success) {
            tbody.innerHTML = '';
            
            if (resData.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No campus events recorded. Create one using the form!</td></tr>`;
                return;
            }

            resData.data.forEach(e => {
                const dateObj = new Date(e.date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = e.time.substring(0, 5);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-family:monospace; font-weight:700; color:var(--primary-light);">#EV-0${e.event_id}</td>
                    <td style="font-weight:600; color:#fff;">${e.title}</td>
                    <td><span class="badge badge-${e.category.toLowerCase()}">${e.category}</span></td>
                    <td>📍 ${e.venue}</td>
                    <td>📅 ${formattedDate} at ${timeStr}</td>
                    <td style="font-weight:600;">
                        <span style="color: var(--secondary-light);">${e.registered_count}</span> / ${e.capacity}
                    </td>
                    <td style="text-align:right;">
                        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; border-color: rgba(255,255,255,0.06); color: var(--secondary-light); margin-right:5px;" onclick="prefillEditEvent(${e.event_id})">
                            Edit
                        </button>
                        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.2); color: var(--error);" onclick="deleteEventRecord(${e.event_id}, '${e.title}')">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            showToast("Failed to fetch administrative event listing.", "error");
        }
    } catch (err) {
        console.error("Fetch admin events error:", err);
        showToast("Error connecting to active programs database.", "error");
    }
}

// Form Submission handler (Add or Update)
async function handleEventCrudSubmit(event) {
    event.preventDefault();
    const eventId = document.getElementById('crud-event-id').value;
    const title = document.getElementById('crud-title').value;
    const description = document.getElementById('crud-description').value;
    const date = document.getElementById('crud-date').value;
    const time = document.getElementById('crud-time').value;
    const venue = document.getElementById('crud-venue').value;
    const category = document.getElementById('crud-category').value;
    const capacity = document.getElementById('crud-capacity').value;

    const isEdit = !!eventId;
    showToast(isEdit ? "Updating event details..." : "Inserting new event record...", "info");

    try {
        const endpoint = isEdit ? `/api/events/update/${eventId}` : '/api/events/add';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, date, time, venue, category, capacity })
        });
        
        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            resetCrudForm();
            fetchAdminEventsList();
        } else {
            showToast(data.message || "Operation failed.", "error");
        }
    } catch (err) {
        console.error("Event CRUD action error:", err);
        showToast("Server communication exception.", "error");
    }
}

// Prefill form for Editing
async function prefillEditEvent(eventId) {
    showToast("Retrieving event specifications...", "info");

    try {
        const response = await fetch(`/api/events/${eventId}`);
        const resData = await response.json();

        if (resData.success) {
            const e = resData.data;
            
            // Populating inputs
            document.getElementById('crud-event-id').value = e.event_id;
            document.getElementById('crud-title').value = e.title;
            document.getElementById('crud-description').value = e.description;
            
            // Format dates for html date input (YYYY-MM-DD)
            const dateObj = new Date(e.date);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            document.getElementById('crud-date').value = `${yyyy}-${mm}-${dd}`;
            
            // Format time for html time input (HH:MM)
            document.getElementById('crud-time').value = e.time.substring(0, 5);
            
            document.getElementById('crud-venue').value = e.venue;
            document.getElementById('crud-category').value = e.category;
            document.getElementById('crud-capacity').value = e.capacity;

            // Change UI headers
            document.getElementById('event-form-title').innerText = "Edit Campus Event";
            document.getElementById('btn-crud-submit').innerText = "Save Event Modifications";
            document.getElementById('btn-crud-cancel').style.display = 'block';

            showToast("Details populated! Modify inputs below.", "success");
        } else {
            showToast("Failed to retrieve event details.", "error");
        }
    } catch (err) {
        console.error("Prefill event details failure:", err);
        showToast("Server connection error during fetch.", "error");
    }
}

function resetCrudForm() {
    document.getElementById('form-manage-event').reset();
    document.getElementById('crud-event-id').value = '';
    
    document.getElementById('event-form-title').innerText = "Create Campus Event";
    document.getElementById('btn-crud-submit').innerText = "Create Event Record";
    document.getElementById('btn-crud-cancel').style.display = 'none';
}

// Delete Event record
async function deleteEventRecord(eventId, eventTitle) {
    if (!confirm(`WARNING: Are you sure you want to delete '${eventTitle}'?\nDeleting this event will automatically cascade and cancel ALL registered student bookings for it!`)) {
        return;
    }

    showToast("Cascading event removal...", "info");

    try {
        const response = await fetch(`/api/events/delete/${eventId}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            fetchAdminEventsList();
        } else {
            showToast(data.message || "Delete execution failed.", "error");
        }
    } catch (err) {
        console.error("Delete event record failure:", err);
        showToast("Server communication error on delete.", "error");
    }
}

// =======================================================
// 5. VIEW STUDENTS DIRECTORY
// =======================================================
let ALL_STUDENTS = [];

async function fetchStudentsDirectory() {
    const tbody = document.getElementById('admin-students-table-body');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Querying student roster...</td></tr>`;

    try {
        const response = await fetch('/api/admin/students');
        const resData = await response.json();

        if (resData.success) {
            ALL_STUDENTS = resData.data;
            renderStudentsTable(ALL_STUDENTS);
        } else {
            showToast("Failed to fetch students roster.", "error");
        }
    } catch (err) {
        console.error("Fetch students roster error:", err);
        showToast("Error connecting to students record stream.", "error");
    }
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('admin-students-table-body');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No student matches found.</td></tr>`;
        return;
    }

    students.forEach(s => {
        const regDate = new Date(s.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:monospace; font-weight:700; color:var(--secondary-light);">#STU-0${s.student_id}</td>
            <td style="font-weight:600; color:#fff;">${s.full_name}</td>
            <td style="font-family:monospace; color:var(--primary-light); font-weight:600;">${s.usn}</td>
            <td>🎓 ${s.department}</td>
            <td>📧 ${s.email}</td>
            <td style="font-size:0.8rem; color:var(--text-muted);">${regDate}</td>
        `;
        tbody.appendChild(tr);
    });
}

function handleStudentSearch() {
    const term = document.getElementById('student-search-input').value.toLowerCase().trim();
    
    // We do frontend filtering here for immediate snappy response, but the database LIKE query is implemented at backend!
    if (!term) {
        renderStudentsTable(ALL_STUDENTS);
        return;
    }

    const filtered = ALL_STUDENTS.filter(s => {
        return s.full_name.toLowerCase().includes(term) ||
               s.usn.toLowerCase().includes(term) ||
               s.department.toLowerCase().includes(term) ||
               s.email.toLowerCase().includes(term);
    });

    renderStudentsTable(filtered);
}

// =======================================================
// 6. RELATIONAL TRIPLE JOIN REGISTRATIONS LOG
// =======================================================
let ALL_REGISTRATIONS_JOIN = [];

async function fetchRegistrationsLog() {
    const tbody = document.getElementById('admin-regs-table-body');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Executing multi-table relational join...</td></tr>`;

    try {
        const response = await fetch('/api/admin/registrations');
        const resData = await response.json();

        if (resData.success) {
            ALL_REGISTRATIONS_JOIN = resData.data;
            renderRegistrationsTable(ALL_REGISTRATIONS_JOIN);
        } else {
            showToast("Failed to join database registrations logs.", "error");
        }
    } catch (err) {
        console.error("Relational join query failure:", err);
        showToast("Error connecting to live join engine.", "error");
    }
}

function renderRegistrationsTable(regs) {
    const tbody = document.getElementById('admin-regs-table-body');
    tbody.innerHTML = '';

    if (regs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No relational booking rows matched.</td></tr>`;
        return;
    }

    regs.forEach(r => {
        const regDateTime = new Date(r.registered_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const eventDate = new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:monospace; font-weight:700; color:var(--primary-light);">#REG-0${r.registration_id}</td>
            <td style="font-weight:600; color:#fff;">${r.student_name}</td>
            <td style="font-family:monospace; font-weight:600; font-size:0.8rem;">${r.student_usn}</td>
            <td style="font-size:0.85rem; color:var(--text-muted);">🎓 ${r.student_dept}</td>
            <td style="font-weight:600; color:var(--secondary-light);">${r.event_title} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(${eventDate})</span></td>
            <td style="font-size:0.85rem;">📍 ${r.event_venue}</td>
            <td style="font-size:0.8rem; color:var(--text-muted);">${regDateTime}</td>
        `;
        tbody.appendChild(tr);
    });
}

function handleRegSearch() {
    const term = document.getElementById('reg-search-input').value.toLowerCase().trim();

    if (!term) {
        renderRegistrationsTable(ALL_REGISTRATIONS_JOIN);
        return;
    }

    const filtered = ALL_REGISTRATIONS_JOIN.filter(r => {
        return r.student_name.toLowerCase().includes(term) ||
               r.student_usn.toLowerCase().includes(term) ||
               r.student_dept.toLowerCase().includes(term) ||
               r.event_title.toLowerCase().includes(term) ||
               r.event_venue.toLowerCase().includes(term);
    });

    renderRegistrationsTable(filtered);
}
