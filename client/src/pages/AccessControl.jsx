import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "bootstrap/dist/css/bootstrap.min.css";

import { styles, FormInput } from '../config/constants';
import { PasswordInput } from '../components/AccountSharedUtils';

// ==========================================
// 1. VALIDATION SCHEMA
// ==========================================
const accessSchema = z.object({
    acctHead: z.object({ value: z.any(), label: z.string() }, { required_error: "Please select an Account Head (Role)" }),
    
    // Parent Lineage
    stateNgo: z.object({ value: z.any(), label: z.string(), stateName: z.string(), distName: z.string() }).nullable().optional(),
    distNgo: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    supervisor: z.object({ value: z.any(), label: z.string() }).nullable().optional(),
    asthaDidi: z.object({ value: z.any(), label: z.string() }).nullable().optional(),

    // Identity & Location
    state: z.object({ value: z.any(), label: z.string() }, { required_error: "State is required" }),
    district: z.object({ value: z.any(), label: z.string() }, { required_error: "District is required" }),
    entityName: z.string().optional(),
    acctName: z.string().min(2, "Account Name is required"),
    
    // Login
    userName: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const AccessControl = () => {
    // ==========================================
    // 2. STATE 
    // ==========================================
    const [dbAcctHeads, setDbAcctHeads] = useState([]);
    const [dbStateNgos, setDbStateNgos] = useState([]);
    const [dbDistNgos, setDbDistNgos] = useState([]);
    const [dbSupervisors, setDbSupervisors] = useState([]);
    const [dbAsthaDidis, setDbAsthaDidis] = useState([]);
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState([]);

    const [accessRecords, setAccessRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(accessSchema),
        mode: 'onChange',
        defaultValues: {
            acctHead: null, stateNgo: null, distNgo: null, supervisor: null, asthaDidi: null,
            state: null, district: null, entityName: '', acctName: '', userName: '', password: ''
        }
    });

    const watchedRole = watch('acctHead');
    const watchedStateNgo = watch('stateNgo');

    const roleValue = watchedRole?.value;
    const showStateNgo = roleValue === 'DIST_ADMIN' || roleValue === 'SUPERVISOR' || roleValue === 'ASTHA_DIDI' || roleValue === 'ASTHA_MAA';
    const showDistNgo = roleValue === 'SUPERVISOR' || roleValue === 'ASTHA_DIDI' || roleValue === 'ASTHA_MAA';
    const showSupervisor = roleValue === 'ASTHA_DIDI' || roleValue === 'ASTHA_MAA';
    const showAsthaDidi = roleValue === 'ASTHA_MAA';
    const showEntityName = roleValue === 'DIST_ADMIN'; 

    // ==========================================
    // 3. INITIALIZATION (MOCK DATA)
    // ==========================================
    useEffect(() => {
        setDbAcctHeads([
            { value: 'DIST_ADMIN', label: 'District Administrator' },
            { value: 'SUPERVISOR', label: 'Supervisor' },
            { value: 'ASTHA_DIDI', label: 'Astha Didi' },
            { value: 'ASTHA_MAA', label: 'Astha Maa' }
        ]);
        
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

        setAccessRecords([
            { id: 1, role: 'District Administrator', motherNgo: 'Mother NGO India', distNgo: 'Birbhum Welfare Society', state: 'West Bengal', district: 'Birbhum, Bankura', acctName: 'Rajesh Sharma', userName: 'rajesh_admin' },
            { id: 2, role: 'Supervisor', motherNgo: 'Mother NGO India', distNgo: 'Birbhum Welfare Society', state: 'West Bengal', district: 'Birbhum', acctName: 'Sita Roy', userName: 'sita_sup' },
            { id: 3, role: 'Astha Maa', motherNgo: 'Mother NGO India', distNgo: 'Kolkata Care', state: 'West Bengal', district: 'Kolkata', acctName: 'Mita Devi', userName: 'mita_maa' }
        ]);
    }, []);

    // ==========================================
    // 4. TABLE SORTING & FILTERING
    // ==========================================
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredRecords = useMemo(() => {
        let filtered = accessRecords;
        if (searchTerm.trim()) {
            const lowercasedSearch = searchTerm.toLowerCase();
            filtered = accessRecords.filter(record => 
                Object.values(record).some(val => 
                    val && val.toString().toLowerCase().includes(lowercasedSearch)
                )
            );
        }

        if (sortConfig.key !== null) {
            filtered.sort((a, b) => {
                const valA = a[sortConfig.key] || "";
                const valB = b[sortConfig.key] || "";
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [accessRecords, searchTerm, sortConfig]);

    // ✅ FIXED: Replaced lucide-react icons with native unicode symbols to prevent build errors
    const renderSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return <span className="ms-1 text-muted" style={{fontSize:'12px'}}>↕</span>;
        if (sortConfig.direction === 'ascending') return <span className="ms-1 text-primary" style={{fontSize:'14px'}}>↑</span>;
        return <span className="ms-1 text-primary" style={{fontSize:'14px'}}>↓</span>;
    };

    // ==========================================
    // 5. EVENT HANDLERS
    // ==========================================
    const handleDistrictToggle = (district) => {
        setSelectedDistricts(prev => prev.includes(district) ? prev.filter(d => d !== district) : [...prev, district]);
    };

    const handleSelectAllDistricts = () => {
        setSelectedDistricts(selectedDistricts.length === availableDistricts.length ? [] : [...availableDistricts]);
    };

    const handleResetForm = () => {
        reset();
        setSelectedDistricts([]);
    };

    const onSubmit = (data) => {
        if (selectedDistricts.length === 0 && (roleValue === 'DIST_ADMIN' || roleValue === 'SUPERVISOR')) {
            toast.warning("Please assign at least one district access permission in the matrix.");
            return;
        }

        const finalPayload = {
            ...data,
            motherNgoState: watchedStateNgo?.stateName || null,
            motherNgoDistrict: watchedStateNgo?.distName || null,
            assignedDistricts: selectedDistricts
        };

        console.log("🚀 READY TO SEND TO DB:", finalPayload);
        toast.success(`Access Rule Created for ${watchedRole.label}!`);
        
        setAccessRecords(prev => [{
            id: Date.now(),
            role: data.acctHead.label,
            motherNgo: data.stateNgo?.label || 'N/A',
            distNgo: data.distNgo?.label || data.entityName || 'N/A',
            state: data.state.label,
            district: selectedDistricts.length > 0 ? selectedDistricts.join(', ') : data.district.label,
            acctName: data.acctName,
            userName: data.userName
        }, ...prev]);

        handleResetForm();
    };

    const onError = () => {
        toast.error("Please fill in all required red fields.");
    };

    const customSelectStyles = (hasError) => ({
        control: (base) => ({
            ...base,
            minHeight: '31px',
            height: '31px',
            fontSize: '0.875rem',
            borderColor: hasError ? '#dc3545' : '#ced4da',
            boxShadow: 'none',
            '&:hover': { borderColor: hasError ? '#dc3545' : '#86b7fe' }
        }),
        valueContainer: (base) => ({ ...base, padding: '0 8px' }),
        input: (base) => ({ ...base, margin: 0, padding: 0 }),
        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (base) => ({ ...base, padding: '4px' }),
        menu: (base) => ({ ...base, zIndex: 9999 })
    });

    return (
        <div className="emp-wrapper">
            <ToastContainer autoClose={3000} pauseOnHover={false} />
            
            <style>{`
                .emp-wrapper { background-color: #f5f5f9; min-height: 100vh; padding: 20px; font-family: "Public Sans", sans-serif; }
                .emp-card { background: #fff; border: none; border-radius: 8px; box-shadow: 0 2px 6px 0 rgba(67, 89, 113, 0.12); width: 100%; margin-bottom: 24px; overflow: hidden; }
                .emp-card-header { background-color: #0E87CC; color: white; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
                .emp-card-body { padding: 1.5rem; }
                .emp-card-footer { background-color: #f8f9fa; padding: 1rem 1.5rem; border-top: 1px solid #e9ecef; display: flex; justify-content: flex-end; gap: 0.5rem; }
                .emp-label { font-weight: 600; font-size: 0.8rem; margin-bottom: 0.25rem; color: #566a7f; display: block; text-transform: uppercase; letter-spacing: 0.25px;}
                p.PerInfo { background-color: #0E87CC; color: whitesmoke; padding: 8px 12px; font-weight: bold; border-radius: 4px; font-size: 0.95rem; margin-bottom: 16px; margin-top: 24px; }
                .cursor-pointer { cursor: pointer; }
                .sortable-header:hover { background-color: #e9ecef !important; transition: background-color 0.2s; }
                .error-text { color: #dc3545; font-size: 0.75rem; margin-top: 4px; margin-bottom: 0; }
                .matrix-container { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 16px; margin-top: 16px; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0 text-dark" style={{fontSize: '1.75rem'}}>Access Control Manager</h2>
                    <p className="text-muted mb-0">Role & Permission Matrix Configuration</p>
                </div>
            </div>

            <div className="emp-card">
                <div className="emp-card-header">
                    <h5 className="mb-0 fw-bold d-flex align-items-center">
                        <span className="me-2">🔐</span> Registration & Permission Form
                    </h5>
                </div>

                <div className="emp-card-body">
                    <form id="accessForm" onSubmit={handleSubmit(onSubmit, onError)} className="row g-3">
                        
                        <div className="col-md-4">
                            <label className="emp-label">Account Head (Target Role) <span className="text-danger">*</span></label>
                            <Controller name="acctHead" control={control} render={({ field }) => (
                                <Select {...field} options={dbAcctHeads} placeholder="Select Role..." styles={customSelectStyles(!!errors.acctHead)} />
                            )} />
                            {errors.acctHead && <p className="error-text">{errors.acctHead.message}</p>}
                        </div>

                        {watchedRole && (
                            <>
                                <div className="col-12">
                                    <p className="PerInfo">1. Parent Lineage Tracking (Organization Context)</p>
                                </div>
                                
                                {showStateNgo && (
                                    <>
                                        <div className="col-md-4">
                                            <label className="emp-label">State NGO (Mother) <span className="text-danger">*</span></label>
                                            <Controller name="stateNgo" control={control} render={({ field }) => (
                                                <Select {...field} options={dbStateNgos} placeholder="Select Mother NGO..." styles={customSelectStyles(false)} isClearable />
                                            )} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="emp-label">Mother NGO State</label>
                                            <input type="text" className="form-control form-control-sm bg-light text-muted" value={watchedStateNgo ? watchedStateNgo.stateName : ''} placeholder="Auto-fetched..." readOnly />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="emp-label">Mother NGO District</label>
                                            <input type="text" className="form-control form-control-sm bg-light text-muted" value={watchedStateNgo ? watchedStateNgo.distName : ''} placeholder="Auto-fetched..." readOnly />
                                        </div>
                                    </>
                                )}

                                {showDistNgo && (
                                    <div className="col-md-4">
                                        <label className="emp-label">District NGO <span className="text-danger">*</span></label>
                                        <Controller name="distNgo" control={control} render={({ field }) => (
                                            <Select {...field} options={dbDistNgos} placeholder="Select Dist NGO..." styles={customSelectStyles(false)} isClearable />
                                        )} />
                                    </div>
                                )}

                                {showSupervisor && (
                                    <div className="col-md-4">
                                        <label className="emp-label">Supervisor <span className="text-danger">*</span></label>
                                        <Controller name="supervisor" control={control} render={({ field }) => (
                                            <Select {...field} options={dbSupervisors} placeholder="Select Supervisor..." styles={customSelectStyles(false)} isClearable />
                                        )} />
                                    </div>
                                )}

                                {showAsthaDidi && (
                                    <div className="col-md-4">
                                        <label className="emp-label">Astha Didi <span className="text-danger">*</span></label>
                                        <Controller name="asthaDidi" control={control} render={({ field }) => (
                                            <Select {...field} options={dbAsthaDidis} placeholder="Select Astha Didi..." styles={customSelectStyles(false)} isClearable />
                                        )} />
                                    </div>
                                )}
                            </>
                        )}

                        {watchedRole && (
                            <>
                                <div className="col-12">
                                    <p className="PerInfo" style={{backgroundColor: '#659EC7'}}>2. Assign Identity & Location</p>
                                </div>
                                
                                <div className="col-md-3">
                                    <label className="emp-label">State <span className="text-danger">*</span></label>
                                    <Controller name="state" control={control} render={({ field }) => (
                                        <Select {...field} options={dbStates} placeholder="Select State..." styles={customSelectStyles(!!errors.state)} isClearable />
                                    )} />
                                    {errors.state && <p className="error-text">{errors.state.message}</p>}
                                </div>

                                <div className="col-md-3">
                                    <label className="emp-label">District <span className="text-danger">*</span></label>
                                    <Controller name="district" control={control} render={({ field }) => (
                                        <Select {...field} options={dbDistricts} placeholder="Select District..." styles={customSelectStyles(!!errors.district)} isClearable />
                                    )} />
                                    {errors.district && <p className="error-text">{errors.district.message}</p>}
                                </div>

                                {showEntityName && (
                                    <div className="col-md-3">
                                        <label className="emp-label">District NGO Name <span className="text-danger">*</span></label>
                                        <Controller name="entityName" control={control} render={({ field }) => (
                                            <input type="text" className={`form-control form-control-sm ${errors.entityName ? 'is-invalid' : ''}`} placeholder="Enter NGO Name" {...field} />
                                        )} />
                                        {errors.entityName && <p className="error-text">{errors.entityName.message}</p>}
                                    </div>
                                )}

                                <div className="col-md-3">
                                    <label className="emp-label">Account Name (Person) <span className="text-danger">*</span></label>
                                    <Controller name="acctName" control={control} render={({ field }) => (
                                        <input type="text" className={`form-control form-control-sm ${errors.acctName ? 'is-invalid' : ''}`} placeholder="Enter Person's Name" {...field} />
                                    )} />
                                    {errors.acctName && <p className="error-text">{errors.acctName.message}</p>}
                                </div>
                            </>
                        )}

                        {watchedRole && (
                            <>
                                <div className="col-12">
                                    <p className="PerInfo" style={{backgroundColor: '#BAB86C'}}>3. Login Access Credentials</p>
                                </div>
                                <div className="col-md-4">
                                    <label className="emp-label">User Name (For Login) <span className="text-danger">*</span></label>
                                    <Controller name="userName" control={control} render={({ field }) => (
                                        <input type="text" autoComplete="off" className={`form-control form-control-sm ${errors.userName ? 'is-invalid' : ''}`} placeholder="Enter username" {...field} />
                                    )} />
                                    {errors.userName && <p className="error-text">{errors.userName.message}</p>}
                                </div>
                                <div className="col-md-4">
                                    <label className="emp-label">Password <span className="text-danger">*</span></label>
                                    <Controller name="password" control={control} render={({ field }) => (
                                        <input type="password" autoComplete="new-password" className={`form-control form-control-sm ${errors.password ? 'is-invalid' : ''}`} placeholder="Set secure password" {...field} />
                                    )} />
                                    {errors.password && <p className="error-text">{errors.password.message}</p>}
                                </div>
                            </>
                        )}

                        {watchedRole && (roleValue === 'DIST_ADMIN' || roleValue === 'SUPERVISOR') && (
                            <div className="col-12">
                                <div className="matrix-container">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h6 className="fw-bold mb-1" style={{ color: '#0E87CC' }}>4. Data Visibility (Permission Matrix)</h6>
                                            <small className="text-muted">Select which districts this user is allowed to access and manage below them.</small>
                                        </div>
                                        <button type="button" onClick={handleSelectAllDistricts} className="btn btn-sm btn-outline-primary">
                                            {selectedDistricts.length === availableDistricts.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="row g-2">
                                        {availableDistricts.map(district => (
                                            <div key={district} className="col-6 col-md-3 col-lg-2">
                                                <div className={`form-check p-2 rounded border ${selectedDistricts.includes(district) ? 'bg-primary bg-opacity-10 border-primary' : 'bg-white'}`}>
                                                    <input 
                                                        className="form-check-input ms-1 cursor-pointer" 
                                                        type="checkbox" 
                                                        id={`chk-${district}`}
                                                        checked={selectedDistricts.includes(district)}
                                                        onChange={() => handleDistrictToggle(district)}
                                                    />
                                                    <label className="form-check-label ms-2 cursor-pointer w-100" htmlFor={`chk-${district}`} style={{fontSize: '0.85rem', fontWeight: '500'}}>
                                                        {district}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {watchedRole && (
                    <div className="emp-card-footer">
                        <button type="button" className="btn btn-secondary px-4 shadow-sm" onClick={handleResetForm}>Clear Form</button>
                        <button type="submit" form="accessForm" className="btn btn-primary px-5 shadow-sm fw-bold">Save Access Rule</button>
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* TABLE SECTION */}
            {/* ========================================== */}
            <div className="emp-card mt-4">
                <div className="emp-card-header bg-dark">
                    <h5 className="mb-0 fw-bold text-white d-flex align-items-center">
                        <span className="me-2">📋</span> Registered Access Directory
                    </h5>
                </div>
                
                <div className="emp-card-body p-0">
                    <div className="p-3 border-bottom d-flex justify-content-end bg-light">
                        <div className="position-relative" style={{ width: '300px' }}>
                            {/* ✅ FIXED: Native Unicode Search Icon instead of Lucide */}
                            <span className="position-absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                            <input
                                type="text"
                                className="form-control form-control-sm ps-5"
                                placeholder="Search all records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 bg-white">
                            <thead className="table-light text-uppercase" style={{ fontSize: "0.85rem" }}>
                                <tr>
                                    <th className="py-3 ps-4 cursor-pointer sortable-header" onClick={() => handleSort('role')}>Role {renderSortIcon('role')}</th>
                                    <th className="py-3 cursor-pointer sortable-header" onClick={() => handleSort('motherNgo')}>Mother NGO {renderSortIcon('motherNgo')}</th>
                                    <th className="py-3 cursor-pointer sortable-header" onClick={() => handleSort('distNgo')}>District NGO {renderSortIcon('distNgo')}</th>
                                    <th className="py-3 cursor-pointer sortable-header" onClick={() => handleSort('state')}>State {renderSortIcon('state')}</th>
                                    <th className="py-3 cursor-pointer sortable-header" onClick={() => handleSort('district')}>Assigned District(s) {renderSortIcon('district')}</th>
                                    <th className="py-3 cursor-pointer sortable-header" onClick={() => handleSort('acctName')}>Account Name {renderSortIcon('acctName')}</th>
                                    <th className="py-3 pe-4 cursor-pointer sortable-header" onClick={() => handleSort('userName')}>Username {renderSortIcon('userName')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted fw-bold">
                                            {searchTerm ? "No records match your search criteria." : "No access records found. Create one above!"}
                                        </td>
                                    </tr>
                                ) : (
                                    sortedAndFilteredRecords.map((record) => (
                                        <tr key={record.id}>
                                            <td className="ps-4 text-primary fw-bold">{record.role}</td>
                                            <td className="text-dark">{record.motherNgo}</td>
                                            <td className="text-dark">{record.distNgo}</td>
                                            <td className="text-dark">{record.state}</td>
                                            <td>
                                                {record.district.includes(',') ? (
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                                                        {record.district} (Multiple)
                                                    </span>
                                                ) : (
                                                    <span className="text-dark">{record.district}</span>
                                                )}
                                            </td>
                                            <td className="fw-bold">{record.acctName}</td>
                                            <td className="pe-4 text-muted">{record.userName}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessControl;