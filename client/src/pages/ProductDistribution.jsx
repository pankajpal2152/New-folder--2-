import React, { useEffect, useState } from "react";
import "./Productdistibution.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { API_BASE_URL } from "../config/constants";

export default function ProductDistribution() {
  // ====================================
  // STATE
  // ====================================
  const [acctHeads, setAcctHeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
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
      const [heads, prods] = await Promise.all([
        axios.get(`${API_BASE_URL}/accthead`),
        axios.get(`${API_BASE_URL}/products`),
      ]);
      setAcctHeads(heads.data);
      setProducts(prods.data);
    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
                    onChange={handleChange}
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
                    placeholder="Account Head Name"
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label-custom">Transaction Date</label>
                  <input
                    className="form-control form-control-sm"
                    type="date"
                    name="senderDate"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-5">
                  <label className="form-label-custom">Account Number</label>
                  <select
                    className="form-control form-control-sm"
                    name="senderAcctNo"
                    onChange={handleChange}
                  >
                    <option value="">--Select Account Number--</option>
                  </select>
                </div>
                <div className="col-md-7 mb-3">
                  <label className="form-label-custom">Account Name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="senderAcctNameDisplay"
                    placeholder="Account Name"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 mb-2">
                  <label className="form-label-custom">Transaction Mode</label>
                  <select
                    className="form-control form-control-sm"
                    name="senderMode"
                    onChange={handleChange}
                  >
                    <option value="">--Select Transaction Mode--</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                <div className="col-md-5 mb-2">
                  <label className="form-label-custom">Product Name</label>
                  <select
                    className="form-control form-control-sm"
                    name="productName"
                    onChange={handleChange}
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
                    onChange={handleChange}
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

              {/* Receiver Info Section */}
              <div className="row">
                <p className="AddInfo">Receiver Information:</p>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Account Head</label>
                  <select
                    className="form-control form-control-sm"
                    name="receiverAcctHead"
                    onChange={handleChange}
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
                    placeholder="Account Head Name"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-5">
                  <label className="form-label-custom">Account Number</label>
                  <select
                    className="form-control form-control-sm"
                    name="receiverAcctNo"
                    onChange={handleChange}
                  >
                    <option value="">--Select Account Number--</option>
                  </select>
                </div>
                <div className="col-md-7 mb-3">
                  <label className="form-label-custom">Account Name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="receiverAcctNameDisplay"
                    placeholder="Account Name"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Transaction Mode</label>
                  <select
                    className="form-control form-control-sm"
                    name="receiverMode"
                    onChange={handleChange}
                  >
                    <option value="">--Select Transaction Mode--</option>
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label-custom">Receive Quantity</label>
                  <input
                    className="form-control"
                    type="number"
                    name="receiveQty"
                    placeholder="0"
                    onChange={handleChange}
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
                    className="form-control form-control-sm"
                    name="remarks"
                    rows="2"
                    placeholder="Remarks"
                    onChange={handleChange}
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
