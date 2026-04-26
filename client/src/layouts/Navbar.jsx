import React, { useState, useEffect, useRef } from 'react';

// ✅ FIXED: Imported the smart dynamic URL to work on both Localhost and Vercel/Render!
import { API_BASE_URL } from '../config/constants';

// --- HELPER FUNCTION: Clean DB Tagged Image ---
// Strips the "ID:123||" tag so the Navbar avatar renders correctly
const extractBase64 = (dbString) => {
    if (!dbString) return null;
    const parts = dbString.split('||');
    return parts.length > 1 ? parts[1] : parts[0];
};

const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profileImage, setProfileImage] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState(''); // ✅ Added state to hold the user's name
    const dropdownRef = useRef(null);

    // Default placeholder if no image is uploaded
    const DUMMY_AVATAR = "https://api.dicebear.com/8.x/initials/svg?seed=User&backgroundColor=e1e4e8";

    useEffect(() => {
        // 1. Get the current logged-in user from localStorage
        const userStr = localStorage.getItem('loggedInUser');

        if (userStr) {
            const user = JSON.parse(userStr);

            // ✅ Set the role and the specific SignupUserName to display in the Navbar
            setUserRole(user.role || user.UserSignUpRole || '');
            setUserName(user.SignupUserName || user.username || ''); // Pulls exact DB name

            // 2. Fetch their specific profile image from the database
            const fetchProfileImage = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/asthadidi`);
                    const data = await res.json();

                    // Match the record created by this user's email
                    const userRegInfo = data.find(member => member.CreatedBy === user.email);

                    if (userRegInfo && userRegInfo.ProfileImage) {
                        // Use our helper to strip the ID tag before setting the image
                        const cleanImage = extractBase64(userRegInfo.ProfileImage);
                        setProfileImage(cleanImage);
                    } else {
                        // Create a nice fallback avatar using their username
                        setProfileImage(`https://api.dicebear.com/8.x/initials/svg?seed=${user.SignupUserName || user.username || 'User'}&backgroundColor=696cff`);
                    }
                } catch (error) {
                    console.error("Failed to fetch profile image from DB", error);
                    setProfileImage(DUMMY_AVATAR);
                }
            };

            fetchProfileImage();
        } else {
            setProfileImage(DUMMY_AVATAR);
        }

        // 3. Handle clicking outside the dropdown to close it
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 4. Handle Logout functionality
    const handleLogout = () => {
        localStorage.removeItem('loggedInUser'); // Clear session
        window.location.href = '/login'; // Force a hard redirect to the login page
    };

    const styles = {
        navbarContainer: {
            height: '64px',
            backgroundColor: '#ffffff',
            margin: '16px 24px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)'
        },
        searchWrapper: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        searchInput: {
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            color: '#697a8d',
            width: '250px',
            backgroundColor: 'transparent'
        },
        rightControls: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px' // Spacing between name, role badge, and logout
        },
        // ✅ NEW STYLE: For the user's name text
        nameBadge: {
            color: '#566a7f',
            fontSize: '0.95rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            marginRight: '4px',
            textTransform: 'uppercase'
        },
        // Professional badge for the user role
        roleBadge: {
            backgroundColor: '#e7e7ff',
            color: '#696cff',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            letterSpacing: '0.25px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        },
        avatarContainer: {
            position: 'relative',
            cursor: 'pointer'
        },
        avatar: {
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#e1e4e8',
            border: '2px solid #fff',
            boxShadow: '0 0 0 1px #d9dee3',
            position: 'relative',
            backgroundImage: `url(${profileImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        },
        onlineIndicator: {
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '10px',
            height: '10px',
            backgroundColor: '#71dd37', // Success green
            borderRadius: '50%',
            border: '2px solid #fff'
        },
        dropdownMenu: {
            position: 'absolute',
            top: '50px',
            right: '0',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(161, 172, 184, 0.3)',
            borderRadius: '8px',
            padding: '8px 0',
            width: '130px',
            zIndex: 1000,
            opacity: dropdownOpen ? 1 : 0,
            visibility: dropdownOpen ? 'visible' : 'hidden',
            transform: dropdownOpen ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        menuItem: {
            padding: '10px 20px',
            fontSize: '14px',
            color: '#ff3e1d', // Danger Red for logout
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontWeight: '500',
            transition: 'background-color 0.2s'
        },
        logoutBtn: {
            backgroundColor: '#ff3e1d',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 20px',
            fontSize: '0.9375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: '0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: '8px'
        }
    };

    return (
        <nav style={styles.navbarContainer}>
            <div style={styles.searchWrapper}>
                <span style={{ color: '#697a8d', fontSize: '18px' }}>🔍</span>
                <input type="text" placeholder="Search..." style={styles.searchInput} />
            </div>

            <div style={styles.rightControls}>

                {/* ✅ DISPLAY LOGGED IN USERNAME */}
                {userName && (
                    <div style={styles.nameBadge}>
                        👤 {userName}
                    </div>
                )}

                {/* DYNAMIC ROLE BADGE */}
                {userRole && (
                    <div style={styles.roleBadge}>
                        {userRole}
                    </div>
                )}

                {/* DIRECT LOGOUT BUTTON */}
                <button
                    style={styles.logoutBtn}
                    onClick={handleLogout}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#e6381a' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#ff3e1d' }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;