const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import DB config to trigger connection pool and automated table seeding
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// =======================================================
// MIDDLEWARES
// =======================================================

// 1. JSON and URL-encoded form body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Express Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'campus_event_viva_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 2, // Session expires in 2 hours
        secure: false // Set to true if running over HTTPS in production
    }
}));

// =======================================================
// API ROUTING BINDINGS
// =======================================================

// Bind modular API routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/queries', require('./routes/queries'));

// =======================================================
// STATIC ASSET UTILITIES
// =======================================================

// Serve all UI components and static pages from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback routing: redirects undefined browser routes back to welcome screen
app.get('*', (req, res, next) => {
    // If the request accepts HTML, serve index.html
    if (req.accepts('html')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    next();
});

// Global Error Handler for unexpected exceptions
app.use((err, req, res, next) => {
    console.error("[Server Error]", err.stack);
    res.status(500).json({
        success: false,
        message: "An unexpected server exception occurred. Please check console logs."
    });
});

// =======================================================
// START THE SERVER
// =======================================================
app.listen(PORT, () => {
    console.log(`\n=======================================================`);
    console.log(`🚀 CAMPUS EVENT REGISTRATION & LOGIN SYSTEM ONLINE!`);
    console.log(`📡 Server Address: http://localhost:${PORT}`);
    console.log(`📁 Workspace Root: ${__dirname}`);
    console.log(`=======================================================\n`);
});
