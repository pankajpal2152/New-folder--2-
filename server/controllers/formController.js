const db = require("../config/db");
const { saveBase64File } = require("../utils/fileUploadHelper");

// ==========================================
// LOCATION & ROLE HELPERS
// ==========================================

exports.getStates = (req, res) => {
  db.query(
    "SELECT StateId, StateName FROM state WHERE IsActive = 1",
    (err, results) => {
      if (err) {
        console.error("❌ getStates DB Error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    },
  );
};

exports.getDistricts = (req, res) => {
  const stateId = req.params.stateId;
  db.query(
    "SELECT DistId, DistName FROM dist WHERE StateId = ? AND IsActive = 1",
    [stateId],
    (err, results) => {
      if (err) {
        console.error("❌ getDistricts DB Error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    },
  );
};

exports.getFilterStates = (req, res) => {
  const query = `
        SELECT DISTINCT s.StateId, s.StateName 
        FROM state s 
        INNER JOIN dist_ngo_reg dn 
        ON LOWER(TRIM(s.StateName)) = LOWER(TRIM(dn.DistNGOStateName)) 
        WHERE s.IsActive = 1
    `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ getFilterStates DB Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};

exports.getFilterDistricts = (req, res) => {
  const stateId = req.params.stateId;
  const query = `
        SELECT DISTINCT d.DistId, d.DistName 
        FROM dist d 
        INNER JOIN dist_ngo_reg dn 
        ON LOWER(TRIM(d.DistName)) = LOWER(TRIM(dn.DistNGODistName)) 
        WHERE d.StateId = ? AND d.IsActive = 1
    `;
  db.query(query, [stateId], (err, results) => {
    if (err) {
      console.error("❌ getFilterDistricts DB Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};

// ==========================================
// ASTHA DIDI REGISTRATION
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
    if (err) {
      console.error("❌ getAsthaDidi DB Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    const mappedResults = results.map((row) => {
      let approverDisplayName = row.AsthaDidiAprovedBy;
      if (row.ApproverName) {
        approverDisplayName = row.ApproverName;
      } else if (row.ApproverEmail) {
        approverDisplayName = row.ApproverEmail.split("@")[0];
      }
      return {
        ...row,
        ApproverDisplayName: approverDisplayName,
        AsthaDidiAprovalDate:
          row.AsthaDidiAprovalDateRaw || row.AsthaDidiAprovalDate,
        AsthaDidiDOB: row.AsthaDidiDOBRaw || row.AsthaDidiDOB,
      };
    });
    res.json(mappedResults);
  });
};

exports.createAsthaDidi = (req, res) => {
  const data = req.body;
  const findStateMappingQuery = `SELECT snr.StateNGORegId FROM state_ngo_reg snr JOIN state s ON snr.StateNGOStateId = s.StateId WHERE s.StateName = ? LIMIT 1`;

  db.query(
    findStateMappingQuery,
    [data.AsthaDidiStateName],
    (err, mappingResult) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Database error while resolving State ID." });
      const mappedStateNGORegId =
        mappingResult.length > 0 ? mappingResult[0].StateNGORegId : null;

      const insertQuery = `INSERT INTO \`asthadidi_reg\` (
            AsthaDidiUserName, AsthaDidiGuardianName, AsthaDidiDOB, AsthaDidiGuardianContactNo, 
            AsthaDidiStateName, AsthaDidiDistName, AsthaDidiCity, AsthaDidiBlockName, AsthaDidiPO, AsthaDidiPS, 
            AsthaDidiGramPanchayet, AsthaDidiVillage, AsthaDidiPincode, AsthaDidiContactNo, AsthaDidiMailId, 
            AsthaDidiBankName, AsthaDidiBranchName, AsthaDidiBankAcctNo, AsthaDidiIFSCode, AsthaDidiPanNo, AsthaDidiAadharNo, 
            AsthaDidiJoiningAmt, AsthaDidiWalletBalance, AsthaDidiSignupUserName, AsthaDidiSignupEmail, AsthaDidiSignupPassword, 
            AsthaDidiCreatedByAuthRegId, AsthaDidiCreatedDate, StateNGORegId, DistNGORegId, SupRegId, AsthaDidiIsActive
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?)`;

      const values = [
        data.AsthaDidiUserName,
        data.AsthaDidiGuardianName,
        data.AsthaDidiDOB,
        data.AsthaDidiGuardianContactNo,
        data.AsthaDidiStateName,
        data.AsthaDidiDistName,
        data.AsthaDidiCity,
        data.AsthaDidiBlockName,
        data.AsthaDidiPO,
        data.AsthaDidiPS,
        data.AsthaDidiGramPanchayet,
        data.AsthaDidiVillage,
        data.AsthaDidiPincode,
        data.AsthaDidiContactNo,
        data.AsthaDidiMailId,
        data.AsthaDidiBankName,
        data.AsthaDidiBranchName,
        data.AsthaDidiBankAcctNo,
        data.AsthaDidiIFSCode,
        data.AsthaDidiPanNo,
        data.AsthaDidiAadharNo,
        data.AsthaDidiJoiningAmt,
        data.AsthaDidiWalletBalance,
        data.AsthaDidiSignupUserName,
        data.AsthaDidiSignupEmail,
        data.AsthaDidiSignupPassword,
        data.AsthaDidiCreatedByAuthRegId || null,
        mappedStateNGORegId,
        data.DistNGORegId || null,
        data.SupRegId || null,
        data.AsthaDidiIsActive || 1,
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const newId = result.insertId;

        const fileName = saveBase64File(
          data.AsthaDidiProfileImage,
          "AsthaDidi",
          newId,
          "Profile",
        );
        db.query(
          "UPDATE `asthadidi_reg` SET AsthaDidiProfileImage=? WHERE AsthaDidiRegId=?",
          [fileName, newId],
          () => {},
        );

        if (
          data.AsthaDidiSignupUserName &&
          data.AsthaDidiSignupPassword &&
          data.AsthaDidiSignupEmail
        ) {
          const signupQuery = `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`;
          db.query(
            signupQuery,
            [
              "Astha Didi",
              data.AsthaDidiSignupUserName,
              data.AsthaDidiSignupEmail,
              data.AsthaDidiSignupPassword,
              data.AsthaDidiCreatedByAuthRegId || null,
              newId,
            ],
            () => {},
          );
        }
        res.json({ message: "Astha Didi added successfully", id: newId });
      });
    },
  );
};

exports.updateAsthaDidi = (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const fileName = saveBase64File(
    data.AsthaDidiProfileImage,
    "AsthaDidi",
    id,
    "Profile",
  );

  const updateQuery = `UPDATE \`asthadidi_reg\` SET 
        AsthaDidiProfileImage=?, AsthaDidiUserName=?, AsthaDidiGuardianName=?, AsthaDidiDOB=?, AsthaDidiGuardianContactNo=?, 
        AsthaDidiStateName=?, AsthaDidiDistName=?, AsthaDidiCity=?, AsthaDidiBlockName=?, AsthaDidiPO=?, AsthaDidiPS=?, 
        AsthaDidiGramPanchayet=?, AsthaDidiVillage=?, AsthaDidiPincode=?, AsthaDidiContactNo=?, AsthaDidiMailId=?, 
        AsthaDidiBankName=?, AsthaDidiBranchName=?, AsthaDidiBankAcctNo=?, AsthaDidiIFSCode=?, AsthaDidiPanNo=?, AsthaDidiAadharNo=?, 
        AsthaDidiJoiningAmt=?, AsthaDidiWalletBalance=?, AsthaDidiSignupUserName=?, AsthaDidiSignupEmail=?, AsthaDidiSignupPassword=?, 
        AsthaDidiIsActive=?, AsthaDidiAprovedBy=?, AsthaDidiAprovalDate=?, AsthaDidiRegNo=?
        WHERE AsthaDidiRegId=?`;

  const values = [
    fileName,
    data.AsthaDidiUserName,
    data.AsthaDidiGuardianName,
    data.AsthaDidiDOB,
    data.AsthaDidiGuardianContactNo,
    data.AsthaDidiStateName,
    data.AsthaDidiDistName,
    data.AsthaDidiCity,
    data.AsthaDidiBlockName,
    data.AsthaDidiPO,
    data.AsthaDidiPS,
    data.AsthaDidiGramPanchayet,
    data.AsthaDidiVillage,
    data.AsthaDidiPincode,
    data.AsthaDidiContactNo,
    data.AsthaDidiMailId,
    data.AsthaDidiBankName,
    data.AsthaDidiBranchName,
    data.AsthaDidiBankAcctNo,
    data.AsthaDidiIFSCode,
    data.AsthaDidiPanNo,
    data.AsthaDidiAadharNo,
    data.AsthaDidiJoiningAmt,
    data.AsthaDidiWalletBalance,
    data.AsthaDidiSignupUserName,
    data.AsthaDidiSignupEmail,
    data.AsthaDidiSignupPassword,
    data.AsthaDidiIsActive,
    data.AsthaDidiAprovedBy,
    data.AsthaDidiAprovalDate,
    data.AsthaDidiRegNo,
    id,
  ];

  db.query(updateQuery, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.AsthaDidiSignupPassword && data.AsthaDidiSignupEmail) {
      db.query(
        `UPDATE userssignup SET UserSignUpPassword=? WHERE UserSignUpEmail=? AND UserSignUpRole='Astha Didi'`,
        [data.AsthaDidiSignupPassword, data.AsthaDidiSignupEmail],
        () => {},
      );
    }
    res.json({ message: "Record updated successfully" });
  });
};

exports.deleteAsthaDidi = (req, res) => {
  db.query(
    "DELETE FROM \`asthadidi_reg\` WHERE AsthaDidiRegId = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Record deleted successfully" });
    },
  );
};

// ==========================================
// ASTHA MAA REGISTRATION
// ==========================================

exports.getAsthaMaa = (req, res) => {
  const query = `SELECT a.*, DATE_FORMAT(a.AsthaMaAprovalDate, '%Y-%m-%d') AS AsthaMaAprovalDateRaw, DATE_FORMAT(a.AsthaMaDOB, '%Y-%m-%d') AS AsthaMaDOBRaw, u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail FROM \`asthama_reg\` a LEFT JOIN userssignup u ON a.AsthaMaAprovedBy = CAST(u.UserSignUpId AS CHAR) ORDER BY a.AsthaMaRegId DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      results.map((row) => ({
        ...row,
        ApproverDisplayName:
          row.ApproverName ||
          (row.ApproverEmail
            ? row.ApproverEmail.split("@")[0]
            : row.AsthaMaAprovedBy),
        AsthaMaAprovalDate: row.AsthaMaAprovalDateRaw || row.AsthaMaAprovalDate,
        AsthaMaDOB: row.AsthaMaDOBRaw || row.AsthaMaDOB,
      })),
    );
  });
};

exports.createAsthaMaa = (req, res) => {
  const data = req.body;
  const insertQuery = `INSERT INTO asthama_reg (AsthaMaUserName, AsthaMaGuardianName, AsthaMaDOB, AsthaMaGuardianContactNo, AsthaMaStateName, AsthaMaDistName, AsthaMaCity, AsthaMaBlockName, AsthaMaPO, AsthaMaPS, AsthaMaGramPanchayet, AsthaMaVillage, AsthaMaPincode, AsthaMaContactNo, AsthaMaMailId, AsthaMaBankName, AsthaMaBranchName, AsthaMaBankAcctNo, AsthaMaIFSCode, AsthaMaPanNo, AsthaMaAadharNo, AsthaMaJoiningAmt, AsthaMaWalletBalance, AsthaMaSignupUserName, AsthaMaSignupEmail, AsthaMaSignupPassword, AsthaMaCreatedByAuthRegId, AsthaMaCreatedDate, DistNGORegId, SupRegId, AsthaDidiRegId, AsthaMaIsActive) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?)`;
  const values = [
    data.AsthaMaUserName,
    data.AsthaMaGuardianName,
    data.AsthaMaDOB,
    data.AsthaMaGuardianContactNo,
    data.AsthaMaStateName,
    data.AsthaMaDistName,
    data.AsthaMaCity,
    data.AsthaMaBlockName,
    data.AsthaMaPO,
    data.AsthaMaPS,
    data.AsthaMaGramPanchayet,
    data.AsthaMaVillage,
    data.AsthaMaPincode,
    data.AsthaMaContactNo,
    data.AsthaMaMailId,
    data.AsthaMaBankName,
    data.AsthaMaBranchName,
    data.AsthaMaBankAcctNo,
    data.AsthaMaIFSCode,
    data.AsthaMaPanNo,
    data.AsthaMaAadharNo,
    data.AsthaMaJoiningAmt,
    data.AsthaMaWalletBalance,
    data.AsthaMaSignupUserName,
    data.AsthaMaSignupEmail,
    data.AsthaMaSignupPassword,
    data.AsthaMaCreatedByAuthRegId || null,
    data.DistNGORegId || null,
    data.SupRegId || null,
    data.AsthaDidiRegId || null,
    data.AsthaMaIsActive || 1,
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const newId = result.insertId;
    const fileName = saveBase64File(
      data.AsthaMaProfileImage,
      "AsthaMaa",
      newId,
      "Profile",
    );
    db.query(
      "UPDATE asthama_reg SET AsthaMaProfileImage=? WHERE AsthaMaRegId=?",
      [fileName, newId],
      () => {},
    );
    if (data.AsthaMaSignupUserName) {
      db.query(
        `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [
          "Astha Maa",
          data.AsthaMaSignupUserName,
          data.AsthaMaSignupEmail,
          data.AsthaMaSignupPassword,
          data.AsthaMaCreatedByAuthRegId || null,
          newId,
        ],
        () => {},
      );
    }
    res.json({ message: "Astha Maa added successfully", id: newId });
  });
};

exports.updateAsthaMaa = (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const fileName = saveBase64File(
    data.AsthaMaProfileImage,
    "AsthaMaa",
    id,
    "Profile",
  );
  const query = `UPDATE asthama_reg SET AsthaMaProfileImage=?, AsthaMaUserName=?, AsthaMaGuardianName=?, AsthaMaDOB=?, AsthaMaGuardianContactNo=?, AsthaMaStateName=?, AsthaMaDistName=?, AsthaMaCity=?, AsthaMaBlockName=?, AsthaMaPO=?, AsthaMaPS=?, AsthaMaGramPanchayet=?, AsthaMaVillage=?, AsthaMaPincode=?, AsthaMaContactNo=?, AsthaMaMailId=?, AsthaMaBankName=?, AsthaMaBranchName=?, AsthaMaBankAcctNo=?, AsthaMaIFSCode=?, AsthaMaPanNo=?, AsthaMaAadharNo=?, AsthaMaJoiningAmt=?, AsthaMaWalletBalance=?, AsthaMaSignupUserName=?, AsthaMaSignupEmail=?, AsthaMaSignupPassword=?, DistNGORegId=?, SupRegId=?, AsthaDidiRegId=?, AsthaMaIsActive=?, AsthaMaAprovedBy=?, AsthaMaAprovalDate=?, AsthaMaRegNo=? WHERE AsthaMaRegId=?`;
  const values = [
    fileName,
    data.AsthaMaUserName,
    data.AsthaMaGuardianName,
    data.AsthaMaDOB,
    data.AsthaMaGuardianContactNo,
    data.AsthaMaStateName,
    data.AsthaMaDistName,
    data.AsthaMaCity,
    data.AsthaMaBlockName,
    data.AsthaMaPO,
    data.AsthaMaPS,
    data.AsthaMaGramPanchayet,
    data.AsthaMaVillage,
    data.AsthaMaPincode,
    data.AsthaMaContactNo,
    data.AsthaMaMailId,
    data.AsthaMaBankName,
    data.AsthaMaBranchName,
    data.AsthaMaBankAcctNo,
    data.AsthaMaIFSCode,
    data.AsthaMaPanNo,
    data.AsthaMaAadharNo,
    data.AsthaMaJoiningAmt,
    data.AsthaMaWalletBalance,
    data.AsthaMaSignupUserName,
    data.AsthaMaSignupEmail,
    data.AsthaMaSignupPassword,
    data.DistNGORegId || null,
    data.SupRegId || null,
    data.AsthaDidiRegId || null,
    data.AsthaMaIsActive,
    data.AsthaMaAprovedBy,
    data.AsthaMaAprovalDate,
    data.AsthaMaRegNo,
    id,
  ];
  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Record updated successfully" });
  });
};

exports.deleteAsthaMaa = (req, res) => {
  db.query(
    "DELETE FROM asthama_reg WHERE AsthaMaRegId = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Record deleted successfully" });
    },
  );
};

// ==========================================
// DISTRICT ADMIN REGISTRATION
// ==========================================

exports.getDistrictAdmin = (req, res) => {
  const query = `SELECT a.*, DATE_FORMAT(a.DistNGOAprovedDate, '%Y-%m-%d') AS DistNGOAprovedDateRaw, DATE_FORMAT(a.DistNGORegDate, '%Y-%m-%d') AS DistNGORegDateRaw, u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail FROM \`dist_ngo_reg\` a LEFT JOIN userssignup u ON a.DistNGOAprovedBy = CAST(u.UserSignUpId AS CHAR) ORDER BY a.DistNGORegId DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      results.map((row) => ({
        ...row,
        ApproverDisplayName:
          row.ApproverName ||
          (row.ApproverEmail
            ? row.ApproverEmail.split("@")[0]
            : row.DistNGOAprovedBy),
        DistNGOAprovedDate: row.DistNGOAprovedDateRaw || row.DistNGOAprovedDate,
        DistNGORegDate: row.DistNGORegDateRaw || row.DistNGORegDate,
      })),
    );
  });
};

exports.createDistrictAdmin = (req, res) => {
  const data = req.body;
  const insertQuery = `INSERT INTO dist_ngo_reg (DistNGOName, DistNGORegDate, DistNGORegNo, DistNGOPanNo, DistNGODarpanId, DistNGOMailId, DistNGOPhoneNo, DistNGORegAddress, DistNGOWorkingAddress, DistNGOStateName, DistNGODistName, DistNGOBlockName, DistNGOSDPName, DistNGOSDPMailId, DistNGOSDPPhoneNo, DistNGOSDPAadhaarNo, DistNGOBankAcctHolderName, DistNGOBankName, DistNGOAcctNo, DistNGOIFSCode, DistNGOBankAdd, DistNGOSignupUserName, DistNGOSignupEmail, DistNGOSignupPassword, DistNGOCreatedByAuthRegId, DistNGOCreatedDate, DistNGOIsActive, StateNGORegId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`;
  const values = [
    data.DistNGOName,
    data.DistNGORegDate,
    data.DistNGORegNo,
    data.DistNGOPanNo,
    data.DistNGODarpanId,
    data.DistNGOMailId,
    data.DistNGOPhoneNo,
    data.DistNGORegAddress,
    data.DistNGOWorkingAddress,
    data.DistNGOStateName,
    data.DistNGODistName,
    data.DistNGOBlockName,
    data.DistNGOSDPName,
    data.DistNGOSDPMailId,
    data.DistNGOSDPPhoneNo,
    data.DistNGOSDPAadhaarNo,
    data.DistNGOBankAcctHolderName,
    data.DistNGOBankName,
    data.DistNGOAcctNo,
    data.DistNGOIFSCode,
    data.DistNGOBankAdd,
    data.DistNGOSignupUserName,
    data.DistNGOSignupEmail,
    data.DistNGOSignupPassword,
    data.DistNGOCreatedByAuthRegId || null,
    data.DistNGOIsActive || 1,
    data.StateNGORegId || null,
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const newId = result.insertId;

    const regCert = saveBase64File(
      data.DistNGORecCertificate,
      "DistNGO",
      newId,
      "RegCert",
    );
    const panPic = saveBase64File(
      data.DistNGOPanPic,
      "DistNGO",
      newId,
      "PanCard",
    );
    const darpanPic = saveBase64File(
      data.DistNGODarpanPic,
      "DistNGO",
      newId,
      "Darpan",
    );

    db.query(
      "UPDATE dist_ngo_reg SET DistNGORecCertificate=?, DistNGOPanPic=?, DistNGODarpanPic=? WHERE DistNGORegId=?",
      [regCert, panPic, darpanPic, newId],
      () => {},
    );

    if (data.DistNGOSignupUserName) {
      db.query(
        `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [
          "District Administrator",
          data.DistNGOSignupUserName,
          data.DistNGOSignupEmail,
          data.DistNGOSignupPassword,
          data.DistNGOCreatedByAuthRegId || null,
          newId,
        ],
        () => {},
      );
    }
    res.json({ message: "District Admin added successfully", id: newId });
  });
};

exports.updateDistrictAdmin = (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const regCert = saveBase64File(
    data.DistNGORecCertificate,
    "DistNGO",
    id,
    "RegCert",
  );
  const panPic = saveBase64File(data.DistNGOPanPic, "DistNGO", id, "PanCard");
  const darpanPic = saveBase64File(
    data.DistNGODarpanPic,
    "DistNGO",
    id,
    "Darpan",
  );

  const query = `UPDATE dist_ngo_reg SET DistNGOName=?, DistNGORegDate=?, DistNGORegNo=?, DistNGOPanNo=?, DistNGODarpanId=?, DistNGOMailId=?, DistNGOPhoneNo=?, DistNGORegAddress=?, DistNGOWorkingAddress=?, DistNGOStateName=?, DistNGODistName=?, DistNGOBlockName=?, DistNGOSDPName=?, DistNGOSDPMailId=?, DistNGOSDPPhoneNo=?, DistNGOSDPAadhaarNo=?, DistNGOBankAcctHolderName=?, DistNGOBankName=?, DistNGOAcctNo=?, DistNGOIFSCode=?, DistNGOBankAdd=?, DistNGORecCertificate=?, DistNGOPanPic=?, DistNGODarpanPic=?, DistNGOSignupUserName=?, DistNGOSignupEmail=?, DistNGOSignupPassword=?, DistNGOIsActive=?, DistNGOAprovedBy=?, DistNGOAprovedDate=?, DistNGOGenRegNo=? WHERE DistNGORegId=?`;
  const values = [
    data.DistNGOName,
    data.DistNGORegDate,
    data.DistNGORegNo,
    data.DistNGOPanNo,
    data.DistNGODarpanId,
    data.DistNGOMailId,
    data.DistNGOPhoneNo,
    data.DistNGORegAddress,
    data.DistNGOWorkingAddress,
    data.DistNGOStateName,
    data.DistNGODistName,
    data.DistNGOBlockName,
    data.DistNGOSDPName,
    data.DistNGOSDPMailId,
    data.DistNGOSDPPhoneNo,
    data.DistNGOSDPAadhaarNo,
    data.DistNGOBankAcctHolderName,
    data.DistNGOBankName,
    data.DistNGOAcctNo,
    data.DistNGOIFSCode,
    data.DistNGOBankAdd,
    regCert,
    panPic,
    darpanPic,
    data.DistNGOSignupUserName,
    data.DistNGOSignupEmail,
    data.DistNGOSignupPassword,
    data.DistNGOIsActive,
    data.DistNGOAprovedBy,
    data.DistNGOAprovedDate,
    data.DistNGOGenRegNo,
    id,
  ];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Record updated successfully" });
  });
};

exports.deleteDistrictAdmin = (req, res) => {
  db.query(
    "DELETE FROM dist_ngo_reg WHERE DistNGORegId = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Record deleted successfully" });
    },
  );
};

// ==========================================
// SUPERVISOR REGISTRATION
// ==========================================

exports.getSupervisor = (req, res) => {
  const query = `SELECT a.*, DATE_FORMAT(a.SupAprovedDate, '%Y-%m-%d') AS SupAprovedDateRaw, DATE_FORMAT(a.SupDOB, '%Y-%m-%d') AS SupDOBRaw, u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail FROM \`suvervisor_reg\` a LEFT JOIN userssignup u ON a.SupAprovedBy = CAST(u.UserSignUpId AS CHAR) ORDER BY a.SupRegId DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      results.map((row) => ({
        ...row,
        ApproverDisplayName:
          row.ApproverName ||
          (row.ApproverEmail
            ? row.ApproverEmail.split("@")[0]
            : row.SupAprovedBy),
        SupAprovedDate: row.SupAprovedDateRaw || row.SupAprovedDate,
        SupDOB: row.SupDOBRaw || row.SupDOB,
      })),
    );
  });
};

exports.createSupervisor = (req, res) => {
  const data = req.body;
  const insertQuery = `INSERT INTO suvervisor_reg (SupName, SupGuardianName, SupDOB, SupGuardianContactNo, SupStateName, SupDistName, SupCity, SupBlockName, SupPO, SupPS, SupGramPanchayet, SupVillage, SupPincode, SupContactNo, SupMailId, SupBankName, SupBranchName, SupAcctNo, SupIFSCode, SupPanNo, SupAadharNo, SupJoiningAmt, SupWalletBalance, SupSignupUserName, SupSignupEmail, SupSignupPassword, SupCreatedByAuthRegId, SupCreatedDate, DistNGORegId, SupIsActive) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)`;
  const values = [
    data.SupName,
    data.SupGuardianName,
    data.SupDOB,
    data.SupGuardianContactNo,
    data.SupStateName,
    data.SupDistName,
    data.SupCity,
    data.SupBlockName,
    data.SupPO,
    data.SupPS,
    data.SupGramPanchayet,
    data.SupVillage,
    data.SupPincode,
    data.SupContactNo,
    data.SupMailId,
    data.SupBankName,
    data.SupBranchName,
    data.SupAcctNo,
    data.SupIFSCode,
    data.SupPanNo,
    data.SupAadharNo,
    data.SupJoiningAmt,
    data.SupWalletBalance,
    data.SupSignupUserName,
    data.SupSignupEmail,
    data.SupSignupPassword,
    data.SupCreatedByAuthRegId || null,
    data.DistNGORegId || null,
    data.SupIsActive || 1,
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const newId = result.insertId;
    const fileName = saveBase64File(
      data.SupProfileImage,
      "Supervisor",
      newId,
      "Profile",
    );
    db.query(
      "UPDATE suvervisor_reg SET SupProfileImage=? WHERE SupRegId=?",
      [fileName, newId],
      () => {},
    );
    if (data.SupSignupUserName) {
      db.query(
        `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [
          "Supervisor",
          data.SupSignupUserName,
          data.SupSignupEmail,
          data.SupSignupPassword,
          data.SupCreatedByAuthRegId || null,
          newId,
        ],
        () => {},
      );
    }
    res.json({ message: "Supervisor added successfully", id: newId });
  });
};

exports.updateSupervisor = (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const fileName = saveBase64File(
    data.SupProfileImage,
    "Supervisor",
    id,
    "Profile",
  );
  const query = `UPDATE suvervisor_reg SET SupProfileImage=?, SupName=?, SupGuardianName=?, SupDOB=?, SupGuardianContactNo=?, SupStateName=?, SupDistName=?, SupCity=?, SupBlockName=?, SupPO=?, SupPS=?, SupGramPanchayet=?, SupVillage=?, SupPincode=?, SupContactNo=?, SupMailId=?, SupBankName=?, SupBranchName=?, SupAcctNo=?, SupIFSCode=?, SupPanNo=?, SupAadharNo=?, SupJoiningAmt=?, SupWalletBalance=?, SupSignupUserName=?, SupSignupEmail=?, SupSignupPassword=?, DistNGORegId=?, SupIsActive=?, SupAprovedBy=?, SupAprovedDate=?, SupRegNo=? WHERE SupRegId=?`;
  const values = [
    fileName,
    data.SupName,
    data.SupGuardianName,
    data.SupDOB,
    data.SupGuardianContactNo,
    data.SupStateName,
    data.SupDistName,
    data.SupCity,
    data.SupBlockName,
    data.SupPO,
    data.SupPS,
    data.SupGramPanchayet,
    data.SupVillage,
    data.SupPincode,
    data.SupContactNo,
    data.SupMailId,
    data.SupBankName,
    data.SupBranchName,
    data.SupAcctNo,
    data.SupIFSCode,
    data.SupPanNo,
    data.SupAadharNo,
    data.SupJoiningAmt,
    data.SupWalletBalance,
    data.SupSignupUserName,
    data.SupSignupEmail,
    data.SupSignupPassword,
    data.DistNGORegId || null,
    data.SupIsActive,
    data.SupAprovedBy,
    data.SupAprovedDate,
    data.SupRegNo,
    id,
  ];
  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Supervisor updated successfully" });
  });
};

exports.deleteSupervisor = (req, res) => {
  db.query(
    "DELETE FROM suvervisor_reg WHERE SupRegId = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Supervisor deleted successfully" });
    },
  );
};

exports.checkDuplicate = (req, res) => {
  const { table, column, value, idColumn, idValue } = req.body;

  const allowed = {
    asthadidi_reg: [
      "AsthaDidiMailId",
      "AsthaDidiSignupUserName",
      "AsthaDidiAadharNo",
    ],
    asthama_reg: ["AsthaMaMailId", "AsthaMaSignupUserName", "AsthaMaAadharNo"],
    suvervisor_reg: ["SupMailId", "SupSignupUserName", "SupAadharNo"],
    dist_ngo_reg: [
      "DistNGOMailId",
      "DistNGOSignupUserName",
      "DistNGOSDPAadhaarNo",
    ],
  };

  if (!allowed[table] || !allowed[table].includes(column)) {
    return res.status(400).json({ error: "Invalid check parameters" });
  }

  let query = `SELECT * FROM ?? WHERE ?? = ?`;
  let params = [table, column, value];

  if (idColumn && idValue) {
    query += ` AND ?? != ?`;
    params.push(idColumn, idValue);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Duplicate Check Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ exists: results.length > 0 });
  });
};

// ==========================================
// NEW: PRODUCT DISTRIBUTION MODULE
// ==========================================

exports.getAccountHeads = (req, res) => {
  db.query(
    "SELECT * FROM accthead WHERE IsActive = 'T' OR IsActive = '1' OR IsActive = 1",
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    },
  );
};

exports.getAccountsMapping = (req, res) => {
  db.query("SELECT * FROM accounts", (err, results) => {
    if (err) return res.json([]);
    res.json(results);
  });
};

exports.getActiveProducts = (req, res) => {
  db.query(
    "SELECT * FROM product WHERE IsActive = 'T' OR IsActive = '1' OR IsActive = 1",
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    },
  );
};

exports.getProductStock = (req, res) => {
  // DYNAMIC STOCK CALCULATION BASED ON TRANSACTIONS
  const query = `
    SELECT SUM(Deposit) -SUM(Withdraw) AS Total_Amount FROM transaction WHERE AcctHead='dN' AND AcctNo=1
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ getProductStock Error:", err);
      return res.json([]);
    }
    res.json(results);
  });
};

exports.getJuniorsForDistribution = (req, res) => {
  const { role, profileId } = req.query;
  let query = "";
  let params = [];

  if (role === "State Super Administrator") {
    query = `SELECT DistNGORegId AS id, DistNGOName AS name FROM dist_ngo_reg WHERE DistNGOIsActive != 0 OR DistNGOIsActive IS NULL`;
  } else if (role === "District Administrator") {
    query = `SELECT SupRegId AS id, SupName AS name FROM suvervisor_reg WHERE DistNGORegId = ? AND (SupIsActive != 0 OR SupIsActive IS NULL)`;
    params = [profileId];
  } else if (role === "Supervisor") {
    query = `SELECT AsthaDidiRegId AS id, AsthaDidiUserName AS name FROM asthadidi_reg WHERE SupRegId = ? AND (AsthaDidiIsActive != 0 OR AsthaDidiIsActive IS NULL)`;
    params = [profileId];
  } else if (role === "Astha Didi") {
    query = `SELECT AsthaMaRegId AS id, AsthaMaUserName AS name FROM asthama_reg WHERE AsthaDidiRegId = ? AND (AsthaMaIsActive != 0 OR AsthaMaIsActive IS NULL)`;
    params = [profileId];
  } else {
    return res.json([]);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getSupervisorsByDist = (req, res) => {
  const { distId } = req.params;
  db.query(
    "SELECT SupRegId AS id, SupName AS name, 'SV' as Head FROM suvervisor_reg WHERE DistNGORegId = ? AND (SupIsActive != 0 OR SupIsActive IS NULL)",
    [distId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

exports.distributeProduct = (req, res) => {
  const {
    SenderId,
    ReceiverId,
    ReceiverRole,
    ProductName,
    DistributedQty,
    Remarks,
    SupervisorId,
  } = req.body;

  const insertQuery = `INSERT INTO product_distribution (SenderId, ReceiverId, ReceiverRole, ProductName, DistributedQty, Remarks, ProductDate, SupervisorId) VALUES (?,?,?,?,?,?,NOW(),?)`;

  db.query(
    insertQuery,
    [
      SenderId,
      ReceiverId,
      ReceiverRole,
      ProductName,
      DistributedQty,
      Remarks,
      SupervisorId || null,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Insert into transaction log
      db.query(
        "INSERT INTO transaction (TrnDate, AcctNo, AcctHead, ProId, Withdraw, DrCr, TrnType) VALUES (NOW(), ?, ?, (SELECT ProId FROM product WHERE ProName = ?), ?, 'Dr', 'TRANSFER')",
        [ReceiverId, ReceiverRole, ProductName, DistributedQty],
        () => {},
      );
      res.json({ message: "Product distributed successfully" });
    },
  );
};

exports.getDistributionHistory = (req, res) => {
  const { senderId } = req.query;
  db.query(
    "SELECT * FROM product_distribution WHERE SenderId = ? ORDER BY ProductDate DESC LIMIT 10",
    [senderId],
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    },
  );
};
