import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchSavings } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
    bg: '#edf2f7', white: '#ffffff', blueDark: '#0b2a52', blue: '#1a66d9',
    blueLight: '#e6f0ff', green: '#2e7d32', greenLight: '#e8f5e9',
    red: '#c62828', redLight: '#ffebee', text: '#1a2332', textSec: '#5a6a7a',
    muted: '#8a97a6', border: '#dfe7ef',
};

export default function SavingsScreen() {
    const { top } = useSafeAreaInsets();
    const { t } = useLanguage();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId') ?? '';
            const d = await fetchSavings(userId);
            setData(d);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    if (loading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={C.blue} /></View>;
    }

    const savingsPercent = ((data.monthlySavings / data.projectedMonthlyBill) * 100).toFixed(0);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 90 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => load(true)}
                    colors={[C.blue]}
                    tintColor={C.blue}
                />
            }
        >
            <View style={[styles.header, { paddingTop: top + 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MenuButton />
                    <View>
                        <Text style={styles.headerTitle}>{t.savings_title}</Text>
                        <Text style={styles.headerSub}>{t.savings_sub}</Text>
                    </View>
                </View>
            </View>

            {/* ── Bill Comparison Card ────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>{t.projected_bill}</Text>
                <View style={styles.billRow}>
                    <View style={styles.billCol}>
                        <Text style={styles.billSmall}>{t.without_optimizer}</Text>
                        <Text style={[styles.billValue, { color: C.red }]}>₹{data.projectedMonthlyBill}</Text>
                    </View>
                    <View style={styles.arrowBox}>
                        <Text style={styles.arrowText}>→</Text>
                    </View>
                    <View style={styles.billCol}>
                        <Text style={styles.billSmall}>{t.with_optimizer}</Text>
                        <Text style={[styles.billValue, { color: C.green }]}>₹{data.optimizedMonthlyBill}</Text>
                    </View>
                </View>
            </View>

            {/* ── Savings Highlight ───────────────────────────── */}
            <View style={[styles.card, { backgroundColor: C.greenLight, borderColor: '#a5d6a7', borderWidth: 1.5 }]}>
                <View style={styles.savingsRow}>
                    <View style={styles.savingsIconBox}>
                        <MaterialCommunityIcons name="wallet-outline" size={24} color={C.green} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.savingsLabel}>{t.monthly_savings}</Text>
                        <Text style={styles.savingsAmount}>₹{data.monthlySavings}</Text>
                    </View>
                    <View style={styles.percentBadge}>
                        <Text style={styles.percentText}>{savingsPercent}%</Text>
                    </View>
                </View>
            </View>

            {/* ── Budget / Consumption Gauge ──────────────────── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{t.daily_avg}</Text>
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <View style={styles.budgetRing}>
                        <Text style={styles.budgetValue}>{data.dailyAvgKwh}</Text>
                        <Text style={styles.budgetUnit}>kWh/day</Text>
                    </View>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min((data.dailyAvgKwh / 30) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                    {t.budget_usage}: {((data.dailyAvgKwh / 30) * 100).toFixed(0)}%
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: C.blueDark, paddingHorizontal: 24, paddingBottom: 20,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        shadowColor: '#0b2a52', shadowOpacity: 0.25, shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },

    card: {
        marginHorizontal: 20, marginTop: 14, backgroundColor: C.white, borderRadius: 14,
        padding: 18, borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 }, elevation: 3
    },
    cardTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
    sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' },

    billRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    billCol: { alignItems: 'center', flex: 1 },
    billSmall: { color: C.muted, fontSize: 11, marginBottom: 4 },
    billValue: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
    arrowBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f7f9fc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
    arrowText: { color: C.muted, fontSize: 20 },

    savingsRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    savingsIconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#c8e6c9', justifyContent: 'center', alignItems: 'center' },
    // savingsIcon: { fontSize: 24 }, // Removed
    savingsLabel: { color: C.textSec, fontSize: 12, fontWeight: '600' },
    savingsAmount: { color: C.green, fontSize: 26, fontWeight: '800', letterSpacing: -1 },
    percentBadge: { backgroundColor: C.green, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    percentText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    budgetRing: {
        width: 100, height: 100, borderRadius: 50, borderWidth: 5, borderColor: C.blue,
        justifyContent: 'center', alignItems: 'center'
    },
    budgetValue: { color: C.text, fontSize: 24, fontWeight: '800' },
    budgetUnit: { color: C.muted, fontSize: 10, fontWeight: '600' },
    progressBarBg: { height: 8, backgroundColor: '#e6ebf2', borderRadius: 4, marginTop: 14 },
    progressBarFill: { height: 8, borderRadius: 4, backgroundColor: C.blue },
    progressLabel: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 6 },
});
