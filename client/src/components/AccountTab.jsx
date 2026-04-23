import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ✅ Added API_BASE_URL to fetch the filter dropdown data
import { styles, API_BASE_URL } from '../config/constants';
import { getSafeUser } from './AccountSharedUtils';

// Import Forms
import DistrictAdminForm from './forms/DistrictAdminForm';
import SupervisorForm from './forms/SupervisorForm';
import AsthaMaaForm from './forms/AsthaMaaForm';
import AsthaDidiForm from './forms/AsthaDidiForm';

// Import Split Tables
import DistrictAdminTable from './DistrictAdminTable';
import SupervisorTable from './SupervisorTable';
import AsthaMaaTable from './AsthaMaaTable';
import MembersTable from './AsthaDidiTable';

// ==========================================
// 7. ORCHESTRATOR COMPONENT
// ==========================================
const AccountTab = () => {
    const [appUserRole, setAppUserRole] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [adminActiveView, setAdminActiveView] = useState('');

    // ✅ New State for Astha Didi External Filters
    const [filterMotherNgo, setFilterMotherNgo] = useState(null);
    const [filterState, setFilterState] = useState(null);
    const [filterDistrict, setFilterDistrict] = useState(null);
    const [filterSupervisor, setFilterSupervisor] = useState(null);

    // ✅ New State for Dropdown Options
    const [dbMotherNgos, setDbMotherNgos] = useState([]);
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbSupervisors, setDbSupervisors] = useState([]);

    useEffect(() => {
        const user = getSafeUser();
        if (user) {
            const role = user.role || '';
            setAppUserRole(role);

            if (role === 'State Super Administrator' || role.toLowerCase() === 'developer') {
                setAdminActiveView('District Administrator');
            } else if (role === 'District Administrator') {
                setAdminActiveView('Supervisor');
            } else if (role === 'Supervisor' || role === 'Astha Didi') {
                setAdminActiveView('Astha Didi');
            } else {
                setAdminActiveView(role);
            }
        } else {
            setAppUserRole('');
        }

        // ✅ Fetch all global filter data on mount
        fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => {
            setDbStates(data.map(s => ({ value: s.StateId, label: s.StateName })));
        }).catch(() => { });

        fetch(`${API_BASE_URL}/districtadmin`).then(res => res.json()).then(data => {
            setDbMotherNgos(data.map(n => ({ value: n.DistNGORegId, label: n.DistNGOName, districtName: n.DistNGODistName })));
        }).catch(() => { });

        fetch(`${API_BASE_URL}/supervisor`).then(res => res.json()).then(data => {
            // Maps the supervisor data. userSignUpId acts as a fallback map to AsthaDidiCreatedByAuthRegId
            setDbSupervisors(data.map(s => ({ value: s.SupRegId, label: s.SupName, userSignUpId: s.UserSignUpId || s.SupRegId })));
        }).catch(() => { });
    }, []);

    // ✅ Fetch Districts dynamically when State changes
    useEffect(() => {
        if (filterState) {
            fetch(`${API_BASE_URL}/districts/${filterState.value}`).then(res => res.json()).then(data => {
                setDbDistricts(data.map(d => ({ value: d.DistId, label: d.DistName })));
            }).catch(() => { });
        } else {
            setDbDistricts([]);
            setFilterDistrict(null);
        }
    }, [filterState]);

    const handleFormSuccess = () => setRefreshTrigger(prev => prev + 1);

    if (appUserRole === null || adminActiveView === '') {
        return <div style={{ padding: '24px', color: '#697a8d' }}>Loading Interface...</div>;
    }

    let adminOptions = [];

    if (appUserRole === 'State Super Administrator') {
        adminOptions = [
            { value: 'District Administrator', label: 'District Administrator' },
            { value: 'Supervisor', label: 'Supervisor' },
            { value: 'Astha Didi', label: 'Astha Didi' },
            { value: 'Astha Maa', label: 'Astha Maa' },
        ];
    } else if (appUserRole.toLowerCase() === 'developer') {
        adminOptions = [
            { value: 'District Administrator', label: 'District Administrator' },
            { value: 'Supervisor', label: 'Supervisor' },
            { value: 'Astha Maa', label: 'Astha Maa' },
            { value: 'Astha Didi', label: 'Astha Didi' }
        ];
    } else if (appUserRole === 'District Administrator') {
        adminOptions = [
            { value: 'Supervisor', label: 'Supervisor' },
            { value: 'Astha Didi', label: 'Astha Didi' }
        ];
    } else if (appUserRole === 'Supervisor') {
        adminOptions = [
            { value: 'Astha Didi', label: 'Astha Didi' }
        ];
    } else if (appUserRole === 'Astha Didi') {
        adminOptions = [
            { value: 'Astha Maa', label: 'Astha Maa' }
        ];
    }

    return (
        <>
            <ToastContainer autoClose={3000} pauseOnHover={false} />

            {adminOptions.length > 0 && (
                <div style={{ ...styles.card, padding: '24px', marginBottom: '24px', overflow: 'visible', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', maxWidth: '250px' }}>
                        <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>
                            Select Role Entry / View <span style={{ color: '#ff3e1d' }}>*</span>
                        </label>
                        <Select
                            options={adminOptions}
                            value={adminOptions.find(o => o.value === adminActiveView)}
                            onChange={(selected) => setAdminActiveView(selected.value)}
                            styles={{
                                ...styles.selectStyles(false),
                                menuPortal: base => ({ ...base, zIndex: 99999 })
                            }}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            isSearchable={false}
                        />
                    </div>

                    {/* ✅ Custom Filter Dropdowns dynamically displayed beside the Role Selector */}
                    {/* FIX: Added 'Supervisor' to the allowed roles so it shows up for them too! */}
                    {adminActiveView === 'Astha Didi' && (appUserRole === 'State Super Administrator' || appUserRole.toLowerCase() === 'developer' || appUserRole === 'District Administrator' || appUserRole === 'Supervisor') && (
                        <>
                            {/* <div style={{ width: '100%', maxWidth: '200px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Mother NGO</label>
                                <Select options={dbMotherNgos} value={filterMotherNgo} onChange={setFilterMotherNgo} isClearable placeholder="All Mother NGOs" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div> */}
                            <div style={{ width: '100%', maxWidth: '150px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>State</label>
                                <Select options={dbStates} value={filterState} onChange={setFilterState} isClearable placeholder="All States" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div>
                            <div style={{ width: '100%', maxWidth: '150px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>District</label>
                                <Select options={dbDistricts} value={filterDistrict} onChange={setFilterDistrict} isDisabled={!filterState} isClearable placeholder="All Districts" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div>
                            <div style={{ width: '100%', maxWidth: '200px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Supervisor</label>
                                <Select options={dbSupervisors} value={filterSupervisor} onChange={setFilterSupervisor} isClearable placeholder="All Supervisors" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div>
                        </>
                    )}
                </div>
            )}

            {adminActiveView === 'District Administrator' || adminActiveView === 'State Super Administrator' ? (
                <>
                    <DistrictAdminForm onSuccess={handleFormSuccess} />
                    <DistrictAdminTable refreshTrigger={refreshTrigger} />
                </>
            ) : adminActiveView === 'Supervisor' ? (
                <>
                    <SupervisorForm onSuccess={handleFormSuccess} />
                    <SupervisorTable refreshTrigger={refreshTrigger} />
                </>
            ) : adminActiveView === 'Astha Maa' ? (
                <>
                    <AsthaMaaForm onSuccess={handleFormSuccess} />
                    <AsthaMaaTable refreshTrigger={refreshTrigger} />
                </>
            ) : (
                <>
                    <AsthaDidiForm onSuccess={handleFormSuccess} />
                    {/* Passed the external filters safely as props into the Table */}
                    <MembersTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor }} />
                </>
            )}
        </>
    );
};

export default AccountTab;