import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, TextInput, Alert, ActivityIndicator, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchDevices, toggleDevice, addDevice, deleteDevice, WS_URL } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

// ── Color palette (matches Dashboard light theme) ──────────────────
const C = {
    bg: '#edf2f7', white: '#ffffff', blueDark: '#0b2a52',
    blue: '#1a66d9', blueLight: '#e6f0ff',
    green: '#2e7d32', greenLight: '#e8f5e9',
    red: '#c62828', redLight: '#ffebee',
    amber: '#f57f17', amberLight: '#fff3e0',
    text: '#1a2332', textSec: '#5a6a7a', muted: '#8a97a6', border: '#dfe7ef',
};

// ── Device type config ─────────────────────────────────────────────
const DEVICE_TYPES = [
    { type: 'tv', icon: 'tv-outline', label: 'TV', color: '#1565c0' },
    { type: 'ac', icon: 'snow-outline', label: 'AC', color: '#00838f' },
    { type: 'fan', icon: 'radio-button-on-outline', label: 'Fan', color: '#0277bd' },
    { type: 'light', icon: 'bulb-outline', label: 'Light', color: '#f57f17' },
    { type: 'refrigerator', icon: 'cube-outline', label: 'Refrigerator', color: '#2e7d32' },
    { type: 'laptop', icon: 'laptop-outline', label: 'Laptop', color: '#6a1b9a' },
    { type: 'washing machine', icon: 'water-outline', label: 'Washing Machine', color: '#0288d1' },
    { type: 'microwave', icon: 'flame-outline', label: 'Microwave', color: '#e64a19' },
    { type: 'water heater', icon: 'thermometer-outline', label: 'Water Heater', color: '#c62828' },
    { type: 'charger', icon: 'battery-charging-outline', label: 'Charger', color: '#558b2f' },
    { type: 'default', icon: 'flash-outline', label: 'Other', color: '#546e7a' },
];
const PROTOCOLS = ['simulated', 'androidtv', 'shelly', 'http', 'kasa', 'tuya'];

function getDeviceCfg(type) {
    return DEVICE_TYPES.find(d => d.type === (type ?? '').toLowerCase()) ?? DEVICE_TYPES[DEVICE_TYPES.length - 1];
}

// ── Device Card (light theme) ───────────────────────────────────────
function DeviceCard({ device, onToggle, onDelete, loading }) {
    const cfg = getDeviceCfg(device.type);
    const isOn = device.isOn;
    return (
        <View style={[styles.card, isOn ? { borderColor: cfg.color + '55', backgroundColor: C.white } : styles.cardOff]}>
            <View style={[styles.iconCircle, { backgroundColor: isOn ? cfg.color + '18' : '#f0f4f8' }]}>
                <Ionicons name={cfg.icon} size={26} color={isOn ? cfg.color : C.muted} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceType}>{cfg.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Ionicons name="flash" size={11} color={isOn ? C.amber : C.muted} />
                    <Text style={[styles.wattage, { color: isOn ? C.amber : C.muted }]}>
                        {isOn ? ` ${device.wattage}W` : '  OFF'}
                    </Text>
                    {device.protocol !== 'simulated' && (
                        <View style={styles.realBadge}>
                            <Text style={styles.realBadgeText}>REAL</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 10 }}>
                {loading
                    ? <ActivityIndicator color={cfg.color} size="small" />
                    : <Switch
                        value={isOn}
                        onValueChange={() => onToggle(device)}
                        trackColor={{ false: C.border, true: cfg.color + 'aa' }}
                        thumbColor={isOn ? cfg.color : '#c0cdd9'}
                        ios_backgroundColor={C.border}
                    />
                }
                <TouchableOpacity onPress={() => onDelete(device)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={15} color={C.red + 'aa'} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Add Device Modal (light theme) ──────────────────────────────────
function AddDeviceModal({ visible, onClose, onSave }) {
    const [name, setName] = useState('');
    const [typeIdx, setTypeIdx] = useState(0);
    const [protoIdx, setProtoIdx] = useState(0);
    const [ip, setIp] = useState('');
    const [onUrl, setOnUrl] = useState('');
    const [offUrl, setOffUrl] = useState('');
    const [toggleUrl, setToggleUrl] = useState('');
    const [statusUrl, setStatusUrl] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [localKey, setLocalKey] = useState('');

    const proto = PROTOCOLS[protoIdx];
    const typeObj = DEVICE_TYPES[typeIdx];

    const reset = () => { setName(''); setIp(''); setOnUrl(''); setOffUrl(''); setToggleUrl(''); setStatusUrl(''); setDeviceId(''); setLocalKey(''); };
    const save = () => {
        if (!name.trim()) { Alert.alert('Name required'); return; }
        onSave({ name: name.trim(), type: typeObj.type, protocol: proto, ip: ip || null, onUrl: onUrl || null, offUrl: offUrl || null, toggleUrl: toggleUrl || null, statusUrl: statusUrl || null, deviceId: deviceId || null, localKey: localKey || null });
        reset();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: C.bg }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 24 }}>
                        <Text style={styles.modalTitle}>Add Device</Text>

                        <Text style={styles.label}>DEVICE NAME</Text>
                        <TextInput style={styles.input} placeholder="e.g. Living Room TV" placeholderTextColor={C.muted} value={name} onChangeText={setName} />

                        <Text style={styles.label}>DEVICE TYPE</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                            {DEVICE_TYPES.map((t, i) => (
                                <TouchableOpacity key={t.type} onPress={() => setTypeIdx(i)}
                                    style={[styles.chip, typeIdx === i && { backgroundColor: t.color + '18', borderColor: t.color }]}>
                                    <Ionicons name={t.icon} size={14} color={typeIdx === i ? t.color : C.muted} />
                                    <Text style={[styles.chipText, typeIdx === i && { color: t.color }]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>CONNECTION PROTOCOL</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                            {PROTOCOLS.map((p, i) => (
                                <TouchableOpacity key={p} onPress={() => setProtoIdx(i)}
                                    style={[styles.chip, protoIdx === i && { backgroundColor: C.blueLight, borderColor: C.blue }]}>
                                    <Text style={[styles.chipText, protoIdx === i && { color: C.blue }]}>{p.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {(proto === 'shelly' || proto === 'kasa' || proto === 'tuya' || proto === 'androidtv') && (
                            <>
                                <Text style={styles.label}>DEVICE IP ADDRESS</Text>
                                <TextInput style={styles.input} placeholder="192.168.x.x" placeholderTextColor={C.muted} value={ip} onChangeText={setIp} keyboardType="decimal-pad" />
                            </>
                        )}
                        {proto === 'androidtv' && (
                            <View style={[styles.hintBox, { backgroundColor: '#fff3e0', marginBottom: 0 }]}>
                                <Ionicons name="tv-outline" size={16} color="#e65100" />
                                <Text style={[styles.hintText, { color: '#bf360c' }]}>
                                    {'On your OnePlus/Android TV:\n1. Settings → Device Preferences → About\n2. Click Build number 7× to unlock Developer Options\n3. Settings → Device Preferences → Developer Options\n4. Enable “Network debugging”\n5. Note the IP shown above (e.g. 192.168.29.x)'}
                                </Text>
                            </View>
                        )}
                        {proto === 'tuya' && (
                            <>
                                <Text style={styles.label}>TUYA DEVICE ID</Text>
                                <TextInput style={styles.input} placeholder="From Tuya IoT Platform" placeholderTextColor={C.muted} value={deviceId} onChangeText={setDeviceId} />
                                <Text style={styles.label}>TUYA LOCAL KEY</Text>
                                <TextInput style={styles.input} placeholder="Local key from Tuya IoT" placeholderTextColor={C.muted} value={localKey} onChangeText={setLocalKey} />
                            </>
                        )}
                        {proto === 'http' && (
                            <>
                                <Text style={styles.label}>TOGGLE URL (ESP8266-STYLE)</Text>
                                <TextInput style={styles.input} placeholder="http://192.168.x.x/toggle" placeholderTextColor={C.muted} value={toggleUrl} onChangeText={setToggleUrl} autoCapitalize="none" />
                                <Text style={styles.label}>STATUS URL (OPTIONAL)</Text>
                                <TextInput style={styles.input} placeholder="http://192.168.x.x/state" placeholderTextColor={C.muted} value={statusUrl} onChangeText={setStatusUrl} autoCapitalize="none" />
                                <Text style={[styles.label, { color: C.muted, fontSize: 9, marginBottom: 14 }]}>― OR use separate ON / OFF URLs ―</Text>
                                <Text style={styles.label}>TURN ON URL</Text>
                                <TextInput style={styles.input} placeholder="http://192.168.x.x/on" placeholderTextColor={C.muted} value={onUrl} onChangeText={setOnUrl} autoCapitalize="none" />
                                <Text style={styles.label}>TURN OFF URL</Text>
                                <TextInput style={styles.input} placeholder="http://192.168.x.x/off" placeholderTextColor={C.muted} value={offUrl} onChangeText={setOffUrl} autoCapitalize="none" />
                                <View style={[styles.hintBox, { backgroundColor: '#e8f5e9' }]}>
                                    <Ionicons name="hardware-chip-outline" size={16} color="#2e7d32" />
                                    <Text style={[styles.hintText, { color: '#1b5e20' }]}>
                                        {'ESP8266/NodeMCU: Use the Toggle URL for single-endpoint devices.\nEnter your ESP\'s IP from Serial Monitor (e.g. 192.168.137.169)'}
                                    </Text>
                                </View>
                            </>
                        )}

                        {proto === 'simulated' && (
                            <View style={styles.hintBox}>
                                <Ionicons name="information-circle-outline" size={16} color={C.blue} />
                                <Text style={styles.hintText}>Simulated devices work without hardware — perfect for testing!</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.8}>
                            <Text style={styles.saveBtnText}>Add Device</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={{ marginTop: 12, alignItems: 'center' }}>
                            <Text style={{ color: C.muted, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

// ── Main Screen ──────────────────────────────────────────────────────
export default function LiveDevicesScreen({ route }) {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const userId = route?.params?.userId ?? 'USR000001';
    const [devices, setDevices] = useState([]);
    const [togglingId, setTogglingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const ws = useRef(null);

    const load = useCallback(async () => {
        try {
            const data = await fetchDevices(userId);
            setDevices(data);
        } catch (e) { console.error('[Devices] load error', e); }
        finally { setLoading(false); }
    }, [userId]);

    useEffect(() => {
        load();
        try {
            const socket = new WebSocket(WS_URL);
            ws.current = socket;
            socket.onopen = () => setWsConnected(true);
            socket.onclose = () => setWsConnected(false);
            socket.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.type === 'DEVICE_UPDATE' && msg.userId === userId) {
                        setDevices(prev => prev.map(d => d.id === msg.device.id ? msg.device : d));
                    }
                } catch { }
            };
        } catch { }
        return () => ws.current?.close();
    }, [load, userId]);

    // Provisional wattage for optimistic UI while awaiting API response
    const WATT_ESTIMATE = { tv: 120, ac: 1500, fan: 75, light: 20, refrigerator: 150, laptop: 65, 'washing machine': 500, microwave: 1200, 'water heater': 2000, charger: 20 };
    const provisionalWatt = (type, isOn) => isOn ? (WATT_ESTIMATE[type?.toLowerCase()] ?? 80) : 0;

    const handleToggle = async (device) => {
        const nextOn = !device.isOn;
        setTogglingId(device.id);
        setDevices(prev => prev.map(d => d.id === device.id ? { ...d, isOn: nextOn, wattage: provisionalWatt(d.type, nextOn) } : d));
        try {
            const updated = await toggleDevice(device.id, userId);
            setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
        } catch {
            // Device unreachable — keep toggled state (backend falls back to simulated)
            // Don't revert the UI since backend will still have flipped the state
        }
        setTogglingId(null);
    };


    const handleDelete = (device) => {
        Alert.alert('Remove Device', `Remove "${device.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await deleteDevice(device.id, userId);
                        setDevices(prev => prev.filter(d => d.id !== device.id));
                    } catch { Alert.alert('Error', 'Could not remove device.'); }
                }
            },
        ]);
    };

    const handleAdd = async (opts) => {
        setShowAdd(false);
        try {
            const device = await addDevice(userId, opts);
            setDevices(prev => [...prev, device]);
        } catch { Alert.alert('Error', 'Could not add device.'); }
    };

    const onCount = devices.filter(d => d.isOn).length;
    const totalW = devices.filter(d => d.isOn).reduce((s, d) => s + (d.wattage ?? 0), 0);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.blue} />
                <Text style={{ color: C.muted, marginTop: 12 }}>Loading devices…</Text>
            </View>
        );
    }

    const header = (
        <View>
            {/* Summary row */}
            <View style={styles.summaryRow}>
                <View style={[styles.sumCard, { backgroundColor: C.greenLight }]}>
                    <Text style={[styles.sumVal, { color: C.green }]}>{onCount}</Text>
                    <Text style={styles.sumLabel}>ON</Text>
                </View>
                <View style={[styles.sumCard, { backgroundColor: C.blueLight }]}>
                    <Text style={[styles.sumVal, { color: C.blue }]}>{devices.length}</Text>
                    <Text style={styles.sumLabel}>Total</Text>
                </View>
                <View style={[styles.sumCard, { backgroundColor: C.amberLight }]}>
                    <Text style={[styles.sumVal, { color: C.amber }]}>{totalW.toFixed(0)}W</Text>
                    <Text style={styles.sumLabel}>Live Load</Text>
                </View>
                <View style={[styles.sumCard, { backgroundColor: wsConnected ? C.greenLight : C.redLight }]}>
                    <Ionicons name="wifi" size={18} color={wsConnected ? C.green : C.red} />
                    <Text style={[styles.sumLabel, { color: wsConnected ? C.green : C.red }]}>{wsConnected ? 'LIVE' : 'OFF'}</Text>
                </View>
            </View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🏠 My Devices</Text>
                <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
                    <Ionicons name="add-circle" size={18} color={C.blue} />
                    <Text style={styles.addBtnText}>Add Device</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.topBar, { paddingTop: top + 14 }]}>
                <MenuButton />
                <View>
                    <Text style={styles.headerTitle}>{t.nav_devices}</Text>
                </View>
                <TouchableOpacity onPress={load} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="refresh-outline" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={devices}
                keyExtractor={d => d.id}
                renderItem={({ item }) => (
                    <DeviceCard
                        device={item}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        loading={togglingId === item.id}
                    />
                )}
                ListHeaderComponent={header}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 48 }}>
                        <Ionicons name="flash-off-outline" size={48} color={C.border} />
                        <Text style={{ color: C.muted, marginTop: 12, fontSize: 15 }}>No devices yet</Text>
                        <TouchableOpacity onPress={() => setShowAdd(true)} style={{ marginTop: 16, backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
                            <Text style={{ color: '#fff', fontWeight: '700' }}>+ Add your first device</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
            <AddDeviceModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    topBar: {
        backgroundColor: C.blueDark, paddingHorizontal: 20, paddingBottom: 22,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        shadowColor: '#0b2a52', shadowOpacity: 0.25, shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    sumCard: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    sumVal: { fontSize: 20, fontWeight: '900' },
    sumLabel: { fontSize: 9, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addBtnText: { color: C.blue, fontWeight: '700', fontSize: 13 },
    // Cards
    card: {
        flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
        marginBottom: 10, borderWidth: 1.5, backgroundColor: C.white,
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardOff: { borderColor: C.border, backgroundColor: '#f7f9fc' },
    iconCircle: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    deviceName: { fontSize: 14, fontWeight: '700', color: C.text },
    deviceType: { fontSize: 10, color: C.muted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
    wattage: { fontSize: 12, fontWeight: '700' },
    realBadge: { marginLeft: 6, backgroundColor: C.greenLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
    realBadgeText: { color: C.green, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
    // Modal
    modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 22 },
    label: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    input: {
        backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
        padding: 14, color: C.text, marginBottom: 18, fontSize: 14,
    },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12,
        paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
        backgroundColor: C.white, marginRight: 8, marginBottom: 4,
    },
    chipText: { fontSize: 11, fontWeight: '700', color: C.muted },
    hintBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.blueLight, borderRadius: 10, padding: 12, marginBottom: 18 },
    hintText: { color: C.blue, fontSize: 13, flex: 1, lineHeight: 19 },
    saveBtn: { backgroundColor: C.blue, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
