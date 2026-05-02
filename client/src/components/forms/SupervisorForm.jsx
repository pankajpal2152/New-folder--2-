import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { API_BASE_URL, DUMMY_AVATAR, indianZipRegex, indianPhoneRegex, styles, FormInput } from '../../config/constants';
import { getSafeUser } from '../AccountSharedUtils';

export const asthaMaaSchema = z.object({
    joiningAmount: z.string().min(1, "Joining Amount is required"),
    walletBalance: z.string().optional(),
    fullName: z.string().min(2, "Min 2 characters").max(50, "Max 50 characters").regex(/^[a-zA-Z\s]+$/, "Letters only"),
    sdwOf: z.string().optional(),
    dob: z.string().min(1, "Date of Birth is required"),
    guardianContactNo: z.string().optional(),
    state: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    district: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    city: z.string().optional(),
    block: z.string().optional(),
    postOffice: z.string().optional(),
    policeStation: z.string().optional(),
    gramPanchayet: z.string().optional(),
    village: z.string().optional(),
    pinCode: z.string().regex(indianZipRegex, "Valid 6-digit Pincode required").length(6, "Must be exactly 6 digits"),
    mobileNo: z.string().regex(indianPhoneRegex, "Valid Indian phone required"),
    email: z.string().email("Please enter a valid email address").max(100, "Max 100 characters"),
    userName: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    bankName: z.string().optional(),
    branchName: z.string().optional(),
    accountNo: z.string().optional(),
    ifsCode: z.string().optional(),
    panNo: z.string().optional(),
    aadharNo: z.string().length(12, "Must be exactly 12 digits").regex(/^\d+$/, "Numbers only")
});

const PasswordInput = ({ label, id, error, placeholder, disabled, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
        <div style={styles.inputGroup}>
            <label htmlFor={id} style={styles.label}>{label}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    style={disabled ? styles.inputDisabled : { ...styles.input(!!error), paddingRight: '40px' }}
                    placeholder={placeholder}
                    disabled={disabled}
                    {...props}
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                        position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#697a8d', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
            </div>
            {error && <p style={styles.errorText}>{error.message}</p>}
        </div>
    );
};

const SupervisorForm = ({ onSuccess, externalFilters }) => {
    const { filterMotherNgo, filterState, filterDistrict } = externalFilters || {};
    
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [profileImage, setProfileImage] = useState(DUMMY_AVATAR);
    const fileInputRef = useRef(null);

    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(asthaMaaSchema),
        mode: 'onChange',
        defaultValues: {
            joiningAmount: '5000', walletBalance: '27000',
            fullName: '', sdwOf: '', dob: '', guardianContactNo: '',
            state: null, district: null, city: '', block: '', postOffice: '', policeStation: '', gramPanchayet: '', village: '', pinCode: '', mobileNo: '', email: '', userName: '', password: '',
            bankName: '', branchName: '', accountNo: '', ifsCode: '', panNo: '', aadharNo: ''
        }
    });

    const selectedState = watch("state");
    const fullNameValue = watch("fullName");

    // DYNAMIC SYNC: Automatically sets User Name based on Full Name
    useEffect(() => {
        setValue("userName", fullNameValue || "", { shouldValidate: true });
    }, [fullNameValue, setValue]);

    // Smart mapping for States based on external filter
    useEffect(() => {
        if (filterState) {
            setDbStates([filterState]);
            setValue("state", filterState, { shouldValidate: true });
        } else {
            fetch(`${API_BASE_URL}/states`)
                .then(res => res.json())
                .then(data => setDbStates(data.map(s => ({ value: s.StateId, label: s.StateName }))));
        }
    }, [filterState, setValue]);

    // Smart mapping for Districts based on external filter
    useEffect(() => {
        if (filterDistrict) {
            setDbDistricts([filterDistrict]);
            setValue("district", filterDistrict, { shouldValidate: true });
        } else if (selectedState && selectedState.value && !filterState) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`)
                .then(res => res.json())
                .then(data => setDbDistricts(data.map(d => ({ value: d.DistId, label: d.DistName }))));
        } else {
            setDbDistricts([]);
        }
    }, [filterDistrict, selectedState, filterState, setValue]);

    const handleUploadClick = () => fileInputRef.current.click();
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 800000) return toast.warning("Image size exceeds 800K.");
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleResetImage = () => {
        setProfileImage(DUMMY_AVATAR);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCancelForm = () => {
        reset();
        handleResetImage();
    };

    const onSubmitSupervisor = async (data) => {
        const stateName = data.state ? data.state.label : "";
        const districtName = data.district ? data.district.label : "";

        const loggedInUser = getSafeUser ? getSafeUser() : null;
        const currentUserId = loggedInUser ? (loggedInUser.UserSignUpId || loggedInUser.id) : null;

        const dbPayload = {
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
            SupCreatedByAuthRegId: currentUserId,
            
            // Link the Supervisor to the selected District NGO automatically!
            DistNGORegId: filterMotherNgo ? filterMotherNgo.value : null,

            SupBankName: data.bankName || "",
            SupBranchName: data.branchName || "",
            SupAcctNo: data.accountNo || "0",
            SupIFSCode: data.ifsCode || "",
            SupPanNo: data.panNo || "",
            SupAadharNo: data.aadharNo,
            SupJoiningAmt: parseInt(data.joiningAmount) || 5000,
            SupWalletBalance: parseInt(data.walletBalance) || 0,
            SupIsActive: 1,
            SupAprovedBy: null,
            SupAprovedDate: null,
            SupRegNo: null
        };

        try {
            toast.loading("Saving Supervisor data...", { toastId: 'saving' });

            const response = await fetch(`${API_BASE_URL}/supervisor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload)
            });
            toast.dismiss('saving');

            if (response.ok) {
                toast.success("Success: Data saved to Database!", { position: "top-right" });
                handleCancelForm();
                if (onSuccess) onSuccess();
            } else {
                toast.error("Failed to save data. Check backend logs.", { position: "top-right" });
            }
        } catch (error) {
            toast.dismiss('saving');
            toast.error("Network error. Could not reach server.", { position: "top-right" });
        }
    };

    const onErrorForm = () => toast.error("Error: Please check the red fields.", { position: "top-right" });

    return (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <h5>Supervisor Registration:-</h5>
            </div>
            
            {!filterMotherNgo && (
                <div style={{ padding: '12px 24px', backgroundColor: '#fff3cd', color: '#856404', borderBottom: '1px solid #ffeeba' }}>
                    <strong>Notice:</strong> Please select a <strong>DISTRICT NGO</strong> from the top filters before filling out this registration form.
                </div>
            )}

            <div style={{ ...styles.cardBody, opacity: !filterMotherNgo ? 0.6 : 1, pointerEvents: !filterMotherNgo ? 'none' : 'auto' }}>
                <div style={styles.profileSection}>
                    <img src={profileImage} alt="Profile Avatar" style={styles.avatar} />
                    <div>
                        <div style={styles.buttonGroup}>
                            <button type="button" style={styles.btnOutline} onClick={handleUploadClick}>Upload new photo</button>
                            <button type="button" style={styles.btnOutline} onClick={handleResetImage}>Reset</button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" style={{ display: 'none' }} />
                        </div>
                        <p style={styles.hintText}>Allowed JPG, GIF or PNG. Max size of 800K</p>
                    </div>
                </div>

                {/* Added autoComplete="off" here */}
                <form onSubmit={handleSubmit(onSubmitSupervisor, onErrorForm)} autoComplete="off">
                    <h6 style={styles.sectionHeader}>Supervisor Information</h6>
                    <div style={styles.formGrid}>
                        <Controller name="joiningAmount" control={control} render={({ field }) => (
                            <FormInput label={<>Joining Amount <span style={{ color: '#ff3e1d' }}>*</span></>} id="joiningAmount" error={errors.joiningAmount} placeholder="Enter Amount" type="number" readOnly disabled={true} {...field} />
                        )} />
                    </div>

                    <h6 style={styles.sectionHeader}>Personal Details</h6>
                    <div style={styles.formGrid}>
                        <Controller name="fullName" control={control} render={({ field }) => (
                            <FormInput label={<>Full Name <span style={{ color: '#ff3e1d' }}>*</span></>} id="fullName" error={errors.fullName} placeholder="Applicant Name" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="sdwOf" control={control} render={({ field }) => (
                            <FormInput label="S/D/W of" id="sdwOf" error={errors.sdwOf} placeholder="S/D/W of" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="dob" control={control} render={({ field }) => (
                            <FormInput label={<>Date of Birth <span style={{ color: '#ff3e1d' }}>*</span></>} id="dob" error={errors.dob} placeholder="DD/MM/YYYY" type="date" {...field} />
                        )} />
                        <Controller name="guardianContactNo" control={control} render={({ field }) => (
                            <FormInput label="Guardian Contact no" id="guardianContactNo" error={errors.guardianContactNo} placeholder="Guardian Contact no" type="text" maxLength={50} {...field} />
                        )} />
                    </div>

                    <h6 style={styles.sectionHeader}>Postal Address Information</h6>
                    <div style={styles.formGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Select State</label>
                            <Controller name="state" control={control} render={({ field }) => (
                                <Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} placeholder="Select State" isDisabled={!!filterState} />
                            )} />
                            {errors.state && <p style={styles.errorText}>{errors.state.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>District</label>
                            <Controller name="district" control={control} render={({ field }) => (
                                <Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} placeholder="Select District" isDisabled={!!filterDistrict || !selectedState} />
                            )} />
                            {errors.district && <p style={styles.errorText}>{errors.district.message}</p>}
                        </div>
                        <Controller name="city" control={control} render={({ field }) => (
                            <FormInput label="City" id="city" error={errors.city} placeholder="City" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="block" control={control} render={({ field }) => (
                            <FormInput label="Block" id="block" error={errors.block} placeholder="Block" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="postOffice" control={control} render={({ field }) => (
                            <FormInput label="Post Office" id="postOffice" error={errors.postOffice} placeholder="Post Office" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="policeStation" control={control} render={({ field }) => (
                            <FormInput label="Police Station" id="policeStation" error={errors.policeStation} placeholder="Police Station" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="gramPanchayet" control={control} render={({ field }) => (
                            <FormInput label="Gram Panchayet" id="gramPanchayet" error={errors.gramPanchayet} placeholder="Gram Panchayet" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="village" control={control} render={({ field }) => (
                            <FormInput label="Village" id="village" error={errors.village} placeholder="Village" type="text" maxLength={50} {...field} />
                        )} />
                        <Controller name="pinCode" control={control} render={({ field }) => (
                            <FormInput label={<>Pin Code <span style={{ color: '#ff3e1d' }}>*</span></>} id="pinCode" error={errors.pinCode} placeholder="Pincode" type="text" maxLength={6} {...field} />
                        )} />
                        <Controller name="mobileNo" control={control} render={({ field }) => (
                            <FormInput label={<>Contact Number <span style={{ color: '#ff3e1d' }}>*</span></>} id="mobileNo" error={errors.mobileNo} placeholder="Mobile No." type="tel" maxLength={15} {...field} />
                        )} />
                    </div>

                    <h6 style={styles.sectionHeader}>Login & Account Setup</h6>
                    <div style={styles.formGrid}>
                        <Controller name="userName" control={control} render={({ field }) => (
                            <FormInput label={<>User Name <span style={{ color: '#ff3e1d' }}>*</span></>} id="userName" error={errors.userName} type="text" readOnly disabled={true} {...field} />
                        )} />
                        
                        {/* Added autoComplete="off" here */}
                        <Controller name="email" control={control} render={({ field }) => (
                            <FormInput label={<>Email ID (For Login) <span style={{ color: '#ff3e1d' }}>*</span></>} id="email" error={errors.email} placeholder="Email ID" type="email" maxLength={100} autoComplete="off" {...field} />
                        )} />
                        
                        {/* Added autoComplete="new-password" here */}
                        <Controller name="password" control={control} render={({ field }) => (
                            <PasswordInput label={<>Set Password <span style={{ color: '#ff3e1d' }}>*</span></>} id="password" error={errors.password} autoComplete="new-password" {...field} />
                        )} />
                    </div>

                    <h6 style={styles.sectionHeader}>Banking & Payment Details</h6>
                    <div style={styles.formGrid}>
                        <Controller name="bankName" control={control} render={({ field }) => (
                            <FormInput label="Bank Name" id="bankName" error={errors.bankName} placeholder="Bank Name" type="text" maxLength={100} {...field} />
                        )} />
                        <Controller name="branchName" control={control} render={({ field }) => (
                            <FormInput label="Branch Name" id="branchName" error={errors.branchName} placeholder="Bank Branch Name" type="text" maxLength={100} {...field} />
                        )} />
                        <Controller name="accountNo" control={control} render={({ field }) => (
                            <FormInput label="Account No" id="accountNo" error={errors.accountNo} placeholder="Bank Ac No" type="text" maxLength={30} {...field} />
                        )} />
                        <Controller name="ifsCode" control={control} render={({ field }) => (
                            <FormInput label="IFS Code" id="ifsCode" error={errors.ifsCode} placeholder="Bank IFS Code" type="text" maxLength={20} {...field} />
                        )} />
                        <Controller name="panNo" control={control} render={({ field }) => (
                            <FormInput label="PAN No" id="panNo" error={errors.panNo} placeholder="Pan No." type="text" maxLength={10} {...field} />
                        )} />
                        <Controller name="aadharNo" control={control} render={({ field }) => (
                            <FormInput label={<>Aadhar No. <span style={{ color: '#ff3e1d' }}>*</span></>} id="aadharNo" error={errors.aadharNo} placeholder="Aadhar No." type="text" maxLength={12} {...field} />
                        )} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
                        <button type="button" style={styles.btnOutline} onClick={handleCancelForm}>Cancel</button>
                        <button type="submit" style={{ ...styles.btnPrimary, opacity: !filterMotherNgo ? 0.5 : 1 }} disabled={!filterMotherNgo}>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupervisorForm;