import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = { residential: '#1976d2', commercial: '#43a047', industrial: '#ff8f00' };

function StatCard({ icon, label, value, sub, color = '#64b5f6' }) {
    return (
        <div className="stat-card" style={{ borderTop: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: '#5a6a7a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: '#5a7a95', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

// Simulated activity feed
const ACTIVITY_TYPES = [
    { icon: '👤', text: (uid) => `User ${uid} logged in from mobile app`, color: '#1976d2' },
    { icon: '💰', text: (uid) => `Bill payment received — User ${uid}`, color: '#2e7d32' },
    { icon: '⚡', text: () => `Optimizer run completed — 45 users optimized`, color: '#ba68c8' },
    { icon: '📋', text: (uid) => `New complaint filed by User ${uid}`, color: '#e65100' },
    { icon: '🔔', text: () => `Power cut alert broadcast to Sector 12`, color: '#c62828' },
    { icon: '🤖', text: () => `AI model re-trained successfully — Accuracy: 97.3%`, color: '#0097a7' },
    { icon: '🌳', text: () => `Fleet CO₂ offset milestone: 5,000 kg this month`, color: '#2e7d32' },
    { icon: '📱', text: (uid) => `New device registered by User ${uid}`, color: '#7b1fa2' },
];

function generateActivities() {
    const now = Date.now();
    return Array.from({ length: 8 }, (_, i) => {
        const type = ACTIVITY_TYPES[i % ACTIVITY_TYPES.length];
        const uid = `USR00${String(Math.floor(Math.random() * 999) + 1).padStart(4, '0')}`;
        return {
            id: i,
            icon: type.icon,
            text: type.text(uid),
            color: type.color,
            time: new Date(now - i * 120000 - Math.random() * 60000),
        };
    });
}

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activities] = useState(generateActivities);
    const [health, setHealth] = useState(null);

    const load = useCallback(async () => {
        try {
            const data = await fetch('/api/admin/dashboard').then(r => r.json());
            setStats(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [load]);

    useEffect(() => {
        fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => {});
    }, []);

    if (loading) return (
        <div className="page-container">
            <p style={{ color: '#5a7a95', textAlign: 'center', paddingTop: 60 }}>⚡ Loading dashboard…</p>
        </div>
    );

    if (!stats) return <div className="page-container"><p style={{ color: '#ef5350' }}>Failed to load.</p></div>;

    const pieData = [
        { name: 'Residential', value: stats.byType?.residential ?? 0 },
        { name: 'Commercial', value: stats.byType?.commercial ?? 0 },
        { name: 'Industrial', value: stats.byType?.industrial ?? 0 },
    ];

    const tariff = stats.currentTariff;
    const optStatus = stats.optimizerStatus;

    return (
        <div className="page-container">
            {/* ── Welcome Banner ────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0b2a52, #1565c0)',
                borderRadius: 16, padding: '28px 32px', marginBottom: 24,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
            }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
                        Welcome back, Admin
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>
                        {stats.totalUsers?.toLocaleString()} smart meter connections · Last updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{
                        padding: '10px 20px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                        color: '#fff', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: '#69f0ae' }} />
                        All Systems Operational
                    </div>
                    {health && (
                        <div style={{
                            padding: '10px 20px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600,
                        }}>
                            RAM: {health.memoryMB}MB
                        </div>
                    )}
                </div>
            </div>

            {/* ── KPI Row 1 ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                <StatCard icon="👥" label="Total Users" value={stats.totalUsers?.toLocaleString()} color="#64b5f6" />
                <StatCard icon="✅" label="Active" value={stats.activeUsers?.toLocaleString()} sub={`${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total`} color="#69f0ae" />
                <StatCard icon="⚠️" label="Defaulters" value={stats.defaulters?.toLocaleString()} sub="Unpaid latest bill" color="#ef5350" />
                <StatCard icon="🤖" label="Auto-Optimized" value={stats.autoOptUsers?.toLocaleString()} sub="Users with auto-opt ON" color="#ba68c8" />
                <StatCard icon="⚡" label="24h Consumption" value={`${(stats.totalKwh24h / 1000).toFixed(1)} MWh`} sub="All users combined" color="#ffab40" />
            </div>

            {/* ── KPI Row 2 — Revenue ────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                <StatCard icon="💰" label="Revenue This Month" value={`₹${(stats.revenueThisMonth / 100000).toFixed(1)}L`} sub="Paid bills only" color="#69f0ae" />
                <StatCard icon="🔴" label="Outstanding Dues" value={`₹${(stats.outstandingDues / 100000).toFixed(1)}L`} sub="Unpaid bills" color="#ef5350" />
                <div className="stat-card" style={{ borderTop: '3px solid #1976d2' }}>
                    <div style={{ fontSize: 13, color: '#1a2332', fontWeight: 700, marginBottom: 8 }}>
                        Current Tariff Period
                    </div>
                    <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                        background: tariff?.name === 'Peak' ? '#ffebee' : tariff?.name === 'Shoulder' ? '#fff8e1' : '#e8f5e9',
                        color: tariff?.name === 'Peak' ? '#c62828' : tariff?.name === 'Shoulder' ? '#e65100' : '#2e7d32',
                    }}>
                        ● {tariff?.name}
                    </span>
                    <div style={{ color: '#4a6080', fontSize: 13, marginTop: 8 }}>
                        ₹{tariff?.ratePerUnit}/unit · Grid {tariff?.gridLoad}% load
                    </div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #ba68c8' }}>
                    <div style={{ fontSize: 13, color: '#1a2332', fontWeight: 700, marginBottom: 8 }}>🤖 Optimizer Engine</div>
                    <div style={{ color: optStatus?.isRunning ? '#2e7d32' : '#c62828', fontWeight: 800, fontSize: 13 }}>
                        {optStatus?.isRunning ? '● Running' : '○ Stopped'}
                    </div>
                    <div style={{ color: '#4a6080', fontSize: 12, marginTop: 6 }}>
                        {optStatus?.runsCompleted} runs · ₹{Math.round(optStatus?.totalSavingsGenerated ?? 0).toLocaleString()} total savings
                    </div>
                    {optStatus?.lastRun && (
                        <div style={{ color: '#5a7a95', fontSize: 11, marginTop: 4 }}>
                            Last: {new Date(optStatus.lastRun).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Charts + Activity Feed row ──────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Monthly Consumption Chart */}
                {stats.monthlyConsumption?.length > 0 && (
                    <div className="stat-card">
                        <h3 style={{ color: '#1a2332', margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>📊 Avg Monthly Consumption (kWh/user)</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.monthlyConsumption} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.1)" />
                                <XAxis dataKey="month" tick={{ fill: '#5a6a7a', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#5a6a7a', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: '#fff', border: '1px solid #dfe7ef', borderRadius: 8, color: '#1a2332', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                    formatter={(v) => [`${v} kWh`, 'Avg Consumption']}
                                />
                                <Bar dataKey="avgKwh" fill="#1976d2" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Connection Type Pie */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ color: '#1a2332', margin: '0 0 12px', fontSize: 15, alignSelf: 'flex-start', fontWeight: 700 }}>🔌 Connection Breakdown</h3>
                    <PieChart width={200} height={180}>
                        <Pie data={pieData} cx={100} cy={85} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {pieData.map((entry) => (
                                <Cell key={entry.name} fill={PIE_COLORS[entry.name.toLowerCase()]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #dfe7ef', borderRadius: 8, color: '#1a2332', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        />
                    </PieChart>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 4 }}>
                        {pieData.map(d => (
                            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[d.name.toLowerCase()] }} />
                                    <span style={{ color: '#5a6a7a', fontSize: 12 }}>{d.name}</span>
                                </div>
                                <span style={{ color: '#1a2332', fontWeight: 700, fontSize: 13 }}>{d.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Recent Activity Feed ─────────────────── */}
            <div className="stat-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ color: '#1a2332', margin: 0, fontSize: 15, fontWeight: 700 }}>📋 Recent Activity</h3>
                    <span style={{ fontSize: 11, color: '#5a6a7a', fontWeight: 600 }}>Live Feed</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {activities.map((a, i) => (
                        <div key={a.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 0',
                            borderBottom: i < activities.length - 1 ? '1px solid #f0f3f7' : 'none',
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: `${a.color}15`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
                            }}>{a.icon}</div>
                            <div style={{ flex: 1, fontSize: 13, color: '#3d4f62' }}>{a.text}</div>
                            <div style={{ fontSize: 11, color: '#8a9ab5', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {a.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Quick Actions ────────────────────────── */}
            <div className="stat-card">
                <h3 style={{ color: '#1a2332', margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {[
                        { icon: '🤖', label: 'Run Optimizer', color: '#1976d2', action: () => fetch('/api/optimizer/run', { method: 'POST' }) },
                        { icon: '🔔', label: 'Send Notification', color: '#e65100', href: '#/notifications' },
                        { icon: '📋', label: 'View Complaints', color: '#7b1fa2', href: '#/complaints' },
                        { icon: '👥', label: 'Manage Users', color: '#00838f', href: '#/users' },
                    ].map(qa => (
                        <button key={qa.label} onClick={qa.action || (() => window.location.hash = qa.href?.replace('#', '') || '/')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                                borderRadius: 12, border: `1.5px solid ${qa.color}20`,
                                background: `${qa.color}08`, cursor: 'pointer',
                                fontSize: 13, fontWeight: 600, color: qa.color,
                                transition: 'all 0.2s ease', fontFamily: 'inherit',
                            }}
                            onMouseOver={e => e.currentTarget.style.background = `${qa.color}15`}
                            onMouseOut={e => e.currentTarget.style.background = `${qa.color}08`}
                        >
                            <span style={{ fontSize: 18 }}>{qa.icon}</span>
                            {qa.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
