import React, { useEffect, useState } from "react";
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
    fetchData();
  }, []);

  // Utility to fetch accurate stock dynamically
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

  // Real-time Update: Fetch Stock for Sender dynamically
  useEffect(() => {
    getStock(
      formData.senderAcctHead,
      formData.senderAcctNo,
      formData.productId,
    ).then((qty) => setFormData((prev) => ({ ...prev, availableQty: qty })));
  }, [formData.senderAcctHead, formData.senderAcctNo, formData.productId]);

  // Real-time Update: Fetch Stock for Receiver dynamically
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
        SenderId: formData.senderAcctNo,
        SenderRole: formData.senderAcctHead,
        ReceiverId: formData.receiverAcctNo,
        ReceiverRole: formData.receiverAcctHead,
        ProductName: formData.productName,
        ProductId: formData.productId,
        DistributedQty: formData.transferQty,
        Remarks: formData.remarks,
      });
      alert("Product Distributed Successfully");

      // Instantly calculate what the new stock of the sender should be
      const updatedSenderQty = await getStock(
        formData.senderAcctHead,
        formData.senderAcctNo,
        formData.productId,
      );

      // Reset exclusively Receiver Info + Transaction Qty + Remarks
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
        availableQty: updatedSenderQty, // Show accurate real-time sender stock directly after form completion
      }));

      // Pull new latest history row from backend
      fetchHistory(formData.senderAcctNo, formData.senderAcctHead);
    } catch (err) {
      alert("Error distributing product");
    }
  };

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
                  {acctHeads.map((h) => (
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
                  {trnTypes.map((t) => (
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
                  {acctHeads.map((h) => (
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
                  {trnTypes.map((t) => (
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

            {/* REMARKS FIELD MOVED TO BOTTOM JUST BEFORE SUBMIT*/}
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

          {/* Real-time History Table Rendered from Transactions */}
          <div className="table-responsive mt-5">
            <table className="custom-table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receiver</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.DistId}>
                    <td>{new Date(h.ProductDate).toLocaleDateString()}</td>
                    <td>{h.ReceiverRole}</td>
                    <td>{h.ProductName}</td>
                    <td>{h.DistributedQty}</td>
                    <td>{h.Remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
