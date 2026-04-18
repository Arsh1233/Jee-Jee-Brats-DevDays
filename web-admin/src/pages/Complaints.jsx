import React, { useState, useEffect } from 'react';
import BACKEND_URL from '../config';

const STATUS_OPTS = ['Pending', 'In Progress', 'Resolved', 'Closed'];

const STATUS_STYLE = {
    Pending: { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
    'In Progress': { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
    Resolved: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Closed: { bg: '#f3e5f5', color: '#6a1b9a', border: '#ce93d8' },
};

const CAT_ICONS = {
    'Power Cut': '⚡',
    'Billing': '🧾',
    'Meter Fault': '📟',
    'Street Light': '💡',
    Other: '📋',
};

export default function Complaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [adminNotes, setAdminNotes] = useState({});

    const load = () => {
        fetch(`${BACKEND_URL}/api/complaints/all${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)
            .then(r => r.json())
            .then(d => { setComplaints(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { setLoading(true); load(); }, [statusFilter]);

    const filtered = complaints.filter(c => {
        const q = search.toLowerCase();
        return !q || c.name?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q) ||
            c.bpNumber?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q);
    });

    const updateStatus = async (id, status) => {
        setUpdatingId(id);
        try {
            await fetch(`${BACKEND_URL}/api/complaints/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNote: adminNotes[id] }),
            });
            load();
        } catch (e) { console.error(e); }
        finally { setUpdatingId(null); }
    };

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
    };

    if (loading) return <div className="animate-in"><p style={{ color: '#7badc5', padding: 40, textAlign: 'center' }}>Loading complaints…</p></div>;

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>📋 Complaints</h2>
                <p>View and manage all user service requests</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                    { label: 'Total', val: stats.total, icon: '📋', color: '#64b5f6' },
                    { label: 'Pending', val: stats.pending, icon: '⏳', color: '#ffab40' },
                    { label: 'In Progress', val: stats.inProgress, icon: '🔄', color: '#4fc3f7' },
                    { label: 'Resolved', val: stats.resolved, icon: '✅', color: '#69f0ae' },
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                        <div style={{ fontSize: 24 }}>{s.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 12, color: '#5a6a7a', fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="glass-panel">
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        placeholder="Search by name, BP, subject…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{
                            flex: 1, minWidth: 200, padding: '9px 14px',
                            background: '#f7f9fc', color: '#1a2332',
                            border: '1.5px solid #dfe7ef', borderRadius: 8, outline: 'none', fontSize: 13,
                        }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['all', 'Pending', 'In Progress', 'Resolved', 'Closed'].map(f => (
                            <button key={f} onClick={() => setStatusFilter(f)} style={{
                                background: statusFilter === f ? '#1a66d9' : '#ffffff',
                                color: statusFilter === f ? '#fff' : '#1a2332',
                                border: `1.5px solid ${statusFilter === f ? '#1a66d9' : '#dfe7ef'}`,
                            }}>
                                {f === 'all' ? 'All' : f}
                            </button>
                        ))}
                    </div>
                </div>

                <h3 style={{ marginBottom: 16 }}>{filtered.length} complaint{filtered.length !== 1 ? 's' : ''}</h3>

                {filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#5a6a7a', padding: 40 }}>📋 No complaints found</p>
                )}

                {filtered.map(c => {
                    const ss = STATUS_STYLE[c.status] || STATUS_STYLE.Pending;
                    return (
                        <div key={c.id} style={{
                            background: '#ffffff', border: '1px solid #dfe7ef',
                            borderRadius: 14, padding: 18, marginBottom: 14,
                            boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                {/* Left */}
                                <div style={{ flex: 1, minWidth: 260 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <span style={{ fontSize: 22 }}>{CAT_ICONS[c.category] || '📋'}</span>
                                        <div>
                                            <div style={{ color: '#1a2332', fontWeight: 700, fontSize: 14 }}>{c.subject}</div>
                                            <div style={{ color: '#5a6a7a', fontSize: 12, marginTop: 2 }}>
                                                {c.name} · {c.bpNumber} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                                            marginLeft: 'auto',
                                        }}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 20, fontSize: 11,
                                            background: '#e3f2fd', color: '#1565c0', fontWeight: 600,
                                        }}>{c.category}</span>
                                        {c.contact && (
                                            <span style={{ color: '#5a6a7a', fontSize: 12 }}>✉️ {c.contact}</span>
                                        )}
                                    </div>
                                    <p style={{ color: '#3d4f62', fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>{c.description}</p>
                                    {c.adminNote && (
                                        <div style={{ background: '#e8f0fe', border: '1px solid #c5d8f7', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                                            <span style={{ color: '#1a66d9', fontSize: 12 }}>🛡️ Admin Note: {c.adminNote}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right — Status Control */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                                    <label style={{ color: '#5a6a7a', fontSize: 11, fontWeight: 600 }}>UPDATE STATUS</label>
                                    <select
                                        value={c.status}
                                        onChange={e => updateStatus(c.id, e.target.value)}
                                        disabled={updatingId === c.id}
                                        style={{
                                            padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                            background: '#f7f9fc', color: '#1a2332', border: '1.5px solid #dfe7ef',
                                            cursor: 'pointer', outline: 'none',
                                        }}
                                    >
                                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <textarea
                                        placeholder="Admin note (optional)…"
                                        rows={2}
                                        value={adminNotes[c.id] || ''}
                                        onChange={e => setAdminNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        style={{
                                            padding: '8px 12px', borderRadius: 8, fontSize: 12,
                                            background: '#f7f9fc', color: '#1a2332', border: '1.5px solid #dfe7ef',
                                            resize: 'none', outline: 'none', fontFamily: 'inherit',
                                        }}
                                    />
                                    <button
                                        onClick={() => updateStatus(c.id, c.status)}
                                        disabled={updatingId === c.id}
                                        style={{
                                            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                            background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        {updatingId === c.id ? 'Saving…' : '💾 Save Note'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
