import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchAIHealth, fetchAIModelStats, fetchAIForecast } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#edf2f7', white: '#fff', blueDark: '#0b2a52', blue: '#1a66d9',
    blueLight: '#e6f0ff', green: '#2e7d32', greenLight: '#e8f5e9',
    red: '#c62828', text: '#1a2332', textSec: '#5a6a7a', muted: '#8a97a6',
    border: '#dfe7ef',
};

const { width: SW } = Dimensions.get('window');

function MetricBadge({ label, value, color }) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: `${color}15`, borderRadius: 10,
            paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${color}30`,
        }}>
            <Text style={{ color: C.muted, fontSize: 9, fontWeight: '700' }}>{label}</Text>
            <Text style={{ color, fontSize: 10, fontWeight: '800' }}>{value}</Text>
        </View>
    );
}

// Mini bar chart for forecast
function ForecastChart({ data }) {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.predicted_demand_mw));
    const barW = (SW - 72) / data.length;

    return (
        <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 1 }}>
                {data.map((d, i) => {
                    const h = (d.predicted_demand_mw / maxVal) * 90;
                    const isPeak = d.predicted_demand_mw >= maxVal * 0.9;
                    return (
                        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                            <View style={{
                                width: barW - 2, height: h, borderRadius: 3,
                                backgroundColor: isPeak ? '#ef5350' : '#1976d2',
                                opacity: isPeak ? 1 : 0.6,
                            }} />
                        </View>
                    );
                })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                {data.filter((_, i) => i % 6 === 0).map((d, i) => (
                    <Text key={i} style={{ color: C.muted, fontSize: 8, fontWeight: '600' }}>
                        {String(d.hour).padStart(2, '0')}:00
                    </Text>
                ))}
            </View>
        </View>
    );
}

export default function AIInsightsScreen() {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [health, setHealth] = useState(null);
    const [stats, setStats] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const [h, s, f] = await Promise.all([
                fetchAIHealth().catch(() => null),
                fetchAIModelStats().catch(() => null),
                fetchAIForecast().catch(() => ({ predictions: [] })),
            ]);
            setHealth(h);
            setStats(s);
            setForecast(f?.predictions || []);
            setError(h ? null : 'AI Engine offline');
        } catch {
            setError('Cannot connect to AI Engine');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={C.blue} /></View>;
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 90 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[C.blue]} />}
        >
            {/* Header */}
            <LinearGradient colors={['#0b2a52', '#0d3b6e']} style={[styles.header, { paddingTop: top + 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MenuButton />
                    <View>
                        <Text style={styles.headerTitle}>{t.nav_aiinsights}</Text>
                        <Text style={styles.headerSub}>🧠 6 ML Models · Real-time Intelligence</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Error banner */}
            {error && (
                <View style={styles.errorBanner}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#e65100" />
                    <Text style={styles.errorText}>{error}. Start with: python api_server.py</Text>
                </View>
            )}

            {/* ── Health Status Cards ─────────────────── */}
            <View style={styles.statusRow}>
                <View style={[styles.statusCard, { borderTopColor: health ? '#69f0ae' : '#ef5350' }]}>
                    <View style={[styles.statusDot, { backgroundColor: health ? '#69f0ae' : '#ef5350' }]} />
                    <Text style={styles.statusLabel}>Engine</Text>
                    <Text style={[styles.statusVal, { color: health ? '#2e7d32' : '#c62828' }]}>
                        {health ? 'Online' : 'Offline'}
                    </Text>
                </View>
                <View style={[styles.statusCard, { borderTopColor: health?.models_loaded ? '#69f0ae' : '#ffab40' }]}>
                    <Text style={styles.statusLabel}>Models</Text>
                    <Text style={[styles.statusVal, { color: health?.models_loaded ? '#2e7d32' : '#e65100' }]}>
                        {health?.models_loaded ? '6/6 ✓' : 'Missing'}
                    </Text>
                </View>
                <View style={[styles.statusCard, { borderTopColor: '#64b5f6' }]}>
                    <Text style={styles.statusLabel}>Uptime</Text>
                    <Text style={[styles.statusVal, { color: C.blue }]}>
                        {health?.uptime_human || '—'}
                    </Text>
                </View>
                <View style={[styles.statusCard, { borderTopColor: '#ba68c8' }]}>
                    <Text style={styles.statusLabel}>Size</Text>
                    <Text style={[styles.statusVal, { color: '#7b1fa2' }]}>
                        {stats?.total_size_mb || '—'} MB
                    </Text>
                </View>
            </View>

            {/* ── ML Models ──────────────────────────── */}
            <Text style={styles.sectionTitle}>📦 ML Models</Text>
            {(stats?.models || []).map(m => {
                const metrics = m.metrics || {};
                const loaded = m.loaded;
                return (
                    <View key={m.id} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: loaded ? '#69f0ae' : '#ef5350' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ fontSize: 16 }}>{m.icon}</Text>
                                    <Text style={styles.cardTitle}>{m.name}</Text>
                                </View>
                                <Text style={styles.cardDesc}>{m.description}</Text>
                            </View>
                            <View style={[styles.loadedBadge, { backgroundColor: loaded ? '#e8f5e9' : '#ffebee' }]}>
                                <Text style={{ color: loaded ? '#2e7d32' : '#c62828', fontSize: 9, fontWeight: '700' }}>
                                    {loaded ? '✓ Loaded' : '✗ Missing'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.algoText}>
                            <Text style={{ fontWeight: '700' }}>Algorithm: </Text>{m.algorithm}
                        </Text>
                        <Text style={styles.algoText}>
                            <Text style={{ fontWeight: '700' }}>Training: </Text>{m.training_data} · {m.total_size_kb} KB
                        </Text>

                        {/* Metrics */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {m.metric_type === 'classification' && metrics.accuracy != null && (
                                <>
                                    <MetricBadge label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`}
                                        color={metrics.accuracy >= 0.95 ? '#2e7d32' : '#e65100'} />
                                    <MetricBadge label="F1" value={metrics.macro_f1?.toFixed(4)}
                                        color={metrics.macro_f1 >= 0.95 ? '#2e7d32' : '#e65100'} />
                                </>
                            )}
                            {m.metric_type === 'regression' && metrics.r2_score != null && (
                                <>
                                    <MetricBadge label="R²" value={metrics.r2_score?.toFixed(4)} color="#1976d2" />
                                    <MetricBadge label="RMSE" value={metrics.rmse?.toFixed(2)} color="#7b1fa2" />
                                </>
                            )}
                            {m.metric_type === 'anomaly' && metrics.anomaly_rate != null && (
                                <MetricBadge label="Anomaly Rate" value={`${(metrics.anomaly_rate * 100).toFixed(1)}%`} color="#e65100" />
                            )}
                            {m.metric_type === 'clustering' && metrics.n_clusters != null && (
                                <>
                                    <MetricBadge label="Clusters" value={metrics.n_clusters} color="#7b1fa2" />
                                    <MetricBadge label="Inertia" value={metrics.inertia?.toFixed(0)} color="#1976d2" />
                                </>
                            )}
                        </View>
                    </View>
                );
            })}

            {/* ── Demand Forecast ─────────────────────── */}
            {forecast.length > 0 && (
                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.cardTitle}>📈 24h Demand Forecast</Text>
                    <Text style={styles.cardDesc}>GradientBoosting prediction · Confidence ±5%</Text>
                    <ForecastChart data={forecast} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Text style={{ color: C.muted, fontSize: 10 }}>
                            Peak: {Math.max(...forecast.map(d => d.predicted_demand_mw)).toFixed(1)} MW
                        </Text>
                        <Text style={{ color: C.muted, fontSize: 10 }}>
                            Low: {Math.min(...forecast.map(d => d.predicted_demand_mw)).toFixed(1)} MW
                        </Text>
                    </View>
                </View>
            )}

            {/* ── Version Info ────────────────────────── */}
            <View style={styles.versionRow}>
                <Text style={styles.versionText}>
                    PowerPilot AI Engine v{stats?.version || '2.0.0'} · {stats?.total_models || 6} Models
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: {
        paddingHorizontal: 24, paddingBottom: 20,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        shadowColor: '#0b2a52', shadowOpacity: 0.25, shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },

    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 20, marginTop: 14, padding: 12, borderRadius: 12,
        backgroundColor: '#fff3e0', borderWidth: 1, borderColor: '#ffab40',
    },
    errorText: { color: '#e65100', fontSize: 12, fontWeight: '600', flex: 1 },

    statusRow: {
        flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 16,
    },
    statusCard: {
        flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 10,
        alignItems: 'center', borderTopWidth: 3,
        borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 8,
        shadowOffset: { width: 0, height: 1 }, elevation: 1,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
    statusLabel: { color: C.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    statusVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },

    sectionTitle: {
        color: C.text, fontSize: 16, fontWeight: '800',
        marginHorizontal: 20, marginTop: 22, marginBottom: 4,
    },

    card: {
        marginHorizontal: 20, marginTop: 10, backgroundColor: C.white, borderRadius: 14,
        padding: 16, borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    cardTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
    cardDesc: { color: C.muted, fontSize: 11, marginTop: 2, marginBottom: 6 },
    algoText: { color: C.textSec, fontSize: 11, lineHeight: 17 },

    loadedBadge: {
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },

    versionRow: { alignItems: 'center', marginTop: 20 },
    versionText: { color: C.muted, fontSize: 11, fontWeight: '600' },
});
