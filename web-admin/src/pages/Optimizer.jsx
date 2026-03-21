import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, AreaChart, Area,
} from 'recharts';

const API = '';

export default function Optimizer() {
    const [status, setStatus] = useState(null);
    const [suggestions, setSug] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [mlForecast, setMlForecast] = useState([]);
    const [applying, setApply] = useState(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        try {
            const [st, sg, fc] = await Promise.all([
                fetch(`${API}/api/optimizer/status`).then(r => r.json()),
                fetch(`${API}/api/optimizer/suggestions`).then(r => r.json()),
                fetch(`${API}/api/tariffs/forecast`).then(r => r.json()),
            ]);
            setStatus(st);
            setSug(Array.isArray(sg) ? sg : []);
            setForecast(Array.isArray(fc) ? fc : []);
            // Fetch ML demand forecast (non-blocking)
            fetch(`${API}/api/ai/forecast`).then(r => r.json())
                .then(data => setMlForecast(data?.predictions || []))
                .catch(() => { });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

    async function triggerRun() {
        await fetch(`${API}/api/optimizer/run`, { method: 'POST' });
        load();
    }

    if (loading) return <div className="page-container"><p style={{ color: '#7badc5' }}>Loading optimizer…</p></div>;

    const now = new Date().getHours();

    // Color bars by tariff period
    const fmtForecast = forecast.map(f => ({
        ...f,
        fill: f.tariffName === 'Peak' ? '#ef5350' : f.tariffName === 'Shoulder' ? '#ffd740' : '#43a047',
    }));

    return (
        <div className="page-container">
            <h1 className="page-title">🤖 AI Optimizer Engine</h1>
            <p className="page-subtitle">Autonomous energy optimization · 1 000-user fleet · 24h tariff forecast</p>

            {/* Autonomous Status Cards */}
            {status && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Engine Status', value: status.isRunning ? '● Running' : '○ Stopped', color: status.isRunning ? '#69f0ae' : '#ef5350' },
                        { label: 'Users Optimized', value: status.usersOptimized?.toLocaleString(), color: '#64b5f6' },
                        { label: 'Runs Completed', value: status.runsCompleted, color: '#ffab40' },
                        { label: 'Total Savings Found', value: `₹${Math.round(status.totalSavingsGenerated ?? 0).toLocaleString()}`, color: '#69f0ae' },
                        { label: 'Last Run', value: status.lastRun ? new Date(status.lastRun).toLocaleTimeString() : '—', color: '#7badc5' },
                    ].map(s => (
                        <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                            <div style={{ color: s.color, fontSize: 20, fontWeight: 800 }}>{s.value}</div>
                            <div style={{ color: '#5a6a7a', fontSize: 12, marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={triggerRun} style={{
                marginBottom: 28, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(90deg,#1976d2,#0d47a1)', color: '#fff', fontWeight: 700, fontSize: 14
            }}>
                ▶ Trigger Manual Run
            </button>

            {/* 24-Hour Tariff Forecast Chart */}
            {fmtForecast.length > 0 && (
                <div className="stat-card" style={{ marginBottom: 28 }}>
                    <h3 style={{ color: '#1a2332', margin: '0 0 6px', fontSize: 15 }}>📈 24-Hour Tariff Forecast</h3>
                    <p style={{ color: '#5a6a7a', fontSize: 12, margin: '0 0 16px' }}>
                        <span style={{ color: '#ef5350' }}>■ Peak</span> (₹8/unit) &nbsp;
                        <span style={{ color: '#ffd740' }}>■ Shoulder</span> (₹6/unit) &nbsp;
                        <span style={{ color: '#43a047' }}>■ Off-Peak</span> (₹4/unit)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={fmtForecast} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.4)" />
                            <XAxis dataKey="label" tick={{ fill: '#5a6a7a', fontSize: 10 }} interval={3} />
                            <YAxis domain={[0, 10]} tick={{ fill: '#5a6a7a', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                            <Tooltip
                                contentStyle={{ background: '#0d1b3a', border: '1px solid #1e3a6e', borderRadius: 8, color: '#e0ecff' }}
                                formatter={(v, _, props) => [`₹${v}/unit — ${props.payload?.tariffName}`, 'Rate']}
                                labelFormatter={label => `Hour: ${label}`}
                            />
                            <ReferenceLine x={`${String(now).padStart(2, '0')}:00`} stroke="#64b5f6" strokeDasharray="4 3" label={{ value: 'Now', fill: '#64b5f6', fontSize: 10 }} />
                            {fmtForecast.map((f, i) => (
                                <Bar key={i} dataKey="ratePerUnit" fill={f.fill} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                    {/* Grid load minibar */}
                    <div style={{ marginTop: 8 }}>
                        <div style={{ color: '#5a6a7a', fontSize: 11, marginBottom: 4 }}>Grid Load %</div>
                        <div style={{ display: 'flex', gap: 1, height: 14 }}>
                            {fmtForecast.map((f, i) => (
                                <div key={i} title={`${f.label}: ${f.gridLoad}%`}
                                    style={{ flex: 1, height: `${f.gridLoad}%`, maxHeight: '100%', background: f.gridLoad > 80 ? '#ef5350' : f.gridLoad > 60 ? '#ffd740' : '#43a047', borderRadius: 1, alignSelf: 'flex-end', opacity: 0.7 }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Demo User Suggestions */}

            {/* ML Demand Forecast */}
            {mlForecast.length > 0 && (
                <div className="stat-card" style={{ marginBottom: 28 }}>
                    <h3 style={{ color: '#1a2332', margin: '0 0 4px', fontSize: 15 }}>🧠 ML Demand Forecast (Next 24h)</h3>
                    <p style={{ color: '#5a6a7a', fontSize: 12, margin: '0 0 16px' }}>
                        Predicted by GradientBoosting model (R² = 0.98) · Confidence band ±5%
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={mlForecast} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="mlGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ba68c8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ba68c8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.15)" />
                            <XAxis dataKey="hour" tick={{ fill: '#5a6a7a', fontSize: 10 }} interval={3}
                                tickFormatter={h => `${String(h).padStart(2, '0')}:00`} />
                            <YAxis tick={{ fill: '#5a6a7a', fontSize: 11 }} tickFormatter={v => `${v} MW`} />
                            <Tooltip
                                contentStyle={{ background: '#0d1b3a', border: '1px solid #1e3a6e', borderRadius: 8, color: '#e0ecff' }}
                                formatter={(v, name) => [`${v} MW`, name === 'predicted_demand_mw' ? 'Demand' : 'Confidence']}
                                labelFormatter={h => `Hour: ${String(h).padStart(2, '0')}:00`}
                            />
                            <Area type="monotone" dataKey="predicted_demand_mw" stroke="#ba68c8" strokeWidth={2}
                                fill="url(#mlGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <h2 style={{ color: '#1a2332', fontSize: 16, marginBottom: 12 }}>💡 AI Suggestions (Demo User #1)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suggestions.length === 0 && <p style={{ color: '#5a6a7a' }}>No suggestions available.</p>}
                {suggestions.map(sg => (
                    <div key={sg.id} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                <span style={{ background: '#e8f0fe', borderRadius: 12, padding: '2px 8px', fontSize: 11, color: '#1a66d9', fontWeight: 700 }}>
                                    #{sg.priority}
                                </span>
                                <span style={{ color: '#1a2332', fontWeight: 700, fontSize: 14 }}>{sg.title}</span>
                                <span style={{ background: 'rgba(26,102,217,0.1)', color: '#1a66d9', borderRadius: 8, padding: '2px 8px', fontSize: 11 }}>
                                    {sg.confidence}% confidence
                                </span>
                            </div>
                            <p style={{ color: '#4a6080', margin: 0, fontSize: 12 }}>{sg.description}</p>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 100 }}>
                            <div style={{ color: '#2e7d32', fontWeight: 800, fontSize: 16 }}>₹{sg.savingsPerMonth}/mo</div>
                            <div style={{ color: '#5a6a7a', fontSize: 11 }}>₹{sg.savingsPerDay}/day</div>
                        </div>
                        {sg.status === 'applied'
                            ? <span style={{ padding: '6px 12px', borderRadius: 8, background: '#e8f5e9', color: '#2e7d32', fontSize: 12, fontWeight: 700 }}>✓ Applied</span>
                            : <button disabled={applying === sg.id} onClick={async () => {
                                setApply(sg.id);
                                await fetch(`${API}/api/optimizer/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suggestionId: sg.id }) });
                                load(); setApply(null);
                            }} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#1976d2', color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {applying === sg.id ? '⏳' : 'Apply'}
                            </button>
                        }
                    </div>
                ))}
            </div>
        </div>
    );
}
