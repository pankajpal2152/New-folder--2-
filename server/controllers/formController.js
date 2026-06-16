const db = require("../config/db");
const { saveBase64File } = require("../utils/fileUploadHelper");

const nullableId = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};

const isInactive = (value) => String(value) === "0";

const signupRoles = {
  SN: "State Super Administrator",
  DN: "District Administrator",
  SV: "Supervisor",
  AD: "Astha Didi",
  AM: "Astha Maa",
};

const signupCascadeQueries = {
  SN: {
    query: `
      UPDATE userssignup u
      SET UserSignIsActive = 0
      WHERE (u.UserSignUpRole = ? AND u.ProfileRegId = ?)
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1 FROM dist_ngo_reg d
                WHERE d.DistNGORegId = u.ProfileRegId
                  AND d.StateNGORegId = ?
              )
            )
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1
                FROM suvervisor_reg s
                LEFT JOIN dist_ngo_reg d ON s.DistNGORegId = d.DistNGORegId
                WHERE s.SupRegId = u.ProfileRegId
                  AND (s.StateNGORegId = ? OR d.StateNGORegId = ?)
              )
            )
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1
                FROM asthadidi_reg ad
                LEFT JOIN suvervisor_reg s ON ad.SupRegId = s.SupRegId
                LEFT JOIN dist_ngo_reg d
                  ON COALESCE(ad.DistNGORegId, s.DistNGORegId) = d.DistNGORegId
                WHERE ad.AsthaDidiRegId = u.ProfileRegId
                  AND (
                    ad.StateNGORegId = ?
                    OR s.StateNGORegId = ?
                    OR d.StateNGORegId = ?
                  )
              )
            )
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1
                FROM asthama_reg am
                LEFT JOIN asthadidi_reg ad ON am.AsthaDidiRegId = ad.AsthaDidiRegId
                LEFT JOIN suvervisor_reg s
                  ON COALESCE(am.SupRegId, ad.SupRegId) = s.SupRegId
                LEFT JOIN dist_ngo_reg d
                  ON COALESCE(am.DistNGORegId, ad.DistNGORegId, s.DistNGORegId) = d.DistNGORegId
                WHERE am.AsthaMaRegId = u.ProfileRegId
                  AND (
                    am.StateNGORegId = ?
                    OR ad.StateNGORegId = ?
                    OR s.StateNGORegId = ?
                    OR d.StateNGORegId = ?
                  )
              )
            )
    `,
    params: (id) => [
      signupRoles.SN,
      id,
      signupRoles.DN,
      id,
      signupRoles.SV,
      id,
      id,
      signupRoles.AD,
      id,
      id,
      id,
      signupRoles.AM,
      id,
      id,
      id,
      id,
    ],
  },
  DN: {
    query: `
      UPDATE userssignup u
      SET UserSignIsActive = 0
      WHERE (u.UserSignUpRole = ? AND u.ProfileRegId = ?)
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1 FROM suvervisor_reg s
                WHERE s.SupRegId = u.ProfileRegId
                  AND s.DistNGORegId = ?
              )
            )
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1
                FROM asthadidi_reg ad
                LEFT JOIN suvervisor_reg s ON ad.SupRegId = s.SupRegId
                WHERE ad.AsthaDidiRegId = u.ProfileRegId
                  AND (ad.DistNGORegId = ? OR s.DistNGORegId = ?)
              )
            )
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1
                FROM asthama_reg am
                LEFT JOIN asthadidi_reg ad ON am.AsthaDidiRegId = ad.AsthaDidiRegId
                LEFT JOIN suvervisor_reg s
                  ON COALESCE(am.SupRegId, ad.SupRegId) = s.SupRegId
                WHERE am.AsthaMaRegId = u.ProfileRegId
                  AND (
                    am.DistNGORegId = ?
                    OR ad.DistNGORegId = ?
                    OR s.DistNGORegId = ?
                  )
              )
            )
    `,
    params: (id) => [
      signupRoles.DN,
      id,
      signupRoles.SV,
      id,
      signupRoles.AD,
      id,
      id,
      signupRoles.AM,
      id,
      id,
      id,
    ],
  },
  SV: {
    query: `
      UPDATE userssignup u
      SET UserSignIsActive = 0
      WHERE (u.UserSignUpRole = ? AND u.ProfileRegId = ?)
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1 FROM asthadidi_reg ad
                WHERE ad.AsthaDidiRegId = u.ProfileRegId
                  AND ad.SupRegId = ?
              )
            )
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1
                FROM asthama_reg am
                LEFT JOIN asthadidi_reg ad ON am.AsthaDidiRegId = ad.AsthaDidiRegId
                WHERE am.AsthaMaRegId = u.ProfileRegId
                  AND (am.SupRegId = ? OR ad.SupRegId = ?)
              )
            )
    `,
    params: (id) => [
      signupRoles.SV,
      id,
      signupRoles.AD,
      id,
      signupRoles.AM,
      id,
      id,
    ],
  },
  AD: {
    query: `
      UPDATE userssignup u
      SET UserSignIsActive = 0
      WHERE (u.UserSignUpRole = ? AND u.ProfileRegId = ?)
         OR (
              u.UserSignUpRole = ?
              AND EXISTS (
                SELECT 1 FROM asthama_reg am
                WHERE am.AsthaMaRegId = u.ProfileRegId
                  AND am.AsthaDidiRegId = ?
              )
            )
    `,
    params: (id) => [signupRoles.AD, id, signupRoles.AM, id],
  },
  AM: {
    query: `
      UPDATE userssignup u
      SET UserSignIsActive = 0
      WHERE u.UserSignUpRole = ? AND u.ProfileRegId = ?
    `,
    params: (id) => [signupRoles.AM, id],
  },
};

const deactivateHierarchyUserSignups = (
  acctHead,
  acctNo,
  callback = () => {},
) => {
  const queryConfig = signupCascadeQueries[acctHead];
  const profileId = nullableId(acctNo);
  if (!queryConfig || !profileId) return callback();
  db.query(queryConfig.query, queryConfig.params(profileId), callback);
};

const deactivateHierarchyUserSignupsIfInactive = (
  activeValue,
  acctHead,
  acctNo,
  callback = () => {},
) => {
  if (!isInactive(activeValue)) return callback();
  deactivateHierarchyUserSignups(acctHead, acctNo, callback);
};

const syncAccountRecord = (
  {
    acctNo,
    acctHead,
    acctName,
    stateNgoId,
    districtNgoId,
    supervisorId,
    asthaDidiId,
    asthaMaaId,
  },
  callback = () => {},
) => {
  if (!acctNo || !acctHead) return callback();

  const query = `
    INSERT INTO accounts (
      AcctNo, AcctHead, AcctName, SNGOAcctNo, DNGOAcctNo,
      SVAcctNo, ADAcctNo, AMAcctNo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      AcctName = VALUES(AcctName),
      SNGOAcctNo = COALESCE(VALUES(SNGOAcctNo), SNGOAcctNo),
      DNGOAcctNo = COALESCE(VALUES(DNGOAcctNo), DNGOAcctNo),
      SVAcctNo = COALESCE(VALUES(SVAcctNo), SVAcctNo),
      ADAcctNo = COALESCE(VALUES(ADAcctNo), ADAcctNo),
      AMAcctNo = COALESCE(VALUES(AMAcctNo), AMAcctNo)
  `;

  db.query(
    query,
    [
      nullableId(acctNo),
      acctHead,
      acctName || "",
      nullableId(stateNgoId),
      nullableId(districtNgoId),
      nullableId(supervisorId),
      nullableId(asthaDidiId),
      nullableId(asthaMaaId),
    ],
    callback,
  );
};

const deleteAccountRecord = (acctNo, acctHead, callback = () => {}) => {
  if (!acctNo || !acctHead) return callback();
  db.query(
    "DELETE FROM accounts WHERE AcctNo = ? AND AcctHead = ?",
    [acctNo, acctHead],
    callback,
  );
};

const syncOrDeleteAccountRecord = (activeValue, accountPayload, callback) => {
  if (isInactive(activeValue)) {
    return deleteAccountRecord(
      accountPayload.acctNo,
      accountPayload.acctHead,
      callback,
    );
  }
  return syncAccountRecord(accountPayload, callback);
};

const resolveStateNgoId = (data, callback) => {
  const directStateNgoId =
    data.StateNGORegId ||
    data.ResolvedStateNGORegId ||
    data.ParentStateNGORegId;
  if (directStateNgoId) return callback(null, directStateNgoId);

  const query = `
    SELECT StateNGORegId
    FROM (
      SELECT d.StateNGORegId, 1 AS SortOrder FROM dist_ngo_reg d WHERE d.DistNGORegId = ?
      UNION ALL
      SELECT COALESCE(s.StateNGORegId, d.StateNGORegId) AS StateNGORegId, 2 AS SortOrder FROM suvervisor_reg s LEFT JOIN dist_ngo_reg d ON s.DistNGORegId = d.DistNGORegId WHERE s.SupRegId = ?
      UNION ALL
      SELECT COALESCE(a.StateNGORegId, s.StateNGORegId, d.StateNGORegId) AS StateNGORegId, 3 AS SortOrder FROM asthadidi_reg a LEFT JOIN suvervisor_reg s ON a.SupRegId = s.SupRegId LEFT JOIN dist_ngo_reg d ON a.DistNGORegId = d.DistNGORegId WHERE a.AsthaDidiRegId = ?
    ) resolved
    WHERE StateNGORegId IS NOT NULL
    ORDER BY SortOrder LIMIT 1
  `;

  db.query(
    query,
    [
      data.DistNGORegId || null,
      data.SupRegId || null,
      data.AsthaDidiRegId || null,
    ],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]?.StateNGORegId || null);
    },
  );
};

const resolveStateNgoIdForAccount = (data, fallbackStateNgoId, callback) => {
  if (fallbackStateNgoId) return callback(null, fallbackStateNgoId);
  return resolveStateNgoId(data, callback);
};

// ==========================================
// LOCATION & ROLE HELPERS
// ==========================================
exports.getStates = (req, res) => {
  db.query(
    "SELECT StateId, StateName FROM state WHERE IsActive = 1",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

exports.getDistricts = (req, res) => {
  db.query(
    "SELECT DistId, DistName FROM dist WHERE StateId = ? AND IsActive = 1",
    [req.params.stateId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

exports.getFilterStates = (req, res) => {
  const query = `SELECT DISTINCT s.StateId, s.StateName FROM state s INNER JOIN dist_ngo_reg dn ON LOWER(TRIM(s.StateName)) = LOWER(TRIM(dn.DistNGOStateName)) WHERE s.IsActive = 1`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getFilterDistricts = (req, res) => {
  const query = `SELECT DISTINCT d.DistId, d.DistName FROM dist d INNER JOIN dist_ngo_reg dn ON LOWER(TRIM(d.DistName)) = LOWER(TRIM(dn.DistNGODistName)) WHERE d.StateId = ? AND d.IsActive = 1`;
  db.query(query, [req.params.stateId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ==========================================
// NATIONAL NGO & STATE SUPER ADMINISTRATION
// ==========================================
exports.getNationalNgos = (req, res) => {
  db.query(
    "SELECT AcctId, AcctNo, AcctHead, AcctName, SignupEmail, CONCAT(AcctName, ' (', TRIM(SignupEmail), ')') AS DisplayName FROM nngo WHERE IsActive = 'T' OR IsActive = '1' OR IsActive = 1 ORDER BY AcctName ASC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

exports.getStateNgo = (req, res) => {
  const query = `
    SELECT a.*, DATE_FORMAT(a.StateNGORegDate, '%Y-%m-%d') AS StateNGORegDateRaw, DATE_FORMAT(a.StateNGOAprovedDate, '%Y-%m-%d') AS StateNGOAprovedDateRaw, s.StateName AS StateNGOStateName, d.DistName AS StateNGODistName, n.AcctName AS NationalNgoName, n.SignupEmail AS NationalNgoEmail, approverNngo.AcctName AS NationalApproverName, approverUser.SignupUserName AS UserApproverName, approverUser.UserSignUpEmail AS UserApproverEmail
    FROM state_ngo_reg a
    LEFT JOIN state s ON a.StateNGOStateId = s.StateId
    LEFT JOIN dist d ON a.StateNGODistId = d.DistId
    LEFT JOIN nngo n ON a.AcctId = n.AcctId
    LEFT JOIN nngo approverNngo ON a.StateNGOAprovedBy = approverNngo.AcctId
    LEFT JOIN userssignup approverUser ON a.StateNGOAprovedBy = approverUser.UserSignUpId
    ORDER BY a.StateNGORegId DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      results.map((row) => ({
        ...row,
        ApproverDisplayName:
          row.NationalApproverName ||
          row.UserApproverName ||
          (row.UserApproverEmail
            ? row.UserApproverEmail.split("@")[0]
            : row.StateNGOAprovedBy),
        StateNGORegDate: row.StateNGORegDateRaw || row.StateNGORegDate,
        StateNGOAprovedDate:
          row.StateNGOAprovedDateRaw || row.StateNGOAprovedDate,
      })),
    );
  });
};

exports.createStateNgo = (req, res) => {
  const data = req.body;
  const activeValue =
    data.StateNGOIsActive === undefined || data.StateNGOIsActive === null
      ? 1
      : data.StateNGOIsActive;
  const insertQuery = `INSERT INTO state_ngo_reg (StateNGOName, StateNGORegNo, StateNGORegDate, StateNGOSDPName, StateNGOMailId, StateNGOPhoneNo, StateNGOStateId, StateNGODistId, StateNGOBlockName, StateNGOBankName, StateNGOAcctNo, StateNGOIFSCode, StateNGOBankAdd, StateNGOAcctHoldeName, StateNGOBankAcctType, StateNGOSignupUserName, StateNGOSignupEmail, StateNGOSignupPassword, StateNGOIsActive, StateNGOAprovedBy, StateNGOAprovedDate, AcctHead, AcctId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const values = [
    data.StateNGOName,
    data.StateNGORegNo,
    data.StateNGORegDate,
    data.StateNGOSDPName,
    data.StateNGOMailId,
    data.StateNGOPhoneNo,
    data.StateNGOStateId || null,
    data.StateNGODistId || null,
    data.StateNGOBlockName,
    data.StateNGOBankName,
    data.StateNGOAcctNo,
    data.StateNGOIFSCode,
    data.StateNGOBankAdd,
    data.StateNGOAcctHoldeName,
    data.StateNGOBankAcctType,
    data.StateNGOSignupUserName,
    data.StateNGOSignupEmail,
    data.StateNGOSignupPassword,
    activeValue,
    data.StateNGOAprovedBy || null,
    data.StateNGOAprovedDate || null,
    data.AcctHead || "SN",
    data.AcctId || null,
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const newId = result.insertId;
    if (data.StateNGOSignupUserName && data.StateNGOSignupEmail) {
      db.query(
        `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "State Super Administrator",
          data.StateNGOSignupUserName,
          data.StateNGOSignupEmail,
          data.StateNGOSignupPassword,
          activeValue,
          data.AcctId || null,
          newId,
        ],
        () => {},
      );
    }
    syncAccountRecord(
      {
        acctNo: newId,
        acctHead: data.AcctHead || "SN",
        acctName: data.StateNGOName,
        stateNgoId: newId,
      },
      (syncErr) => {
        if (syncErr) return res.status(500).json({ error: syncErr.message });
        res.json({
          message: "State Super Administrator added successfully",
          id: newId,
        });
      },
    );
  });
};

exports.updateStateNgo = (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const activeValue =
    data.StateNGOIsActive === undefined || data.StateNGOIsActive === null
      ? 1
      : data.StateNGOIsActive;
  const query = `UPDATE state_ngo_reg SET StateNGOName=?, StateNGORegNo=?, StateNGORegDate=?, StateNGOSDPName=?, StateNGOMailId=?, StateNGOPhoneNo=?, StateNGOStateId=?, StateNGODistId=?, StateNGOBlockName=?, StateNGOBankName=?, StateNGOAcctNo=?, StateNGOIFSCode=?, StateNGOBankAdd=?, StateNGOAcctHoldeName=?, StateNGOBankAcctType=?, StateNGOSignupUserName=?, StateNGOSignupEmail=?, StateNGOSignupPassword=?, StateNGOIsActive=?, StateNGOAprovedBy=?, StateNGOAprovedDate=?, AcctHead=?, AcctId=? WHERE StateNGORegId=?`;
  const values = [
    data.StateNGOName,
    data.StateNGORegNo,
    data.StateNGORegDate,
    data.StateNGOSDPName,
    data.StateNGOMailId,
    data.StateNGOPhoneNo,
    data.StateNGOStateId || null,
    data.StateNGODistId || null,
    data.StateNGOBlockName,
    data.StateNGOBankName,
    data.StateNGOAcctNo,
    data.StateNGOIFSCode,
    data.StateNGOBankAdd,
    data.StateNGOAcctHoldeName,
    data.StateNGOBankAcctType,
    data.StateNGOSignupUserName,
    data.StateNGOSignupEmail,
    data.StateNGOSignupPassword,
    activeValue,
    data.StateNGOAprovedBy || null,
    data.StateNGOAprovedDate || null,
    data.AcctHead || "SN",
    data.AcctId || null,
    id,
  ];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.StateNGOSignupEmail) {
      db.query(
        `UPDATE userssignup SET SignupUserName=?, UserSignUpEmail=?, UserSignUpPassword=?, UserSignIsActive=?, UserAtuorizedRegId=? WHERE UserSignUpRole='State Super Administrator' AND ProfileRegId=?`,
        [
          data.StateNGOSignupUserName,
          data.StateNGOSignupEmail,
          data.StateNGOSignupPassword,
          activeValue,
          data.AcctId || null,
          id,
        ],
        () => {},
      );
    }
    deactivateHierarchyUserSignupsIfInactive(
      activeValue,
      "SN",
      id,
      (cascadeErr) => {
        if (cascadeErr)
          return res.status(500).json({ error: cascadeErr.message });
        syncOrDeleteAccountRecord(
          activeValue,
          {
            acctNo: id,
            acctHead: data.AcctHead || "SN",
            acctName: data.StateNGOName,
            stateNgoId: id,
          },
          (syncErr) => {
            if (syncErr)
              return res.status(500).json({ error: syncErr.message });
            res.json({
              message: "State Super Administrator updated successfully",
            });
          },
        );
      },
    );
  });
};

exports.deleteStateNgo = (req, res) => {
  deactivateHierarchyUserSignups("SN", req.params.id, (cascadeErr) => {
    if (cascadeErr) return res.status(500).json({ error: cascadeErr.message });
    db.query(
      "DELETE FROM state_ngo_reg WHERE StateNGORegId = ?",
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        deleteAccountRecord(req.params.id, "SN", (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          res.json({
            message: "State Super Administrator deleted successfully",
          });
        });
      },
    );
  });
};

// ==========================================
// ASTHA DIDI REGISTRATION
// ==========================================
exports.getAsthaDidi = (req, res) => {
  const query = `SELECT a.*, DATE_FORMAT(a.AsthaDidiAprovalDate, '%Y-%m-%d') AS AsthaDidiAprovalDateRaw, DATE_FORMAT(a.AsthaDidiDOB, '%Y-%m-%d') AS AsthaDidiDOBRaw, u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail, COALESCE(a.StateNGORegId, dngo.StateNGORegId) AS ResolvedStateNGORegId FROM \`asthadidi_reg\` a LEFT JOIN userssignup u ON a.AsthaDidiAprovedBy = CAST(u.UserSignUpId AS CHAR) LEFT JOIN dist_ngo_reg dngo ON a.DistNGORegId = dngo.DistNGORegId ORDER BY a.AsthaDidiRegId DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      results.map((row) => ({
        ...row,
        ApproverDisplayName:
          row.ApproverName ||
          (row.ApproverEmail
            ? row.ApproverEmail.split("@")[0]
            : row.AsthaDidiAprovedBy),
        AsthaDidiAprovalDate:
          row.AsthaDidiAprovalDateRaw || row.AsthaDidiAprovalDate,
        AsthaDidiDOB: row.AsthaDidiDOBRaw || row.AsthaDidiDOB,
      })),
    );
  });
};

exports.createAsthaDidi = (req, res) => {
  const data = req.body;
  db.query(
    `SELECT snr.StateNGORegId FROM state_ngo_reg snr JOIN state s ON snr.StateNGOStateId = s.StateId WHERE s.StateName = ? LIMIT 1`,
    [data.AsthaDidiStateName],
    (err, mappingResult) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Database error while resolving State ID." });
      const mappedStateNGORegId =
        data.StateNGORegId ||
        (mappingResult.length > 0 ? mappingResult[0].StateNGORegId : null);
      const insertQuery = `INSERT INTO \`asthadidi_reg\` (AsthaDidiUserName, AsthaDidiGuardianName, AsthaDidiDOB, AsthaDidiGuardianContactNo, AsthaDidiStateName, AsthaDidiDistName, AsthaDidiCity, AsthaDidiBlockName, AsthaDidiPO, AsthaDidiPS, AsthaDidiGramPanchayet, AsthaDidiVillage, AsthaDidiPincode, AsthaDidiContactNo, AsthaDidiMailId, AsthaDidiBankName, AsthaDidiBranchName, AsthaDidiBankAcctNo, AsthaDidiIFSCode, AsthaDidiPanNo, AsthaDidiAadharNo, AsthaDidiJoiningAmt, AsthaDidiWalletBalance, AsthaDidiSignupUserName, AsthaDidiSignupEmail, AsthaDidiSignupPassword, AsthaDidiCreatedByAuthRegId, AsthaDidiCreatedDate, StateNGORegId, DistNGORegId, SupRegId, AsthaDidiIsActive, AcctHead) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?)`;
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
        data.AcctHead || "AD",
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
          db.query(
            `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive, UserAtuorizedRegId, ProfileRegId) VALUES (?, ?, ?, ?, 1, ?, ?)`,
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
        syncAccountRecord(
          {
            acctNo: newId,
            acctHead: data.AcctHead || "AD",
            acctName: data.AsthaDidiUserName,
            stateNgoId: mappedStateNGORegId,
            districtNgoId: data.DistNGORegId || null,
            supervisorId: data.SupRegId || null,
            asthaDidiId: newId,
          },
          (syncErr) => {
            if (syncErr)
              return res.status(500).json({ error: syncErr.message });
            res.json({ message: "Astha Didi added successfully", id: newId });
          },
        );
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
  const stateNgoRegId =
    data.StateNGORegId || data.ResolvedStateNGORegId || null;
  const updateQuery = `UPDATE \`asthadidi_reg\` SET AsthaDidiProfileImage=?, AsthaDidiUserName=?, AsthaDidiGuardianName=?, AsthaDidiDOB=?, AsthaDidiGuardianContactNo=?, AsthaDidiStateName=?, AsthaDidiDistName=?, AsthaDidiCity=?, AsthaDidiBlockName=?, AsthaDidiPO=?, AsthaDidiPS=?, AsthaDidiGramPanchayet=?, AsthaDidiVillage=?, AsthaDidiPincode=?, AsthaDidiContactNo=?, AsthaDidiMailId=?, AsthaDidiBankName=?, AsthaDidiBranchName=?, AsthaDidiBankAcctNo=?, AsthaDidiIFSCode=?, AsthaDidiPanNo=?, AsthaDidiAadharNo=?, AsthaDidiJoiningAmt=?, AsthaDidiWalletBalance=?, AsthaDidiSignupUserName=?, AsthaDidiSignupEmail=?, AsthaDidiSignupPassword=?, AsthaDidiIsActive=?, AsthaDidiAprovedBy=?, AsthaDidiAprovalDate=?, AsthaDidiRegNo=?, StateNGORegId=?, DistNGORegId=?, SupRegId=?, AcctHead=? WHERE AsthaDidiRegId=?`;
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
    stateNgoRegId,
    data.DistNGORegId || null,
    data.SupRegId || null,
    data.AcctHead || "AD",
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
    deactivateHierarchyUserSignupsIfInactive(
      data.AsthaDidiIsActive,
      "AD",
      id,
      (cascadeErr) => {
        if (cascadeErr)
          return res.status(500).json({ error: cascadeErr.message });
        resolveStateNgoIdForAccount(
          data,
          stateNgoRegId,
          (resolveErr, resolvedStateNgoId) => {
            if (resolveErr)
              return res.status(500).json({ error: resolveErr.message });
            syncOrDeleteAccountRecord(
              data.AsthaDidiIsActive,
              {
                acctNo: id,
                acctHead: data.AcctHead || "AD",
                acctName: data.AsthaDidiUserName,
                stateNgoId: resolvedStateNgoId,
                districtNgoId: data.DistNGORegId || null,
                supervisorId: data.SupRegId || null,
                asthaDidiId: id,
              },
              (syncErr) => {
                if (syncErr)
                  return res.status(500).json({ error: syncErr.message });
                res.json({ message: "Record updated successfully" });
              },
            );
          },
        );
      },
    );
  });
};

exports.deleteAsthaDidi = (req, res) => {
  deactivateHierarchyUserSignups("AD", req.params.id, (cascadeErr) => {
    if (cascadeErr) return res.status(500).json({ error: cascadeErr.message });
    db.query(
      "DELETE FROM `asthadidi_reg` WHERE AsthaDidiRegId = ?",
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        deleteAccountRecord(req.params.id, "AD", (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          res.json({ message: "Record deleted successfully" });
        });
      },
    );
  });
};

// ==========================================
// ASTHA MAA REGISTRATION
// ==========================================
exports.getAsthaMaa = (req, res) => {
  const query = `SELECT a.*, DATE_FORMAT(a.AsthaMaAprovalDate, '%Y-%m-%d') AS AsthaMaAprovalDateRaw, DATE_FORMAT(a.AsthaMaDOB, '%Y-%m-%d') AS AsthaMaDOBRaw, u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail, COALESCE(a.StateNGORegId, dngo.StateNGORegId, ad.StateNGORegId) AS ResolvedStateNGORegId FROM \`asthama_reg\` a LEFT JOIN userssignup u ON a.AsthaMaAprovedBy = CAST(u.UserSignUpId AS CHAR) LEFT JOIN dist_ngo_reg dngo ON a.DistNGORegId = dngo.DistNGORegId LEFT JOIN asthadidi_reg ad ON a.AsthaDidiRegId = ad.AsthaDidiRegId ORDER BY a.AsthaMaRegId DESC`;
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
  const resolveStateNgoQuery = `SELECT StateNGORegId FROM ( SELECT d.StateNGORegId, 1 AS SortOrder FROM dist_ngo_reg d WHERE d.DistNGORegId = ? UNION ALL SELECT a.StateNGORegId, 2 AS SortOrder FROM asthadidi_reg a WHERE a.AsthaDidiRegId = ? UNION ALL SELECT d.StateNGORegId, 3 AS SortOrder FROM suvervisor_reg s LEFT JOIN dist_ngo_reg d ON s.DistNGORegId = d.DistNGORegId WHERE s.SupRegId = ? ) resolved WHERE StateNGORegId IS NOT NULL ORDER BY SortOrder LIMIT 1`;
  db.query(
    resolveStateNgoQuery,
    [
      data.DistNGORegId || null,
      data.AsthaDidiRegId || null,
      data.SupRegId || null,
    ],
    (resolveErr, resolveResults) => {
      if (resolveErr)
        return res.status(500).json({ error: resolveErr.message });
      const resolvedStateNGORegId =
        data.StateNGORegId || resolveResults[0]?.StateNGORegId || null;
      const insertQuery = `INSERT INTO asthama_reg (AsthaMaUserName, AsthaMaGuardianName, AsthaMaDOB, AsthaMaGuardianContactNo, AsthaMaStateName, AsthaMaDistName, AsthaMaCity, AsthaMaBlockName, AsthaMaPO, AsthaMaPS, AsthaMaGramPanchayet, AsthaMaVillage, AsthaMaPincode, AsthaMaContactNo, AsthaMaMailId, AsthaMaBankName, AsthaMaBranchName, AsthaMaBankAcctNo, AsthaMaIFSCode, AsthaMaPanNo, AsthaMaAadharNo, AsthaMaJoiningAmt, AsthaMaWalletBalance, AsthaMaSignupUserName, AsthaMaSignupEmail, AsthaMaSignupPassword, AsthaMaCreatedByAuthRegId, AsthaMaCreatedDate, StateNGORegId, DistNGORegId, SupRegId, AsthaDidiRegId, AsthaMaIsActive, AcctHead) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)`;
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
        resolvedStateNGORegId,
        data.DistNGORegId || null,
        data.SupRegId || null,
        data.AsthaDidiRegId || null,
        data.AsthaMaIsActive || 1,
        data.AcctHead || "AM",
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
        syncAccountRecord(
          {
            acctNo: newId,
            acctHead: data.AcctHead || "AM",
            acctName: data.AsthaMaUserName,
            stateNgoId: resolvedStateNGORegId,
            districtNgoId: data.DistNGORegId || null,
            supervisorId: data.SupRegId || null,
            asthaDidiId: data.AsthaDidiRegId || null,
            asthaMaaId: newId,
          },
          (syncErr) => {
            if (syncErr)
              return res.status(500).json({ error: syncErr.message });
            res.json({ message: "Astha Maa added successfully", id: newId });
          },
        );
      });
    },
  );
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
  const stateNgoRegId =
    data.StateNGORegId || data.ResolvedStateNGORegId || null;
  const query = `UPDATE asthama_reg SET AsthaMaProfileImage=?, AsthaMaUserName=?, AsthaMaGuardianName=?, AsthaMaDOB=?, AsthaMaGuardianContactNo=?, AsthaMaStateName=?, AsthaMaDistName=?, AsthaMaCity=?, AsthaMaBlockName=?, AsthaMaPO=?, AsthaMaPS=?, AsthaMaGramPanchayet=?, AsthaMaVillage=?, AsthaMaPincode=?, AsthaMaContactNo=?, AsthaMaMailId=?, AsthaMaBankName=?, AsthaMaBranchName=?, AsthaMaBankAcctNo=?, AsthaMaIFSCode=?, AsthaMaPanNo=?, AsthaMaAadharNo=?, AsthaMaJoiningAmt=?, AsthaMaWalletBalance=?, AsthaMaSignupUserName=?, AsthaMaSignupEmail=?, AsthaMaSignupPassword=?, StateNGORegId=?, DistNGORegId=?, SupRegId=?, AsthaDidiRegId=?, AsthaMaIsActive=?, AsthaMaAprovedBy=?, AsthaMaAprovalDate=?, AsthaMaRegNo=?, AcctHead=? WHERE AsthaMaRegId=?`;
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
    stateNgoRegId,
    data.DistNGORegId || null,
    data.SupRegId || null,
    data.AsthaDidiRegId || null,
    data.AsthaMaIsActive,
    data.AsthaMaAprovedBy,
    data.AsthaMaAprovalDate,
    data.AsthaMaRegNo,
    data.AcctHead || "AM",
    id,
  ];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    deactivateHierarchyUserSignupsIfInactive(
      data.AsthaMaIsActive,
      "AM",
      id,
      (cascadeErr) => {
        if (cascadeErr)
          return res.status(500).json({ error: cascadeErr.message });
        resolveStateNgoIdForAccount(
          data,
          stateNgoRegId,
          (resolveErr, resolvedStateNgoId) => {
            if (resolveErr)
              return res.status(500).json({ error: resolveErr.message });
            syncOrDeleteAccountRecord(
              data.AsthaMaIsActive,
              {
                acctNo: id,
                acctHead: data.AcctHead || "AM",
                acctName: data.AsthaMaUserName,
                stateNgoId: resolvedStateNgoId,
                districtNgoId: data.DistNGORegId || null,
                supervisorId: data.SupRegId || null,
                asthaDidiId: data.AsthaDidiRegId || null,
                asthaMaaId: id,
              },
              (syncErr) => {
                if (syncErr)
                  return res.status(500).json({ error: syncErr.message });
                res.json({ message: "Record updated successfully" });
              },
            );
          },
        );
      },
    );
  });
};

exports.deleteAsthaMaa = (req, res) => {
  deactivateHierarchyUserSignups("AM", req.params.id, (cascadeErr) => {
    if (cascadeErr) return res.status(500).json({ error: cascadeErr.message });
    db.query(
      "DELETE FROM asthama_reg WHERE AsthaMaRegId = ?",
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        deleteAccountRecord(req.params.id, "AM", (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          res.json({ message: "Record deleted successfully" });
        });
      },
    );
  });
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
  const insertQuery = `INSERT INTO dist_ngo_reg (DistNGOName, DistNGORegDate, DistNGORegNo, DistNGOPanNo, DistNGODarpanId, DistNGOMailId, DistNGOPhoneNo, DistNGORegAddress, DistNGOWorkingAddress, DistNGOStateName, DistNGODistName, DistNGOBlockName, DistNGOSDPName, DistNGOSDPMailId, DistNGOSDPPhoneNo, DistNGOSDPAadhaarNo, DistNGOBankAcctHolderName, DistNGOBankName, DistNGOAcctNo, DistNGOIFSCode, DistNGOBankAdd, DistNGOSignupUserName, DistNGOSignupEmail, DistNGOSignupPassword, DistNGOCreatedByAuthRegId, DistNGOCreatedDate, DistNGOIsActive, StateNGORegId, AcctHead) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`;
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
    data.AcctHead || "DN",
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
      (docErr) => {
        if (docErr) return res.status(500).json({ error: docErr.message });
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
        syncAccountRecord(
          {
            acctNo: newId,
            acctHead: data.AcctHead || "DN",
            acctName: data.DistNGOName,
            stateNgoId: data.StateNGORegId || null,
            districtNgoId: newId,
          },
          (syncErr) => {
            if (syncErr)
              return res.status(500).json({ error: syncErr.message });
            res.json({
              message: "District Admin added successfully",
              id: newId,
            });
          },
        );
      },
    );
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

  const query = `UPDATE dist_ngo_reg SET DistNGOName=?, DistNGORegDate=?, DistNGORegNo=?, DistNGOPanNo=?, DistNGODarpanId=?, DistNGOMailId=?, DistNGOPhoneNo=?, DistNGORegAddress=?, DistNGOWorkingAddress=?, DistNGOStateName=?, DistNGODistName=?, DistNGOBlockName=?, DistNGOSDPName=?, DistNGOSDPMailId=?, DistNGOSDPPhoneNo=?, DistNGOSDPAadhaarNo=?, DistNGOBankAcctHolderName=?, DistNGOBankName=?, DistNGOAcctNo=?, DistNGOIFSCode=?, DistNGOBankAdd=?, DistNGORecCertificate=?, DistNGOPanPic=?, DistNGODarpanPic=?, DistNGOSignupUserName=?, DistNGOSignupEmail=?, DistNGOSignupPassword=?, DistNGOIsActive=?, DistNGOAprovedBy=?, DistNGOAprovedDate=?, DistNGOGenRegNo=?, StateNGORegId=?, AcctHead=? WHERE DistNGORegId=?`;
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
    data.StateNGORegId || null,
    data.AcctHead || "DN",
    id,
  ];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    deactivateHierarchyUserSignupsIfInactive(
      data.DistNGOIsActive,
      "DN",
      id,
      (cascadeErr) => {
        if (cascadeErr)
          return res.status(500).json({ error: cascadeErr.message });
        syncOrDeleteAccountRecord(
          data.DistNGOIsActive,
          {
            acctNo: id,
            acctHead: data.AcctHead || "DN",
            acctName: data.DistNGOName,
            stateNgoId: data.StateNGORegId || null,
            districtNgoId: id,
          },
          (syncErr) => {
            if (syncErr)
              return res.status(500).json({ error: syncErr.message });
            res.json({ message: "Record updated successfully" });
          },
        );
      },
    );
  });
};

exports.deleteDistrictAdmin = (req, res) => {
  deactivateHierarchyUserSignups("DN", req.params.id, (cascadeErr) => {
    if (cascadeErr) return res.status(500).json({ error: cascadeErr.message });
    db.query(
      "DELETE FROM dist_ngo_reg WHERE DistNGORegId = ?",
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        deleteAccountRecord(req.params.id, "DN", (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          res.json({ message: "Record deleted successfully" });
        });
      },
    );
  });
};

// ==========================================
// SUPERVISOR REGISTRATION
// ==========================================
exports.getSupervisor = (req, res) => {
  const query = `SELECT a.*, DATE_FORMAT(a.SupAprovedDate, '%Y-%m-%d') AS SupAprovedDateRaw, DATE_FORMAT(a.SupDOB, '%Y-%m-%d') AS SupDOBRaw, u.SignupUserName AS ApproverName, u.UserSignUpEmail AS ApproverEmail, dngo.StateNGORegId AS ParentStateNGORegId FROM \`suvervisor_reg\` a LEFT JOIN userssignup u ON a.SupAprovedBy = CAST(u.UserSignUpId AS CHAR) LEFT JOIN dist_ngo_reg dngo ON a.DistNGORegId = dngo.DistNGORegId ORDER BY a.SupRegId DESC`;
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
  resolveStateNgoId(data, (resolveErr, resolvedStateNGORegId) => {
    if (resolveErr) return res.status(500).json({ error: resolveErr.message });
    const insertQuery = `INSERT INTO suvervisor_reg (SupName, SupGuardianName, SupDOB, SupGuardianContactNo, SupStateName, SupDistName, SupCity, SupBlockName, SupPO, SupPS, SupGramPanchayet, SupVillage, SupPincode, SupContactNo, SupMailId, SupBankName, SupBranchName, SupAcctNo, SupIFSCode, SupPanNo, SupAadharNo, SupJoiningAmt, SupWalletBalance, SupSignupUserName, SupSignupEmail, SupSignupPassword, SupCreatedByAuthRegId, SupCreatedDate, DistNGORegId, SupIsActive, StateNGORegId, AcctHead) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?)`;
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
      resolvedStateNGORegId,
      data.AcctHead || "SV",
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
      syncAccountRecord(
        {
          acctNo: newId,
          acctHead: data.AcctHead || "SV",
          acctName: data.SupName,
          stateNgoId: resolvedStateNGORegId,
          districtNgoId: data.DistNGORegId || null,
          supervisorId: newId,
        },
        (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          res.json({ message: "Supervisor added successfully", id: newId });
        },
      );
    });
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
  const stateNgoRegId = data.StateNGORegId || data.ParentStateNGORegId || null;
  const query = `UPDATE suvervisor_reg SET SupProfileImage=?, SupName=?, SupGuardianName=?, SupDOB=?, SupGuardianContactNo=?, SupStateName=?, SupDistName=?, SupCity=?, SupBlockName=?, SupPO=?, SupPS=?, SupGramPanchayet=?, SupVillage=?, SupPincode=?, SupContactNo=?, SupMailId=?, SupBankName=?, SupBranchName=?, SupAcctNo=?, SupIFSCode=?, SupPanNo=?, SupAadharNo=?, SupJoiningAmt=?, SupWalletBalance=?, SupSignupUserName=?, SupSignupEmail=?, SupSignupPassword=?, DistNGORegId=?, SupIsActive=?, SupAprovedBy=?, SupAprovedDate=?, SupRegNo=?, StateNGORegId=?, AcctHead=? WHERE SupRegId=?`;
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
    stateNgoRegId,
    data.AcctHead || "SV",
    id,
  ];
  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    deactivateHierarchyUserSignupsIfInactive(
      data.SupIsActive,
      "SV",
      id,
      (cascadeErr) => {
        if (cascadeErr)
          return res.status(500).json({ error: cascadeErr.message });
        resolveStateNgoIdForAccount(
          data,
          stateNgoRegId,
          (resolveErr, resolvedStateNgoId) => {
            if (resolveErr)
              return res.status(500).json({ error: resolveErr.message });
            syncOrDeleteAccountRecord(
              data.SupIsActive,
              {
                acctNo: id,
                acctHead: data.AcctHead || "SV",
                acctName: data.SupName,
                stateNgoId: resolvedStateNgoId,
                districtNgoId: data.DistNGORegId || null,
                supervisorId: id,
              },
              (syncErr) => {
                if (syncErr)
                  return res.status(500).json({ error: syncErr.message });
                res.json({ message: "Supervisor updated successfully" });
              },
            );
          },
        );
      },
    );
  });
};

exports.deleteSupervisor = (req, res) => {
  deactivateHierarchyUserSignups("SV", req.params.id, (cascadeErr) => {
    if (cascadeErr) return res.status(500).json({ error: cascadeErr.message });
    db.query(
      "DELETE FROM suvervisor_reg WHERE SupRegId = ?",
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        deleteAccountRecord(req.params.id, "SV", (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          res.json({ message: "Supervisor deleted successfully" });
        });
      },
    );
  });
};

exports.checkDuplicate = (req, res) => {
  const { table, column, value, idColumn, idValue } = req.body;
  const allowed = {
    asthadidi_reg: [
      "AsthaDidiMailId",
      "AsthaDidiContactNo",
      "AsthaDidiSignupUserName",
      "AsthaDidiAadharNo",
    ],
    asthama_reg: ["AsthaMaMailId", "AsthaMaContactNo", "AsthaMaSignupUserName"],
    suvervisor_reg: [
      "SupMailId",
      "SupContactNo",
      "SupSignupUserName",
      "SupAadharNo",
    ],
    dist_ngo_reg: ["DistNGOMailId", "DistNGOPhoneNo", "DistNGOSignupUserName"],
    state_ngo_reg: [
      "StateNGOMailId",
      "StateNGOPhoneNo",
      "StateNGOSignupEmail",
      "StateNGOSignupUserName",
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
// LOCATION MANAGEMENT (STATES & DISTRICTS)
// ==========================================
exports.getAllStates = (req, res) => {
  db.query("SELECT * FROM state ORDER BY StateName ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.createState = (req, res) => {
  const { StateName, IsActive } = req.body;
  db.query(
    "INSERT INTO state (StateName, IsActive) VALUES (?, ?)",
    [StateName, IsActive],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "State created successfully", id: result.insertId });
    },
  );
};

exports.updateState = (req, res) => {
  const { StateName, IsActive } = req.body;
  db.query(
    "UPDATE state SET StateName=?, IsActive=? WHERE StateId=?",
    [StateName, IsActive, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "State updated successfully" });
    },
  );
};

exports.deleteState = (req, res) => {
  db.query("DELETE FROM state WHERE StateId=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "State deleted successfully" });
  });
};

exports.getAllDistricts = (req, res) => {
  const query = `
    SELECT d.*, s.StateName 
    FROM dist d 
    LEFT JOIN state s ON d.StateId = s.StateId 
    ORDER BY s.StateName ASC, d.DistName ASC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.createDistrict = (req, res) => {
  const { DistName, StateId, IsActive } = req.body;
  db.query(
    "INSERT INTO dist (DistName, StateId, IsActive) VALUES (?, ?, ?)",
    [DistName, StateId, IsActive],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "District created successfully",
        id: result.insertId,
      });
    },
  );
};

exports.updateDistrict = (req, res) => {
  const { DistName, StateId, IsActive } = req.body;
  db.query(
    "UPDATE dist SET DistName=?, StateId=?, IsActive=? WHERE DistId=?",
    [DistName, StateId, IsActive, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "District updated successfully" });
    },
  );
};

exports.deleteDistrict = (req, res) => {
  db.query("DELETE FROM dist WHERE DistId=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "District deleted successfully" });
  });
};

// ==========================================
// PRODUCT DISTRIBUTION MODULE
// ==========================================

exports.getAccountHeads = (req, res) => {
  db.query(
    "SELECT AcctHead, AcctHeadName, CONCAT(AcctHead, ' - ', AcctHeadName) AS DisplayName FROM accthead WHERE IsActive = 'T'",
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    },
  );
};

exports.getAccountsMapping = (req, res) => {
  db.query(
    "SELECT *, CONCAT(AcctNo, ' - ', AcctName) AS DisplayName FROM accounts",
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    },
  );
};

exports.getActiveProducts = (req, res) => {
  db.query(
    "SELECT ProId, ProName FROM product WHERE IsActive = 'T' OR IsActive = '1' OR IsActive = 1",
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    },
  );
};

exports.getTrnTypes = (req, res) => {
  db.query(
    "SELECT TrnTypyId, CONCAT(DrCr, ' - ', TrnType) AS DisplayName FROM trntype WHERE IsActive = 'T'",
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    },
  );
};

exports.getProductStock = (req, res) => {
  const { acctHead, acctNo, proId } = req.query;
  const query = `SELECT SUM(Deposit) - SUM(Withdraw) AS AvailableQty FROM ProTran WHERE AcctHead = ? AND AcctNo = ? AND ProId = ?`;
  db.query(query, [acctHead, acctNo, proId], (err, results) => {
    if (err) {
      console.error("❌ getProductStock Error:", err);
      return res.json({ availableQty: 0 });
    }
    res.json({ availableQty: results[0].AvailableQty || 0 });
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
    SenderDate,
    SenderId,
    SenderRole,
    SenderMode,
    ReceiverId,
    ReceiverRole,
    ReceiverMode,
    ProductId,
    DistributedQty,
    Remarks,
    InvoiceFile,
  } = req.body;

  const receiverInfo = `${ReceiverRole} - ${ReceiverId}`;
  const senderInfo = `${SenderRole} - ${SenderId}`;
  const trnDate = SenderDate || new Date().toISOString().split("T")[0];
  const entryDate = new Date().toISOString().split("T")[0];

  const sModeParsed = SenderMode ? SenderMode.split(" - ")[1] : "TRANSFER";
  const sDrCr = SenderMode ? SenderMode.split(" - ")[0] : "Dr";

  const rModeParsed = ReceiverMode ? ReceiverMode.split(" - ")[1] : "RECEIVED";
  const rDrCr = ReceiverMode ? ReceiverMode.split(" - ")[0] : "Cr";

  const sDeposit = sDrCr === "Cr" ? DistributedQty : 0;
  const sWithdraw = sDrCr === "Dr" ? DistributedQty : 0;

  const rDeposit = rDrCr === "Cr" ? DistributedQty : 0;
  const rWithdraw = rDrCr === "Dr" ? DistributedQty : 0;

  const invoiceFileName = saveBase64File(
    InvoiceFile,
    "ProTran",
    Date.now(),
    "Invoice",
  );

  db.query(
    "INSERT INTO ProTran (TrnDate, AcctNo, AcctHead, ProId, Deposit, Withdraw, DrCr, TrnType, Remerks, UserName, invoice, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      trnDate,
      SenderId,
      SenderRole,
      ProductId,
      sDeposit,
      sWithdraw,
      sDrCr,
      sModeParsed,
      Remarks,
      receiverInfo,
      invoiceFileName,
      entryDate,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(
        "INSERT INTO ProTran (TrnDate, AcctNo, AcctHead, ProId, Deposit, Withdraw, DrCr, TrnType, Remerks, UserName, invoice, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          trnDate,
          ReceiverId,
          ReceiverRole,
          ProductId,
          rDeposit,
          rWithdraw,
          rDrCr,
          rModeParsed,
          Remarks,
          senderInfo,
          invoiceFileName,
          entryDate,
        ],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ message: "Product transaction completed successfully" });
        },
      );
    },
  );
};

exports.getDistributionHistory = (req, res) => {
  const { senderId, senderHead } = req.query;

  const query = `
    SELECT 
      pt.TrnId,
      DATE_FORMAT(pt.TrnDate, '%Y-%m-%d') AS TransactionDate,
      DATE_FORMAT(pt.EntryDate, '%Y-%m-%d') AS EntryDate,
      pt.AcctHead AS SenderHead,
      acc.AcctName AS SenderAcctName,
      p.ProName AS ProductName,
      pt.Deposit AS Qty,
      pt.DrCr,
      pt.TrnType AS SenderMode,
      pt.Remerks AS Remarks,
      pt.UserName AS ReceiverInfo,
      pt.invoice
    FROM ProTran pt
    INNER JOIN accounts acc ON pt.AcctNo = acc.AcctNo AND pt.AcctHead = acc.AcctHead
    INNER JOIN product p ON pt.ProId = p.ProId
    WHERE pt.AcctNo = ? AND pt.AcctHead = ? AND pt.TrnType = 'Received'
    
    UNION 
    
    SELECT 
      pt.TrnId,
      DATE_FORMAT(pt.TrnDate, '%Y-%m-%d') AS TransactionDate,
      DATE_FORMAT(pt.EntryDate, '%Y-%m-%d') AS EntryDate,
      pt.AcctHead AS SenderHead,
      acc.AcctName AS SenderAcctName,
      p.ProName AS ProductName,
      pt.Withdraw AS Qty,
      pt.DrCr,
      pt.TrnType AS SenderMode,
      pt.Remerks AS Remarks,
      pt.UserName AS ReceiverInfo,
      pt.invoice
    FROM ProTran pt
    INNER JOIN accounts acc ON pt.AcctNo = acc.AcctNo AND pt.AcctHead = acc.AcctHead
    INNER JOIN product p ON pt.ProId = p.ProId
    WHERE pt.AcctNo = ? AND pt.AcctHead = ? AND pt.TrnType = 'Transfer'
    
    ORDER BY TrnId DESC
  `;

  db.query(
    query,
    [senderId, senderHead, senderId, senderHead],
    (err, results) => {
      if (err) {
        console.error("❌ History fetch error:", err);
        return res.json([]);
      }
      res.json(results);
    },
  );
};
