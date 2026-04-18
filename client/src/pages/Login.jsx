// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/constants';

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f9', fontFamily: '"Public Sans", sans-serif', position: 'relative', overflow: 'hidden', padding: '20px' },
    card: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)', padding: '40px', width: '100%', maxWidth: '400px', zIndex: 1 },
    logoContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', gap: '8px' },
    logoImage: { maxHeight: '100px', objectFit: 'contain' },
    welcomeText: { fontSize: '1.25rem', fontWeight: '500', color: '#566a7f', marginBottom: '8px', marginTop: 0 },
    subText: { fontSize: '0.9375rem', color: '#697a8d', marginBottom: '24px', lineHeight: '1.5' },
    formGroup: { marginBottom: '16px' },
    labelContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    label: { fontSize: '0.75rem', fontWeight: '600', color: '#566a7f', textTransform: 'uppercase', letterSpacing: '0.25px' },
    linkText: { fontSize: '0.8125rem', color: '#696cff', textDecoration: 'none', cursor: 'pointer' },
    input: { width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d9dee3', fontSize: '0.9375rem', color: '#697a8d', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s', backgroundColor: '#fff' },
    passwordContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
    eyeIcon: { position: 'absolute', right: '14px', cursor: 'pointer', color: '#a1acb8', backgroundColor: 'transparent', border: 'none', padding: 0, display: 'flex' },
    checkboxContainer: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' },
    checkbox: { width: '16px', height: '16px', cursor: 'pointer' },
    checkboxLabel: { fontSize: '0.9375rem', color: '#697a8d', cursor: 'pointer' },
    submitBtn: { width: '100%', backgroundColor: '#696cff', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '0.9375rem', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s', marginBottom: '16px' },
    footerText: { textAlign: 'center', fontSize: '0.9375rem', color: '#697a8d', margin: 0 },
    footerLink: { color: '#696cff', textDecoration: 'none', cursor: 'pointer' }
};

// ==========================================
// LOGIN FORM COMPONENT
// ==========================================
const LoginForm = ({ onLogin, onToggleView }) => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const [roles, setRoles] = useState([]);
    const [credentials, setCredentials] = useState({ role: '', email: '', password: '' });

    useEffect(() => {
        fetch(`${API_BASE_URL}/userinfo`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch roles");
                return res.json();
            })
            .then(data => setRoles(data))
            .catch(err => console.error("Error fetching roles: ", err));
    }, []);

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!credentials.role || !credentials.email || !credentials.password) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                // Save user payload directly to local storage (including all DB columns)
                localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                onLogin();
                navigate('/');
            } else {
                console.error("Error: " + data.error);
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.logoContainer}>
                <img src="/logo.png" alt="App Logo" style={styles.logoImage} />
            </div>
            <h3 style={styles.welcomeText}>Welcome! 👋</h3>
            <p style={styles.subText}>Please sign in to your account and join the Astha Didi Project</p>

            <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <div style={styles.labelContainer}>
                        <label htmlFor="role" style={styles.label}>Select Role</label>
                    </div>
                    <select
                        id="role"
                        name="role"
                        style={{ ...styles.input, cursor: 'pointer' }}
                        value={credentials.role}
                        onChange={handleChange}
                    >
                        <option value="" disabled>Select your role...</option>
                        {roles.map((r) => (
                            <option key={r.UserInfoId} value={r.UserType}>{r.UserType}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.formGroup}>
                    <div style={styles.labelContainer}>
                        <label htmlFor="email" style={styles.label}>Email Address</label>
                    </div>
                    <input type="email" id="email" name="email" placeholder="Enter your email" style={styles.input} value={credentials.email} onChange={handleChange} autoFocus />
                </div>

                <div style={styles.formGroup}>
                    <div style={styles.labelContainer}>
                        <label htmlFor="password" style={styles.label}>Password</label>
                    </div>
                    <div style={styles.passwordContainer}>
                        <input type={showPassword ? "text" : "password"} id="password" name="password" placeholder="············" style={styles.input} value={credentials.password} onChange={handleChange} />
                        <button type="button" style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <button type="submit" style={styles.submitBtn}>Sign in</button>
            </form>
        </div>
    );
};

// ==========================================
// SIGNUP FORM COMPONENT
// ==========================================
const SignupForm = ({ onToggleView }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState([]);

    const [credentials, setCredentials] = useState({
        role: '', username: '', email: '', password: ''
    });

    useEffect(() => {
        fetch(`${API_BASE_URL}/userinfo`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch roles");
                return res.json();
            })
            .then(data => setRoles(data))
            .catch(err => console.error("Error fetching roles: ", err));
    }, []);

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!credentials.role || !credentials.username || !credentials.email || !credentials.password) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                onToggleView(); 
            } else {
                console.error("Error: " + data.error);
            }
        } catch (error) {
            console.error("Signup failed:", error);
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.logoContainer}>
                <img src="/logo.png" alt="App Logo" style={styles.logoImage} />
            </div>

            <h3 style={styles.welcomeText}>Astha Didi Project</h3>

            <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label htmlFor="role" style={styles.label}>Select Role</label>
                    <select
                        id="role"
                        name="role"
                        style={{ ...styles.input, marginTop: '8px', cursor: 'pointer' }}
                        value={credentials.role}
                        onChange={handleChange}
                    >
                        <option value="" disabled>Select your role...</option>
                        {roles.map((r) => (
                            <option key={r.UserInfoId} value={r.UserType}>{r.UserType}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="username" style={styles.label}>Username</label>
                    <input type="text" id="username" name="username" placeholder="Enter your username" style={{ ...styles.input, marginTop: '8px' }} value={credentials.username} onChange={handleChange} />
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="email" style={styles.label}>Email</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" style={{ ...styles.input, marginTop: '8px' }} value={credentials.email} onChange={handleChange} />
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="password" style={styles.label}>Password</label>
                    <div style={{ ...styles.passwordContainer, marginTop: '8px' }}>
                        <input type={showPassword ? "text" : "password"} id="password" name="password" placeholder="············" style={styles.input} value={credentials.password} onChange={handleChange} />
                        <button type="button" style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div style={styles.checkboxContainer}>
                    <input type="checkbox" id="terms" style={styles.checkbox} required />
                    <label htmlFor="terms" style={styles.checkboxLabel}>
                        I agree to <span style={styles.linkText}>privacy policy & terms</span>
                    </label>
                </div>

                <button type="submit" style={styles.submitBtn}>Sign up</button>
            </form>

            <p style={styles.footerText}>
                Already have an account? <span onClick={onToggleView} style={styles.footerLink}>Sign in instead</span>
            </p>
        </div>
    );
};

// ==========================================
// MAIN COMPONENT EXPORT
// ==========================================
const Login = ({ onLogin }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const handleLogin = onLogin || (() => { });

    return (
        <div style={styles.container}>
            {isLoginView ? (
                <LoginForm onLogin={handleLogin} onToggleView={() => setIsLoginView(false)} />
            ) : (
                <SignupForm onToggleView={() => setIsLoginView(true)} />
            )}
        </div>
    );
};

export default Login;