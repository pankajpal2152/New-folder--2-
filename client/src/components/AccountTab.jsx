import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { styles } from '../config/constants';
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
    }, []);

    const handleFormSuccess = () => setRefreshTrigger(prev => prev + 1);

    if (appUserRole === null || adminActiveView === '') {
        return <div style={{ padding: '24px', color: '#697a8d' }}>Loading Interface...</div>;
    }

    let adminOptions = [];

    if (appUserRole === 'State Super Administrator') {
        adminOptions = [
            { value: 'District Administrator', label: 'District Administrator' },
            // { value: 'Supervisor', label: 'Supervisor' },
            // { value: 'Astha Didi', label: 'Astha Didi' }
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
            // { value: 'Astha Didi', label: 'Astha Didi' }
        ];
    } else if (appUserRole === 'Supervisor' || appUserRole === 'Astha Didi') {
        adminOptions = [
            { value: 'Astha Didi', label: 'Astha Didi' },
            // { value: 'Astha Maa', label: 'Astha Maa' }
        ];
    }

    return (
        <>
            <ToastContainer autoClose={3000} pauseOnHover={false} />

            {adminOptions.length > 0 && (
                <div style={{ ...styles.card, padding: '24px', marginBottom: '24px', overflow: 'visible' }}>
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>
                            Select Role Entry / View <span style={{ color: '#ff3e1d' }}>*</span>
                        </label>
                        <Select
                            options={adminOptions}
                            value={adminOptions.find(o => o.value === adminActiveView)}
                            onChange={(selected) => setAdminActiveView(selected.value)}
                            styles={{
                                ...styles.selectStyles(false),
                                menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                            menuPortalTarget={document.body}
                            isSearchable={false}
                        />
                    </div>
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
                    <MembersTable refreshTrigger={refreshTrigger} />
                </>
            )}
        </>
    );
};

export default AccountTab;