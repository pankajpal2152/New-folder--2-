import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../config/constants';

const ProductDistribution = () => {
    const [formData, setFormData] = useState({ 
        ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: '', Date: new Date().toISOString().split('T')[0] 
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
            setFormData({ ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: '', Date: new Date().toISOString().split('T')[0] });
            fetchHistory(); // Refresh table
        } catch (err) {
            toast.error("Distribution transaction failed.");
        }
    };

    return (
        <div className="container-fluid mt-4" style={{ fontFamily: '"Public Sans", sans-serif' }}>
            <ToastContainer autoClose={3000} />
            
            <div className="card shadow-sm" style={{ border: 'none', borderRadius: '8px' }}>
                <div className="card-header text-white" style={{ background: '#696cff', borderRadius: '8px 8px 0 0', padding: '1.25rem 1.5rem' }}>
                    <h3 className="mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>Product Distribution Management</h3>
                </div>

                <div className="card-body p-4">
                    <div className="col-md-12 mb-4">
                        <p className="fw-bold p-2 text-white" style={{ backgroundColor: '#0E87CC', borderRadius: '4px', fontSize: '0.95rem' }}>
                            1. Product Transfer Information
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Row 1: Receiver and Date */}
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small text-uppercase">Select Receiver (Junior) *</label>
                                <select 
                                    className="form-select form-select-sm" 
                                    value={formData.ReceiverId}
                                    onChange={(e) => setFormData({...formData, ReceiverId: e.target.value})}
                                >
                                    <option value="">-- Select Junior Account --</option>
                                    {receivers.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-5">
                                <label className="fw-bold text-muted small text-uppercase">Account Name</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm bg-light" 
                                    placeholder="Auto-populated Name" 
                                    value={receivers.find(r => String(r.id) === String(formData.ReceiverId))?.name || ''}
                                    readOnly 
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="fw-bold text-muted small text-uppercase">Entry Date</label>
                                <input 
                                    type="date" 
                                    className="form-control form-control-sm" 
                                    value={formData.Date}
                                    onChange={(e) => setFormData({...formData, Date: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Row 2: Product and Quantity */}
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small text-uppercase">Select Product *</label>
                                <select 
                                    className="form-select form-select-sm" 
                                    value={formData.ProductName}
                                    onChange={(e) => setFormData({...formData, ProductName: e.target.value})}
                                >
                                    <option value="">-- Select Product --</option>
                                    {stock.map(s => (
                                        <option key={s.StockId} value={s.ProductName}>{s.ProductName} (Stock: {s.AvailableQty})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="fw-bold text-muted small text-uppercase">Transfer Quantity *</label>
                                <input 
                                    type="number" 
                                    className="form-control form-control-sm" 
                                    placeholder="Enter Quantity" 
                                    value={formData.DistributedQty}
                                    onChange={(e) => setFormData({...formData, DistributedQty: e.target.value})}
                                />
                            </div>
                            <div className="col-md-5">
                                <label className="fw-bold text-muted small text-uppercase">Remarks</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    placeholder="Add any remarks or notes" 
                                    value={formData.Remarks}
                                    onChange={(e) => setFormData({...formData, Remarks: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Submit Row */}
                        <div className="row mt-4">
                            <div className="col-md-12 text-end">
                                <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm">Save Transaction</button>
                            </div>
                        </div>
                    </form>

                    {/* Transaction History Table */}
                    <div className="col-md-12 mt-5 mb-3">
                        <p className="fw-bold p-2 text-white" style={{ backgroundColor: '#28a745', borderRadius: '4px', fontSize: '0.95rem' }}>
                            Recent Multiple Entries List
                        </p>
                    </div>
                    
                    <div className="table-responsive border rounded">
                        <table className="table table-hover table-sm mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="py-2 text-uppercase text-muted" style={{fontSize: '0.8rem'}}>Trans ID</th>
                                    <th className="py-2 text-uppercase text-muted" style={{fontSize: '0.8rem'}}>Date</th>
                                    <th className="py-2 text-uppercase text-muted" style={{fontSize: '0.8rem'}}>Product Name</th>
                                    <th className="py-2 text-uppercase text-muted" style={{fontSize: '0.8rem'}}>Sent Qty</th>
                                    <th className="py-2 text-uppercase text-muted" style={{fontSize: '0.8rem'}}>Receiver ID</th>
                                    <th className="py-2 text-uppercase text-muted" style={{fontSize: '0.8rem'}}>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">No recent transactions found.</td>
                                    </tr>
                                ) : (
                                    history.map(row => (
                                        <tr key={row.DistId}>
                                            <td className="py-2 text-primary fw-bold">#{row.DistId}</td>
                                            <td className="py-2">{String(row.ProductDate).substring(0, 10)}</td>
                                            <td className="py-2">{row.ProductName}</td>
                                            <td className="py-2 fw-bold text-danger">-{row.DistributedQty}</td>
                                            <td className="py-2">{row.ReceiverId}</td>
                                            <td className="py-2 text-muted">{row.Remarks || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductDistribution;