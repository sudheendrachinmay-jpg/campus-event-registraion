const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Auth Controller
 * Handles user authentication, registration, session management, and logout.
 */
module.exports = {
    /**
     * Handle Student Registration
     */
    registerStudent: async (req, res) => {
        try {
            let { full_name, email, password, department, usn } = req.body;

            // 1. Basic validation
            if (!full_name || !email || !password || !department || !usn) {
                return res.status(400).json({ success: false, message: "All fields are required." });
            }

            // Trim and sanitize inputs
            email = email.trim().toLowerCase();
            usn = usn.trim().toUpperCase();
            full_name = full_name.trim();

            // 2. Check if student already exists
            const checkQuery = "SELECT student_id, email, usn FROM students WHERE email = ? OR usn = ?";
            const existingStudents = await db.query(checkQuery, [email, usn]);

            if (existingStudents.length > 0) {
                const match = existingStudents[0];
                if (match.email.toLowerCase() === email.toLowerCase()) {
                    return res.status(409).json({ success: false, message: "Email is already registered." });
                }
                if (match.usn.toLowerCase() === usn.toLowerCase()) {
                    return res.status(409).json({ success: false, message: "USN is already registered." });
                }
            }

            // 3. Hash the password for security
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 4. Insert student into database using raw SQL INSERT query
            const insertQuery = `
                INSERT INTO students (full_name, email, password, department, usn) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const result = await db.query(insertQuery, [full_name, email, hashedPassword, department, usn]);

            return res.status(201).json({
                success: true,
                message: "Student registered successfully! Please login.",
                data: { student_id: result.insertId }
            });

        } catch (error) {
            console.error("Student registration error:", error);
            return res.status(500).json({ success: false, message: "Server error during registration." });
        }
    },

    /**
     * Handle Student Login
     */
    loginStudent: async (req, res) => {
        try {
            let { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required." });
            }

            // Trim and sanitize inputs
            email = email.trim().toLowerCase();

            // 1. Retrieve the student record by email
            // SQL QUERY DEMO: SELECT student profile for login verification
            const query = "SELECT * FROM students WHERE email = ?";
            const students = await db.query(query, [email]);

            if (students.length === 0) {
                return res.status(401).json({ success: false, message: "Invalid email or password." });
            }

            const student = students[0];

            // 2. Validate hashed password
            const isMatch = await bcrypt.compare(password, student.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Invalid email or password." });
            }

            // 3. Establish session properties
            req.session.studentId = student.student_id;
            req.session.email = student.email;
            req.session.name = student.full_name;
            req.session.role = 'student';
            req.session.department = student.department;
            req.session.usn = student.usn;

            return res.json({
                success: true,
                message: `Welcome back, ${student.full_name}!`,
                user: {
                    id: student.student_id,
                    name: student.full_name,
                    email: student.email,
                    role: 'student',
                    department: student.department,
                    usn: student.usn
                }
            });

        } catch (error) {
            console.error("Student login error:", error);
            return res.status(500).json({ success: false, message: "Server error during student login." });
        }
    },

    /**
     * Handle Admin Login
     */
    loginAdmin: async (req, res) => {
        try {
            let { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required." });
            }

            // Trim and sanitize inputs
            email = email.trim().toLowerCase();

            // 1. Retrieve the admin record by email
            // SQL QUERY DEMO: SELECT admin profile for login verification
            const query = "SELECT * FROM admins WHERE email = ?";
            const admins = await db.query(query, [email]);

            if (admins.length === 0) {
                return res.status(401).json({ success: false, message: "Invalid administrative credentials." });
            }

            const admin = admins[0];

            // 2. Validate password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Invalid administrative credentials." });
            }

            // 3. Establish session properties
            req.session.adminId = admin.admin_id;
            req.session.email = admin.email;
            req.session.name = admin.full_name;
            req.session.role = 'admin';

            return res.json({
                success: true,
                message: `Access Granted! Administrative login successful. Welcome, ${admin.full_name}.`,
                user: {
                    id: admin.admin_id,
                    name: admin.full_name,
                    email: admin.email,
                    role: 'admin'
                }
            });

        } catch (error) {
            console.error("Admin login error:", error);
            return res.status(500).json({ success: false, message: "Server error during admin login." });
        }
    },

    /**
     * Get Current Logged In Session User Profile
     */
    getMe: async (req, res) => {
        if (req.session && req.session.role) {
            return res.json({
                loggedIn: true,
                user: {
                    id: req.session.role === 'student' ? req.session.studentId : req.session.adminId,
                    name: req.session.name,
                    email: req.session.email,
                    role: req.session.role,
                    department: req.session.department || null,
                    usn: req.session.usn || null
                }
            });
        }
        return res.json({ loggedIn: false });
    },

    /**
     * Destroy Session & Log out User
     */
    logout: (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error("Session destruction error on logout:", err);
                return res.status(500).json({ success: false, message: "Could not log out. Please try again." });
            }
            res.clearCookie('connect.sid'); // Clear standard express-session cookie
            return res.json({ success: true, message: "Logged out successfully!" });
        });
    }
};
