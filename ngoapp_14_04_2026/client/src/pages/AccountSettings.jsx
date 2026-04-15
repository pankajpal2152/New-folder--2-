// src/pages/AccountSettings.jsx
import React from 'react';
import AccountTab from '../components/AccountTab';

const AccountSettings = () => {
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0, // <--- MAGIC FIX 5: Forces the Account component to stay within the screen
            boxSizing: 'border-box',
            padding: '20px'
        }
    };

    return (
        <div style={styles.container}>
            {/* Main Content Area */}
            <AccountTab />
        </div>
    );
};

export default AccountSettings;