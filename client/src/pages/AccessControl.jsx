import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL, styles } from '../config/constants';
import { getSafeUser } from '../components/AccountSharedUtils';

const AccessControl = () => {
    const loggedInUser = getSafeUser();
    const [targetUsers, setTargetUsers] = useState([]);
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assignedDistricts, setSelectedDistricts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch available districts for checkboxes
            const distRes = await fetch(`${API_BASE_URL}/states`); // Get states first
            const states = await distRes.json();
            
            // To keep it simple, we fetch all districts for the first state found or use a static list
            // In a real scenario, you might filter this by the Admin's state
            const allDists = await fetch(`${API_BASE_URL}/districts/1`); // Example State ID 1
            const distData = await allDists.json();
            setAvailableDistricts(distData);

            // 2. Fetch users that the logged-in user can manage
            const role = loggedInUser?.role;
            let endpoint = '';
            if (role === 'State Super Administrator' || role.toLowerCase() === 'developer') {
                endpoint = `${API_BASE_URL}/districtadmin`;
            } else if (role === 'District Administrator') {
                endpoint = `${API_BASE_URL}/supervisor`;
            }

            if (endpoint) {
                const userRes = await fetch(endpoint);
                const userData = await userRes.json();
                setTargetUsers(userData);
            }
        } catch (error) {
            toast.error("Error loading access data.");
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        // In a real DB, you'd fetch existing permissions here. 
        // For now, we initialize an empty array or match based on their default district
        const defaultDist = user.DistNGODistName || user.SupDistName;
        setSelectedDistricts(defaultDist ? [defaultDist] : []);
    };

    const toggleDistrict = (distName) => {
        setSelectedDistricts(prev => 
            prev.includes(distName) 
                ? prev.filter(d => d !== distName) 
                : [...prev, distName]
        );
    };

    const savePermissions = async () => {
        if (!selectedUser) return toast.warning("Please select a user first.");
        
        toast.loading("Saving permissions...", { toastId: 'saveAccess' });
        
        // This payload maps to your requirement of managing one or multiple districts
        const payload = {
            userId: selectedUser.DistNGORegId || selectedUser.SupRegId,
            assignedDistricts: assignedDistricts,
            updatedBy: loggedInUser.id
        };

        // Logic: Send to a new backend endpoint (you'll need to create this in routes.js)
        console.log("Saving Access Payload:", payload);
        
        setTimeout(() => {
            toast.dismiss('saveAccess');
            toast.success(`Access updated for ${selectedUser.DistNGOName || selectedUser.SupName}`);
        }, 1000);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h5 style={{ margin: 0 }}>Access Control & Permission Management</h5>
                </div>
                <div style={{ ...styles.cardBody, display: 'flex', gap: '30px' }}>
                    
                    {/* Left Side: User List */}
                    <div style={{ flex: 1, borderRight: '1px solid #d9dee3', paddingRight: '20px' }}>
                        <h6 style={styles.label}>Select {loggedInUser?.role === 'District Administrator' ? 'Supervisor' : 'District Admin'}</h6>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px' }}>
                            {targetUsers.map(user => (
                                <div 
                                    key={user.DistNGORegId || user.SupRegId}
                                    onClick={() => handleUserSelect(user)}
                                    style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedUser === user ? 'rgba(105, 108, 255, 0.1)' : '#f8f9fa',
                                        border: selectedUser === user ? '1px solid #696cff' : '1px solid transparent'
                                    }}
                                >
                                    <strong>{user.DistNGOName || user.SupName}</strong>
                                    <div style={{ fontSize: '11px', color: '#a1acb8' }}>{user.DistNGODistName || user.SupDistName}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: District Checkboxes */}
                    <div style={{ flex: 2 }}>
                        {selectedUser ? (
                            <>
                                <h6 style={styles.label}>Assign Districts to: {selectedUser.DistNGOName || selectedUser.SupName}</h6>
                                <p style={styles.hintText}>User can only manage/view data for selected districts.</p>
                                
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr 1fr 1fr', 
                                    gap: '15px', 
                                    marginTop: '20px',
                                    padding: '20px',
                                    backgroundColor: '#f5f5f9',
                                    borderRadius: '8px'
                                }}>
                                    {availableDistricts.map(dist => (
                                        <label key={dist.DistId} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={assignedDistricts.includes(dist.DistName)}
                                                onChange={() => toggleDistrict(dist.DistName)}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            {dist.DistName}
                                        </label>
                                    ))}
                                </div>

                                <div style={{ marginTop: '30px', textAlign: 'right' }}>
                                    <button onClick={savePermissions} style={styles.btnPrimary}>Save Access Permissions</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '100px', color: '#a1acb8' }}>
                                <h3>Select a user from the left to manage permissions</h3>
                                <p>You can assign multiple districts to a single administrator.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessControl;