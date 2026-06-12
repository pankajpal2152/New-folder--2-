import React, { useState } from "react";
import { toast } from "react-toastify";
import { API_BASE_URL, resolveDocumentUrl, styles } from "../config/constants";

export const getSafeUser = () => {
  try {
    const userStr = localStorage.getItem("loggedInUser");
    if (userStr) return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user data from local storage", error);
  }
  return null;
};

// ==========================================
// SMART PDF VIEWER
// Automatically handles Base64 previews and Physical URLs!
// ==========================================
export const handleViewPdf = (dbValue) => {
  const fullUrl = resolveDocumentUrl(dbValue);

  if (!fullUrl) {
    toast.error("Document is not available.");
    return;
  }

  // If it's a raw base64 string, open via iframe
  if (fullUrl.startsWith("data:")) {
    const pdfWindow = window.open("");
    if (pdfWindow) {
      pdfWindow.document.write(
        `<iframe width='100%' height='100%' style='border:none; margin:0; padding:0;' src='${fullUrl}'></iframe>`,
      );
    } else {
      toast.error(
        "Pop-up blocked! Please allow pop-ups for this site to view documents.",
      );
    }
  } else {
    // It's a real file hosted on the server, open directly
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  }
};

export const PasswordInput = ({
  label,
  id,
  error,
  placeholder,
  disabled,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div style={styles.inputGroup}>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          style={
            disabled
              ? styles.inputDisabled
              : { ...styles.input(!!error), paddingRight: "40px" }
          }
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          style={{
            position: "absolute",
            right: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#697a8d",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "👁️‍🗨️" : "👁️"}
        </button>
      </div>
      {error && <p style={styles.errorText}>{error.message}</p>}
    </div>
  );
};

// Add to src/components/AccountSharedUtils.js

export const validateUniqueFields = async (checks) => {
  for (const check of checks) {
    try {
      const response = await fetch(`${API_BASE_URL}/check-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check),
      });
      const data = await response.json();
      if (data.exists) {
        toast.error(`${check.label} is already taken!`);
        return false; // Submission blocked
      }
    } catch (err) {
      console.error("Duplicate Check Failed", err);
    }
  }
  return true; // All checks passed
};
