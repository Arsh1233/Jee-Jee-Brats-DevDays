import React, { useState, useEffect } from 'react';

const API = '';

export default function TariffManagement() {
    const [tariffs, setTariffs] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [current, setCurrent] = useState(null);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        try {
            const [t, f, c] = await Promise.all([
                fetch(`${API}/api/tariffs`).then(r => r.json()),
                fetch(`${API}/api/tariffs/forecast`).then(r => r.json()),
                fetch(`${API}/api/tariffs/current`).then(r => r.json()),
            ]);
            setTariffs(Array.isArray(t) ? t : []);
            setForecast(Array.isArray(f) ? f : []);
            setCurrent(c);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function save(id, updates) {
        await fetch(`${API}/api/tariffs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        setEditing(null); load();
    }

    useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

    if (loading) return <div className="page-container"><p>Loading tariffs…</p></div>;

    const maxLoad = Math.max(...forecast.map(f => f.gridLoad));

    return (
        <div className="page-container">
            <h1 className="page-title">⚡ Tariff Management</h1>
            <p className="page-subtitle">Live rates • 24-hour forecast • Grid load</p>

            {/* Current tariff banner */}
            {current && (
                <div className="stat-card" style={{ marginBottom: 20, borderLeft: '4px solid ' + (current.name === 'Peak' ? '#e53935' : current.name === 'Shoulder' ? '#ffab40' : '#43a047') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#1a2332', fontWeight: 800, fontSize: 18 }}>
                                Currently: {current.name} Tariff
                            </div>
                            <div style={{ color: '#4a6080', fontSize: 13, marginTop: 4 }}>
                                Rate: <b style={{ color: '#1a2332' }}>₹{current.ratePerUnit}/kWh</b>
                                &nbsp;&nbsp;Grid Load: <b style={{ color: current.gridLoad > 80 ? '#c62828' : '#2e7d32' }}>{current.gridLoad}%</b>
                            </div>
                        </div>
                        <div style={{ fontSize: 32 }}>{current.name === 'Peak' ? '🔴' : current.name === 'Shoulder' ? '🟡' : '🟢'}</div>
                    </div>
                </div>
            )}

            {/* 24-hour forecast bar chart */}
            <div className="stat-card" style={{ marginBottom: 20 }}>
                <h3 style={{ color: '#1a2332', marginTop: 0, marginBottom: 12 }}>24-Hour Tariff & Grid Load Forecast</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 2, paddingBottom: 4 }}>
                    {forecast.map((f, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                            <div title={`${f.label}: ₹${f.ratePerUnit}/kWh, Load:${f.gridLoad}%`} style={{
                                width: '100%', borderRadius: '3px 3px 0 0',
                                height: `${(f.gridLoad / maxLoad) * 70}%`,
                                background: f.tariffName === 'Peak' ? '#e53935' : f.tariffName === 'Shoulder' ? '#ffab40' : '#1976d2',
                                opacity: i === 0 ? 1 : 0.7,
                            }} />
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {[0, 6, 12, 18, 23].map(h => (
                        <span key={h} style={{ color: '#4a7fa5', fontSize: 9 }}>
                            {String(forecast[h]?.hour ?? h).padStart(2, '0')}:00
                        </span>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    {[['Peak', '#e53935'], ['Shoulder', '#ffab40'], ['Off-Peak', '#1976d2']].map(([n, c]) => (
                        <span key={n} style={{ fontSize: 11, color: '#4a6080', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />{n}
                        </span>
                    ))}
                </div>
            </div>

            {/* Tariff editor */}
            <h3 style={{ color: '#1a2332', marginBottom: 12 }}>Tariff Schedules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tariffs.map(t => (
                    <div key={t.id} className="stat-card">
                        {editing?.id === t.id ? (
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                {[
                                    { label: 'Name', key: 'name', type: 'text' },
                                    { label: 'Rate (₹/kWh)', key: 'ratePerUnit', type: 'number' },
                                    { label: 'Start Hour', key: 'startHour', type: 'number' },
                                    { label: 'End Hour', key: 'endHour', type: 'number' },
                                ].map(f => (
                                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <label style={{ color: '#4a6080', fontSize: 11 }}>{f.label}</label>
                                        <input
                                            type={f.type}
                                            value={editing[f.key]}
                                            onChange={e => setEditing(prev => ({ ...prev, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #dfe7ef', background: '#f7f9fc', color: '#1a2332', width: 100 }}
                                        />
                                    </div>
                                ))}
                                <button onClick={() => save(t.id, editing)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                                <button onClick={() => setEditing(null)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #dfe7ef', background: 'transparent', color: '#5a6a7a', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: 15, fontWeight: 800, color: '#1a2332' }}>{t.name}</span>
                                    <span style={{ marginLeft: 12, color: '#1a66d9', fontWeight: 700 }}>₹{t.ratePerUnit}/kWh</span>
                                    <span style={{ marginLeft: 12, color: '#4a6080', fontSize: 12 }}>
                                        {String(t.startHour).padStart(2, '0')}:00 – {String(t.endHour).padStart(2, '0')}:00
                                    </span>
                                </div>
                                <button onClick={() => setEditing({ ...t })}
                                    style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #dfe7ef', background: 'transparent', color: '#1a66d9', cursor: 'pointer', fontWeight: 600 }}>
                                    ✏ Edit
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
