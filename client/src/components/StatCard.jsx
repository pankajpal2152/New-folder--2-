// src/components/StatCard.jsx
import React, { useState, useEffect, useRef } from 'react';

const StatCard = ({ title, amount, percentage, isPositive, iconEmoji, iconBgColor, iconColor }) => {
    // State to manage the visibility of the dropdown menu
    const [menuOpen, setMenuOpen] = useState(false);

    // Ref to attach to the card container to detect outside clicks
    const cardRef = useRef(null);

    // Effect to handle clicks outside the component
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If the menu is open AND the click target is NOT inside the card container
            if (menuOpen && cardRef.current && !cardRef.current.contains(event.target)) {
                setMenuOpen(false); // Close the menu
            }
        };

        // Bind the event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Unbind the event listener on cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]); // Re-run effect only when menuOpen changes

    const styles = {
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative' // Needed for the absolute dropdown menu
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
        },
        iconWrapper: {
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            backgroundColor: iconBgColor,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
        },
        menuDots: {
            color: '#a1acb8',
            cursor: 'pointer',
            fontSize: '20px',
            lineHeight: '1',
            padding: '0 5px',
            userSelect: 'none' // Prevents text selection on double click
        },
        // --- DROPDOWN MENU STYLES ---
        dropdownMenu: {
            position: 'absolute',
            top: '40px',
            right: '20px',
            backgroundColor: '#ffffff',
            boxShadow: '0 0.25rem 1rem rgba(161, 172, 184, 0.45)',
            borderRadius: '6px',
            padding: '8px 0',
            width: '130px',
            zIndex: 10,
            // Animation styles
            opacity: menuOpen ? 1 : 0,
            visibility: menuOpen ? 'visible' : 'hidden',
            transform: menuOpen ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.2s ease-in-out'
        },
        menuItem: {
            padding: '8px 20px',
            fontSize: '14px',
            color: '#697a8d',
            cursor: 'pointer',
            transition: 'background-color 0.2s, color 0.2s'
        },
        titleText: {
            color: '#697a8d',
            fontSize: '0.9375rem',
            fontWeight: '500',
            margin: '0 0 8px 0',
            display: 'block'
        },
        amountText: {
            color: '#566a7f',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0 0 8px 0'
        },
        percentageText: {
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isPositive ? '#71dd37' : '#ff3e1d',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }
    };

    // Toggle menu function
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        // Attach the ref to the main card container
        <div style={styles.card} ref={cardRef}>
            <div style={styles.header}>
                <div style={styles.iconWrapper}>
                    {iconEmoji}
                </div>

                {/* Three dots button */}
                <div style={styles.menuDots} onClick={toggleMenu}>⋮</div>

                {/* Dropdown Menu */}
                <div style={styles.dropdownMenu}>
                    {/* Using inline onMouseEnter/Leave for simple hover effects without external CSS */}
                    <div
                        style={styles.menuItem}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(105, 108, 255, 0.08)'; e.target.style.color = '#696cff'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#697a8d'; }}
                        onClick={() => setMenuOpen(false)} // Close menu on selection
                    >
                        View More
                    </div>
                    <div
                        style={styles.menuItem}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(105, 108, 255, 0.08)'; e.target.style.color = '#696cff'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#697a8d'; }}
                        onClick={() => setMenuOpen(false)} // Close menu on selection
                    >
                        Delete
                    </div>
                </div>
            </div>

            <div>
                <span style={styles.titleText}>{title}</span>
                <h4 style={styles.amountText}>{amount}</h4>
                <p style={styles.percentageText}>
                    {isPositive ? '↑' : '↓'} {percentage}
                </p>
            </div>
        </div>
    );
};

export default StatCard;