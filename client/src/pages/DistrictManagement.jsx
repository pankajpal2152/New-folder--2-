import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../config/constants";

const DistrictManagement = () => {
  const [districts, setDistricts] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [formData, setFormData] = useState({
    DistId: null,
    DistName: "",
    StateId: "",
    IsActive: 1,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [distRes, stateRes] = await Promise.all([
        fetch(`${API_BASE_URL}/manage/districts`),
        fetch(`${API_BASE_URL}/manage/states`),
      ]);
      setDistricts(await distRes.json());
      setStates(await stateRes.json());
    } catch (error) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormData({ DistId: null, DistName: "", StateId: "", IsActive: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (distRow) => {
    setFormData({
      ...distRow,
      IsActive: distRow.IsActive !== undefined ? distRow.IsActive : 1,
    });
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setFormData({ DistId: null, DistName: "", StateId: "", IsActive: 1 });
    setSelectedDistrict(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.StateId)
      return toast.warning("Please select a parent state.");

    const isEditing = formData.DistId !== null;
    const url = isEditing
      ? `${API_BASE_URL}/manage/districts/${formData.DistId}`
      : `${API_BASE_URL}/manage/districts`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          DistName: formData.DistName,
          StateId: formData.StateId,
          IsActive: formData.IsActive,
        }),
      });
      if (response.ok) {
        toast.success("Saved successfully!");
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error("Error saving district.");
      }
    } catch (error) {
      toast.error("Network error.");
    }
  };

  const confirmDelete = (distRow) => {
    setSelectedDistrict(distRow);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    toast.loading("Deleting...", { toastId: "delDist" });
    try {
      const response = await fetch(
        `${API_BASE_URL}/manage/districts/${selectedDistrict.DistId}`,
        { method: "DELETE" },
      );
      toast.dismiss("delDist");
      if (response.ok) {
        toast.success("Deleted!");
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to delete.");
      }
    } catch (error) {
      toast.dismiss("delDist");
      toast.error("Network error.");
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      width: "100%",
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
    tableContainer: {
      width: "100%",
      overflowX: "auto",
      display: "block",
      maxHeight: "600px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "left",
      minWidth: "700px",
    },
    th: {
      position: "sticky",
      top: 0,
      padding: "14px 16px",
      backgroundColor: "#f5f5f9",
      color: "#566a7f",
      fontWeight: "600",
      fontSize: "0.875rem",
      borderBottom: "1px solid #d9dee3",
      zIndex: 1,
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
          <h4 style={styles.title}>District Management Dashboard</h4>
          <button style={styles.btnPrimary} onClick={openCreateModal}>
            + Add District
          </button>
        </div>
        {loading ? (
          <p>Loading Data...</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Dist ID</th>
                  <th style={styles.th}>District Name</th>
                  <th style={styles.th}>Parent State</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d) => (
                  <tr key={d.DistId}>
                    <td style={styles.td}>#{d.DistId}</td>
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: "600",
                        color: "#566a7f",
                      }}
                    >
                      {d.DistName}
                    </td>
                    <td style={styles.td}>
                      {d.StateName || `State ID: ${d.StateId}`}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          backgroundColor:
                            d.IsActive == 1
                              ? "rgba(113, 221, 55, 0.16)"
                              : "rgba(255, 62, 29, 0.16)",
                          color: d.IsActive == 1 ? "#71dd37" : "#ff3e1d",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {d.IsActive == 1 ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.actionBtnEdit}
                        onClick={() => openEditModal(d)}
                      >
                        ✏️
                      </button>
                      <button
                        style={styles.actionBtnDelete}
                        onClick={() => confirmDelete(d)}
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
              <h4 style={{ marginBottom: "20px", color: "#566a7f" }}>
                {formData.DistId ? "Edit District" : "Add New District"}
              </h4>
              <form onSubmit={handleFormSubmit}>
                <label style={styles.label}>Parent State</label>
                <select
                  style={styles.input}
                  value={formData.StateId}
                  onChange={(e) =>
                    setFormData({ ...formData, StateId: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select State...
                  </option>
                  {states.map((s) => (
                    <option key={s.StateId} value={s.StateId}>
                      {s.StateName}
                    </option>
                  ))}
                </select>

                <label style={styles.label}>District Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.DistName}
                  onChange={(e) =>
                    setFormData({ ...formData, DistName: e.target.value })
                  }
                  required
                />

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
                    {formData.DistId ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, textAlign: "center" }}>
              <h4 style={{ color: "#ff3e1d" }}>Delete District</h4>
              <p style={{ color: "#697a8d" }}>
                Are you sure you want to permanently delete{" "}
                <strong>{selectedDistrict?.DistName}</strong>?
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button style={styles.btnOutline} onClick={closeModals}>
                  Cancel
                </button>
                <button style={styles.btnDanger} onClick={handleDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DistrictManagement;
