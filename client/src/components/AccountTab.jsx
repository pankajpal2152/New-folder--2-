import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { styles, API_BASE_URL } from '../config/constants';
import { getSafeUser } from './AccountSharedUtils';

import DistrictAdminForm from './forms/DistrictAdminForm';
import SupervisorForm from './forms/SupervisorForm';
import AsthaMaaForm from './forms/AsthaMaaForm';
import AsthaDidiForm from './forms/AsthaDidiForm';

import DistrictAdminTable from './DistrictAdminTable';
import SupervisorTable from './SupervisorTable';
import AsthaMaaTable from './AsthaMaaTable';
import MembersTable from './AsthaDidiTable';

const AccountTab = () => {
    const [appUserRole, setAppUserRole] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [adminActiveView, setAdminActiveView] = useState('');

    const [filterMotherNgo, setFilterMotherNgo] = useState(null);
    const [filterState, setFilterState] = useState(null);
    const [filterDistrict, setFilterDistrict] = useState(null);
    const [filterSupervisor, setFilterSupervisor] = useState(null);

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

        // ✅ Pointing directly to the newly created strict filter backend API endpoints
        fetch(`${API_BASE_URL}/filter/states`).then(res => res.json()).then(data => {
            setDbStates(data.map(s => ({ value: s.StateId, label: s.StateName })));
        }).catch(() => { });

        fetch(`${API_BASE_URL}/districtadmin`).then(res => res.json()).then(data => {
            setDbMotherNgos(data.map(n => ({ 
                value: n.DistNGORegId, 
                label: n.DistNGOName, 
                districtName: n.DistNGODistName,
                stateName: n.DistNGOStateName
            })));
        }).catch(() => { });

        fetch(`${API_BASE_URL}/supervisor`).then(res => res.json()).then(data => {
            setDbSupervisors(data.map(s => ({ 
                value: s.SupRegId, 
                label: s.SupName, 
                userSignUpId: s.UserSignUpId || s.SupRegId,
                stateName: s.SupStateName,
                distName: s.SupDistName,
                motherNgoId: s.DistNGORegId
            })));
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (filterState) {
            // ✅ Pointing to the strict district filter route to ensure data is accurate
            fetch(`${API_BASE_URL}/filter/districts/${filterState.value}`).then(res => res.json()).then(data => {
                setDbDistricts(data.map(d => ({ value: d.DistId, label: d.DistName })));
            }).catch(() => { });
        } else {
            setDbDistricts([]);
            setFilterDistrict(null);
        }
    }, [filterState]);

    const filteredStateOptions = useMemo(() => {
        if (filterMotherNgo && filterMotherNgo.stateName) {
            const ngoState = filterMotherNgo.stateName.trim().toLowerCase();
            return dbStates.filter(s => s.label.trim().toLowerCase() === ngoState);
        }
        return dbStates;
    }, [dbStates, filterMotherNgo]);

    const filteredDistrictOptions = useMemo(() => {
        if (filterMotherNgo && filterMotherNgo.districtName) {
            const ngoDist = filterMotherNgo.districtName.trim().toLowerCase();
            return dbDistricts.filter(d => d.label.trim().toLowerCase() === ngoDist);
        }
        return dbDistricts;
    }, [dbDistricts, filterMotherNgo]);

    const filteredSupervisorOptions = useMemo(() => {
        return dbSupervisors.filter(sup => {
            let matches = true;
            
            if (filterMotherNgo) {
                const supDist = sup.distName ? String(sup.distName).trim().toLowerCase() : "";
                const ngoDist = filterMotherNgo.districtName ? String(filterMotherNgo.districtName).trim().toLowerCase() : "";
                
                const idMatch = String(sup.motherNgoId) === String(filterMotherNgo.value);
                const distMatch = supDist !== "" && supDist === ngoDist;
                
                if (!idMatch && !distMatch) {
                    matches = false;
                }
            }
            
            if (filterState) {
                const supState = sup.stateName ? String(sup.stateName).trim().toLowerCase() : "";
                const fState = String(filterState.label).trim().toLowerCase();
                if (supState !== fState) matches = false;
            }
            
            if (filterDistrict) {
                const supDist = sup.distName ? String(sup.distName).trim().toLowerCase() : "";
                const fDist = String(filterDistrict.label).trim().toLowerCase();
                if (supDist !== fDist) matches = false;
            }
            
            return matches;
        });
    }, [dbSupervisors, filterMotherNgo, filterState, filterDistrict]);

    const handleMotherNgoChange = (selected) => {
        setFilterMotherNgo(selected);
        setFilterState(null);
        setFilterDistrict(null);
        setFilterSupervisor(null);
    };

    const handleStateChange = (selected) => {
        setFilterState(selected);
        setFilterDistrict(null);
        setFilterSupervisor(null);
    };

    const handleDistrictChange = (selected) => {
        setFilterDistrict(selected);
        setFilterSupervisor(null);
    };

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

    const canSeeFilters = appUserRole === 'State Super Administrator' || appUserRole.toLowerCase() === 'developer' || appUserRole === 'District Administrator' || appUserRole === 'Supervisor';

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

                    {canSeeFilters && (
                        <>
                            {['Supervisor', 'Astha Maa', 'Astha Didi'].includes(adminActiveView) && (
                                <div style={{ width: '100%', maxWidth: '200px' }}>
                                    <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Mother NGO</label>
                                    <Select options={dbMotherNgos} value={filterMotherNgo} onChange={handleMotherNgoChange} isClearable placeholder="All Mother NGOs" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                                </div>
                            )}

                            <div style={{ width: '100%', maxWidth: '150px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>State</label>
                                <Select options={filteredStateOptions} value={filterState} onChange={handleStateChange} isClearable placeholder="All States" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div>

                            <div style={{ width: '100%', maxWidth: '150px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>District</label>
                                <Select options={filteredDistrictOptions} value={filterDistrict} onChange={handleDistrictChange} isDisabled={!filterState} isClearable placeholder="All Districts" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div>

                            {['Astha Maa', 'Astha Didi'].includes(adminActiveView) && (
                                <div style={{ width: '100%', maxWidth: '200px' }}>
                                    <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Supervisor</label>
                                    <Select options={filteredSupervisorOptions} value={filterSupervisor} onChange={setFilterSupervisor} isClearable placeholder="All Supervisors" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {adminActiveView === 'District Administrator' || adminActiveView === 'State Super Administrator' ? (
                <>
                    <DistrictAdminForm onSuccess={handleFormSuccess} />
                    <DistrictAdminTable refreshTrigger={refreshTrigger} externalFilters={{ filterState, filterDistrict }} />
                </>
            ) : adminActiveView === 'Supervisor' ? (
                <>
                    <SupervisorForm onSuccess={handleFormSuccess} />
                    <SupervisorTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict }} />
                </>
            ) : adminActiveView === 'Astha Maa' ? (
                <>
                    <AsthaMaaForm onSuccess={handleFormSuccess} />
                    <AsthaMaaTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor }} />
                </>
            ) : (
                <>
                    <AsthaDidiForm onSuccess={handleFormSuccess} />
                    <MembersTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor }} />
                </>
            )}
        </>
    );
};

export default AccountTab;