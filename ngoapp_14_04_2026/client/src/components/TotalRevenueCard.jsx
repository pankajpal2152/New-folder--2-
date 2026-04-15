// src/components/TotalRevenueCard.jsx
import React, { useState, useEffect } from 'react';

const TotalRevenueCard = () => {
    // 1. Data Setup
    const chartData = [
        { month: 'Jan', val2021: 17, val2020: -14 },
        { month: 'Feb', val2021: 6, val2020: -19 },
        { month: 'Mar', val2021: 14, val2020: -10 },
        { month: 'Apr', val2021: 28, val2020: -15 },
        { month: 'May', val2021: 17, val2020: -6 },
        { month: 'Jun', val2021: 11, val2020: -18 },
        { month: 'Jul', val2021: 8, val2020: -16 },
    ];

    const [show2021, setShow2021] = useState(true);
    const [show2020, setShow2020] = useState(true);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // 2. Dynamic Axis Logic
    let currentLabels = [];
    let currentMax = 0;
    let currentMin = 0;

    if (show2021 && !show2020) {
        currentLabels = [35, 28, 21, 14, 7, 0];
        currentMax = 35;
        currentMin = 0;
    } else if (!show2021 && show2020) {
        currentLabels = [0, -5, -10, -15, -20];
        currentMax = 0;
        currentMin = -20;
    } else {
        currentLabels = [30, 20, 10, 0, -10, -20];
        currentMax = 30;
        currentMin = -20;
    }

    const totalRange = currentMax - currentMin;
    const zeroTopPercentage = totalRange === 0 ? 50 : ((currentMax - 0) / totalRange) * 100;

    // 3. Inline Styles with Advanced Animations
    const styles = {
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px 0 rgba(67, 89, 113, 0.08)', // Softened main shadow
            display: 'flex',
            overflow: 'hidden',
            height: '100%',
        },
        // --- LEFT SIDE (Bar Chart) ---
        leftSide: { flex: 2, padding: '24px', borderRight: '1px solid #e1e4e8', display: 'flex', flexDirection: 'column' },
        headerRow: { display: 'flex', flexDirection: 'column', marginBottom: '30px' },
        title: { fontSize: '1.125rem', fontWeight: '600', color: '#566a7f', margin: '0 0 10px 0' },
        legendContainer: { display: 'flex', gap: '16px' },
        legendItem: (isActive) => ({
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem',
            color: isActive ? '#697a8d' : '#c7cdd4', cursor: 'pointer', background: 'none',
            border: 'none', padding: 0, transition: 'color 0.3s ease', outline: 'none'
        }),
        dot: (color, isActive) => ({
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: isActive ? color : '#e1e4e8', transition: 'background-color 0.3s ease'
        }),
        chartArea: { position: 'relative', height: '240px', display: 'flex', marginLeft: '30px', marginBottom: '40px' },
        gridLineContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
        gridLine: (value) => ({
            position: 'absolute',
            top: `${((currentMax - value) / totalRange) * 100}%`,
            left: 0, right: 0,
            borderTop: value === 0 ? '1px solid #d9dee3' : '1px dashed #f0f2f4', // Dashed minor lines for a cleaner look
            display: 'flex', alignItems: 'center',
            transition: 'top 0.6s cubic-bezier(0.4, 0, 0.2, 1)' // Smoother grid shifting
        }),
        yAxisLabel: { position: 'absolute', left: '-30px', color: '#a1acb8', fontSize: '12px', transform: 'translateY(-50%)', width: '20px', textAlign: 'right' },
        barsContainer: { position: 'absolute', top: 0, left: '10px', right: '10px', bottom: 0, display: 'flex', justifyContent: 'space-between', zIndex: 1 },
        barColumn: { position: 'relative', width: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' },

        // --- ADVANCED BAR STYLES ---
        bar2021: (value, index) => ({
            position: 'absolute',
            bottom: `${100 - zeroTopPercentage}%`,
            width: '8px',
            background: 'linear-gradient(180deg, #696cff 0%, #898bff 100%)', // Gradient color
            borderRadius: '20px',
            boxShadow: animate && show2021 && value > 0 ? '0 3px 8px rgba(105, 108, 255, 0.4)' : 'none', // Neon Glow
            height: animate && show2021 ? `${(value / totalRange) * 100}%` : '0%',
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s`,
        }),
        bar2020: (value, index) => ({
            position: 'absolute',
            top: `${zeroTopPercentage}%`,
            width: '8px',
            background: 'linear-gradient(180deg, #03c3ec 0%, #4ae0ff 100%)', // Gradient color
            borderRadius: '20px',
            boxShadow: animate && show2020 && value < 0 ? '0 3px 8px rgba(3, 195, 236, 0.4)' : 'none', // Neon Glow
            height: animate && show2020 ? `${(Math.abs(value) / totalRange) * 100}%` : '0%',
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s`,
        }),
        xAxisLabel: { position: 'absolute', bottom: '-30px', color: '#a1acb8', fontSize: '12px', fontWeight: '500' },

        // --- RIGHT SIDE (Radial Chart & Stats) ---
        rightSide: { flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        dropdown: { padding: '6px 14px', borderRadius: '6px', border: '1px solid #d9dee3', backgroundColor: '#fff', color: '#696cff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', alignSelf: 'center', marginBottom: '30px', outline: 'none', transition: 'border-color 0.2s ease' },
        radialContainer: { position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

        // --- MODIFIED CIRCULAR GRAPH STYLE ---
        radialTick: (index, totalTicks, progress) => {
            const startAngle = -120;
            const angleStep = 240 / (totalTicks - 1);
            const currentAngle = startAngle + (index * angleStep);

            // Determine if this tick should be purple based on the target progress
            const isTargetActive = (index / totalTicks) <= (progress / 100);

            // Calculate the delay so the animation sweeps from left to right like a speedometer
            // We use a much faster base delay (0.015s) and apply it only if the element should be active
            const sweepDelay = isTargetActive ? (index * 0.015) : 0;

            // Base background is light purple. If animated and it's part of the progress, turn it dark purple.
            const finalColor = animate && isTargetActive ? '#696cff' : '#e7e7ff';

            return {
                position: 'absolute',
                top: '0',
                left: '50%',
                width: '4px',
                height: '14px',
                backgroundColor: finalColor,
                borderRadius: '4px',
                transformOrigin: 'center 80px',
                transform: `translateX(-50%) rotate(${currentAngle}deg)`,
                // We transition the background color to create the sweeping fill effect
                transition: animate ? `background-color 0.1s linear ${sweepDelay}s` : 'none',
            };
        },

        radialTextContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' },
        growthPercent: { fontSize: '28px', fontWeight: '700', color: '#566a7f', margin: 0, letterSpacing: '-0.5px' },
        growthLabel: { fontSize: '13px', color: '#a1acb8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },
        companyGrowth: { color: '#697a8d', fontSize: '14px', fontWeight: '600', marginTop: '30px', marginBottom: '20px' },
        statsRow: { display: 'flex', gap: '20px', width: '100%', justifyContent: 'center' },
        statBox: { display: 'flex', gap: '12px', alignItems: 'center' },
        iconBg2022: { width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(105, 108, 255, 0.16)', color: '#696cff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' },
        iconBg2021: { width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(3, 195, 236, 0.16)', color: '#03c3ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
        statYear: { fontSize: '12px', color: '#a1acb8', margin: '0 0 2px 0' },
        statAmount: { fontSize: '15px', color: '#566a7f', fontWeight: '600', margin: 0 }
    };

    const totalRadialTicks = 34;
    const growthPercentage = 78;

    return (
        <div style={styles.card}>
            <div style={styles.leftSide}>
                <div style={styles.headerRow}>
                    <h5 style={styles.title}>Total Revenue</h5>
                    <div style={styles.legendContainer}>
                        <button style={styles.legendItem(show2021)} onClick={() => setShow2021(!show2021)}>
                            <div style={styles.dot('#696cff', show2021)}></div> 2021
                        </button>
                        <button style={styles.legendItem(show2020)} onClick={() => setShow2020(!show2020)}>
                            <div style={styles.dot('#03c3ec', show2020)}></div> 2020
                        </button>
                    </div>
                </div>

                <div style={styles.chartArea}>
                    <div style={styles.gridLineContainer}>
                        {currentLabels.map((val) => (
                            <div key={val} style={styles.gridLine(val)}>
                                <span style={styles.yAxisLabel}>{val}</span>
                            </div>
                        ))}
                    </div>

                    <div style={styles.barsContainer}>
                        {chartData.map((data, index) => (
                            <div key={index} style={styles.barColumn}>
                                <div style={styles.bar2021(data.val2021, index)}></div>
                                <div style={styles.bar2020(data.val2020, index)}></div>
                                <span style={styles.xAxisLabel}>{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={styles.rightSide}>
                <select style={styles.dropdown}>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                </select>

                <div style={styles.radialContainer}>
                    {Array.from({ length: totalRadialTicks }).map((_, i) => (
                        <div key={i} style={styles.radialTick(i, totalRadialTicks, growthPercentage)}></div>
                    ))}
                    <div style={styles.radialTextContainer}>
                        <p style={styles.growthPercent}>{growthPercentage}%</p>
                        <p style={styles.growthLabel}>Growth</p>
                    </div>
                </div>

                <p style={styles.companyGrowth}>62% Company Growth</p>

                <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                        <div style={styles.iconBg2022}>$</div>
                        <div>
                            <p style={styles.statYear}>2022</p>
                            <p style={styles.statAmount}>$32.5k</p>
                        </div>
                    </div>
                    <div style={styles.statBox}>
                        <div style={styles.iconBg2021}>💳</div>
                        <div>
                            <p style={styles.statYear}>2021</p>
                            <p style={styles.statAmount}>$41.2k</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TotalRevenueCard;