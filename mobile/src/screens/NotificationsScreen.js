import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchNotifications } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#f0f4f8', white: '#ffffff', blueDark: '#0d2c54', blue: '#1565c0',
    blueLight: '#e3f2fd', green: '#2e7d32', greenLight: '#e8f5e9',
    red: '#c62828', redLight: '#ffebee', text: '#1a2332', textSec: '#5a6a7a',
    muted: '#8e99a4', border: '#e2e8f0',
};

const TYPE_CONFIG = {
    warning: { icon: 'alert-outline', bg: '#fff3e0', border: '#ffcc80', accent: '#e65100' },
    info: { icon: 'information-outline', bg: C.blueLight, border: '#90caf9', accent: C.blue },
    tip: { icon: 'lightbulb-on-outline', bg: C.greenLight, border: '#a5d6a7', accent: C.green },
    powercut: { icon: 'lightning-bolt', bg: '#ffebee', border: '#ef9a9a', accent: '#c62828' },
};

export default function NotificationsScreen() {
    const { top } = useSafeAreaInsets();
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const data = await fetchNotifications();
            setNotifications(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = filter === 'all'
        ? notifications
        : notifications.filter(n => n.type === filter);

    const powerCuts = notifications.filter(n => n.type === 'powercut');

    if (loading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={C.blue} /></View>;
    }

    return (
        <ScrollView
            style={styles.container}
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
                <MenuButton />
                <View style={{ marginTop: 20, flex: 1 }}>
                    <Text style={styles.headerTitle}>{t.notifications_title}</Text>
                    <Text style={styles.headerSub}>{t.notifications_sub}</Text>
                </View>
            </View>

            {/* Power Cut Active Banner */}
            {powerCuts.length > 0 && (
                <View style={styles.powerCutBanner}>
                    <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bannerTitle}>⚡ Active Power Cut Alert</Text>
                        <Text style={styles.bannerSub}>{powerCuts.length} area{powerCuts.length > 1 ? 's' : ''} affected · Check alerts below</Text>
                    </View>
                </View>
            )}

            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {[
                    { key: 'all', label: 'All', icon: 'bell-outline' },
                    { key: 'powercut', label: 'Power Cut', icon: 'lightning-bolt' },
                    { key: 'warning', label: 'Warnings', icon: 'alert-outline' },
                    { key: 'info', label: 'Info', icon: 'information-outline' },
                    { key: 'tip', label: 'Tips', icon: 'lightbulb-on-outline' },
                ].map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                        onPress={() => setFilter(f.key)}
                    >
                        <MaterialCommunityIcons name={f.icon} size={13} color={filter === f.key ? '#fff' : C.muted} />
                        <Text style={[styles.filterText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {filtered.length === 0 && (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="bell-sleep-outline" size={48} color={C.muted} style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyText}>{t.no_notifications}</Text>
                </View>
            )}

            {filtered.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const isPowerCut = n.type === 'powercut';
                return (
                    <View
                        key={n.id}
                        style={[
                            styles.notifCard,
                            { backgroundColor: config.bg, borderColor: config.border },
                            isPowerCut && styles.powerCutCard,
                        ]}
                    >
                        <View style={styles.notifRow}>
                            <View style={[styles.notifIconBox, { backgroundColor: isPowerCut ? '#c62828' : C.white }]}>
                                <MaterialCommunityIcons name={config.icon} size={22} color={isPowerCut ? '#fff' : config.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.notifHeader}>
                                    <Text style={[styles.notifTitle, isPowerCut && { color: '#c62828' }]}>{n.title}</Text>
                                    {!n.isRead && <View style={[styles.unreadDot, { backgroundColor: config.accent }]} />}
                                </View>
                                <Text style={styles.notifMessage}>{n.message}</Text>
                                {n.area && (
                                    <Text style={[styles.notifMeta, { color: '#c62828' }]}>
                                        📍 {n.area}{n.estimatedDuration ? `  ·  ⏱ ${n.estimatedDuration}` : ''}
                                    </Text>
                                )}
                                <Text style={styles.notifTime}>
                                    {new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </Text>
                            </View>
                        </View>
                    </View>
                );
            })}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: C.blueDark, paddingHorizontal: 24, paddingBottom: 20,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        flexDirection: 'row', alignItems: 'flex-end',
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },

    // Power cut active banner
    powerCutBanner: {
        marginHorizontal: 16, marginTop: 14,
        backgroundColor: '#b71c1c', borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, borderWidth: 1, borderColor: '#ef5350',
    },
    bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 13 },
    bannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },

    // Filter pills
    filterRow: { marginTop: 14, marginBottom: 4 },
    filterPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    },
    filterPillActive: { backgroundColor: C.blue, borderColor: C.blue },
    filterText: { color: C.muted, fontSize: 12, fontWeight: '600' },

    // Notification cards
    notifCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, borderWidth: 1.5, padding: 16 },
    powerCutCard: { borderWidth: 2 },
    notifRow: { flexDirection: 'row', gap: 12 },
    notifIconBox: {
        width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }
    },
    notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    notifTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
    unreadDot: { width: 7, height: 7, borderRadius: 4 },
    notifMessage: { color: C.textSec, fontSize: 13, lineHeight: 19, marginBottom: 6 },
    notifMeta: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    notifTime: { color: C.muted, fontSize: 11 },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: C.muted, fontSize: 14 },
});
