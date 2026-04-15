// src/components/TransactionsCard.jsx
import React, { useState, useEffect, useRef } from 'react';

const TransactionsCard = () => {
    const transactions = [
        { id: 1, title: 'Paypal', subtitle: 'Send money', amount: '+82.6', icon: 'P', iconBg: 'rgba(255, 62, 29, 0.12)', iconColor: '#ff3e1d' },
        { id: 2, title: 'Wallet', subtitle: "Mac'D", amount: '+270.69', icon: '💳', iconBg: 'rgba(105, 108, 255, 0.12)', iconColor: '#696cff' },
        { id: 3, title: 'Transfer', subtitle: 'Refund', amount: '+637.91', icon: '🕒', iconBg: 'rgba(3, 195, 236, 0.12)', iconColor: '#03c3ec' },
        { id: 4, title: 'Credit Card', subtitle: 'Ordered Food', amount: '-838.71', icon: '💳', iconBg: 'rgba(113, 221, 55, 0.12)', iconColor: '#71dd37' },
        { id: 5, title: 'Wallet', subtitle: 'Starbucks', amount: '+203.33', icon: '💳', iconBg: 'rgba(105, 108, 255, 0.12)', iconColor: '#696cff' },
        { id: 6, title: 'Mastercard', subtitle: 'Ordered Food', amount: '-92.45', icon: '💳', iconBg: 'rgba(255, 171, 0, 0.12)', iconColor: '#ffab00' }
    ];

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) { setMenuOpen(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const styles = {
        card: {
            backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px',
            boxShadow: '0 4px 18px 0 rgba(67, 89, 113, 0.08)',
            display: 'flex', flexDirection: 'column',
            height: '535px', // FIXED HEIGHT
            fontFamily: '"Public Sans", sans-serif', boxSizing: 'border-box'
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
        dropdownMenu: {
            position: 'absolute', top: '30px', right: '0', backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(161, 172, 184, 0.3)', borderRadius: '8px',
            padding: '8px 0', width: '160px', zIndex: 10,
            opacity: menuOpen ? 1 : 0, visibility: menuOpen ? 'visible' : 'hidden',
            transform: menuOpen ? 'translateY(0)' : 'translateY(-8px)', transition: '0.25s'
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h5 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#566a7f', margin: 0 }}>Transactions</h5>
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <div style={{ color: '#a1acb8', cursor: 'pointer', fontSize: '20px' }} onClick={() => setMenuOpen(!menuOpen)}>⋮</div>
                    <div style={styles.dropdownMenu}>
                        {['Last 28 Days', 'Last Month', 'Last Year'].map(o => <div key={o} style={{ padding: '10px 20px', fontSize: '14px', color: '#697a8d', cursor: 'pointer' }}>{o}</div>)}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {transactions.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: item.iconBg, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>{item.icon}</div>
                            <div>
                                <h6 style={{ color: '#566a7f', fontSize: '0.9375rem', fontWeight: '600', margin: '0 0 2px 0' }}>{item.title}</h6>
                                <p style={{ color: '#a1acb8', fontSize: '0.8125rem', margin: 0 }}>{item.subtitle}</p>
                            </div>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#566a7f', margin: 0 }}>{item.amount}<span style={{ fontSize: '0.8125rem', color: '#a1acb8', marginLeft: '4px' }}>USD</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionsCard;