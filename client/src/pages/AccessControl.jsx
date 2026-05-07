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
    acctHead: z.object({ value: z.any(), label: z.string() }, { required_error: "Please select an Account Head (Role)" }),
    
    // Parent Lineage (Context)
    stateNgo: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    distNgo: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    supervisor: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    asthaDidi: z.object({ value: z.any(), label: z.string() }).nullable().optional(),

    // Identity & Location
    state: z.object({ value: z.any(), label: z.string() }, { required_error: "State is required" }),
    district: z.object({ value: z.any(), label: z.string() }, { required_error: "District is required" }),
    entityName: z.string().optional(), // For District NGO Name if applicable
    // acctName: z.string().min(2, "Account Name (Person) is required"),
    
    // Login
    userName: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const AccessControl = () => {
    // ==========================================
    // 2. STATE (Data & Selections)
    // ==========================================
    const [dbAcctHeads, setDbAcctHeads] = useState([]);
    
    // Parent Hierarchy Data
    const [dbStateNgos, setDbStateNgos] = useState([]);
    const [dbDistNgos, setDbDistNgos] = useState([]);
    const [dbSupervisors, setDbSupervisors] = useState([]);
    const [dbAsthaDidis, setDbAsthaDidis] = useState([]);
    
    // Location Data
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    
    // Checkbox state for multi-district assignment
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState([]);

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(accessSchema),
        mode: 'onChange',
        defaultValues: {
            acctHead: null,
            stateNgo: null, distNgo: null, supervisor: null, asthaDidi: null,
            state: null, district: null,
            entityName: '', acctName: '',
            userName: '', password: ''
        }
    });

    // Watchers for dynamic UI rendering
    const watchedRole = watch('acctHead');
    const watchedStateNgo = watch('stateNgo');

    // Determine which parent dropdowns to show based on selected role
    const roleValue = watchedRole?.value;
    const showStateNgo = roleValue === 'DIST_ADMIN' || roleValue === 'SUPERVISOR' || roleValue === 'ASTHA_DIDI' || roleValue === 'ASTHA_MAA';
    const showDistNgo = roleValue === 'SUPERVISOR' || roleValue === 'ASTHA_DIDI' || roleValue === 'ASTHA_MAA';
    const showSupervisor = roleValue === 'ASTHA_DIDI' || roleValue === 'ASTHA_MAA';
    const showAsthaDidi = roleValue === 'ASTHA_MAA';
    const showEntityName = roleValue === 'DIST_ADMIN'; // Only show "District NGO Name" if creating a Dist Admin

    // ==========================================
    // 3. UI MOCK DATA INITIALIZATION
    // ==========================================
    useEffect(() => {
        setDbAcctHeads([
            { value: 'DIST_ADMIN', label: 'District Administrator' },
            { value: 'SUPERVISOR', label: 'Supervisor' },
            { value: 'ASTHA_DIDI', label: 'Astha Didi' },
            { value: 'ASTHA_MAA', label: 'Astha Maa' }
        ]);
        
        // Mock Mother NGOs WITH their associated state/district data to auto-fill
        setDbStateNgos([
            { value: '1', label: 'Mother NGO India', stateName: 'West Bengal', distName: 'Kolkata' },
            { value: '2', label: 'State Level Care Foundation', stateName: 'Maharashtra', distName: 'Mumbai' }
        ]);
        
        setDbDistNgos([{ value: '1', label: 'Birbhum Welfare Society' }, { value: '2', label: 'Kolkata Care' }]);
        setDbSupervisors([{ value: '1', label: 'Ramesh Singh' }, { value: '2', label: 'Sita Roy' }]);
        setDbAsthaDidis([{ value: '1', label: 'Anjali Das' }, { value: '2', label: 'Priya Sen' }]);
        
        setDbStates([{ value: 'WB', label: 'West Bengal' }, { value: 'MH', label: 'Maharashtra' }]);
        setDbDistricts([{ value: 'BIR', label: 'Birbhum' }, { value: 'KOL', label: 'Kolkata' }, { value: 'BAN', label: 'Bankura' }]);
        
        setAvailableDistricts(['Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kolkata']);
    }, []);

    // ==========================================
    // 4. EVENT HANDLERS
    // ==========================================
    const handleDistrictToggle = (district) => {
        setSelectedDistricts(prev => prev.includes(district) ? prev.filter(d => d !== district) : [...prev, district]);
    };

    const handleSelectAllDistricts = () => {
        setSelectedDistricts(selectedDistricts.length === availableDistricts.length ? [] : [...availableDistricts]);
    };

    const onSubmit = (data) => {
        if (selectedDistricts.length === 0 && (roleValue === 'DIST_ADMIN' || roleValue === 'SUPERVISOR')) {
            toast.warning("Please assign at least one district access permission in the matrix.");
            return;
        }

        const finalPayload = {
            ...data,
            // Include the auto-fetched Mother NGO details in the payload if needed
            motherNgoState: watchedStateNgo?.stateName || null,
            motherNgoDistrict: watchedStateNgo?.distName || null,
            assignedDistricts: selectedDistricts
        };

        console.log("🚀 READY TO SEND TO DB:", finalPayload);
        toast.success(`Access Rule Validated for ${watchedRole.label}! Check console for Payload.`);
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
                        🔐 Complex Nested Access Control Panel
                    </h5>
                </div>

                <div style={styles.cardBody}>
                    <form onSubmit={handleSubmit(onSubmit, onError)} autoComplete="off">
                        
                        {/* --- TOP: SELECT ROLE --- */}
                        <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
                            <label style={styles.label}>Account Head (Target Role to Assign) <span style={{ color: '#ff3e1d' }}>*</span></label>
                            <Controller name="acctHead" control={control} render={({ field }) => (
                                <Select 
                                    {...field} 
                                    options={dbAcctHeads} 
                                    placeholder="Select Role..." 
                                    styles={styles.selectStyles(!!errors.acctHead)} 
                                />
                            )} />
                            {errors.acctHead && <p style={styles.errorText}>{errors.acctHead.message}</p>}
                        </div>

                        {/* --- ROW 1: PARENT LINEAGE (DYNAMIC CONTEXT) --- */}
                        {watchedRole && (
                            <>
                                <h6 style={styles.sectionHeader}>1. Parent Lineage Tracking (Organization Context)</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                                    
                                    {showStateNgo && (
                                        <>
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>State NGO (Mother) <span style={{ color: '#ff3e1d' }}>*</span></label>
                                                <Controller name="stateNgo" control={control} render={({ field }) => (
                                                    <Select {...field} options={dbStateNgos} placeholder="Select Mother NGO..." styles={styles.selectStyles(false)} isClearable />
                                                )} />
                                            </div>

                                            {/* Auto-Fetched & Disabled State Dropdown */}
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>Mother NGO State</label>
                                                <Select 
                                                    value={watchedStateNgo ? { label: watchedStateNgo.stateName, value: 'locked' } : null} 
                                                    isDisabled={true} 
                                                    placeholder="Auto-fetched..." 
                                                    styles={styles.selectStyles(false)} 
                                                />
                                            </div>

                                            {/* Auto-Fetched & Disabled District Dropdown */}
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>Mother NGO District</label>
                                                <Select 
                                                    value={watchedStateNgo ? { label: watchedStateNgo.distName, value: 'locked' } : null} 
                                                    isDisabled={true} 
                                                    placeholder="Auto-fetched..." 
                                                    styles={styles.selectStyles(false)} 
                                                />
                                            </div>
                                        </>
                                    )}

                                    {showDistNgo && (
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>District NGO <span style={{ color: '#ff3e1d' }}>*</span></label>
                                            <Controller name="distNgo" control={control} render={({ field }) => (
                                                <Select {...field} options={dbDistNgos} placeholder="Select Dist NGO..." styles={styles.selectStyles(false)} isClearable />
                                            )} />
                                        </div>
                                    )}

                                    {showSupervisor && (
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Supervisor <span style={{ color: '#ff3e1d' }}>*</span></label>
                                            <Controller name="supervisor" control={control} render={({ field }) => (
                                                <Select {...field} options={dbSupervisors} placeholder="Select Supervisor..." styles={styles.selectStyles(false)} isClearable />
                                            )} />
                                        </div>
                                    )}

                                    {showAsthaDidi && (
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Astha Didi <span style={{ color: '#ff3e1d' }}>*</span></label>
                                            <Controller name="asthaDidi" control={control} render={({ field }) => (
                                                <Select {...field} options={dbAsthaDidis} placeholder="Select Astha Didi..." styles={styles.selectStyles(false)} isClearable />
                                            )} />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* --- ROW 2: IDENTITY & LOCATION --- */}
                        {watchedRole && (
                            <>
                                <h6 style={styles.sectionHeader}>2. Assign Identity & Location</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                                    
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>State <span style={{ color: '#ff3e1d' }}>*</span></label>
                                        <Controller name="state" control={control} render={({ field }) => (
                                            <Select {...field} options={dbStates} placeholder="Select State..." styles={styles.selectStyles(!!errors.state)} isClearable />
                                        )} />
                                        {errors.state && <p style={styles.errorText}>{errors.state.message}</p>}
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>District <span style={{ color: '#ff3e1d' }}>*</span></label>
                                        <Controller name="district" control={control} render={({ field }) => (
                                            <Select {...field} options={dbDistricts} placeholder="Select District..." styles={styles.selectStyles(!!errors.district)} isClearable />
                                        )} />
                                        {errors.district && <p style={styles.errorText}>{errors.district.message}</p>}
                                    </div>

                                    {showEntityName && (
                                        <Controller name="entityName" control={control} render={({ field }) => (
                                            <FormInput label={<>District NGO Name <span style={{ color: '#ff3e1d' }}>*</span></>} id="entityName" error={errors.entityName} placeholder="Enter District NGO Name" type="text" {...field} />
                                        )} />
                                    )}

                                    {/* <Controller name="acctName" control={control} render={({ field }) => (
                                        <FormInput label={<>Account Name (Person) <span style={{ color: '#ff3e1d' }}>*</span></>} id="acctName" error={errors.acctName} placeholder="Enter Person's Name" type="text" {...field} />
                                    )} /> */}
                                </div>
                            </>
                        )}

                        {/* --- ROW 3: LOGIN CREDENTIALS --- */}
                        {watchedRole && (
                            <>
                                <h6 style={styles.sectionHeader}>3. Login Access Credentials</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                                    <Controller name="userName" control={control} render={({ field }) => (
                                        <FormInput label={<>User Name (For Login) <span style={{ color: '#ff3e1d' }}>*</span></>} id="userName" error={errors.userName} placeholder="Enter unique username" type="text" autoComplete="off" {...field} />
                                    )} />
                                    
                                    <Controller name="password" control={control} render={({ field }) => (
                                        <PasswordInput label={<>Password <span style={{ color: '#ff3e1d' }}>*</span></>} id="password" error={errors.password} placeholder="Set secure password" autoComplete="new-password" {...field} />
                                    )} />
                                </div>
                            </>
                        )}

                        {/* --- ROW 4: MULTI-DISTRICT CHECKBOX MATRIX --- */}
                        {/* {watchedRole && (roleValue === 'DIST_ADMIN' || roleValue === 'SUPERVISOR') && (
                            <div style={{ marginTop: '40px', padding: '24px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #d9dee3' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h6 style={{ margin: 0, fontSize: '1rem', color: '#566a7f' }}>4. Manage Data Visibility (Permission Matrix)</h6>
                                        <p style={styles.hintText}>Select which districts this user is allowed to access and manage below them.</p>
                                    </div>
                                    <button type="button" onClick={handleSelectAllDistricts} style={{...styles.btnOutline, padding: '4px 12px', fontSize: '0.8rem'}}>
                                        {selectedDistricts.length === availableDistricts.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                    {availableDistricts.map(district => (
                                        <label key={district} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9375rem', color: '#697a8d', backgroundColor: selectedDistricts.includes(district) ? 'rgba(105, 108, 255, 0.1)' : '#fff', padding: '8px 12px', borderRadius: '6px', border: selectedDistricts.includes(district) ? '1px solid #696cff' : '1px solid #d9dee3', transition: '0.2s' }}>
                                            <input type="checkbox" checked={selectedDistricts.includes(district)} onChange={() => handleDistrictToggle(district)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                            {district}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )} */}

                        {/* --- SUBMIT BUTTON --- */}
                        {watchedRole && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                                <button type="button" style={{...styles.btnOutline, marginRight: '16px'}} onClick={() => reset()}>Reset Form</button>
                                <button type="submit" style={styles.btnPrimary}>Save Nested Access Rule</button>
                            </div>
                        )}

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AccessControl;