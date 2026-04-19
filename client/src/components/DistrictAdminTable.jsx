import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import { toast } from 'react-toastify';

import { API_BASE_URL, styles, FormInput, fileToBase64 } from '../config/constants';
import { ngoSchema } from './forms/DistrictAdminForm';
import { getSafeUser, PasswordInput } from './AccountSharedUtils';

const formatDisplayDate = (dbDateStr) => {
    if (!dbDateStr) return '-';
    return String(dbDateStr).substring(0, 10);
};

const handleViewPdf = (base64String) => {
    if (!base64String) return;
    const pdfData = base64String.startsWith('data:application/pdf;base64,')
        ? base64String
        : `data:application/pdf;base64,${base64String}`;
    const pdfWindow = window.open("");
    if (pdfWindow) {
        pdfWindow.document.write(`<iframe width='100%' height='100%' style='border:none; margin:0; padding:0;' src='${pdfData}'></iframe>`);
    } else {
        toast.error("Pop-up blocked! Please allow pop-ups for this site to view documents.");
    }
};

const DistrictAdminModal = ({ member, mode, onClose, onSuccess }) => {
    const isView = mode === 'view';
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);

    const [regCertPdf, setRegCertPdf] = useState(member.DistNGORecCertificate || null);
    const [panPdf, setPanPdf] = useState(member.DistNGOPanPic || null);
    const [darpanPdf, setDarpanPdf] = useState(member.DistNGODarpanPic || null);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(ngoSchema),
        mode: 'onChange',
        defaultValues: {
            ngoName: member.DistNGOName || '',
            ngoRegistrationDate: member.DistNGORegDate ? String(member.DistNGORegDate).substring(0, 10) : '',
            ngoRegistrationNo: member.DistNGORegNo || '',
            ngoPanNo: member.DistNGOPanNo || '',
            ngoDarpanId: member.DistNGODarpanId || '',
            generalNgoEmail: member.DistNGOMailId || '',
            ngoMobile: member.DistNGOPhoneNo || '',
            ngoRegAddress: member.DistNGORegAddress || '',
            ngoWorkingAddress: member.DistNGOWorkingAddress || '',
            state: null, district: null,
            blockName: member.DistNGOBlockName || '',
            sdpName: member.DistNGOSDPName || '',
            secretaryEmail: member.DistNGOSDPMailId || '',
            secretaryMobile: member.DistNGOSDPPhoneNo || '',
            secretaryAadhar: member.DistNGOSDPAadhaarNo || '',
            bankName: member.DistNGOBankName || '',
            accountNo: member.DistNGOAcctNo || '',
            ifsCode: member.DistNGOIFSCode || '',
            bankAddress: member.DistNGOBankAdd || '',
            userName: member.DistNGOSignupUserName || member.DistNGOName || '',
            password: member.DistNGOSignupPassword || '',
            ngoEmail: member.DistNGOSignupEmail || member.DistNGOMailId || ''
        }
    });

    const selectedState = watch("state");
    const ngoNameValue = watch("ngoName");

    // Automatically syncs User Name to Full Name in the edit modal as well
    useEffect(() => {
        if (!isView) {
            setValue("userName", ngoNameValue || "", { shouldValidate: true });
        }
    }, [ngoNameValue, setValue, isView]);

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

        const dbPayload = {
            ...member,
            DistNGOName: data.ngoName,
            DistNGORegDate: data.ngoRegistrationDate,
            DistNGORegNo: data.ngoRegistrationNo,
            DistNGOPanNo: data.ngoPanNo,
            DistNGODarpanId: data.ngoDarpanId,
            DistNGOMailId: data.generalNgoEmail,
            DistNGOPhoneNo: data.ngoMobile,
            DistNGORegAddress: data.ngoRegAddress,
            DistNGOWorkingAddress: data.ngoWorkingAddress,
            DistNGOStateName: data.state ? data.state.label : "",
            DistNGODistName: data.district ? data.district.label : "",
            DistNGOBlockName: data.blockName,
            DistNGOSDPName: data.sdpName,
            DistNGOSDPMailId: data.secretaryEmail,
            DistNGOSDPPhoneNo: data.secretaryMobile,
            DistNGOSDPAadhaarNo: data.secretaryAadhar,
            DistNGOBankName: data.bankName,
            DistNGOAcctNo: data.accountNo,
            DistNGOIFSCode: data.ifsCode,
            DistNGOBankAdd: data.bankAddress,
            DistNGOSignupUserName: data.userName,
            DistNGOSignupEmail: data.ngoEmail,
            DistNGOSignupPassword: data.password,
            DistNGORecCertificate: regCertPdf,
            DistNGOPanPic: panPdf,
            DistNGODarpanPic: darpanPdf,
        };

        if (dbPayload.DistNGORegDate) dbPayload.DistNGORegDate = String(dbPayload.DistNGORegDate).substring(0, 10);

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
                    <div style={styles.profileSection}>
                        <div>
                            <p style={styles.hintText}><strong>Status:</strong> {Number(member.DistNGOIsActive) === 2 ? 'Approved' : 'Pending'}</p>
                            {Number(member.DistNGOIsActive) === 2 && member.DistNGOAprovedBy && (
                                <>
                                    <p style={styles.hintText}><strong>Approved By:</strong> {member.ApproverDisplayName || member.DistNGOAprovedBy}</p>
                                    <p style={styles.hintText}><strong>Approval Date:</strong> {formatDisplayDate(member.DistNGOAprovedDate)}</p>
                                    <p style={styles.hintText}><strong>Approval ID:</strong> {member.DistNGOGenRegNo || '-'}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit, () => !isView && toast.error("Check errors!"))}>

                        <h6 style={styles.sectionHeader}>NGO Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="ngoName" control={control} render={({ field }) => (<FormInput label="NGO Full Name *" id="e_ngoName" error={errors.ngoName} disabled={isView} {...field} />)} />
                            <Controller name="ngoRegistrationDate" control={control} render={({ field }) => (<FormInput label="Date of Registration *" id="e_ngoRegDate" type="date" error={errors.ngoRegistrationDate} disabled={isView} {...field} />)} />
                            <Controller name="ngoRegistrationNo" control={control} render={({ field }) => (<FormInput label="Registration No *" id="e_ngoRegNo" error={errors.ngoRegistrationNo} disabled={isView} {...field} />)} />
                            <Controller name="ngoPanNo" control={control} render={({ field }) => (<FormInput label="NGO PAN No *" id="e_ngoPan" error={errors.ngoPanNo} disabled={isView} {...field} />)} />
                            <Controller name="ngoDarpanId" control={control} render={({ field }) => (<FormInput label="NGO Darpan ID *" id="e_ngoDarpan" error={errors.ngoDarpanId} disabled={isView} {...field} />)} />
                            <Controller name="generalNgoEmail" control={control} render={({ field }) => (<FormInput label="NGO General Email *" id="e_generalNgoEmail" type="email" error={errors.generalNgoEmail} disabled={isView} {...field} />)} />
                            <Controller name="ngoMobile" control={control} render={({ field }) => (<FormInput label="NGO Mobile *" id="e_ngoMobile" type="tel" error={errors.ngoMobile} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Address Details</h6>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>State *</label>
                                <Controller name="state" control={control} render={({ field }) => (<Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} isDisabled={isView} menuPortalTarget={document.body} />)} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>District *</label>
                                <Controller name="district" control={control} render={({ field }) => (<Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} isDisabled={isView || !selectedState} menuPortalTarget={document.body} />)} />
                            </div>
                            <Controller name="blockName" control={control} render={({ field }) => (<FormInput label="Block Name *" id="e_block" error={errors.blockName} disabled={isView} {...field} />)} />

                            <Controller name="ngoRegAddress" control={control} render={({ field }) => (
                                <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                                    <label htmlFor="e_ngoRegAdd" style={styles.label}>NGO Register Address <span style={{ color: '#ff3e1d' }}>*</span></label>
                                    <textarea id="e_ngoRegAdd" disabled={isView} style={{ ...styles.input(!!errors.ngoRegAddress), resize: 'vertical', minHeight: '80px', backgroundColor: isView ? '#eceeef' : '#fff' }} {...field} />
                                    {errors.ngoRegAddress && <p style={styles.errorText}>{errors.ngoRegAddress.message}</p>}
                                </div>
                            )} />
                            <Controller name="ngoWorkingAddress" control={control} render={({ field }) => (
                                <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                                    <label htmlFor="e_ngoWorkAdd" style={styles.label}>NGO Working office full address <span style={{ color: '#ff3e1d' }}>*</span></label>
                                    <textarea id="e_ngoWorkAdd" disabled={isView} style={{ ...styles.input(!!errors.ngoWorkingAddress), resize: 'vertical', minHeight: '80px', backgroundColor: isView ? '#eceeef' : '#fff' }} {...field} />
                                    {errors.ngoWorkingAddress && <p style={styles.errorText}>{errors.ngoWorkingAddress.message}</p>}
                                </div>
                            )} />
                        </div>

                        <h6 style={styles.sectionHeader}>Secretary Details</h6>
                        <div style={styles.formGrid}>
                            <Controller name="sdpName" control={control} render={({ field }) => (<FormInput label="Secretary Name *" id="e_sdpName" error={errors.sdpName} disabled={isView} {...field} />)} />
                            <Controller name="secretaryEmail" control={control} render={({ field }) => (<FormInput label="Secretary Email *" id="e_secEmail" type="email" error={errors.secretaryEmail} disabled={isView} {...field} />)} />
                            <Controller name="secretaryMobile" control={control} render={({ field }) => (<FormInput label="Secretary Mobile *" id="e_secMobile" type="tel" error={errors.secretaryMobile} disabled={isView} {...field} />)} />
                            <Controller name="secretaryAadhar" control={control} render={({ field }) => (<FormInput label="Secretary Aadhaar *" id="e_secAadhar" error={errors.secretaryAadhar} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Login & Account Setup</h6>
                        <div style={styles.formGrid}>
                            <Controller name="userName" control={control} render={({ field }) => (<FormInput label="User Name *" id="e_user" error={errors.userName} readOnly disabled={true} {...field} />)} />
                            <Controller name="ngoEmail" control={control} render={({ field }) => (<FormInput label="Email ID (For Login) *" id="e_loginEmail" type="email" error={errors.ngoEmail} disabled readOnly {...field} />)} />
                            <Controller name="password" control={control} render={({ field }) => (<PasswordInput label={<>Set Password <span style={{ color: '#ff3e1d' }}>*</span></>} id="e_pass" error={errors.password} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Banking & Account Setup</h6>
                        <div style={styles.formGrid}>
                            <Controller name="bankName" control={control} render={({ field }) => (<FormInput label="Bank Name *" id="e_bank" error={errors.bankName} disabled={isView} {...field} />)} />
                            <Controller name="accountNo" control={control} render={({ field }) => (<FormInput label="Account Number *" id="e_acct" error={errors.accountNo} disabled={isView} {...field} />)} />
                            <Controller name="ifsCode" control={control} render={({ field }) => (<FormInput label="IFS Code *" id="e_ifs" error={errors.ifsCode} disabled={isView} {...field} />)} />
                            <Controller name="bankAddress" control={control} render={({ field }) => (<FormInput label="Bank Address *" id="e_bankAdd" error={errors.bankAddress} disabled={isView} {...field} />)} />
                        </div>

                        <h6 style={styles.sectionHeader}>Documents</h6>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Reg Cert PDF</label>
                                {!isView && <input type="file" accept="application/pdf" onChange={(e) => handlePdfUpload(e, setRegCertPdf)} style={styles.input(false)} />}
                                {regCertPdf ? (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                        <button type="button" onClick={() => handleViewPdf(regCertPdf)} style={{ ...styles.btnOutline, padding: '4px 8px', fontSize: '0.85rem' }}>👁️ View PDF</button>
                                        {!isView && <span style={{ ...styles.hintText, color: '#71dd37', marginLeft: '10px', marginBottom: 0 }}>✅ Ready</span>}
                                    </div>
                                ) : (
                                    <p style={styles.hintText}>❌ Missing</p>
                                )}
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>NGO PAN PDF</label>
                                {!isView && <input type="file" accept="application/pdf" onChange={(e) => handlePdfUpload(e, setPanPdf)} style={styles.input(false)} />}
                                {panPdf ? (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                        <button type="button" onClick={() => handleViewPdf(panPdf)} style={{ ...styles.btnOutline, padding: '4px 8px', fontSize: '0.85rem' }}>👁️ View PDF</button>
                                        {!isView && <span style={{ ...styles.hintText, color: '#71dd37', marginLeft: '10px', marginBottom: 0 }}>✅ Ready</span>}
                                    </div>
                                ) : (
                                    <p style={styles.hintText}>❌ Missing</p>
                                )}
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Darpan PDF</label>
                                {!isView && <input type="file" accept="application/pdf" onChange={(e) => handlePdfUpload(e, setDarpanPdf)} style={styles.input(false)} />}
                                {darpanPdf ? (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                        <button type="button" onClick={() => handleViewPdf(darpanPdf)} style={{ ...styles.btnOutline, padding: '4px 8px', fontSize: '0.85rem' }}>👁️ View PDF</button>
                                        {!isView && <span style={{ ...styles.hintText, color: '#71dd37', marginLeft: '10px', marginBottom: 0 }}>✅ Ready</span>}
                                    </div>
                                ) : (
                                    <p style={styles.hintText}>❌ Missing</p>
                                )}
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

const DistrictAdminTable = ({ refreshTrigger }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');

    // Search State added
    const [globalSearch, setGlobalSearch] = useState('');

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    // Tracks dynamic approval ID and Date
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
            const res = await fetch(`${API_BASE_URL}/districtadmin`);
            if (!res.ok) throw new Error("Failed to fetch data");
            let data = await res.json();

            data = data.filter(member => String(member.DistNGOIsActive) !== '0');
            setMembers(data);
        } catch (error) { toast.error("Failed to load table data."); }
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

    // ✅ Approval ID Logic using Secretary's Aadhar 
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
                const stateObj = states.find(s => s.StateName === member.DistNGOStateName);

                if (stateObj) {
                    stateId = String(stateObj.StateId).padStart(2, '0');
                    const distRes = await fetch(`${API_BASE_URL}/districts/${stateObj.StateId}`);
                    const dists = await distRes.json();
                    const distObj = dists.find(d => d.DistName === member.DistNGODistName);

                    if (distObj) {
                        distId = String(distObj.DistId).padStart(2, '0');
                    }
                }
            } catch (e) {
                console.error("Error fetching state/dist IDs for approval generation:", e);
            }

            const aadhar = member.DistNGOSDPAadhaarNo || '000000000000';
            const finalApprovalId = `${stateId}${distId}${aadhar}`;

            setApprovalData({ id: finalApprovalId, dbDate });
        }
    };

    const closeModal = () => { setViewModal(false); setEditModal(false); setDeleteModal(false); setApproveModal(false); setSelectedRow(null); };

    const confirmDelete = async () => {
        try {
            toast.loading("Deleting...", { toastId: 'deleteNgo' });

            const payload = { ...selectedRow, DistNGOIsActive: "0" };

            Object.keys(payload).forEach(key => {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/districtadmin/${selectedRow.DistNGORegId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });

            toast.dismiss('deleteNgo');
            if (res.ok) { toast.success("Record deleted."); setMembers(prev => prev.filter(m => m.DistNGORegId !== selectedRow.DistNGORegId)); closeModal(); }
            else { toast.error("Failed to delete."); }
        } catch (error) { toast.dismiss('deleteNgo'); toast.error("Network error."); }
    };

    const confirmApprove = async () => {
        try {
            toast.loading("Approving...", { toastId: 'approveNgo' });

            // ✅ Map directly to the new 16 digit ID column
            const payload = {
                ...selectedRow,
                DistNGOIsActive: 2,
                DistNGOGenRegNo: approvalData.id,
                DistNGOAprovedDate: approvalData.dbDate,
                DistNGOAprovedBy: String(userId)
            };

            Object.keys(payload).forEach(key => {
                if (key !== 'DistNGOAprovedDate' && typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
                    payload[key] = payload[key].substring(0, 10);
                }
            });

            const res = await fetch(`${API_BASE_URL}/districtadmin/${selectedRow.DistNGORegId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            toast.dismiss('approveNgo');
            if (res.ok) { toast.success(`Record Approved! ID: ${approvalData.id}`); closeModal(); fetchMembers(); }
            else { toast.error("Failed to approve."); }
        } catch (error) { toast.dismiss('approveNgo'); toast.error("Network error."); }
    };

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
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {renderTh('NGO Name', true, false)}
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
                                    {/* ✅ Added Signup Table Headers */}
                                    {renderTh('Login User Name')}
                                    {renderTh('Login Email')}
                                    {renderTh('Login Password')}
                                    {renderTh('Status')}
                                    {/* ✅ Added fully mapped Table Headers for Approval tracking */}
                                    {renderTh('Approved By')}
                                    {renderTh('Approval Date')}
                                    {renderTh('Approval Reg No')}
                                    {renderTh('Reg Cert PDF')}
                                    {renderTh('NGO PAN PDF')}
                                    {renderTh('Darpan PDF')}
                                    {renderTh('Actions', false, true)}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Mapping over filteredMembers instead of members */}
                                {filteredMembers.map((row) => (
                                    <tr key={row.DistNGORegId}>
                                        <td style={styles.stickyLeftTd}>{row.DistNGOName}</td>
                                        <td style={styles.td}>{formatDisplayDate(row.DistNGORegDate)}</td>
                                        <td style={styles.td}>{row.DistNGORegNo}</td>
                                        <td style={styles.td}>{row.DistNGOPanNo}</td>
                                        <td style={styles.td}>{row.DistNGODarpanId}</td>
                                        <td style={styles.td}>{row.DistNGOMailId}</td>
                                        <td style={styles.td}>{row.DistNGOPhoneNo}</td>
                                        <td style={styles.td}>{row.DistNGORegAddress}</td>
                                        <td style={styles.td}>{row.DistNGOWorkingAddress}</td>
                                        <td style={styles.td}>{row.DistNGOStateName}</td>
                                        <td style={styles.td}>{row.DistNGODistName}</td>
                                        <td style={styles.td}>{row.DistNGOBlockName}</td>
                                        <td style={styles.td}>{row.DistNGOSDPName}</td>
                                        <td style={styles.td}>{row.DistNGOSDPMailId}</td>
                                        <td style={styles.td}>{row.DistNGOSDPPhoneNo}</td>
                                        <td style={styles.td}>{row.DistNGOSDPAadhaarNo}</td>
                                        <td style={styles.td}>{row.DistNGOBankName}</td>
                                        <td style={styles.td}>{row.DistNGOAcctNo}</td>
                                        <td style={styles.td}>{row.DistNGOIFSCode}</td>
                                        <td style={styles.td}>{row.DistNGOBankAdd}</td>
                                        {/* ✅ Shows the strictly mapped database values visually */}
                                        <td style={styles.td}>{row.DistNGOSignupUserName || '-'}</td>
                                        <td style={styles.td}>{row.DistNGOSignupEmail || '-'}</td>
                                        <td style={styles.td}>{row.DistNGOSignupPassword || '-'}</td>
                                        <td style={{ ...styles.td, color: Number(row.DistNGOIsActive) === 2 ? 'green' : 'orange', fontWeight: 'bold' }}>{Number(row.DistNGOIsActive) === 2 ? 'Approved' : 'Pending'}</td>
                                        {/* ✅ Correctly uses the mapped Display Name from the Backend */}
                                        <td style={styles.td}>{row.ApproverDisplayName || row.DistNGOAprovedBy || '-'}</td>
                                        <td style={styles.td}>{formatDisplayDate(row.DistNGOAprovedDate)}</td>
                                        <td style={styles.td}>{row.DistNGOGenRegNo || '-'}</td>
                                        <td style={styles.td}>{row.DistNGORecCertificate ? '✅ Uploaded' : '❌ Missing'}</td>
                                        <td style={styles.td}>{row.DistNGOPanPic ? '✅ Uploaded' : '❌ Missing'}</td>
                                        <td style={styles.td}>{row.DistNGODarpanPic ? '✅ Uploaded' : '❌ Missing'}</td>
                                        <td style={styles.stickyRightTd}>
                                            <button onClick={() => openModal('view', row)} style={styles.actionBtn}>👁️</button>
                                            <button onClick={() => openModal('edit', row)} style={styles.actionBtn}>✏️</button>
                                            <button onClick={() => openModal('delete', row)} style={styles.actionBtn}>🗑️</button>
                                            {Number(row.DistNGOIsActive) !== 2 && (
                                                <button onClick={() => openModal('approve', row)} style={styles.actionBtn}>✅</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredMembers.length === 0 && <tr><td colSpan="31" style={{ ...styles.td, textAlign: 'center' }}>No members found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewModal && selectedRow && <DistrictAdminModal member={selectedRow} mode="view" onClose={closeModal} onSuccess={closeModal} />}
            {editModal && selectedRow && <DistrictAdminModal member={selectedRow} mode="edit" onClose={closeModal} onSuccess={() => { closeModal(); fetchMembers(); }} />}

            {deleteModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ color: '#ff3e1d' }}>Confirm Delete</h4>
                        <p>Delete <strong>{selectedRow.DistNGOName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={closeModal} style={styles.btnOutline}>Cancel</button>
                            <button onClick={confirmDelete} style={styles.btnDanger}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ Detailed Approval Modal */}
            {approveModal && selectedRow && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '450px', textAlign: 'center' }}>
                        <h4 style={{ color: '#71dd37', marginBottom: '16px' }}>Approve District Administrator</h4>

                        <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#566a7f', lineHeight: '1.6' }}>
                            <p style={{ margin: '6px 0' }}><strong>Candidate Name:</strong> {selectedRow.DistNGOName}</p>
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

export default DistrictAdminTable;