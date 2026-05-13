import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { styles, extractBase64 } from '../config/constants';

// ==========================================
// UTILITY: Safe Local Storage Access
// ==========================================
export const getSafeUser = () => {
    try {
        const userStr = localStorage.getItem('loggedInUser');
        if (userStr) return JSON.parse(userStr);
    } catch (error) {
        console.error("Error parsing user data from local storage", error);
    }
    return null;
};

// ==========================================
// FIXED: Smart PDF Viewer
// Automatically handles raw Base64 previews AND live physical server URLs!
// ==========================================
export const handleViewPdf = (dbValue) => {
    if (!dbValue) return;
    
    // Resolve the precise URL using our environment-aware helper
    const fullUrl = extractBase64(dbValue);

    // If it's a raw base64 string (user just uploaded it, hasn't saved to DB yet)
    if (fullUrl.startsWith('data:')) {
        const pdfWindow = window.open("");
        if (pdfWindow) {
            pdfWindow.document.write(`<iframe width='100%' height='100%' style='border:none; margin:0; padding:0;' src='${fullUrl}'></iframe>`);
        } else {
            toast.error("Pop-up blocked! Please allow pop-ups for this site to view documents.");
        }
    } else {
        // It's a real physical PDF hosted on Render! Just open the URL directly.
        window.open(fullUrl, "_blank");
    }
};

// ==========================================
// Password Input Helper Component (For Modals)
// ==========================================
export const PasswordInput = ({ label, id, error, placeholder, disabled, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
        <div style={styles.inputGroup}>
            <label htmlFor={id} style={styles.label}>{label}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    style={disabled ? styles.inputDisabled : { ...styles.input(!!error), paddingRight: '40px' }}
                    placeholder={placeholder}
                    disabled={disabled}
                    {...props}
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                        position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#697a8d', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
            </div>
            {error && <p style={styles.errorText}>{error.message}</p>}
        </div>
    );
};