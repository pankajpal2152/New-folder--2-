import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { API_BASE_URL, indianPhoneRegex, styles, FormInput } from '../../config/constants';

// ==========================================
// 1. Validation Schema (All 22 Fields)
// ==========================================
export const ngoSchema = z.object({
    ngoName: z.string().min(2, "NGO Name is required"),
    ngoRegistrationDate: z.string().min(1, "Date is required"),
    ngoRegistrationNo: z.string().min(1, "Registration No is required"),
    ngoPanNo: z.string().min(1, "PAN No is required"),
    ngoDarpanId: z.string().min(1, "Darpan ID is required"),
    ngoEmail: z.string().email("Valid email required"),
    ngoMobile: z.string().regex(indianPhoneRegex, "Valid Indian phone required"),
    ngoRegAddress: z.string().min(5, "Address is required"),
    ngoWorkingAddress: z.string().min(5, "Address is required"),
    state: z.object({ value: z.any(), label: z.string() }).nullable(),
    district: z.object({ value: z.any(), label: z.string() }).nullable(),
    blockName: z.string().min(1, "Block Name is required"),
    sdpName: z.string().min(2, "Name is required"),
    secretaryEmail: z.string().email("Valid email required"),
    secretaryMobile: z.string().regex(indianPhoneRegex, "Valid phone required"),
    secretaryAadhar: z.string().length(12, "Must be exactly 12 digits").regex(/^\d+$/, "Numbers only"),
    bankName: z.string().min(1, "Bank Name is required"),
    accountNo: z.string().min(1, "Account Number is required"),
    ifsCode: z.string().min(1, "IFS Code is required"),
    bankAddress: z.string().min(1, "Bank Address is required"),
    userName: z.string().min(1, "User Name is required"),
    password: z.string().min(1, "Password is required")
});

const DistrictAdminForm = ({ onSuccess }) => {
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(ngoSchema),
        mode: 'onChange',
        defaultValues: {
            ngoName: '', ngoRegistrationDate: '', ngoRegistrationNo: '', ngoPanNo: '', ngoDarpanId: '', ngoEmail: '', ngoMobile: '', ngoRegAddress: '', ngoWorkingAddress: '', state: null, district: null, blockName: '', sdpName: '', secretaryEmail: '', secretaryMobile: '', secretaryAadhar: '', bankName: '', accountNo: '', ifsCode: '', bankAddress: '', userName: '', password: ''
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

    const getCurrentUserEmail = () => {
        try {
            const userStr = localStorage.getItem('loggedInUser');
            if (userStr) return JSON.parse(userStr).email || "";
        } catch (error) { console.error(error); }
        return "";
    };

    const handleCancel = () => reset();

    const onSubmitDistrictAdmin = async (data) => {
        const currentUserEmail = getCurrentUserEmail();

        // Exact mapping to match your database columns
        const dbPayload = {
            DistNGOName: data.ngoName,
            DistNGORegDate: data.ngoRegistrationDate,
            DistNGORegNo: data.ngoRegistrationNo,
            DistNGOPanNo: data.ngoPanNo,
            DistNGODarpanId: data.ngoDarpanId,
            DistNGOMailId: data.ngoEmail,
            DistNGOPhoneNo: data.ngoMobile,
            DistNGORegAddress: data.ngoRegAddress,
            DistNGOWorkingAddress: data.ngoWorkingAddress,
            DistNGOStateName: data.state ? data.state.label : "",
            DistNGODistName: data.district ? data.district.label : "",
            BlockName: data.blockName, 
            DistNGOSDPName: data.sdpName,
            DistNGOSDPMailId: data.secretaryEmail,
            DistNGOSDPPhoneNo: data.secretaryMobile,
            DistNGOSDPAadhaarNo: data.secretaryAadhar,
            DistNGOBankName: data.bankName,
            DistNGOAcctNo: data.accountNo,
            DistNGOIFSCode: data.ifsCode,
            DistNGOBankAdd: data.bankAddress,
            DistNGOUserName: data.userName,
            DistNGOPassword: data.password,
            CreatedBy: currentUserEmail
        };

        try {
            toast.loading("Saving District Admin data...", { toastId: 'savingAdmin' });
            
            const response = await fetch(`${API_BASE_URL}/districtadmin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload)
            });
            
            toast.dismiss('savingAdmin');

            if (response.ok) {
                toast.success("Success: Data saved to Database!", { position: "top-right" });
                handleCancel();
                if (onSuccess) onSuccess(); // Triggers table refresh
            } else {
                toast.error("Failed to save data. Check backend logs.", { position: "top-right" });
            }
        } catch (error) {
            toast.dismiss('savingAdmin');
            toast.error("Network error. Could not reach server.", { position: "top-right" });
        }
    };

    const onError = () => toast.error("Form Error: Please check the highlighted fields.", { position: "top-right" });

    return (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <h5>District Administrator Registration</h5>
            </div>
            <div style={styles.cardBody}>
                <form onSubmit={handleSubmit(onSubmitDistrictAdmin, onError)}>
                    
                    <h6 style={styles.sectionHeader}>NGO Details</h6>
                    <div style={styles.formGrid}>
                        <Controller name="ngoName" control={control} render={({ field }) => (
                            <FormInput label={<>NGO Full Name <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoName" error={errors.ngoName} type="text" {...field} />
                        )} />
                        <Controller name="ngoRegistrationDate" control={control} render={({ field }) => (
                            <FormInput label={<>Date of NGO/ Trustee Registration <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoRegistrationDate" error={errors.ngoRegistrationDate} type="date" {...field} />
                        )} />
                        <Controller name="ngoRegistrationNo" control={control} render={({ field }) => (
                            <FormInput label={<>NGO Registration No/ CIN / Trustee Deed No <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoRegistrationNo" error={errors.ngoRegistrationNo} type="text" {...field} />
                        )} />
                        <Controller name="ngoPanNo" control={control} render={({ field }) => (
                            <FormInput label={<>NGO PAN No <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoPanNo" error={errors.ngoPanNo} type="text" {...field} />
                        )} />
                        <Controller name="ngoDarpanId" control={control} render={({ field }) => (
                            <FormInput label={<>NGO Darpan ID <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoDarpanId" error={errors.ngoDarpanId} type="text" {...field} />
                        )} />
                        <Controller name="ngoEmail" control={control} render={({ field }) => (
                            <FormInput label={<>NGO Email id <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoEmail" error={errors.ngoEmail} type="email" {...field} />
                        )} />
                        <Controller name="ngoMobile" control={control} render={({ field }) => (
                            <FormInput label={<>NGO Mobile No <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoMobile" error={errors.ngoMobile} type="tel" {...field} />
                        )} />
                    </div>

                    <h6 style={styles.sectionHeader}>Address Details</h6>
                    <div style={styles.formGrid}>
                        <Controller name="ngoRegAddress" control={control} render={({ field }) => (
                            <FormInput label={<>NGO Register Address <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoRegAddress" error={errors.ngoRegAddress} type="text" {...field} />
                        )} />
                        <Controller name="ngoWorkingAddress" control={control} render={({ field }) => (
                            <FormInput label={<>NGO Working office full address <span style={{ color: '#ff3e1d' }}>*</span></>} id="ngoWorkingAddress" error={errors.ngoWorkingAddress} type="text" {...field} />
                        )} />
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Willing to work State Name <span style={{ color: '#ff3e1d' }}>*</span></label>
                            <Controller name="state" control={control} render={({ field }) => (
                                <Select {...field} options={dbStates} styles={styles.selectStyles(!!errors.state)} placeholder="Select State" />
                            )} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Which District Name <span style={{ color: '#ff3e1d' }}>*</span></label>
                            <Controller name="district" control={control} render={({ field }) => (
                                <Select {...field} options={dbDistricts} styles={styles.selectStyles(!!errors.district)} placeholder="Select District" isDisabled={!selectedState} />
                            )} />
                        </div>
                        <Controller name="blockName" control={control} render={({ field }) => (
                            <FormInput label={<>Which Block Name <span style={{ color: '#ff3e1d' }}>* (Can type multiple)</span></>} id="blockName" error={errors.blockName} type="text" {...field} />
                        )} />
                    </div>

                    <h6 style={styles.sectionHeader}>Secretary Details</h6>
                    <div style={styles.formGrid}>
                        <Controller name="sdpName" control={control} render={({ field }) => (
                            <FormInput label={<>Secretary/ Director/ President Full Name <span style={{ color: '#ff3e1d' }}>*</span></>} id="sdpName" error={errors.sdpName} type="text" {...field} />
                        )} />
                        <Controller name="secretaryEmail" control={control} render={({ field }) => (
                            <FormInput label={<>Secretary/ Director/ President Email ID <span style={{ color: '#ff3e1d' }}>*</span></>} id="secretaryEmail" error={errors.secretaryEmail} type="email" {...field} />
                        )} />
                        <Controller name="secretaryMobile" control={control} render={({ field }) => (
                            <FormInput label={<>Secretary/ Director/ President Mobile No <span style={{ color: '#ff3e1d' }}>*</span></>} id="secretaryMobile" error={errors.secretaryMobile} type="tel" {...field} />
                        )} />
                        <Controller name="secretaryAadhar" control={control} render={({ field }) => (
                            <FormInput label={<>Secretary/ Director Aadhaar Card Number <span style={{ color: '#ff3e1d' }}>*</span></>} id="secretaryAadhar" error={errors.secretaryAadhar} type="text" maxLength={12} {...field} />
                        )} />
                    </div>

                    <h6 style={styles.sectionHeader}>Banking & Account Setup</h6>
                    <div style={styles.formGrid}>
                        <Controller name="bankName" control={control} render={({ field }) => (
                            <FormInput label={<>Bank Name <span style={{ color: '#ff3e1d' }}>*</span></>} id="bankName" error={errors.bankName} type="text" {...field} />
                        )} />
                        <Controller name="accountNo" control={control} render={({ field }) => (
                            <FormInput label={<>Account Number <span style={{ color: '#ff3e1d' }}>*</span></>} id="accountNo" error={errors.accountNo} type="text" {...field} />
                        )} />
                        <Controller name="ifsCode" control={control} render={({ field }) => (
                            <FormInput label={<>IFS Code <span style={{ color: '#ff3e1d' }}>*</span></>} id="ifsCode" error={errors.ifsCode} type="text" {...field} />
                        )} />
                        <Controller name="bankAddress" control={control} render={({ field }) => (
                            <FormInput label={<>Bank Address <span style={{ color: '#ff3e1d' }}>*</span></>} id="bankAddress" error={errors.bankAddress} type="text" {...field} />
                        )} />
                        <Controller name="userName" control={control} render={({ field }) => (
                            <FormInput label={<>User Name <span style={{ color: '#ff3e1d' }}>*</span></>} id="userName" error={errors.userName} type="text" {...field} />
                        )} />
                        <Controller name="password" control={control} render={({ field }) => (
                            <FormInput label={<>Set New Password <span style={{ color: '#ff3e1d' }}>* (Don't forget it!)</span></>} id="password" error={errors.password} type="password" {...field} />
                        )} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
                        <button type="button" style={styles.btnOutline} onClick={handleCancel}>Cancel</button>
                        <button type="submit" style={styles.btnPrimary}>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DistrictAdminForm;