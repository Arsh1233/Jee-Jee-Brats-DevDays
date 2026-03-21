import React, { useState, useEffect } from 'react';

const API = '';

const TABS = ['Smart Nudges', 'DISCOM Tariff', 'OEM Devices', 'Home Automation'];

export default function Integrations() {
    const [tab, setTab] = useState(0);
    const [nudges, setNudges] = useState(null);
    const [discomTariff, setDiscomTariff] = useState(null);
    const [providers, setProviders] = useState([]);
    const [selProvider, setSelProvider] = useState('');
    const [oems, setOems] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [outages, setOutages] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch data per tab
    useEffect(() => {
        setLoading(true);
        if (tab === 0) {
            fetch(`${API}/api/integrations/nudges`).then(r => r.json()).then(setNudges).catch(() => {}).finally(() => setLoading(false));
        } else if (tab === 1) {
            Promise.all([
                fetch(`${API}/api/integrations/discom/providers`).then(r => r.json()),
                fetch(`${API}/api/integrations/discom/tariff?provider=${selProvider}`).then(r => r.json()),
                fetch(`${API}/api/integrations/discom/outages?provider=${selProvider}`).then(r => r.json()),
            ]).then(([p, t, o]) => { setProviders(Array.isArray(p) ? p : []); setDiscomTariff(t); setOutages(o); })
              .catch(() => {}).finally(() => setLoading(false));
        } else if (tab === 2) {
            fetch(`${API}/api/integrations/oem/manufacturers`).then(r => r.json())
                .then(d => setOems(Array.isArray(d) ? d : []))
                .catch(() => {}).finally(() => setLoading(false));
        } else if (tab === 3) {
            fetch(`${API}/api/integrations/home/platforms`).then(r => r.json())
                .then(d => setPlatforms(Array.isArray(d) ? d : []))
                .catch(() => {}).finally(() => setLoading(false));
        }
    }, [tab, selProvider]);

    return (
        <div className="page-container">
            <h1 className="page-title">🔗 Integration Hub</h1>
            <p className="page-subtitle">DISCOM, OEM & Home Automation integrations for Super App scalability</p>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
                {TABS.map((t, i) => (
                    <button key={t} onClick={() => setTab(i)} style={{
                        padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        background: tab === i ? '#1a66d9' : '#fff', color: tab === i ? '#fff' : '#5a6a7a',
                        boxShadow: tab === i ? '0 4px 14px rgba(26,102,217,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                        transition: 'all 0.2s',
                    }}>{t}</button>
                ))}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: 40, color: '#5a6a7a' }}>Loading…</div>}

            {/* ── TAB 0: Smart Nudges ── */}
            {tab === 0 && nudges && !loading && (
                <div>
                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Active Nudges', val: nudges.totalNudges, color: '#1a66d9', bg: '#e6f0ff' },
                            { label: 'High Priority', val: nudges.highPriority, color: '#ef4444', bg: '#fef2f2' },
                            { label: 'Savings Potential', val: `₹${nudges.potentialMonthlySavings}/mo`, color: '#16a34a', bg: '#f0fdf4' },
                            { label: 'Current Tariff', val: `₹${nudges.currentTariff?.rate}/kWh (${nudges.currentTariff?.name})`, color: '#f59e0b', bg: '#fffbeb' },
                        ].map(c => (
                            <div key={c.label} className="stat-card" style={{ background: c.bg, borderLeft: `4px solid ${c.color}` }}>
                                <div style={{ fontSize: 11, color: '#5a6a7a', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Nudge list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(nudges.nudges || []).map((n, i) => (
                            <div key={n.id || i} className="stat-card" style={{ borderLeft: `4px solid ${n.color || '#3b82f6'}`, padding: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <span style={{ fontSize: 26 }}>{n.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2332', marginBottom: 4 }}>{n.title}</div>
                                        <div style={{ fontSize: 12, color: '#5a6a7a', lineHeight: '1.5' }}>{n.message}</div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: n.priority === 'high' ? '#fef2f2' : n.priority === 'medium' ? '#fffbeb' : '#f0fdf4', color: n.priority === 'high' ? '#ef4444' : n.priority === 'medium' ? '#f59e0b' : '#16a34a' }}>
                                                {n.priority?.toUpperCase()}
                                            </span>
                                            {n.savings?.perMonth > 0 && (
                                                <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a' }}>
                                                    💰 Save ₹{n.savings.perMonth}/mo
                                                </span>
                                            )}
                                            <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#f5f5f5', color: '#666' }}>
                                                {n.type?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(nudges.nudges || []).length === 0 && (
                            <div className="stat-card" style={{ textAlign: 'center', padding: 40, color: '#5a6a7a' }}>No active nudges at this time</div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB 1: DISCOM Tariff ── */}
            {tab === 1 && !loading && (
                <div>
                    {/* Provider selector */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#5a6a7a', marginBottom: 6, display: 'block' }}>SELECT DISCOM PROVIDER</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {providers.map(p => (
                                <button key={p.id} onClick={() => setSelProvider(p.id)} style={{
                                    padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                                    background: selProvider === p.id ? '#1a66d9' : '#fff', color: selProvider === p.id ? '#fff' : '#1a2332',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                }}>
                                    {p.provider} <span style={{ opacity: 0.6 }}>({p.region})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {discomTariff && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Tariff Info */}
                            <div className="stat-card">
                                <h3 style={{ marginBottom: 12, color: '#1a2332', fontSize: 15 }}>⚡ Live ToD Tariff</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                                    <div style={{ background: '#e6f0ff', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#5a6a7a', fontWeight: 600 }}>Period</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1a66d9' }}>{discomTariff.todPeriod}</div>
                                    </div>
                                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#5a6a7a', fontWeight: 600 }}>Multiplier</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{discomTariff.todMultiplier}×</div>
                                    </div>
                                </div>
                                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#5a6a7a', marginBottom: 8 }}>RESIDENTIAL SLABS</h4>
                                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                            <th style={{ textAlign: 'left', padding: 6, color: '#5a6a7a', fontSize: 11 }}>Range (kWh)</th>
                                            <th style={{ textAlign: 'right', padding: 6, color: '#5a6a7a', fontSize: 11 }}>Rate (₹/kWh)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(discomTariff.slabs?.residential || []).map((s, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: 6, fontWeight: 600 }}>{s.range}</td>
                                                <td style={{ padding: 6, textAlign: 'right', fontWeight: 700, color: '#1a66d9' }}>₹{s.rate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ marginTop: 12, fontSize: 11, color: '#8a97a6' }}>
                                    Surcharges: Electric Duty {(discomTariff.surcharges?.electricDuty * 100).toFixed(0)}% · Fuel Adj ₹{discomTariff.surcharges?.fuelAdjustment}/u
                                </div>
                            </div>

                            {/* Outages */}
                            <div className="stat-card">
                                <h3 style={{ marginBottom: 12, color: '#1a2332', fontSize: 15 }}>🔧 Planned Outages</h3>
                                {(outages?.planned || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 30, color: '#16a34a', fontWeight: 600 }}>✅ No planned outages</div>
                                ) : (outages?.planned || []).map((o, i) => (
                                    <div key={i} style={{ background: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 8, borderLeft: '3px solid #ef4444' }}>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2332' }}>{o.area}</div>
                                        <div style={{ fontSize: 11, color: '#5a6a7a', marginTop: 4 }}>{o.reason}</div>
                                        <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 6 }}>
                                            {new Date(o.startTime).toLocaleString()} → {new Date(o.endTime).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ marginTop: 12, fontSize: 11, color: '#8a97a6' }}>
                                    Provider: {discomTariff.provider} · Region: {discomTariff.region} · Next revision: {discomTariff.nextRevisionDate}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 2: OEM Devices ── */}
            {tab === 2 && !loading && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                        {oems.map(o => (
                            <div key={o.id} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e6f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#1a66d9' }}>
                                    {o.manufacturer.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2332' }}>{o.manufacturer}</div>
                                    <div style={{ fontSize: 12, color: '#5a6a7a', marginTop: 2 }}>Protocol: <span style={{ fontWeight: 600, color: '#1a66d9' }}>{o.protocol.toUpperCase()}</span></div>
                                </div>
                                <div style={{ padding: '4px 10px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700 }}>Connected</div>
                            </div>
                        ))}
                    </div>
                    {oems.length === 0 && (
                        <div className="stat-card" style={{ textAlign: 'center', padding: 40, color: '#5a6a7a' }}>No OEM manufacturers configured</div>
                    )}
                </div>
            )}

            {/* ── TAB 3: Home Automation ── */}
            {tab === 3 && !loading && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                        {platforms.map(p => (
                            <div key={p.id} className="stat-card" style={{ padding: 20, textAlign: 'center' }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>{p.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2332', marginBottom: 4 }}>{p.name}</div>
                                <span style={{
                                    padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                                    background: p.status === 'supported' ? '#f0fdf4' : p.status === 'beta' ? '#fffbeb' : '#f5f5f5',
                                    color: p.status === 'supported' ? '#16a34a' : p.status === 'beta' ? '#f59e0b' : '#8a97a6',
                                }}>
                                    {p.status === 'supported' ? '✅ Supported' : p.status === 'beta' ? '🧪 Beta' : '📅 Planned'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
