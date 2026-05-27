import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../config/constants";

const ProductDistribution = () => {
  const [formData, setFormData] = useState({
    AcctHeadId: "",
    ReceiverId: "",
    SupervisorId: "",
    ProductName: "",
    DistributedQty: "",
    Remarks: "By Transfer",
    Date: new Date().toISOString().split("T")[0],
  });

  const [accountHeads, setAccountHeads] = useState([]);
  const [accountsTable, setAccountsTable] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [history, setHistory] = useState([]);

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
  const isStateAdmin =
    user.UserSignUpRole === "State Super Administrator" ||
    user.role === "State Super Administrator";

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [headsRes, acctTableRes, stockRes, histRes, productsRes] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/accthead`),
          axios.get(`${API_BASE_URL}/accounts-mapping`),
          axios.get(`${API_BASE_URL}/stock`),
          axios.get(`${API_BASE_URL}/distribution-history`, {
            params: { senderId: user.UserSignUpId },
          }),
          axios.get(`${API_BASE_URL}/products`),
        ]);

      setAccountHeads(headsRes.data);
      setAccountsTable(acctTableRes.data);
      setStock(stockRes.data);
      setHistory(histRes.data);
      setProducts(productsRes.data);

      if (isStateAdmin) {
        const dnHead = headsRes.data.find((h) => h.AcctHead === "DN");
        if (dnHead) {
          setFormData((prev) => ({ ...prev, AcctHeadId: dnHead.AcctHead }));
          setFilteredAccounts(
            acctTableRes.data.filter((acc) => acc.AcctHead === "DN"),
          );
        }
      }
    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  useEffect(() => {
    if (formData.AcctHeadId) {
      const relatedAccounts = accountsTable.filter(
        (acc) => acc.AcctHead === formData.AcctHeadId,
      );
      setFilteredAccounts(relatedAccounts);
      setFormData((prev) => ({ ...prev, ReceiverId: "", SupervisorId: "" }));
    }
  }, [formData.AcctHeadId, accountsTable]);

  useEffect(() => {
    if (formData.ReceiverId) {
      fetchSupervisors(formData.ReceiverId);
    } else {
      setSupervisors([]);
    }
  }, [formData.ReceiverId]);

  const fetchSupervisors = async (distId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/supervisors-by-dist/${distId}`,
      );
      setSupervisors(res.data);
    } catch (err) {
      console.error("Error fetching supervisors:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.ReceiverId ||
      !formData.ProductName ||
      !formData.DistributedQty ||
      !formData.AcctHeadId
    ) {
      toast.warning("Please fill in required fields.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/distribute`, {
        ...formData,
        SenderId: user.UserSignUpId,
        ReceiverRole: formData.AcctHeadId,
      });
      toast.success("Transaction Entry Saved Successfully!");

      // Reset logic
      const defaultHead = isStateAdmin ? "DN" : formData.AcctHeadId;
      setFormData({
        AcctHeadId: defaultHead,
        ReceiverId: "",
        SupervisorId: "",
        ProductName: "",
        DistributedQty: "",
        Remarks: "By Transfer",
        Date: new Date().toISOString().split("T")[0],
      });

      const [histRes, stockRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/distribution-history`, {
          params: { senderId: user.UserSignUpId },
        }),
        axios.get(`${API_BASE_URL}/stock`),
      ]);
      setHistory(histRes.data);
      setStock(stockRes.data);
    } catch (err) {
      toast.error("Transaction Entry Failed.");
    }
  };

  const handleCancel = () => {
    const defaultHead = isStateAdmin ? "DN" : "";
    setFormData({
      AcctHeadId: defaultHead,
      ReceiverId: "",
      SupervisorId: "",
      ProductName: "",
      DistributedQty: "",
      Remarks: "By Transfer",
      Date: new Date().toISOString().split("T")[0],
    });
  };

  const selectedAcctHeadName =
    accountHeads.find((a) => String(a.AcctHead) === String(formData.AcctHeadId))
      ?.AcctHeadName || "";
  const selectedReceiverName =
    filteredAccounts.find(
      (r) => String(r.AcctNo) === String(formData.ReceiverId),
    )?.AcctName || "";
  const selectedSupervisorHead = formData.SupervisorId
    ? supervisors.find((s) => String(s.id) === String(formData.SupervisorId))
        ?.Head
    : "";
  const selectedSupervisorName =
    supervisors.find((s) => String(s.id) === String(formData.SupervisorId))
      ?.name || "";
  const selectedProductStock =
    stock.find((s) => s.ProductName === formData.ProductName)?.AvailableQty ||
    "0.00";

  const styles = {
    container: {
      backgroundColor: "#a9c4db",
      padding: "10px",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
    },
    wrapper: {
      backgroundColor: "#f0f4f8",
      border: "3px solid #1E6bb8",
      display: "flex",
      flexDirection: "row",
    },
    leftPanel: { flex: 1, padding: "4px" },
    header: {
      backgroundColor: "#1E6bb8",
      color: "#fff",
      padding: "4px",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "15px",
    },
    sectionBanner: {
      backgroundColor: "#1E6bb8",
      color: "#fff",
      padding: "2px 8px",
      fontSize: "12px",
      fontWeight: "bold",
      marginTop: "6px",
    },
    label: {
      color: "#005bb5",
      fontSize: "11px",
      fontWeight: "bold",
      margin: 0,
      alignSelf: "center",
      whiteSpace: "nowrap",
      textAlign: "left",
      paddingLeft: "10px",
      width: "190px",
    },
    input: {
      height: "24px",
      fontSize: "12px",
      padding: "0 6px",
      borderRadius: "2px",
      border: "1px solid #a1acb8",
      width: "100%",
      outline: "none",
    },
    redText: {
      color: "#d93025",
      fontWeight: "bold",
      fontSize: "11px",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      alignSelf: "center",
      marginLeft: "10px",
    },
    actionBtn: {
      height: "24px",
      fontSize: "11px",
      fontWeight: "bold",
      padding: "0 15px",
      borderRadius: "2px",
      border: "1px solid #a1acb8",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <ToastContainer autoClose={3000} position="top-center" />

      <div style={styles.wrapper}>
        <div style={styles.leftPanel}>
          <div style={styles.header}>
            Product Distribution Transaction Entry
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.sectionBanner}>Account Information</div>

            <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
              <label style={styles.label}>Transfer From (Sender)</label>
              <select
                style={{
                  ...styles.input,
                  width: "450px",
                  backgroundColor: "#e9ecef",
                }}
                value={user?.UserSignUpId || ""}
                disabled
              >
                <option value={user?.UserSignUpId || ""}>
                  {user?.role || user?.UserSignUpRole} - {user?.username}
                </option>
              </select>
              <span style={styles.redText}>
                {user?.role || user?.UserSignUpRole}
              </span>
              <div className="ms-auto d-flex align-items-center gap-2 pe-2">
                <label style={{ ...styles.label, paddingLeft: 0 }}>
                  Entry Date
                </label>
                <input
                  type="date"
                  style={{ ...styles.input, width: "130px" }}
                  value={formData.Date}
                  onChange={(e) =>
                    setFormData({ ...formData, Date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
              <label style={styles.label}>Transfer To (Receiver Role)</label>
              <select
                style={{ ...styles.input, width: "450px" }}
                value={formData.AcctHeadId}
                onChange={(e) =>
                  setFormData({ ...formData, AcctHeadId: e.target.value })
                }
                disabled={isStateAdmin}
              >
                <option value="">-- Select Receiver Role --</option>
                {accountHeads.map((a) => (
                  <option key={a.AcctHeadId} value={a.AcctHead}>
                    {a.AcctHead} - {a.AcctHeadName || a.AcctHead}
                  </option>
                ))}
              </select>
              <span style={styles.redText}>{selectedAcctHeadName}</span>
            </div>

            <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
              <label style={styles.label}>Transfer To (Receiver Name)</label>
              <select
                style={{ ...styles.input, width: "450px" }}
                value={formData.ReceiverId}
                onChange={(e) =>
                  setFormData({ ...formData, ReceiverId: e.target.value })
                }
              >
                <option value="">-- Select Receiver --</option>
                {filteredAccounts.map((r) => (
                  <option key={r.AcctNo} value={r.AcctNo}>
                    {r.AcctNo} - {r.AcctName}
                  </option>
                ))}
              </select>
              <span style={styles.redText}>{selectedReceiverName}</span>
            </div>

            {!isStateAdmin && (
              <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
                <label style={styles.label}>Transfer To (Supervisor)</label>
                <select
                  style={{ ...styles.input, width: "450px" }}
                  value={formData.SupervisorId}
                  onChange={(e) =>
                    setFormData({ ...formData, SupervisorId: e.target.value })
                  }
                >
                  <option value="">-- Select Supervisor (Optional) --</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {s.name}
                    </option>
                  ))}
                </select>
                <span style={styles.redText}>
                  {selectedSupervisorHead
                    ? `${selectedSupervisorHead} - ${selectedSupervisorName}`
                    : ""}
                </span>
              </div>
            )}

            <div style={styles.sectionBanner}>Stock / Product Information</div>
            <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
              <label style={styles.label}>Select Product</label>
              <select
                style={{ ...styles.input, width: "450px" }}
                value={formData.ProductName}
                onChange={(e) =>
                  setFormData({ ...formData, ProductName: e.target.value })
                }
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.ProId} value={p.ProName}>
                    {p.ProName}
                  </option>
                ))}
              </select>
              <span style={styles.redText}>{formData.ProductName}</span>
              <label style={{ ...styles.label, marginLeft: "20px" }}>
                Total Available
              </label>
              <span style={styles.redText}>{selectedProductStock}</span>
            </div>

            <div style={styles.sectionBanner}>Transaction Details</div>
            <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
              <label style={styles.label}>Tran. Amount</label>
              <input
                type="number"
                style={{
                  ...styles.input,
                  width: "150px",
                  border: "1px solid #d93025",
                }}
                value={formData.DistributedQty}
                onChange={(e) =>
                  setFormData({ ...formData, DistributedQty: e.target.value })
                }
              />
              <label style={{ ...styles.label, marginLeft: "20px" }}>
                Remarks
              </label>
              <input
                type="text"
                style={{ ...styles.input, flex: 1 }}
                value={formData.Remarks}
                onChange={(e) =>
                  setFormData({ ...formData, Remarks: e.target.value })
                }
              />
              <div className="ms-auto d-flex gap-2 pe-2">
                <button type="submit" style={styles.actionBtn}>
                  Save
                </button>
                <button
                  type="button"
                  style={styles.actionBtn}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>

            <div style={{ ...styles.sectionBanner, marginTop: "10px" }}>
              Multiple Entries List
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #a1acb8",
                height: "280px",
                overflowY: "auto",
                marginTop: "2px",
              }}
            >
              <table
                className="table table-sm mb-0"
                style={{ fontSize: "11px", borderCollapse: "collapse" }}
              >
                <thead
                  style={{
                    backgroundColor: "#f0f4f8",
                    position: "sticky",
                    top: 0,
                    color: "#005bb5",
                  }}
                >
                  <tr>
                    <th
                      style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                    >
                      Acct. Head
                    </th>
                    <th
                      style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                    >
                      Acct. Number
                    </th>
                    <th
                      style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                    >
                      Supervisor
                    </th>
                    <th
                      style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                    >
                      Product Name
                    </th>
                    <th
                      style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        border: "1px solid #ccc",
                        padding: "2px 4px",
                        textAlign: "right",
                      }}
                    >
                      Sent Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.DistId}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "2px 4px",
                          color: "#d93025",
                        }}
                      >
                        {row.ReceiverRole}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "2px 4px",
                          fontWeight: "bold",
                        }}
                      >
                        {row.ReceiverId}
                      </td>
                      <td
                        style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                      >
                        {row.SupervisorId || "-"}
                      </td>
                      <td
                        style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                      >
                        {row.ProductName}
                      </td>
                      <td
                        style={{ border: "1px solid #ccc", padding: "2px 4px" }}
                      >
                        {String(row.ProductDate).substring(0, 10)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "2px 4px",
                          textAlign: "right",
                          fontWeight: "bold",
                          color: "#d93025",
                        }}
                      >
                        {row.DistributedQty}.00
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductDistribution;
