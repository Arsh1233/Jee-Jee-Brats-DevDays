import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, Dimensions, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchBillHistory, fetchBillSummary } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import MenuButton from '../components/MenuButton';

const { width: W } = Dimensions.get('window');

const C = {
    bg: '#f0f4f8', card: '#ffffff', accent: '#1565c0', text: '#132340',
    sub: '#5c7a9a', green: '#2e7d32', red: '#c62828', amber: '#e65100',
    border: '#dce6f0', headerBg: '#0b2a52',
};

function SummaryCard({ label, value, color, icon }) {
    return (
        <View style={st.summaryCard}>
            <MaterialCommunityIcons name={icon} size={22} color={color} style={{ marginBottom: 6 }} />
            <Text style={[st.summaryVal, { color }]}>{value}</Text>
            <Text style={st.summaryLabel}>{label}</Text>
        </View>
    );
}

function BillRow({ bill, index }) {
    const [open, setOpen] = useState(false);
    const statusColor = bill.paid ? C.green : C.red;
    const statusLabel = bill.paid ? 'Paid' : 'Due';

    return (
        <View style={[st.billCard, index === 0 && { borderColor: C.accent, borderWidth: 1 }]}>
            <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.85} style={st.billRow}>
                <View style={st.monthBadge}>
                    <Text style={st.monthText}>{bill.month}</Text>
                    {index === 0 && <Text style={st.latestTag}>Latest</Text>}
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text style={st.billAmount}>₹{bill.total.toLocaleString()}</Text>
                    <Text style={st.billSub}>{bill.consumption} kWh</Text>
                </View>
                <View style={[st.statusBadge, { backgroundColor: statusColor + '22' }]}>
                    <Text style={[st.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
                <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.sub} style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {open && (
                <View style={st.billDetail}>
                    {[
                        ['Meter Reading', bill.reading.toLocaleString()],
                        ['Consumption', `${bill.consumption} kWh`],
                        ['Bill Amount', `₹${bill.amount.toLocaleString()}`],
                        ['Arrears', `₹${bill.arrears.toFixed(2)}`],
                        ['Total Payable', `₹${bill.total.toLocaleString()}`],
                        ['Due Date', bill.dueDate],
                        ['Status', statusLabel],
                    ].map(([k, v]) => (
                        <View key={k} style={st.detailRow}>
                            <Text style={st.detailKey}>{k}</Text>
                            <Text style={[st.detailVal, k === 'Status' && { color: statusColor }]}>{v}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function BillHistoryScreen() {
    const { top } = useSafeAreaInsets();
    const { t } = useLanguage();
    const [bills, setBills] = useState([]);

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function load(isRefresh = false) {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId') ?? '';
            const [b, s] = await Promise.all([fetchBillHistory(userId), fetchBillSummary(userId)]);
            setBills(b); setSummary(s);
        } catch (e) { console.error('BillHistory:', e); }
        finally { setLoading(false); setRefreshing(false); }
    }

    useEffect(() => { load(); }, []);

    if (loading) return <View style={st.root}><ActivityIndicator color={C.accent} size="large" /></View>;

    return (
        <View style={st.root}>
            <View style={[st.header, { paddingTop: top + 14 }]}>
                <MenuButton />
                <MaterialCommunityIcons name="file-document-outline" size={22} color="#fff" />
                <Text style={st.headerTitle}>{t.bill_history}</Text>
            </View>

            {/* Summary strip */}
            {summary && (
                <View style={st.summaryRow}>
                    <SummaryCard label={t.avg_monthly} value={`₹${summary.avgMonthly?.toLocaleString()}`} color={C.accent} icon="chart-line" />
                    <SummaryCard label={t.avg_kwh} value={`${summary.avgKwh} kWh`} color={C.amber} icon="lightning-bolt" />
                    <SummaryCard label={t.total_due} value={`₹${summary.totalDue?.toLocaleString()}`} color={C.red} icon="alert-circle-outline" />
                    <SummaryCard label={t.ytd_spend} value={`₹${summary.ytdAmount?.toLocaleString()}`} color={C.green} icon="calendar-check" />
                </View>
            )}

            <FlatList
                data={bills}
                keyExtractor={(item, i) => `${item.month}-${i}`}
                renderItem={({ item, index }) => <BillRow bill={item} index={index} />}
                contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
                showsVerticalScrollIndicator={false}
            />
        </View>
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

    summaryRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
    summaryCard: {
        flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 10,
        alignItems: 'center', borderWidth: 1, borderColor: C.border,
    },
    summaryVal: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 2 },
    summaryLabel: { fontSize: 9, color: C.sub, textAlign: 'center' },

    billCard: {
        backgroundColor: C.card, borderRadius: 16, marginBottom: 10,
        borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    },
    billRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    monthBadge: { alignItems: 'center' },
    monthText: { fontSize: 12, fontWeight: '700', color: C.accent, width: 60, textAlign: 'center' },
    latestTag: { fontSize: 8, color: '#fff', backgroundColor: C.accent, borderRadius: 4, paddingHorizontal: 4, marginTop: 3 },
    billAmount: { fontSize: 17, fontWeight: '800', color: C.text },
    billSub: { fontSize: 11, color: C.sub, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },

    billDetail: { borderTopWidth: 1, borderTopColor: C.border, padding: 14, gap: 8 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
    detailKey: { fontSize: 12, color: C.sub, fontWeight: '500' },
    detailVal: { fontSize: 12, color: C.text, fontWeight: '700' },
});
