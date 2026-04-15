// src/components/OrderStatisticsCard.jsx
import React, { useState, useEffect, useRef } from 'react';

const OrderStatisticsCard = () => {
    const statisticsData = [
        { id: 'electronic', title: 'Electronic', subtitle: 'Mobile, Earbuds, TV', amount: '82.5k', percentage: 45, color: '#696cff', iconEmoji: '📱', iconBg: 'rgba(105, 108, 255, 0.16)' },
        { id: 'fashion', title: 'Fashion', subtitle: 'T-shirt, Jeans, Shoes', amount: '23.8k', percentage: 25, color: '#71dd37', iconEmoji: '👗', iconBg: 'rgba(113, 221, 55, 0.16)' },
        { id: 'decor', title: 'Decor', subtitle: 'Fine Art, Dining', amount: '849k', percentage: 20, color: '#03c3ec', iconEmoji: '🏠', iconBg: 'rgba(3, 195, 236, 0.16)' },
        { id: 'sports', title: 'Sports', subtitle: 'Football, Cricket Kit', amount: '99', percentage: 10, color: '#8592a3', iconEmoji: '⚽', iconBg: 'rgba(133, 146, 163, 0.16)' }
    ];

    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [lockedSegment, setLockedSegment] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, show: false });
    const [mounted, setMounted] = useState(false);

    const menuRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) { setMenuOpen(false); }
            if (chartRef.current && !chartRef.current.contains(event.target)) { setLockedSegment(null); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true });
    };

    const displaySegment = lockedSegment || hoveredSegment;
    const radius = 15.9155;
    let currentOffset = 25;

    const styles = {
        card: {
            backgroundColor: '#ffffff', borderRadius: '10px', padding: '28px',
            boxShadow: '0 4px 18px 0 rgba(67, 89, 113, 0.08)',
            display: 'flex', flexDirection: 'column',
            height: '535px', // FIXED HEIGHT
            position: 'relative', fontFamily: '"Public Sans", sans-serif', boxSizing: 'border-box'
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
        title: { color: '#566a7f', fontSize: '1.25rem', fontWeight: '600', margin: '0 0 4px 0' },
        menuDots: { color: '#a1acb8', cursor: 'pointer', fontSize: '20px', padding: '0 5px' },
        dropdownMenu: {
            position: 'absolute', top: '28px', right: '0', backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(161, 172, 184, 0.3)', borderRadius: '8px',
            padding: '8px 0', width: '140px', zIndex: 10,
            opacity: menuOpen ? 1 : 0, visibility: menuOpen ? 'visible' : 'hidden',
            transform: menuOpen ? 'translateY(0)' : 'translateY(-8px)', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        menuItem: { padding: '10px 20px', fontSize: '14px', color: '#697a8d', cursor: 'pointer' },
        topContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
        bigNumber: { fontSize: '2.25rem', fontWeight: '700', color: '#566a7f', margin: '0 0 6px 0' },
        chartContainer: { position: 'relative', width: '140px', height: '140px', cursor: 'pointer' },
        centerTextContainer: {
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
        },
        tooltip: {
            position: 'absolute', top: `${tooltipPos.y - 35}px`, left: `${tooltipPos.x + 15}px`,
            backgroundColor: hoveredSegment ? hoveredSegment.color : '#333', color: '#fff',
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px', pointerEvents: 'none',
            opacity: tooltipPos.show && hoveredSegment ? 1 : 0, zIndex: 20
        },
        listContainer: { display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }
    };

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <div>
                    <h5 style={styles.title}>Order Statistics</h5>
                    <p style={{ color: '#a1acb8', fontSize: '0.875rem', margin: 0 }}>42.82k Total Sales</p>
                </div>
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <div style={styles.menuDots} onClick={() => setMenuOpen(!menuOpen)}>⋮</div>
                    <div style={styles.dropdownMenu}>
                        <div style={styles.menuItem}>Select All</div>
                        <div style={styles.menuItem}>Refresh</div>
                        <div style={styles.menuItem}>Share</div>
                    </div>
                </div>
            </div>

            <div style={styles.topContent}>
                <div>
                    <h2 style={styles.bigNumber}>8,258</h2>
                    <p style={{ color: '#a1acb8', fontSize: '0.875rem', margin: 0 }}>Total Orders</p>
                </div>
                <div ref={chartRef} style={styles.chartContainer} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredSegment(null)}>
                    <div style={styles.tooltip}>{hoveredSegment ? `${hoveredSegment.title}: ${hoveredSegment.percentage}%` : ''}</div>
                    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <circle cx="20" cy="20" r={radius} fill="transparent" stroke="#f0f2f4" strokeWidth="4" />
                        {statisticsData.map((item) => {
                            const visibleLength = Math.max(0, item.percentage - 2);
                            const dashArray = `${visibleLength} ${100 - visibleLength}`;
                            const offset = currentOffset;
                            currentOffset -= item.percentage;
                            const isActive = hoveredSegment?.id === item.id || lockedSegment?.id === item.id;
                            return (
                                <g key={item.id}>
                                    <circle cx="20" cy="20" r={radius} fill="transparent" stroke={item.color} strokeWidth="8" strokeOpacity={lockedSegment?.id === item.id ? "0.25" : "0"} strokeDasharray={dashArray} strokeDashoffset={mounted ? offset : 100} style={{ transition: 'all 1s', pointerEvents: 'none' }} />
                                    <circle cx="20" cy="20" r={radius} fill="transparent" stroke={item.color} strokeWidth={isActive ? "5.5" : "4"} strokeDasharray={dashArray} strokeDashoffset={mounted ? offset : 100} style={{ transition: 'all 0.3s', cursor: 'pointer', pointerEvents: 'stroke' }} onMouseEnter={() => setHoveredSegment(item)} onClick={(e) => { e.stopPropagation(); setLockedSegment(lockedSegment?.id === item.id ? null : item); }} />
                                </g>
                            );
                        })}
                    </svg>
                    <div style={styles.centerTextContainer}>
                        <p style={{ fontSize: '24px', fontWeight: '700', color: displaySegment ? displaySegment.color : '#566a7f', margin: 0 }}>{displaySegment ? `${displaySegment.percentage}%` : '38%'}</p>
                        <p style={{ fontSize: '13px', color: '#a1acb8', margin: 0 }}>{displaySegment ? displaySegment.title : 'Weekly'}</p>
                    </div>
                </div>
            </div>

            <div style={styles.listContainer}>
                {statisticsData.map((item) => <ListItem key={item.id} item={item} />)}
            </div>
        </div>
    );
};

const ListItem = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', transition: '0.2s', backgroundColor: isHovered ? 'rgba(67, 89, 113, 0.04)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: item.iconBg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{item.iconEmoji}</div>
                <div>
                    <h6 style={{ color: '#566a7f', fontSize: '0.9375rem', fontWeight: '600', margin: '0 0 4px 0' }}>{item.title}</h6>
                    <p style={{ color: '#a1acb8', fontSize: '0.8125rem', margin: 0 }}>{item.subtitle}</p>
                </div>
            </div>
            <p style={{ color: '#566a7f', fontSize: '1rem', fontWeight: '600', margin: 0 }}>{item.amount}</p>
        </div>
    );
}

export default OrderStatisticsCard;