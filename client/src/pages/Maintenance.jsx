// src/pages/Maintenance.jsx
import React from 'react';

const Maintenance = ({ pageName }) => {
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            textAlign: 'center',
            color: '#566a7f',
            fontFamily: '"Public Sans", sans-serif'
        },
        title: { fontSize: '2rem', fontWeight: '700', marginBottom: '10px' },
        subtitle: { color: '#a1acb8', fontSize: '1rem' }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>{pageName} Page</h1>
            <p style={styles.subtitle}>This page is currently under maintenance. We are working hard to bring it to you soon!</p>
            <div style={{ fontSize: '100px', marginTop: '20px' }}>🛠️</div>
        </div>
    );
};

export default Maintenance;