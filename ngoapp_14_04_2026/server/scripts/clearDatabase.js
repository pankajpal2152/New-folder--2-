// require('dotenv').config({ path: '../.env' }); // Ensure it finds the .env file one level up
// const mysql = require('mysql2/promise'); // Using the promise version for modern async/await

// async function cleanDatabase() {
//     let db;
//     try {
//         // Connect using the exact same credentials as your server.js
//         db = await mysql.createConnection({
//             host: process.env.DB_HOST || 'localhost',
//             user: process.env.DB_USER || 'root',
//             password: process.env.DB_PASSWORD || '',
//             port: process.env.DB_PORT || 3306,
//             database: process.env.DB_NAME || 'mathemat_ngo'
//         });

//         console.log(`✅ Connected to database: ${process.env.DB_NAME}`);
//         console.log(`🧹 Starting database cleanup...\n`);

//         // We use TRUNCATE to empty tables and reset auto-increment IDs to 1.
//         // I have updated these to match your actual database tables.
//         const tablesToClear = [
//             'userssignup',
//             'asthadidireginfo'
//             // Add 'districtadmin_reg', 'supervisor_reg' here once you create them
//         ];

//         for (const table of tablesToClear) {
//             try {
//                 await db.query(`TRUNCATE TABLE ${table}`);
//                 console.log(`✔️  Successfully cleared '${table}' table.`);
//             } catch (tableErr) {
//                 console.error(`❌ Error clearing '${table}':`, tableErr.message);
//                 // Note: If you have foreign key constraints, TRUNCATE might fail. 
//                 // In that case, you'd need to use 'DELETE FROM table' or temporarily disable checks.
//             }
//         }

//         console.log("\n🎉 Database cleanup finished successfully!");

//     } catch (err) {
//         console.error('❌ Failed to connect to database:', err.message);
//         process.exit(1);
//     } finally {
//         if (db) {
//             await db.end(); // Always close the connection
//         }
//     }
// }

// cleanDatabase();