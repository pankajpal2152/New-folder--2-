import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { styles, FormInput } from '../config/constants';
import { PasswordInput } from '../components/AccountSharedUtils';

// ==========================================
// 1. VALIDATION SCHEMA
// ==========================================
const accessSchema = z.object({
    stateNgo: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    state: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    district: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    distNgoName: z.string().min(2, "District NGO Name is required"),
    acctHead: z.string().min(2, "Account Head is required"),
    acctName: z.string().min(2, "Account Name is required"),
    userName: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const AccessControl = () => {
    // ==========================================
    // 2. DUMMY STATE (To be replaced with DB fetch later)
    // ==========================================
    const [dbStateNgos, setDbStateNgos] = useState([]);
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    
    // Checkbox state for multi-district assignment
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState([]);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(accessSchema),
        mode: 'onChange',
        defaultValues: {
            stateNgo: null,
            state: null,
            district: null,
            distNgoName: '',
            acctHead: '',
            acctName: '',
            userName: '',
            password: ''
        }
    });

    // ==========================================
    // 3. UI MOCK DATA INITIALIZATION
    // ==========================================
    useEffect(() => {
        // Mock data to visualize the UI before connecting to the database
        setDbStateNgos([
            { value: '1', label: 'Mother NGO India' },
            { value: '2', label: 'State Level Care Foundation' }
        ]);
        setDbStates([
            { value: 'WB', label: 'West Bengal' },
            { value: 'MH', label: 'Maharashtra' }
        ]);
        setDbDistricts([
            { value: 'BIR', label: 'Birbhum' },
            { value: 'KOL', label: 'Kolkata' },
            { value: 'BAN', label: 'Bankura' }
        ]);
        setAvailableDistricts([
            'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 
            'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kolkata'
        ]);
    }, []);

    // ==========================================
    // 4. EVENT HANDLERS
    // ==========================================
    const handleDistrictToggle = (district) => {
        setSelectedDistricts(prev => 
            prev.includes(district) 
                ? prev.filter(d => d !== district) 
                : [...prev, district]
        );
    };

    const handleSelectAllDistricts = () => {
        if (selectedDistricts.length === availableDistricts.length) {
            setSelectedDistricts([]); // Deselect all
        } else {
            setSelectedDistricts([...availableDistricts]); // Select all
        }
    };

    const onSubmit = (data) => {
        if (selectedDistricts.length === 0) {
            toast.warning("Please assign at least one district access permission in the matrix.");
            return;
        }

        const finalPayload = {
            ...data,
            stateNgoId: data.stateNgo?.value || null,
            stateId: data.state?.value || null,
            districtId: data.district?.value || null,
            assignedDistricts: selectedDistricts
        };

        console.log("🚀 READY TO SEND TO DB:", finalPayload);
        toast.success("UI Form Validated! Check console for Payload.");
    };

    const onError = () => {
        toast.error("Please fill in all required red fields.");
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <ToastContainer autoClose={3000} pauseOnHover={false} />
            
            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🔐 Access Control & Login Management
                    </h5>
                </div>

                <div style={styles.cardBody}>
                    <form onSubmit={handleSubmit(onSubmit, onError)} autoComplete="off">
                        
                        {/* --- ROW 1: THE CONTEXT DROPDOWNS --- */}
                        <h6 style={{...styles.sectionHeader, marginTop: 0}}>1. Organization Context</h6>
                        <div style={{ ...styles.formGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>State NGO Name (Mother NGO)</label>
                                <Controller name="stateNgo" control={control} render={({ field }) => (
                                    <Select 
                                        {...field} 
                                        options={dbStateNgos} 
                                        placeholder="Select Mother NGO..." 
                                        styles={styles.selectStyles(!!errors.stateNgo)} 
                                        isClearable
                                    />
                                )} />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>State</label>
                                <Controller name="state" control={control} render={({ field }) => (
                                    <Select 
                                        {...field} 
                                        options={dbStates} 
                                        placeholder="Select State..." 
                                        styles={styles.selectStyles(!!errors.state)} 
                                        isClearable
                                    />
                                )} />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>District</label>
                                <Controller name="district" control={control} render={({ field }) => (
                                    <Select 
                                        {...field} 
                                        options={dbDistricts} 
                                        placeholder="Select District..." 
                                        styles={styles.selectStyles(!!errors.district)} 
                                        isClearable
                                    />
                                )} />
                            </div>
                        </div>

                        {/* --- ROW 2: TEXT INPUTS FOR ROLE & IDENTITY --- */}
                        <h6 style={styles.sectionHeader}>2. Assign Role & Identity</h6>
                        <div style={{ ...styles.formGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <Controller name="distNgoName" control={control} render={({ field }) => (
                                <FormInput 
                                    label={<>District NGO Name <span style={{ color: '#ff3e1d' }}>*</span></>} 
                                    id="distNgoName" 
                                    error={errors.distNgoName} 
                                    placeholder="Enter District NGO Name" 
                                    type="text" 
                                    {...field} 
                                />
                            )} />

                            <Controller name="acctHead" control={control} render={({ field }) => (
                                <FormInput 
                                    label={<>Account Head (Role) <span style={{ color: '#ff3e1d' }}>*</span></>} 
                                    id="acctHead" 
                                    error={errors.acctHead} 
                                    placeholder="e.g. Administrator, Supervisor" 
                                    type="text" 
                                    {...field} 
                                />
                            )} />

                            <Controller name="acctName" control={control} render={({ field }) => (
                                <FormInput 
                                    label={<>Account Name (Person) <span style={{ color: '#ff3e1d' }}>*</span></>} 
                                    id="acctName" 
                                    error={errors.acctName} 
                                    placeholder="Enter Person's Name" 
                                    type="text" 
                                    {...field} 
                                />
                            )} />
                        </div>

                        {/* --- ROW 3: LOGIN CREDENTIALS --- */}
                        <h6 style={styles.sectionHeader}>3. Login Access Credentials</h6>
                        <div style={{ ...styles.formGrid, gridTemplateColumns: '1fr 1fr' }}>
                            <Controller name="userName" control={control} render={({ field }) => (
                                <FormInput 
                                    label={<>User Name (For Login) <span style={{ color: '#ff3e1d' }}>*</span></>} 
                                    id="userName" 
                                    error={errors.userName} 
                                    placeholder="Enter unique username" 
                                    type="text" 
                                    autoComplete="off" 
                                    {...field} 
                                />
                            )} />
                            
                            <Controller name="password" control={control} render={({ field }) => (
                                <PasswordInput 
                                    label={<>Password <span style={{ color: '#ff3e1d' }}>*</span></>} 
                                    id="password" 
                                    error={errors.password} 
                                    placeholder="Set secure password"
                                    autoComplete="new-password" 
                                    {...field} 
                                />
                            )} />
                        </div>

                        {/* --- ROW 4: MULTI-DISTRICT CHECKBOX MATRIX --- */}
                        <div style={{ 
                            marginTop: '40px', 
                            padding: '24px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px', 
                            border: '1px solid #d9dee3' 
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <h6 style={{ margin: 0, fontSize: '1rem', color: '#566a7f' }}>
                                        4. Manage Data Visibility (Permission Matrix)
                                    </h6>
                                    <p style={styles.hintText}>
                                        Select which districts this user is allowed to access and manage.
                                    </p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleSelectAllDistricts} 
                                    style={{...styles.btnOutline, padding: '4px 12px', fontSize: '0.8rem'}}
                                >
                                    {selectedDistricts.length === availableDistricts.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                                gap: '16px',
                                marginTop: '16px'
                            }}>
                                {availableDistricts.map(district => (
                                    <label 
                                        key={district} 
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px', 
                                            cursor: 'pointer', 
                                            fontSize: '0.9375rem', 
                                            color: '#697a8d',
                                            backgroundColor: selectedDistricts.includes(district) ? 'rgba(105, 108, 255, 0.1)' : '#fff',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: selectedDistricts.includes(district) ? '1px solid #696cff' : '1px solid #d9dee3',
                                            transition: '0.2s'
                                        }}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={selectedDistricts.includes(district)}
                                            onChange={() => handleDistrictToggle(district)}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        {district}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* --- SUBMIT BUTTON --- */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                            <button type="button" style={{...styles.btnOutline, marginRight: '16px'}} onClick={() => reset()}>Reset Form</button>
                            <button type="submit" style={styles.btnPrimary}>Save Access Rule</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AccessControl;