import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Shared Utilities
import { API_BASE_URL, DUMMY_AVATAR, extractBase64, styles, FormInput, fileToBase64 } from '../config/constants';

// Import the specific Forms and Schemas
import AsthaDidiForm, { accountSchema } from './forms/AsthaDidiForm';
import DistrictAdminForm, { ngoSchema } from './forms/DistrictAdminForm';
import SupervisorForm, { asthaMaaSchema as supervisorSchema } from './forms/SupervisorForm';
import AsthaMaaForm, { asthaMaaSchema } from './forms/AsthaMaaForm';

// ==========================================
// UTILITY: Safe Local Storage Access
// ==========================================
const getSafeUser = () => {
    try {
        const userStr = localStorage.getItem('loggedInUser');
        if (userStr) return JSON.parse(userStr);
    } catch (error) {
        console.error("Error parsing user data from local storage", error);
    }
    return null;
};

// ==========================================
// 1. ASTHA DIDI MODAL (VIEW & EDIT)
// ==========================================
const AsthaDidiModal = ({ member, mode, onClose, onSuccess }) => {
    const isView = mode === 'view';
    const cleanInitialImage = extractBase64(member.ProfileImage) || DUMMY_AVATAR;
    const [profileImage, setProfileImage] = useState(cleanInitialImage);
    const fileInputRef = useRef(null);
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(accountSchema),
        mode: 'onChange',
        defaultValues: {
            joiningAmount: String(member.JoiningAmt || '5000'),
            walletBalance: String(member.WalletBalance || '0'),
            fullName: member.PerName || '',
            sdwOf: member.GuardianName || '',
            dob: member.DOB ? member.DOB.substring(0, 10) : '',
            guardianContactNo: member.GuardianContactNo || '',
            state: null, district: null, city: member.City || '', block: member.BlockName || '',
            postOffice: member.PO || '', policeStation: member.PS || '', gramPanchayet: member.GramPanchayet || '',
            village: member.Village || '', pinCode: String(member.Pincode || ''), mobileNo: member.ContactNo || '',
            email: member.MailId || '', bankName: member.BankName || '', branchName: member.BranchName || '',
            accountNo: member.AcctNo || '', ifsCode: member.IFSCode || '', panNo: member.PanNo || '',
            aadharNo: member.AadharNo || ''
        }
    });

    const selectedState = watch("state");

    useEffect(() => {
        fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => {
            const formattedStates = data.map(s => ({ value: s.StateId, label: s.StateName }));
            setDbStates(formattedStates);
            if (member.StateName) {
                const matchedState = formattedStates.find(s => s.label === member.StateName);
                if (matchedState) setValue("state", matchedState);
            }
        });
    }, [member.StateName, setValue]);

    useEffect(() => {
        if (selectedState && selectedState.value) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`).then(res => res.json()).then(data => {
                const formattedDistricts = data.map(d => ({ value: d.DistId, label: d.DistName }));
                setDbDistricts(formattedDistricts);
                if (member.DistName) {
                    const matchedDist = formattedDistricts.find(d => d.label === member.DistName);
                    if (matchedDist) setValue("district", matchedDist);
                }
            });
        } else { setDbDistricts([]); }
    }, [selectedState, member.DistName, setValue]);

    const handleUploadClick = () => {
        if (!isView && fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        if (isView) return;
        const file = event.target.files[0];
        if (file) {
            if (file.size > 800000) return toast.warning("Image size exceeds 800KB.");
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleResetImage = () => {
        if (isView) return;
        setProfileImage(DUMMY_AVATAR);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onSubmit = async (data) => {
        if (isView) { onClose(); return; }

        const stateName = data.state ? data.state.label : "";
        const districtName = data.district ? data.district.label : "";
        const loggedInUser = getSafeUser();

        const dbPayload = {
            ...member,
            ProfileImage: profileImage === DUMMY_AVATAR ? null : profileImage,
            PerName: data.fullName, GuardianName: data.sdwOf || "", DOB: data.dob, GuardianContactNo: data.guardianContactNo || "",
            StateName: stateName, DistName: districtName, City: data.city || "", BlockName: data.block || "",
            PO: data.postOffice || "", PS: data.policeStation || "", GramPanchayet: data.gramPanchayet || "",
            Village: data.village || "", Pincode: parseInt(data.pinCode), ContactNo: data.mobileNo, MailId: data.email,
            BankName: data.bankName || "", BranchName: data.branchName || "", AcctNo: data.accountNo || "0",
            IFSCode: data.ifsCode || "", PanNo: data.panNo || "", AadharNo: data.aadharNo,
            JoiningAmt: parseInt(data.joiningAmount) || 5000, WalletBalance: parseInt(data.walletBalance) || 0,
            ModifyBy: loggedInUser ? loggedInUser.email : "System"
        };

        if (dbPayload.DOB) dbPayload.DOB = dbPayload.DOB.substring(0, 10);
        if (dbPayload.AprovalDate && dbPayload.AprovalDate.includes('T')) {
            dbPayload.AprovalDate = dbPayload.AprovalDate.substring(0, 10);
        }

        try {
            toast.loading("Updating member...", { toastId: 'update' });
            const res = await fetch(`${API_BASE_URL}/asthadidi/${member.RegInfoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload)
            });
            toast.dismiss('update');
            if (res.ok) { toast.success("Member updated successfully!", { position: "top-right" }); onSuccess(); }
            else { toast.error("Failed to update. Check backend logs.", { position: "top-right" }); }
        } catch (error) { toast.dismiss('update'); toast.error("Network error.", { position: "top-right" }); }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '1000px', padding: '0' }}>
                <div style={styles.cardHeader}>
                    <h5 style={{ margin: 0 }}>{isView ? 'View' : 'Edit'} Astha Didi Details</h5>
                    <button style={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div style={styles.cardBody}>
                    <div style={styles.profileSection}>
                        <img src={profileImage} alt="Profile Avatar" style={styles.avatar} />
                        <div>
                            <p style={styles.hintText}><strong>ID:</strong> #{member.RegInfoId}</p>
                            <p style={styles.hintText}><strong>Status:</strong> {member.Status === 2 ? 'Approved' : 'Pending'}</p>
                            {member.Status === 2 && member.AprovedBy && (
                                <p style={styles.hintText}><strong>Approved By:</strong> {member.AprovedBy}</p>
                            )}
                            {!isView && (
                                <div style={styles.buttonGroup}>
                                    <button type="button" style={styles.btnOutline} onClick={handleUploadClick}>Change photo</button>
                                    <button type="button" style={styles.btnOutline} onClick={handleResetImage}>Reset</button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" style={{ display: 'none' }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit, () => !isView && toast.error("Check red fields!"))}>

                        <h6 style={styles.sectionHeader}>Astha Didi Information</h6>
                        <div style={styles.formGrid}>
                            <Controller name="joiningAmount" control={control} render={({ field }) => (<FormInput label="Joining Amount *" id="edit_joiningAmount" error={errors.joiningAmount} disabled={true} {...field} />)} />
                            <Controller name="walletBalance" control={control} render={({ field }) => (<FormInput label="Wallet Balance *" id="edit_walletBalance" error={errors.walletBalance} disabled={true} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Personal Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="fullName" control={control} render={({ field }) => (<FormInput label="Full Name *" id="edit_fullName" error={errors.fullName} disabled={isView} {...field} />)} />
                            <Controller name="sdwOf" control={control} render={({ field }) => (<FormInput label="S/D/W of" id="edit_sdwOf" error={errors.sdwOf} disabled={isView} {...field} />)} />
                            <Controller name="dob" control={control} render={({ field }) => (<FormInput label="Date of Birth *" id="edit_dob" error={errors.dob} type="date" disabled={isView} {...field} />)} />
                            <Controller name="guardianContactNo" control={control} render={({ field }) => (<FormInput label="Guardian Contact no" id="edit_guardianContactNo" error={errors.guardianContactNo} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Postal Address Information</h6>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Select State *</label>
                                <Controller name="state" control={control} render={({ field }) => (<Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} isDisabled={isView} menuPortalTarget={document.body} />)} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>District *</label>
                                <Controller name="district" control={control} render={({ field }) => (<Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} isDisabled={isView || !selectedState} menuPortalTarget={document.body} />)} />
                            </div>
                            <Controller name="city" control={control} render={({ field }) => (<FormInput label="City" id="edit_city" error={errors.city} disabled={isView} {...field} />)} />
                            <Controller name="block" control={control} render={({ field }) => (<FormInput label="Block" id="edit_block" error={errors.block} disabled={isView} {...field} />)} />
                            <Controller name="postOffice" control={control} render={({ field }) => (<FormInput label="Post Office" id="edit_postOffice" error={errors.postOffice} disabled={isView} {...field} />)} />
                            <Controller name="policeStation" control={control} render={({ field }) => (<FormInput label="Police Station" id="edit_policeStation" error={errors.policeStation} disabled={isView} {...field} />)} />
                            <Controller name="gramPanchayet" control={control} render={({ field }) => (<FormInput label="Gram Panchayet" id="edit_gramPanchayet" error={errors.gramPanchayet} disabled={isView} {...field} />)} />
                            <Controller name="village" control={control} render={({ field }) => (<FormInput label="Village" id="edit_village" error={errors.village} disabled={isView} {...field} />)} />
                            <Controller name="pinCode" control={control} render={({ field }) => (<FormInput label="Pin Code *" id="edit_pinCode" error={errors.pinCode} disabled={isView} {...field} />)} />
                            <Controller name="mobileNo" control={control} render={({ field }) => (<FormInput label="Contact Number *" id="edit_mobileNo" error={errors.mobileNo} disabled={isView} {...field} />)} />
                            <Controller name="email" control={control} render={({ field }) => (<FormInput label="Email ID *" id="edit_email" error={errors.email} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Banking & Payment Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="bankName" control={control} render={({ field }) => (<FormInput label="Bank Name" id="edit_bankName" error={errors.bankName} disabled={isView} {...field} />)} />
                            <Controller name="branchName" control={control} render={({ field }) => (<FormInput label="Branch Name" id="edit_branchName" error={errors.branchName} disabled={isView} {...field} />)} />
                            <Controller name="accountNo" control={control} render={({ field }) => (<FormInput label="Account No" id="edit_accountNo" error={errors.accountNo} disabled={isView} {...field} />)} />
                            <Controller name="ifsCode" control={control} render={({ field }) => (<FormInput label="IFS Code" id="edit_ifsCode" error={errors.ifsCode} disabled={isView} {...field} />)} />
                            <Controller name="panNo" control={control} render={({ field }) => (<FormInput label="PAN No" id="edit_panNo" error={errors.panNo} disabled={isView} {...field} />)} />
                            <Controller name="aadharNo" control={control} render={({ field }) => (<FormInput label="Aadhar No *" id="edit_aadharNo" error={errors.aadharNo} disabled={isView} {...field} />)} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '10px' }}>
                            <button type="button" style={styles.btnOutline} onClick={onClose}>{isView ? 'Close' : 'Cancel'}</button>
                            {!isView && <button type="submit" style={styles.btnPrimary}>Save Changes</button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 2. ASTHA DIDI DATA TABLE
// ==========================================
const MembersTable = ({ refreshTrigger }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState(null);

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        const user = getSafeUser();
        if (user) { setUserRole(user.role || ''); setUserName(user.username || ''); }
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/asthadidi`);
            if (!res.ok) throw new Error("Failed to fetch table data");
            let data = await res.json();

            // SOFT DELETE FILTER: Strictly filter out '0' both string and numeric
            data = data.filter(member => String(member.IsActive) !== '0' && String(member.Status) !== '0');

            const user = getSafeUser();
            if (user && (user.role === 'Astha Didi' || user.role === 'Supervisor')) {
                data = data.filter(member => member.CreatedBy === user.email);
            }
            setMembers(data);
        } catch (error) { toast.error("Failed to load table data.", { position: "top-right" }); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, [refreshTrigger]);

    const sortedMembers = useMemo(() => {
        let sortableItems = [...members];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key] || ''; let bVal = b[sortConfig.key] || '';
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [members, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName) => {
        if (!sortConfig || sortConfig.key !== columnName) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
        return sortConfig.direction === 'ascending' ? <span style={{ marginLeft: '4px' }}>▲</span> : <span style={{ marginLeft: '4px' }}>▼</span>;
    };

    const totalPages = Math.max(1, Math.ceil(sortedMembers.length / rowsPerPage));
    useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [sortedMembers.length, totalPages, currentPage]);

    const indexOfLastMember = currentPage * rowsPerPage;
    const indexOfFirstMember = indexOfLastMember - rowsPerPage;
    const currentMembers = sortedMembers.slice(indexOfFirstMember, indexOfLastMember);
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleRowsChange = (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); };

    const openModal = (type, member) => {
        setSelectedRow({ ...member });
        if (type === 'view') setViewModal(true);
        if (type === 'edit') setEditModal(true);
        if (type === 'delete') setDeleteModal(true);
        if (type === 'approve') setApproveModal(true);
    };

    const closeModal = () => { setViewModal(false); setEditModal(false); setDeleteModal(false); setApproveModal(false); setSelectedRow(null); };

    const confirmDelete = async () => {
        try {
            toast.loading("Deleting...", { toastId: 'delete' });
            const loggedInUser = getSafeUser();

            const payload = {
                ...selectedRow,
                IsActive: "0",
                Status: "0",
                ModifyBy: loggedInUser ? loggedInUser.email : "System"
            };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/asthadidi/${selectedRow.RegInfoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            toast.dismiss('delete');
            if (res.ok) {
                toast.success("Member deleted.");
                setMembers(prev => prev.filter(m => m.RegInfoId !== selectedRow.RegInfoId));
                closeModal();
            }
            else { toast.error("Failed to delete."); }
        } catch (error) { toast.dismiss('delete'); toast.error("Network error."); }
    };

    const confirmApprove = async () => {
        try {
            toast.loading("Approving...", { toastId: 'approve' });
            const approvalId = Math.floor(100000 + Math.random() * 900000);
            const dateStr = new Date().toISOString().split('T')[0];
            const approverString = userName && userRole ? `${userName} (${userRole})` : 'System Admin';

            const payload = { ...selectedRow, Status: 2, AprovalNumber: approvalId, AprovalDate: dateStr, AprovedBy: approverString };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/asthadidi/${selectedRow.RegInfoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            toast.dismiss('approve');
            if (res.ok) { toast.success(`Member Approved! ID: ${approvalId}`); closeModal(); fetchMembers(); }
            else { toast.error("Failed to approve."); }
        } catch (error) { toast.dismiss('approve'); toast.error("Network error."); }
    };

    const renderTh = (label, key, isStickyLeft = false, isStickyRight = false) => {
        let thStyle = { ...styles.th };
        if (isStickyLeft) thStyle = { ...styles.stickyLeftTh };
        if (isStickyRight) thStyle = { ...styles.stickyRightTh };
        return <th style={thStyle} onClick={() => requestSort(key)}>{label} {getSortIcon(key)}</th>;
    };

    return (
        <div style={{ ...styles.card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px' }}>
                <h5 style={styles.cardHeader}>Profile Details & Activity:</h5>
                <button onClick={fetchMembers} style={styles.btnOutline}>Refresh Data</button>
            </div>
            <div style={styles.cardBody}>
                {loading ? <p>Loading data...</p> : (
                    <>
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        {renderTh('ID', 'RegInfoId', true, false)}
                                        {renderTh('Profile', 'ProfileImage')}
                                        {renderTh('Full Name', 'PerName')}
                                        {renderTh('S/D/W Of', 'GuardianName')}
                                        {renderTh('DOB', 'DOB')}
                                        {renderTh('Guardian Contact', 'GuardianContactNo')}
                                        {renderTh('Mobile No', 'ContactNo')}
                                        {renderTh('Email ID', 'MailId')}
                                        {renderTh('State', 'StateName')}
                                        {renderTh('District', 'DistName')}
                                        {renderTh('City', 'City')}
                                        {renderTh('Block', 'BlockName')}
                                        {renderTh('Post Office', 'PO')}
                                        {renderTh('Police Station', 'PS')}
                                        {renderTh('Gram Panchayet', 'GramPanchayet')}
                                        {renderTh('Village', 'Village')}
                                        {renderTh('Pin Code', 'Pincode')}
                                        {renderTh('Bank Name', 'BankName')}
                                        {renderTh('Branch Name', 'BranchName')}
                                        {renderTh('Account No', 'AcctNo')}
                                        {renderTh('IFS Code', 'IFSCode')}
                                        {renderTh('PAN No', 'PanNo')}
                                        {renderTh('Aadhar No', 'AadharNo')}
                                        {renderTh('Joining Amt', 'JoiningAmt')}
                                        {renderTh('Wallet Bal', 'WalletBalance')}
                                        {renderTh('Status', 'Status')}
                                        {renderTh('Approved By', 'AprovedBy')}
                                        {renderTh('Created By', 'CreatedBy')}
                                        <th style={styles.stickyRightTh}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMembers.map((row) => (
                                        <tr key={row.RegInfoId}>
                                            <td style={styles.stickyLeftTd}>#{row.RegInfoId}</td>
                                            <td style={styles.td}>
                                                <img src={extractBase64(row.ProfileImage) || DUMMY_AVATAR} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            </td>
                                            <td style={styles.td}>{row.PerName}</td>
                                            <td style={styles.td}>{row.GuardianName}</td>
                                            <td style={styles.td}>{row.DOB ? row.DOB.substring(0, 10) : ''}</td>
                                            <td style={styles.td}>{row.GuardianContactNo}</td>
                                            <td style={styles.td}>{row.ContactNo}</td>
                                            <td style={styles.td}>{row.MailId}</td>
                                            <td style={styles.td}>{row.StateName}</td>
                                            <td style={styles.td}>{row.DistName}</td>
                                            <td style={styles.td}>{row.City}</td>
                                            <td style={styles.td}>{row.BlockName}</td>
                                            <td style={styles.td}>{row.PO}</td>
                                            <td style={styles.td}>{row.PS}</td>
                                            <td style={styles.td}>{row.GramPanchayet}</td>
                                            <td style={styles.td}>{row.Village}</td>
                                            <td style={styles.td}>{row.Pincode}</td>
                                            <td style={styles.td}>{row.BankName}</td>
                                            <td style={styles.td}>{row.BranchName}</td>
                                            <td style={styles.td}>{row.AcctNo}</td>
                                            <td style={styles.td}>{row.IFSCode}</td>
                                            <td style={styles.td}>{row.PanNo}</td>
                                            <td style={styles.td}>{row.AadharNo}</td>
                                            <td style={styles.td}>₹{row.JoiningAmt}</td>
                                            <td style={styles.td}>₹{row.WalletBalance}</td>
                                            <td style={{ ...styles.td, color: Number(row.Status) === 2 ? 'green' : 'orange', fontWeight: 'bold' }}>{Number(row.Status) === 2 ? 'Approved' : 'Pending'}</td>
                                            <td style={styles.td}>{row.AprovedBy || '-'}</td>
                                            <td style={styles.td}>{row.CreatedBy || '-'}</td>
                                            <td style={styles.stickyRightTd}>
                                                <button onClick={() => openModal('view', row)} style={styles.actionBtn}>👁️</button>
                                                <button onClick={() => openModal('edit', row)} style={styles.actionBtn}>✏️</button>
                                                {userRole !== 'Astha Didi' && userRole !== 'Supervisor' && (
                                                    <button onClick={() => openModal('delete', row)} style={styles.actionBtn}>🗑️</button>
                                                )}
                                                {Number(row.Status) !== 2 && userRole !== 'Astha Didi' && userRole !== 'Supervisor' && (
                                                    <button onClick={() => openModal('approve', row)} style={styles.actionBtn}>✅</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {currentMembers.length === 0 && <tr><td colSpan="29" style={{ ...styles.td, textAlign: 'center' }}>No members found in database.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div style={styles.paginationContainer}>
                            <div>
                                <span>Rows per page: </span>
                                <select value={rowsPerPage} onChange={handleRowsChange} style={styles.pageSelect}>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                            <div>
                                <span style={{ marginRight: '16px' }}>Showing {sortedMembers.length === 0 ? 0 : indexOfFirstMember + 1} to {Math.min(indexOfLastMember, sortedMembers.length)} of {sortedMembers.length}</span>
                                <button onClick={handlePrevPage} disabled={currentPage === 1} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Prev</button>
                                <span style={{ margin: '0 12px' }}>Page {currentPage} of {totalPages}</span>
                                <button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} style={(currentPage === totalPages || totalPages === 0) ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ASTHA DIDI MODALS */}
            {viewModal && selectedRow && <AsthaDidiModal member={selectedRow} mode="view" onClose={closeModal} onSuccess={closeModal} />}
            {editModal && selectedRow && <AsthaDidiModal member={selectedRow} mode="edit" onClose={closeModal} onSuccess={() => { closeModal(); fetchMembers(); }} />}

            {deleteModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ color: '#ff3e1d' }}>Confirm Delete</h4>
                        <p>Delete <strong>{selectedRow.PerName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmDelete} style={styles.btnDanger}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {approveModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ color: '#71dd37' }}>Approve Member</h4>
                        <p>Approve <strong>{selectedRow.PerName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmApprove} style={styles.btnSuccess}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// ==========================================
// 3. SUPERVISOR MODAL (VIEW & EDIT)
// ==========================================
const SupervisorModal = ({ member, mode, onClose, onSuccess }) => {
    const isView = mode === 'view';
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(supervisorSchema),
        mode: 'onChange',
        defaultValues: {
            fullName: member.PerName || '',
            sdwOf: member.SdwOf || '',
            dob: member.DOB ? member.DOB.substring(0, 10) : '',
            guardianName: member.GuardianName || '',
            state: null, district: null,
            block: member.BlockName || '',
            gramPanchayat: member.GramPanchayet || '',
            cityVillage: member.CityVillage || '',
            mobileNo: member.ContactNo || '',
            pinCode: String(member.Pincode || ''),
            aadhaarAddress: member.AadhaarAddress || ''
        }
    });

    const selectedState = watch("state");

    useEffect(() => {
        fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => {
            const formattedStates = data.map(s => ({ value: s.StateId, label: s.StateName }));
            setDbStates(formattedStates);
            if (member.StateName) {
                const matchedState = formattedStates.find(s => s.label === member.StateName);
                if (matchedState) setValue("state", matchedState);
            }
        });
    }, [member.StateName, setValue]);

    useEffect(() => {
        if (selectedState && selectedState.value) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`).then(res => res.json()).then(data => {
                const formattedDistricts = data.map(d => ({ value: d.DistId, label: d.DistName }));
                setDbDistricts(formattedDistricts);
                if (member.DistName) {
                    const matchedDist = formattedDistricts.find(d => d.label === member.DistName);
                    if (matchedDist) setValue("district", matchedDist);
                }
            });
        } else { setDbDistricts([]); }
    }, [selectedState, member.DistName, setValue]);

    const onSubmit = async (data) => {
        if (isView) { onClose(); return; }

        const stateName = data.state ? data.state.label : "";
        const districtName = data.district ? data.district.label : "";
        const loggedInUser = getSafeUser();

        const dbPayload = {
            ...member,
            PerName: data.fullName, GuardianName: data.guardianName, SdwOf: data.sdwOf, DOB: data.dob,
            StateName: stateName, DistName: districtName, CityVillage: data.cityVillage, BlockName: data.block,
            GramPanchayet: data.gramPanchayat, Pincode: parseInt(data.pinCode), ContactNo: data.mobileNo,
            AadhaarAddress: data.aadhaarAddress, ModifyBy: loggedInUser ? loggedInUser.email : "System"
        };

        if (dbPayload.DOB) dbPayload.DOB = dbPayload.DOB.substring(0, 10);

        try {
            toast.loading("Updating supervisor...", { toastId: 'updateSup' });
            const res = await fetch(`${API_BASE_URL}/supervisor/${member.RegInfoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload)
            });
            toast.dismiss('updateSup');
            if (res.ok) { toast.success("Supervisor updated successfully!", { position: "top-right" }); onSuccess(); }
            else { toast.error("Failed to update.", { position: "top-right" }); }
        } catch (error) { toast.dismiss('updateSup'); toast.error("Network error.", { position: "top-right" }); }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '1000px', padding: '0' }}>
                <div style={styles.cardHeader}>
                    <h5 style={{ margin: 0 }}>{isView ? 'View' : 'Edit'} Supervisor Details</h5>
                    <button style={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div style={styles.cardBody}>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.9rem', color: '#566a7f', fontWeight: '500' }}>
                            <div><strong>ID:</strong> #{member.RegInfoId}</div>
                            <div><strong>Status:</strong> {member.Status === 2 ? 'Approved' : 'Pending'}</div>
                            <div><strong>Joining Amount:</strong> ₹{member.JoiningAmt}</div>
                            <div><strong>Wallet Balance:</strong> ₹{member.WalletBalance}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit, () => !isView && toast.error("Check red fields!"))}>
                        <h6 style={styles.sectionHeader}>PERSONAL DETAILS</h6>
                        <div style={styles.formGrid}>
                            <Controller name="fullName" control={control} render={({ field }) => (<FormInput label="Full Name *" id="sup_fullName" error={errors.fullName} disabled={isView} {...field} />)} />
                            <Controller name="sdwOf" control={control} render={({ field }) => (<FormInput label="S/D/W of *" id="sup_sdwOf" error={errors.sdwOf} disabled={isView} {...field} />)} />
                            <Controller name="dob" control={control} render={({ field }) => (<FormInput label="Date of Birth *" id="sup_dob" error={errors.dob} type="date" disabled={isView} {...field} />)} />
                            <Controller name="guardianName" control={control} render={({ field }) => (<FormInput label="Guardian Name *" id="sup_guardianName" error={errors.guardianName} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>CONTACT DETAILS</h6>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Select State *</label>
                                <Controller name="state" control={control} render={({ field }) => (<Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} isDisabled={isView} menuPortalTarget={document.body} />)} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>District *</label>
                                <Controller name="district" control={control} render={({ field }) => (<Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} isDisabled={isView || !selectedState} menuPortalTarget={document.body} />)} />
                            </div>
                            <Controller name="block" control={control} render={({ field }) => (<FormInput label="Block *" id="sup_block" error={errors.block} disabled={isView} {...field} />)} />
                            <Controller name="gramPanchayat" control={control} render={({ field }) => (<FormInput label="Gram Panchayat Name *" id="sup_gramPanchayat" error={errors.gramPanchayat} disabled={isView} {...field} />)} />
                            <Controller name="cityVillage" control={control} render={({ field }) => (<FormInput label="City/ Village Name *" id="sup_cityVillage" error={errors.cityVillage} disabled={isView} {...field} />)} />
                            <Controller name="mobileNo" control={control} render={({ field }) => (<FormInput label="Mobile No. *" id="sup_mobileNo" type="tel" error={errors.mobileNo} disabled={isView} {...field} />)} />
                            <Controller name="pinCode" control={control} render={({ field }) => (<FormInput label="Pin Code *" id="sup_pinCode" error={errors.pinCode} disabled={isView} {...field} />)} />
                        </div>

                        <div style={styles.formGrid}>
                            <Controller name="aadhaarAddress" control={control} render={({ field }) => (
                                <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                                    <label htmlFor="aadhaarAddress" style={styles.label}>Address as per Aadhaar Card *</label>
                                    <textarea id="aadhaarAddress" disabled={isView} style={{ ...styles.input(!!errors.aadhaarAddress), resize: 'vertical', minHeight: '80px', backgroundColor: isView ? '#eceeef' : '#fff' }} {...field} />
                                </div>
                            )} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '10px' }}>
                            <button type="button" style={styles.btnOutline} onClick={onClose}>{isView ? 'Close' : 'Cancel'}</button>
                            {!isView && <button type="submit" style={styles.btnPrimary}>Save Changes</button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. SUPERVISOR TABLE
// ==========================================
const SupervisorTable = ({ refreshTrigger }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState(null);

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        const user = getSafeUser();
        if (user) { setUserRole(user.role || ''); setUserName(user.username || ''); }
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/supervisor`);
            if (!res.ok) throw new Error("Failed to fetch table data");
            let data = await res.json();

            // SOFT DELETE FILTER
            data = data.filter(member => String(member.IsActive) !== '0' && String(member.Status) !== '0');
            setMembers(data);
        } catch (error) { toast.error("Failed to load supervisor data.", { position: "top-right" }); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, [refreshTrigger]);

    const sortedMembers = useMemo(() => {
        let sortableItems = [...members];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key] || ''; let bVal = b[sortConfig.key] || '';
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [members, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName) => {
        if (!sortConfig || sortConfig.key !== columnName) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
        return sortConfig.direction === 'ascending' ? <span style={{ marginLeft: '4px' }}>▲</span> : <span style={{ marginLeft: '4px' }}>▼</span>;
    };

    const totalPages = Math.max(1, Math.ceil(sortedMembers.length / rowsPerPage));
    useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [sortedMembers.length, totalPages, currentPage]);

    const indexOfLastMember = currentPage * rowsPerPage;
    const indexOfFirstMember = indexOfLastMember - rowsPerPage;
    const currentMembers = sortedMembers.slice(indexOfFirstMember, indexOfLastMember);
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleRowsChange = (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); };

    const openModal = (type, member) => {
        setSelectedRow({ ...member });
        if (type === 'view') setViewModal(true);
        if (type === 'edit') setEditModal(true);
        if (type === 'delete') setDeleteModal(true);
        if (type === 'approve') setApproveModal(true);
    };

    const closeModal = () => { setViewModal(false); setEditModal(false); setDeleteModal(false); setApproveModal(false); setSelectedRow(null); };

    const confirmDelete = async () => {
        try {
            toast.loading("Deleting...", { toastId: 'deleteSup' });
            const loggedInUser = getSafeUser();

            const payload = { ...selectedRow, IsActive: "0", Status: "0", ModifyBy: loggedInUser ? loggedInUser.email : "System" };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/supervisor/${selectedRow.RegInfoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });

            toast.dismiss('deleteSup');
            if (res.ok) { toast.success("Member deleted."); setMembers(prev => prev.filter(m => m.RegInfoId !== selectedRow.RegInfoId)); closeModal(); }
            else { toast.error("Failed to delete."); }
        } catch (error) { toast.dismiss('deleteSup'); toast.error("Network error."); }
    };

    const confirmApprove = async () => {
        try {
            toast.loading("Approving...", { toastId: 'approveSup' });
            const approvalId = Math.floor(100000 + Math.random() * 900000);
            const dateStr = new Date().toISOString().split('T')[0];
            const approverString = userName && userRole ? `${userName} (${userRole})` : 'System Admin';

            const payload = { ...selectedRow, Status: 2, AprovalNumber: approvalId, AprovalDate: dateStr, AprovedBy: approverString };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/supervisor/${selectedRow.RegInfoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            toast.dismiss('approveSup');
            if (res.ok) { toast.success(`Member Approved! ID: ${approvalId}`); closeModal(); fetchMembers(); }
            else { toast.error("Failed to approve."); }
        } catch (error) { toast.dismiss('approveSup'); toast.error("Network error."); }
    };

    const renderTh = (label, key, isStickyLeft = false, isStickyRight = false) => {
        let thStyle = { ...styles.th };
        if (isStickyLeft) thStyle = { ...styles.stickyLeftTh };
        if (isStickyRight) thStyle = { ...styles.stickyRightTh };
        return <th style={thStyle} onClick={() => requestSort(key)}>{label} {getSortIcon(key)}</th>;
    };

    return (
        <div style={{ ...styles.card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px' }}>
                <h5 style={styles.cardHeader}>Supervisor Entry Details:-</h5>
                <button onClick={fetchMembers} style={styles.btnOutline}>Refresh Data</button>
            </div>
            <div style={styles.cardBody}>
                {loading ? <p>Loading data...</p> : (
                    <>
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        {renderTh('ID', 'RegInfoId', true, false)}
                                        {renderTh('Profile', 'ProfileImage')}
                                        {renderTh('Full Name', 'PerName')}
                                        {renderTh('S/D/W Of', 'SdwOf')}
                                        {renderTh('DOB', 'DOB')}
                                        {renderTh('Guardian Name', 'GuardianName')}
                                        {renderTh('Mobile No', 'ContactNo')}
                                        {renderTh('State', 'StateName')}
                                        {renderTh('District', 'DistName')}
                                        {renderTh('Block', 'BlockName')}
                                        {renderTh('Gram Panchayet', 'GramPanchayet')}
                                        {renderTh('City/Village', 'CityVillage')}
                                        {renderTh('Pin Code', 'Pincode')}
                                        {renderTh('Aadhaar Address', 'AadhaarAddress')}
                                        {renderTh('Joining Amt', 'JoiningAmt')}
                                        {renderTh('Wallet Bal', 'WalletBalance')}
                                        {renderTh('Status', 'Status')}
                                        {renderTh('Approved By', 'AprovedBy')}
                                        {renderTh('Created By', 'CreatedBy')}
                                        <th style={styles.stickyRightTh}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMembers.map((row) => (
                                        <tr key={row.RegInfoId}>
                                            <td style={styles.stickyLeftTd}>#{row.RegInfoId}</td>
                                            <td style={styles.td}>
                                                <img src={extractBase64(row.ProfileImage) || DUMMY_AVATAR} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            </td>
                                            <td style={styles.td}>{row.PerName}</td>
                                            <td style={styles.td}>{row.SdwOf}</td>
                                            <td style={styles.td}>{row.DOB ? row.DOB.substring(0, 10) : ''}</td>
                                            <td style={styles.td}>{row.GuardianName}</td>
                                            <td style={styles.td}>{row.ContactNo}</td>
                                            <td style={styles.td}>{row.StateName}</td>
                                            <td style={styles.td}>{row.DistName}</td>
                                            <td style={styles.td}>{row.BlockName}</td>
                                            <td style={styles.td}>{row.GramPanchayet}</td>
                                            <td style={styles.td}>{row.CityVillage}</td>
                                            <td style={styles.td}>{row.Pincode}</td>
                                            <td style={styles.td}>{row.AadhaarAddress}</td>
                                            <td style={styles.td}>₹{row.JoiningAmt}</td>
                                            <td style={styles.td}>₹{row.WalletBalance}</td>
                                            <td style={{ ...styles.td, color: Number(row.Status) === 2 ? 'green' : 'orange', fontWeight: 'bold' }}>{Number(row.Status) === 2 ? 'Approved' : 'Pending'}</td>
                                            <td style={styles.td}>{row.AprovedBy || '-'}</td>
                                            <td style={styles.td}>{row.CreatedBy || '-'}</td>
                                            <td style={styles.stickyRightTd}>
                                                <button onClick={() => openModal('view', row)} style={styles.actionBtn}>👁️</button>
                                                <button onClick={() => openModal('edit', row)} style={styles.actionBtn}>✏️</button>
                                                <button onClick={() => openModal('delete', row)} style={styles.actionBtn}>🗑️</button>
                                                {Number(row.Status) !== 2 && (
                                                    <button onClick={() => openModal('approve', row)} style={styles.actionBtn}>✅</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {currentMembers.length === 0 && <tr><td colSpan="20" style={{ ...styles.td, textAlign: 'center' }}>No members found in database.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div style={styles.paginationContainer}>
                            <div>
                                <span>Rows per page: </span>
                                <select value={rowsPerPage} onChange={handleRowsChange} style={styles.pageSelect}>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                            <div>
                                <span style={{ marginRight: '16px' }}>Showing {sortedMembers.length === 0 ? 0 : indexOfFirstMember + 1} to {Math.min(indexOfLastMember, sortedMembers.length)} of {sortedMembers.length}</span>
                                <button onClick={handlePrevPage} disabled={currentPage === 1} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Prev</button>
                                <span style={{ margin: '0 12px' }}>Page {currentPage} of {totalPages}</span>
                                <button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} style={(currentPage === totalPages || totalPages === 0) ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {viewModal && selectedRow && <SupervisorModal member={selectedRow} mode="view" onClose={closeModal} onSuccess={closeModal} />}
            {editModal && selectedRow && <SupervisorModal member={selectedRow} mode="edit" onClose={closeModal} onSuccess={() => { closeModal(); fetchMembers(); }} />}

            {deleteModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ color: '#ff3e1d' }}>Confirm Delete</h4>
                        <p>Delete <strong>{selectedRow.PerName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmDelete} style={styles.btnDanger}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {approveModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ color: '#71dd37' }}>Approve Member</h4>
                        <p>Approve <strong>{selectedRow.PerName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmApprove} style={styles.btnSuccess}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// ==========================================
// 4-A. ASTHA MAA MODAL (VIEW & EDIT)
// ==========================================
const AsthaMaaModal = ({ member, mode, onClose, onSuccess }) => {
    const isView = mode === 'view';
    const cleanInitialImage = extractBase64(member.ProfileImage) || DUMMY_AVATAR;
    const [profileImage, setProfileImage] = useState(cleanInitialImage);
    const fileInputRef = useRef(null);
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(asthaMaaSchema),
        mode: 'onChange',
        defaultValues: {
            joiningAmount: String(member.JoiningAmt || '5000'),
            walletBalance: String(member.WalletBalance || '0'),
            fullName: member.PerName || '',
            sdwOf: member.GuardianName || '',
            dob: member.DOB ? member.DOB.substring(0, 10) : '',
            guardianContactNo: member.GuardianContactNo || '',
            state: null, district: null, city: member.City || '', block: member.BlockName || '',
            postOffice: member.PO || '', policeStation: member.PS || '', gramPanchayet: member.GramPanchayet || '',
            village: member.Village || '', pinCode: String(member.Pincode || ''), mobileNo: member.ContactNo || '',
            email: member.MailId || '', bankName: member.BankName || '', branchName: member.BranchName || '',
            accountNo: member.AcctNo || '', ifsCode: member.IFSCode || '', panNo: member.PanNo || '',
            aadharNo: member.AadharNo || ''
        }
    });

    const selectedState = watch("state");

    useEffect(() => {
        fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => {
            const formattedStates = data.map(s => ({ value: s.StateId, label: s.StateName }));
            setDbStates(formattedStates);
            if (member.StateName) {
                const matchedState = formattedStates.find(s => s.label === member.StateName);
                if (matchedState) setValue("state", matchedState);
            }
        });
    }, [member.StateName, setValue]);

    useEffect(() => {
        if (selectedState && selectedState.value) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`).then(res => res.json()).then(data => {
                const formattedDistricts = data.map(d => ({ value: d.DistId, label: d.DistName }));
                setDbDistricts(formattedDistricts);
                if (member.DistName) {
                    const matchedDist = formattedDistricts.find(d => d.label === member.DistName);
                    if (matchedDist) setValue("district", matchedDist);
                }
            });
        } else { setDbDistricts([]); }
    }, [selectedState, member.DistName, setValue]);

    const handleUploadClick = () => {
        if (!isView && fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        if (isView) return;
        const file = event.target.files[0];
        if (file) {
            if (file.size > 800000) return toast.warning("Image size exceeds 800KB.");
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleResetImage = () => {
        if (isView) return;
        setProfileImage(DUMMY_AVATAR);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onSubmit = async (data) => {
        if (isView) { onClose(); return; }

        const stateName = data.state ? data.state.label : "";
        const districtName = data.district ? data.district.label : "";
        const loggedInUser = getSafeUser();

        const dbPayload = {
            ...member,
            ProfileImage: profileImage === DUMMY_AVATAR ? null : profileImage,
            PerName: data.fullName, GuardianName: data.sdwOf || "", DOB: data.dob, GuardianContactNo: data.guardianContactNo || "",
            StateName: stateName, DistName: districtName, City: data.city || "", BlockName: data.block || "",
            PO: data.postOffice || "", PS: data.policeStation || "", GramPanchayet: data.gramPanchayet || "",
            Village: data.village || "", Pincode: parseInt(data.pinCode), ContactNo: data.mobileNo, MailId: data.email,
            BankName: data.bankName || "", BranchName: data.branchName || "", AcctNo: data.accountNo || "0",
            IFSCode: data.ifsCode || "", PanNo: data.panNo || "", AadharNo: data.aadharNo,
            JoiningAmt: parseInt(data.joiningAmount) || 5000, WalletBalance: parseInt(data.walletBalance) || 0,
            ModifyBy: loggedInUser ? loggedInUser.email : "System"
        };

        if (dbPayload.DOB) dbPayload.DOB = dbPayload.DOB.substring(0, 10);

        try {
            toast.loading("Updating Astha Maa...", { toastId: 'updateMaa' });
            const res = await fetch(`${API_BASE_URL}/asthamaa/${member.RegInfoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload)
            });
            toast.dismiss('updateMaa');
            if (res.ok) { toast.success("Astha Maa updated successfully!", { position: "top-right" }); onSuccess(); }
            else { toast.error("Failed to update.", { position: "top-right" }); }
        } catch (error) { toast.dismiss('updateMaa'); toast.error("Network error.", { position: "top-right" }); }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '1000px', padding: '0' }}>
                <div style={styles.cardHeader}>
                    <h5 style={{ margin: 0 }}>{isView ? 'View' : 'Edit'} Astha Maa Details</h5>
                    <button style={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div style={styles.cardBody}>
                    <div style={styles.profileSection}>
                        <img src={profileImage} alt="Profile Avatar" style={styles.avatar} />
                        <div>
                            <p style={styles.hintText}><strong>ID:</strong> #{member.RegInfoId}</p>
                            <p style={styles.hintText}><strong>Status:</strong> {member.Status === 2 ? 'Approved' : 'Pending'}</p>
                            {member.Status === 2 && member.AprovedBy && (
                                <p style={styles.hintText}><strong>Approved By:</strong> {member.AprovedBy}</p>
                            )}
                            {!isView && (
                                <div style={styles.buttonGroup}>
                                    <button type="button" style={styles.btnOutline} onClick={handleUploadClick}>Change photo</button>
                                    <button type="button" style={styles.btnOutline} onClick={handleResetImage}>Reset</button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" style={{ display: 'none' }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit, () => !isView && toast.error("Check red fields!"))}>

                        <h6 style={styles.sectionHeader}>Astha Maa Information</h6>
                        <div style={styles.formGrid}>
                            <Controller name="joiningAmount" control={control} render={({ field }) => (<FormInput label="Joining Amount *" id="edit_joiningAmount" error={errors.joiningAmount} disabled={true} readOnly {...field} />)} />
                            <Controller name="walletBalance" control={control} render={({ field }) => (<FormInput label="Wallet Balance *" id="edit_walletBalance" error={errors.walletBalance} disabled={true} readOnly {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Personal Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="fullName" control={control} render={({ field }) => (<FormInput label="Full Name *" id="edit_fullName" error={errors.fullName} disabled={isView} {...field} />)} />
                            <Controller name="sdwOf" control={control} render={({ field }) => (<FormInput label="S/D/W of" id="edit_sdwOf" error={errors.sdwOf} disabled={isView} {...field} />)} />
                            <Controller name="dob" control={control} render={({ field }) => (<FormInput label="Date of Birth *" id="edit_dob" error={errors.dob} type="date" disabled={isView} {...field} />)} />
                            <Controller name="guardianContactNo" control={control} render={({ field }) => (<FormInput label="Guardian Contact no" id="edit_guardianContactNo" error={errors.guardianContactNo} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Postal Address Information</h6>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Select State *</label>
                                <Controller name="state" control={control} render={({ field }) => (<Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} isDisabled={isView} menuPortalTarget={document.body} />)} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>District *</label>
                                <Controller name="district" control={control} render={({ field }) => (<Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} isDisabled={isView || !selectedState} menuPortalTarget={document.body} />)} />
                            </div>
                            <Controller name="city" control={control} render={({ field }) => (<FormInput label="City" id="edit_city" error={errors.city} disabled={isView} {...field} />)} />
                            <Controller name="block" control={control} render={({ field }) => (<FormInput label="Block" id="edit_block" error={errors.block} disabled={isView} {...field} />)} />
                            <Controller name="postOffice" control={control} render={({ field }) => (<FormInput label="Post Office" id="edit_postOffice" error={errors.postOffice} disabled={isView} {...field} />)} />
                            <Controller name="policeStation" control={control} render={({ field }) => (<FormInput label="Police Station" id="edit_policeStation" error={errors.policeStation} disabled={isView} {...field} />)} />
                            <Controller name="gramPanchayet" control={control} render={({ field }) => (<FormInput label="Gram Panchayet" id="edit_gramPanchayet" error={errors.gramPanchayet} disabled={isView} {...field} />)} />
                            <Controller name="village" control={control} render={({ field }) => (<FormInput label="Village" id="edit_village" error={errors.village} disabled={isView} {...field} />)} />
                            <Controller name="pinCode" control={control} render={({ field }) => (<FormInput label="Pin Code *" id="edit_pinCode" error={errors.pinCode} disabled={isView} {...field} />)} />
                            <Controller name="mobileNo" control={control} render={({ field }) => (<FormInput label="Contact Number *" id="edit_mobileNo" error={errors.mobileNo} disabled={isView} {...field} />)} />

                            {/* READONLY ID/EMAIL FIELDS AS REQUESTED */}
                            <Controller name="email" control={control} render={({ field }) => (<FormInput label="Email ID *" id="edit_email" error={errors.email} disabled readOnly {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Banking & Payment Details</h6>
                        <div style={styles.formGrid}>
                            {/* STRICTLY READONLY BANK AND ID FIELDS AS REQUESTED */}
                            <Controller name="bankName" control={control} render={({ field }) => (<FormInput label="Bank Name" id="edit_bankName" error={errors.bankName} disabled readOnly {...field} />)} />
                            <Controller name="branchName" control={control} render={({ field }) => (<FormInput label="Branch Name" id="edit_branchName" error={errors.branchName} disabled readOnly {...field} />)} />
                            <Controller name="accountNo" control={control} render={({ field }) => (<FormInput label="Account No" id="edit_accountNo" error={errors.accountNo} disabled readOnly {...field} />)} />
                            <Controller name="ifsCode" control={control} render={({ field }) => (<FormInput label="IFS Code" id="edit_ifsCode" error={errors.ifsCode} disabled readOnly {...field} />)} />
                            <Controller name="panNo" control={control} render={({ field }) => (<FormInput label="PAN No" id="edit_panNo" error={errors.panNo} disabled readOnly {...field} />)} />
                            <Controller name="aadharNo" control={control} render={({ field }) => (<FormInput label="Aadhar No *" id="edit_aadharNo" error={errors.aadharNo} disabled readOnly {...field} />)} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '10px' }}>
                            <button type="button" style={styles.btnOutline} onClick={onClose}>{isView ? 'Close' : 'Cancel'}</button>
                            {!isView && <button type="submit" style={styles.btnPrimary}>Save Changes</button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4-B. ASTHA MAA DATA TABLE
// ==========================================
const AsthaMaaTable = ({ refreshTrigger }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState(null);

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        const user = getSafeUser();
        if (user) { setUserRole(user.role || ''); setUserName(user.username || ''); }
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/asthamaa`);
            if (!res.ok) throw new Error("Failed to fetch table data");
            let data = await res.json();

            // SOFT DELETE FILTER
            data = data.filter(member => String(member.IsActive) !== '0' && String(member.Status) !== '0');

            const user = getSafeUser();
            // User Visibility Logic As Requested:
            // If logged in as Astha Maa, ONLY see data created by them.
            // If logged in as Supervisor (or Admin), see all rows without restriction.
            if (user && user.role === 'Astha Maa') {
                data = data.filter(member => member.CreatedBy === user.email);
            }
            setMembers(data);
        } catch (error) { toast.error("Failed to load Astha Maa table data.", { position: "top-right" }); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, [refreshTrigger]);

    const sortedMembers = useMemo(() => {
        let sortableItems = [...members];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key] || ''; let bVal = b[sortConfig.key] || '';
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [members, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName) => {
        if (!sortConfig || sortConfig.key !== columnName) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
        return sortConfig.direction === 'ascending' ? <span style={{ marginLeft: '4px' }}>▲</span> : <span style={{ marginLeft: '4px' }}>▼</span>;
    };

    const totalPages = Math.max(1, Math.ceil(sortedMembers.length / rowsPerPage));
    useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [sortedMembers.length, totalPages, currentPage]);

    const indexOfLastMember = currentPage * rowsPerPage;
    const indexOfFirstMember = indexOfLastMember - rowsPerPage;
    const currentMembers = sortedMembers.slice(indexOfFirstMember, indexOfLastMember);
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleRowsChange = (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); };

    const openModal = (type, member) => {
        setSelectedRow({ ...member });
        if (type === 'view') setViewModal(true);
        if (type === 'edit') setEditModal(true);
        if (type === 'delete') setDeleteModal(true);
        if (type === 'approve') setApproveModal(true);
    };

    const closeModal = () => { setViewModal(false); setEditModal(false); setDeleteModal(false); setApproveModal(false); setSelectedRow(null); };

    const confirmDelete = async () => {
        try {
            toast.loading("Deleting...", { toastId: 'deleteMaa' });
            const loggedInUser = getSafeUser();

            const payload = {
                ...selectedRow,
                IsActive: "0",
                Status: "0",
                ModifyBy: loggedInUser ? loggedInUser.email : "System"
            };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/asthamaa/${selectedRow.RegInfoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            toast.dismiss('deleteMaa');
            if (res.ok) {
                toast.success("Astha Maa deleted.");
                setMembers(prev => prev.filter(m => m.RegInfoId !== selectedRow.RegInfoId));
                closeModal();
            }
            else { toast.error("Failed to delete."); }
        } catch (error) { toast.dismiss('deleteMaa'); toast.error("Network error."); }
    };

    const confirmApprove = async () => {
        try {
            toast.loading("Approving...", { toastId: 'approveMaa' });
            const approvalId = Math.floor(100000 + Math.random() * 900000);
            const dateStr = new Date().toISOString().split('T')[0];
            const approverString = userName && userRole ? `${userName} (${userRole})` : 'System Admin';

            const payload = { ...selectedRow, Status: 2, AprovalNumber: approvalId, AprovalDate: dateStr, AprovedBy: approverString };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/asthamaa/${selectedRow.RegInfoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            toast.dismiss('approveMaa');
            if (res.ok) { toast.success(`Member Approved! ID: ${approvalId}`); closeModal(); fetchMembers(); }
            else { toast.error("Failed to approve."); }
        } catch (error) { toast.dismiss('approveMaa'); toast.error("Network error."); }
    };

    const renderTh = (label, key, isStickyLeft = false, isStickyRight = false) => {
        let thStyle = { ...styles.th };
        if (isStickyLeft) thStyle = { ...styles.stickyLeftTh };
        if (isStickyRight) thStyle = { ...styles.stickyRightTh };
        return <th style={thStyle} onClick={() => requestSort(key)}>{label} {getSortIcon(key)}</th>;
    };

    return (
        <div style={{ ...styles.card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px' }}>
                <h5 style={styles.cardHeader}>Astha Maa Details & Activity:</h5>
                <button onClick={fetchMembers} style={styles.btnOutline}>Refresh Data</button>
            </div>
            <div style={styles.cardBody}>
                {loading ? <p>Loading data...</p> : (
                    <>
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        {renderTh('ID', 'RegInfoId', true, false)}
                                        {renderTh('Profile', 'ProfileImage')}
                                        {renderTh('Full Name', 'PerName')}
                                        {renderTh('S/D/W Of', 'GuardianName')}
                                        {renderTh('DOB', 'DOB')}
                                        {renderTh('Guardian Contact', 'GuardianContactNo')}
                                        {renderTh('Mobile No', 'ContactNo')}
                                        {renderTh('Email ID', 'MailId')}
                                        {renderTh('State', 'StateName')}
                                        {renderTh('District', 'DistName')}
                                        {renderTh('City', 'City')}
                                        {renderTh('Block', 'BlockName')}
                                        {renderTh('Post Office', 'PO')}
                                        {renderTh('Police Station', 'PS')}
                                        {renderTh('Gram Panchayet', 'GramPanchayet')}
                                        {renderTh('Village', 'Village')}
                                        {renderTh('Pin Code', 'Pincode')}
                                        {renderTh('Bank Name', 'BankName')}
                                        {renderTh('Branch Name', 'BranchName')}
                                        {renderTh('Account No', 'AcctNo')}
                                        {renderTh('IFS Code', 'IFSCode')}
                                        {renderTh('PAN No', 'PanNo')}
                                        {renderTh('Aadhar No', 'AadharNo')}
                                        {renderTh('Joining Amt', 'JoiningAmt')}
                                        {renderTh('Wallet Bal', 'WalletBalance')}
                                        {renderTh('Status', 'Status')}
                                        {renderTh('Approved By', 'AprovedBy')}
                                        {renderTh('Created By', 'CreatedBy')}
                                        <th style={styles.stickyRightTh}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMembers.map((row) => (
                                        <tr key={row.RegInfoId}>
                                            <td style={styles.stickyLeftTd}>#{row.RegInfoId}</td>
                                            <td style={styles.td}>
                                                <img src={extractBase64(row.ProfileImage) || DUMMY_AVATAR} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            </td>
                                            <td style={styles.td}>{row.PerName}</td>
                                            <td style={styles.td}>{row.GuardianName}</td>
                                            <td style={styles.td}>{row.DOB ? row.DOB.substring(0, 10) : ''}</td>
                                            <td style={styles.td}>{row.GuardianContactNo}</td>
                                            <td style={styles.td}>{row.ContactNo}</td>
                                            <td style={styles.td}>{row.MailId}</td>
                                            <td style={styles.td}>{row.StateName}</td>
                                            <td style={styles.td}>{row.DistName}</td>
                                            <td style={styles.td}>{row.City}</td>
                                            <td style={styles.td}>{row.BlockName}</td>
                                            <td style={styles.td}>{row.PO}</td>
                                            <td style={styles.td}>{row.PS}</td>
                                            <td style={styles.td}>{row.GramPanchayet}</td>
                                            <td style={styles.td}>{row.Village}</td>
                                            <td style={styles.td}>{row.Pincode}</td>
                                            <td style={styles.td}>{row.BankName}</td>
                                            <td style={styles.td}>{row.BranchName}</td>
                                            <td style={styles.td}>{row.AcctNo}</td>
                                            <td style={styles.td}>{row.IFSCode}</td>
                                            <td style={styles.td}>{row.PanNo}</td>
                                            <td style={styles.td}>{row.AadharNo}</td>
                                            <td style={styles.td}>₹{row.JoiningAmt}</td>
                                            <td style={styles.td}>₹{row.WalletBalance}</td>
                                            <td style={{ ...styles.td, color: Number(row.Status) === 2 ? 'green' : 'orange', fontWeight: 'bold' }}>{Number(row.Status) === 2 ? 'Approved' : 'Pending'}</td>
                                            <td style={styles.td}>{row.AprovedBy || '-'}</td>
                                            <td style={styles.td}>{row.CreatedBy || '-'}</td>
                                            <td style={styles.stickyRightTd}>
                                                <button onClick={() => openModal('view', row)} style={styles.actionBtn}>👁️</button>
                                                <button onClick={() => openModal('edit', row)} style={styles.actionBtn}>✏️</button>
                                                {userRole !== 'Astha Maa' && userRole !== 'Astha Didi' && (
                                                    <button onClick={() => openModal('delete', row)} style={styles.actionBtn}>🗑️</button>
                                                )}
                                                {Number(row.Status) !== 2 && userRole !== 'Astha Maa' && userRole !== 'Astha Didi' && (
                                                    <button onClick={() => openModal('approve', row)} style={styles.actionBtn}>✅</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {currentMembers.length === 0 && <tr><td colSpan="29" style={{ ...styles.td, textAlign: 'center' }}>No members found in database.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div style={styles.paginationContainer}>
                            <div>
                                <span>Rows per page: </span>
                                <select value={rowsPerPage} onChange={handleRowsChange} style={styles.pageSelect}>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                            <div>
                                <span style={{ marginRight: '16px' }}>Showing {sortedMembers.length === 0 ? 0 : indexOfFirstMember + 1} to {Math.min(indexOfLastMember, sortedMembers.length)} of {sortedMembers.length}</span>
                                <button onClick={handlePrevPage} disabled={currentPage === 1} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Prev</button>
                                <span style={{ margin: '0 12px' }}>Page {currentPage} of {totalPages}</span>
                                <button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} style={(currentPage === totalPages || totalPages === 0) ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ASTHA MAA MODALS */}
            {viewModal && selectedRow && <AsthaMaaModal member={selectedRow} mode="view" onClose={closeModal} onSuccess={closeModal} />}
            {editModal && selectedRow && <AsthaMaaModal member={selectedRow} mode="edit" onClose={closeModal} onSuccess={() => { closeModal(); fetchMembers(); }} />}

            {deleteModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ color: '#ff3e1d' }}>Confirm Delete</h4>
                        <p>Delete <strong>{selectedRow.PerName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmDelete} style={styles.btnDanger}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {approveModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ color: '#71dd37' }}>Approve Member</h4>
                        <p>Approve <strong>{selectedRow.PerName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmApprove} style={styles.btnSuccess}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// ==========================================
// 5. DISTRICT ADMIN MODAL (VIEW & EDIT)
// ==========================================
const DistrictAdminModal = ({ member, mode, onClose, onSuccess }) => {
    const isView = mode === 'view';
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [regCertPdf, setRegCertPdf] = useState(member.RegistrationCertPDF || null);
    const [panPdf, setPanPdf] = useState(member.NgoPanPDF || null);
    const [darpanPdf, setDarpanPdf] = useState(member.DarpanCertPDF || null);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(ngoSchema),
        mode: 'onChange',
        defaultValues: {
            ngoName: member.DistNGOName || '',
            ngoRegistrationDate: member.DistNGORegDate ? member.DistNGORegDate.substring(0, 10) : '',
            ngoRegistrationNo: member.DistNGORegNo || '',
            ngoPanNo: member.DistNGOPanNo || '',
            ngoDarpanId: member.DistNGODarpanId || '',
            ngoEmail: member.DistNGOMailId || '',
            ngoMobile: member.DistNGOPhoneNo || '',
            ngoRegAddress: member.DistNGORegAddress || '',
            ngoWorkingAddress: member.DistNGOWorkingAddress || '',
            state: null, district: null, blockName: member.BlockName || '',
            sdpName: member.DistNGOSDPName || '',
            secretaryEmail: member.DistNGOSDPMailId || '',
            secretaryMobile: member.DistNGOSDPPhoneNo || '',
            secretaryAadhar: member.DistNGOSDPAadhaarNo || '',
            bankName: member.DistNGOBankName || '',
            accountNo: member.DistNGOAcctNo || '',
            ifsCode: member.DistNGOIFSCode || '',
            bankAddress: member.DistNGOBankAdd || '',
            userName: member.DistNGOUserName || '',
            password: member.DistNGOPassword || ''
        }
    });

    const selectedState = watch("state");

    useEffect(() => {
        fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => {
            const formattedStates = data.map(s => ({ value: s.StateId, label: s.StateName }));
            setDbStates(formattedStates);
            if (member.DistNGOStateName) {
                const matchedState = formattedStates.find(s => s.label === member.DistNGOStateName);
                if (matchedState) setValue("state", matchedState);
            }
        });
    }, [member.DistNGOStateName, setValue]);

    useEffect(() => {
        if (selectedState && selectedState.value) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`).then(res => res.json()).then(data => {
                const formattedDistricts = data.map(d => ({ value: d.DistId, label: d.DistName }));
                setDbDistricts(formattedDistricts);
                if (member.DistNGODistName) {
                    const matchedDist = formattedDistricts.find(d => d.label === member.DistNGODistName);
                    if (matchedDist) setValue("district", matchedDist);
                }
            });
        } else { setDbDistricts([]); }
    }, [selectedState, member.DistNGODistName, setValue]);

    const handlePdfUpload = async (event, setPdfState) => {
        if (isView) return;
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') return toast.warning("Only PDF allowed.");
            if (file.size > 5000000) return toast.warning("Max 5MB.");
            try { const b64 = await fileToBase64(file); setPdfState(b64); }
            catch (err) { toast.error("File reading error."); }
        }
    };

    const onSubmit = async (data) => {
        if (isView) { onClose(); return; }

        const loggedInUser = getSafeUser();
        const dbPayload = {
            ...member,
            DistNGOName: data.ngoName, DistNGORegDate: data.ngoRegistrationDate, DistNGORegNo: data.ngoRegistrationNo,
            DistNGOPanNo: data.ngoPanNo, DistNGODarpanId: data.ngoDarpanId, DistNGOMailId: data.ngoEmail,
            DistNGOPhoneNo: data.ngoMobile, DistNGORegAddress: data.ngoRegAddress, DistNGOWorkingAddress: data.ngoWorkingAddress,
            DistNGOStateName: data.state ? data.state.label : "", DistNGODistName: data.district ? data.district.label : "",
            BlockName: data.blockName, DistNGOSDPName: data.sdpName, DistNGOSDPMailId: data.secretaryEmail,
            DistNGOSDPPhoneNo: data.secretaryMobile, DistNGOSDPAadhaarNo: data.secretaryAadhar, DistNGOBankName: data.bankName,
            DistNGOAcctNo: data.accountNo, DistNGOIFSCode: data.ifsCode, DistNGOBankAdd: data.bankAddress,
            DistNGOUserName: data.userName, DistNGOPassword: data.password,
            RegistrationCertPDF: regCertPdf, NgoPanPDF: panPdf, DarpanCertPDF: darpanPdf,
            ModifyBy: loggedInUser ? loggedInUser.email : "System"
        };

        try {
            toast.loading("Updating record...", { toastId: 'updateNgo' });
            const res = await fetch(`${API_BASE_URL}/districtadmin/${member.DistNGORegId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload)
            });
            toast.dismiss('updateNgo');
            if (res.ok) { toast.success("Record updated!"); onSuccess(); }
            else toast.error("Failed to update.");
        } catch (error) { toast.dismiss('updateNgo'); toast.error("Network error."); }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '1000px', padding: '0' }}>
                <div style={styles.cardHeader}>
                    <h5 style={{ margin: 0 }}>{isView ? 'View' : 'Edit'} District Admin Record</h5>
                    <button style={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div style={styles.cardBody}>
                    <form onSubmit={handleSubmit(onSubmit, () => !isView && toast.error("Check errors!"))}>

                        <h6 style={styles.sectionHeader}>NGO Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="ngoName" control={control} render={({ field }) => (<FormInput label="NGO Full Name *" id="e_ngoName" error={errors.ngoName} disabled={isView} {...field} />)} />
                            <Controller name="ngoRegistrationDate" control={control} render={({ field }) => (<FormInput label="Date of Registration *" id="e_ngoRegDate" type="date" error={errors.ngoRegistrationDate} disabled={isView} {...field} />)} />
                            <Controller name="ngoRegistrationNo" control={control} render={({ field }) => (<FormInput label="Registration No *" id="e_ngoRegNo" error={errors.ngoRegistrationNo} disabled={isView} {...field} />)} />
                            <Controller name="ngoPanNo" control={control} render={({ field }) => (<FormInput label="NGO PAN No *" id="e_ngoPan" error={errors.ngoPanNo} disabled={isView} {...field} />)} />
                            <Controller name="ngoDarpanId" control={control} render={({ field }) => (<FormInput label="NGO Darpan ID *" id="e_ngoDarpan" error={errors.ngoDarpanId} disabled={isView} {...field} />)} />
                            <Controller name="ngoEmail" control={control} render={({ field }) => (<FormInput label="NGO Email *" id="e_ngoEmail" type="email" error={errors.ngoEmail} disabled={isView} {...field} />)} />
                            <Controller name="ngoMobile" control={control} render={({ field }) => (<FormInput label="NGO Mobile *" id="e_ngoMobile" type="tel" error={errors.ngoMobile} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Address Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="ngoRegAddress" control={control} render={({ field }) => (<FormInput label="NGO Register Address *" id="e_ngoRegAdd" error={errors.ngoRegAddress} disabled={isView} {...field} />)} />
                            <Controller name="ngoWorkingAddress" control={control} render={({ field }) => (<FormInput label="NGO Working Address *" id="e_ngoWorkAdd" error={errors.ngoWorkingAddress} disabled={isView} {...field} />)} />
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>State *</label>
                                <Controller name="state" control={control} render={({ field }) => (<Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} isDisabled={isView} menuPortalTarget={document.body} />)} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>District *</label>
                                <Controller name="district" control={control} render={({ field }) => (<Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} isDisabled={isView || !selectedState} menuPortalTarget={document.body} />)} />
                            </div>
                            <Controller name="blockName" control={control} render={({ field }) => (<FormInput label="Block Name *" id="e_block" error={errors.blockName} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Secretary Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="sdpName" control={control} render={({ field }) => (<FormInput label="Secretary Name *" id="e_sdpName" error={errors.sdpName} disabled={isView} {...field} />)} />
                            <Controller name="secretaryEmail" control={control} render={({ field }) => (<FormInput label="Secretary Email *" id="e_secEmail" type="email" error={errors.secretaryEmail} disabled={isView} {...field} />)} />
                            <Controller name="secretaryMobile" control={control} render={({ field }) => (<FormInput label="Secretary Mobile *" id="e_secMobile" type="tel" error={errors.secretaryMobile} disabled={isView} {...field} />)} />
                            <Controller name="secretaryAadhar" control={control} render={({ field }) => (<FormInput label="Secretary Aadhaar *" id="e_secAadhar" error={errors.secretaryAadhar} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Banking & Account Setup</h6>
                        <div style={styles.formGrid}>
                            <Controller name="bankName" control={control} render={({ field }) => (<FormInput label="Bank Name *" id="e_bank" error={errors.bankName} disabled={isView} {...field} />)} />
                            <Controller name="accountNo" control={control} render={({ field }) => (<FormInput label="Account Number *" id="e_acct" error={errors.accountNo} disabled={isView} {...field} />)} />
                            <Controller name="ifsCode" control={control} render={({ field }) => (<FormInput label="IFS Code *" id="e_ifs" error={errors.ifsCode} disabled={isView} {...field} />)} />
                            <Controller name="bankAddress" control={control} render={({ field }) => (<FormInput label="Bank Address *" id="e_bankAdd" error={errors.bankAddress} disabled={isView} {...field} />)} />
                            <Controller name="userName" control={control} render={({ field }) => (<FormInput label="User Name *" id="e_user" error={errors.userName} disabled={isView} {...field} />)} />
                            <Controller name="password" control={control} render={({ field }) => (<FormInput label="Password *" id="e_pass" type={isView ? "password" : "text"} error={errors.password} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Documents</h6>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Reg Cert PDF</label>
                                {isView ? <p style={styles.hintText}>{regCertPdf ? "✅ Document Uploaded" : "❌ Missing"}</p> : <input type="file" accept="application/pdf" onChange={(e) => handlePdfUpload(e, setRegCertPdf)} style={styles.input(false)} />}
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>NGO PAN PDF</label>
                                {isView ? <p style={styles.hintText}>{panPdf ? "✅ Document Uploaded" : "❌ Missing"}</p> : <input type="file" accept="application/pdf" onChange={(e) => handlePdfUpload(e, setPanPdf)} style={styles.input(false)} />}
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Darpan PDF</label>
                                {isView ? <p style={styles.hintText}>{darpanPdf ? "✅ Document Uploaded" : "❌ Missing"}</p> : <input type="file" accept="application/pdf" onChange={(e) => handlePdfUpload(e, setDarpanPdf)} style={styles.input(false)} />}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '10px' }}>
                            <button type="button" style={styles.btnOutline} onClick={onClose}>{isView ? 'Close' : 'Cancel'}</button>
                            {!isView && <button type="submit" style={styles.btnPrimary}>Save Changes</button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 6. DISTRICT ADMIN TABLE
// ==========================================
const DistrictAdminTable = ({ refreshTrigger }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/districtadmin`);
            if (!res.ok) throw new Error("Failed to fetch data");
            let data = await res.json();

            // SOFT DELETE FILTER: Only show active records
            data = data.filter(member => String(member.IsActive) !== '0');

            setMembers(data);
        } catch (error) { toast.error("Failed to load table data."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, [refreshTrigger]);

    const openModal = (type, member) => {
        setSelectedRow({ ...member });
        if (type === 'view') setViewModal(true);
        if (type === 'edit') setEditModal(true);
    };

    const closeModal = () => { setViewModal(false); setEditModal(false); setSelectedRow(null); };

    const renderTh = (label, isLeft = false, isRight = false) => (
        <th style={isLeft ? styles.stickyLeftTh : isRight ? styles.stickyRightTh : styles.th}>{label}</th>
    );

    return (
        <div style={{ ...styles.card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px' }}>
                <h5 style={styles.cardHeader}>District Administrators:-</h5>
                <button onClick={fetchMembers} style={styles.btnOutline}>Refresh Data</button>
            </div>
            <div style={styles.cardBody}>
                {loading ? <p>Loading data...</p> : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {renderTh('ID', true, false)}
                                    {renderTh('NGO Name')}
                                    {renderTh('Reg Date')}
                                    {renderTh('Reg No')}
                                    {renderTh('PAN No')}
                                    {renderTh('Darpan ID')}
                                    {renderTh('NGO Email')}
                                    {renderTh('NGO Mobile')}
                                    {renderTh('Reg Address')}
                                    {renderTh('Work Address')}
                                    {renderTh('State')}
                                    {renderTh('District')}
                                    {renderTh('Block')}
                                    {renderTh('Secretary Name')}
                                    {renderTh('Sec Email')}
                                    {renderTh('Sec Mobile')}
                                    {renderTh('Sec Aadhar')}
                                    {renderTh('Bank Name')}
                                    {renderTh('Account No')}
                                    {renderTh('IFS Code')}
                                    {renderTh('Bank Address')}
                                    {renderTh('User Name')}
                                    {renderTh('Status')}
                                    {renderTh('Created By')}
                                    {renderTh('Actions', false, true)}
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((row) => (
                                    <tr key={row.DistNGORegId}>
                                        <td style={styles.stickyLeftTd}>#{row.DistNGORegId}</td>
                                        <td style={styles.td}>{row.DistNGOName}</td>
                                        <td style={styles.td}>{row.DistNGORegDate ? row.DistNGORegDate.substring(0, 10) : ''}</td>
                                        <td style={styles.td}>{row.DistNGORegNo}</td>
                                        <td style={styles.td}>{row.DistNGOPanNo}</td>
                                        <td style={styles.td}>{row.DistNGODarpanId}</td>
                                        <td style={styles.td}>{row.DistNGOMailId}</td>
                                        <td style={styles.td}>{row.DistNGOPhoneNo}</td>
                                        <td style={styles.td}>{row.DistNGORegAddress}</td>
                                        <td style={styles.td}>{row.DistNGOWorkingAddress}</td>
                                        <td style={styles.td}>{row.DistNGOStateName}</td>
                                        <td style={styles.td}>{row.DistNGODistName}</td>
                                        <td style={styles.td}>{row.BlockName}</td>
                                        <td style={styles.td}>{row.DistNGOSDPName}</td>
                                        <td style={styles.td}>{row.DistNGOSDPMailId}</td>
                                        <td style={styles.td}>{row.DistNGOSDPPhoneNo}</td>
                                        <td style={styles.td}>{row.DistNGOSDPAadhaarNo}</td>
                                        <td style={styles.td}>{row.DistNGOBankName}</td>
                                        <td style={styles.td}>{row.DistNGOAcctNo}</td>
                                        <td style={styles.td}>{row.DistNGOIFSCode}</td>
                                        <td style={styles.td}>{row.DistNGOBankAdd}</td>
                                        <td style={styles.td}>{row.DistNGOUserName}</td>
                                        <td style={{ ...styles.td, color: Number(row.IsActive) === 2 ? 'green' : 'orange', fontWeight: 'bold' }}>{Number(row.IsActive) === 2 ? 'Approved' : 'Pending'}</td>
                                        <td style={styles.td}>{row.CreatedBy || '-'}</td>
                                        <td style={styles.stickyRightTd}>
                                            <button onClick={() => openModal('view', row)} style={styles.actionBtn}>👁️</button>
                                            <button onClick={() => openModal('edit', row)} style={styles.actionBtn}>✏️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewModal && selectedRow && <DistrictAdminModal member={selectedRow} mode="view" onClose={closeModal} onSuccess={closeModal} />}
            {editModal && selectedRow && <DistrictAdminModal member={selectedRow} mode="edit" onClose={closeModal} onSuccess={() => { closeModal(); fetchMembers(); }} />}

        </div>
    );
};

// ==========================================
// 7. ORCHESTRATOR COMPONENT
// ==========================================
const AccountTab = () => {
    const [appUserRole, setAppUserRole] = useState(null); // Initialize as null for loading state
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [adminActiveView, setAdminActiveView] = useState('District Administrator');

    useEffect(() => {
        const user = getSafeUser();
        if (user) {
            setAppUserRole(user.role || '');
        } else {
            setAppUserRole(''); // Handle no user gracefully
        }
    }, []);

    const handleFormSuccess = () => setRefreshTrigger(prev => prev + 1);

    // Prevent rendering until local storage has been checked
    if (appUserRole === null) {
        return <div style={{ padding: '24px', color: '#697a8d' }}>Loading Interface...</div>;
    }

    // Options for the Admin Dropdown
    const adminOptions = [
        { value: 'District Administrator', label: 'District Administrator' },
        { value: 'Supervisor', label: 'Supervisor' },
        { value: 'Astha Maa', label: 'Astha Maa' }, // Added Astha Maa here
        { value: 'Astha Didi', label: 'Astha Didi' }
    ];

    // Determine which view to render
    const currentView = (appUserRole === 'District Administrator' || appUserRole === 'State Super Administrator' || appUserRole.toLowerCase() === 'developer')
        ? adminActiveView
        : appUserRole;

    return (
        <>
            <ToastContainer autoClose={3000} pauseOnHover={false} />

            {/* ONLY show this dropdown if the user is a Dist Admin, State Super Admin, or Developer */}
            {(appUserRole === 'District Administrator' || appUserRole === 'State Super Administrator' || appUserRole.toLowerCase() === 'developer') && (
                <div style={{ ...styles.card, padding: '24px', marginBottom: '24px', overflow: 'visible' }}>
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>
                            Select Role Entry / View <span style={{ color: '#ff3e1d' }}>*</span>
                        </label>
                        <Select
                            options={adminOptions}
                            value={adminOptions.find(o => o.value === adminActiveView)}
                            onChange={(selected) => setAdminActiveView(selected.value)}
                            styles={{
                                ...styles.selectStyles(false),
                                menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                            menuPortalTarget={document.body}
                            isSearchable={false}
                        />
                    </div>
                </div>
            )}

            {/* Render the specific Form and Table based on currentView */}
            {currentView === 'District Administrator' || currentView === 'State Super Administrator' ? (
                <>
                    <DistrictAdminForm onSuccess={handleFormSuccess} />
                    <DistrictAdminTable refreshTrigger={refreshTrigger} />
                </>
            ) : currentView === 'Supervisor' ? (
                <>
                    <SupervisorForm onSuccess={handleFormSuccess} />
                    <SupervisorTable refreshTrigger={refreshTrigger} />
                </>
            ) : currentView === 'Astha Maa' ? (
                <>
                    <AsthaMaaForm onSuccess={handleFormSuccess} />
                    <AsthaMaaTable refreshTrigger={refreshTrigger} />
                </>
            ) : (
                <>
                    <AsthaDidiForm onSuccess={handleFormSuccess} />
                    <MembersTable refreshTrigger={refreshTrigger} />
                </>
            )}
        </>
    );
};

export default AccountTab;