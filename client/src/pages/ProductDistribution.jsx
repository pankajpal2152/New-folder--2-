import React, { useEffect, useState } from "react";
import "./Productdistibution.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_BASE_URL } from "../config/constants";

export default function ProductDistribution() {
  // ====================================
  // STATE
  // ====================================
  const [acctHeads, setAcctHeads] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [trnTypes, setTrnTypes] = useState([]);
  const [formData, setFormData] = useState({
    senderAcctHead: "",
    senderAcctName: "",
    senderDate: "",
    senderAcctNo: "",
    senderAcctNameDisplay: "",
    senderMode: "",
    productName: "",
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

  // ====================================
  // DATA FETCHING
  // ====================================
  useEffect(() => {
    fetchData();
  }, []);

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
      }));
    } else if (name === "senderAcctNo") {
      const selected = allAccounts.find(
        (a) => a.AcctNo == value && a.AcctHead === formData.senderAcctHead,
      );
      setFormData((prev) => ({
        ...prev,
        senderAcctNo: value,
        senderAcctNameDisplay: selected ? selected.AcctName : "",
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
    try {
      await axios.post(`${API_BASE_URL}/distribute`, {
        SenderId: formData.senderAcctNo,
        ReceiverId: formData.receiverAcctNo,
        ReceiverRole: formData.receiverAcctHead,
        ProductName: formData.productName,
        DistributedQty: formData.transferQty,
        Remarks: formData.remarks,
        SupervisorId: null,
      });
      alert("Product Distributed Successfully");
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
        <div className="col-md-12 mt-4">
          <p className="PerInfo">Sender Information:</p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
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
                <div className="col-md-2 mb-3">
                  <label className="form-label-custom">Transaction Date</label>
                  <input
                    className="form-control form-control-sm"
                    type="date"
                    name="senderDate"
                    onChange={handleSenderChange}
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
                    onChange={handleSenderChange}
                  >
                    <option value="">--Select Transaction Mode--</option>
                    {trnTypes.map((t) => (
                      <option key={t.TrnTypyId} value={t.DisplayName}>
                        {t.DisplayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5 mb-2">
                  <label className="form-label-custom">Product Name</label>
                  <select
                    className="form-control form-control-sm"
                    name="productName"
                    onChange={handleSenderChange}
                  >
                    <option value="">--Select Product Name--</option>
                    {products.map((p) => (
                      <option key={p.ProId} value={p.ProName}>
                        {p.ProName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label-custom">Transfer Quantity</label>
                  <input
                    className="form-control"
                    type="number"
                    name="transferQty"
                    placeholder="0"
                    onChange={handleSenderChange}
                  />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label-custom">
                    Available Quantity
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    name="availableQty"
                    placeholder="0"
                    readOnly
                  />
                </div>
              </div>

              <div className="row">
                <p className="AddInfo">Receiver Information:</p>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Account Head</label>
                  <select
                    className="form-control form-control-sm"
                    name="receiverAcctHead"
                    value={formData.receiverAcctHead}
                    onChange={handleReceiverChange}
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
                    onChange={handleReceiverChange}
                  >
                    <option value="">--Select Transaction Mode--</option>
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
                    placeholder="0"
                    onChange={handleReceiverChange}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label-custom">
                    Available Quantity
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    name="receiverAvailableQty"
                    placeholder="0"
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
                    onChange={handleReceiverChange}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <button className="btn btn-primary" type="submit">
                  Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
