import React from 'react';

// --- GLOBAL CONFIGURATION ---
// Automatically switch between local development and cPanel production
export const API_BASE_URL = import.meta.env.PROD
    ? '/api'
    : 'http://localhost:5000/api';

export const DUMMY_AVATAR = "https://api.dicebear.com/8.x/initials/svg?seed=Rajesh&backgroundColor=696cff";
export const indianZipRegex = /^[1-9][0-9]{5}$/;
export const indianPhoneRegex = /^(?:\+91[\s]?|91[\s]?)?[6789]\d{9}$/;

// --- HELPER FUNCTIONS ---
export const extractBase64 = (dbString) => {
    if (!dbString) return null;
    const parts = dbString.split('||');
    return parts.length > 1 ? parts[1] : parts[0];
};

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// --- STYLES ---
export const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)', fontFamily: '"Public Sans", sans-serif', overflow: 'hidden', marginBottom: '24px', width: '100%', boxSizing: 'border-box' },
    cardHeader: { padding: '24px', borderBottom: '1px solid #d9dee3', fontSize: '1.125rem', fontWeight: '500', color: '#566a7f', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    cardBody: { padding: '24px', width: '100%', boxSizing: 'border-box' },
    profileSection: { display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' },
    avatar: { width: '100px', height: '100px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 },
    buttonGroup: { display: 'flex', gap: '16px', marginBottom: '12px', marginTop: '10px', flexWrap: 'wrap' },
    btnPrimary: { backgroundColor: '#2b84b8', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 24px', fontSize: '0.9375rem', fontWeight: '500', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' },
    btnOutline: { backgroundColor: 'transparent', color: '#697a8d', border: '1px solid #d9dee3', borderRadius: '6px', padding: '8px 20px', fontSize: '0.9375rem', fontWeight: '500', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' },
    btnDanger: { backgroundColor: '#ff3e1d', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontSize: '0.9375rem', fontWeight: '500', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' },
    btnSuccess: { backgroundColor: '#71dd37', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontSize: '0.9375rem', fontWeight: '500', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' },
    hintText: { color: '#a1acb8', fontSize: '0.8125rem', margin: 0 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' },
    label: { fontSize: '0.75rem', fontWeight: '600', color: '#566a7f', textTransform: 'uppercase', letterSpacing: '0.25px' },
    input: (hasError) => ({ padding: '10px 14px', borderRadius: '4px', border: hasError ? '1px solid #ff3e1d' : '1px solid #d9dee3', fontSize: '0.9375rem', color: '#697a8d', outline: 'none', backgroundColor: '#fff', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }),
    inputDisabled: { padding: '10px 14px', borderRadius: '4px', border: '1px solid #d9dee3', fontSize: '0.9375rem', color: '#a1acb8', outline: 'none', backgroundColor: '#eceeef', cursor: 'not-allowed', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    errorText: { color: '#ff3e1d', fontSize: '0.75rem', margin: 0, marginTop: '-4px' },
    selectStyles: (hasError) => ({
        control: (base) => ({ ...base, borderColor: hasError ? '#ff3e1d' : '#d9dee3', minHeight: '42px', borderRadius: '4px', boxShadow: 'none', '&:hover': { borderColor: '#2b84b8' } }),
        singleValue: (base) => ({ ...base, color: '#697a8d', fontSize: '0.9375rem' }),
        placeholder: (base) => ({ ...base, color: '#b4bdc6', fontSize: '0.9375rem' }),
        menu: (base) => ({ ...base, zIndex: 9999 })
    }),
    sectionHeader: { fontSize: '1rem', fontWeight: '500', color: '#566a7f', textTransform: 'uppercase', marginBottom: '20px', marginTop: '32px', borderBottom: '2px solid #2b84b8', paddingBottom: '8px' },
    tableContainer: { width: '100%', maxWidth: '100%', overflowX: 'auto', display: 'block', WebkitOverflowScrolling: 'touch' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '1200px' },
    th: { padding: '12px 16px', textAlign: 'left', backgroundColor: '#f5f5f9', color: '#566a7f', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #d9dee3', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' },
    td: { padding: '12px 16px', borderBottom: '1px solid #d9dee3', color: '#697a8d', fontSize: '0.9375rem', whiteSpace: 'nowrap' },
    stickyLeftTh: { position: 'sticky', left: 0, zIndex: 2, padding: '12px 16px', textAlign: 'left', backgroundColor: '#f5f5f9', color: '#566a7f', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #d9dee3', whiteSpace: 'nowrap', borderRight: '1px solid #d9dee3', cursor: 'pointer', userSelect: 'none' },
    stickyLeftTd: { position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#ffffff', padding: '12px 16px', borderBottom: '1px solid #d9dee3', color: '#697a8d', fontSize: '0.9375rem', whiteSpace: 'nowrap', borderRight: '1px solid #d9dee3' },
    stickyRightTh: { position: 'sticky', right: 0, zIndex: 2, padding: '12px 16px', textAlign: 'left', backgroundColor: '#f5f5f9', color: '#566a7f', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #d9dee3', whiteSpace: 'nowrap', borderLeft: '1px solid #d9dee3' },
    stickyRightTd: { position: 'sticky', right: 0, zIndex: 1, backgroundColor: '#ffffff', padding: '12px 16px', borderBottom: '1px solid #d9dee3', color: '#697a8d', fontSize: '0.9375rem', whiteSpace: 'nowrap', borderLeft: '1px solid #d9dee3' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', margin: '0 4px', color: '#697a8d' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px' },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxSizing: 'border-box' },
    closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a1acb8', zIndex: 10 },
    paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #d9dee3', flexWrap: 'wrap', gap: '10px', color: '#697a8d', fontSize: '0.875rem', backgroundColor: '#fff' },
    pageSelect: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9dee3', color: '#697a8d', cursor: 'pointer', outline: 'none' },
    pageBtn: { padding: '6px 12px', marginLeft: '8px', border: '1px solid #d9dee3', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', color: '#697a8d' },
    pageBtnDisabled: { padding: '6px 12px', marginLeft: '8px', border: '1px solid #d9dee3', backgroundColor: '#f5f5f9', borderRadius: '4px', cursor: 'not-allowed', color: '#a1acb8' }
};

// --- REUSABLE INPUT COMPONENT ---
export const FormInput = ({ label, id, error, placeholder, disabled, ...props }) => (
    <div style={styles.inputGroup}>
        <label htmlFor={id} style={styles.label}>{label}</label>
        <input id={id} style={disabled ? styles.inputDisabled : styles.input(!!error)} placeholder={placeholder} disabled={disabled} {...props} />
        {error && <p style={styles.errorText}>{error.message}</p>}
    </div>
);