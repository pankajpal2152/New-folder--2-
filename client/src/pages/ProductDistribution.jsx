import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { API_BASE_URL } from '../config/constants';

const ProductDistribution = () => {
    const [formData, setFormData] = useState({ ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: '' });
    const [receivers, setReceivers] = useState([]);
    const [stock, setStock] = useState([]);
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    useEffect(() => {
        fetchStock();
        fetchReceivers();
    }, []);

    const fetchStock = async () => {
        const res = await axios.get(`${API_BASE_URL}/stock`);
        setStock(res.data);
    };

    const fetchReceivers = async () => {
        // Logic: Fetch based on user role
        // If State Admin -> Fetch District Admins, etc.
        const role = user.UserSignUpRole;
        let endpoint = role === 'State Admin' ? '/districtadmin' : '/supervisor'; // Simplified example
        const res = await axios.get(`${API_BASE_URL}${endpoint}`);
        setReceivers(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/distribute`, {
                ...formData,
                SenderId: user.UserSignUpId,
                ReceiverRole: 'Junior'
            });
            toast.success("Distribution successful!");
            setFormData({ ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: '' });
        } catch (err) {
            toast.error("Distribution failed.");
        }
    };

    return (
        <div className="container mt-4">
            <ToastContainer />
            <div className="card shadow-sm p-4">
                <h4 className="mb-4">Product Distribution</h4>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-3">
                            <select className="form-control" onChange={(e) => setFormData({...formData, ReceiverId: e.target.value})}>
                                <option>-- Select Junior --</option>
                                {receivers.map(r => <option key={r.SupRegId || r.DistNGORegId} value={r.SupRegId}>{r.SupName || r.DistNGOName}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-control" onChange={(e) => setFormData({...formData, ProductName: e.target.value})}>
                                <option>-- Select Product --</option>
                                {stock.map(s => <option key={s.StockId} value={s.ProductName}>{s.ProductName}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <input type="number" className="form-control" placeholder="Quantity" onChange={(e) => setFormData({...formData, DistributedQty: e.target.value})} />
                        </div>
                        <div className="col-md-3">
                            <button type="submit" className="btn btn-primary w-100">Distribute</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ProductDistribution;