const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.signup = async (req, res) => {
    const { role, username, email, password } = req.body;
    try {
        db.query('SELECT * FROM userssignup WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length > 0) return res.status(400).json({ error: 'Email already exists' });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const query = `INSERT INTO userssignup (role, username, email, password) VALUES (?, ?, ?, ?)`;
            db.query(query, [role, username, email, hashedPassword], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to register' });
                res.status(201).json({ message: 'User registered successfully!' });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = (req, res) => {
    const { role, email, password } = req.body;

    db.query('SELECT * FROM userssignup WHERE email = ? AND role = ?', [email, role], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(400).json({ error: 'User not found or role mismatch' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

        res.status(200).json({
            message: 'Login successful',
            user: { id: user.id, role: user.role, username: user.username, email: user.email }
        });
    });
};

exports.getUserInfo = (req, res) => {
    db.query('SELECT * FROM userinfo', (err, results) => {
        if (err) {
            // Updated Fallback with Astha Maa and IsActive Flags!
            return res.json([
                { UserInfoId: 1, UserType: 'State Super Administrator', UserRole: 'Superadmin', IsActive: 1 },
                { UserInfoId: 2, UserType: 'District Administrator', UserRole: 'Admin', IsActive: 1 },
                { UserInfoId: 3, UserType: 'Supervisor', UserRole: 'Viewer', IsActive: 1 },
                { UserInfoId: 4, UserType: 'Astha Didi', UserRole: 'Viewer', IsActive: 1 },
                { UserInfoId: 5, UserType: 'Astha Maa', UserRole: 'Viewer', IsActive: 1 }
            ]);
        }
        res.json(results);
    });
};

// ==========================================
// ROLE MANAGEMENT ENDPOINTS (userinfo table)
// ==========================================
exports.createUserRole = (req, res) => {
    const { UserType, UserRole, IsActive } = req.body;
    db.query('INSERT INTO userinfo (UserType, UserRole, IsActive) VALUES (?, ?, ?)', [UserType, UserRole, IsActive], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ message: 'Role added successfully', id: result.insertId });
    });
};

exports.updateUserRole = (req, res) => {
    const { id } = req.params;
    const { UserType, UserRole, IsActive } = req.body;
    db.query('UPDATE userinfo SET UserType = ?, UserRole = ?, IsActive = ? WHERE UserInfoId = ?', [UserType, UserRole, IsActive, id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Role updated successfully' });
    });
};

exports.deleteUserRole = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM userinfo WHERE UserInfoId = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Role deleted successfully' });
    });
};