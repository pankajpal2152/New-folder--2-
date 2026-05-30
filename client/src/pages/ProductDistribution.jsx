import React, { useEffect, useState, useMemo } from "react";
import "./Productdistibution.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_BASE_URL } from "../config/constants";

export default function ProductDistribution() {
  const [acctHeads, setAcctHeads] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [trnTypes, setTrnTypes] = useState([]);
  const [history, setHistory] = useState([]);

  // ✅ NEW: State to hold the logged-in user's role
  const [userRole, setUserRole] = useState("");

  // Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [formData, setFormData] = useState({
    senderAcctHead: "",
    senderAcctName: "",
    senderDate: "",
    senderAcctNo: "",
    senderAcctNameDisplay: "",
    senderMode: "",
    productName: "",
    productId: "",
    transferQty: "",
    availableQty: "",
    receiverAcctHead: "",
    receiverAcctName: "",
    receiverAcctNo: "",
    receiverAcctNameDisplay: "",
    receiverMode: "",
    receiveQty: "",
    receiverAvailableQty: "",
    remarks: "",
  });

  useEffect(() => {
    // ✅ NEW: Extract the logged-in user's role from localStorage on mount
    const userStr = localStorage.getItem("loggedInUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || user.UserSignUpRole || "");
    }
    fetchData();
  }, []);

  const getStock = async (head, no, proId) => {
    if (!head || !no || !proId) return 0;
    try {
      const res = await axios.get(`${API_BASE_URL}/stock`, {
        params: { acctHead: head, acctNo: no, proId: proId },
      });
      return res.data.availableQty || 0;
    } catch (err) {
      console.error("Stock fetch error", err);
      return 0;
    }
  };

  useEffect(() => {
    getStock(
      formData.senderAcctHead,
      formData.senderAcctNo,
      formData.productId,
    ).then((qty) => setFormData((prev) => ({ ...prev, availableQty: qty })));
  }, [formData.senderAcctHead, formData.senderAcctNo, formData.productId]);

  useEffect(() => {
    getStock(
      formData.receiverAcctHead,
      formData.receiverAcctNo,
      formData.productId,
    ).then((qty) =>
      setFormData((prev) => ({ ...prev, receiverAvailableQty: qty })),
    );
  }, [formData.receiverAcctHead, formData.receiverAcctNo, formData.productId]);

  const fetchHistory = async (senderId, senderHead) => {
    if (!senderId || !senderHead) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/distribution-history`, {
        params: { senderId, senderHead },
      });
      setHistory(res.data);
    } catch (err) {
      console.error("History fetch error", err);
    }
  };

  const fetchData = async () => {
    try {
      const [heads, prods, accounts, trn] = await Promise.all([
        axios.get(`${API_BASE_URL}/accthead`),
        axios.get(`${API_BASE_URL}/products`),
        axios.get(`${API_BASE_URL}/accounts-mapping`),
        axios.get(`${API_BASE_URL}/trntypes`),
      ]);
      setAcctHeads(heads.data);
      setProducts(prods.data);
      setAllAccounts(accounts.data);
      setTrnTypes(trn.data);
    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  const handleSenderChange = (e) => {
    const { name, value } = e.target;
    if (name === "senderAcctHead") {
      const selected = acctHeads.find((h) => h.AcctHead === value);
      setFormData((prev) => ({
        ...prev,
        senderAcctHead: value,
        senderAcctName: selected ? selected.AcctHeadName : "",
        senderAcctNo: "",
        senderAcctNameDisplay: "",
        availableQty: "",
        // Automatically clear receiver when sender head changes to enforce hierarchy
        receiverAcctHead: "",
        receiverAcctName: "",
        receiverAcctNo: "",
        receiverAcctNameDisplay: "",
      }));
      setHistory([]);
    } else if (name === "senderAcctNo") {
      const selected = allAccounts.find(
        (a) => a.AcctNo == value && a.AcctHead === formData.senderAcctHead,
      );
      setFormData((prev) => ({
        ...prev,
        senderAcctNo: value,
        senderAcctNameDisplay: selected ? selected.AcctName : "",
      }));
      fetchHistory(value, formData.senderAcctHead);
    } else if (name === "productName") {
      const selectedPro = products.find((p) => p.ProName === value);
      setFormData((prev) => ({
        ...prev,
        productName: value,
        productId: selectedPro ? selectedPro.ProId : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReceiverChange = (e) => {
    const { name, value } = e.target;
    if (name === "receiverAcctHead") {
      const selected = acctHeads.find((h) => h.AcctHead === value);
      setFormData((prev) => ({
        ...prev,
        receiverAcctHead: value,
        receiverAcctName: selected ? selected.AcctHeadName : "",
        receiverAcctNo: "",
        receiverAcctNameDisplay: "",
        receiverAvailableQty: "",
      }));
    } else if (name === "receiverAcctNo") {
      const selected = allAccounts.find(
        (a) => a.AcctNo == value && a.AcctHead === formData.receiverAcctHead,
      );
      setFormData((prev) => ({
        ...prev,
        receiverAcctNo: value,
        receiverAcctNameDisplay: selected ? selected.AcctName : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transferQty || parseFloat(formData.transferQty) <= 0) {
      alert("Please enter a valid transfer quantity.");
      return;
    }
    if (parseFloat(formData.transferQty) > parseFloat(formData.availableQty)) {
      alert("Transfer quantity cannot exceed available quantity!");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/distribute`, {
        SenderDate: formData.senderDate,
        SenderId: formData.senderAcctNo,
        SenderRole: formData.senderAcctHead,
        SenderMode: formData.senderMode,
        ReceiverId: formData.receiverAcctNo,
        ReceiverRole: formData.receiverAcctHead,
        ReceiverMode: formData.receiverMode,
        ProductName: formData.productName,
        ProductId: formData.productId,
        DistributedQty: formData.transferQty,
        Remarks: formData.remarks,
      });
      alert("Product Distributed Successfully");

      const updatedSenderQty = await getStock(
        formData.senderAcctHead,
        formData.senderAcctNo,
        formData.productId,
      );

      setFormData((prev) => ({
        ...prev,
        transferQty: "",
        receiverAcctHead: "",
        receiverAcctName: "",
        receiverAcctNo: "",
        receiverAcctNameDisplay: "",
        receiverMode: "",
        receiveQty: "",
        receiverAvailableQty: "",
        remarks: "",
        availableQty: updatedSenderQty,
      }));

      fetchHistory(formData.senderAcctNo, formData.senderAcctHead);
    } catch (err) {
      alert("Error distributing product");
    }
  };

  // Memoized Filter Logic for the Ledger
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      // Date Filter
      let dateMatch = true;
      if (fromDate) {
        dateMatch =
          dateMatch && new Date(h.TransactionDate) >= new Date(fromDate);
      }
      if (toDate) {
        dateMatch =
          dateMatch && new Date(h.TransactionDate) <= new Date(toDate);
      }

      // Search Filter
      let searchMatch = true;
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const combinedString = `
          ${h.TransactionDate} 
          ${h.SenderHeadName} 
          ${h.SenderAcctName} 
          ${h.SenderAvailableQty} 
          ${h.ProductName} 
          ${h.TransferQty} 
          ${h.ReceiverHeadName} 
          ${h.ReceiverAcctName} 
          ${h.ReceiverAvailableQty} 
          ${h.SenderMode} 
          ${h.Remarks}
        `.toLowerCase();

        searchMatch = combinedString.includes(lowerSearch);
      }

      return dateMatch && searchMatch;
    });
  }, [history, searchTerm, fromDate, toDate]);

  // ✅ SMART FILTER: Enforce Role-Based Restrictions for the Sender Dropdown
  const allowedSenderHeads = useMemo(() => {
    if (userRole === "State Super Administrator")
      return acctHeads.filter((h) => h.AcctHead === "SN");
    if (userRole === "District Administrator")
      return acctHeads.filter((h) => h.AcctHead === "DN");
    if (userRole === "Supervisor")
      return acctHeads.filter((h) => h.AcctHead === "SV");
    if (userRole === "Astha Didi")
      return acctHeads.filter((h) => h.AcctHead === "AD");
    if (userRole === "Astha Maa")
      return acctHeads.filter((h) => h.AcctHead === "AM");
    return acctHeads; // Fallback
  }, [acctHeads, userRole]);

  // ✅ SMART FILTER: Cascade the Receiver Dropdown based on the Sender selected
  const allowedReceiverHeads = useMemo(() => {
    if (formData.senderAcctHead === "SU")
      return acctHeads.filter((h) => h.AcctHead === "SN");
    if (formData.senderAcctHead === "SN")
      return acctHeads.filter((h) => h.AcctHead === "DN");
    if (formData.senderAcctHead === "DN")
      return acctHeads.filter((h) => h.AcctHead === "SV");
    if (formData.senderAcctHead === "SV")
      return acctHeads.filter((h) => h.AcctHead === "AD");
    if (formData.senderAcctHead === "AD")
      return acctHeads.filter((h) => h.AcctHead === "AM");
    return acctHeads;
  }, [acctHeads, formData.senderAcctHead]);

  // ✅ NEW: Filter modes based on Dr/Cr logic
  const filteredSenderModes = useMemo(
    () => trnTypes.filter((t) => t.DisplayName.startsWith("Dr")),
    [trnTypes],
  );
  const filteredReceiverModes = useMemo(
    () => trnTypes.filter((t) => t.DisplayName.startsWith("Cr")),
    [trnTypes],
  );

  return (
    <div className="container mt-5">
      <div className="card shadow-lg border-0 rounded-10">
        <div
          className="card-header text-white"
          style={{ background: "#696cff" }}
        >
          <h3>Product Transfer Information</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <p className="PerInfo">Sender Information:</p>
            <div className="row">
              <div className="col-md-4 mb-2">
                <label className="form-label-custom">Account Head</label>
                <select
                  className="form-control form-control-sm"
                  name="senderAcctHead"
                  value={formData.senderAcctHead}
                  onChange={handleSenderChange}
                  required
                >
                  <option value="">--Select Account Head--</option>
                  {allowedSenderHeads.map((h) => (
                    <option key={h.AcctHead} value={h.AcctHead}>
                      {h.DisplayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-5 mb-2">
                <label className="form-label-custom">Account Head Name</label>
                <input
                  className="form-control"
                  type="text"
                  name="senderAcctName"
                  value={formData.senderAcctName}
                  readOnly
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label-custom">Transaction Date</label>
                <input
                  className="form-control form-control-sm"
                  type="date"
                  name="senderDate"
                  onChange={handleSenderChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-5">
                <label className="form-label-custom">Account Number</label>
                <select
                  className="form-control form-control-sm"
                  name="senderAcctNo"
                  value={formData.senderAcctNo}
                  onChange={handleSenderChange}
                  disabled={!formData.senderAcctHead}
                  required
                >
                  <option value="">--Select Account Number--</option>
                  {allAccounts
                    .filter((a) => a.AcctHead === formData.senderAcctHead)
                    .map((a) => (
                      <option key={a.AcctNo} value={a.AcctNo}>
                        {a.DisplayName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-7 mb-3">
                <label className="form-label-custom">Account Name</label>
                <input
                  className="form-control"
                  type="text"
                  name="senderAcctNameDisplay"
                  value={formData.senderAcctNameDisplay}
                  readOnly
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-3 mb-2">
                <label className="form-label-custom">Transaction Mode</label>
                <select
                  className="form-control form-control-sm"
                  name="senderMode"
                  value={formData.senderMode}
                  onChange={handleSenderChange}
                  required
                >
                  <option value="">--Select Mode--</option>
                  {filteredSenderModes.map((t) => (
                    <option key={t.TrnTypyId} value={t.DisplayName}>
                      {t.DisplayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-2">
                <label className="form-label-custom">Product Name</label>
                <select
                  className="form-control form-control-sm"
                  name="productName"
                  value={formData.productName}
                  onChange={handleSenderChange}
                  required
                >
                  <option value="">--Select Product--</option>
                  {products.map((p) => (
                    <option key={p.ProId} value={p.ProName}>
                      {p.ProName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 mb-2">
                <label className="form-label-custom">Transfer Qty</label>
                <input
                  className="form-control"
                  type="number"
                  name="transferQty"
                  value={formData.transferQty}
                  onChange={handleSenderChange}
                  required
                />
              </div>
              <div className="col-md-3 mb-2">
                <label className="form-label-custom">Available Qty</label>
                <input
                  className="form-control"
                  type="text"
                  name="availableQty"
                  value={formData.availableQty}
                  readOnly
                />
              </div>
            </div>

            <p className="AddInfo">Receiver Information:</p>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Account Head</label>
                <select
                  className="form-control form-control-sm"
                  name="receiverAcctHead"
                  value={formData.receiverAcctHead}
                  onChange={handleReceiverChange}
                  required
                >
                  <option value="">--Select Account Head--</option>
                  {allowedReceiverHeads.map((h) => (
                    <option key={h.AcctHead} value={h.AcctHead}>
                      {h.DisplayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Account Head Name</label>
                <input
                  className="form-control"
                  type="text"
                  name="receiverAcctName"
                  value={formData.receiverAcctName}
                  readOnly
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-5">
                <label className="form-label-custom">Account Number</label>
                <select
                  className="form-control form-control-sm"
                  name="receiverAcctNo"
                  value={formData.receiverAcctNo}
                  onChange={handleReceiverChange}
                  disabled={!formData.receiverAcctHead}
                  required
                >
                  <option value="">--Select Account Number--</option>
                  {allAccounts
                    .filter((a) => a.AcctHead === formData.receiverAcctHead)
                    .map((a) => (
                      <option key={a.AcctNo} value={a.AcctNo}>
                        {a.DisplayName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-7 mb-3">
                <label className="form-label-custom">Account Name</label>
                <input
                  className="form-control"
                  type="text"
                  name="receiverAcctNameDisplay"
                  value={formData.receiverAcctNameDisplay}
                  readOnly
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Transaction Mode</label>
                <select
                  className="form-control form-control-sm"
                  name="receiverMode"
                  value={formData.receiverMode}
                  onChange={handleReceiverChange}
                  required
                >
                  <option value="">--Select Mode--</option>
                  {filteredReceiverModes.map((t) => (
                    <option key={t.TrnTypyId} value={t.DisplayName}>
                      {t.DisplayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label-custom">Receive Quantity</label>
                <input
                  className="form-control"
                  type="number"
                  name="receiveQty"
                  value={formData.receiveQty}
                  onChange={handleReceiverChange}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label-custom">Current Qty</label>
                <input
                  className="form-control"
                  type="text"
                  name="receiverAvailableQty"
                  value={formData.receiverAvailableQty}
                  readOnly
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 mb-2">
                <label className="form-label-custom">Remarks</label>
                <textarea
                  className="form-control"
                  name="remarks"
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="col-md-12">
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
            </div>
          </form>

          {/* Ledger / History Filter Controls */}
          <div
            className="mt-5 mb-3"
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <div className="row align-items-end">
              <div className="col-md-4">
                <label className="form-label-custom">Search Ledger</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search any field..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label-custom">From Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label-custom">To Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-secondary btn-sm w-100"
                  onClick={() => {
                    setSearchTerm("");
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered custom-table table-sm">
              <thead>
                <tr style={{ backgroundColor: "#696cff", color: "white" }}>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>S-Bal</th>
                  <th>Product Name</th>
                  <th>Transferred</th>
                  <th>Receiver</th>
                  <th>R-Bal</th>
                  <th>Mode</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h) => (
                  <tr key={h.TrnId}>
                    <td>{h.TransactionDate}</td>
                    <td>
                      {h.SenderHeadName}
                      <br />
                      <small className="text-muted">
                        {h.SenderAcctName} ({h.SenderAcctNo})
                      </small>
                    </td>
                    <td>
                      <strong>{h.SenderAvailableQty}</strong>
                    </td>
                    <td>{h.ProductName}</td>
                    <td style={{ color: "red", fontWeight: "bold" }}>
                      - {h.TransferQty}
                    </td>
                    <td>
                      {h.ReceiverHeadName}
                      <br />
                      <small className="text-muted">
                        {h.ReceiverAcctName} ({h.ReceiverAcctNo})
                      </small>
                    </td>
                    <td>
                      <strong>{h.ReceiverAvailableQty}</strong>
                    </td>
                    <td>{h.SenderMode}</td>
                    <td>{h.Remarks}</td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-3">
                      No transactions found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
