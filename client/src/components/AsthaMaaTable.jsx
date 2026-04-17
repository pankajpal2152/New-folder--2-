import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import { toast } from 'react-toastify';

import { API_BASE_URL, DUMMY_AVATAR, extractBase64, styles, FormInput } from '../config/constants';
import { asthaMaaSchema } from './forms/AsthaMaaForm';
import { getSafeUser } from './AccountSharedUtils';

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
                            <Controller name="email" control={control} render={({ field }) => (<FormInput label="Email ID *" id="edit_email" error={errors.email} disabled readOnly {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Banking & Payment Details</h6>
                        <div style={styles.formGrid}>
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

            data = data.filter(member => String(member.IsActive) !== '0' && String(member.Status) !== '0');

            const user = getSafeUser();
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
                                        {renderTh('Profile', 'ProfileImage', true)}
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
                                            <td style={styles.stickyLeftTd}>
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
                                    {currentMembers.length === 0 && <tr><td colSpan="28" style={{ ...styles.td, textAlign: 'center' }}>No members found in database.</td></tr>}
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

export default AsthaMaaTable;