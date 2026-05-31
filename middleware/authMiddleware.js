/**
 * Authentication Middleware
 * Protects API routes based on student or admin session states.
 */

module.exports = {
    /**
     * Guard to ensure the user is logged in as a Student
     */
    requireStudent: (req, res, next) => {
        if (req.session && req.session.studentId && req.session.role === 'student') {
            return next();
        }
        return res.status(401).json({ 
            success: false, 
            message: "Access Denied: You must be logged in as a Student to access this." 
        });
    },

    /**
     * Guard to ensure the user is logged in as an Admin
     */
    requireAdmin: (req, res, next) => {
        if (req.session && req.session.adminId && req.session.role === 'admin') {
            return next();
        }
        return res.status(403).json({ 
            success: false, 
            message: "Access Denied: Administrative privileges required." 
        });
    },

    /**
     * Guard to ensure ANY user is logged in (either Student or Admin)
     */
    requireLogin: (req, res, next) => {
        if (req.session && req.session.role) {
            return next();
        }
        return res.status(401).json({ 
            success: false, 
            message: "Access Denied: Session expired or not logged in." 
        });
    }
};
