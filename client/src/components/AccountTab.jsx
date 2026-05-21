import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const AccountTab = () => {
    const [appUserRole, setAppUserRole] = useState(null);
    const [loggedInProfileId, setLoggedInProfileId] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [adminActiveView, setAdminActiveView] = useState('');

    const [filterMotherNgo, setFilterMotherNgo] = useState(null);
    const [filterState, setFilterState] = useState(null);
    const [filterDistrict, setFilterDistrict] = useState(null);
    const [filterSupervisor, setFilterSupervisor] = useState(null);
    const [filterAsthaDidi, setFilterAsthaDidi] = useState(null);

    const [dbMotherNgos, setDbMotherNgos] = useState([]);
    const [dbStates, setDbStates] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbSupervisors, setDbSupervisors] = useState([]);
    const [dbAsthaDidis, setDbAsthaDidis] = useState([]);

    useEffect(() => {
        const user = getSafeUser();
        if (user) {
            const role = user.role || user.UserSignUpRole || '';
            setAppUserRole(role);
            setLoggedInProfileId(user.ProfileRegId);

            if (role === 'State Super Administrator' || role.toLowerCase() === 'developer') {
                setAdminActiveView('District Administrator');
            } else if (role === 'District Administrator') {
                setAdminActiveView('Supervisor');
            } else if (role === 'Supervisor') {
                setAdminActiveView('Astha Didi');
            } else if (role === 'Astha Didi') {
                setAdminActiveView('Astha Maa');
            } else if (role === 'Astha Maa') {
                setAdminActiveView('Astha Maa');
            } else {
                setAdminActiveView('Astha Didi');
            }
        } else {
            setAppUserRole('Guest');
            setAdminActiveView('Guest');
        }

        fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => setDbStates(data.map(s => ({ value: s.StateId, label: s.StateName })))).catch(console.error);
        fetch(`${API_BASE_URL}/districtadmin`).then(res => res.json()).then(data => setDbMotherNgos(data.map(n => ({ value: n.DistNGORegId, label: n.DistNGOName, districtName: n.DistNGODistName, stateName: n.DistNGOStateName })))).catch(console.error);
        fetch(`${API_BASE_URL}/supervisor`).then(res => res.json()).then(data => setDbSupervisors(data.map(s => ({ value: s.SupRegId, label: s.SupName, userSignUpId: s.UserSignUpId || s.SupRegId, stateName: s.SupStateName, distName: s.SupDistName, motherNgoId: s.DistNGORegId })))).catch(console.error);
        fetch(`${API_BASE_URL}/asthadidi`).then(res => res.json()).then(data => setDbAsthaDidis(data.map(a => ({ value: a.AsthaDidiRegId, label: a.AsthaDidiUserName, stateName: a.AsthaDidiStateName, distName: a.AsthaDidiDistName, motherNgoId: a.DistNGORegId, supRegId: a.SupRegId, createdByAuthRegId: a.AsthaDidiCreatedByAuthRegId })))).catch(console.error);
    }, []);

    // AUTO-POPULATE FILTER FOR ASTHA DIDI
    useEffect(() => {
        if (appUserRole === 'Astha Didi' && dbAsthaDidis.length > 0 && loggedInProfileId && !filterAsthaDidi) {
            const myProfile = dbAsthaDidis.find(ad => String(ad.value) === String(loggedInProfileId));
            if (myProfile) {
                setFilterAsthaDidi({ value: myProfile.value, label: myProfile.label });
                setFilterMotherNgo({ value: myProfile.motherNgoId, label: 'Auto-Selected' });
                setFilterSupervisor({ value: myProfile.supRegId, label: 'Auto-Selected' });
            }
        }
    }, [appUserRole, dbAsthaDidis, loggedInProfileId, filterAsthaDidi]);

    useEffect(() => {
        if (filterState && filterState.value) {
            fetch(`${API_BASE_URL}/districts/${filterState.value}`).then(res => res.json()).then(data => {
                setDbDistricts(data.map(d => ({ value: d.DistId, label: d.DistName })));
            }).catch(console.error);
        } else if (appUserRole !== 'Astha Didi') {
            setDbDistricts([]);
            setFilterDistrict(null);
        }
    }, [filterState, appUserRole]);

    const filteredMotherNgos = useMemo(() => {
        if (appUserRole === 'District Administrator' && loggedInProfileId) return dbMotherNgos.filter(ngo => String(ngo.value) === String(loggedInProfileId));
        if (appUserRole === 'Supervisor' && loggedInProfileId && dbSupervisors.length > 0) {
            const currentSupervisor = dbSupervisors.find(sup => String(sup.value) === String(loggedInProfileId));
            if (currentSupervisor && currentSupervisor.motherNgoId) return dbMotherNgos.filter(ngo => String(ngo.value) === String(currentSupervisor.motherNgoId));
        }
        return dbMotherNgos;
    }, [dbMotherNgos, appUserRole, loggedInProfileId, dbSupervisors, dbAsthaDidis]);

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
        if (appUserRole === 'Supervisor' && loggedInProfileId) return dbSupervisors.filter(sup => String(sup.value) === String(loggedInProfileId));
        return dbSupervisors.filter(sup => {
            let matches = true;
            if (filterMotherNgo && String(sup.motherNgoId) !== String(filterMotherNgo.value)) matches = false;
            if (filterState && sup.stateName?.toLowerCase() !== filterState.label.toLowerCase()) matches = false;
            if (filterDistrict && sup.distName?.toLowerCase() !== filterDistrict.label.toLowerCase()) matches = false;
            return matches;
        });
    }, [dbSupervisors, filterMotherNgo, filterState, filterDistrict, appUserRole, loggedInProfileId]);

    const filteredAsthaDidiOptions = useMemo(() => {
        return dbAsthaDidis.filter(ad => {
            let matches = true;
            if (filterMotherNgo && ad.motherNgoId != null && String(ad.motherNgoId) !== String(filterMotherNgo.value)) matches = false;
            if (filterState && ad.stateName?.toLowerCase() !== filterState.label.toLowerCase()) matches = false;
            if (filterDistrict && ad.distName?.toLowerCase() !== filterDistrict.label.toLowerCase()) matches = false;
            if (filterSupervisor) {
                const matchBySupRegId = ad.supRegId != null && String(ad.supRegId) === String(filterSupervisor.value);
                const matchByCreator = ad.createdByAuthRegId != null && filterSupervisor.userSignUpId != null && String(ad.createdByAuthRegId) === String(filterSupervisor.userSignUpId);
                if (!matchBySupRegId && !matchByCreator) matches = false;
            }
            return matches;
        });
    }, [dbAsthaDidis, filterMotherNgo, filterState, filterDistrict, filterSupervisor]);

    const handleFormSuccess = () => setRefreshTrigger(prev => prev + 1);

    if (appUserRole === null) return <div style={{ padding: '24px' }}>Loading Interface...</div>;

    let adminOptions = [];
    if (appUserRole === 'State Super Administrator' || appUserRole.toLowerCase() === 'developer') {
        adminOptions = [{ value: 'District Administrator', label: 'District Administrator' }, { value: 'Supervisor', label: 'Supervisor' }, { value: 'Astha Didi', label: 'Astha Didi' }, { value: 'Astha Maa', label: 'Astha Maa' }];
    } else if (appUserRole === 'District Administrator') {
        adminOptions = [{ value: 'Supervisor', label: 'Supervisor' }, { value: 'Astha Didi', label: 'Astha Didi' }, { value: 'Astha Maa', label: 'Astha Maa' }];
    } else if (appUserRole === 'Supervisor') {
        adminOptions = [{ value: 'Astha Didi', label: 'Astha Didi' }, { value: 'Astha Maa', label: 'Astha Maa' }];
    } else if (appUserRole === 'Astha Didi') {
        adminOptions = [{ value: 'Astha Maa', label: 'Astha Maa' }];
    } else if (appUserRole === 'Astha Maa') {
        adminOptions = [{ value: 'Astha Maa', label: 'Astha Maa' }];
    }

    const canSeeFilters = appUserRole === 'State Super Administrator' || appUserRole.toLowerCase() === 'developer' || appUserRole === 'District Administrator' || appUserRole === 'Supervisor';
    const isLockedRole = appUserRole === 'District Administrator' || appUserRole === 'Supervisor';
    
    const isMotherNgoVisible = ['Supervisor', 'Astha Maa', 'Astha Didi'].includes(adminActiveView);
    const isSupervisorVisible = ['Astha Maa', 'Astha Didi'].includes(adminActiveView);
    const isAsthaDidiVisible = ['Astha Maa'].includes(adminActiveView);

    return (
        <>
            <ToastContainer autoClose={3000} pauseOnHover={false} />
            {adminOptions.length > 0 && (
                <div style={{ ...styles.card, padding: '24px', marginBottom: '24px', overflow: 'visible', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', maxWidth: '250px' }}>
                        <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Select Role Entry / View <span style={{ color: '#ff3e1d' }}>*</span></label>
                        <Select options={adminOptions} value={adminOptions.find(o => o.value === adminActiveView)} onChange={(s) => setAdminActiveView(s.value)} styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" isSearchable={false} />
                    </div>
                    {canSeeFilters && (
                        <>
                            {isMotherNgoVisible && (
                                <div style={{ width: '100%', maxWidth: '200px' }}>
                                    <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>DISTRICT NGO</label>
                                    <Select options={filteredMotherNgos} value={filterMotherNgo} onChange={(s) => { setFilterMotherNgo(s); setFilterState(null); setFilterDistrict(null); setFilterSupervisor(null); setFilterAsthaDidi(null); }} isClearable={!isLockedRole} isDisabled={isLockedRole} placeholder="All DISTRICT NGOs" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                                </div>
                            )}
                            <div style={{ width: '100%', maxWidth: '150px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>State</label>
                                <Select options={filteredStateOptions} value={filterState} onChange={(s) => { setFilterState(s); setFilterDistrict(null); setFilterSupervisor(null); setFilterAsthaDidi(null); }} isDisabled={(isMotherNgoVisible && !filterMotherNgo) || isLockedRole} isClearable={!isLockedRole} placeholder="All States" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div>
                            <div style={{ width: '100%', maxWidth: '150px' }}>
                                <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>District</label>
                                <Select options={filteredDistrictOptions} value={filterDistrict} onChange={(s) => { setFilterDistrict(s); setFilterSupervisor(null); setFilterAsthaDidi(null); }} isDisabled={!filterState || isLockedRole} isClearable={!isLockedRole} placeholder="All Districts" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                            </div>
                            {isSupervisorVisible && (
                                <div style={{ width: '100%', maxWidth: '200px' }}>
                                    <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Supervisor</label>
                                    <Select options={filteredSupervisorOptions} value={filterSupervisor} onChange={(s) => { setFilterSupervisor(s); setFilterAsthaDidi(null); }} isDisabled={!filterDistrict || appUserRole === 'Supervisor'} isClearable={appUserRole !== 'Supervisor'} placeholder="All Supervisors" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                                </div>
                            )}
                            {isAsthaDidiVisible && (
                                <div style={{ width: '100%', maxWidth: '200px' }}>
                                    <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Astha Didi</label>
                                    <Select options={filteredAsthaDidiOptions} value={filterAsthaDidi} onChange={setFilterAsthaDidi} isDisabled={!filterSupervisor} isClearable placeholder="All Astha Didis" styles={{ ...styles.selectStyles(false), menuPortal: base => ({ ...base, zIndex: 99999 }) }} menuPortalTarget={document.body} menuPosition="fixed" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {adminActiveView === 'District Administrator' ? (
                <><DistrictAdminForm onSuccess={handleFormSuccess} /><DistrictAdminTable refreshTrigger={refreshTrigger} /></>
            ) : adminActiveView === 'Supervisor' ? (
                <><SupervisorForm onSuccess={handleFormSuccess} externalFilters={{ filterMotherNgo, filterState, filterDistrict }} /><SupervisorTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict }} /></>
            ) : adminActiveView === 'Astha Maa' ? (
                <><AsthaMaaForm onSuccess={handleFormSuccess} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor, filterAsthaDidi }} /><AsthaMaaTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor, filterAsthaDidi }} /></>
            ) : (
                <><AsthaDidiForm onSuccess={handleFormSuccess} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor }} /><MembersTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor }} /></>
            )}
        </>
    );
};

export default AccountTab;