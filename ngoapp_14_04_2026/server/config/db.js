const mysql = require('mysql2');
require('dotenv').config();

// 1. Check if we are using the Aiven Cloud Database
const isCloudDB = process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud');

// 2. Set up the basic configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'mathemat_ngo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// 3. SMART SWITCH: Only add SSL if we are connecting to the Cloud!
if (isCloudDB) {
    dbConfig.ssl = { rejectUnauthorized: false };
}

// 4. Create the connection
const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed: ' + err.message);
    } else {
        // ✅ FIXED: The backticks (`) are correctly wrapped around the entire message!
        console.log(`✅ Connected to database: ${process.env.DB_NAME || 'mathemat_ngo'} (Cloud SSL: ${isCloudDB ? 'ON' : 'OFF'})`);
        connection.release();
    }
});

module.exports = db;