const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Default values if environment variables are not set
const DB_HOST = (process.env.DB_HOST || 'localhost').trim();
const DB_PORT = typeof process.env.DB_PORT === 'string' ? process.env.DB_PORT.trim() : (process.env.DB_PORT || 3306);
const DB_USER = (process.env.DB_USER || 'root').trim();
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD).trim() : '';
const DB_NAME = (process.env.DB_NAME || 'campus_events').trim();

let pool;

/**
 * Executes a file containing multiple SQL statements separated by semicolons
 */
async function executeSqlFile(connection, filePath) {
    try {
        const fullPath = path.resolve(__dirname, '..', filePath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`[DB Init Warning] SQL file not found at: ${filePath}`);
            return;
        }

        const sqlContent = fs.readFileSync(fullPath, 'utf8');
        
        // Split queries by semicolon, filtering out empty lines
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            if (statement) {
                await connection.query(statement);
            }
        }
        console.log(`[DB Init] Successfully executed: ${filePath}`);
    } catch (error) {
        console.error(`[DB Init Error] Failed to execute SQL file (${filePath}):`, error.message);
        throw error;
    }
}

/**
 * Establishes standard pool connection and runs auto-initialization check
 */
async function initDatabase() {
    let bootstrapConnection;
    try {
        console.log(`[DB] Connecting to MySQL server at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
        
        // Step 1: Connect to MySQL server without database first to ensure database existence
        bootstrapConnection = await mysql.createConnection({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            multipleStatements: true
        });

        // Step 2: Create database if it doesn't exist
        console.log(`[DB] Ensuring database '${DB_NAME}' exists...`);
        await bootstrapConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        await bootstrapConnection.end();

        // Step 3: Create the standard connection pool with the selected database
        pool = mysql.createPool({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true // Return date and times as string instead of JS Date object
        });

        // Step 4: Verify connection and check if tables are present
        const conn = await pool.getConnection();
        try {
            console.log(`[DB] Connection to '${DB_NAME}' pool established successfully.`);
            
            // Check if students table exists to decide if we need schema seeding
            const [rows] = await conn.query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
            `, [DB_NAME]);

            if (rows.length === 0) {
                console.log(`[DB] Database tables not found. Starting automatic database seeding...`);
                
                // Temporarily allow executing multiple statements for initial seed
                await conn.query('SET FOREIGN_KEY_CHECKS = 0');
                
                // Execute schema creation
                await executeSqlFile(conn, 'database/schema.sql');
                
                // Execute dummy data seeding
                await executeSqlFile(conn, 'database/dummy_data.sql');
                
                await conn.query('SET FOREIGN_KEY_CHECKS = 1');
                console.log(`[DB] Database auto-initialization complete! Standard accounts seeded.`);
            } else {
                console.log(`[DB] Existing tables detected. Skipping schema seeding.`);
            }
        } finally {
            conn.release();
        }

    } catch (error) {
        console.error(`[DB Critical Error] Failed to initialize database:`, error.message);
        console.error(`\n>>> VIVA TIPS & TROUBLESHOOTING:`);
        console.error(`1. Make sure your local MySQL/MariaDB server is running (e.g. via XAMPP Control Panel, WampServer, or local MySQL Service).`);
        console.error(`2. Double-check your credentials in the '.env' file.`);
        console.error(`3. If your MySQL root account has a password, set DB_PASSWORD in '.env' to your password.\n`);
        process.exit(1); // Exit process on database failure
    }
}

// Initialize database immediately at import
initDatabase();

module.exports = {
    // Export query helper using standard pool
    query: async (sql, params) => {
        if (!pool) {
            throw new Error("[DB Pool Error] Database connection pool not initialized yet.");
        }
        const [results] = await pool.query(sql, params);
        return results;
    },
    // Export standard pool for transactions and custom connections
    pool: () => pool
};
