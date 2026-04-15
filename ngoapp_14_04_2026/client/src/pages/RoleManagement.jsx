// src/pages/RoleManagement.jsx
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:5000/api/userinfo';

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Added IsActive to the form state
    const [formData, setFormData] = useState({ UserInfoId: null, UserType: '', UserRole: 'Viewer', IsActive: 1 });
    const [selectedRole, setSelectedRole] = useState(null);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setRoles(data);
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error("Failed to load roles from local database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const openCreateModal = () => {
        setFormData({ UserInfoId: null, UserType: '', UserRole: 'Viewer', IsActive: 1 });
        setIsModalOpen(true);
    };

    const openEditModal = (role) => {
        setFormData({ ...role, IsActive: role.IsActive !== undefined ? role.IsActive : 1 });
        setIsModalOpen(true);
    };

    const closeModals = () => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
        setFormData({ UserInfoId: null, UserType: '', UserRole: 'Viewer', IsActive: 1 });
        setSelectedRole(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.UserType.trim()) {
            toast.warning("Role Name is required!");
            return;
        }

        const isEditing = formData.UserInfoId !== null;
        const url = isEditing ? `${API_URL}/${formData.UserInfoId}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';

        toast.loading(isEditing ? "Updating role..." : "Creating role...", { toastId: 'saveRole' });

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    UserType: formData.UserType,
                    UserRole: formData.UserRole,
                    IsActive: formData.IsActive // Send status to DB
                })
            });

            toast.dismiss('saveRole');

            if (response.ok) {
                toast.success(`Role successfully ${isEditing ? 'updated' : 'created'}!`);
                closeModals();
                fetchRoles();
            } else {
                const text = await response.text();
                toast.error(`Error: ${text}`);
            }
        } catch (error) {
            toast.dismiss('saveRole');
            console.error("Error saving role:", error);
            toast.error("Network error.");
        }
    };

    const confirmDelete = (role) => {
        setSelectedRole(role);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        toast.loading("Deleting role...", { toastId: 'deleteRole' });

        try {
            const response = await fetch(`${API_URL}/${selectedRole.UserInfoId}`, {
                method: 'DELETE'
            });

            toast.dismiss('deleteRole');

            if (response.ok) {
                toast.success("Role deleted successfully!");
                closeModals();
                fetchRoles();
            } else {
                toast.error(`Error: Failed to delete`);
            }
        } catch (error) {
            toast.dismiss('deleteRole');
            toast.error("Network error.");
        }
    };

    const getRoleStyles = (roleName) => {
        switch (roleName) {
            case 'Superadmin':
                return { backgroundColor: 'rgba(255, 62, 29, 0.16)', color: '#ff3e1d' };
            case 'Admin':
                return { backgroundColor: 'rgba(105, 108, 255, 0.16)', color: '#696cff' };
            case 'Viewer':
            default:
                return { backgroundColor: 'rgba(113, 221, 55, 0.16)', color: '#71dd37' };
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' },
        card: { backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)', fontFamily: '"Public Sans", sans-serif', width: '100%', boxSizing: 'border-box' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' },
        title: { margin: 0, color: '#566a7f', fontSize: '1.25rem', fontWeight: '600' },
        btnPrimary: { backgroundColor: '#696cff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9375rem', transition: '0.2s', whiteSpace: 'nowrap' },
        btnOutline: { backgroundColor: 'transparent', color: '#697a8d', border: '1px solid #d9dee3', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' },
        btnDanger: { backgroundColor: '#ff3e1d', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' },
        tableContainer: { width: '100%', overflowX: 'auto', display: 'block' },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' },
        th: { padding: '14px 16px', backgroundColor: '#f5f5f9', color: '#566a7f', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', borderBottom: '1px solid #d9dee3' },
        td: { padding: '14px 16px', borderBottom: '1px solid #d9dee3', color: '#697a8d', fontSize: '0.9375rem' },
        actionBtnEdit: { background: 'none', border: 'none', color: '#71dd37', cursor: 'pointer', fontSize: '1.1rem', marginRight: '12px' },
        actionBtnDelete: { background: 'none', border: 'none', color: '#ff3e1d', cursor: 'pointer', fontSize: '1.1rem' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px' },
        modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '450px', boxSizing: 'border-box', position: 'relative' },
        closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a1acb8' },
        label: { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#566a7f', textTransform: 'uppercase', marginBottom: '8px' },
        input: { width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #d9dee3', fontSize: '0.9375rem', color: '#697a8d', marginBottom: '20px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
        modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }
    };

    return (
        <div style={styles.container}>
            <ToastContainer autoClose={3000} position="top-right" />
            <div style={styles.card}>
                <div style={styles.header}>
                    <h4 style={styles.title}>System Role Management</h4>
                    <button style={styles.btnPrimary} onClick={openCreateModal}>+ Create New Role</button>
                </div>

                {loading ? (
                    <p style={{ color: '#a1acb8' }}>Loading roles from local database...</p>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Created Role</th>
                                    <th style={styles.th}>Category Type</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(role => (
                                    <tr key={role.UserInfoId} style={{ transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9f9fb'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={styles.td}>#{role.UserInfoId}</td>
                                        <td style={styles.td}><strong>{role.UserType}</strong></td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...getRoleStyles(role.UserRole),
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {role.UserRole}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                backgroundColor: role.IsActive == 1 || role.IsActive === undefined ? 'rgba(113, 221, 55, 0.16)' : 'rgba(255, 62, 29, 0.16)',
                                                color: role.IsActive == 1 || role.IsActive === undefined ? '#71dd37' : '#ff3e1d',
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {role.IsActive == 1 || role.IsActive === undefined ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <button style={styles.actionBtnEdit} onClick={() => openEditModal(role)} title="Edit">✏️</button>
                                            <button style={styles.actionBtnDelete} onClick={() => confirmDelete(role)} title="Delete">🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                                {roles.length === 0 && (
                                    <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center' }}>No roles found in local database. Create one above!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {isModalOpen && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <button style={styles.closeBtn} onClick={closeModals}>×</button>
                            <h4 style={{ marginTop: 0, color: '#566a7f', marginBottom: '24px' }}>
                                {formData.UserInfoId ? 'Edit Existing Role' : 'Create New Role'}
                            </h4>
                            <form onSubmit={handleFormSubmit}>
                                <div>
                                    <label style={styles.label}>Role Name (User Type)</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="e.g. Finance Manager, Astha Didi"
                                        value={formData.UserType}
                                        onChange={(e) => setFormData({ ...formData, UserType: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Category Level (User Role)</label>
                                    <select
                                        style={styles.input}
                                        value={formData.UserRole}
                                        onChange={(e) => setFormData({ ...formData, UserRole: e.target.value })}
                                    >
                                        <option value="Superadmin">Superadmin</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Viewer">Viewer</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.label}>Status (Visibility)</label>
                                    <select
                                        style={styles.input}
                                        value={formData.IsActive}
                                        onChange={(e) => setFormData({ ...formData, IsActive: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>Active (Visible)</option>
                                        <option value={0}>Inactive (Hidden)</option>
                                    </select>
                                </div>
                                <div style={styles.modalActions}>
                                    <button type="button" style={styles.btnOutline} onClick={closeModals}>Cancel</button>
                                    <button type="submit" style={styles.btnPrimary}>
                                        {formData.UserInfoId ? 'Update Role' : 'Save Role'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDeleteModalOpen && (
                    <div style={styles.modalOverlay}>
                        <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                            <button style={styles.closeBtn} onClick={closeModals}>×</button>
                            <h4 style={{ marginTop: 0, color: '#ff3e1d' }}>Confirm Delete</h4>
                            <p style={{ color: '#697a8d', margin: '16px 0' }}>
                                Are you sure you want to completely delete the role <strong style={{ color: '#566a7f' }}>{selectedRole?.UserType}</strong>? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                                <button onClick={closeModals} style={styles.btnOutline}>Cancel</button>
                                <button onClick={handleDelete} style={styles.btnDanger}>Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManagement;