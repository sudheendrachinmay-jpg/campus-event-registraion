/**
 * DBMS Live Console Playground Controller Script - EventFlow SQL
 * Manages SQL preset injection, line-by-line viva query breakdowns, and playground execution.
 */

let PRESET_MAP = {};

// =======================================================
// 1. CONSOLE SEEDING & TAB INITIALIZATION
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    // Fetch presets from API once user is authenticated inside dashboard
    const checkInterval = setInterval(() => {
        if (CURRENT_USER) {
            clearInterval(checkInterval);
            fetchPresetsList();
        }
    }, 200);
});

async function fetchPresetsList() {
    try {
        const response = await fetch('/api/queries/presets');
        const data = await response.json();

        if (data.success) {
            renderPresetsLeftPanel(data.presets);
            
            // Map presets by ID for easy click references
            data.presets.forEach(p => {
                PRESET_MAP[p.id] = p;
            });

            // Automatically select the first preset query as default on startup!
            if (data.presets.length > 0) {
                selectPresetQuery(data.presets[0].id);
            }
        }
    } catch (err) {
        console.error("Presets load error:", err);
        showToast("Error loading DBMS preset queries directory.", "error");
    }
}

function renderPresetsLeftPanel(presets) {
    const container = document.getElementById('presets-container');
    if (!container) return;
    
    container.innerHTML = '';

    presets.forEach(p => {
        const card = document.createElement('div');
        card.className = "preset-query-card glass-panel";
        card.id = `preset-card-${p.id}`;
        card.onclick = () => selectPresetQuery(p.id);
        
        card.innerHTML = `
            <div class="preset-card-title">${p.name}</div>
            <div class="preset-card-meta">
                <span class="badge" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(0,206,209,0.1); color: var(--secondary-light); border:none;">${p.category}</span>
                <span>Active Table</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// =======================================================
// 2. TEXTEDITOR INJECTOR & VIVA ADVISOR
// =======================================================
let ACTIVE_PRESET_ID = null;

function selectPresetQuery(presetId) {
    const preset = PRESET_MAP[presetId];
    if (!preset) return;

    ACTIVE_PRESET_ID = presetId;

    // Toggle active state classes in left panel
    const cards = document.querySelectorAll('.preset-query-card');
    cards.forEach(c => c.classList.remove('active'));

    const selectedCard = document.getElementById(`preset-card-${presetId}`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }

    // Inject SQL query into the terminal textarea editor
    const textarea = document.getElementById('sql-console-editor');
    if (textarea) {
        textarea.value = preset.sql;
    }

    // Load academic line-by-line explanations
    const explanationBox = document.getElementById('query-explanation-box');
    const explanationList = document.getElementById('explanation-list-items');
    
    if (explanationBox && explanationList) {
        explanationList.innerHTML = '';
        preset.vivaExplanation.forEach(line => {
            const li = document.createElement('li');
            li.innerHTML = line.replace(/(PURPOSE:|INNER JOIN:|LEFT JOIN:|WHERE CLAUSE:|ORDER BY:|GROUP BY:|HAVING CLAUSE:|NESTED QUERY:|NOT IN OPERATOR:|CORRELATED SUBQUERY:|COMPARISON OPERATOR:|VIVA TIP:|RELATIONAL CONCEPT:|LIKE OPERATOR & WILDCARDS \(%\):)/g, 
                '<strong style="color: #fff;">$1</strong>');
            explanationList.appendChild(li);
        });
        explanationBox.style.display = 'block';
    }

    // Reset console results display
    hideResultsContainers();
}

function clearSqlConsole() {
    const textarea = document.getElementById('sql-console-editor');
    if (textarea) {
        textarea.value = '';
    }
    
    // Clear preset highlighting
    const cards = document.querySelectorAll('.preset-query-card');
    cards.forEach(c => c.classList.remove('active'));
    ACTIVE_PRESET_ID = null;

    // Hide explanations and results
    document.getElementById('query-explanation-box').style.display = 'none';
    hideResultsContainers();
    showToast("SQL Editor cleared.", "info");
}

function hideResultsContainers() {
    document.getElementById('results-table-container').style.display = 'none';
    document.getElementById('results-count-badge').style.display = 'none';
    document.getElementById('results-empty-state').style.display = 'block';
    document.getElementById('results-empty-state').innerHTML = `Enter/Select a query and click "Run SQL Query" to view relational tables here.`;
    document.getElementById('results-empty-state').style.borderColor = 'var(--border-glass)';
    document.getElementById('results-empty-state').style.color = 'var(--text-muted)';
}

// =======================================================
// 3. SECURE PLAYGROUND SQL EXECUTOR
// =======================================================
async function runConsoleQuery() {
    const textarea = document.getElementById('sql-console-editor');
    const sqlQuery = textarea.value.trim();

    if (!sqlQuery) {
        showToast("Please enter or select an SQL statement first.", "error");
        return;
    }

    const loader = document.getElementById('query-results-loader');
    const emptyState = document.getElementById('results-empty-state');
    const tableContainer = document.getElementById('results-table-container');
    const badge = document.getElementById('results-count-badge');

    // Show spinner and hide tables
    loader.style.display = 'flex';
    emptyState.style.display = 'none';
    tableContainer.style.display = 'none';
    badge.style.display = 'none';

    showToast("Transmitting SQL request to compiler...", "info");

    try {
        const bodyObj = {};
        
        // If query in textarea matches active preset, pass preset_id so explanations map nicely
        const preset = PRESET_MAP[ACTIVE_PRESET_ID];
        if (preset && preset.sql === sqlQuery) {
            bodyObj.preset_id = ACTIVE_PRESET_ID;
        } else {
            bodyObj.sql = sqlQuery;
        }

        const response = await fetch('/api/queries/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
        });

        const data = await response.json();

        if (data.success) {
            showToast("SQL execution completed successfully!", "success");
            
            // Update row count badge
            badge.innerText = `${data.rowCount} rows returned`;
            badge.style.display = 'inline-block';
            
            renderQueryOutputTable(data.columns, data.rows);
        } else {
            // Render nice system blocks or syntax error logs in terminal
            showToast("SQL Statement compilation failed.", "error");
            emptyState.innerHTML = `
                <div style="color: var(--error); font-weight:600; font-family: 'Fira Code', monospace; font-size: 0.8rem; text-align: left; padding: 10px;">
                    ❌ [SQL ENGINE EXCEPTION]<br><br>
                    ${data.message}
                </div>
            `;
            emptyState.style.borderColor = 'rgba(239,68,68,0.4)';
            emptyState.style.display = 'block';
        }

    } catch (err) {
        console.error("SQL Run failure:", err);
        showToast("Server connection error during SQL compile.", "error");
        emptyState.innerText = "Error establishing connection to relational table compiler.";
        emptyState.style.display = 'block';
    } finally {
        loader.style.display = 'none';
    }
}

function renderQueryOutputTable(columns, rows) {
    const tableHeader = document.getElementById('results-table-header');
    const tableBody = document.getElementById('results-table-body');
    const tableContainer = document.getElementById('results-table-container');
    const emptyState = document.getElementById('results-empty-state');

    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (rows.length === 0) {
        emptyState.innerHTML = `
            <div style="font-family: 'Fira Code', monospace; font-size:0.8rem; color: var(--secondary-light); padding:10px;">
                ✓ Query OK. Empty set returned (0 rows matched).
            </div>
        `;
        emptyState.style.display = 'block';
        return;
    }

    // 1. Build table headers dynamically
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.innerText = col;
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // 2. Build row cells dynamically
    rows.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            const val = row[col];
            
            // Format column values for screen readability
            if (val === null) {
                td.innerHTML = `<em style="color:var(--text-muted);">NULL</em>`;
            } else {
                td.innerText = val;
            }
            
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    tableContainer.style.display = 'block';
}
