const db = require('../config/db');

exports.signup = async (req, res) => {
    const { role, username, email, password } = req.body;
    try {
        db.query('SELECT * FROM userssignup WHERE UserSignUpEmail = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length > 0) return res.status(400).json({ error: 'Email already exists' });

            const query = `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive) VALUES (?, ?, ?, ?, 1)`;
            db.query(query, [role, username, email, password], (err) => {
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

    db.query('SELECT * FROM userssignup WHERE UserSignUpEmail = ? AND UserSignUpRole = ?', [email, role], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(400).json({ error: 'User not found or role mismatch' });

        const user = results[0];
        
        if (password !== user.UserSignUpPassword) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: { 
                id: user.UserSignUpId, 
                role: user.UserSignUpRole, 
                username: user.SignupUserName || user.UserSignUpEmail.split('@')[0], 
                email: user.UserSignUpEmail,
                UserSignUpId: user.UserSignUpId,
                UserSignUpRole: user.UserSignUpRole,
                UserSignUpEmail: user.UserSignUpEmail,
                UserSignUpPassword: user.UserSignUpPassword,
                ProfileRegId: user.ProfileRegId,
                UserAtuorizedRegId: user.UserAtuorizedRegId,
                UserSignIsActive: user.UserSignIsActive,
                SignupUserName: user.SignupUserName
            }
        });
    });
};

exports.getUserInfo = (req, res) => {
    db.query('SELECT * FROM userinfo WHERE ActStatus = 1', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error while fetching roles' });
        }
        res.json(results);
    });
};

// ==========================================
// ROLE MANAGEMENT ENDPOINTS (userinfo table)
// ==========================================
exports.createUserRole = (req, res) => {
    const { UserType, UserRole, ActStatus } = req.body;
    db.query('INSERT INTO userinfo (UserType, UserRole, ActStatus) VALUES (?, ?, ?)', [UserType, UserRole, ActStatus], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ message: 'Role added successfully', id: result.insertId });
    });
};

exports.updateUserRole = (req, res) => {
    const { id } = req.params;
    const { UserType, UserRole, ActStatus } = req.body;
    db.query('UPDATE userinfo SET UserType = ?, UserRole = ?, ActStatus = ? WHERE UserInfoId = ?', [UserType, UserRole, ActStatus, id], (err) => {
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

// ==========================================
// DYNAMIC DROPDOWNS
// ==========================================
exports.getStates = (req, res) => {
    db.query('SELECT StateId, StateName FROM state WHERE IsActive = 1', (err, results) => {
        if (err) { console.error("❌ getStates DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
};

exports.getDistricts = (req, res) => {
    const stateId = req.params.stateId;
    db.query('SELECT DistId, DistName FROM dist WHERE StateId = ? AND IsActive = 1', [stateId], (err, results) => {
        if (err) { console.error("❌ getDistricts DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
};

// ==========================================
// NEW STRICT DROPDOWN FILTERS (WITH FIXES)
// ==========================================
exports.getFilterStates = (req, res) => {
    // ✅ Fetches ONLY states that are active AND present in dist_ngo_reg. 
    // Trims and lowercase used to bypass manual typing inconsistencies in DB.
    const query = `
        SELECT DISTINCT s.StateId, s.StateName 
        FROM state s 
        INNER JOIN dist_ngo_reg dn 
        ON LOWER(TRIM(s.StateName)) = LOWER(TRIM(dn.DistNGOStateName)) 
        WHERE s.IsActive = 1
    `;
    db.query(query, (err, results) => {
        if (err) { console.error("❌ getFilterStates DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
};

exports.getFilterDistricts = (req, res) => {
    const stateId = req.params.stateId;
    // ✅ Fetches ONLY districts for the selected state that are active AND present in dist_ngo_reg.
    // Trims and lowercase used to bypass manual typing inconsistencies in DB.
    const query = `
        SELECT DISTINCT d.DistId, d.DistName 
        FROM dist d 
        INNER JOIN dist_ngo_reg dn 
        ON LOWER(TRIM(d.DistName)) = LOWER(TRIM(dn.DistNGODistName)) 
        WHERE d.StateId = ? AND d.IsActive = 1
    `;
    db.query(query, [stateId], (err, results) => {
        if (err) { console.error("❌ getFilterDistricts DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
};

// ==========================================
// ASTHA DIDI REGISTRATION (`asthadidi_reg`)
// ==========================================
exports.getAsthaDidi = (req, res) => {
    const query = `
        SELECT a.*, 
               DATE_FORMAT(a.AsthaDidiAprovalDate, '%Y-%m-%d') AS AsthaDidiAprovalDateRaw,
               DATE_FORMAT(a.AsthaDidiDOB, '%Y-%m-%d') AS AsthaDidiDOBRaw,
               u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail 
        FROM \`asthadidi_reg\` a 
        LEFT JOIN userssignup u ON a.AsthaDidiAprovedBy = CAST(u.UserSignUpId AS CHAR)
        ORDER BY a.AsthaDidiRegId DESC
    `;
    db.query(query, (err, results) => {
        if (err) { console.error("❌ getAsthaDidi DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        const mappedResults = results.map(row => {
            let approverDisplayName = row.AsthaDidiAprovedBy;
            if (row.ApproverName) { approverDisplayName = row.ApproverName; }
            else if (row.ApproverEmail) { approverDisplayName = row.ApproverEmail.split('@')[0]; }
            return {
                ...row,
                ApproverDisplayName: approverDisplayName,
                AsthaDidiAprovalDate: row.AsthaDidiAprovalDateRaw || row.AsthaDidiAprovalDate,
                AsthaDidiDOB: row.AsthaDidiDOBRaw || row.AsthaDidiDOB
            };
        });

        res.json(mappedResults);
    });
};

exports.createAsthaDidi = (req, res) => {
    const data = req.body;
    const insertQuery = `INSERT INTO \`asthadidi_reg\` (
        AsthaDidiProfileImage, AsthaDidiUserName, AsthaDidiGuardianName, AsthaDidiDOB, AsthaDidiGuardianContactNo, 
        AsthaDidiStateName, AsthaDidiDistName, AsthaDidiCity, AsthaDidiBlockName, AsthaDidiPO, AsthaDidiPS, 
        AsthaDidiGramPanchayet, AsthaDidiVillage, AsthaDidiPincode, AsthaDidiContactNo, AsthaDidiMailId, 
        AsthaDidiBankName, AsthaDidiBranchName, AsthaDidiBankAcctNo, AsthaDidiIFSCode, AsthaDidiPanNo, AsthaDidiAadharNo, 
        AsthaDidiJoiningAmt, AsthaDidiWalletBalance, AsthaDidiSignupUserName, AsthaDidiSignupEmail, AsthaDidiSignupPassword, 
        AsthaDidiCreatedByAuthRegId, AsthaDidiCreatedDate, StateNGORegId, DistNGORegId, SupRegId, AsthaDidiIsActive, 
        AsthaDidiAprovedBy, AsthaDidiAprovalDate, AsthaDidiRegNo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?)`;

    const values = [
        data.AsthaDidiProfileImage, data.AsthaDidiUserName, data.AsthaDidiGuardianName, data.AsthaDidiDOB, data.AsthaDidiGuardianContactNo,
        data.AsthaDidiStateName, data.AsthaDidiDistName, data.AsthaDidiCity, data.AsthaDidiBlockName, data.AsthaDidiPO, data.AsthaDidiPS,
        data.AsthaDidiGramPanchayet, data.AsthaDidiVillage, data.AsthaDidiPincode, data.AsthaDidiContactNo, data.AsthaDidiMailId,
        data.AsthaDidiBankName, data.AsthaDidiBranchName, data.AsthaDidiBankAcctNo, data.AsthaDidiIFSCode, data.AsthaDidiPanNo, data.AsthaDidiAadharNo,
        data.AsthaDidiJoiningAmt, data.AsthaDidiWalletBalance, data.AsthaDidiSignupUserName, data.AsthaDidiSignupEmail, data.AsthaDidiSignupPassword,
        data.AsthaDidiCreatedByAuthRegId || null, data.StateNGORegId || null, data.DistNGORegId || null, data.SupRegId || null,
        data.AsthaDidiIsActive || 1, data.AsthaDidiAprovedBy || null, data.AsthaDidiAprovalDate || null, data.AsthaDidiRegNo || null
    ];

    db.query(insertQuery, values, (err, result) => {
        if (err) { console.error("❌ createAsthaDidi Primary DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        const newId = result.insertId;

        if (data.AsthaDidiProfileImage && !data.AsthaDidiProfileImage.startsWith('ID:')) {
            const taggedImage = `ID:${newId}||${data.AsthaDidiProfileImage}`;
            db.query('UPDATE `asthadidi_reg` SET AsthaDidiProfileImage=? WHERE AsthaDidiRegId=?', [taggedImage, newId], () => { });
        }

        if (data.AsthaDidiSignupUserName && data.AsthaDidiSignupPassword && data.AsthaDidiSignupEmail) {
            const signupQuery = `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`;
            const signupValues = ['Astha Didi', data.AsthaDidiSignupUserName, data.AsthaDidiSignupEmail, data.AsthaDidiSignupPassword, data.AsthaDidiCreatedByAuthRegId || null, newId];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Signup DB Error (Astha Didi):", signupErr.message);
            });
        }
        res.json({ message: 'Astha Didi added successfully', id: newId });
    });
};

exports.updateAsthaDidi = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (data.AsthaDidiProfileImage && !data.AsthaDidiProfileImage.startsWith('ID:')) {
        data.AsthaDidiProfileImage = `ID:${id}||${data.AsthaDidiProfileImage}`;
    }

    const updateQuery = `UPDATE \`asthadidi_reg\` SET 
        AsthaDidiProfileImage=?, AsthaDidiUserName=?, AsthaDidiGuardianName=?, AsthaDidiDOB=?, AsthaDidiGuardianContactNo=?, 
        AsthaDidiStateName=?, AsthaDidiDistName=?, AsthaDidiCity=?, AsthaDidiBlockName=?, AsthaDidiPO=?, AsthaDidiPS=?, 
        AsthaDidiGramPanchayet=?, AsthaDidiVillage=?, AsthaDidiPincode=?, AsthaDidiContactNo=?, AsthaDidiMailId=?, 
        AsthaDidiBankName=?, AsthaDidiBranchName=?, AsthaDidiBankAcctNo=?, AsthaDidiIFSCode=?, AsthaDidiPanNo=?, AsthaDidiAadharNo=?, 
        AsthaDidiJoiningAmt=?, AsthaDidiWalletBalance=?, AsthaDidiSignupUserName=?, AsthaDidiSignupEmail=?, AsthaDidiSignupPassword=?, 
        AsthaDidiIsActive=?, AsthaDidiAprovedBy=?, AsthaDidiAprovalDate=?, AsthaDidiRegNo=?
        WHERE AsthaDidiRegId=?`;

    const values = [
        data.AsthaDidiProfileImage, data.AsthaDidiUserName, data.AsthaDidiGuardianName, data.AsthaDidiDOB, data.AsthaDidiGuardianContactNo,
        data.AsthaDidiStateName, data.AsthaDidiDistName, data.AsthaDidiCity, data.AsthaDidiBlockName, data.AsthaDidiPO, data.AsthaDidiPS,
        data.AsthaDidiGramPanchayet, data.AsthaDidiVillage, data.AsthaDidiPincode, data.AsthaDidiContactNo, data.AsthaDidiMailId,
        data.AsthaDidiBankName, data.AsthaDidiBranchName, data.AsthaDidiBankAcctNo, data.AsthaDidiIFSCode, data.AsthaDidiPanNo, data.AsthaDidiAadharNo,
        data.AsthaDidiJoiningAmt, data.AsthaDidiWalletBalance, data.AsthaDidiSignupUserName, data.AsthaDidiSignupEmail, data.AsthaDidiSignupPassword,
        data.AsthaDidiIsActive, data.AsthaDidiAprovedBy, data.AsthaDidiAprovalDate, data.AsthaDidiRegNo, id
    ];

    db.query(updateQuery, values, (err) => {
        if (err) { console.error("❌ updateAsthaDidi Primary DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        if (data.AsthaDidiSignupPassword && data.AsthaDidiSignupEmail) {
            const signupQuery = `UPDATE userssignup SET UserSignUpPassword=? WHERE UserSignUpEmail=? AND UserSignUpRole='Astha Didi'`;
            const signupValues = [data.AsthaDidiSignupPassword, data.AsthaDidiSignupEmail];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Update Signup DB Error (Astha Didi):", signupErr.message);
            });
        }
        res.json({ message: 'Record updated successfully' });
    });
};

exports.deleteAsthaDidi = (req, res) => {
    db.query('DELETE FROM \`asthadidi_reg\` WHERE AsthaDidiRegId = ?', [req.params.id], (err) => {
        if (err) { console.error("❌ deleteAsthaDidi DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Record deleted successfully' });
    });
};

// ==========================================
// ASTHA MAA REGISTRATION (asthama_reg)
// ==========================================
exports.getAsthaMaa = (req, res) => {
    const query = `
        SELECT a.*, 
               DATE_FORMAT(a.AsthaMaAprovalDate, '%Y-%m-%d') AS AsthaMaAprovalDateRaw,
               DATE_FORMAT(a.AsthaMaDOB, '%Y-%m-%d') AS AsthaMaDOBRaw,
               u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail 
        FROM \`asthama_reg\` a 
        LEFT JOIN userssignup u ON a.AsthaMaAprovedBy = CAST(u.UserSignUpId AS CHAR)
        ORDER BY a.AsthaMaRegId DESC
    `;
    db.query(query, (err, results) => {
        if (err) { console.error("❌ getAsthaMaa DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        const mappedResults = results.map(row => {
            let approverDisplayName = row.AsthaMaAprovedBy;
            if (row.ApproverName) { approverDisplayName = row.ApproverName; }
            else if (row.ApproverEmail) { approverDisplayName = row.ApproverEmail.split('@')[0]; }
            return {
                ...row,
                ApproverDisplayName: approverDisplayName,
                AsthaMaAprovalDate: row.AsthaMaAprovalDateRaw || row.AsthaMaAprovalDate,
                AsthaMaDOB: row.AsthaMaDOBRaw || row.AsthaMaDOB
            };
        });

        res.json(mappedResults);
    });
};

exports.createAsthaMaa = (req, res) => {
    const data = req.body;

    const insertQuery = `INSERT INTO asthama_reg (
        AsthaMaProfileImage, AsthaMaUserName, AsthaMaGuardianName, AsthaMaDOB, AsthaMaGuardianContactNo, 
        AsthaMaStateName, AsthaMaDistName, AsthaMaCity, AsthaMaBlockName, AsthaMaPO, AsthaMaPS, 
        AsthaMaGramPanchayet, AsthaMaVillage, AsthaMaPincode, AsthaMaContactNo, AsthaMaMailId, 
        AsthaMaBankName, AsthaMaBranchName, AsthaMaBankAcctNo, AsthaMaIFSCode, AsthaMaPanNo, AsthaMaAadharNo, 
        AsthaMaJoiningAmt, AsthaMaWalletBalance, AsthaMaSignupUserName, AsthaMaSignupEmail, AsthaMaSignupPassword, 
        AsthaMaCreatedByAuthRegId, AsthaMaCreatedDate, StateNGORegId, DistNGORegId, SupRegId, AsthaDidiRegId, AsthaMaIsActive, 
        AsthaMaAprovedBy, AsthaMaAprovalDate, AsthaMaRegNo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?)`;

    const values = [
        data.AsthaMaProfileImage, data.AsthaMaUserName, data.AsthaMaGuardianName, data.AsthaMaDOB, data.AsthaMaGuardianContactNo,
        data.AsthaMaStateName, data.AsthaMaDistName, data.AsthaMaCity, data.AsthaMaBlockName, data.AsthaMaPO, data.AsthaMaPS,
        data.AsthaMaGramPanchayet, data.AsthaMaVillage, data.AsthaMaPincode, data.AsthaMaContactNo, data.AsthaMaMailId,
        data.AsthaMaBankName, data.AsthaMaBranchName, data.AsthaMaBankAcctNo, data.AsthaMaIFSCode, data.AsthaMaPanNo, data.AsthaMaAadharNo,
        data.AsthaMaJoiningAmt, data.AsthaMaWalletBalance, data.AsthaMaSignupUserName, data.AsthaMaSignupEmail, data.AsthaMaSignupPassword,
        data.AsthaMaCreatedByAuthRegId || null, data.StateNGORegId || null, data.DistNGORegId || null, data.SupRegId || null, data.AsthaDidiRegId || null,
        data.AsthaMaIsActive || 1, data.AsthaMaAprovedBy || null, data.AsthaMaAprovalDate || null, data.AsthaMaRegNo || null
    ];

    db.query(insertQuery, values, (err, result) => {
        if (err) { console.error("❌ createAsthaMaa Primary DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        const newId = result.insertId;

        if (data.AsthaMaProfileImage && !data.AsthaMaProfileImage.startsWith('ID:')) {
            const taggedImage = `ID:${newId}||${data.AsthaMaProfileImage}`;
            db.query('UPDATE asthama_reg SET AsthaMaProfileImage=? WHERE AsthaMaRegId=?', [taggedImage, newId], () => { });
        }

        if (data.AsthaMaSignupUserName && data.AsthaMaSignupPassword && data.AsthaMaSignupEmail) {
            const signupQuery = `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`;
            const signupValues = ['Astha Maa', data.AsthaMaSignupUserName, data.AsthaMaSignupEmail, data.AsthaMaSignupPassword, data.AsthaMaCreatedByAuthRegId || null, newId];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Signup DB Error (Astha Maa):", signupErr.message);
            });
        }

        res.json({ message: 'Astha Maa added successfully', id: newId });
    });
};

exports.updateAsthaMaa = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (data.AsthaMaProfileImage && !data.AsthaMaProfileImage.startsWith('ID:')) {
        data.AsthaMaProfileImage = `ID:${id}||${data.AsthaMaProfileImage}`;
    }

    const updateQuery = `UPDATE asthama_reg SET 
        AsthaMaProfileImage=?, AsthaMaUserName=?, AsthaMaGuardianName=?, AsthaMaDOB=?, AsthaMaGuardianContactNo=?, 
        AsthaMaStateName=?, AsthaMaDistName=?, AsthaMaCity=?, AsthaMaBlockName=?, AsthaMaPO=?, AsthaMaPS=?, 
        AsthaMaGramPanchayet=?, AsthaMaVillage=?, AsthaMaPincode=?, AsthaMaContactNo=?, AsthaMaMailId=?, 
        AsthaMaBankName=?, AsthaMaBranchName=?, AsthaMaBankAcctNo=?, AsthaMaIFSCode=?, AsthaMaPanNo=?, AsthaMaAadharNo=?, 
        AsthaMaJoiningAmt=?, AsthaMaWalletBalance=?, AsthaMaSignupUserName=?, AsthaMaSignupEmail=?, AsthaMaSignupPassword=?, 
        AsthaMaIsActive=?, AsthaMaAprovedBy=?, AsthaMaAprovalDate=?, AsthaMaRegNo=?
        WHERE AsthaMaRegId=?`;

    const values = [
        data.AsthaMaProfileImage, data.AsthaMaUserName, data.AsthaMaGuardianName, data.AsthaMaDOB, data.AsthaMaGuardianContactNo,
        data.AsthaMaStateName, data.AsthaMaDistName, data.AsthaMaCity, data.AsthaMaBlockName, data.AsthaMaPO, data.AsthaMaPS,
        data.AsthaMaGramPanchayet, data.AsthaMaVillage, data.AsthaMaPincode, data.AsthaMaContactNo, data.AsthaMaMailId,
        data.AsthaMaBankName, data.AsthaMaBranchName, data.AsthaMaBankAcctNo, data.AsthaMaIFSCode, data.AsthaMaPanNo, data.AsthaMaAadharNo,
        data.AsthaMaJoiningAmt, data.AsthaMaWalletBalance, data.AsthaMaSignupUserName, data.AsthaMaSignupEmail, data.AsthaMaSignupPassword,
        data.AsthaMaIsActive, data.AsthaMaAprovedBy, data.AsthaMaAprovalDate, data.AsthaMaRegNo, id
    ];

    db.query(updateQuery, values, (err) => {
        if (err) { console.error("❌ updateAsthaMaa Primary DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        if (data.AsthaMaSignupPassword && data.AsthaMaSignupEmail) {
            const signupQuery = `UPDATE userssignup SET UserSignUpPassword=? WHERE UserSignUpEmail=? AND UserSignUpRole='Astha Maa'`;
            const signupValues = [data.AsthaMaSignupPassword, data.AsthaMaSignupEmail];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Update Signup DB Error (Astha Maa):", signupErr.message);
            });
        }

        res.json({ message: 'Record updated successfully' });
    });
};

exports.deleteAsthaMaa = (req, res) => {
    db.query('DELETE FROM asthama_reg WHERE AsthaMaRegId = ?', [req.params.id], (err) => {
        if (err) { console.error("❌ deleteAsthaMaa DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Record deleted successfully' });
    });
};

// ==========================================
// DISTRICT ADMIN REGISTRATION (dist_ngo_reg)
// ==========================================
exports.getDistrictAdmin = (req, res) => {
    const query = `
        SELECT a.*, 
               DATE_FORMAT(a.DistNGOAprovedDate, '%Y-%m-%d') AS DistNGOAprovedDateRaw,
               DATE_FORMAT(a.DistNGORegDate, '%Y-%m-%d') AS DistNGORegDateRaw,
               u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail 
        FROM \`dist_ngo_reg\` a 
        LEFT JOIN userssignup u ON a.DistNGOAprovedBy = CAST(u.UserSignUpId AS CHAR)
        ORDER BY a.DistNGORegId DESC
    `;
    db.query(query, (err, results) => {
        if (err) { console.error("❌ getDistrictAdmin DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        const mappedResults = results.map(row => {
            let approverDisplayName = row.DistNGOAprovedBy;
            if (row.ApproverName) { approverDisplayName = row.ApproverName; }
            else if (row.ApproverEmail) { approverDisplayName = row.ApproverEmail.split('@')[0]; }
            return {
                ...row,
                ApproverDisplayName: approverDisplayName,
                DistNGOAprovedDate: row.DistNGOAprovedDateRaw || row.DistNGOAprovedDate,
                DistNGORegDate: row.DistNGORegDateRaw || row.DistNGORegDate
            };
        });

        res.json(mappedResults);
    });
};

exports.createDistrictAdmin = (req, res) => {
    const data = req.body;

    const insertQuery = `INSERT INTO dist_ngo_reg 
        (DistNGOName, DistNGORegDate, DistNGORegNo, DistNGOPanNo, DistNGODarpanId, DistNGOMailId, DistNGOPhoneNo, DistNGORegAddress, DistNGOWorkingAddress, DistNGOStateName, DistNGODistName, DistNGOBlockName, DistNGOSDPName, DistNGOSDPMailId, DistNGOSDPPhoneNo, DistNGOSDPAadhaarNo, DistNGOBankAcctHolderName, DistNGOBankName, DistNGOAcctNo, DistNGOIFSCode, DistNGOBankAdd, DistNGORecCertificate, DistNGOPanPic, DistNGODarpanPic, DistNGOSignupUserName, DistNGOSignupEmail, DistNGOSignupPassword, DistNGOCreatedByAuthRegId, DistNGOCreatedDate, StateNGORegId, DistNGOIsActive, DistNGOAprovedBy, DistNGOAprovedDate, DistNGOGenRegNo) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`;

    const values = [
        data.DistNGOName, data.DistNGORegDate, data.DistNGORegNo, data.DistNGOPanNo, data.DistNGODarpanId, data.DistNGOMailId, data.DistNGOPhoneNo, data.DistNGORegAddress, data.DistNGOWorkingAddress, data.DistNGOStateName, data.DistNGODistName, data.DistNGOBlockName, data.DistNGOSDPName, data.DistNGOSDPMailId, data.DistNGOSDPPhoneNo, data.DistNGOSDPAadhaarNo, data.DistNGOBankAcctHolderName, data.DistNGOBankName, data.DistNGOAcctNo, data.DistNGOIFSCode, data.DistNGOBankAdd, data.DistNGORecCertificate, data.DistNGOPanPic, data.DistNGODarpanPic, data.DistNGOSignupUserName, data.DistNGOSignupEmail, data.DistNGOSignupPassword, data.DistNGOCreatedByAuthRegId || null,
        data.StateNGORegId || null, data.DistNGOIsActive || 1, data.DistNGOAprovedBy || null, data.DistNGOAprovedDate || null, data.DistNGOGenRegNo || null
    ];

    db.query(insertQuery, values, (err, result) => {
        if (err) { console.error("❌ createDistrictAdmin Primary DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        if (data.DistNGOSignupUserName && data.DistNGOSignupPassword && data.DistNGOSignupEmail) {
            const signupQuery = `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`;
            const signupValues = ['District Administrator', data.DistNGOSignupUserName, data.DistNGOSignupEmail, data.DistNGOSignupPassword, data.DistNGOCreatedByAuthRegId || null, result.insertId];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Signup DB Error (District Admin):", signupErr.message);
            });
        }

        res.json({ message: 'District Admin added successfully', id: result.insertId });
    });
};

exports.updateDistrictAdmin = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const updateQuery = `UPDATE dist_ngo_reg SET 
        DistNGOName=?, DistNGORegDate=?, DistNGORegNo=?, DistNGOPanNo=?, DistNGODarpanId=?, DistNGOMailId=?, DistNGOPhoneNo=?, DistNGORegAddress=?, DistNGOWorkingAddress=?, DistNGOStateName=?, DistNGODistName=?, DistNGOBlockName=?, DistNGOSDPName=?, DistNGOSDPMailId=?, DistNGOSDPPhoneNo=?, DistNGOSDPAadhaarNo=?, DistNGOBankAcctHolderName=?, DistNGOBankName=?, DistNGOAcctNo=?, DistNGOIFSCode=?, DistNGOBankAdd=?, DistNGORecCertificate=?, DistNGOPanPic=?, DistNGODarpanPic=?, DistNGOSignupUserName=?, DistNGOSignupEmail=?, DistNGOSignupPassword=?, DistNGOIsActive=?, DistNGOAprovedBy=?, DistNGOAprovedDate=?, DistNGOGenRegNo=?
        WHERE DistNGORegId=?`;

    const values = [
        data.DistNGOName, data.DistNGORegDate, data.DistNGORegNo, data.DistNGOPanNo, data.DistNGODarpanId, data.DistNGOMailId, data.DistNGOPhoneNo, data.DistNGORegAddress, data.DistNGOWorkingAddress, data.DistNGOStateName, data.DistNGODistName, data.DistNGOBlockName, data.DistNGOSDPName, data.DistNGOSDPMailId, data.DistNGOSDPPhoneNo, data.DistNGOSDPAadhaarNo, data.DistNGOBankAcctHolderName, data.DistNGOBankName, data.DistNGOAcctNo, data.DistNGOIFSCode, data.DistNGOBankAdd, data.DistNGORecCertificate, data.DistNGOPanPic, data.DistNGODarpanPic, data.DistNGOSignupUserName, data.DistNGOSignupEmail, data.DistNGOSignupPassword, data.DistNGOIsActive, data.DistNGOAprovedBy, data.DistNGOAprovedDate, data.DistNGOGenRegNo, id
    ];

    db.query(updateQuery, values, (err) => {
        if (err) { console.error("❌ updateDistrictAdmin Primary DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        if (data.DistNGOSignupPassword && data.DistNGOSignupEmail) {
            const signupQuery = `UPDATE userssignup SET UserSignUpPassword=? WHERE UserSignUpEmail=? AND UserSignUpRole='District Administrator'`;
            const signupValues = [data.DistNGOSignupPassword, data.DistNGOSignupEmail];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Update Signup DB Error (District Admin):", signupErr.message);
            });
        }

        res.json({ message: 'Record updated successfully' });
    });
};

exports.deleteDistrictAdmin = (req, res) => {
    db.query('DELETE FROM dist_ngo_reg WHERE DistNGORegId = ?', [req.params.id], (err) => {
        if (err) { console.error("❌ deleteDistrictAdmin DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Record deleted successfully' });
    });
};

// ==========================================
// SUPERVISOR REGISTRATION (suvervisor_reg)
// ==========================================
exports.getSupervisor = (req, res) => {
    const query = `
        SELECT a.*, 
               DATE_FORMAT(a.SupAprovedDate, '%Y-%m-%d') AS SupAprovedDateRaw,
               DATE_FORMAT(a.SupDOB, '%Y-%m-%d') AS SupDOBRaw,
               u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail 
        FROM \`suvervisor_reg\` a 
        LEFT JOIN userssignup u ON a.SupAprovedBy = CAST(u.UserSignUpId AS CHAR)
        ORDER BY a.SupRegId DESC
    `;
    db.query(query, (err, results) => {
        if (err) { console.error("❌ getSupervisor DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        const mappedResults = results.map(row => {
            let approverDisplayName = row.SupAprovedBy;
            if (row.ApproverName) { approverDisplayName = row.ApproverName; }
            else if (row.ApproverEmail) { approverDisplayName = row.ApproverEmail.split('@')[0]; }
            return {
                ...row,
                ApproverDisplayName: approverDisplayName,
                SupAprovedDate: row.SupAprovedDateRaw || row.SupAprovedDate,
                SupDOB: row.SupDOBRaw || row.SupDOB
            };
        });

        res.json(mappedResults);
    });
};

exports.createSupervisor = (req, res) => {
    const data = req.body;

    const insertQuery = `INSERT INTO suvervisor_reg (
        SupProfileImage, SupName, SupGuardianName, SupDOB, SupGuardianContactNo, 
        SupStateName, SupDistName, SupCity, SupBlockName, SupPO, SupPS, 
        SupGramPanchayet, SupVillage, SupPincode, SupContactNo, SupMailId, 
        SupBankName, SupBranchName, SupAcctNo, SupIFSCode, SupPanNo, SupAadharNo, 
        SupJoiningAmt, SupWalletBalance, SupSignupUserName, SupSignupEmail, SupSignupPassword,
        SupCreatedByAuthRegId, SupCreatedDate, StateNGORegId, DistNGORegId, SupIsActive, 
        SupAprovedBy, SupAprovedDate, SupRegNo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)`;

    const values = [
        data.SupProfileImage, data.SupName, data.SupGuardianName, data.SupDOB, data.SupGuardianContactNo,
        data.SupStateName, data.SupDistName, data.SupCity, data.SupBlockName, data.SupPO, data.SupPS,
        data.SupGramPanchayet, data.SupVillage, data.SupPincode, data.SupContactNo, data.SupMailId,
        data.SupBankName, data.SupBranchName, data.SupAcctNo, data.SupIFSCode, data.SupPanNo, data.SupAadharNo,
        data.SupJoiningAmt, data.SupWalletBalance, data.SupSignupUserName, data.SupSignupEmail, data.SupSignupPassword,
        data.SupCreatedByAuthRegId || null, data.StateNGORegId || null, data.DistNGORegId || null,
        data.SupIsActive || 1, data.SupAprovedBy || null, data.SupAprovedDate || null, data.SupRegNo || null
    ];

    db.query(insertQuery, values, (err, result) => {
        if (err) { console.error("❌ createSupervisor DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        const newId = result.insertId;

        if (data.SupProfileImage && !data.SupProfileImage.startsWith('ID:')) {
            const taggedImage = `ID:${newId}||${data.SupProfileImage}`;
            db.query('UPDATE suvervisor_reg SET SupProfileImage=? WHERE SupRegId=?', [taggedImage, newId], () => { });
        }

        if (data.SupSignupUserName && data.SupSignupPassword && data.SupSignupEmail) {
            const signupQuery = `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`;
            const signupValues = ['Supervisor', data.SupSignupUserName, data.SupSignupEmail, data.SupSignupPassword, data.SupCreatedByAuthRegId || null, newId];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Signup DB Error (Supervisor):", signupErr.message);
            });
        }

        res.json({ message: 'Supervisor added successfully', id: newId });
    });
};

exports.updateSupervisor = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (data.SupProfileImage && !data.SupProfileImage.startsWith('ID:')) {
        data.SupProfileImage = `ID:${id}||${data.SupProfileImage}`;
    }

    const updateQuery = `UPDATE suvervisor_reg SET 
        SupProfileImage=?, SupName=?, SupGuardianName=?, SupDOB=?, SupGuardianContactNo=?, 
        SupStateName=?, SupDistName=?, SupCity=?, SupBlockName=?, SupPO=?, SupPS=?, 
        SupGramPanchayet=?, SupVillage=?, SupPincode=?, SupContactNo=?, SupMailId=?, 
        SupBankName=?, SupBranchName=?, SupAcctNo=?, SupIFSCode=?, SupPanNo=?, SupAadharNo=?, 
        SupJoiningAmt=?, SupWalletBalance=?, SupSignupUserName=?, SupSignupEmail=?, SupSignupPassword=?,
        SupIsActive=?, SupAprovedBy=?, SupAprovedDate=?, SupRegNo=?
        WHERE SupRegId=?`;

    const values = [
        data.SupProfileImage, data.SupName, data.SupGuardianName, data.SupDOB, data.SupGuardianContactNo,
        data.SupStateName, data.SupDistName, data.SupCity, data.SupBlockName, data.SupPO, data.SupPS,
        data.SupGramPanchayet, data.SupVillage, data.SupPincode, data.SupContactNo, data.SupMailId,
        data.SupBankName, data.SupBranchName, data.SupAcctNo, data.SupIFSCode, data.SupPanNo, data.SupAadharNo,
        data.SupJoiningAmt, data.SupWalletBalance, data.SupSignupUserName, data.SupSignupEmail, data.SupSignupPassword,
        data.SupIsActive, data.SupAprovedBy, data.SupAprovedDate, data.SupRegNo, id
    ];

    db.query(updateQuery, values, (err) => {
        if (err) { console.error("❌ updateSupervisor DB Error:", err.message); return res.status(500).json({ error: err.message }); }

        if (data.SupSignupPassword && data.SupSignupEmail) {
            const signupQuery = `UPDATE userssignup SET UserSignUpPassword=? WHERE UserSignUpEmail=? AND UserSignUpRole='Supervisor'`;
            const signupValues = [data.SupSignupPassword, data.SupSignupEmail];
            db.query(signupQuery, signupValues, (signupErr) => {
                if (signupErr) console.error("❌ Auto-Update Signup DB Error (Supervisor):", signupErr.message);
            });
        }

        res.json({ message: 'Supervisor updated successfully' });
    });
};

exports.deleteSupervisor = (req, res) => {
    db.query('DELETE FROM suvervisor_reg WHERE SupRegId = ?', [req.params.id], (err) => {
        if (err) { console.error("❌ deleteSupervisor DB Error:", err.message); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Supervisor deleted successfully' });
    });
};