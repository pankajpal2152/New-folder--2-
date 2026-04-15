// src/components/ProfileReportCard.jsx
import React from 'react';

const ProfileReportCard = () => {
    const styles = {
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            height: '100%',
            boxSizing: 'border-box',
            gridColumn: 'span 2' // <-- This forces the card to span two columns in your CSS Grid
        },
        leftSide: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 1
        },
        title: {
            color: '#566a7f',
            fontSize: '1.125rem',
            fontWeight: '600',
            margin: '0 0 12px 0'
        },
        badge: {
            backgroundColor: 'rgba(255, 171, 0, 0.16)', // Light yellow
            color: '#ffab00', // Solid yellow
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block',
            width: 'fit-content',
            marginBottom: '20px'
        },
        percentageText: {
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#71dd37', // Green
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        amountText: {
            color: '#566a7f',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0'
        },
        rightSide: {
            width: '50%', // Allow the chart to take up half the wider card
            maxWidth: '220px', // Prevent it from stretching infinitely
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end'
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.leftSide}>
                <div>
                    <h3 style={styles.title}>Profile Report</h3>
                    <span style={styles.badge}>YEAR 2021</span>
                </div>
                <div>
                    <p style={styles.percentageText}>↑ 68.2%</p>
                    <h4 style={styles.amountText}>$84,686k</h4>
                </div>
            </div>

            <div style={styles.rightSide}>
                {/* SVG representing the wavy line chart with a drop shadow */}
                <svg width="100%" height="70px" viewBox="0 0 100 50" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    {/* Shadow Path */}
                    <path
                        d="M 0 40 Q 15 0 30 25 T 60 40 T 100 10"
                        fill="transparent"
                        stroke="rgba(255, 171, 0, 0.2)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transform: 'translateY(5px)' }} // Offsets the shadow
                    />
                    {/* Main Line Path */}
                    <path
                        d="M 0 40 Q 15 0 30 25 T 60 40 T 100 10"
                        fill="transparent"
                        stroke="#ffab00"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
};

export default ProfileReportCard;