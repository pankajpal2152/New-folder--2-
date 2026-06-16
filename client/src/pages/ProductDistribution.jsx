import React, { useEffect, useState, useMemo, useRef } from "react";
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [profileRegId, setProfileRegId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [trnFilter, setTrnFilter] = useState("ALL");

  // ✅ Ref to easily clear the file input after submit
  const fileInputRef = useRef(null);

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
    invoiceFile: "", // ✅ New field to hold the document Base64
  });

  useEffect(() => {
    const userStr = localStorage.getItem("loggedInUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || user.UserSignUpRole || "");
      setUserName(user.SignupUserName || "");
      setProfileRegId(user.ProfileRegId || "");
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

  // ✅ New Handler to process the uploaded file into Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, invoiceFile: reader.result }));
      };
    }
  };

  const handleSenderChange = (e) => {
    const { name, value } = e.target;

    if (name === "transferQty") {
      let val = value;
      const isDr = formData.senderMode
        ? formData.senderMode.startsWith("Dr")
        : true;
      const maxAvail = isDr
        ? parseFloat(formData.availableQty) || 0
        : parseFloat(formData.receiverAvailableQty) || 0;

      if (val !== "" && parseFloat(val) > maxAvail) {
        val = maxAvail.toString();
      }

      setFormData((prev) => ({ ...prev, transferQty: val, receiveQty: val }));
    } else if (name === "senderAcctHead") {
      const selected = acctHeads.find((h) => h.AcctHead === value);
      setFormData((prev) => ({
        ...prev,
        senderAcctHead: value,
        senderAcctName: selected ? selected.AcctHeadName : "",
        senderAcctNo: "",
        senderAcctNameDisplay: "",
        availableQty: "",
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
        receiverAcctNo: "",
        receiverAcctNameDisplay: "",
        receiverAvailableQty: "",
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
    const tQty = parseFloat(formData.transferQty);

    if (!formData.transferQty || tQty <= 0) {
      alert("Transfer quantity must be greater than 0.");
      return;
    }

    const sDrCr = formData.senderMode
      ? formData.senderMode.split(" - ")[0]
      : "Dr";

    if (sDrCr === "Dr" && tQty > parseFloat(formData.availableQty)) {
      alert("Transfer quantity cannot exceed sender's available quantity!");
      return;
    }
    if (sDrCr === "Cr" && tQty > parseFloat(formData.receiverAvailableQty)) {
      alert(
        "Receive/Refund quantity cannot exceed receiver's available quantity!",
      );
      return;
    }

    try {
      // ✅ Added InvoiceFile payload
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
        InvoiceFile: formData.invoiceFile,
      });
      alert("Product Transaction Completed Successfully");

      const updatedSenderQty = await getStock(
        formData.senderAcctHead,
        formData.senderAcctNo,
        formData.productId,
      );

      // ✅ Clear the file input visually
      if (fileInputRef.current) fileInputRef.current.value = "";

      setFormData((prev) => ({
        ...prev,
        transferQty: "",
        receiveQty: "",
        receiverAcctHead: "",
        receiverAcctName: "",
        receiverAcctNo: "",
        receiverAcctNameDisplay: "",
        receiverMode: "",
        receiverAvailableQty: "",
        remarks: "",
        invoiceFile: "",
        availableQty: updatedSenderQty,
      }));
      fetchHistory(formData.senderAcctNo, formData.senderAcctHead);
    } catch (err) {
      alert("Error executing transaction");
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      let dateMatch = true;
      if (fromDate)
        dateMatch =
          dateMatch && new Date(h.TransactionDate) >= new Date(fromDate);
      if (toDate)
        dateMatch =
          dateMatch && new Date(h.TransactionDate) <= new Date(toDate);

      let searchMatch = true;
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        // Also look through the EntryDate in case user searches by submit date
        const combinedString =
          `${h.TransactionDate} ${h.EntryDate || ""} ${h.SenderHead} ${h.SenderAcctName} ${h.ProductName} ${h.Qty} ${h.SenderMode} ${h.Remarks} ${h.ReceiverInfo}`.toLowerCase();
        searchMatch = combinedString.includes(lowerSearch);
      }

      let typeMatch = true;
      if (
        trnFilter === "TRANSFER" &&
        h.SenderMode?.toUpperCase() !== "TRANSFER"
      )
        typeMatch = false;
      if (
        trnFilter === "RECEIVED" &&
        h.SenderMode?.toUpperCase() !== "RECEIVED"
      )
        typeMatch = false;

      return dateMatch && searchMatch && typeMatch;
    });
  }, [history, searchTerm, fromDate, toDate, trnFilter]);

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage);

  const allowedSenderHeads = useMemo(() => {
    const roles = {
      "State Super Administrator": "SN",
      "District Administrator": "DN",
      Supervisor: "SV",
      "Astha Didi": "AD",
      "Astha Maa": "AM",
    };
    return roles[userRole]
      ? acctHeads.filter((h) => h.AcctHead === roles[userRole])
      : acctHeads;
  }, [acctHeads, userRole]);

  const filteredSenderAccounts = useMemo(() => {
    if (
      userRole === "District Administrator" ||
      userRole === "Supervisor" ||
      userRole === "Astha Didi"
    ) {
      return allAccounts.filter(
        (a) =>
          String(a.AcctNo) === String(profileRegId) &&
          a.AcctHead === formData.senderAcctHead,
      );
    }
    return allAccounts.filter((a) => a.AcctHead === formData.senderAcctHead);
  }, [allAccounts, formData.senderAcctHead, userRole, profileRegId]);

  const allowedReceiverHeads = useMemo(() => {
    const hierarchy = { SU: "SN", SN: "DN", DN: "SV", SV: "AD", AD: "AM" };
    return hierarchy[formData.senderAcctHead]
      ? acctHeads.filter(
          (h) => h.AcctHead === hierarchy[formData.senderAcctHead],
        )
      : acctHeads;
  }, [acctHeads, formData.senderAcctHead]);

  const filteredReceiverAccounts = useMemo(() => {
    if (!formData.receiverAcctHead) return [];

    return allAccounts.filter((a) => {
      if (a.AcctHead !== formData.receiverAcctHead) return false;

      if (formData.senderAcctHead && formData.senderAcctNo) {
        const senderObj = allAccounts.find(
          (acc) =>
            String(acc.AcctNo) === String(formData.senderAcctNo) &&
            acc.AcctHead === formData.senderAcctHead,
        );
        if (!senderObj) return false;

        if (
          formData.senderAcctHead === "SN" &&
          formData.receiverAcctHead === "DN"
        ) {
          return String(a.SNGOAcctNo) === String(senderObj.AcctNo);
        }
        if (
          formData.senderAcctHead === "DN" &&
          formData.receiverAcctHead === "SV"
        ) {
          return (
            String(a.SNGOAcctNo) === String(senderObj.SNGOAcctNo) &&
            String(a.DNGOAcctNo) === String(senderObj.AcctNo)
          );
        }
        if (
          formData.senderAcctHead === "SV" &&
          formData.receiverAcctHead === "AD"
        ) {
          return (
            String(a.SNGOAcctNo) === String(senderObj.SNGOAcctNo) &&
            String(a.DNGOAcctNo) === String(senderObj.DNGOAcctNo) &&
            String(a.SVAcctNo) === String(senderObj.AcctNo)
          );
        }
        if (
          formData.senderAcctHead === "AD" &&
          formData.receiverAcctHead === "AM"
        ) {
          return (
            String(a.SNGOAcctNo) === String(senderObj.SNGOAcctNo) &&
            String(a.DNGOAcctNo) === String(senderObj.DNGOAcctNo) &&
            String(a.SVAcctNo) === String(senderObj.SVAcctNo) &&
            String(a.ADAcctNo) === String(senderObj.AcctNo)
          );
        }
      }
      return true;
    });
  }, [
    allAccounts,
    formData.receiverAcctHead,
    formData.senderAcctHead,
    formData.senderAcctNo,
  ]);

  const filteredSenderModes = useMemo(() => trnTypes, [trnTypes]);
  const filteredReceiverModes = useMemo(() => trnTypes, [trnTypes]);
  const isSenderDr = formData.senderMode
    ? formData.senderMode.startsWith("Dr")
    : true;

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
            <p className="PerInfo">Transfer Information:</p>
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
                  {filteredSenderAccounts.map((a) => (
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
                  min="1"
                  max={
                    isSenderDr
                      ? formData.availableQty || ""
                      : formData.receiverAvailableQty || ""
                  }
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E")
                      e.preventDefault();
                  }}
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

            <p className="AddInfo">Transfer Information:</p>
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
                  {filteredReceiverAccounts.map((a) => (
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
                  value={formData.transferQty}
                  readOnly
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

            {/* ✅ NEW: Remarks AND Document Upload Side-by-Side */}
            <div className="row">
              <div className="col-md-8 mb-2">
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
              <div className="col-md-4 mb-2">
                <label className="form-label-custom">
                  Upload Receipt / Invoice
                </label>
                <input
                  type="file"
                  className="form-control"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </div>
            </div>

            <div className="col-md-12 mt-2">
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
            </div>
          </form>

          <div
            className="mt-5 mb-3"
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <div className="row mb-3">
              <div className="col-md-2">
                <label className="form-label-custom">AcctHead</label>
                <input
                  className="form-control form-control-sm bg-white"
                  type="text"
                  value={
                    history.length > 0
                      ? history[0].SenderHead
                      : formData.senderAcctHead
                  }
                  readOnly
                  disabled
                />
              </div>
              <div className="col-md-6">
                <label className="form-label-custom">Name</label>
                <input
                  className="form-control form-control-sm bg-white"
                  type="text"
                  value={
                    history.length > 0
                      ? history[0].SenderAcctName
                      : formData.senderAcctNameDisplay
                  }
                  readOnly
                  disabled
                />
              </div>
              <div className="col-md-4">
                <label className="form-label-custom">ProName</label>
                <input
                  className="form-control form-control-sm bg-white"
                  type="text"
                  value={
                    formData.productName ||
                    (history.length > 0 ? history[0].ProductName : "")
                  }
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="row align-items-end mb-3">
              <div className="col-md-2">
                <label className="form-label-custom">From Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label-custom">To Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="col-md-8 d-flex align-items-center gap-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={trnFilter === "TRANSFER"}
                    onChange={() => setTrnFilter("TRANSFER")}
                    id="chkTransfer"
                  />
                  <label
                    className="form-check-label fw-bold text-muted"
                    htmlFor="chkTransfer"
                  >
                    Send/Tran
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={trnFilter === "RECEIVED"}
                    onChange={() => setTrnFilter("RECEIVED")}
                    id="chkReceive"
                  />
                  <label
                    className="form-check-label fw-bold text-muted"
                    htmlFor="chkReceive"
                  >
                    Receive
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={trnFilter === "ALL"}
                    onChange={() => setTrnFilter("ALL")}
                    id="chkAll"
                  />
                  <label
                    className="form-check-label fw-bold text-muted"
                    htmlFor="chkAll"
                  >
                    Send & Receive
                  </label>
                </div>
              </div>
            </div>

            <div className="row align-items-end">
              <div className="col-md-10">
                <label className="form-label-custom">Search Ledger</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-secondary btn-sm w-100"
                  onClick={() => {
                    setSearchTerm("");
                    setFromDate("");
                    setToDate("");
                    setTrnFilter("ALL");
                    setCurrentPage(1);
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
                  {/* ✅ Updated Headers */}
                  <th style={{ whiteSpace: "nowrap" }}>Entry Date</th>
                  <th style={{ whiteSpace: "nowrap" }}>Trn Date</th>
                  <th>Qty</th>
                  <th>Remarks</th>
                  <th>TrnType</th>
                  <th>Document</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((h) => {
                  const isReceived =
                    h.SenderMode && h.SenderMode.toUpperCase() === "RECEIVED";
                  return (
                    <tr key={h.TrnId}>
                      {/* ✅ Render the actual submission timestamp */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {h.EntryDate || "-"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {h.TransactionDate}
                      </td>
                      <td
                        style={{
                          color: isReceived ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {isReceived ? "+" : "-"} {h.Qty}
                      </td>
                      <td>{h.Remarks || "-"}</td>
                      <td>{h.SenderMode}</td>
                      {/* ✅ Render Document Button mapping securely to backend static folder */}
                      <td>
                        {h.invoice ? (
                          <a
                            href={`${API_BASE_URL.replace("/api", "")}/allDocumentsFolder/${h.invoice}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                            style={{
                              borderRadius: "20px",
                              padding: "2px 10px",
                              fontSize: "12px",
                            }}
                          >
                            📄 View
                          </a>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-3 text-muted">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage >= (totalPages || 1)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
