import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import { toast } from 'react-toastify';

import { API_BASE_URL, DUMMY_AVATAR, extractBase64, styles, FormInput } from '../config/constants';
import { asthaMaaSchema as supervisorSchema } from './forms/SupervisorForm';
import { getSafeUser, PasswordInput } from './AccountSharedUtils';

// ✅ Safe Date Formatter
const formatDisplayDate = (dbDateStr) => {
    if (!dbDateStr) return '-';
    return String(dbDateStr).substring(0, 10);
};

const SupervisorModal = ({ member, mode, onClose, onSuccess }) => {
    const isView = mode === 'view';
    const cleanInitialImage = extractBase64(member.SupProfileImage) || DUMMY_AVATAR;
    const [profileImage, setProfileImage] = useState(cleanInitialImage);
    const fileInputRef = useRef(null);
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(supervisorSchema),
        mode: 'onChange',
        defaultValues: {
            joiningAmount: String(member.SupJoiningAmt || '5000'),
            walletBalance: String(member.SupWalletBalance || '0'),
            fullName: member.SupName || '',
            sdwOf: member.SupGuardianName || '',
            dob: member.SupDOB ? String(member.SupDOB).substring(0, 10) : '',
            guardianContactNo: member.SupGuardianContactNo || '',
            state: null, district: null, city: member.SupCity || '', block: member.SupBlockName || '',
            postOffice: member.SupPO || '', policeStation: member.SupPS || '', gramPanchayet: member.SupGramPanchayet || '',
            village: member.SupVillage || '', pinCode: String(member.SupPincode || ''), mobileNo: member.SupContactNo || '',
            email: member.SupSignupEmail || member.SupMailId || '',
            userName: member.SupSignupUserName || member.SupName || '',
            password: member.SupSignupPassword || '',
            bankName: member.SupBankName || '', branchName: member.SupBranchName || '',
            accountNo: member.SupAcctNo || '', ifsCode: member.SupIFSCode || '', panNo: member.SupPanNo || '',
            aadharNo: member.SupAadharNo || ''
        }
    });

    const selectedState = watch("state");
    const fullNameValue = watch("fullName");

    useEffect(() => {
        if (!isView) {
            setValue("userName", fullNameValue || "", { shouldValidate: true });
        }
    }, [fullNameValue, setValue, isView]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => {
            const formattedStates = data.map(s => ({ value: s.StateId, label: s.StateName }));
            setDbStates(formattedStates);
            if (member.SupStateName) {
                const matchedState = formattedStates.find(s => s.label === member.SupStateName);
                if (matchedState) setValue("state", matchedState);
            }
        });
    }, [member.SupStateName, setValue]);

    useEffect(() => {
        if (selectedState && selectedState.value) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`).then(res => res.json()).then(data => {
                const formattedDistricts = data.map(d => ({ value: d.DistId, label: d.DistName }));
                setDbDistricts(formattedDistricts);
                if (member.SupDistName) {
                    const matchedDist = formattedDistricts.find(d => d.label === member.SupDistName);
                    if (matchedDist) setValue("district", matchedDist);
                }
            });
        } else { setDbDistricts([]); }
    }, [selectedState, member.SupDistName, setValue]);

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

        const dbPayload = {
            ...member,
            SupProfileImage: profileImage === DUMMY_AVATAR ? null : profileImage,
            SupName: data.fullName,
            SupGuardianName: data.sdwOf || "",
            SupDOB: data.dob,
            SupGuardianContactNo: data.guardianContactNo || "",
            SupStateName: stateName,
            SupDistName: districtName,
            SupCity: data.city || "",
            SupBlockName: data.block || "",
            SupPO: data.postOffice || "",
            SupPS: data.policeStation || "",
            SupGramPanchayet: data.gramPanchayet || "",
            SupVillage: data.village || "",
            SupPincode: parseInt(data.pinCode),
            SupContactNo: data.mobileNo,
            SupMailId: data.email,
            SupSignupUserName: data.userName,
            SupSignupEmail: data.email,
            SupSignupPassword: data.password,
            SupBankName: data.bankName || "",
            SupBranchName: data.branchName || "",
            SupAcctNo: data.accountNo || "0",
            SupIFSCode: data.ifsCode || "",
            SupPanNo: data.panNo || "",
            SupAadharNo: data.aadharNo,
            SupJoiningAmt: parseInt(data.joiningAmount) || 5000,
            SupWalletBalance: parseInt(data.walletBalance) || 0,
        };

        if (dbPayload.SupDOB) dbPayload.SupDOB = String(dbPayload.SupDOB).substring(0, 10);

        try {
            toast.loading("Updating supervisor...", { toastId: 'updateSup' });
            const res = await fetch(`${API_BASE_URL}/supervisor/${member.SupRegId}`, {
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
                    <div style={styles.profileSection}>
                        <img src={profileImage} alt="Profile Avatar" style={styles.avatar} />
                        <div>
                            <p style={styles.hintText}><strong>Status:</strong> {Number(member.SupIsActive) === 2 ? 'Approved' : 'Pending'}</p>
                            {Number(member.SupIsActive) === 2 && member.SupAprovedBy && (
                                <>
                                    <p style={styles.hintText}><strong>Approved By:</strong> {member.ApproverDisplayName || member.SupAprovedBy}</p>
                                    <p style={styles.hintText}><strong>Approval Date:</strong> {formatDisplayDate(member.SupAprovedDate)}</p>
                                    <p style={styles.hintText}><strong>Approval ID:</strong> {member.SupRegNo || '-'}</p>
                                </>
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

                        <h6 style={styles.sectionHeader}>Supervisor Information</h6>
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
                        </div>

                        <h6 style={styles.sectionHeader}>Login & Account Setup</h6>
                        <div style={styles.formGrid}>
                            <Controller name="userName" control={control} render={({ field }) => (<FormInput label="User Name *" id="edit_userName" error={errors.userName} readOnly disabled={true} {...field} />)} />
                            <Controller name="email" control={control} render={({ field }) => (<FormInput label="Email ID (For Login) *" id="edit_email" error={errors.email} disabled readOnly {...field} />)} />
                            <Controller name="password" control={control} render={({ field }) => (<PasswordInput label="Set New Password *" id="edit_password" error={errors.password} disabled={isView} {...field} />)} />
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

const SupervisorTable = ({ refreshTrigger }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState(''); 
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState(null);
    
    // Search State added
    const [globalSearch, setGlobalSearch] = useState('');

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    
    const [approvalData, setApprovalData] = useState({ id: '', dbDate: '' });

    useEffect(() => {
        const user = getSafeUser();
        if (user) { 
            setUserRole(user.role || ''); 
            setUserName(user.username || ''); 
            setUserId(user.UserSignUpId || user.id || '');
        }
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/supervisor`);
            if (!res.ok) throw new Error("Failed to fetch table data");
            let data = await res.json();

            data = data.filter(member => String(member.SupIsActive) !== '0');
            setMembers(data);
        } catch (error) { toast.error("Failed to load supervisor data.", { position: "top-right" }); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, [refreshTrigger]);

    // Live search filter logic added
    const filteredMembers = useMemo(() => {
        if (!globalSearch) return members;
        const searchLower = globalSearch.toLowerCase();
        return members.filter((member) =>
            Object.values(member).some(
                val => val && String(val).toLowerCase().includes(searchLower)
            )
        );
    }, [members, globalSearch]);

    // Ensure sorted members applies AFTER filtering
    const sortedMembers = useMemo(() => {
        let sortableItems = [...filteredMembers];
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
    }, [filteredMembers, sortConfig]);

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

    // ✅ Advanced Modal opening logic to construct the 16-digit ID dynamically
    const openModal = async (type, member) => {
        setSelectedRow({ ...member });
        if (type === 'view') setViewModal(true);
        if (type === 'edit') setEditModal(true);
        if (type === 'delete') setDeleteModal(true);
        if (type === 'approve') {
            setApproveModal(true);
            setApprovalData({ id: 'Generating...', dbDate: '' });

            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            const istDate = new Date(utc + (3600000 * 5.5)); 
            const dbDate = istDate.toISOString().split('T')[0];

            let stateId = '00';
            let distId = '00';

            try {
                const stateRes = await fetch(`${API_BASE_URL}/states`);
                const states = await stateRes.json();
                const stateObj = states.find(s => s.StateName === member.SupStateName);

                if (stateObj) {
                    stateId = String(stateObj.StateId).padStart(2, '0');
                    const distRes = await fetch(`${API_BASE_URL}/districts/${stateObj.StateId}`);
                    const dists = await distRes.json();
                    const distObj = dists.find(d => d.DistName === member.SupDistName);

                    if (distObj) {
                        distId = String(distObj.DistId).padStart(2, '0');
                    }
                }
            } catch (e) {
                console.error("Error fetching state/dist IDs for approval generation:", e);
            }

            const aadhar = member.SupAadharNo || '000000000000';
            const finalApprovalId = `${stateId}${distId}${aadhar}`;

            setApprovalData({ id: finalApprovalId, dbDate });
        }
    };

    const closeModal = () => { setViewModal(false); setEditModal(false); setDeleteModal(false); setApproveModal(false); setSelectedRow(null); };

    const confirmDelete = async () => {
        try {
            toast.loading("Deleting...", { toastId: 'deleteSup' });

            const payload = { ...selectedRow, SupIsActive: "0" };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/supervisor/${selectedRow.SupRegId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });

            toast.dismiss('deleteSup');
            if (res.ok) { toast.success("Member deleted."); setMembers(prev => prev.filter(m => m.SupRegId !== selectedRow.SupRegId)); closeModal(); }
            else { toast.error("Failed to delete."); }
        } catch (error) { toast.dismiss('deleteSup'); toast.error("Network error."); }
    };

    const confirmApprove = async () => {
        try {
            toast.loading("Approving...", { toastId: 'approveSup' });

            // ✅ PERFECT FIX: Sends the full 16-digit `approvalData.id` correctly!
            const payload = { 
                ...selectedRow, 
                SupIsActive: 2, 
                SupRegNo: approvalData.id, 
                SupAprovedDate: approvalData.dbDate, 
                SupAprovedBy: String(userId) 
            };

            Object.keys(payload).forEach(key => {
                if (key !== 'SupAprovedDate' && typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/supervisor/${selectedRow.SupRegId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            toast.dismiss('approveSup');
            if (res.ok) { toast.success(`Member Approved! ID: ${approvalData.id}`); closeModal(); fetchMembers(); }
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
                {/* Real-time search input bar */}
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <input 
                            type="text" 
                            placeholder="🔍 Search entire table..." 
                            value={globalSearch} 
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            style={{ ...styles.input(false), flex: 1, padding: '8px 12px' }}
                        />
                        {/* <button>Filter</button> - Commented out filter button as requested */}
                    </div>
                </div>

                {loading ? <p>Loading data...</p> : (
                    <>
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        {renderTh('Profile', 'SupProfileImage', true)}
                                        {renderTh('Full Name', 'SupName')}
                                        {renderTh('S/D/W Of', 'SupGuardianName')}
                                        {renderTh('DOB', 'SupDOB')}
                                        {renderTh('Guardian Contact', 'SupGuardianContactNo')} 
                                        {renderTh('Mobile No', 'SupContactNo')}
                                        {renderTh('Email ID', 'SupSignupEmail')}
                                        {renderTh('User Name', 'SupSignupUserName')}
                                        {renderTh('Password', 'SupSignupPassword')}
                                        {renderTh('State', 'SupStateName')}
                                        {renderTh('District', 'SupDistName')}
                                        {renderTh('City', 'SupCity')}
                                        {renderTh('Block', 'SupBlockName')}
                                        {renderTh('Post Office', 'SupPO')}
                                        {renderTh('Police Station', 'SupPS')}
                                        {renderTh('Gram Panchayet', 'SupGramPanchayet')}
                                        {renderTh('Village', 'SupVillage')}
                                        {renderTh('Pin Code', 'SupPincode')}
                                        {renderTh('Bank Name', 'SupBankName')}
                                        {renderTh('Branch Name', 'SupBranchName')}
                                        {renderTh('Account No', 'SupAcctNo')}
                                        {renderTh('IFS Code', 'SupIFSCode')}
                                        {renderTh('PAN No', 'SupPanNo')}
                                        {renderTh('Aadhar No', 'SupAadharNo')}
                                        {renderTh('Joining Amt', 'SupJoiningAmt')}
                                        {renderTh('Wallet Bal', 'SupWalletBalance')}
                                        {renderTh('Status', 'SupIsActive')}
                                        {renderTh('Approved By', 'ApproverDisplayName')}
                                        {renderTh('Approval Date', 'SupAprovedDate')}
                                        {renderTh('Approval Reg No', 'SupRegNo')}
                                        <th style={styles.stickyRightTh}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMembers.map((row) => (
                                        <tr key={row.SupRegId}>
                                            <td style={styles.stickyLeftTd}>
                                                <img src={extractBase64(row.SupProfileImage) || DUMMY_AVATAR} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            </td>
                                            <td style={styles.td}>{row.SupName}</td>
                                            <td style={styles.td}>{row.SupGuardianName}</td>
                                            <td style={styles.td}>{formatDisplayDate(row.SupDOB)}</td>
                                            <td style={styles.td}>{row.SupGuardianContactNo}</td> 
                                            <td style={styles.td}>{row.SupContactNo}</td>
                                            <td style={styles.td}>{row.SupSignupEmail || row.SupMailId || '-'}</td>
                                            <td style={styles.td}>{row.SupSignupUserName || '-'}</td>
                                            <td style={styles.td}>{row.SupSignupPassword || '-'}</td>
                                            <td style={styles.td}>{row.SupStateName}</td>
                                            <td style={styles.td}>{row.SupDistName}</td>
                                            <td style={styles.td}>{row.SupCity}</td>
                                            <td style={styles.td}>{row.SupBlockName}</td>
                                            <td style={styles.td}>{row.SupPO}</td>
                                            <td style={styles.td}>{row.SupPS}</td>
                                            <td style={styles.td}>{row.SupGramPanchayet}</td>
                                            <td style={styles.td}>{row.SupVillage}</td>
                                            <td style={styles.td}>{row.SupPincode}</td>
                                            <td style={styles.td}>{row.SupBankName}</td>
                                            <td style={styles.td}>{row.SupBranchName}</td>
                                            <td style={styles.td}>{row.SupAcctNo}</td>
                                            <td style={styles.td}>{row.SupIFSCode}</td>
                                            <td style={styles.td}>{row.SupPanNo}</td>
                                            <td style={styles.td}>{row.SupAadharNo}</td>
                                            <td style={styles.td}>₹{row.SupJoiningAmt}</td>
                                            <td style={styles.td}>₹{row.SupWalletBalance}</td>
                                            <td style={{ ...styles.td, color: Number(row.SupIsActive) === 2 ? 'green' : 'orange', fontWeight: 'bold' }}>{Number(row.SupIsActive) === 2 ? 'Approved' : 'Pending'}</td>
                                            <td style={styles.td}>{row.ApproverDisplayName || row.SupAprovedBy || '-'}</td>
                                            <td style={styles.td}>{formatDisplayDate(row.SupAprovedDate)}</td>
                                            <td style={styles.td}>{row.SupRegNo || '-'}</td>
                                            <td style={styles.stickyRightTd}>
                                                <button onClick={() => openModal('view', row)} style={styles.actionBtn}>👁️</button>
                                                <button onClick={() => openModal('edit', row)} style={styles.actionBtn}>✏️</button>
                                                <button onClick={() => openModal('delete', row)} style={styles.actionBtn}>🗑️</button>
                                                {Number(row.SupIsActive) !== 2 && (
                                                    <button onClick={() => openModal('approve', row)} style={styles.actionBtn}>✅</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {currentMembers.length === 0 && <tr><td colSpan="31" style={{ ...styles.td, textAlign: 'center' }}>No members found in database.</td></tr>}
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
                        <p>Delete <strong>{selectedRow.SupName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmDelete} style={styles.btnDanger}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
            
            {approveModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '450px', textAlign: 'center' }}>
                        <h4 style={{ color: '#71dd37', marginBottom: '16px' }}>Approve Supervisor</h4>

                        <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#566a7f', lineHeight: '1.6' }}>
                            <p style={{ margin: '6px 0' }}><strong>Candidate Name:</strong> {selectedRow.SupName}</p>
                            <p style={{ margin: '6px 0' }}><strong>Approval ID:</strong> <span style={{ color: '#696cff', fontWeight: 'bold' }}>{approvalData.id}</span></p>
                            <p style={{ margin: '6px 0' }}><strong>Approval Date:</strong> {approvalData.dbDate || 'Loading...'}</p>
                            <p style={{ margin: '6px 0' }}><strong>Authorized Approver:</strong> {userName}</p>
                        </div>

                        <p style={{ marginBottom: '20px', color: '#697a8d' }}>Do you want to confirm this approval and store this data?</p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmApprove} style={styles.btnSuccess} disabled={approvalData.id === 'Generating...'}>Confirm Approval</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorTable;