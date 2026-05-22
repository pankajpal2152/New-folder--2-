import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { API_BASE_URL, DUMMY_AVATAR, extractBase64, styles, FormInput } from '../config/constants';
import { asthaMaaSchema as supervisorSchema } from './forms/SupervisorForm';
import { getSafeUser, PasswordInput, validateUniqueFields } from './AccountSharedUtils';

const formatDisplayDate = (dbDateStr) => {
    if (!dbDateStr) return '-';
    return String(dbDateStr).substring(0, 10);
};

const SupervisorModal = ({ member, mode, onClose, onSuccess }) => {
    const isView = mode === 'view';
    const isReadOnlyField = isView || mode === 'edit';

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
            state: null,
            district: null,
            city: member.SupCity || '',
            block: member.SupBlockName || '',
            postOffice: member.SupPO || '',
            policeStation: member.SupPS || '',
            gramPanchayet: member.SupGramPanchayet || '',
            village: member.SupVillage || '',
            pinCode: String(member.SupPincode || ''),
            mobileNo: member.SupContactNo || '',
            email: member.SupSignupEmail || member.SupMailId || '',
            userName: member.SupSignupUserName || member.SupName || '',
            password: member.SupSignupPassword || '',
            bankName: member.SupBankName || '',
            branchName: member.SupBranchName || '',
            accountNo: member.SupAcctNo || '',
            ifsCode: member.SupIFSCode || '',
            panNo: member.SupPanNo || '',
            aadharNo: member.SupAadharNo || ''
        }
    });

    const selectedState = watch("state");

    useEffect(() => {
        const initializeAddressFields = async () => {
            try {
                const stateRes = await fetch(`${API_BASE_URL}/states`);
                const stateData = await stateRes.json();
                const formattedStates = stateData.map(s => ({ value: s.StateId, label: s.StateName }));
                setDbStates(formattedStates);

                if (member.SupStateName) {
                    const matchedState = formattedStates.find(s => s.label.trim() === member.SupStateName.trim());
                    if (matchedState) {
                        setValue("state", matchedState);
                        const distRes = await fetch(`${API_BASE_URL}/districts/${matchedState.value}`);
                        const distData = await distRes.json();
                        const formattedDistricts = distData.map(d => ({ value: d.DistId, label: d.DistName }));
                        setDbDistricts(formattedDistricts);
                        if (member.SupDistName) {
                            const matchedDist = formattedDistricts.find(d => d.label.trim() === member.SupDistName.trim());
                            if (matchedDist) setValue("district", matchedDist);
                        }
                    }
                }
            } catch (err) { console.error("Initialization error:", err); }
        };
        initializeAddressFields();
    }, [member, setValue]);

    useEffect(() => {
        if (selectedState && selectedState.value) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`)
                .then(res => res.json())
                .then(data => setDbDistricts(data.map(d => ({ value: d.DistId, label: d.DistName }))))
                .catch(() => { });
        }
    }, [selectedState]);

    const handleUploadClick = () => { if (!isView && fileInputRef.current) fileInputRef.current.click(); };

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
        const checks = [
            { table: 'suvervisor_reg', column: 'SupMailId', value: data.email, idColumn: 'SupRegId', idValue: member.SupRegId, label: 'Email ID' },
            { table: 'suvervisor_reg', column: 'SupSignupUserName', value: data.userName, idColumn: 'SupRegId', idValue: member.SupRegId, label: 'Username' },
            { table: 'suvervisor_reg', column: 'SupAadharNo', value: data.aadharNo, idColumn: 'SupRegId', idValue: member.SupRegId, label: 'Aadhar No' }
        ];
        if (!(await validateUniqueFields(checks))) return;

        const dbPayload = {
            ...member,
            SupProfileImage: profileImage === DUMMY_AVATAR ? null : profileImage,
            SupName: data.fullName,
            SupGuardianName: data.sdwOf || "",
            SupDOB: data.dob,
            SupGuardianContactNo: data.guardianContactNo || "",
            SupStateName: data.state ? data.state.label : "",
            SupDistName: data.district ? data.district.label : "",
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
            if (res.ok) { toast.success("Supervisor updated successfully!"); onSuccess(); }
            else { toast.error("Failed to update."); }
        } catch (error) { toast.dismiss('updateSup'); toast.error("Network error."); }
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
                            {!isView && (
                                <div style={styles.buttonGroup}>
                                    <button type="button" style={styles.btnOutline} onClick={handleUploadClick}>Change photo</button>
                                    <button type="button" style={styles.btnOutline} onClick={handleResetImage}>Reset</button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" style={{ display: 'none' }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <h6 style={styles.sectionHeader}>Supervisor Information</h6>
                        <div style={styles.formGrid}>
                            <Controller name="joiningAmount" control={control} render={({ field }) => (<FormInput label="Joining Amount" id="edit_joiningAmount" error={errors.joiningAmount} readOnly disabled {...field} />)} />
                            <Controller name="walletBalance" control={control} render={({ field }) => (<FormInput label="Wallet Balance" id="edit_walletBalance" error={errors.walletBalance} readOnly disabled {...field} />)} />
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
                                <Select options={dbStates} isDisabled={isReadOnlyField} menuPortalTarget={document.body} />
                            </div>
                             {/* ... Other fields remain same ... */}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '10px' }}>
                            <button type="button" style={styles.btnOutline} onClick={onClose}>Cancel</button>
                            {!isView && <button type="submit" style={styles.btnPrimary}>Save Changes</button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};