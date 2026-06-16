const db = require("../config/db");

exports.signup = async (req, res) => {
  const { role, username, email, password } = req.body;
  try {
    db.query(
      "SELECT * FROM userssignup WHERE UserSignUpEmail = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.error("❌ DB ERROR (Signup Check):", err);
          return res
            .status(500)
            .json({
              error: "Database error",
              details: err.message,
              code: err.code,
            });
        }
        if (results.length > 0)
          return res.status(400).json({ error: "Email already exists" });

        // ✅ Mapped to exact database columns including the new SignupUserName
        const query = `INSERT INTO userssignup (UserSignUpRole, SignupUserName, UserSignUpEmail, UserSignUpPassword, UserSignIsActive) VALUES (?, ?, ?, ?, 1)`;
        db.query(query, [role, username, email, password], (err) => {
          if (err) {
            console.error("❌ DB ERROR (Signup Insert):", err);
            return res
              .status(500)
              .json({
                error: "Failed to register",
                details: err.message,
                code: err.code,
              });
          }
          res.status(201).json({ message: "User registered successfully!" });
        });
      },
    );
  } catch (error) {
    console.error("❌ SERVER ERROR (Signup):", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.login = (req, res) => {
  const { role, email, password } = req.body;

  if (role === "National NGO") {
    const nationalNgoQuery = `
            SELECT * FROM nngo
            WHERE TRIM(SignupEmail) = TRIM(?)
              AND (IsActive = 'T' OR IsActive = '1' OR IsActive = 1)
            LIMIT 1
        `;

    db.query(nationalNgoQuery, [email], (err, results) => {
      if (err) {
        console.error("❌ CRITICAL DB ERROR (National NGO Login):", err);
        return res
          .status(500)
          .json({
            error: "Database error",
            details: err.message,
            code: err.code,
          });
      }

      if (results.length === 0) {
        return res
          .status(400)
          .json({ error: "User not found or role mismatch" });
      }

      const user = results[0];
      if (
        String(password).trim() !== String(user.SignupPassword || "").trim()
      ) {
        return res.status(400).json({ error: "Incorrect password" });
      }

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.AcctId,
          role: "National NGO",
          username:
            user.AcctName || String(user.SignupEmail || "").split("@")[0],
          email: String(user.SignupEmail || "").trim(),
          UserSignUpId: user.AcctId,
          UserSignUpRole: "National NGO",
          UserSignUpEmail: String(user.SignupEmail || "").trim(),
          UserSignUpPassword: user.SignupPassword,
          ProfileRegId: user.AcctId,
          UserAtuorizedRegId: user.ParentAcctNo,
          UserSignIsActive: user.IsActive,
          SignupUserName: user.AcctName,
          AcctId: user.AcctId,
          AcctNo: user.AcctNo,
          AcctHead: user.AcctHead,
        },
      });
    });
    return;
  }

  db.query(
    "SELECT * FROM userssignup WHERE UserSignUpEmail = ? AND UserSignUpRole = ?",
    [email, role],
    async (err, results) => {
      if (err) {
        // ✅ This will print the EXACT reason to your Render logs
        console.error("❌ CRITICAL DB ERROR (Login):", err);
        // ✅ This will send the EXACT reason to your browser's Network tab
        return res
          .status(500)
          .json({
            error: "Database error",
            details: err.message,
            code: err.code,
          });
      }

      if (results.length === 0) {
        return res
          .status(400)
          .json({ error: "User not found or role mismatch" });
      }

      const user = results[0];

      if (String(user.UserSignIsActive) === "0") {
        return res
          .status(403)
          .json({ error: "Account is inactive or deleted" });
      }

      // Check password against the mapped column
      if (password !== user.UserSignUpPassword) {
        return res.status(400).json({ error: "Incorrect password" });
      }

      // ✅ Returning ALL columns exactly as they appear in the database for Local Storage
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.UserSignUpId,
          role: user.UserSignUpRole,
          username: user.SignupUserName || user.UserSignUpEmail.split("@")[0],
          email: user.UserSignUpEmail,
          UserSignUpId: user.UserSignUpId,
          UserSignUpRole: user.UserSignUpRole,
          UserSignUpEmail: user.UserSignUpEmail,
          UserSignUpPassword: user.UserSignUpPassword,
          ProfileRegId: user.ProfileRegId,
          UserAtuorizedRegId: user.UserAtuorizedRegId,
          UserSignIsActive: user.UserSignIsActive,
          SignupUserName: user.SignupUserName,
        },
      });
    },
  );
};

exports.getUserInfo = (req, res) => {
  // SMART FILTER: Only select roles where ActStatus is exactly 1
  db.query("SELECT * FROM userinfo WHERE ActStatus = 1", (err, results) => {
    if (err) {
      console.error("❌ DB ERROR (Get User Info):", err);
      return res
        .status(500)
        .json({
          error: "Database error while fetching roles",
          details: err.message,
          code: err.code,
        });
    }
    const nationalNgoRole = {
      UserInfoId: 0,
      UserType: "National NGO",
      UserRole: "Superadmin",
      ActStatus: 1,
    };
    const hasNationalNgo = results.some(
      (role) => role.UserType === nationalNgoRole.UserType,
    );
    res.json(hasNationalNgo ? results : [nationalNgoRole, ...results]);
  });
};

// ==========================================
// ROLE MANAGEMENT ENDPOINTS (userinfo table)
// ==========================================
exports.createUserRole = (req, res) => {
  const { UserType, UserRole, ActStatus } = req.body;
  db.query(
    "INSERT INTO userinfo (UserType, UserRole, ActStatus) VALUES (?, ?, ?)",
    [UserType, UserRole, ActStatus],
    (err, result) => {
      if (err) {
        console.error("❌ DB ERROR (Create Role):", err);
        return res
          .status(500)
          .json({
            error: "Database error",
            details: err.message,
            code: err.code,
          });
      }
      res
        .status(201)
        .json({ message: "Role added successfully", id: result.insertId });
    },
  );
};

exports.updateUserRole = (req, res) => {
  const { id } = req.params;
  const { UserType, UserRole, ActStatus } = req.body;
  db.query(
    "UPDATE userinfo SET UserType = ?, UserRole = ?, ActStatus = ? WHERE UserInfoId = ?",
    [UserType, UserRole, ActStatus, id],
    (err) => {
      if (err) {
        console.error("❌ DB ERROR (Update Role):", err);
        return res
          .status(500)
          .json({
            error: "Database error",
            details: err.message,
            code: err.code,
          });
      }
      res.json({ message: "Role updated successfully" });
    },
  );
};

exports.deleteUserRole = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM userinfo WHERE UserInfoId = ?", [id], (err) => {
    if (err) {
      console.error("❌ DB ERROR (Delete Role):", err);
      return res
        .status(500)
        .json({
          error: "Database error",
          details: err.message,
          code: err.code,
        });
    }
    res.json({ message: "Role deleted successfully" });
  });
};
