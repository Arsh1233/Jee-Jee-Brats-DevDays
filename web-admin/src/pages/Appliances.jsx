import { useState, useEffect } from 'react';
import { fetchAppliances, toggleAppliance } from '../services/api';

export default function AppliancesPage() {
    const [appliances, setAppliances] = useState([]);
    const [toggling, setToggling] = useState(null);

    useEffect(() => {
        fetchAppliances().then(setAppliances).catch(console.error);
    }, []);

    const handleToggle = async (id) => {
        setToggling(id);
        try {
            const updated = await toggleAppliance(id);
            setAppliances(prev => prev.map(a => a.id === id ? updated : a));
        } catch (e) { console.error(e); }
        finally { setToggling(null); }
    };

    const ICONS = { Lamp: '💡', Fan: '🌀', Heater: '🔥' };
    const COLORS = { Lamp: '#ff9800', Fan: '#2196f3', Heater: '#e91e63' };
    const activeLoad = appliances.filter(a => a.isOn).reduce((s, a) => s + a.wattage, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>🔌 Appliances</h2>
                <p>Monitor and control connected smart plugs</p>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-icon purple">🔌</div>
                    <div className="stat-value">{appliances.length}</div>
                    <div className="stat-label">Total Devices</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-value">{appliances.filter(a => a.isOn).length}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan">⚡</div>
                    <div className="stat-value">{activeLoad}W</div>
                    <div className="stat-label">Total Load</div>
                </div>
            </div>

            <div className="glass-panel">
                <h3>Connected Devices</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Device</th>
                            <th>Wattage</th>
                            <th>Status</th>
                            <th>Schedule</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appliances.map(a => (
                            <tr key={a.id}>
                                <td>
                                    <span style={{ fontSize: 20, marginRight: 8 }}>{ICONS[a.name] || '🔌'}</span>
                                    <strong>{a.name}</strong>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>{a.type}</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{a.wattage}W</span>
                                        <div style={{ flex: 1, maxWidth: 80, height: 6, background: '#e8e8e8', borderRadius: 3 }}>
                                            <div style={{
                                                height: 6, borderRadius: 3,
                                                width: `${Math.min((a.wattage / 2000) * 100, 100)}%`,
                                                background: a.isOn ? (COLORS[a.name] || 'var(--accent)') : '#d0d0d0',
                                            }} />
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${a.isOn ? 'online' : 'peak'}`}>
                                        {a.isOn ? 'ON' : 'OFF'}
                                    </span>
                                </td>
                                <td style={{ color: a.schedule ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13 }}>
                                    {a.schedule ? `⏰ ${a.schedule.startHour}:00 – ${a.schedule.endHour}:00` : '—'}
                                </td>
                                <td>
                                    <button
                                        className={`btn ${a.isOn ? 'btn-ghost' : 'btn-primary'}`}
                                        onClick={() => handleToggle(a.id)}
                                        disabled={toggling === a.id}
                                        style={{ minWidth: 70 }}
                                    >
                                        {toggling === a.id ? '...' : a.isOn ? 'Turn Off' : 'Turn On'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
