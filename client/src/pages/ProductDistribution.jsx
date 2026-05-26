import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../config/constants';

const ProductDistribution = () => {
    const [formData, setFormData] = useState({ 
        ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: 'Stock Transfer', Date: new Date().toISOString().split('T')[0] 
    });
    const [receivers, setReceivers] = useState([]);
    const [stock, setStock] = useState([]);
    const [history, setHistory] = useState([]);
    
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    useEffect(() => {
        fetchStock();
        fetchReceivers();
        fetchHistory();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stock`);
            setStock(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchReceivers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/juniors-for-distribution`, {
                params: { role: user.UserSignUpRole, profileId: user.ProfileRegId || user.UserAtuorizedRegId }
            });
            setReceivers(res.data);
        } catch (err) { console.error("Error fetching juniors:", err); }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/distribution-history`, {
                params: { senderId: user.UserSignUpId }
            });
            setHistory(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.ReceiverId || !formData.ProductName || !formData.DistributedQty) {
            toast.warning("Please fill in all required fields.");
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/distribute`, {
                ...formData,
                SenderId: user.UserSignUpId,
                ReceiverRole: 'Junior'
            });
            toast.success("Product distributed successfully!");
            setFormData({ ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: 'Stock Transfer', Date: new Date().toISOString().split('T')[0] });
            fetchHistory(); 
            fetchStock();   
        } catch (err) {
            toast.error("Distribution transaction failed.");
        }
    };

    const handleCancel = () => {
        setFormData({ ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: 'Stock Transfer', Date: new Date().toISOString().split('T')[0] });
    };

    // Calculate currently selected product's available stock
    const selectedProductStock = stock.find(s => s.ProductName === formData.ProductName)?.AvailableQty || '0.00';
    const selectedReceiverName = receivers.find(r => String(r.id) === String(formData.ReceiverId))?.name || '';

    // Enterprise UI Styles matching the Client's Reference Image
    const styles = {
        container: { backgroundColor: '#e9e9e9', padding: '10px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
        wrapper: { backgroundColor: '#f0f4f8', border: '2px solid #a1acb8', padding: '4px' },
        header: { backgroundColor: '#1E6bb8', color: '#fff', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', border: '1px solid #144f8a' },
        sectionBanner: { backgroundColor: '#1E6bb8', color: '#fff', padding: '4px 10px', fontSize: '13px', fontWeight: 'bold', marginTop: '4px', border: '1px solid #144f8a' },
        label: { color: '#005bb5', fontSize: '12px', fontWeight: 'bold', textAlign: 'right', paddingRight: '8px', margin: 0, alignSelf: 'center' },
        input: { height: '24px', fontSize: '12px', padding: '2px 6px', borderRadius: '0', border: '1px solid #a1acb8', width: '100%' },
        inputHighlight: { backgroundColor: '#fff', color: '#d93025', fontWeight: 'bold', border: 'none', outline: 'none', height: '24px', fontSize: '12px', padding: '2px 6px', width: '100%' },
        button: { height: '26px', fontSize: '12px', fontWeight: 'bold', padding: '0 20px', borderRadius: '2px', border: '1px solid #a1acb8', backgroundColor: '#e9ecef', color: '#333', cursor: 'pointer' }
    };

    return (
        <div style={styles.container}>
            <ToastContainer autoClose={3000} />
            
            <div style={styles.wrapper}>
                <div style={styles.header}>Product Distribution Entry</div>

                <form onSubmit={handleSubmit} style={{ backgroundColor: '#f0f4f8', padding: '4px' }}>
                    
                    {/* --- SECTION 1: ACCOUNT INFORMATION --- */}
                    <div style={styles.sectionBanner}>Account Information</div>
                    <div className="row g-2 mt-1 mb-2 px-2">
                        <div className="col-md-2 d-flex"><label style={styles.label} className="w-100">Account Head</label></div>
                        <div className="col-md-2">
                            <select style={styles.input} value={formData.ReceiverId} onChange={(e) => setFormData({...formData, ReceiverId: e.target.value})}>
                                <option value="">-- Select Junior --</option>
                                {receivers.map(r => <option key={r.id} value={r.id}>{r.id} - {r.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4 d-flex align-items-center">
                            <span style={{ color: '#d93025', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', marginLeft: '10px' }}>
                                {selectedReceiverName || 'NO ACCOUNT SELECTED'}
                            </span>
                        </div>
                        <div className="col-md-2 d-flex"><label style={styles.label} className="w-100">Entry Date</label></div>
                        <div className="col-md-2">
                            <input type="date" style={styles.input} value={formData.Date} onChange={(e) => setFormData({...formData, Date: e.target.value})} />
                        </div>
                    </div>

                    {/* --- SECTION 2: STOCK INFORMATION --- */}
                    <div style={styles.sectionBanner}>Stock Information / Inventory</div>
                    <div className="row g-2 mt-1 mb-2 px-2">
                        <div className="col-md-2 d-flex"><label style={styles.label} className="w-100">Product Name</label></div>
                        <div className="col-md-2">
                            <select style={styles.input} value={formData.ProductName} onChange={(e) => setFormData({...formData, ProductName: e.target.value})}>
                                <option value="">-- Select Product --</option>
                                {stock.map(s => <option key={s.StockId} value={s.ProductName}>{s.ProductName}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2 d-flex"><label style={styles.label} className="w-100">Available Balance</label></div>
                        <div className="col-md-2">
                            <input type="text" readOnly style={styles.inputHighlight} value={selectedProductStock} />
                        </div>
                        <div className="col-md-2 d-flex"><label style={styles.label} className="w-100">Withdrawable Qty</label></div>
                        <div className="col-md-2">
                            <input type="text" readOnly style={{...styles.inputHighlight, color: '#005bb5'}} value={selectedProductStock} />
                        </div>
                    </div>

                    {/* --- SECTION 3: TRANSACTION DETAILS --- */}
                    <div style={styles.sectionBanner}>Transaction Details</div>
                    <div className="row g-2 mt-1 mb-3 px-2 align-items-center">
                        <div className="col-md-2 d-flex"><label style={styles.label} className="w-100">Tran. Quantity</label></div>
                        <div className="col-md-2">
                            <input 
                                type="number" 
                                style={{...styles.input, border: '1px solid #d93025'}} 
                                value={formData.DistributedQty} 
                                onChange={(e) => setFormData({...formData, DistributedQty: e.target.value})} 
                            />
                        </div>
                        <div className="col-md-1 d-flex"><label style={styles.label} className="w-100">Remarks</label></div>
                        <div className="col-md-5">
                            <input 
                                type="text" 
                                style={styles.input} 
                                value={formData.Remarks} 
                                onChange={(e) => setFormData({...formData, Remarks: e.target.value})} 
                            />
                        </div>
                        <div className="col-md-2 d-flex justify-content-end gap-2">
                            <button type="submit" style={styles.button}>Save</button>
                            <button type="button" style={styles.button} onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>

                </form>

                {/* --- SECTION 4: DATA TABLE --- */}
                <div style={{ ...styles.sectionBanner, marginTop: '10px' }}>Multiple Entries List</div>
                <div style={{ backgroundColor: '#fff', border: '1px solid #a1acb8', height: '300px', overflowY: 'auto' }}>
                    <table className="table table-sm table-bordered mb-0" style={{ fontSize: '12px' }}>
                        <thead style={{ backgroundColor: '#f5f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={{ color: '#005bb5', borderBottom: '2px solid #a1acb8' }}>Account Head</th>
                                <th style={{ color: '#005bb5', borderBottom: '2px solid #a1acb8' }}>Acct Number</th>
                                <th style={{ color: '#005bb5', borderBottom: '2px solid #a1acb8' }}>Product Name</th>
                                <th style={{ color: '#005bb5', borderBottom: '2px solid #a1acb8' }}>Tran Type</th>
                                <th style={{ color: '#005bb5', borderBottom: '2px solid #a1acb8' }}>Amount / Qty</th>
                                <th style={{ color: '#005bb5', borderBottom: '2px solid #a1acb8' }}>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-muted">No transaction entries found.</td>
                                </tr>
                            ) : (
                                history.map(row => (
                                    <tr key={row.DistId}>
                                        <td className="text-muted">{row.ReceiverRole}</td>
                                        <td className="fw-bold">{row.ReceiverId}</td>
                                        <td>{row.ProductName}</td>
                                        <td className="text-muted">Debit</td>
                                        <td className="fw-bold text-danger text-end pe-3">{row.DistributedQty}.00</td>
                                        <td className="text-muted">{row.Remarks}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ProductDistribution;