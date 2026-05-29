import React, { useEffect, useState } from "react";
import "./Productdistibution.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { API_BASE_URL } from "../config/constants";
import { toast, ToastContainer } from "react-toastify";

export default function Productdistibution() {
  // ====================================
  // STATE
  // ====================================
  const [acctHeads, setAcctHeads] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);

  const [formData, setFormData] = useState({
    senderHead: "",
    senderAcctNo: "",
    senderAcctName: "",
    transactionDate: "",
    trnMode: "",
    productName: "",
    transferQty: "",
    availableQty: "",

    receiverHead: "",
    receiverAcctNo: "",
    receiverAcctName: "",
    receiverTrnMode: "",
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
      const [headsRes, accountsRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/accthead`),
        axios.get(`${API_BASE_URL}/accounts-mapping`),
        axios.get(`${API_BASE_URL}/products`),
      ]);
      setAcctHeads(headsRes.data);
      setAccounts(accountsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error("Failed to load dropdown data");
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
        ReceiverRole: formData.receiverHead,
        ProductName: formData.productName,
        DistributedQty: formData.transferQty,
        Remarks: formData.remarks,
      });
      toast.success("Product distributed successfully!");
      setFormData({ ...formData, transferQty: "", receiveQty: "" });
    } catch (error) {
      toast.error("Failed to distribute product");
    }
  };

  return (
    <div className="container mt-5">
      <ToastContainer />
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
                    name="senderHead"
                    onChange={handleChange}
                    required
                  >
                    <option value="">--Select Account Head--</option>
                    {acctHeads.map((h) => (
                      <option key={h.accthead} value={h.accthead}>
                        {h.accthead} - {h.AcctHeadName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5 mb-2">
                  <label className="form-label-custom">Account Head Name</label>
                  <input
                    type="text"
                    name="senderAcctName"
                    className="form-control"
                    placeholder="Account Head Name"
                    value={formData.senderAcctName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label-custom">Transaction Date</label>
                  <input
                    type="date"
                    name="transactionDate"
                    className="form-control form-control-sm"
                    value={formData.transactionDate}
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
                    required
                  >
                    <option value="">--Select Account Number--</option>
                    {accounts
                      .filter((a) => a.AcctHead === formData.senderHead)
                      .map((a) => (
                        <option key={a.AcctNo} value={a.AcctNo}>
                          {a.AcctNo}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-md-7 mb-3">
                  <label className="form-label-custom">Account Name</label>
                  <input
                    type="text"
                    name="senderAcctName"
                    className="form-control"
                    placeholder="Account Name"
                    value={formData.senderAcctName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 mb-2">
                  <label className="form-label-custom">Transaction Mode</label>
                  <select
                    className="form-control form-control-sm"
                    name="trnMode"
                    onChange={handleChange}
                  >
                    <option value="">--Select Transaction Mode--</option>
                    <option value="TRANSFER">Transfer</option>
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
                    type="number"
                    name="transferQty"
                    className="form-control"
                    placeholder="Transfer Quantity"
                    value={formData.transferQty}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label-custom">
                    Available Quantity
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Available Quantity"
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
                    name="receiverHead"
                    onChange={handleChange}
                  >
                    <option value="">--Select Account Head--</option>
                    {acctHeads.map((h) => (
                      <option key={h.accthead} value={h.accthead}>
                        {h.accthead} - {h.AcctHeadName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Account Head Name</label>
                  <input
                    type="text"
                    name="receiverAcctName"
                    className="form-control"
                    placeholder="Account Head Name"
                    value={formData.receiverAcctName}
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
                    {accounts
                      .filter((a) => a.AcctHead === formData.receiverHead)
                      .map((a) => (
                        <option key={a.AcctNo} value={a.AcctNo}>
                          {a.AcctNo}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-md-7 mb-3">
                  <label className="form-label-custom">Account Name</label>
                  <input
                    type="text"
                    name="receiverAcctName"
                    className="form-control"
                    placeholder="Account Name"
                    value={formData.receiverAcctName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Transaction Mode</label>
                  <select
                    className="form-control form-control-sm"
                    name="receiverTrnMode"
                    onChange={handleChange}
                  >
                    <option value="">--Select Transaction Mode--</option>
                    <option value="RECEIVED">Received</option>
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label-custom">Receive Quantity</label>
                  <input
                    type="number"
                    name="receiveQty"
                    className="form-control"
                    placeholder="Receive Quantity"
                    value={formData.receiveQty}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label-custom">
                    Available Quantity
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Available Quantity"
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
                    placeholder="Remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </div>
          </form>

          {/* TABLE */}
          <div className="table-responsive mt-5">
            <table className="custom-table table-sm">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.DistId}>
                    <td>{item.DistId}</td>
                    <td>{item.ProductName}</td>
                    <td>{item.DistributedQty}</td>
                    <td>{new Date(item.ProductDate).toLocaleDateString()}</td>
                    <td>{item.Remarks}</td>
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
