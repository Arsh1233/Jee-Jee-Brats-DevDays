import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    Dimensions, TouchableOpacity, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchConsumption, fetchBillHistory } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useLanguage } from '../i18n/LanguageContext';

const { width: W } = Dimensions.get('window');
const BAR_AREA_W = W - 32;
const C = {
    bg: '#f0f4f8', card: '#ffffff', accent: '#1565c0', text: '#132340',
    sub: '#5c7a9a', green: '#2e7d32', amber: '#e65100', border: '#dce6f0',
    headerBg: '#0b2a52',
};

function BarChart({ data }) {
    if (!data || data.length === 0) return null;
    const daily = [];
    for (let d = 0; d < 30; d++) {
        const slice = data.slice(d * 24, (d + 1) * 24);
        daily.push(parseFloat(slice.reduce((s, p) => s + p.kwh, 0).toFixed(3)));
    }
    const maxVal = Math.max(...daily);
    const barW = Math.floor((BAR_AREA_W - 30 * 2) / 30);
    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, paddingHorizontal: 4 }}>
                {daily.map((v, i) => {
                    const h = Math.max(4, Math.round((v / maxVal) * 80));
                    const isHigh = v > maxVal * 0.75;
                    return (
                        <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                            <View style={{
                                width: barW, height: h, borderRadius: 3,
                                backgroundColor: isHigh ? '#c62828' : i % 7 === 6 ? C.amber : C.accent,
                                opacity: 0.85,
                            }} />
                        </View>
                    );
                })}
            </View>
            <Text style={{ color: C.sub, fontSize: 9, textAlign: 'center', marginTop: 4 }}>
                Last 30 Days (each bar = 1 day)
            </Text>
        </View>
    );
}

function HourlyChart({ data }) {
    if (!data || data.length < 24) return null;
    const today = data.slice(-24);
    const maxVal = Math.max(...today.map(p => p.kwh));
    const barW = Math.floor((BAR_AREA_W - 24 * 2) / 24);
    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, paddingHorizontal: 4 }}>
                {today.map((p, i) => {
                    const h = Math.max(3, Math.round((p.kwh / maxVal) * 52));
                    const isPeak = i >= 14 && i < 20;
                    return (
                        <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                            <View style={{
                                width: barW, height: h, borderRadius: 2,
                                backgroundColor: isPeak ? '#c62828' : '#1e88e5', opacity: 0.8
                            }} />
                        </View>
                    );
                })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                {['12am', '6am', '12pm', '6pm', '12am'].map((t, i) => (
                    <Text key={i} style={{ color: C.sub, fontSize: 8 }}>{t}</Text>
                ))}
            </View>
        </View>
    );
}

export default function ConsumptionScreen() {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [profile, setProfile] = useState([]);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [view, setView] = useState('daily');

    async function load(isRefresh = false) {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId') ?? '';
            const [p, b] = await Promise.all([fetchConsumption(userId, 30), fetchBillHistory(userId)]);
            setProfile(p); setBills(b.slice(0, 6));
        } catch (e) { console.error('Consumption:', e); }
        finally { setLoading(false); setRefreshing(false); }
    }

    useEffect(() => { load(); }, []);

    const todayKwh = parseFloat(profile.slice(-24).reduce((s, p) => s + p.kwh, 0).toFixed(2));
    const weekKwh = parseFloat(profile.slice(-168).reduce((s, p) => s + p.kwh, 0).toFixed(1));
    const monthKwh = parseFloat(profile.reduce((s, p) => s + p.kwh, 0).toFixed(1));
    const peakBill = bills[0];

    if (loading) return <View style={st.root}><ActivityIndicator color={C.accent} size="large" /></View>;

    return (
        <ScrollView style={st.root}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}>

            <View style={[st.header, { paddingTop: top + 14 }]}>
                <MenuButton />
                <MaterialCommunityIcons name="chart-areaspline" size={22} color="#fff" />
                <Text style={st.headerTitle}>{t.consumption_title}</Text>
            </View>

            <View style={st.kpiRow}>
                {[
                    { label: t.today, value: `${todayKwh}`, unit: 'kWh', icon: 'calendar-today', color: C.accent },
                    { label: t.week, value: `${weekKwh}`, unit: 'kWh', icon: 'calendar-week', color: '#1e88e5' },
                    { label: t.month, value: `${monthKwh}`, unit: 'kWh', icon: 'calendar-month', color: C.amber },
                    { label: t.last_bill, value: `₹${peakBill?.total ?? '—'}`, unit: '', icon: 'receipt', color: C.green },
                ].map((k) => (
                    <View key={k.label} style={st.kpiCard}>
                        <MaterialCommunityIcons name={k.icon} size={18} color={k.color} style={{ marginBottom: 4 }} />
                        <Text style={[st.kpiVal, { color: k.color }]}>{k.value}<Text style={st.kpiUnit}> {k.unit}</Text></Text>
                        <Text style={st.kpiLabel}>{k.label}</Text>
                    </View>
                ))}
            </View>

            <View style={st.toggleRow}>
                {['daily', 'hourly'].map(v => (
                    <TouchableOpacity key={v} onPress={() => setView(v)}
                        style={[st.toggleBtn, view === v && st.toggleActive]}>
                        <Text style={[st.toggleText, view === v && { color: '#fff', fontWeight: '700' }]}>
                            {v === 'daily' ? t.daily_30 : t.hourly_today}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={st.chartCard}>
                <Text style={st.chartTitle}>{view === 'daily' ? t.daily_kwh : t.hourly_load}</Text>
                {view === 'daily' ? <BarChart data={profile} /> : <HourlyChart data={profile} />}
                <View style={st.legend}>
                    <View style={st.legendItem}><View style={[st.dot, { backgroundColor: C.accent }]} /><Text style={st.legendText}>{t.normal}</Text></View>
                    <View style={st.legendItem}><View style={[st.dot, { backgroundColor: '#c62828' }]} /><Text style={st.legendText}>{t.high}</Text></View>
                    {view === 'daily' && <View style={st.legendItem}><View style={[st.dot, { backgroundColor: C.amber }]} /><Text style={st.legendText}>{t.weekend}</Text></View>}
                </View>
            </View>

            <View style={st.chartCard}>
                <Text style={st.chartTitle}>{t.monthly_comparison}</Text>
                {bills.map((b, i) => {
                    const maxCons = Math.max(...bills.map(x => x.consumption));
                    const pct = b.consumption / maxCons;
                    return (
                        <View key={b.month} style={st.monthRow}>
                            <Text style={st.monthLabel}>{b.month}</Text>
                            <View style={st.monthBarBg}>
                                <View style={[st.monthBar, {
                                    width: `${pct * 100}%`,
                                    backgroundColor: i === 0 ? C.accent : '#90bce8'
                                }]} />
                            </View>
                            <Text style={st.monthKwh}>{b.consumption}</Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16,
        gap: 8, backgroundColor: C.headerBg,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        shadowColor: '#0b2a52', shadowOpacity: 0.2, shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

    kpiRow: { flexDirection: 'row', padding: 10, gap: 8 },
    kpiCard: {
        flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 10, alignItems: 'center',
        borderWidth: 1, borderColor: C.border, shadowColor: '#0b2a52', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
    },
    kpiVal: { fontSize: 14, fontWeight: '800', color: C.text },
    kpiUnit: { fontSize: 9, color: C.sub },
    kpiLabel: { fontSize: 9, color: C.sub, marginTop: 2 },

    toggleRow: {
        flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, backgroundColor: C.card,
        borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border
    },
    toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    toggleActive: { backgroundColor: C.accent },
    toggleText: { fontSize: 12, color: C.sub, fontWeight: '600' },

    chartCard: {
        backgroundColor: C.card, margin: 16, marginTop: 8, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: C.border, shadowColor: '#0b2a52', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
    },
    chartTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12 },
    legend: { flexDirection: 'row', gap: 16, marginTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, color: C.sub },

    monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    monthLabel: { width: 56, fontSize: 11, color: C.sub },
    monthBarBg: { flex: 1, height: 14, backgroundColor: '#e8eef5', borderRadius: 7, overflow: 'hidden', marginHorizontal: 6 },
    monthBar: { height: '100%', borderRadius: 7 },
    monthKwh: { width: 36, fontSize: 11, color: C.text, textAlign: 'right', fontWeight: '700' },
});
