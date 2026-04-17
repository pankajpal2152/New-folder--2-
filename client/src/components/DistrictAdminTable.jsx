import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import { toast } from 'react-toastify';

import { API_BASE_URL, styles, FormInput, fileToBase64 } from '../config/constants';
import { ngoSchema } from './forms/DistrictAdminForm';
import { getSafeUser, PasswordInput, handleViewPdf } from './AccountSharedUtils';

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
            ngoRegistrationDate: member.DistNGORegDate ? member.DistNGORegDate.substring(0, 10) : '',
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
            userName: member.DistNGOUserName || '',
            password: member.DistNGOPassword || '',
            ngoEmail: member.DistNGOMailId || ''
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
            DistNGOPanNo: data.ngoPanNo, DistNGODarpanId: data.ngoDarpanId, DistNGOMailId: data.generalNgoEmail,
            DistNGOPhoneNo: data.ngoMobile, DistNGORegAddress: data.ngoRegAddress, DistNGOWorkingAddress: data.ngoWorkingAddress,
            DistNGOStateName: data.state ? data.state.label : "", DistNGODistName: data.district ? data.district.label : "",
            DistNGOBlockName: data.blockName,
            DistNGOSDPName: data.sdpName, DistNGOSDPMailId: data.secretaryEmail,
            DistNGOSDPPhoneNo: data.secretaryMobile, DistNGOSDPAadhaarNo: data.secretaryAadhar, DistNGOBankName: data.bankName,
            DistNGOAcctNo: data.accountNo, DistNGOIFSCode: data.ifsCode, DistNGOBankAdd: data.bankAddress,
            DistNGOUserName: data.userName, DistNGOPassword: data.password,
            DistNGORecCertificate: regCertPdf, DistNGOPanPic: panPdf, DistNGODarpanPic: darpanPdf,
            loginEmail: data.ngoEmail,
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
                            <Controller name="userName" control={control} render={({ field }) => (<FormInput label="User Name *" id="e_user" error={errors.userName} disabled={isView} {...field} />)} />
                            <Controller name="ngoEmail" control={control} render={({ field }) => (<FormInput label="Email ID (For Login) *" id="e_loginEmail" type="email" error={errors.ngoEmail} disabled={isView} {...field} />)} />
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

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/districtadmin`);
            if (!res.ok) throw new Error("Failed to fetch data");
            let data = await res.json();

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
                                    {renderTh('User Name')}
                                    {renderTh('Status')}
                                    {renderTh('Created By')}
                                    {renderTh('Reg Cert PDF')}
                                    {renderTh('NGO PAN PDF')}
                                    {renderTh('Darpan PDF')}
                                    {renderTh('Actions', false, true)}
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((row) => (
                                    <tr key={row.DistNGORegId}>
                                        <td style={styles.stickyLeftTd}>{row.DistNGOName}</td>
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
                                        <td style={styles.td}>{row.DistNGOBlockName}</td>
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
                                        <td style={styles.td}>{row.DistNGORecCertificate ? '✅ Uploaded' : '❌ Missing'}</td>
                                        <td style={styles.td}>{row.DistNGOPanPic ? '✅ Uploaded' : '❌ Missing'}</td>
                                        <td style={styles.td}>{row.DistNGODarpanPic ? '✅ Uploaded' : '❌ Missing'}</td>
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

export default DistrictAdminTable;