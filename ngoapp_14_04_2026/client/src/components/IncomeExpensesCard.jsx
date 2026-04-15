// src/components/IncomeExpensesCard.jsx
import React, { useState, useRef } from 'react';

const IncomeExpensesCard = () => {
    const chartData = {
        Income: {
            balance: '$459.10', growth: '+ 42.9%', isPositive: true,
            points: [65, 75, 55, 15, 85, 45, 60],
            path: 'M 0 65 C 40 65, 60 85, 100 55 C 140 25, 160 5, 200 15 C 240 25, 260 75, 300 60',
            radialValue: 65, bTitle: 'Expenses This Week', bDesc: '$39 less than last week'
        },
        Expenses: {
            balance: '$124.50', growth: '- 12.4%', isPositive: false,
            points: [30, 50, 20, 60, 40, 80, 65],
            path: 'M 0 30 C 40 30, 60 55, 100 20 C 140 -15, 160 70, 200 40 C 240 10, 260 85, 300 65',
            radialValue: 35, bTitle: 'Income This Week', bDesc: '$12 more than last week'
        },
        Profit: {
            balance: '$334.60', growth: '+ 55.3%', isPositive: true,
            points: [80, 20, 60, 30, 70, 10, 30],
            path: 'M 0 80 C 40 80, 60 10, 100 60 C 140 110, 160 20, 200 70 C 240 120, 260 0, 300 30',
            radialValue: 80, bTitle: 'Profit This Week', bDesc: '$50 more than last week'
        }
    };

    const tabs = ['Income', 'Expenses', 'Profit'];
    const xLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const [activeTab, setActiveTab] = useState('Income');
    const [hoverX, setHoverX] = useState(null);
    const containerRef = useRef(null);
    const currentData = chartData[activeTab];

    const handleMouseMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 300;
        setHoverX(x);
    };

    const styles = {
        card: {
            backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px',
            boxShadow: '0 4px 18px 0 rgba(67, 89, 113, 0.08)',
            display: 'flex', flexDirection: 'column',
            height: '535px', // FIXED HEIGHT
            justifyContent: 'space-between', position: 'relative',
            fontFamily: '"Public Sans", sans-serif', boxSizing: 'border-box'
        },
        tabButton: (isActive) => ({
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            fontSize: '0.9375rem', fontWeight: '600', cursor: 'pointer',
            backgroundColor: isActive ? '#696cff' : 'transparent',
            color: isActive ? '#ffffff' : '#697a8d', transition: 'all 0.3s'
        }),
        chartArea: { position: 'relative', width: '100%', height: '180px', margin: '20px 0', cursor: 'crosshair' },
        tooltip: {
            position: 'absolute', top: '-10px', left: `${(hoverX / 300) * 100}%`,
            transform: 'translateX(-50%)', backgroundColor: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '6px',
            padding: '8px 12px', zIndex: 10, display: hoverX === null ? 'none' : 'block'
        }
    };

    return (
        <div style={styles.card}>
            <div style={{ display: 'flex', gap: '10px' }}>
                {tabs.map(tab => <button key={tab} style={styles.tabButton(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tab}</button>)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(105, 108, 255, 0.12)', color: '#696cff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>💳</div>
                <div>
                    <p style={{ fontSize: '14px', color: '#a1acb8', margin: 0 }}>Total Balance</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '22px', fontWeight: '700', color: '#566a7f', margin: 0 }}>{currentData.balance}</h4>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: currentData.isPositive ? '#71dd37' : '#ff3e1d' }}>{currentData.isPositive ? '▲' : '▼'} {currentData.growth}</span>
                    </div>
                </div>
            </div>

            <div style={styles.chartArea} ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverX(null)}>
                <div style={styles.tooltip}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#a1acb8', fontWeight: 'bold' }}>{xLabels[Math.round((hoverX / 300) * 6)] || 'Data'}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#566a7f', fontWeight: '700' }}>series-1: {Math.round(100 - (hoverX / 4))}</p>
                </div>
                <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgba(105, 108, 255, 0.4)" /><stop offset="100%" stopColor="rgba(105, 108, 255, 0)" /></linearGradient></defs>
                    <line x1="0" y1="0" x2="300" y2="0" stroke="#f3f4f6" strokeDasharray="5 5" /><line x1="0" y1="50" x2="300" y2="50" stroke="#f3f4f6" strokeDasharray="5 5" /><line x1="0" y1="100" x2="300" y2="100" stroke="#f3f4f6" strokeDasharray="5 5" />
                    {hoverX !== null && <line x1={hoverX} y1="-20" x2={hoverX} y2="120" stroke="#d9dee3" strokeDasharray="4 2" />}
                    <path d={`${currentData.path} L 300 120 L 0 120 Z`} fill="url(#g)" style={{ transition: 'd 0.8s' }} />
                    <path d={currentData.path} fill="none" stroke="#696cff" strokeWidth="4" strokeLinecap="round" style={{ transition: 'd 0.8s' }} />
                    <circle cx="300" cy={currentData.points[6]} r="6" fill="#fff" stroke="#696cff" strokeWidth="4" style={{ transition: 'cy 0.8s' }} />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                    {xLabels.map(l => <span key={l} style={{ fontSize: '12px', color: '#a1acb8' }}>{l}</span>)}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', padding: '20px', borderRadius: '12px', border: '1px solid #f9f9fb' }}>
                <div style={{ position: 'relative', width: '55px', height: '55px' }}>
                    <svg viewBox="0 0 36 36" width="100%" height="100%">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#696cff" strokeWidth="3" strokeDasharray={`${currentData.radialValue}, 100`} strokeLinecap="round" style={{ transition: '0.8s' }} />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#566a7f' }}>${currentData.radialValue}</div>
                </div>
                <div>
                    <h6 style={{ fontSize: '15px', fontWeight: '600', color: '#566a7f', margin: '0 0 3px 0' }}>{currentData.bTitle}</h6>
                    <p style={{ fontSize: '13px', color: '#a1acb8', margin: 0 }}>{currentData.bDesc}</p>
                </div>
            </div>
        </div>
    );
};

export default IncomeExpensesCard;