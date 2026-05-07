import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { styles, FormInput } from '../config/constants';
import { PasswordInput } from './AccountSharedUtils';

// ==========================================
// 1. VALIDATION SCHEMA
// ==========================================
const accessSchema = z.object({
    distNgo: z.object({ value: z.any(), label: z.string() }, { required_error: "Please select a District NGO" }),
    acctHead: z.object({ value: z.any(), label: z.string() }, { required_error: "Please select an Account Head" }),
    acctName: z.object({ value: z.any(), label: z.string() }, { required_error: "Please select an Account Name" }),
    userName: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const AccessControl = () => {
    // ==========================================
    // 2. DUMMY STATE (To be replaced with DB fetch later)
    // ==========================================
    const [dbDistNgos, setDbDistNgos] = useState([]);
    const [dbAcctHeads, setDbAcctHeads] = useState([]);
    const [dbAcctNames, setDbAcctNames] = useState([]);
    
    // Checkbox state for multi-district assignment
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState([]);

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(accessSchema),
        mode: 'onChange',
        defaultValues: {
            distNgo: null,
            acctHead: null,
            acctName: null,
            userName: '',
            password: ''
        }
    });

    const watchedDistNgo = watch('distNgo');

    // ==========================================
    // 3. UI MOCK DATA INITIALIZATION
    // ==========================================
    useEffect(() => {
        // Mock data to visualize the UI before connecting to the database
        setDbDistNgos([
            { value: '1', label: 'Birbhum Welfare Society' },
            { value: '2', label: 'Kolkata Care Foundation' }
        ]);
        setDbAcctHeads([
            { value: 'ADMIN', label: 'Administrator' },
            { value: 'SUPERVISOR', label: 'Field Supervisor' },
            { value: 'FINANCE', label: 'Finance Manager' }
        ]);
        setDbAcctNames([
            { value: '1', label: 'Rajesh Sharma' },
            { value: '2', label: 'Priya Das' },
            { value: '3', label: 'Amit Kumar' }
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
            toast.warning("Please assign at least one district access permission.");
            return;
        }

        const finalPayload = {
            ...data,
            distNgoId: data.distNgo.value,
            acctHeadId: data.acctHead.value,
            acctNameId: data.acctName.value,
            assignedDistricts: selectedDistricts
        };

        console.log("🚀 READY TO SEND TO DB:", finalPayload);
        toast.success("UI Form Validated! Check console for Payload.");
        
        // reset();
        // setSelectedDistricts([]);
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
                        
                        {/* --- ROW 1: THE THREE DROPDOWNS --- */}
                        <h6 style={styles.sectionHeader}>1. Assign Role & Identity</h6>
                        <div style={{ ...styles.formGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>District NGO Name <span style={{ color: '#ff3e1d' }}>*</span></label>
                                <Controller name="distNgo" control={control} render={({ field }) => (
                                    <Select 
                                        {...field} 
                                        options={dbDistNgos} 
                                        placeholder="Select Dist NGO..." 
                                        styles={styles.selectStyles(!!errors.distNgo)} 
                                    />
                                )} />
                                {errors.distNgo && <p style={styles.errorText}>{errors.distNgo.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Account Head (Role) <span style={{ color: '#ff3e1d' }}>*</span></label>
                                <Controller name="acctHead" control={control} render={({ field }) => (
                                    <Select 
                                        {...field} 
                                        options={dbAcctHeads} 
                                        placeholder="Select Acct Head..." 
                                        styles={styles.selectStyles(!!errors.acctHead)} 
                                        isDisabled={!watchedDistNgo}
                                    />
                                )} />
                                {errors.acctHead && <p style={styles.errorText}>{errors.acctHead.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Account Name (Person) <span style={{ color: '#ff3e1d' }}>*</span></label>
                                <Controller name="acctName" control={control} render={({ field }) => (
                                    <Select 
                                        {...field} 
                                        options={dbAcctNames} 
                                        placeholder="Select Acct Name..." 
                                        styles={styles.selectStyles(!!errors.acctName)} 
                                        isDisabled={!watchedDistNgo}
                                    />
                                )} />
                                {errors.acctName && <p style={styles.errorText}>{errors.acctName.message}</p>}
                            </div>
                        </div>

                        {/* --- ROW 2: LOGIN CREDENTIALS --- */}
                        <h6 style={styles.sectionHeader}>2. Login Access Credentials</h6>
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

                        {/* --- ROW 3: MULTI-DISTRICT CHECKBOX MATRIX --- */}
                        <div style={{ 
                            marginTop: '40px', 
                            padding: '24px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px', 
                            border: '1px solid #d9dee3' 
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h6 style={{ margin: 0, fontSize: '1rem', color: '#566a7f' }}>
                                        3. Manage Data Visibility (Permission Matrix)
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
                            <button type="submit" style={styles.btnPrimary}>Create Access Rule</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AccessControl;