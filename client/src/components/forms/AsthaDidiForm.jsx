import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { API_BASE_URL, DUMMY_AVATAR, indianZipRegex, indianPhoneRegex, styles, FormInput } from '../../config/constants';

// Validation Schema specific to this form
export const accountSchema = z.object({
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
    bankName: z.string().optional(),
    branchName: z.string().optional(),
    accountNo: z.string().optional(),
    ifsCode: z.string().optional(),
    panNo: z.string().optional(),
    aadharNo: z.string().length(12, "Must be exactly 12 digits").regex(/^\d+$/, "Numbers only"),
    deactivateConfirm: z.boolean().optional()
});

const AsthaDidiForm = ({ onSuccess }) => {
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [profileImage, setProfileImage] = useState(DUMMY_AVATAR);
    const fileInputRef = useRef(null);

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(accountSchema),
        mode: 'onChange',
        defaultValues: {
            joiningAmount: '5000', walletBalance: '27000',
            fullName: '', sdwOf: '', dob: '', guardianContactNo: '',
            state: null, district: null, city: '', block: '', postOffice: '', policeStation: '', gramPanchayet: '', village: '', pinCode: '', mobileNo: '', email: '',
            bankName: '', branchName: '', accountNo: '', ifsCode: '', panNo: '', aadharNo: '',
            deactivateConfirm: false
        }
    });

    const selectedState = watch("state");

    useEffect(() => {
        fetch(`${API_BASE_URL}/states`)
            .then(res => res.json())
            .then(data => setDbStates(data.map(s => ({ value: s.StateId, label: s.StateName }))));
    }, []);

    useEffect(() => {
        if (selectedState && selectedState.value) {
            fetch(`${API_BASE_URL}/districts/${selectedState.value}`)
                .then(res => res.json())
                .then(data => setDbDistricts(data.map(d => ({ value: d.DistId, label: d.DistName }))));
        } else {
            setDbDistricts([]);
        }
    }, [selectedState]);

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

    const handleCancelAsthaDidi = () => {
        reset();
        handleResetImage();
    };

    const onSubmitAsthaDidi = async (data) => {
        const stateName = data.state ? data.state.label : "";
        const districtName = data.district ? data.district.label : "";
        const userStr = localStorage.getItem('loggedInUser');
        const loggedInUser = userStr ? JSON.parse(userStr) : null;
        const currentUserEmail = loggedInUser ? loggedInUser.email : "";

        const dbPayload = {
            ProfileImage: profileImage === DUMMY_AVATAR ? null : profileImage,
            PerName: data.fullName,
            GuardianName: data.sdwOf || "",
            DOB: data.dob,
            GuardianContactNo: data.guardianContactNo || "",
            StateName: stateName,
            DistName: districtName,
            City: data.city || "",
            BlockName: data.block || "",
            PO: data.postOffice || "",
            PS: data.policeStation || "",
            GramPanchayet: data.gramPanchayet || "",
            Village: data.village || "",
            Pincode: parseInt(data.pinCode),
            ContactNo: data.mobileNo,
            MailId: data.email,
            BankName: data.bankName || "",
            BranchName: data.branchName || "",
            AcctNo: data.accountNo || "0",
            IFSCode: data.ifsCode || "",
            PanNo: data.panNo || "",
            AadharNo: data.aadharNo,
            JoiningAmt: parseInt(data.joiningAmount) || 5000,
            WalletBalance: parseInt(data.walletBalance) || 0,
            Status: 1,
            AprovedBy: null,
            AprovalDate: null,
            AprovalNumber: null,
            CreatedBy: currentUserEmail
        };

        try {
            toast.loading("Saving to local database...", { toastId: 'saving' });
            // FIXED: Pointing to /asthadidi instead of /RegInfo
            const response = await fetch(`${API_BASE_URL}/asthadidi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload)
            });
            toast.dismiss('saving');

            if (response.ok) {
                toast.success("Success: Data saved to Database!", { position: "top-right" });
                handleCancelAsthaDidi();
                onSuccess(); // Trigger table refresh in parent component
            } else {
                toast.error("Failed to save data. Check backend logs.", { position: "top-right" });
            }
        } catch (error) {
            toast.dismiss('saving');
            toast.error("Network error. Could not reach server.", { position: "top-right" });
        }
    };

    const onErrorAsthaDidi = () => toast.error("Error: Please check the red fields.", { position: "top-right" });

    return (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <h5>Astha Didi Registration</h5>
            </div>
            <div style={styles.cardBody}>
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

                <form onSubmit={handleSubmit(onSubmitAsthaDidi, onErrorAsthaDidi)}>
                    <h6 style={styles.sectionHeader}>Astha Didi Information</h6>
                    <div style={styles.formGrid}>
                        <Controller name="joiningAmount" control={control} render={({ field }) => (
                            <FormInput label={<>Joining Amount <span style={{ color: '#ff3e1d' }}>*</span></>} id="joiningAmount" error={errors.joiningAmount} placeholder="Enter Amount" type="number" readOnly disabled={true} {...field} />
                        )} />
                        <Controller name="walletBalance" control={control} render={({ field }) => (
                            <FormInput label={<>Wallet Balance <span style={{ color: '#ff3e1d' }}>*</span></>} id="walletBalance" error={errors.walletBalance} disabled={true} readOnly {...field} />
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
                                <Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} placeholder="Select State" />
                            )} />
                            {errors.state && <p style={styles.errorText}>{errors.state.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>District</label>
                            <Controller name="district" control={control} render={({ field }) => (
                                <Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} placeholder="Select District" isDisabled={!selectedState} />
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
                        <Controller name="email" control={control} render={({ field }) => (
                            <FormInput label={<>Email ID <span style={{ color: '#ff3e1d' }}>*</span></>} id="email" error={errors.email} placeholder="Email ID" type="email" maxLength={100} {...field} />
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
                        <button type="button" style={styles.btnOutline} onClick={handleCancelAsthaDidi}>Cancel</button>
                        <button type="submit" style={styles.btnPrimary}>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AsthaDidiForm;

