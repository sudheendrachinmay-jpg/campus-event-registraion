const db = require('../config/db');

/**
 * Event Controller
 * Implements CRUD actions on the 'events' table and registration joins.
 */
module.exports = {
    /**
     * Fetch All Events (with live registration counts and student enrollment status)
     */
    getAllEvents: async (req, res) => {
        try {
            const studentId = req.session.studentId || 0; // 0 if logged in as Admin or guest
            
            // SQL QUERY DEMO: LEFT JOIN events with registrations, COUNT total seats booked, and check user enrollment
            const query = `
                SELECT 
                    e.event_id,
                    e.title,
                    e.description,
                    e.date,
                    e.time,
                    e.venue,
                    e.capacity,
                    e.category,
                    COUNT(r.registration_id) AS registered_count,
                    MAX(CASE WHEN r.student_id = ? THEN 1 ELSE 0 END) AS is_registered
                FROM events e
                LEFT JOIN registrations r ON e.event_id = r.event_id
                GROUP BY 
                    e.event_id, e.title, e.description, e.date, e.time, e.venue, e.capacity, e.category
                ORDER BY e.date ASC
            `;
            
            const events = await db.query(query, [studentId]);
            return res.json({ success: true, data: events });

        } catch (error) {
            console.error("Fetch all events error:", error);
            return res.status(500).json({ success: false, message: "Server error while fetching events." });
        }
    },

    /**
     * Fetch a single event's details
     */
    getEventById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // SQL QUERY DEMO: SELECT single row by Primary Key
            const query = "SELECT * FROM events WHERE event_id = ?";
            const events = await db.query(query, [id]);
            
            if (events.length === 0) {
                return res.status(404).json({ success: false, message: "Event not found." });
            }
            
            return res.json({ success: true, data: events[0] });
        } catch (error) {
            console.error("Fetch event details error:", error);
            return res.status(500).json({ success: false, message: "Server error fetching event details." });
        }
    },

    /**
     * Student Event Registration (with Capacity Limit Guard)
     */
    registerForEvent: async (req, res) => {
        try {
            const studentId = req.session.studentId;
            const { event_id } = req.body;

            if (!event_id) {
                return res.status(400).json({ success: false, message: "Event ID is required." });
            }

            // 1. Fetch event capacity and title
            const eventQuery = "SELECT title, capacity FROM events WHERE event_id = ?";
            const events = await db.query(eventQuery, [event_id]);
            if (events.length === 0) {
                return res.status(404).json({ success: false, message: "Event not found." });
            }
            const event = events[0];

            // 2. Check if student is already registered (composite key check)
            const regCheckQuery = "SELECT registration_id FROM registrations WHERE student_id = ? AND event_id = ?";
            const existingRegs = await db.query(regCheckQuery, [studentId, event_id]);
            if (existingRegs.length > 0) {
                return res.status(400).json({ success: false, message: "You are already registered for this event." });
            }

            // 3. Count current registrations for the event to ensure seat availability
            // SQL QUERY DEMO: Aggregate COUNT on registrations table
            const countQuery = "SELECT COUNT(*) AS current_count FROM registrations WHERE event_id = ?";
            const counts = await db.query(countQuery, [event_id]);
            const currentCount = counts[0].current_count;

            if (currentCount >= event.capacity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Registration failed. '${event.title}' has reached its maximum seat limit of ${event.capacity}!` 
                });
            }

            // 4. Register student (INSERT row)
            // SQL QUERY DEMO: INSERT INTO registrations
            const insertQuery = "INSERT INTO registrations (student_id, event_id) VALUES (?, ?)";
            await db.query(insertQuery, [studentId, event_id]);

            return res.status(201).json({
                success: true,
                message: `Congratulations! You have successfully registered for ${event.title}.`
            });

        } catch (error) {
            console.error("Event registration error:", error);
            return res.status(500).json({ success: false, message: "Server error during event registration." });
        }
    },

    /**
     * Fetch Events Registered by the Current Student
     */
    getMyRegisteredEvents: async (req, res) => {
        try {
            const studentId = req.session.studentId;

            // SQL QUERY DEMO: INNER JOIN between registrations and events to pull registered events for a specific student
            const query = `
                SELECT 
                    r.registration_id,
                    r.registered_at,
                    e.event_id,
                    e.title,
                    e.description,
                    e.date,
                    e.time,
                    e.venue,
                    e.category
                FROM registrations r
                INNER JOIN events e ON r.event_id = e.event_id
                WHERE r.student_id = ?
                ORDER BY e.date ASC
            `;
            const registeredEvents = await db.query(query, [studentId]);
            return res.json({ success: true, data: registeredEvents });

        } catch (error) {
            console.error("Fetch registered events error:", error);
            return res.status(500).json({ success: false, message: "Server error fetching your registrations." });
        }
    },

    /**
     * Cancel Registration (Student deregistration)
     */
    cancelRegistration: async (req, res) => {
        try {
            const studentId = req.session.studentId;
            const { event_id } = req.body;

            if (!event_id) {
                return res.status(400).json({ success: false, message: "Event ID is required." });
            }

            // SQL QUERY DEMO: DELETE registration record
            const deleteQuery = "DELETE FROM registrations WHERE student_id = ? AND event_id = ?";
            const result = await db.query(deleteQuery, [studentId, event_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Registration not found or already cancelled." });
            }

            return res.json({ success: true, message: "Registration cancelled successfully." });

        } catch (error) {
            console.error("Cancel registration error:", error);
            return res.status(500).json({ success: false, message: "Server error while cancelling registration." });
        }
    },

    // ==========================================
    // ADMINISTRATIVE / CREATOR CONTROLS
    // ==========================================

    /**
     * Admin: Add a new Campus Event
     */
    addEvent: async (req, res) => {
        try {
            const adminId = req.session.adminId;
            const { title, description, date, time, venue, capacity, category } = req.body;

            // Simple validation
            if (!title || !date || !time || !venue || !capacity || !category) {
                return res.status(400).json({ success: false, message: "Please fill in all required fields." });
            }

            // SQL QUERY DEMO: INSERT INTO events
            const query = `
                INSERT INTO events (title, description, date, time, venue, capacity, category, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const result = await db.query(query, [title, description, date, time, venue, capacity, category, adminId]);

            return res.status(201).json({
                success: true,
                message: `Event '${title}' created successfully!`,
                event_id: result.insertId
            });

        } catch (error) {
            console.error("Admin add event error:", error);
            return res.status(500).json({ success: false, message: "Server error creating the event." });
        }
    },

    /**
     * Admin: Update an existing event
     */
    updateEvent: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, date, time, venue, capacity, category } = req.body;

            if (!title || !date || !time || !venue || !capacity || !category) {
                return res.status(400).json({ success: false, message: "Please fill in all required fields." });
            }

            // SQL QUERY DEMO: UPDATE events
            const query = `
                UPDATE events 
                SET title = ?, description = ?, date = ?, time = ?, venue = ?, capacity = ?, category = ? 
                WHERE event_id = ?
            `;
            const result = await db.query(query, [title, description, date, time, venue, capacity, category, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Event not found." });
            }

            return res.json({ success: true, message: "Event updated successfully!" });

        } catch (error) {
            console.error("Admin update event error:", error);
            return res.status(500).json({ success: false, message: "Server error updating the event." });
        }
    },

    /**
     * Admin: Delete an event
     */
    deleteEvent: async (req, res) => {
        try {
            const { id } = req.params;

            // SQL QUERY DEMO: DELETE FROM events (triggers CASCADE delete on registrations)
            const query = "DELETE FROM events WHERE event_id = ?";
            const result = await db.query(query, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Event not found." });
            }

            return res.json({ 
                success: true, 
                message: "Event deleted successfully! Associated student registrations were automatically cascaded." 
            });

        } catch (error) {
            console.error("Admin delete event error:", error);
            return res.status(500).json({ success: false, message: "Server error deleting the event." });
        }
    }
};
