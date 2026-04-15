// src/layouts/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    // State for toggling menus
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(true);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    
    // Fetch the logged-in user's role from local storage
    const [userRole, setUserRole] = useState('');
    
    useEffect(() => {
        try {
            const userStr = localStorage.getItem('loggedInUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserRole(user.role || '');
            }
        } catch (error) {
            console.error("Error parsing user data from local storage", error);
        }
    }, []);

    // Check if the role is 'developer' (case-insensitive for safety)
    const isDeveloper = userRole.toLowerCase() === 'developer';

    const styles = {
        sidebar: {
            width: '260px',
            minWidth: '260px',
            flexShrink: 0,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
            zIndex: 10
        },
        brandWrapper: {
            padding: '20px 24px 5px 24px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#566a7f',
            letterSpacing: '-0.5px',
            textDecoration: 'none'
        },
        brandLogo: { width: '100px', height: 'auto', marginRight: '10px' },
        menuList: { listStyle: 'none', padding: '0', margin: '0', flex: 1, overflowY: 'auto' },
        link: { textDecoration: 'none', display: 'block' },

        sectionHeader: {
            fontSize: '12px',
            textTransform: 'uppercase',
            color: '#005bb5',
            backgroundColor: '#e8f3fc',
            padding: '8px 12px',
            borderRadius: '6px',
            margin: '10px 24px 16px 24px',
            letterSpacing: '0.5px',
            fontWeight: '900',
            borderLeft: '4px solid #009a44'
        },

        menuItem: (isActive) => ({
            margin: '0 16px 8px 16px',
            padding: '10px 16px',
            backgroundColor: isActive ? 'rgba(105, 108, 255, 0.16)' : 'transparent',
            color: isActive ? '#696cff' : '#697a8d',
            borderRadius: '6px',
            fontWeight: isActive ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }),
        menuItemLeft: { display: 'flex', alignItems: 'center' },

        subMenuContainer: (isOpen) => ({
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-in-out',
            maxHeight: isOpen ? '250px' : '0px'
        }),
        subMenuItem: (isActive) => ({
            padding: '10px 16px 10px 48px',
            color: isActive ? '#696cff' : '#697a8d',
            fontWeight: isActive ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
        subMenuDot: (isActive) => ({
            width: '6px', height: '6px', borderRadius: '50%', marginRight: '10px',
            backgroundColor: isActive ? '#696cff' : '#d9dee3',
            boxShadow: isActive ? '0 0 0 3px rgba(105, 108, 255, 0.16)' : 'none',
            transition: 'all 0.2s'
        }),
        chevron: (isOpen) => ({
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            fontSize: '12px'
        })
    };

    return (
        <aside style={styles.sidebar}>
            <div style={styles.brandWrapper}>
                <img src="/logo.png" alt="SHEVA ASHARM Logo" style={styles.brandLogo} /> SHEVA ASHARM
            </div>

            <ul style={styles.menuList}>
                <li style={styles.sectionHeader}>Astha Didi Project</li>

                {/* --- 1. PROFILE MEGA MENU --- */}
                <li style={styles.menuItem(false)} onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}>
                    <div style={styles.menuItemLeft}>
                        <span style={{ marginRight: '10px' }}>👤</span> Profile Section
                    </div>
                    <span style={styles.chevron(isAccountMenuOpen)}>▶</span>
                </li>

                <div style={styles.subMenuContainer(isAccountMenuOpen)}>
                    <NavLink to="/account-settings/account" style={styles.link}>
                        {({ isActive }) => (
                            <li style={styles.subMenuItem(isActive)}>
                                <div style={styles.subMenuDot(isActive)}></div> Profile Entry
                            </li>
                        )}
                    </NavLink>
                </div>

                {/* --- 2. SETTINGS MEGA MENU (VISIBLE ONLY TO DEVELOPER) --- */}
                {isDeveloper && (
                    <>
                        <li style={styles.menuItem(false)} onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}>
                            <div style={styles.menuItemLeft}>
                                <span style={{ marginRight: '10px' }}>⚙️</span> Settings
                            </div>
                            <span style={styles.chevron(isSettingsMenuOpen)}>▶</span>
                        </li>

                        <div style={styles.subMenuContainer(isSettingsMenuOpen)}>
                            <NavLink to="/settings/role-management" style={styles.link}>
                                {({ isActive }) => (
                                    <li style={styles.subMenuItem(isActive)}>
                                        <div style={styles.subMenuDot(isActive)}></div> Role Management
                                    </li>
                                )}
                            </NavLink>

                            <NavLink to="/settings/access-management" style={styles.link}>
                                {({ isActive }) => (
                                    <li style={styles.subMenuItem(isActive)}>
                                        <div style={styles.subMenuDot(isActive)}></div> Access Management
                                    </li>
                                )}
                            </NavLink>

                            <NavLink to="/settings/user-management" style={styles.link}>
                                {({ isActive }) => (
                                    <li style={styles.subMenuItem(isActive)}>
                                        <div style={styles.subMenuDot(isActive)}></div> User Management
                                    </li>
                                )}
                            </NavLink>
                        </div>
                    </>
                )}
            </ul>
        </aside>
    );
};

export default Sidebar;