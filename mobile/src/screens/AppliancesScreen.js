import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAppliances, toggleAppliance, deleteAppliance } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#edf2f7', white: '#ffffff', blueDark: '#0b2a52', blue: '#1a66d9',
    blueLight: '#e6f0ff', green: '#2e7d32', greenLight: '#e8f5e9',
    red: '#c62828', redLight: '#ffebee', text: '#1a2332', textSec: '#5a6a7a',
    muted: '#8a97a6', border: '#dfe7ef',
};

const ICONS = {
    Lamp: 'lightbulb-outline',
    Fan: 'fan',
    Heater: 'radiator',
    AC: 'air-conditioner',
    TV: 'television',
    Washer: 'washing-machine',
    Fridge: 'fridge-outline',
    Router: 'router-wireless'
};

const BCOLORS = { Lamp: '#fff3e0', Fan: '#e3f2fd', Heater: '#fce4ec' };
const ACCENT = { Lamp: '#ff9800', Fan: '#2196f3', Heater: '#e91e63' };

export default function AppliancesScreen() {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [appliances, setAppliances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchAppliances().then(a => { setAppliances(a); setLoading(false); }).catch(console.error);
    }, []);

    const handleToggle = async (id) => {
        setToggling(id);
        try {
            const updated = await toggleAppliance(id);
            setAppliances(prev => prev.map(a => a.id === id ? updated : a));
        } catch (e) {
        Alert.alert(t.error ?? 'Error', 'Could not toggle appliance');
        } finally {
            setToggling(null);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            t.delete_device,
            t.delete_confirm,
            [
                { text: t.cancel, style: "cancel" },
                {
                    text: t.delete_btn, style: "destructive", onPress: async () => {
                        setDeleting(id);
                        try {
                            await deleteAppliance(id);
                            setAppliances(prev => prev.filter(a => a.id !== id));
                        } catch (e) {
                            Alert.alert('Error', 'Could not delete appliance');
                        } finally {
                            setDeleting(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={C.blue} /></View>;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 90 }}>
            <View style={[styles.header, { paddingTop: top + 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MenuButton />
                    <View>
                        <Text style={styles.headerTitle}>{t.appliances_title}</Text>
                        <Text style={styles.headerSub}>{t.appliances_sub}</Text>
                    </View>
                </View>
            </View>

            {/* Summary strip */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryPill, { backgroundColor: C.greenLight }]}>
                    <Text style={[styles.summaryValue, { color: C.green }]}>
                        {appliances.filter(a => a.isOn).length}
                    </Text>
                    <Text style={styles.summaryLabel}>{t.active}</Text>
                </View>
                <View style={[styles.summaryPill, { backgroundColor: C.redLight }]}>
                    <Text style={[styles.summaryValue, { color: C.red }]}>
                        {appliances.filter(a => !a.isOn).length}
                    </Text>
                    <Text style={styles.summaryLabel}>{t.inactive}</Text>
                </View>
                <View style={[styles.summaryPill, { backgroundColor: C.blueLight }]}>
                    <Text style={[styles.summaryValue, { color: C.blue }]}>
                        {appliances.filter(a => a.isOn).reduce((s, a) => s + a.wattage, 0)}W
                    </Text>
                    <Text style={styles.summaryLabel}>Total Load</Text>
                </View>
            </View>

            {appliances.map(a => (
                <View key={a.id} style={styles.appCard}>
                    <View style={styles.appRow}>
                        <View style={[styles.iconBox, { backgroundColor: BCOLORS[a.name] || C.blueLight }]}>
                            <MaterialCommunityIcons name={ICONS[a.name] || 'power-plug'} size={28} color={C.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.appName}>{a.name}</Text>
                            <Text style={styles.appMeta}>{a.wattage}W · {a.type}</Text>
                            {a.schedule && (
                                <View style={styles.scheduleRow}>
                                    <MaterialCommunityIcons name="clock-outline" size={12} color={C.textSec} />
                                    <Text style={styles.scheduleText}>
                                        Auto: {a.schedule.startHour}:00 – {a.schedule.endHour}:00
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, a.isOn ? styles.toggleOn : styles.toggleOff]}
                                onPress={() => handleToggle(a.id)}
                                disabled={toggling === a.id}
                                activeOpacity={0.8}
                            >
                                {toggling === a.id ? (
                                    <ActivityIndicator size="small" color={a.isOn ? '#fff' : C.muted} />
                                ) : (
                                    <Text style={[styles.toggleText, a.isOn ? { color: '#fff' } : { color: C.muted }]}>
                                        {a.isOn ? 'ON' : 'OFF'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDelete(a.id)}
                                disabled={deleting === a.id}
                                style={styles.deleteBtn}
                            >
                                {deleting === a.id ? (
                                    <ActivityIndicator size="small" color={C.red} />
                                ) : (
                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.muted} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Power usage bar */}
                    <View style={styles.powerBarBg}>
                        <View style={[styles.powerBarFill, {
                            width: `${Math.min((a.wattage / 2000) * 100, 100)}%`,
                            backgroundColor: a.isOn ? (ACCENT[a.name] || C.blue) : '#d0d0d0',
                        }]} />
                    </View>
                    <Text style={styles.powerLabel}>
                        {a.isOn ? `Drawing ${a.wattage}W` : t.inactive}
                    </Text>
                </View>
            ))}
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

    summaryRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, gap: 10 },
    summaryPill: {
        flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    summaryValue: { fontSize: 18, fontWeight: '800' },
    summaryLabel: { fontSize: 10, color: C.muted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },

    appCard: {
        marginHorizontal: 20, marginTop: 12, backgroundColor: C.white, borderRadius: 14,
        padding: 16, borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 }, elevation: 3
    },
    appRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    appIcon: { fontSize: 26 },
    appName: { color: C.text, fontSize: 16, fontWeight: '700' },
    appMeta: { color: C.muted, fontSize: 12, marginTop: 1 },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    scheduleIcon: { fontSize: 12 },
    scheduleText: { color: C.blue, fontSize: 11, fontWeight: '600' },

    toggleBtn: { width: 56, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    toggleOn: { backgroundColor: C.green },
    toggleOff: { backgroundColor: '#e6ebf2' },
    toggleText: { fontSize: 11, fontWeight: '800' },

    deleteBtn: {
        width: 56, height: 32, justifyContent: 'center', alignItems: 'center',
        marginTop: 4, borderRadius: 16, backgroundColor: '#fff1f2'
    },

    powerBarBg: { height: 6, backgroundColor: '#eef2f7', borderRadius: 3, marginTop: 14 },
    powerBarFill: { height: 6, borderRadius: 3 },
    powerLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
});
