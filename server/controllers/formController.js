const db = require('../config/db');

// ==========================================
// DYNAMIC DROPDOWNS
// ==========================================
exports.getStates = (req, res) => {
    db.query('SELECT StateId, StateName FROM state WHERE IsActive = 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getDistricts = (req, res) => {
    const stateId = req.params.stateId;
    db.query('SELECT DistId, DistName FROM dist WHERE StateId = ? AND IsActive = 1', [stateId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// ==========================================
// ASTHA DIDI REGISTRATION
// ==========================================
exports.getAsthaDidi = (req, res) => {
    db.query('SELECT * FROM asthadidireginfo ORDER BY RegInfoId DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.createAsthaDidi = (req, res) => {
    const data = req.body;
    const insertQuery = `INSERT INTO asthadidireginfo
        (ProfileImage, PerName, GuardianName, DOB, GuardianContactNo, StateName, DistName, City, BlockName, PO, PS, GramPanchayet, Village, Pincode, ContactNo, MailId, BankName, BranchName, AcctNo, IFSCode, PanNo, AadharNo, JoiningAmt, WalletBalance, IsActive, AprovedBy, AprovalDate, AsthaDidiRegNo, CreatedBy) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
        data.ProfileImage, data.PerName, data.GuardianName, data.DOB, data.GuardianContactNo, data.StateName, data.DistName, data.City, data.BlockName, data.PO, data.PS, data.GramPanchayet, data.Village, data.Pincode, data.ContactNo, data.MailId, data.BankName, data.BranchName, data.AcctNo, data.IFSCode, data.PanNo, data.AadharNo, data.JoiningAmt, data.WalletBalance, data.IsActive || 1, data.AprovedBy || null, data.AprovalDate || null, data.AsthaDidiRegNo || null, data.CreatedBy
    ];

    db.query(insertQuery, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const newId = result.insertId;
        if (data.ProfileImage && !data.ProfileImage.startsWith('ID:')) {
            const taggedImage = `ID:${newId}||${data.ProfileImage}`;
            db.query('UPDATE asthadidireginfo SET ProfileImage=? WHERE RegInfoId=?', [taggedImage, newId], () => { });
        }
        res.json({ message: 'Astha Didi added successfully', id: newId });
    });
};

exports.updateAsthaDidi = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (data.ProfileImage && !data.ProfileImage.startsWith('ID:')) {
        data.ProfileImage = `ID:${id}||${data.ProfileImage}`;
    }

    const updateQuery = `UPDATE asthadidireginfo SET 
        ProfileImage=?, PerName=?, GuardianName=?, DOB=?, GuardianContactNo=?, StateName=?, DistName=?, City=?, BlockName=?, PO=?, PS=?, GramPanchayet=?, Village=?, Pincode=?, ContactNo=?, MailId=?, BankName=?, BranchName=?, AcctNo=?, IFSCode=?, PanNo=?, AadharNo=?, JoiningAmt=?, WalletBalance=?, IsActive=?, AprovedBy=?, AprovalDate=?, AsthaDidiRegNo=?, CreatedBy=?
        WHERE RegInfoId=?`;

    const values = [
        data.ProfileImage, data.PerName, data.GuardianName, data.DOB, data.GuardianContactNo, data.StateName, data.DistName, data.City, data.BlockName, data.PO, data.PS, data.GramPanchayet, data.Village, data.Pincode, data.ContactNo, data.MailId, data.BankName, data.BranchName, data.AcctNo, data.IFSCode, data.PanNo, data.AadharNo, data.JoiningAmt, data.WalletBalance, data.IsActive, data.AprovedBy, data.AprovalDate, data.AsthaDidiRegNo, data.CreatedBy, id
    ];

    db.query(updateQuery, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record updated successfully' });
    });
};

exports.deleteAsthaDidi = (req, res) => {
    db.query('DELETE FROM asthadidireginfo WHERE RegInfoId = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record deleted successfully' });
    });
};

// ==========================================
// ASTHA MAA REGISTRATION (asthama_reg_info)
// ==========================================
exports.getAsthaMaa = (req, res) => {
    db.query('SELECT * FROM asthama_reg_info ORDER BY RegInfoId DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.createAsthaMaa = (req, res) => {
    const data = req.body;
    const insertQuery = `INSERT INTO asthama_reg_info
        (ProfileImage, PerName, GuardianName, DOB, GuardianContactNo, StateName, DistName, City, BlockName, PO, PS, GramPanchayet, Village, Pincode, ContactNo, MailId, BankName, BranchName, AcctNo, IFSCode, PanNo, AadharNo, JoiningAmt, WalletBalance, IsActive, Status, AprovedBy, AprovalDate, AprovalNumber, CreatedBy) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
        data.ProfileImage, data.PerName, data.GuardianName, data.DOB, data.GuardianContactNo, data.StateName, data.DistName, data.City, data.BlockName, data.PO, data.PS, data.GramPanchayet, data.Village, data.Pincode, data.ContactNo, data.MailId, data.BankName, data.BranchName, data.AcctNo, data.IFSCode, data.PanNo, data.AadharNo, data.JoiningAmt, data.WalletBalance, data.IsActive || 1, data.Status || 1, data.AprovedBy || null, data.AprovalDate || null, data.AprovalNumber || null, data.CreatedBy
    ];

    db.query(insertQuery, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const newId = result.insertId;
        if (data.ProfileImage && !data.ProfileImage.startsWith('ID:')) {
            const taggedImage = `ID:${newId}||${data.ProfileImage}`;
            db.query('UPDATE asthama_reg_info SET ProfileImage=? WHERE RegInfoId=?', [taggedImage, newId], () => { });
        }
        res.json({ message: 'Astha Maa added successfully', id: newId });
    });
};

exports.updateAsthaMaa = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (data.ProfileImage && !data.ProfileImage.startsWith('ID:')) {
        data.ProfileImage = `ID:${id}||${data.ProfileImage}`;
    }

    const updateQuery = `UPDATE asthama_reg_info SET 
        ProfileImage=?, PerName=?, GuardianName=?, DOB=?, GuardianContactNo=?, StateName=?, DistName=?, City=?, BlockName=?, PO=?, PS=?, GramPanchayet=?, Village=?, Pincode=?, ContactNo=?, MailId=?, BankName=?, BranchName=?, AcctNo=?, IFSCode=?, PanNo=?, AadharNo=?, JoiningAmt=?, WalletBalance=?, IsActive=?, Status=?, AprovedBy=?, AprovalDate=?, AprovalNumber=?, CreatedBy=?
        WHERE RegInfoId=?`;

    const values = [
        data.ProfileImage, data.PerName, data.GuardianName, data.DOB, data.GuardianContactNo, data.StateName, data.DistName, data.City, data.BlockName, data.PO, data.PS, data.GramPanchayet, data.Village, data.Pincode, data.ContactNo, data.MailId, data.BankName, data.BranchName, data.AcctNo, data.IFSCode, data.PanNo, data.AadharNo, data.JoiningAmt, data.WalletBalance, data.IsActive, data.Status, data.AprovedBy, data.AprovalDate, data.AprovalNumber, data.CreatedBy, id
    ];

    db.query(updateQuery, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record updated successfully' });
    });
};

exports.deleteAsthaMaa = (req, res) => {
    db.query('DELETE FROM asthama_reg_info WHERE RegInfoId = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record deleted successfully' });
    });
};


// ==========================================
// DISTRICT ADMIN REGISTRATION (dist_ngo_reg)
// ==========================================
exports.getDistrictAdmin = (req, res) => {
    db.query('SELECT * FROM dist_ngo_reg ORDER BY DistNGORegId DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.createDistrictAdmin = (req, res) => {
    const data = req.body;
    
    const insertQuery = `INSERT INTO dist_ngo_reg 
        (DistNGOName, DistNGORegDate, DistNGORegNo, DistNGOPanNo, DistNGODarpanId, DistNGOMailId, DistNGOPhoneNo, DistNGORegAddress, DistNGOWorkingAddress, DistNGOStateName, DistNGODistName, DistNGOSDPName, DistNGOSDPMailId, DistNGOSDPPhoneNo, DistNGOSDPAadhaarNo, DistNGOBankName, DistNGOAcctNo, DistNGOIFSCode, DistNGOBankAdd, DistNGOUserName, DistNGOPassword, CreatedDate, CreatedBy, IsActive, IsLocked) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 1, 0)`;

    const values = [
        data.DistNGOName, data.DistNGORegDate, data.DistNGORegNo, data.DistNGOPanNo, data.DistNGODarpanId, data.DistNGOMailId, data.DistNGOPhoneNo, data.DistNGORegAddress, data.DistNGOWorkingAddress, data.DistNGOStateName, data.DistNGODistName, data.DistNGOSDPName, data.DistNGOSDPMailId, data.DistNGOSDPPhoneNo, data.DistNGOSDPAadhaarNo, data.DistNGOBankName, data.DistNGOAcctNo, data.DistNGOIFSCode, data.DistNGOBankAdd, data.DistNGOUserName, data.DistNGOPassword, data.CreatedBy
    ];

    db.query(insertQuery, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'District Admin added successfully', id: result.insertId });
    });
};

exports.updateDistrictAdmin = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const updateQuery = `UPDATE dist_ngo_reg SET 
        DistNGOName=?, DistNGORegDate=?, DistNGORegNo=?, DistNGOPanNo=?, DistNGODarpanId=?, DistNGOMailId=?, DistNGOPhoneNo=?, DistNGORegAddress=?, DistNGOWorkingAddress=?, DistNGOStateName=?, DistNGODistName=?, DistNGOSDPName=?, DistNGOSDPMailId=?, DistNGOSDPPhoneNo=?, DistNGOSDPAadhaarNo=?, DistNGOBankName=?, DistNGOAcctNo=?, DistNGOIFSCode=?, DistNGOBankAdd=?, DistNGOUserName=?, DistNGOPassword=?, ModifyDate=NOW(), ModifyBy=?, AprovedBy=?, AprovedDate=?, GenRegNumber=?, IsActive=?, IsLocked=?
        WHERE DistNGORegId=?`;

    const values = [
        data.DistNGOName, data.DistNGORegDate, data.DistNGORegNo, data.DistNGOPanNo, data.DistNGODarpanId, data.DistNGOMailId, data.DistNGOPhoneNo, data.DistNGORegAddress, data.DistNGOWorkingAddress, data.DistNGOStateName, data.DistNGODistName, data.DistNGOSDPName, data.DistNGOSDPMailId, data.DistNGOSDPPhoneNo, data.DistNGOSDPAadhaarNo, data.DistNGOBankName, data.DistNGOAcctNo, data.DistNGOIFSCode, data.DistNGOBankAdd, data.DistNGOUserName, data.DistNGOPassword, data.ModifyBy || null, data.AprovedBy || null, data.AprovedDate || null, data.GenRegNumber || null, data.IsActive || 1, data.IsLocked || 0, id
    ];

    db.query(updateQuery, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record updated successfully' });
    });
};

exports.deleteDistrictAdmin = (req, res) => {
    db.query('DELETE FROM dist_ngo_reg WHERE DistNGORegId = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record deleted successfully' });
    });
};

exports.createSupervisor = (req, res) => {
    const data = req.body;
    res.json({ message: 'Supervisor added successfully' });
};