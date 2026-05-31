const db = require('../config/db');

// Directory of preset DBMS queries with detailed viva explanations
const PRESET_QUERIES = [
    {
        id: "fetch_students_for_event",
        name: "1. Fetch Students Registered for a Specific Event",
        category: "JOIN Queries",
        sql: `SELECT s.student_id, s.full_name, s.usn, s.department, r.registered_at \nFROM registrations r \nINNER JOIN students s ON r.student_id = s.student_id \nWHERE r.event_id = 1 \nORDER BY s.full_name ASC`,
        vivaExplanation: [
            "PURPOSE: Retrieves the complete profile of all students who registered for the event with ID = 1 (HackFest 2026).",
            "INNER JOIN: Combines rows from the 'registrations' (r) and 'students' (s) tables where the 'student_id' matches in both.",
            "WHERE CLAUSE: Filters the results so we only get registrations corresponding to event_id = 1.",
            "ORDER BY: Sorts the resulting student list alphabetically by their 'full_name' in ascending (A-Z) order.",
            "RELATIONAL IMPACT: Demonstrates navigating a many-to-many relationship using a junction table ('registrations') to link entities."
        ]
    },
    {
        id: "count_regs_per_event",
        name: "2. Count Total Registrations Per Event",
        category: "Aggregate & GROUP BY",
        sql: `SELECT e.event_id, e.title, e.capacity, COUNT(r.registration_id) AS total_registrations \nFROM events e \nLEFT JOIN registrations r ON e.event_id = r.event_id \nGROUP BY e.event_id, e.title, e.capacity \nORDER BY total_registrations DESC`,
        vivaExplanation: [
            "PURPOSE: Displays every campus event along with its seat capacity and the total number of students currently signed up.",
            "LEFT JOIN: Ensures that ALL events are returned, even if they have 0 registrations (an INNER JOIN would omit events with 0 signups!).",
            "COUNT(r.registration_id): An aggregate function that counts how many registration rows exist for each event group.",
            "GROUP BY: Groups the combined rows by unique event details so the COUNT() function can aggregate values for each event individually.",
            "ORDER BY DESC: Sorts the list so the most popular events (highest registration count) appear first."
        ]
    },
    {
        id: "popular_events_having",
        name: "3. Find Highly Popular Events (HAVING Clause)",
        category: "GROUP BY with HAVING",
        sql: `SELECT e.event_id, e.title, COUNT(r.registration_id) AS total_regs \nFROM events e \nINNER JOIN registrations r ON e.event_id = r.event_id \nGROUP BY e.event_id, e.title \nHAVING total_regs >= 2 \nORDER BY total_regs DESC`,
        vivaExplanation: [
            "PURPOSE: Filters events to identify those that have gathered a high level of interest (2 or more registrations).",
            "INNER JOIN: Joins events and registrations. Only events with at least 1 registration are considered.",
            "GROUP BY: Groups rows by event to prepare for registration counts.",
            "HAVING CLAUSE: Standard 'WHERE' filters cannot be applied to aggregate counts. We use 'HAVING' to filter groups based on the computed COUNT() aggregate.",
            "DEVELOPER TIP: Remember, 'WHERE' filters individual rows before grouping; 'HAVING' filters grouped records after aggregation!"
        ]
    },
    {
        id: "inactive_students_subquery",
        name: "4. Find Inactive Students (Nested Subquery)",
        category: "Nested Queries",
        sql: `SELECT student_id, full_name, usn, department \nFROM students \nWHERE student_id NOT IN (\n    SELECT DISTINCT student_id \n    FROM registrations\n)`,
        vivaExplanation: [
            "PURPOSE: Finds students who registered an account on the website but have NOT signed up for any campus events yet.",
            "NESTED QUERY (SUBQUERY): The inner SELECT statement `SELECT DISTINCT student_id FROM registrations` runs first, generating a set of all student IDs who have registered for at least one event.",
            "NOT IN OPERATOR: The outer query scans the 'students' table and filters out any student whose ID exists in the inner query's set.",
            "USE CASE: Admins can use this query to target email campaigns or reminders to students who are inactive on the platform."
        ]
    },
    {
        id: "fully_booked_events_subquery",
        name: "5. Find Fully Booked Events (Correlated Subquery)",
        category: "Advanced Nested Queries",
        sql: `SELECT event_id, title, capacity \nFROM events e \nWHERE e.capacity <= (\n    SELECT COUNT(*)\n    FROM registrations r \n    WHERE r.event_id = e.event_id\n)`,
        vivaExplanation: [
            "PURPOSE: Lists all events where every single seat has been taken (registrations equal or exceed capacity).",
            "CORRELATED SUBQUERY: The inner query `SELECT COUNT(*)...` runs repeatedly, once for every event row checked by the outer query, matching `r.event_id` with `e.event_id`.",
            "COMPARISON OPERATOR: The outer query compares the static 'capacity' column of the event against the dynamic count returned by the subquery.",
            "RELATIONAL CONCEPT: Demonstrates complex rows evaluation where inner query logic depends directly on the outer query's current row context."
        ]
    },
    {
        id: "search_students_like",
        name: "6. Search Computer Science Students (Wildcard LIKE)",
        category: "Filtering & Searching",
        sql: `SELECT student_id, full_name, usn, email, department \nFROM students \nWHERE department LIKE '%Computer Science%' \nORDER BY usn ASC`,
        vivaExplanation: [
            "PURPOSE: Searches for and returns all students belonging to the Computer Science department.",
            "LIKE OPERATOR & WILDCARDS (%): The '%' wildcard matches any sequence of characters. '%Computer Science%' will match 'Computer Science', 'B.Tech Computer Science', or 'Computer Science Engineering'.",
            "ORDER BY ASC: Sorts the returned list in ascending order of student USN values."
        ]
    }
];

module.exports = {
    /**
     * Get list of preset queries and explanations
     */
    getPresets: (req, res) => {
        return res.json({ success: true, presets: PRESET_QUERIES });
    },

    /**
     * Execute SQL Query and return structured results
     */
    runQuery: async (req, res) => {
        try {
            const { sql, preset_id } = req.body;
            let querySql = "";
            let explanation = null;

            // 1. If preset_id is provided, fetch standard query from array
            if (preset_id) {
                const preset = PRESET_QUERIES.find(p => p.id === preset_id);
                if (!preset) {
                    return res.status(400).json({ success: false, message: "Invalid preset query selection." });
                }
                querySql = preset.sql;
                explanation = preset.vivaExplanation;
            } else if (sql) {
                querySql = sql.trim();
            } else {
                return res.status(400).json({ success: false, message: "No SQL query provided." });
            }

            // 2. Security validation: Ensure custom queries are SELECT-only (Read-Only) and safe
            const cleanSql = querySql.toUpperCase();
            
            // Check if it starts with SELECT
            if (!cleanSql.startsWith("SELECT")) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Security Block: Only read-only 'SELECT' statements are allowed in this demonstration console." 
                });
            }

            // Check for hazardous SQL injection / modifications keywords
            const dangerousKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REPLACE", ";"];
            for (const word of dangerousKeywords) {
                // Check if word exists as a separate token/substring (we also block semi-colons to prevent multiple statement injections)
                if (cleanSql.includes(word) && word !== "SELECT") {
                    // Make exception for INNER JOIN or LEFT JOIN (which contains JOIN/SELECT keywords)
                    if (word === ";" || cleanSql.match(new RegExp(`\\b${word}\\b`))) {
                        return res.status(403).json({ 
                            success: false, 
                            message: `Security Block: Command '${word}' is blocked. Writing, structural modifications, and stacked queries are prohibited.` 
                        });
                    }
                }
            }

            // 3. Execute the SQL query using our standard database runner
            console.log(`[Query Engine] Running SQL: ${querySql}`);
            const results = await db.query(querySql);

            // 4. Send back row details, column names, and explanations
            let columns = [];
            if (results.length > 0) {
                columns = Object.keys(results[0]);
            }

            return res.json({
                success: true,
                sql: querySql,
                columns: columns,
                rows: results,
                rowCount: results.length,
                explanation: explanation
            });

        } catch (error) {
            console.error("SQL Execution Error in console:", error.message);
            return res.status(400).json({ 
                success: false, 
                message: `SQL Syntax / Database Error: ${error.message}` 
            });
        }
    }
};
