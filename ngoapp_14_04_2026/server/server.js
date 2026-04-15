// // server.js
// require('dotenv').config();
// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');
// const bcrypt = require('bcrypt');

// const app = express();

// app.use(cors({ origin: '*' }));
// app.use(express.json({ limit: '50mb' })); // Increased limit for PDF uploads

// // --- STRICTLY LOCAL DATABASE CONNECTION ---
// const db = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT || 3306,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// db.getConnection((err, connection) => {
//     if (err) {
//         console.error('❌ Database connection failed: ' + err.message);
//         return;
//     }
//     console.log(`✅ Connected to local database at ${process.env.DB_HOST} successfully.`);
//     connection.release();

//     // 1. Create base users table
//     db.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, role VARCHAR(100) NOT NULL, username VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL)`);
//     db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'State Super Administrator' AFTER id", () => { });

//     // 2. Add District Administrator specific columns to the users table
//     db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS ngo_name VARCHAR(255) DEFAULT NULL", () => { });
//     db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS ngo_mobile VARCHAR(50) DEFAULT NULL", () => { });
//     db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS state_name VARCHAR(100) DEFAULT NULL", () => { });
//     db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS district_name VARCHAR(100) DEFAULT NULL", () => { });
//     db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS block_name VARCHAR(255) DEFAULT NULL", () => { });

//     const createUserInfoTable = `
//         CREATE TABLE IF NOT EXISTS userinfo (
//           UserInfoId int(11) NOT NULL AUTO_INCREMENT,
//           UserType varchar(50) DEFAULT NULL,
//           UserRole varchar(20) DEFAULT NULL,
//           ActStatus int(1) DEFAULT 1,
//           PRIMARY KEY (UserInfoId)
//         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
//     `;
//     db.query(createUserInfoTable, (err) => {
//         if (!err) {
//             db.query('SELECT COUNT(*) AS count FROM userinfo', (err, rows) => {
//                 if (!err && rows[0].count === 0) {
//                     const insertUsers = `INSERT INTO userinfo(UserType,UserRole,ActStatus) VALUES 
//                     ('State Super Administrator','Superadmin',1),
//                     ('District Administrator','Admin',1),
//                     ('Supervisor','Viewer',1),
//                     ('Astha Didi','Viewer',1)`;
//                     db.query(insertUsers);
//                 }
//             });
//         }
//     });

//     const createRegInfoTable = `
//         CREATE TABLE IF NOT EXISTS reginfo (
//             RegInfoId int(11) NOT NULL AUTO_INCREMENT,
//             ProfileImage LONGTEXT DEFAULT NULL,
//             PerName varchar(30) DEFAULT NULL, GuardianName varchar(30) DEFAULT NULL,
//             DOB date DEFAULT NULL, GuardianContactNo varchar(50) DEFAULT NULL,
//             StateName varchar(100) DEFAULT NULL, DistName varchar(100) DEFAULT NULL, City varchar(100) DEFAULT NULL,
//             BlockName varchar(30) DEFAULT NULL, PO varchar(50) DEFAULT NULL,
//             PS varchar(30) DEFAULT NULL, GramPanchayet varchar(50) DEFAULT NULL, Village varchar(50) DEFAULT NULL,
//             Pincode int(11) DEFAULT NULL, ContactNo varchar(12) DEFAULT NULL,
//             MailId varchar(50) DEFAULT NULL, BankName varchar(30) DEFAULT NULL,
//             BranchName varchar(30) DEFAULT NULL, AcctNo varchar(30) DEFAULT NULL,
//             IFSCode varchar(15) DEFAULT NULL, PanNo varchar(20) DEFAULT NULL,
//             AadharNo varchar(15) DEFAULT NULL, JoiningAmt int(11) DEFAULT NULL,
//             WalletBalance int(11) DEFAULT NULL, Status int(1) DEFAULT 1,
//             AprovedBy varchar(255) DEFAULT NULL, AprovalDate date DEFAULT NULL,
//             AprovalNumber int(11) DEFAULT NULL, CreatedBy varchar(255) DEFAULT NULL,
//             PRIMARY KEY (RegInfoId)
//         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
//     `;
//     db.query(createRegInfoTable, () => {
//         // Add new columns specifically for District Administrator NGO form
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS ngo_reg_date DATE DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS ngo_reg_no VARCHAR(100) DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS ngo_pan_no VARCHAR(20) DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS ngo_darpan_id VARCHAR(50) DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS sec_email VARCHAR(100) DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS sec_mobile VARCHAR(20) DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS sec_aadhar VARCHAR(15) DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS ngo_office_address TEXT DEFAULT NULL", () => {});
//         db.query("ALTER TABLE reginfo ADD COLUMN IF NOT EXISTS ngo_pdf_docs LONGTEXT DEFAULT NULL", () => {});
//     });
// });

// const apiRouter = express.Router();

// // ==========================================
// // 1. AUTHENTICATION
// // ==========================================
// apiRouter.post('/signup', async (req, res) => {
//     const { role, username, email, password, ngo_name, ngo_mobile, state_name, district_name, block_name } = req.body;
//     try {
//         db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
//             if (err) return res.status(500).json({ error: 'Database error' });
//             if (results.length > 0) return res.status(400).json({ error: 'Email already exists' });

//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);

//             const query = `INSERT INTO users (role, username, email, password, ngo_name, ngo_mobile, state_name, district_name, block_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//             const values = [role, username, email, hashedPassword, ngo_name || null, ngo_mobile || null, state_name || null, district_name || null, block_name || null];

//             db.query(query, values, (err, result) => {
//                 if (err) return res.status(500).json({ error: 'Failed to register' });
//                 res.status(201).json({ message: 'User registered successfully!' });
//             });
//         });
//     } catch (error) { res.status(500).json({ error: 'Server error' }); }
// });

// apiRouter.post('/login', (req, res) => {
//     const { email, password } = req.body;
//     db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
//         if (err) return res.status(500).json({ error: 'Database error' });
//         if (results.length === 0) return res.status(400).json({ error: 'User not found' });
//         const user = results[0];
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });
//         res.status(200).json({ message: 'Login successful', user: { id: user.id, role: user.role, username: user.username, email: user.email } });
//     });
// });

// // ==========================================
// // 2. CLIENT USERINFO API (Role Management)
// // ==========================================
// apiRouter.get('/userinfo', (req, res) => {
//     db.query('SELECT * FROM userinfo WHERE ActStatus = 1', (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json(results);
//     });
// });

// apiRouter.post('/userinfo', (req, res) => {
//     const { UserType, UserRole } = req.body;
//     db.query('INSERT INTO userinfo (UserType, UserRole, ActStatus) VALUES (?, ?, 1)', [UserType, UserRole || 'Viewer'], (err, result) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json({ message: 'Role created successfully', id: result.insertId });
//     });
// });

// apiRouter.put('/userinfo/:id', (req, res) => {
//     const { UserType, UserRole } = req.body;
//     db.query('UPDATE userinfo SET UserType=?, UserRole=? WHERE UserInfoId=?', [UserType, UserRole || 'Viewer', req.params.id], (err) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json({ message: 'Role updated successfully' });
//     });
// });

// apiRouter.delete('/userinfo/:id', (req, res) => {
//     db.query('DELETE FROM userinfo WHERE UserInfoId=?', [req.params.id], (err) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json({ message: 'Role deleted successfully' });
//     });
// });

// // ==========================================
// // 3. CLIENT REGINFO API
// // ==========================================
// apiRouter.get('/RegInfo', (req, res) => {
//     db.query('SELECT * FROM reginfo ORDER BY RegInfoId DESC', (err, results) => {
//         if (err) throw err;
//         res.json(results);
//     });
// });

// apiRouter.get('/RegInfo/:RegInfoId', (req, res) => {
//     const { RegInfoId } = req.params;
//     db.query('SELECT * FROM reginfo WHERE RegInfoId= ?', [RegInfoId], (err, results) => {
//         if (err) throw err;
//         res.json(results[0]);
//     });
// });

// apiRouter.post('/RegInfo', (req, res) => {
//     const data = req.body;
//     const insertQuery = `INSERT INTO reginfo 
//         (ProfileImage, PerName, GuardianName, DOB, GuardianContactNo, StateName, DistName, City, BlockName, PO, PS, GramPanchayet, Village, Pincode, ContactNo, MailId, BankName, BranchName, AcctNo, IFSCode, PanNo, AadharNo, JoiningAmt, WalletBalance, Status, AprovedBy, AprovalDate, AprovalNumber, CreatedBy, ngo_reg_date, ngo_reg_no, ngo_pan_no, ngo_darpan_id, sec_email, sec_mobile, sec_aadhar, ngo_office_address, ngo_pdf_docs) 
//         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

//     const values = [
//         data.ProfileImage, data.PerName, data.GuardianName, data.DOB, data.GuardianContactNo, data.StateName, data.DistName, data.City, data.BlockName, data.PO, data.PS, data.GramPanchayet, data.Village, data.Pincode, data.ContactNo, data.MailId, data.BankName, data.BranchName, data.AcctNo, data.IFSCode, data.PanNo, data.AadharNo, data.JoiningAmt, data.WalletBalance, data.Status, data.AprovedBy, data.AprovalDate, data.AprovalNumber, data.CreatedBy,
//         data.ngo_reg_date || null, data.ngo_reg_no || null, data.ngo_pan_no || null, data.ngo_darpan_id || null, data.sec_email || null, data.sec_mobile || null, data.sec_aadhar || null, data.ngo_office_address || null, data.ngo_pdf_docs || null
//     ];

//     db.query(insertQuery, values, (err, result) => {
//         if (err) return res.status(500).json({ error: err.message });
//         const newId = result.insertId;
//         if (data.ProfileImage && !data.ProfileImage.startsWith('ID:')) {
//             const taggedImage = `ID:${newId}||${data.ProfileImage}`;
//             db.query('UPDATE reginfo SET ProfileImage=? WHERE RegInfoId=?', [taggedImage, newId], () => { });
//         }
//         res.json({ message: 'User added successfully', id: newId });
//     });
// });

// apiRouter.put('/RegInfo/:RegInfoId', (req, res) => {
//     const { RegInfoId } = req.params;
//     const data = req.body;

//     if (data.ProfileImage && !data.ProfileImage.startsWith('ID:')) {
//         data.ProfileImage = `ID:${RegInfoId}||${data.ProfileImage}`;
//     }

//     const updateQuery = `UPDATE reginfo SET 
//         ProfileImage=?, PerName=?, GuardianName=?, DOB=?, GuardianContactNo=?, StateName=?, DistName=?, City=?, BlockName=?, PO=?, PS=?, GramPanchayet=?, Village=?, Pincode=?, ContactNo=?, MailId=?, BankName=?, BranchName=?, AcctNo=?, IFSCode=?, PanNo=?, AadharNo=?, JoiningAmt=?, WalletBalance=?, Status=?, AprovedBy=?, AprovalDate=?, AprovalNumber=?, CreatedBy=?,
//         ngo_reg_date=?, ngo_reg_no=?, ngo_pan_no=?, ngo_darpan_id=?, sec_email=?, sec_mobile=?, sec_aadhar=?, ngo_office_address=?, ngo_pdf_docs=? 
//         WHERE RegInfoId=?`;

//     const values = [
//         data.ProfileImage, data.PerName, data.GuardianName, data.DOB, data.GuardianContactNo, data.StateName, data.DistName, data.City, data.BlockName, data.PO, data.PS, data.GramPanchayet, data.Village, data.Pincode, data.ContactNo, data.MailId, data.BankName, data.BranchName, data.AcctNo, data.IFSCode, data.PanNo, data.AadharNo, data.JoiningAmt, data.WalletBalance, data.Status, data.AprovedBy, data.AprovalDate, data.AprovalNumber, data.CreatedBy,
//         data.ngo_reg_date || null, data.ngo_reg_no || null, data.ngo_pan_no || null, data.ngo_darpan_id || null, data.sec_email || null, data.sec_mobile || null, data.sec_aadhar || null, data.ngo_office_address || null, data.ngo_pdf_docs || null,
//         RegInfoId
//     ];

//     db.query(updateQuery, values, (err) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json({ message: 'User updated successfully' });
//     });
// });

// apiRouter.delete('/RegInfo/:RegInfoId', (req, res) => {
//     const { RegInfoId } = req.params;
//     db.query('DELETE FROM reginfo WHERE RegInfoId = ?', [RegInfoId], (err) => {
//         if (err) throw err;
//         res.json({ message: 'User deleted successfully' });
//     });
// });

// app.use('/api', apiRouter);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Backend Server running locally on port ${PORT}`);
// });