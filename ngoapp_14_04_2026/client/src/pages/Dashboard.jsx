// src/pages/Dashboard.jsx
import React from 'react';
import WelcomeCard from '../components/WelcomeCard';
import StatCard from '../components/StatCard';
import TotalRevenueCard from '../components/TotalRevenueCard';
import ProfileReportCard from '../components/ProfileReportCard';
import OrderStatisticsCard from '../components/OrderStatisticsCard';
import IncomeExpensesCard from '../components/IncomeExpensesCard';
import TransactionsCard from '../components/TransactionsCard';

const Dashboard = () => {
    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '24px' },
        topGrid: { display: 'grid', gridTemplateColumns: '4fr 1fr 1fr', gap: '24px' },
        middleGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
        rightSideGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
        bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' },
        // --- FOOTER STYLES ---
        footer: {
            marginTop: '20px', padding: '24px 0', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            fontSize: '14px', color: '#a1acb8', borderTop: '1px solid #f0f2f4'
        },
        footerLink: { color: '#697a8d', textDecoration: 'none', marginLeft: '20px', fontWeight: '500' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.topGrid}>
                <WelcomeCard />
                <StatCard title="Profit" amount="$12,628" percentage="+72.80%" isPositive={true} iconEmoji="⏱️" iconBgColor="rgba(113, 221, 55, 0.16)" iconColor="#71dd37" />
                <StatCard title="Sales" amount="$4,679" percentage="+28.42%" isPositive={true} iconEmoji="💳" iconBgColor="rgba(3, 195, 236, 0.16)" iconColor="#03c3ec" />
            </div>

            <div style={styles.middleGrid}>
                <TotalRevenueCard />
                <div style={styles.rightSideGrid}>
                    <StatCard title="Payments" amount="$2,456" percentage="-14.82%" isPositive={false} iconEmoji="💸" iconBgColor="rgba(255, 62, 29, 0.16)" iconColor="#ff3e1d" />
                    <StatCard title="Transactions" amount="$14,857" percentage="+28.14%" isPositive={true} iconEmoji="💳" iconBgColor="rgba(105, 108, 255, 0.16)" iconColor="#696cff" />
                    <ProfileReportCard />
                </div>
            </div>

            <div style={styles.bottomGrid}>
                <OrderStatisticsCard />
                <IncomeExpensesCard />
                <TransactionsCard />
            </div>

            {/* --- FOOTER SECTION --- */}
            <footer style={styles.footer}>
                <div>© 2026 , made with ❤️ by <span style={{ fontWeight: '600', color: '#566a7f' }}>Pankaj Pal</span></div>
                <div style={{ display: 'flex' }}>
                    <a href="#license" style={styles.footerLink}>License</a>
                    {/* <a href="#themes" style={styles.footerLink}>More Themes</a> */}
                    {/* <a href="#doc" style={styles.footerLink}>Documentation</a> */}
                    <a href="#support" style={styles.footerLink}>Support</a>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;