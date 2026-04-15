// src/components/WelcomeCard.jsx
import React from 'react';
import johnIllustration from '../assets/illustration-john.png';

const WelcomeCard = () => {
    const styles = {
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            boxSizing: 'border-box'
        },
        textWrapper: {
            zIndex: 1,
            flex: 1
        },
        title: {
            color: '#696cff', // Primary purple
            fontSize: '1.125rem',
            fontWeight: '600',
            margin: '0 0 12px 0'
        },
        paragraph: {
            color: '#697a8d',
            fontSize: '0.875rem',
            margin: '0 0 20px 0',
            lineHeight: '1.5',
            maxWidth: '70%'
        },
        button: {
            backgroundColor: 'transparent',
            border: '1px solid #696cff',
            color: '#696cff',
            padding: '7px 14px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: '600',
            transition: 'all 0.2s ease-in-out'
        },
        imageContainer: {
            position: 'absolute',
            right: '0',
            bottom: '0',
            width: '160px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end'
        },
        image: {
            width: '100%',
            height: 'auto',
            display: 'block'
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.textWrapper}>
                <h3 style={styles.title}>Congratulations John! 🎉</h3>
                <p style={styles.paragraph}>
                    You have done <strong>72%</strong> more sales today. Check your new badge in your profile.
                </p>
                <button style={styles.button}>View Badges</button>
            </div>
            <div style={styles.imageContainer}>
                <img src={johnIllustration} alt="John" style={styles.image} />
            </div>
        </div>
    );
};

export default WelcomeCard;