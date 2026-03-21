import { useState, useEffect, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { fetchAIHealth, fetchAIModelStats, fetchAIForecast, sendAIChat } from '../services/api';

// ── Metric badge colors ──────────────────────────────────────────
function metricColor(type, value) {
    if (type === 'classification') return value >= 0.95 ? '#69f0ae' : value >= 0.85 ? '#ffab40' : '#ef5350';
    if (type === 'regression') return value >= 0.9 ? '#69f0ae' : value >= 0.7 ? '#ffab40' : '#ef5350';
    return '#64b5f6';
}

function MetricPill({ label, value, color }) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${color}18`, border: `1px solid ${color}44`,
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
        }}>
            <span style={{ color: '#5a6a7a' }}>{label}</span>
            <span style={{ color }}>{value}</span>
        </div>
    );
}

export default function AIModels() {
    const [health, setHealth] = useState(null);
    const [stats, setStats] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Chat state
    const [chatMessages, setChatMessages] = useState([
        { id: 0, from: 'bot', text: '👋 Hi Admin! Test the ML chatbot here. Ask about usage, bills, tariffs, complaints, or any energy topic.' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatRef = useRef(null);

    async function load() {
        try {
            const [h, s, f] = await Promise.all([
                fetchAIHealth().catch(() => null),
                fetchAIModelStats().catch(() => null),
                fetchAIForecast().catch(() => ({ predictions: [] })),
            ]);
            setHealth(h);
            setStats(s);
            setForecast(f?.predictions || []);
            setError(h ? null : 'AI Engine is not running. Start it with: python ai-models/api_server.py');
        } catch (e) {
            setError('Cannot connect to AI Engine');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

    async function sendChat() {
        const msg = chatInput.trim();
        if (!msg) return;
        setChatInput('');
        const uid = Date.now();
        setChatMessages(prev => [...prev, { id: uid, from: 'user', text: msg }]);
        setChatLoading(true);
        setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 50);

        try {
            const result = await sendAIChat(msg);
            const badge = result.query_type ? `🤖 ${result.query_type}` : '🤖 AI';
            setChatMessages(prev => [...prev, {
                id: uid + 1, from: 'bot', text: result.response, badge,
            }]);
        } catch {
            setChatMessages(prev => [...prev, {
                id: uid + 1, from: 'bot', text: '❌ AI Engine is not responding. Make sure the Python API server is running.',
            }]);
        } finally {
            setChatLoading(false);
            setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 50);
        }
    }

    if (loading) return <div className="page-container"><p style={{ color: '#7badc5' }}>Loading AI Engine…</p></div>;

    return (
        <div className="page-container">
            <h1 className="page-title">🧠 AI Engine Dashboard</h1>
            <p className="page-subtitle">
                PowerPilot AI v{stats?.version || '2.0.0'} · {stats?.total_models || 6} ML Models ·
                {stats?.total_size_mb || '~12'} MB Total Size
            </p>

            {error && (
                <div style={{
                    background: '#fff3e0', border: '1px solid #ffab40', borderRadius: 12,
                    padding: '12px 18px', marginBottom: 20, color: '#e65100', fontSize: 13, fontWeight: 600,
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ── Health Status ──────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    {
                        label: 'Engine Status',
                        value: health ? '● Online' : '○ Offline',
                        color: health ? '#69f0ae' : '#ef5350',
                    },
                    {
                        label: 'Models Loaded',
                        value: health?.models_loaded ? '✓ All 6' : '✗ Missing',
                        color: health?.models_loaded ? '#69f0ae' : '#ef5350',
                    },
                    {
                        label: 'Uptime',
                        value: health?.uptime_human || '—',
                        color: '#64b5f6',
                    },
                    {
                        label: 'Total Model Size',
                        value: `${stats?.total_size_mb || '—'} MB`,
                        color: '#ba68c8',
                    },
                    {
                        label: 'Training Metrics',
                        value: stats?.training_metrics_available ? '✓ Available' : '—',
                        color: stats?.training_metrics_available ? '#69f0ae' : '#ffab40',
                    },
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                        <div style={{ color: s.color, fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                        <div style={{ color: '#5a6a7a', fontSize: 12, marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Model Cards ────────────────────────────────────── */}
            <h2 style={{ color: '#1a2332', fontSize: 16, marginBottom: 14 }}>📦 ML Models</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 28 }}>
                {(stats?.models || []).map(m => {
                    const metrics = m.metrics || {};
                    const isLoaded = m.loaded;
                    return (
                        <div key={m.id} className="stat-card" style={{
                            borderLeft: `4px solid ${isLoaded ? '#69f0ae' : '#ef5350'}`,
                            position: 'relative', overflow: 'hidden',
                        }}>
                            {/* Glow effect */}
                            <div style={{
                                position: 'absolute', top: -30, right: -30, width: 80, height: 80,
                                borderRadius: '50%', background: isLoaded ? 'rgba(105,240,174,0.08)' : 'rgba(239,83,80,0.06)',
                            }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div>
                                    <div style={{ fontSize: 18, marginBottom: 2 }}>{m.icon}</div>
                                    <div style={{ color: '#1a2332', fontWeight: 800, fontSize: 14 }}>{m.name}</div>
                                    <div style={{ color: '#5a6a7a', fontSize: 11 }}>{m.description}</div>
                                </div>
                                <span style={{
                                    background: isLoaded ? '#e8f5e9' : '#ffebee',
                                    color: isLoaded ? '#2e7d32' : '#c62828',
                                    padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                                }}>
                                    {isLoaded ? '✓ Loaded' : '✗ Missing'}
                                </span>
                            </div>

                            <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 8 }}>
                                <strong>Algorithm:</strong> {m.algorithm}<br />
                                <strong>Data:</strong> {m.training_data} · <strong>Size:</strong> {m.total_size_kb} KB
                            </div>

                            {/* Metrics */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {m.metric_type === 'classification' && metrics.accuracy != null && (
                                    <>
                                        <MetricPill label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`}
                                            color={metricColor('classification', metrics.accuracy)} />
                                        <MetricPill label="F1" value={metrics.macro_f1?.toFixed(4)}
                                            color={metricColor('classification', metrics.macro_f1)} />
                                    </>
                                )}
                                {m.metric_type === 'regression' && metrics.r2_score != null && (
                                    <>
                                        <MetricPill label="R²" value={metrics.r2_score?.toFixed(4)}
                                            color={metricColor('regression', metrics.r2_score)} />
                                        <MetricPill label="RMSE" value={metrics.rmse?.toFixed(2)} color="#64b5f6" />
                                        <MetricPill label="MAE" value={metrics.mae?.toFixed(2)} color="#64b5f6" />
                                    </>
                                )}
                                {m.metric_type === 'anomaly' && metrics.anomaly_rate != null && (
                                    <MetricPill label="Anomaly Rate" value={`${(metrics.anomaly_rate * 100).toFixed(1)}%`} color="#ffab40" />
                                )}
                                {m.metric_type === 'clustering' && metrics.n_clusters != null && (
                                    <>
                                        <MetricPill label="Clusters" value={metrics.n_clusters} color="#ba68c8" />
                                        <MetricPill label="Inertia" value={metrics.inertia?.toFixed(0)} color="#64b5f6" />
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Demand Forecast Chart ──────────────────────────── */}
            {forecast.length > 0 && (
                <div className="stat-card" style={{ marginBottom: 28 }}>
                    <h3 style={{ color: '#1a2332', margin: '0 0 4px', fontSize: 15 }}>📈 ML Demand Forecast (Next 24h)</h3>
                    <p style={{ color: '#5a6a7a', fontSize: 12, margin: '0 0 16px' }}>
                        GradientBoosting model prediction with ±5% confidence band
                    </p>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={forecast} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.15)" />
                            <XAxis dataKey="hour" tick={{ fill: '#5a6a7a', fontSize: 11 }}
                                tickFormatter={h => `${String(h).padStart(2, '0')}:00`} interval={3} />
                            <YAxis tick={{ fill: '#5a6a7a', fontSize: 11 }} tickFormatter={v => `${v} MW`} />
                            <Tooltip
                                contentStyle={{ background: '#0d1b3a', border: '1px solid #1e3a6e', borderRadius: 8, color: '#e0ecff' }}
                                formatter={(v, name) => [`${v} MW`, name === 'predicted_demand_mw' ? 'Predicted Demand' : name]}
                                labelFormatter={h => `Hour: ${String(h).padStart(2, '0')}:00`}
                            />
                            <Area type="monotone" dataKey="predicted_demand_mw" stroke="#1976d2" strokeWidth={2}
                                fill="url(#demandGrad)" dot={false} />
                            <Line type="monotone" dataKey="confidence_band" stroke="#64b5f6" strokeDasharray="4 3"
                                dot={false} strokeWidth={1} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── Chat Test Panel ────────────────────────────────── */}
            <div className="stat-card" style={{ marginBottom: 28 }}>
                <h3 style={{ color: '#1a2332', margin: '0 0 12px', fontSize: 15 }}>💬 Live Chatbot Test</h3>

                {/* Messages */}
                <div ref={chatRef} style={{
                    height: 260, overflowY: 'auto', background: '#f0f4f8',
                    borderRadius: 12, padding: 14, marginBottom: 12,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    {chatMessages.map(msg => (
                        <div key={msg.id} style={{
                            alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                        }}>
                            {msg.badge && (
                                <div style={{
                                    background: 'rgba(25,118,210,0.1)', borderRadius: 6,
                                    padding: '1px 6px', marginBottom: 3, display: 'inline-block',
                                    fontSize: 10, fontWeight: 700, color: '#1976d2',
                                }}>
                                    {msg.badge}
                                </div>
                            )}
                            <div style={{
                                background: msg.from === 'user'
                                    ? 'linear-gradient(135deg, #1976d2, #0d47a1)'
                                    : '#ffffff',
                                color: msg.from === 'user' ? '#fff' : '#1a2332',
                                padding: '10px 14px', borderRadius: 14,
                                fontSize: 13, lineHeight: 1.5,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                whiteSpace: 'pre-wrap',
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {chatLoading && (
                        <div style={{ alignSelf: 'flex-start', color: '#5a6a7a', fontSize: 12, padding: '8px 14px' }}>
                            🤖 Thinking…
                        </div>
                    )}
                </div>

                {/* Quick buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['What is my usage?', 'Bill analysis', 'Tariff rates', 'Energy saving tips', 'File a complaint'].map(q => (
                        <button key={q} onClick={() => { setChatInput(q); }} style={{
                            padding: '4px 10px', borderRadius: 16, border: '1px solid #e0e0e0',
                            background: '#fff', color: '#1976d2', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer',
                        }}>
                            {q}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChat()}
                        placeholder="Type a message to test the AI chatbot…"
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: 12,
                            border: '1px solid #dfe7ef', fontSize: 13,
                            background: '#f8fafc', outline: 'none',
                        }}
                    />
                    <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} style={{
                        padding: '10px 20px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(90deg, #1976d2, #0d47a1)',
                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        opacity: (!chatInput.trim() || chatLoading) ? 0.5 : 1,
                    }}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
