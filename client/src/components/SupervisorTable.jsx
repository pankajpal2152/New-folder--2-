import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL, DUMMY_AVATAR, extractBase64, styles } from '../config/constants';
import { getSafeUser } from './AccountSharedUtils';

const formatDisplayDate = (dbDateStr) => {
    if (!dbDateStr) return '-';
    return String(dbDateStr).substring(0, 10);
};

const SupervisorTable = ({ refreshTrigger, externalFilters }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState(null);
    const [globalSearch, setGlobalSearch] = useState('');

    useEffect(() => {
        const user = getSafeUser();
        if (user) {
            setUserRole(user.role || user.UserSignUpRole || '');
        }
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/supervisor`);
            if (!res.ok) throw new Error("Failed to fetch table data");
            let data = await res.json();
            data = data.filter(member => String(member.SupIsActive) !== '0');
            setMembers(data);
        } catch (error) { toast.error("Failed to load supervisor data."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, [refreshTrigger]);

    const filteredMembers = useMemo(() => {
        if (userRole !== 'Supervisor' && userRole !== 'Astha Didi' && userRole !== 'Astha Maa') {
            if (!externalFilters?.filterMotherNgo || !externalFilters?.filterState || !externalFilters?.filterDistrict) {
                return [];
            }
        }
        return members.filter((member) => {
            let matchesSearch = true;
            if (globalSearch) {
                const searchLower = globalSearch.toLowerCase();
                matchesSearch = Object.values(member).some(
                    val => val && String(val).toLowerCase().includes(searchLower)
                );
            }
            return matchesSearch;
        });
    }, [members, globalSearch, externalFilters, userRole]);

    const sortedMembers = useMemo(() => {
        let sortableItems = [...filteredMembers];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key] || ''; let bVal = b[sortConfig.key] || '';
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredMembers, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName) => {
        if (!sortConfig || sortConfig.key !== columnName) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
        return sortConfig.direction === 'ascending' ? <span style={{ marginLeft: '4px' }}>▲</span> : <span style={{ marginLeft: '4px' }}>▼</span>;
    };

    const totalPages = Math.max(1, Math.ceil(sortedMembers.length / rowsPerPage));
    const indexOfLastMember = currentPage * rowsPerPage;
    const indexOfFirstMember = indexOfLastMember - rowsPerPage;
    const currentMembers = sortedMembers.slice(indexOfFirstMember, indexOfLastMember);

    const renderTh = (label, key) => <th style={styles.th} onClick={() => requestSort(key)}>{label} {getSortIcon(key)}</th>;

    return (
        <div style={{ ...styles.card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
                <h5 style={styles.cardHeader}>Supervisor Entry Details:-</h5>
                <button onClick={fetchMembers} style={styles.btnOutline}>Refresh</button>
            </div>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {renderTh('Name', 'SupName')}
                            {renderTh('Email', 'SupSignupEmail')}
                            {renderTh('Wallet Bal', 'SupWalletBalance')}
                            {renderTh('Joining Amt', 'SupJoiningAmt')}
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMembers.map((row) => (
                            <tr key={row.SupRegId}>
                                <td style={styles.td}>{row.SupName}</td>
                                <td style={styles.td}>{row.SupSignupEmail}</td>
                                <td style={styles.td}>₹{row.SupWalletBalance}</td>
                                <td style={styles.td}>₹{row.SupJoiningAmt}</td>
                                <td style={styles.td}>
                                    <button style={styles.actionBtnEdit}>👁️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupervisorTable;