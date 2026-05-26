import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../config/constants';

const ProductDistribution = () => {
    const [formData, setFormData] = useState({ 
        AcctHeadId: '', ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: 'By Transfer', Date: new Date().toISOString().split('T')[0] 
    });
    
    const [accountHeads, setAccountHeads] = useState([]);
    const [accountsTable, setAccountsTable] = useState([]); // This stores the raw accounts table
    const [filteredAccounts, setFilteredAccounts] = useState([]); // Accounts filtered by selected AcctHead
    
    const [stock, setStock] = useState([]);
    const [history, setHistory] = useState([]);
    
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch everything concurrently to speed up load time
            const [headsRes, acctTableRes, stockRes, histRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/accthead`),
                axios.get(`${API_BASE_URL}/accounts-mapping`), // Fetch raw accounts table
                axios.get(`${API_BASE_URL}/stock`),
                axios.get(`${API_BASE_URL}/distribution-history`, { params: { senderId: user.UserSignUpId } })
            ]);

            setAccountHeads(headsRes.data);
            setAccountsTable(acctTableRes.data);
            setStock(stockRes.data);
            setHistory(histRes.data);

            // ✅ CRITICAL LOGIC: If State Super Admin, auto-select "DN"
            if (user.UserSignUpRole === 'State Super Administrator') {
                const dnHead = headsRes.data.find(h => h.AcctHead === 'DN');
                if (dnHead) {
                    setFormData(prev => ({ ...prev, AcctHeadId: dnHead.AcctHead }));
                    // Pre-filter accounts for DN immediately
                    const dnAccounts = acctTableRes.data.filter(acc => acctTableRes.data.AcctHead === 'DN' || acc.AcctHead === 'DN');
                    setFilteredAccounts(dnAccounts);
                }
            }
        } catch (err) { 
            console.error("Error loading initial data", err); 
        }
    };

    // Trigger this whenever AcctHeadId changes to dynamically filter the second dropdown
    useEffect(() => {
        if (formData.AcctHeadId) {
            const relatedAccounts = accountsTable.filter(acc => acc.AcctHead === formData.AcctHeadId);
            setFilteredAccounts(relatedAccounts);
            // Reset selected Receiver if the head changes
            setFormData(prev => ({ ...prev, ReceiverId: '' }));
        } else {
            setFilteredAccounts([]);
        }
    }, [formData.AcctHeadId, accountsTable]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.ReceiverId || !formData.ProductName || !formData.DistributedQty || !formData.AcctHeadId) {
            toast.warning("Please fill in Account Head, Number, Product, and Amount.");
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/distribute`, {
                ...formData,
                SenderId: user.UserSignUpId,
                ReceiverRole: formData.AcctHeadId // Saving 'DN', 'SV', etc.
            });
            toast.success("Transaction Entry Saved Successfully!");
            
            // Keep AcctHeadId sticky based on role, clear the rest
            const defaultHead = user.UserSignUpRole === 'State Super Administrator' ? 'DN' : formData.AcctHeadId;
            setFormData({ AcctHeadId: defaultHead, ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: 'By Transfer', Date: new Date().toISOString().split('T')[0] });
            
            // Refresh history and stock silently
            const [histRes, stockRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/distribution-history`, { params: { senderId: user.UserSignUpId } }),
                axios.get(`${API_BASE_URL}/stock`)
            ]);
            setHistory(histRes.data);
            setStock(stockRes.data);

        } catch (err) {
            toast.error("Transaction Entry Failed.");
        }
    };

    const handleCancel = () => {
        const defaultHead = user.UserSignUpRole === 'State Super Administrator' ? 'DN' : '';
        setFormData({ AcctHeadId: defaultHead, ReceiverId: '', ProductName: '', DistributedQty: '', Remarks: 'By Transfer', Date: new Date().toISOString().split('T')[0] });
    };

    const selectedAcctHeadName = accountHeads.find(a => String(a.AcctHead) === String(formData.AcctHeadId))?.AcctHeadName || '';
    const selectedReceiverName = filteredAccounts.find(r => String(r.AcctNo) === String(formData.ReceiverId))?.AcctName || '';
    const selectedProductStock = stock.find(s => s.ProductName === formData.ProductName)?.AvailableQty || '0.00';

    // Strict Enterprise ERP Visual Styles
    const styles = {
        container: { backgroundColor: '#a9c4db', padding: '10px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
        wrapper: { backgroundColor: '#f0f4f8', border: '3px solid #1E6bb8', display: 'flex', flexDirection: 'row' },
        leftPanel: { flex: 1, padding: '4px' },
        rightPanel: { width: '130px', backgroundColor: '#1E6bb8', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #fff' },
        header: { backgroundColor: '#1E6bb8', color: '#fff', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px' },
        sectionBanner: { backgroundColor: '#1E6bb8', color: '#fff', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', marginTop: '6px' },
        label: { color: '#005bb5', fontSize: '11px', fontWeight: 'bold', margin: 0, alignSelf: 'center', whiteSpace: 'nowrap' },
        input: { height: '22px', fontSize: '12px', padding: '0 4px', borderRadius: '0', border: '1px solid #a1acb8', width: '100%', outline: 'none' },
        inputSmall: { height: '22px', fontSize: '12px', padding: '0 4px', borderRadius: '0', border: '1px solid #a1acb8', width: '60px', outline: 'none', textAlign: 'center' },
        redText: { color: '#d93025', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
        redBlock: { backgroundColor: '#d93025', color: '#fff', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' },
        sideButton: { backgroundColor: '#fff', color: '#005bb5', border: '1px solid #005bb5', padding: '4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer', borderRadius: '2px' },
        actionBtn: { height: '22px', fontSize: '11px', fontWeight: 'bold', padding: '0 15px', borderRadius: '2px', border: '1px solid #a1acb8', cursor: 'pointer' }
    };

    return (
        <div style={styles.container}>
            <ToastContainer autoClose={3000} position="top-center" />
            
            <div style={styles.wrapper}>
                
                {/* LEFT DATA ENTRY PANEL */}
                <div style={styles.leftPanel}>
                    <div style={styles.header}>Product Distribution Transaction Entry</div>

                    <form onSubmit={handleSubmit}>
                        
                        {/* --- ACCOUNT INFORMATION --- */}
                        <div style={styles.sectionBanner}>Account Information</div>
                        <div className="d-flex align-items-center mt-1 px-1 gap-2">
                            <label style={{...styles.label, width: '90px'}}>Account Head</label>
                            <select 
                                style={{...styles.input, width: '120px'}} 
                                value={formData.AcctHeadId} 
                                onChange={(e) => setFormData({...formData, AcctHeadId: e.target.value})}
                                disabled={user.UserSignUpRole === 'State Super Administrator'} // Lock it if State Admin
                            >
                                <option value=""></option>
                                {accountHeads.map(a => <option key={a.AcctHeadId} value={a.AcctHead}>{a.AcctHead}</option>)}
                            </select>
                            <span style={{...styles.redText, width: '150px'}}>{selectedAcctHeadName}</span>
                            
                            <label style={styles.label}>Mast.Acct.No</label>
                            <input type="text" readOnly style={styles.inputSmall} value={formData.ReceiverId} />
                            <input type="text" readOnly style={{...styles.inputSmall, width: '30px'}} value="0" />
                            
                            <label style={styles.label}>Mem.Reg.No</label>
                            <span style={styles.redText}>MRegNo</span>
                            
                            <label style={styles.label}>L/F No</label>
                            <label style={styles.label}>Vouc.No</label>
                            <span style={{...styles.redBlock, width: '30px', textAlign: 'center'}}>9</span>
                            
                            <label style={styles.label}>Entry Date</label>
                            <input type="date" style={{...styles.input, width: '110px'}} value={formData.Date} onChange={(e) => setFormData({...formData, Date: e.target.value})} />
                        </div>
                        
                        <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
                            <label style={{...styles.label, width: '90px'}}>Acct.Number</label>
                            <select style={{...styles.input, width: '250px'}} value={formData.ReceiverId} onChange={(e) => setFormData({...formData, ReceiverId: e.target.value})}>
                                <option value=""></option>
                                {filteredAccounts.map(r => <option key={r.AcctNo} value={r.AcctNo}>{r.AcctNo} - {r.AcctName}</option>)}
                            </select>
                            <span style={{...styles.redText, width: '150px', marginLeft: '10px'}}>{selectedReceiverName}</span>
                            <span style={{...styles.label, marginLeft: '30px'}}>S/B Acct No</span>
                            <span style={styles.redText}>SBAcctNo</span>
                        </div>

                        {/* --- STOCK / PRODUCT INFORMATION --- */}
                        <div style={styles.sectionBanner}>Stock / Product Information</div>
                        <div className="d-flex align-items-center mt-1 px-1 gap-2 mb-2">
                            <label style={{...styles.label, width: '90px'}}>Select Product</label>
                            <select style={{...styles.input, width: '200px'}} value={formData.ProductName} onChange={(e) => setFormData({...formData, ProductName: e.target.value})}>
                                <option value=""></option>
                                {stock.map(s => <option key={s.StockId} value={s.ProductName}>{s.ProductName}</option>)}
                            </select>
                            
                            <label style={{...styles.label, marginLeft: '20px'}}>Total Balance</label>
                            <span style={styles.redText}>{selectedProductStock}</span>
                            
                            <label style={{...styles.label, marginLeft: '20px'}}>Minimum Bal. 0</label>
                            
                            <label style={{...styles.label, marginLeft: '20px'}}>NetBalance</label>
                            <span style={styles.redText}>{selectedProductStock}</span>
                            
                            <label style={{...styles.label, marginLeft: '20px'}}>Withdrawable Amount</label>
                            <span style={styles.redText}>{selectedProductStock}</span>
                        </div>

                        {/* --- TRANSACTION DETAILS --- */}
                        <div style={styles.sectionBanner}>Transaction Detailsls</div>
                        <div className="d-flex align-items-center mt-1 px-1 gap-2">
                            <label style={{...styles.label, width: '90px'}}>Tran. Type</label>
                            <input type="text" readOnly style={{...styles.input, width: '150px'}} value="STOCK TRANSFER" />
                            
                            <div style={{border: '1px solid #a1acb8', padding: '0 8px', display: 'flex', alignItems: 'center', height: '22px', gap: '10px'}}>
                                <label style={{fontSize: '11px', margin: 0}}><input type="radio" checked readOnly style={{marginRight: '4px'}}/>Debit</label>
                                <label style={{fontSize: '11px', margin: 0}}><input type="radio" disabled style={{marginRight: '4px'}}/>Credit</label>
                            </div>

                            <label style={{...styles.label, marginLeft: '20px'}}>Voucher Type</label>
                            <input type="text" readOnly style={{...styles.input, width: '150px'}} value="CASH / TRANSFER" />

                            <div className="ms-auto d-flex gap-2 pe-2">
                                <button type="submit" style={styles.actionBtn}>Save</button>
                            </div>
                        </div>

                        <div className="d-flex align-items-center mt-2 px-1 gap-2 mb-2">
                            <label style={{...styles.label, width: '90px'}}>Tran.Amount</label>
                            <input type="number" style={{...styles.input, width: '150px', border: '1px solid #d93025'}} value={formData.DistributedQty} onChange={(e) => setFormData({...formData, DistributedQty: e.target.value})} />
                            
                            <span style={styles.redBlock}>Note Denomination</span>

                            <label style={{...styles.label, marginLeft: '20px'}}>Remarks</label>
                            <input type="text" style={{...styles.input, flex: 1}} value={formData.Remarks} onChange={(e) => setFormData({...formData, Remarks: e.target.value})} />

                            <div className="ms-auto d-flex gap-2 pe-2">
                                <button type="button" style={styles.actionBtn} onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>

                        {/* --- MULTIPLE ENTRIES LIST --- */}
                        <div style={styles.sectionBanner}>Multiple Entries List</div>
                        <div style={{ backgroundColor: '#fff', border: '1px solid #a1acb8', height: '280px', overflowY: 'auto', marginTop: '2px' }}>
                            <table className="table table-sm mb-0" style={{ fontSize: '11px', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f0f4f8', position: 'sticky', top: 0, color: '#005bb5' }}>
                                    <tr>
                                        <th style={{border: '1px solid #ccc', padding: '2px 4px'}}>Acct. Head</th>
                                        <th style={{border: '1px solid #ccc', padding: '2px 4px'}}>Acct. Number</th>
                                        <th style={{border: '1px solid #ccc', padding: '2px 4px'}}>Product Name</th>
                                        <th style={{border: '1px solid #ccc', padding: '2px 4px'}}>Date</th>
                                        <th style={{border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right'}}>Sent Qty</th>
                                        <th style={{border: '1px solid #ccc', padding: '2px 4px'}}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-4 text-muted">No transactions found.</td></tr>
                                    ) : (
                                        history.map(row => (
                                            <tr key={row.DistId}>
                                                <td style={{border: '1px solid #ccc', padding: '2px 4px', color: '#d93025'}}>{row.ReceiverRole}</td>
                                                <td style={{border: '1px solid #ccc', padding: '2px 4px', fontWeight: 'bold'}}>{row.ReceiverId}</td>
                                                <td style={{border: '1px solid #ccc', padding: '2px 4px'}}>{row.ProductName}</td>
                                                <td style={{border: '1px solid #ccc', padding: '2px 4px'}}>{String(row.ProductDate).substring(0, 10)}</td>
                                                <td style={{border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right', fontWeight: 'bold', color: '#d93025'}}>{row.DistributedQty}.00</td>
                                                <td style={{border: '1px solid #ccc', padding: '2px 4px'}}>{row.Remarks}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </form>
                </div>

                {/* RIGHT FUNCTION BUTTONS PANEL */}
                <div style={styles.rightPanel}>
                    <div style={styles.sideButton}>Day Book(F1)</div>
                    <div style={styles.sideButton}>Cash Book(F2)</div>
                    <div style={styles.sideButton}>CashBook Dtl (F3)</div>
                    <div style={styles.sideButton}>Ledger(F4)</div>
                    <div style={styles.sideButton}>Per. Ledger(F5)</div>
                    <div style={styles.sideButton}>Int Ledger(F6)</div>
                    <div style={styles.sideButton}>Per. Int Ledger(F7)</div>
                    <div style={styles.sideButton}>Sign.Verify(F8)</div>
                    <div style={styles.sideButton}>Help(F9)</div>
                </div>

            </div>
        </div>
    );
};

export default ProductDistribution;