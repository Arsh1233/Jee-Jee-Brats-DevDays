import { useState, useEffect } from 'react';

const TYPE_CONFIG = {
    warning: { icon: '⚠️', bg: '#fff3e0', border: '#ffcc80' },
    info: { icon: 'ℹ️', bg: '#e3f2fd', border: '#90caf9' },
    tip: { icon: '💡', bg: '#e8f5e9', border: '#a5d6a7' },
    powercut: { icon: '⚡', bg: '#ffebee', border: '#ef9a9a' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [deleting, setDeleting] = useState(null);

    // Power Cut Alert form state
    const [pcArea, setPcArea] = useState('');
    const [pcDuration, setPcDuration] = useState('');
    const [pcMessage, setPcMessage] = useState('');
    const [pcStartTime, setPcStartTime] = useState('');
    const [sending, setSending] = useState(false);
    const [sentMsg, setSentMsg] = useState('');

    // General notification form state
    const [gnTitle, setGnTitle] = useState('');
    const [gnMessage, setGnMessage] = useState('');
    const [gnType, setGnType] = useState('info');
    const [gnSending, setGnSending] = useState(false);

    const load = () =>
        fetch('/api/notifications').then(r => r.json()).then(setNotifications).catch(console.error);

    useEffect(() => { load(); }, []);

    const sendPowerCut = async () => {
        if (!pcArea.trim() || !pcMessage.trim()) return;
        setSending(true);
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `⚡ Power Cut Alert — ${pcArea}`,
                    message: pcMessage,
                    type: 'powercut',
                    area: pcArea,
                    estimatedDuration: pcDuration,
                    startTime: pcStartTime || new Date().toISOString(),
                }),
            });
            setSentMsg(`✅ Power cut alert sent for ${pcArea}`);
            setPcArea(''); setPcDuration(''); setPcMessage(''); setPcStartTime('');
            load();
            setTimeout(() => setSentMsg(''), 5000);
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    const sendGeneral = async () => {
        if (!gnTitle.trim() || !gnMessage.trim()) return;
        setGnSending(true);
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: gnTitle, message: gnMessage, type: gnType }),
            });
            setGnTitle(''); setGnMessage(''); setGnType('info');
            load();
        } catch (e) { console.error(e); }
        finally { setGnSending(false); }
    };

    const deleteNotif = async (id) => {
        setDeleting(id);
        try {
            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            load();
        } catch (e) { console.error(e); }
        finally { setDeleting(null); }
    };

    const powerCuts = notifications.filter(n => n.type === 'powercut');

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>🔔 Notifications & Alerts</h2>
                <p>System alerts, power cut broadcasts, and smart energy tips</p>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                    { label: 'Total', val: notifications.length, icon: '🔔', color: '#ba68c8' },
                    { label: 'Unread', val: notifications.filter(n => !n.isRead).length, icon: '🆕', color: '#4fc3f7' },
                    { label: 'Warnings', val: notifications.filter(n => n.type === 'warning').length, icon: '⚠️', color: '#ffab40' },
                    { label: 'Power Cuts', val: powerCuts.length, icon: '⚡', color: '#ef5350' },
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                        <div style={{ fontSize: 24 }}>{s.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 12, color: '#4a7fa5', fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Power Cut Alert Form ─────────────────────────────── */}
            <div className="glass-panel" style={{ borderLeft: '4px solid #ef5350', marginBottom: 20 }}>
                <h3 style={{ color: '#ef5350', marginBottom: 4 }}>⚡ Send Power Cut Alert</h3>
                <p style={{ color: '#5a6a7a', fontSize: 13, marginBottom: 20 }}>
                    Broadcast an immediate power outage alert to all mobile app users.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={{ display: 'block', color: '#4a7fa5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>AREA / ZONE *</label>
                        <input
                            value={pcArea} onChange={e => setPcArea(e.target.value)}
                            placeholder="e.g. Sector 12, Zone B, Ward 5…"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#4a7fa5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>ESTIMATED DURATION</label>
                        <input
                            value={pcDuration} onChange={e => setPcDuration(e.target.value)}
                            placeholder="e.g. 2 hours, 4–6 hours…"
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', color: '#4a7fa5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>MESSAGE *</label>
                    <textarea
                        value={pcMessage} onChange={e => setPcMessage(e.target.value)}
                        rows={3}
                        placeholder="e.g. Power supply will be suspended for maintenance work. We apologise for the inconvenience."
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                </div>
                <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', color: '#4a7fa5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>START TIME (optional)</label>
                    <input
                        type="datetime-local"
                        value={pcStartTime} onChange={e => setPcStartTime(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                {sentMsg && (
                    <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10, padding: '10px 16px', marginBottom: 14, color: '#2e7d32', fontSize: 13, fontWeight: 600 }}>
                        {sentMsg}
                    </div>
                )}
                <button
                    onClick={sendPowerCut}
                    disabled={sending || !pcArea.trim() || !pcMessage.trim()}
                    style={{
                        padding: '11px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                        background: '#c62828', color: '#fff', border: 'none', cursor: 'pointer',
                        opacity: (sending || !pcArea.trim() || !pcMessage.trim()) ? 0.6 : 1,
                    }}
                >
                    {sending ? '📡 Sending…' : '⚡ Send Power Cut Alert'}
                </button>
            </div>

            {/* ── General Notification Form ───────────────────────── */}
            <div className="glass-panel" style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 16 }}>📢 Send General Notification</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={{ display: 'block', color: '#4a7fa5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>TITLE</label>
                        <input value={gnTitle} onChange={e => setGnTitle(e.target.value)} placeholder="Notification title…" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#4a7fa5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>TYPE</label>
                        <select value={gnType} onChange={e => setGnType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            {['info', 'warning', 'tip'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', color: '#4a7fa5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>MESSAGE</label>
                    <textarea value={gnMessage} onChange={e => setGnMessage(e.target.value)} rows={2}
                        placeholder="Notification message…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <button
                    onClick={sendGeneral}
                    disabled={gnSending || !gnTitle.trim() || !gnMessage.trim()}
                    style={{
                        padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13,
                        background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer',
                        opacity: (gnSending || !gnTitle.trim() || !gnMessage.trim()) ? 0.6 : 1,
                    }}
                >
                    {gnSending ? 'Sending…' : '📢 Send Notification'}
                </button>
            </div>

            {/* ── Notification List ───────────────────────────────── */}
            <div className="glass-panel">
                <h3 style={{ marginBottom: 16 }}>Recent Notifications</h3>
                {notifications.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>🔔 No notifications yet</p>
                )}
                {notifications.map(n => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                    return (
                        <div key={n.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                            padding: 16, marginBottom: 10, borderRadius: 12,
                            background: config.bg, border: `1.5px solid ${config.border}`,
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            }}>{config.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <strong style={{ fontSize: 14 }}>{n.title}</strong>
                                    {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--accent)' }} />}
                                    {n.type === 'powercut' && (
                                        <span style={{ padding: '1px 8px', borderRadius: 20, background: '#b71c1c', color: '#fff', fontSize: 10, fontWeight: 700 }}>POWER CUT</span>
                                    )}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, margin: '0 0 4px' }}>{n.message}</p>
                                {n.area && <p style={{ color: '#666', fontSize: 11, margin: '2px 0' }}>📍 {n.area}{n.estimatedDuration ? ` · ⏱ ${n.estimatedDuration}` : ''}</p>}
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                    {new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                            </div>
                            <button
                                onClick={() => deleteNotif(n.id)}
                                disabled={deleting === n.id}
                                style={{
                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                    background: 'rgba(239,83,80,0.15)', color: '#ef5350',
                                    border: '1px solid rgba(239,83,80,0.3)', cursor: 'pointer',
                                    flexShrink: 0, alignSelf: 'flex-start',
                                }}
                            >
                                {deleting === n.id ? '…' : '✕ Delete'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '9px 14px', borderRadius: 8, fontSize: 13,
    background: '#f7f9fc', color: '#1a2332',
    border: '1.5px solid #dfe7ef', outline: 'none',
    boxSizing: 'border-box',
};
