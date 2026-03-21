import { useState, useEffect } from 'react';

const fmt = (n) => Number(n ?? 0).toLocaleString();
const fmtK = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;

export default function EnvironmentPage() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('/api/admin/environment').then(r => r.json()).then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="page-header"><h2>Loading…</h2></div>;

    const offset = Math.min(data.offsetPercent ?? 0, 100);

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>🌍 Environment — Fleet Overview</h2>
                <p>Carbon impact & sustainability metrics across all <strong>{fmt(data.totalUsers)}</strong> smart meter connections</p>
            </div>

            {/* ── Hero KPI Row ─────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22 }}>
                {[
                    { icon: '🏭', label: 'Fleet CO₂ Footprint / Month', value: `${fmtK(data.carbonFootprintKg)} kg`, color: '#e65100', bg: '#fff3e0' },
                    { icon: '♻️', label: 'CO₂ Offset / Month', value: `${fmtK(data.carbonSavedKg)} kg`, color: '#2e7d32', bg: '#e8f5e9' },
                    { icon: '⚡', label: 'kWh Saved / Month', value: `${fmtK(data.kwhSavedMonthly)} kWh`, color: '#1565c0', bg: '#e3f2fd' },
                    { icon: '⚡', label: 'Total Daily kWh (All Users)', value: `${fmtK(data.dailyKwh)} kWh`, color: '#6a1b9a', bg: '#f3e5f5' },
                ].map((k, i) => (
                    <div key={i} className="stat-card" style={{ borderTop: `3px solid ${k.color}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{k.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: k.color, letterSpacing: -0.5 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Hero: Trees Saved ─────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                border: '2px solid #a5d6a7', borderRadius: 18, padding: '36px 32px',
                marginBottom: 22, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap',
            }}>
                <div style={{ textAlign: 'center', flex: 1, minWidth: 140 }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 40, background: '#fff',
                        border: '3px solid #66bb6a', display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 40, marginBottom: 12,
                        boxShadow: '0 4px 16px rgba(46,125,50,0.15)',
                    }}>🌳</div>
                    <div style={{ fontSize: 56, fontWeight: 900, color: '#2e7d32', letterSpacing: -3, lineHeight: 1 }}>
                        {fmtK(data.treesSavedMonthly)}
                    </div>
                    <div style={{ fontSize: 14, color: '#3a6b3d', fontWeight: 700, marginTop: 6 }}>Trees Saved This Month</div>
                    <div style={{ fontSize: 12, color: '#5a8a5d', marginTop: 3 }}>≈ {fmtK(data.treesSavedYearly)} trees / year</div>
                </div>
                <div style={{ flex: 2, minWidth: 220 }}>
                    <div style={{ fontSize: 14, color: '#33593b', fontWeight: 700, marginBottom: 8 }}>🌱 Fleet Carbon Offset Progress</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5a8a5d', marginBottom: 6 }}>
                        <span>0%</span>
                        <span style={{ fontWeight: 800, color: '#2e7d32' }}>{offset}%</span>
                        <span>100%</span>
                    </div>
                    <div style={{ height: 18, background: 'rgba(0,0,0,0.1)', borderRadius: 9, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%', width: `${offset}%`,
                            background: 'linear-gradient(90deg, #66bb6a, #2e7d32)',
                            borderRadius: 9, transition: 'width 1s ease', position: 'relative',
                        }}>
                            <div style={{ position: 'absolute', right: -8, top: -3, width: 24, height: 24, borderRadius: 12, background: '#fff', border: '3px solid #2e7d32', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#3a6b3d', marginTop: 10, fontWeight: 600 }}>
                        Offsetting <strong>{offset}%</strong> of the fleet's {fmtK(data.carbonFootprintKg)} kg monthly CO₂ footprint
                    </p>
                </div>
            </div>

            {/* ── What It Equals ─────────────────────────────── */}
            <div className="glass-panel">
                <h3>🔄 What Fleet Savings Equal</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
                    {[
                        { icon: '💡', value: fmtK(data.equivalents.lightBulbHours), label: 'LED Bulb Hours', bg: '#fff8e1', color: '#f57f17' },
                        { icon: '📱', value: fmtK(data.equivalents.phoneCharges), label: 'Phone Charges', bg: '#e3f2fd', color: '#1565c0' },
                        { icon: '🚗', value: fmtK(data.equivalents.drivingKmAvoided), label: 'km Not Driven', bg: '#fce4ec', color: '#c62828' },
                        { icon: '🚙', value: `${data.equivalents.carsOffRoad}`, label: 'Cars Off Road (equiv.)', bg: '#f3e5f5', color: '#6a1b9a' },
                    ].map((eq, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: '20px 12px', background: 'var(--bg-primary)', borderRadius: 14 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: eq.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 10 }}>{eq.icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: eq.color, letterSpacing: -0.5 }}>{eq.value}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: 5, letterSpacing: 0.4 }}>{eq.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Connection-type breakdown ───────────────────── */}
            <div className="glass-panel" style={{ background: 'linear-gradient(135deg, #e6f0ff, #f0f8ff)', border: '1.5px solid #90caf9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: '#bbdefb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>⚡</div>
                    <div>
                        <div style={{ fontSize: 13, color: '#1a3a6e', fontWeight: 700 }}>Fleet Total Energy Saved This Month</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#1565c0', letterSpacing: -1 }}>{fmtK(data.kwhSavedMonthly)} kWh</div>
                        <div style={{ fontSize: 12, color: '#4a7fa5', marginTop: 2 }}>
                            ≈ {fmtK(data.carbonSavedKg)} kg CO₂ not emitted · {fmtK(data.treesSavedMonthly)} trees equivalent
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
