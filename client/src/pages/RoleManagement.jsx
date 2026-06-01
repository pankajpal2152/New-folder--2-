import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../config/constants"; // Fixed

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    UserInfoId: null,
    UserType: "",
    UserRole: "Viewer",
    IsActive: 1,
  });
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/userinfo`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      toast.error("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setFormData({
      UserInfoId: null,
      UserType: "",
      UserRole: "Viewer",
      IsActive: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setFormData({
      ...role,
      IsActive: role.IsActive !== undefined ? role.IsActive : 1,
    });
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setFormData({
      UserInfoId: null,
      UserType: "",
      UserRole: "Viewer",
      IsActive: 1,
    });
    setSelectedRole(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const isEditing = formData.UserInfoId !== null;
    const url = isEditing
      ? `${API_BASE_URL}/userinfo/${formData.UserInfoId}`
      : `${API_BASE_URL}/userinfo`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserType: formData.UserType,
          UserRole: formData.UserRole,
          ActStatus: formData.IsActive,
        }),
      });
      if (response.ok) {
        toast.success("Saved!");
        setIsModalOpen(false);
        fetchRoles();
      } else {
        toast.error("Error saving.");
      }
    } catch (error) {
      toast.error("Network error.");
    }
  };

  const confirmDelete = (role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    toast.loading("Deleting...", { toastId: "deleteRole" });
    try {
      const response = await fetch(
        `${API_BASE_URL}/userinfo/${selectedRole.UserInfoId}`,
        { method: "DELETE" },
      );
      toast.dismiss("deleteRole");
      if (response.ok) {
        toast.success("Deleted!");
        setIsDeleteModalOpen(false);
        fetchRoles();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.dismiss("deleteRole");
      toast.error("Network error.");
    }
  };

  const getRoleStyles = (roleName) => {
    switch (roleName) {
      case "Superadmin":
        return { backgroundColor: "rgba(255, 62, 29, 0.16)", color: "#ff3e1d" };
      case "Admin":
        return {
          backgroundColor: "rgba(105, 108, 255, 0.16)",
          color: "#696cff",
        };
      default:
        return {
          backgroundColor: "rgba(113, 221, 55, 0.16)",
          color: "#71dd37",
        };
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      padding: "24px",
      boxShadow: "0 2px 6px 0 rgba(67, 89, 113, 0.12)",
      fontFamily: '"Public Sans", sans-serif',
      width: "100%",
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "10px",
    },
    title: {
      margin: 0,
      color: "#566a7f",
      fontSize: "1.25rem",
      fontWeight: "600",
    },
    btnPrimary: {
      backgroundColor: "#696cff",
      color: "#fff",
      border: "none",
      padding: "8px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "0.9375rem",
      transition: "0.2s",
      whiteSpace: "nowrap",
    },
    btnOutline: {
      backgroundColor: "transparent",
      color: "#697a8d",
      border: "1px solid #d9dee3",
      padding: "8px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "0.2s",
    },
    btnDanger: {
      backgroundColor: "#ff3e1d",
      color: "#fff",
      border: "none",
      padding: "8px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "0.2s",
    },
    tableContainer: { width: "100%", overflowX: "auto", display: "block" },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "left",
      minWidth: "600px",
    },
    th: {
      padding: "14px 16px",
      backgroundColor: "#f5f5f9",
      color: "#566a7f",
      fontWeight: "600",
      fontSize: "0.875rem",
      textTransform: "uppercase",
      borderBottom: "1px solid #d9dee3",
    },
    td: {
      padding: "14px 16px",
      borderBottom: "1px solid #d9dee3",
      color: "#697a8d",
      fontSize: "0.9375rem",
    },
    actionBtnEdit: {
      background: "none",
      border: "none",
      color: "#71dd37",
      cursor: "pointer",
      fontSize: "1.1rem",
      marginRight: "12px",
    },
    actionBtnDelete: {
      background: "none",
      border: "none",
      color: "#ff3e1d",
      cursor: "pointer",
      fontSize: "1.1rem",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
      padding: "20px",
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "30px",
      borderRadius: "8px",
      width: "100%",
      maxWidth: "450px",
      boxSizing: "border-box",
      position: "relative",
    },
    closeBtn: {
      position: "absolute",
      top: "15px",
      right: "15px",
      background: "none",
      border: "none",
      fontSize: "1.5rem",
      cursor: "pointer",
      color: "#a1acb8",
    },
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "#566a7f",
      textTransform: "uppercase",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "4px",
      border: "1px solid #d9dee3",
      fontSize: "0.9375rem",
      color: "#697a8d",
      marginBottom: "20px",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    modalActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "10px",
    },
  };

  return (
    <div style={styles.container}>
      <ToastContainer autoClose={3000} position="top-right" />
      <div style={styles.card}>
        <div style={styles.header}>
          <h4 style={styles.title}>System Role Management</h4>
          <button style={styles.btnPrimary} onClick={openCreateModal}>
            + Create New Role
          </button>
        </div>
        {loading ? (
          <p>Loading...</p>
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
                {roles.map((role) => (
                  <tr key={role.UserInfoId}>
                    <td style={styles.td}>#{role.UserInfoId}</td>
                    <td style={styles.td}>
                      <strong>{role.UserType}</strong>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...getRoleStyles(role.UserRole),
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {role.UserRole}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          backgroundColor:
                            role.ActStatus == 1
                              ? "rgba(113, 221, 55, 0.16)"
                              : "rgba(255, 62, 29, 0.16)",
                          color: role.ActStatus == 1 ? "#71dd37" : "#ff3e1d",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {role.ActStatus == 1 ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.actionBtnEdit}
                        onClick={() => openEditModal(role)}
                      >
                        ✏️
                      </button>
                      <button
                        style={styles.actionBtnDelete}
                        onClick={() => confirmDelete(role)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <button style={styles.closeBtn} onClick={closeModals}>
                ×
              </button>
              <h4>{formData.UserInfoId ? "Edit Role" : "Create Role"}</h4>
              <form onSubmit={handleFormSubmit}>
                <label style={styles.label}>Role Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.UserType}
                  onChange={(e) =>
                    setFormData({ ...formData, UserType: e.target.value })
                  }
                  required
                />
                <label style={styles.label}>Category</label>
                <select
                  style={styles.input}
                  value={formData.UserRole}
                  onChange={(e) =>
                    setFormData({ ...formData, UserRole: e.target.value })
                  }
                >
                  <option value="Superadmin">Superadmin</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.input}
                  value={formData.IsActive}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      IsActive: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    style={styles.btnOutline}
                    onClick={closeModals}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.btnPrimary}>
                    {formData.UserInfoId ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default RoleManagement;
