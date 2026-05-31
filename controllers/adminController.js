const db = require('../config/db');

/**
 * Admin Controller
 * Serves analytics, student directories, and registration logs for admins.
 */
module.exports = {
    /**
     * Fetch statistical aggregates for Dashboard Counters and charts
     */
    getDashboardStats: async (req, res) => {
        try {
            // 1. Total Student Count (Aggregate COUNT)
            const studentCountRes = await db.query("SELECT COUNT(*) AS total FROM students");
            const totalStudents = studentCountRes[0].total;

            // 2. Total Event Count (Aggregate COUNT)
            const eventCountRes = await db.query("SELECT COUNT(*) AS total FROM events");
            const totalEvents = eventCountRes[0].total;

            // 3. Total Registrations Count (Aggregate COUNT)
            const regCountRes = await db.query("SELECT COUNT(*) AS total FROM registrations");
            const totalRegistrations = regCountRes[0].total;

            // 4. Popular Events Chart Data (Aggregate, LEFT JOIN, GROUP BY, ORDER BY, LIMIT)
            // SQL QUERY DEMO: Count enrollments per event
            const popularEventsQuery = `
                SELECT 
                    e.title, 
                    COUNT(r.registration_id) AS registration_count
                FROM events e
                LEFT JOIN registrations r ON e.event_id = r.event_id
                GROUP BY e.event_id, e.title
                ORDER BY registration_count DESC, e.title ASC
                LIMIT 5
            `;
            const popularEvents = await db.query(popularEventsQuery);

            // 5. Department Student Distribution (Aggregate, GROUP BY, ORDER BY)
            const departmentDistQuery = `
                SELECT 
                    department, 
                    COUNT(*) AS count 
                FROM students 
                GROUP BY department
                ORDER BY count DESC
            `;
            const departmentDist = await db.query(departmentDistQuery);

            return res.json({
                success: true,
                data: {
                    metrics: {
                        totalStudents,
                        totalEvents,
                        totalRegistrations
                    },
                    charts: {
                        popularEvents,
                        departmentDist
                    }
                }
            });

        } catch (error) {
            console.error("Dashboard stats error:", error);
            return res.status(500).json({ success: false, message: "Server error compiling dashboard metrics." });
        }
    },

    /**
     * Get Student Directory (supports wildcard LIKE searching by name, roll no, or department)
     */
    getStudentsList: async (req, res) => {
        try {
            const search = req.query.search || '';
            const searchParam = `%${search}%`;

            // SQL QUERY DEMO: LIKE searches for flexible matching
            const query = `
                SELECT 
                    student_id, 
                    full_name, 
                    email, 
                    department, 
                    usn, 
                    created_at 
                FROM students 
                WHERE full_name LIKE ? 
                   OR usn LIKE ? 
                   OR department LIKE ?
                ORDER BY full_name ASC
            `;
            const students = await db.query(query, [searchParam, searchParam, searchParam]);
            return res.json({ success: true, data: students });

        } catch (error) {
            console.error("Get students list error:", error);
            return res.status(500).json({ success: false, message: "Server error fetching students." });
        }
    },

    /**
     * Get Complete Registrations Log (Multiple Table JOINs - registrations, students, events)
     */
    getRegistrationsList: async (req, res) => {
        try {
            const search = req.query.search || '';
            const searchParam = `%${search}%`;

            // SQL QUERY DEMO: Double INNER JOIN linking registrations, students, and events together
            const query = `
                SELECT 
                    r.registration_id,
                    r.registered_at,
                    s.full_name AS student_name,
                    s.usn AS student_usn,
                    s.department AS student_dept,
                    s.email AS student_email,
                    e.title AS event_title,
                    e.date AS event_date,
                    e.venue AS event_venue
                FROM registrations r
                INNER JOIN students s ON r.student_id = s.student_id
                INNER JOIN events e ON r.event_id = e.event_id
                WHERE s.full_name LIKE ? 
                   OR e.title LIKE ? 
                   OR s.usn LIKE ?
                ORDER BY r.registered_at DESC
            `;
            const registrations = await db.query(query, [searchParam, searchParam, searchParam]);
            return res.json({ success: true, data: registrations });

        } catch (error) {
            console.error("Get registrations list error:", error);
            return res.status(500).json({ success: false, message: "Server error fetching registrations logs." });
        }
    }
};
