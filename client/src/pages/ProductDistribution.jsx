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
            fetchStock();   // Refresh stock counts
        } catch (err) {
            toast.error("Distribution transaction failed.");
        }
    };

    const handleCancel = () => {
        setFormData({ ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: '', Date: new Date().toISOString().split('T')[0] });
    };

    return (
        <div className="container-fluid mt-4" style={{ fontFamily: '"Public Sans", sans-serif' }}>
            <ToastContainer autoClose={3000} />
            
            <div className="card shadow-lg" style={{ border: 'none', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Main Header */}
                <div className="card-header text-white" style={{ background: '#696cff', padding: '15px 20px' }}>
                    <h4 className="mb-0">Product Distribution Entry</h4>
                </div>

                <div className="card-body p-0">
                    {/* Section Banner: Green (Matching UI Reference) */}
                    <div className="text-white text-center fw-bold py-2" style={{ backgroundColor: '#28a745', fontSize: '15px' }}>
                        Product Transfer Information
                    </div>

                    {/* Data Entry Form */}
                    <div className="p-4">
                        <form onSubmit={handleSubmit}>
                            {/* Row 1 */}
                            <div className="row mb-4 align-items-center">
                                <div className="col-md-3">
                                    <select 
                                        className="form-select form-select-sm" 
                                        value={formData.ReceiverId}
                                        onChange={(e) => setFormData({...formData, ReceiverId: e.target.value})}
                                        style={{ height: '35px' }}
                                    >
                                        <option value="">--Select Junior Account--</option>
                                        {receivers.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm bg-light text-primary fw-bold" 
                                        placeholder="Account Name (Auto-populated)" 
                                        value={receivers.find(r => String(r.id) === String(formData.ReceiverId))?.name || ''}
                                        readOnly 
                                        style={{ height: '35px' }}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <input 
                                        type="date" 
                                        className="form-control form-control-sm" 
                                        value={formData.Date}
                                        onChange={(e) => setFormData({...formData, Date: e.target.value})}
                                        style={{ height: '35px' }}
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="row mb-4 align-items-center">
                                <div className="col-md-3">
                                    <select 
                                        className="form-select form-select-sm" 
                                        value={formData.ProductName}
                                        onChange={(e) => setFormData({...formData, ProductName: e.target.value})}
                                        style={{ height: '35px' }}
                                    >
                                        <option value="">--Select Product--</option>
                                        {stock.map(s => (
                                            <option key={s.StockId} value={s.ProductName}>{s.ProductName} (Avl: {s.AvailableQty})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <input 
                                        type="number" 
                                        className="form-control form-control-sm" 
                                        placeholder="Transfer Quantity" 
                                        value={formData.DistributedQty}
                                        onChange={(e) => setFormData({...formData, DistributedQty: e.target.value})}
                                        style={{ height: '35px' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm" 
                                        placeholder="Remarks / Transfer Note" 
                                        value={formData.Remarks}
                                        onChange={(e) => setFormData({...formData, Remarks: e.target.value})}
                                        style={{ height: '35px' }}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="row mt-2">
                                <div className="col-md-12 text-end">
                                    <button type="submit" className="btn btn-primary btn-sm px-4 fw-bold shadow-sm me-2" style={{ height: '35px' }}>Save Transaction</button>
                                    <button type="button" className="btn btn-secondary btn-sm px-4 fw-bold shadow-sm" style={{ height: '35px' }} onClick={handleCancel}>Cancel</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Section Banner: Blue (Matching UI Reference) */}
                    <div className="text-white text-center fw-bold py-2 mt-2" style={{ backgroundColor: '#0E87CC', fontSize: '15px' }}>
                        Multiple Entries List (Transaction History)
                    </div>
                    
                    {/* Transaction History Data Grid */}
                    <div className="table-responsive p-3" style={{ minHeight: '300px' }}>
                        <table className="table table-bordered table-hover table-sm text-center align-middle" style={{ fontSize: '0.85rem' }}>
                            <thead className="table-light">
                                <tr>
                                    <th className="py-2">Trans ID</th>
                                    <th className="py-2">Entry Date</th>
                                    <th className="py-2 text-start">Product Name</th>
                                    <th className="py-2">Distributed Qty</th>
                                    <th className="py-2 text-start">Receiver ID</th>
                                    <th className="py-2 text-start">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-5 text-muted">No transaction entries found for this session.</td>
                                    </tr>
                                ) : (
                                    history.map(row => (
                                        <tr key={row.DistId}>
                                            <td className="fw-bold text-primary">{row.DistId}</td>
                                            <td>{String(row.ProductDate).substring(0, 10)}</td>
                                            <td className="text-start">{row.ProductName}</td>
                                            <td className="fw-bold text-danger">-{row.DistributedQty}</td>
                                            <td className="text-start">{row.ReceiverId}</td>
                                            <td className="text-start text-muted">{row.Remarks || 'N/A'}</td>
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