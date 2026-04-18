import React, { useState, useEffect } from 'react';
import BACKEND_URL from '../config';

const API = BACKEND_URL;

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userNudges, setUserNudges] = useState(null);
    const [carbonData, setCarbonData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const PAGE_SIZE = 20;

    useEffect(() => {
        fetch(`${API}/api/users`)
            .then(r => r.json())
            .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedUser) {
            setDetailLoading(true);
            setCarbonData(null);
            Promise.all([
                fetch(`${API}/api/integrations/nudges?userId=${selectedUser.userId}`).then(r => r.json()).catch(() => null),
                fetch(`${API}/api/optimizer/environment?userId=${selectedUser.userId}`).then(r => r.json()).catch(() => null),
            ]).then(([nudges, carbon]) => {
                setUserNudges(nudges);
                setCarbonData(carbon);
            }).finally(() => setDetailLoading(false));
        }
    }, [selectedUser]);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) || u.bpNumber?.toLowerCase().includes(q) ||
            u.userId?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q);
        const matchFilter = filter === 'all' || u.connType === filter ||
            (filter === 'defaulter' && !u.lastBill?.paid);
        return matchSearch && matchFilter;
    });

    const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    if (loading) return <div className="page-container"><p>Loading 1 000 users…</p></div>;

    return (
        <div className="page-container">
            <h1 className="page-title">👥 User Management</h1>
            <p className="page-subtitle">{filtered.length} of {users.length} users · Click any row to view details</p>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                    placeholder="Search name / email / BP / user ID / city…"
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: 1, minWidth: 200, padding: '10px 14px', background: '#f7f9fc', color: '#1a2332', border: '1.5px solid #dfe7ef', borderRadius: 10, outline: 'none', fontSize: 13, fontWeight: 500 }}
                />
                {['all', 'residential', 'commercial', 'industrial', 'defaulter'].map(f => (
                    <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                        style={{
                            padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: filter === f ? '#1a66d9' : '#ffffff', color: filter === f ? '#fff' : '#1a2332',
                            fontWeight: 700, fontSize: 12,
                            boxShadow: filter === f ? '0 4px 14px rgba(26,102,217,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                        }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* User Table */}
            <div className="stat-card" style={{ overflowX: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #1e3a6e' }}>
                            {['BP Number', 'Name', 'Email', 'City', 'Type', 'Load (kW)', 'Last Bill', 'Status', ''].map(h => (
                                <th key={h} style={{ padding: '12px 10px', color: '#5a6a7a', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((u, i) => (
                            <tr key={u.userId}
                                onClick={() => setSelectedUser(u)}
                                style={{
                                    borderBottom: '1px solid #edf2f7', background: i % 2 === 0 ? 'transparent' : '#fafbff',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e8f0fe'}
                                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#fafbff'}
                            >
                                <td style={{ padding: '10px', color: '#1a66d9', fontWeight: 700 }}>{u.bpNumber}</td>
                                <td style={{ padding: '10px', color: '#1a2332', fontWeight: 600 }}>{u.name}</td>
                                <td style={{ padding: '10px', color: '#5a6a7a', fontSize: 12 }}>{u.email}</td>
                                <td style={{ padding: '10px', color: '#1a2332', fontWeight: 500 }}>{u.city}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                                        background: u.connType === 'residential' ? '#e3f2fd' : u.connType === 'commercial' ? '#e8f5e9' : '#fff3e0',
                                        color: u.connType === 'residential' ? '#1565c0' : u.connType === 'commercial' ? '#2e7d32' : '#e65100'
                                    }}>
                                        {u.connType}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', color: '#1a2332', textAlign: 'right', fontWeight: 600 }}>{u.sanctionedLoad}</td>
                                <td style={{ padding: '10px', color: '#4a6080', fontWeight: 500 }}>
                                    {u.lastBill ? `₹${u.lastBill.total?.toLocaleString()} (${u.lastBill.month})` : '—'}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                                        background: u.isActive ? '#e8f5e9' : '#ffebee',
                                        color: u.isActive ? '#2e7d32' : '#c62828'
                                    }}>
                                        {u.isActive ? '● Active' : '● Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{ fontSize: 14, color: '#1a66d9' }}>→</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: page === 1 ? '#f0f0f0' : '#fff', color: '#1a2332', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>← Prev</button>
                <span style={{ padding: '8px 14px', color: '#5a6a7a', fontSize: 13, fontWeight: 500 }}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: page === totalPages ? '#f0f0f0' : '#fff', color: '#1a2332', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>Next →</button>
            </div>

            {/* ═══ USER DETAIL MODAL ═══ */}
            {selectedUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000, padding: 20,
                }} onClick={e => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
                    <div style={{
                        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 800, maxHeight: '90vh',
                        overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        animation: 'slideUp 0.25s ease-out',
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0b2a52 0%, #1a66d9 100%)',
                            padding: '24px 28px', borderRadius: '20px 20px 0 0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.3)',
                                }}>
                                    {(selectedUser.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{selectedUser.name}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>{selectedUser.userId} · {selectedUser.bpNumber}</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} style={{
                                width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>✕</button>
                        </div>

                        <div style={{ padding: '20px 28px 28px' }}>
                            {/* ── Contact & Profile ── */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>👤 Personal Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[
                                        { label: 'Full Name', value: selectedUser.name, icon: '🧑' },
                                        { label: 'Email', value: selectedUser.email, icon: '📧' },
                                        { label: 'Phone', value: selectedUser.phone || '—', icon: '📱' },
                                        { label: 'City', value: selectedUser.city, icon: '📍' },
                                        { label: 'Address', value: selectedUser.address || '—', icon: '🏠' },
                                        { label: 'Status', value: selectedUser.isActive ? '✅ Active' : '❌ Inactive', icon: '🔵' },
                                    ].map(f => (
                                        <div key={f.label} style={{ display: 'flex', gap: 10, background: '#f7f9fc', borderRadius: 10, padding: 12 }}>
                                            <span>{f.icon}</span>
                                            <div>
                                                <div style={{ fontSize: 10, color: '#8a97a6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{f.label}</div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2332', marginTop: 2 }}>{f.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Account & Meter Details ── */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>⚡ Account & Meter Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                    {[
                                        { label: 'BP Number', value: selectedUser.bpNumber, color: '#1a66d9', bg: '#e6f0ff' },
                                        { label: 'Meter ID', value: selectedUser.meterId, color: '#7c3aed', bg: '#f3e8ff' },
                                        { label: 'Connection', value: selectedUser.connType, color: '#059669', bg: '#ecfdf5' },
                                        { label: 'Sanctioned Load', value: `${selectedUser.sanctionedLoad} kW`, color: '#d97706', bg: '#fffbeb' },
                                    ].map(d => (
                                        <div key={d.label} style={{ background: d.bg, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                            <div style={{ fontSize: 10, color: '#5a6a7a', fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: d.color }}>{d.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Billing History ── */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>💰 Billing Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {/* Last Bill */}
                                    <div style={{ background: '#f7f9fc', borderRadius: 12, padding: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6a7a', marginBottom: 8 }}>LAST BILL</div>
                                        {selectedUser.lastBill ? (
                                            <>
                                                <div style={{ fontSize: 28, fontWeight: 800, color: '#1a2332' }}>₹{selectedUser.lastBill.total?.toLocaleString()}</div>
                                                <div style={{ fontSize: 12, color: '#5a6a7a', marginTop: 4 }}>
                                                    {selectedUser.lastBill.month} · {selectedUser.lastBill.units} kWh
                                                </div>
                                                <div style={{ marginTop: 8 }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                                                        background: selectedUser.lastBill.paid ? '#ecfdf5' : '#fef2f2',
                                                        color: selectedUser.lastBill.paid ? '#059669' : '#ef4444',
                                                    }}>
                                                        {selectedUser.lastBill.paid ? '✅ Paid' : '⚠️ Unpaid'}
                                                    </span>
                                                </div>
                                            </>
                                        ) : <div style={{ color: '#8a97a6' }}>No billing data available</div>}
                                    </div>
                                    {/* Usage Analytics */}
                                    <div style={{ background: '#f7f9fc', borderRadius: 12, padding: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6a7a', marginBottom: 8 }}>CONSUMPTION ANALYTICS</div>
                                        {selectedUser.lastBill ? (
                                            <>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                                    <div style={{ flex: 1, textAlign: 'center', background: '#e6f0ff', borderRadius: 8, padding: 10 }}>
                                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1a66d9' }}>{selectedUser.lastBill.units}</div>
                                                        <div style={{ fontSize: 10, color: '#5a6a7a' }}>kWh Used</div>
                                                    </div>
                                                    <div style={{ flex: 1, textAlign: 'center', background: '#fff7ed', borderRadius: 8, padding: 10 }}>
                                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>₹{selectedUser.lastBill.units > 0 ? (selectedUser.lastBill.total / selectedUser.lastBill.units).toFixed(1) : '—'}</div>
                                                        <div style={{ fontSize: 10, color: '#5a6a7a' }}>Avg ₹/kWh</div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 10, color: '#8a97a6' }}>
                                                    Daily avg: ~{(selectedUser.lastBill.units / 30).toFixed(1)} kWh · ~₹{(selectedUser.lastBill.total / 30).toFixed(0)}/day
                                                </div>
                                            </>
                                        ) : <div style={{ color: '#8a97a6' }}>No consumption data</div>}
                                    </div>
                                </div>
                            </div>

                            {/* ── Appliances ── */}
                            {(selectedUser.appliances || []).length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>🔌 Registered Appliances ({selectedUser.appliances.length})</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                                        {selectedUser.appliances.map((a, i) => (
                                            <div key={i} style={{ background: '#f7f9fc', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332' }}>{a.name}</div>
                                                    <div style={{ fontSize: 11, color: '#5a6a7a' }}>{a.watt}W · {a.usageHours}h/day</div>
                                                </div>
                                                <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: a.shiftable ? '#ecfdf5' : '#fef2f2', color: a.shiftable ? '#059669' : '#ef4444' }}>
                                                    {a.shiftable ? '🔄 Shiftable' : '🔒 Fixed'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Optimizer & Auto Settings ── */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>🤖 Optimization Settings</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div style={{ background: selectedUser.autoOptimize ? '#ecfdf5' : '#fef2f2', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                        <div style={{ fontSize: 22, marginBottom: 4 }}>{selectedUser.autoOptimize ? '✅' : '❌'}</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: selectedUser.autoOptimize ? '#059669' : '#ef4444' }}>{selectedUser.autoOptimize ? 'ON' : 'OFF'}</div>
                                        <div style={{ fontSize: 10, color: '#5a6a7a', marginTop: 2 }}>Auto Optimize</div>
                                    </div>
                                    <div style={{ background: '#f7f9fc', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                        <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2332' }}>{selectedUser.connType}</div>
                                        <div style={{ fontSize: 10, color: '#5a6a7a', marginTop: 2 }}>Connection Type</div>
                                    </div>
                                    <div style={{ background: '#f7f9fc', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                        <div style={{ fontSize: 22, marginBottom: 4 }}>📊</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2332' }}>{selectedUser.sanctionedLoad} kW</div>
                                        <div style={{ fontSize: 10, color: '#5a6a7a', marginTop: 2 }}>Sanctioned Load</div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Carbon Footprint ── */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>🌳 Carbon Footprint</h3>
                                {detailLoading || !carbonData ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#5a6a7a' }}>Loading carbon data…</div>
                                ) : (
                                    <>
                                        {/* Main carbon metrics */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                                            <div style={{ background: '#fef2f2', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                                <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{carbonData.carbonFootprintKg?.toFixed(1)}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a', marginTop: 2, fontWeight: 600 }}>kg CO₂ Footprint</div>
                                            </div>
                                            <div style={{ background: '#ecfdf5', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                                <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{carbonData.carbonSavedKg?.toFixed(1)}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a', marginTop: 2, fontWeight: 600 }}>kg CO₂ Saved</div>
                                            </div>
                                            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{carbonData.treesSavedMonthly}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a', marginTop: 2, fontWeight: 600 }}>🌲 Trees/Month</div>
                                            </div>
                                            <div style={{ background: '#e6f0ff', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                                <div style={{ fontSize: 20, fontWeight: 800, color: '#1a66d9' }}>{carbonData.kwhSavedMonthly}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a', marginTop: 2, fontWeight: 600 }}>kWh Saved/Month</div>
                                            </div>
                                        </div>

                                        {/* Equivalents */}
                                        <div style={{ background: '#f7f9fc', borderRadius: 12, padding: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6a7a', marginBottom: 8 }}>REAL-WORLD EQUIVALENTS</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 18 }}>💡</span>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2332' }}>{(carbonData.equivalents?.lightBulbHours || 0).toLocaleString()}</div>
                                                        <div style={{ fontSize: 10, color: '#5a6a7a' }}>Light Bulb Hours</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 18 }}>📱</span>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2332' }}>{(carbonData.equivalents?.phoneCharges || 0).toLocaleString()}</div>
                                                        <div style={{ fontSize: 10, color: '#5a6a7a' }}>Phone Charges</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 18 }}>🚗</span>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2332' }}>{(carbonData.equivalents?.drivingKmAvoided || 0).toLocaleString()}</div>
                                                        <div style={{ fontSize: 10, color: '#5a6a7a' }}>Driving km Avoided</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Yearly projection */}
                                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                            <div style={{ flex: 1, background: '#ecfdf5', borderRadius: 10, padding: 10, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>{carbonData.treesSavedYearly}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a' }}>🌲 Trees Saved/Year</div>
                                            </div>
                                            <div style={{ flex: 1, background: '#fff7ed', borderRadius: 10, padding: 10, textAlign: 'center', border: '1px solid #fed7aa' }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{carbonData.dailyAvgKwh?.toFixed(1)}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a' }}>⚡ Daily Avg kWh</div>
                                            </div>
                                            <div style={{ flex: 1, background: '#fef2f2', borderRadius: 10, padding: 10, textAlign: 'center', border: '1px solid #fecaca' }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>{carbonData.carKmEquivalent?.toFixed(0)}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a' }}>🚗 Car km Equivalent</div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ── Smart Nudges for this user ── */}
                            <div>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>🔔 Smart Nudges</h3>
                                {detailLoading ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#5a6a7a' }}>Loading nudges…</div>
                                ) : userNudges?.nudges?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {userNudges.nudges.map((n, i) => (
                                            <div key={i} style={{
                                                background: '#f7f9fc', borderRadius: 10, padding: 12,
                                                borderLeft: `3px solid ${n.color || '#3b82f6'}`,
                                                display: 'flex', gap: 10, alignItems: 'flex-start',
                                            }}>
                                                <span style={{ fontSize: 20 }}>{n.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332' }}>{n.title}</div>
                                                    <div style={{ fontSize: 11, color: '#5a6a7a', marginTop: 2 }}>{n.message}</div>
                                                    {n.savings?.perMonth > 0 && (
                                                        <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#ecfdf5', color: '#059669' }}>
                                                            💰 Save ₹{n.savings.perMonth}/mo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                            <div style={{ flex: 1, background: '#ecfdf5', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>₹{userNudges.potentialMonthlySavings}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a' }}>Potential Monthly Savings</div>
                                            </div>
                                            <div style={{ flex: 1, background: '#e6f0ff', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a66d9' }}>{userNudges.totalNudges}</div>
                                                <div style={{ fontSize: 10, color: '#5a6a7a' }}>Active Nudges</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 20, background: '#f7f9fc', borderRadius: 10, color: '#8a97a6' }}>No active nudges for this user</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal animation */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
