import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MenuButton from '../components/MenuButton';
import { listArduinoPorts, testArduinoConnection, sendArduinoCommand, fetchDevices, toggleDevice } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

// ── Colors ──────────────────────────────────────────────────────────
const C = {
    bg: '#0d1b2a', card: '#1b2d44', cardLight: '#243b55',
    accent: '#00e676', accentDim: '#00c85320', blue: '#448aff',
    red: '#ff5252', amber: '#ffab40', white: '#fff',
    text: '#e1e8f0', textSec: '#8899aa', border: '#2a3f5a',
};

export default function ArduinoScreen({ route }) {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const userId = route?.params?.userId ?? 'USR000001';

    // State
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState('COM3');
    const [connectionStatus, setConnectionStatus] = useState(null); // null | 'testing' | 'connected' | 'failed'
    const [connectionMsg, setConnectionMsg] = useState('');
    const [arduinoDevice, setArduinoDevice] = useState(null);
    const [ledOn, setLedOn] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingPorts, setLoadingPorts] = useState(true);

    // Load COM ports and find Arduino device
    const load = useCallback(async () => {
        try {
            const [portsData, devicesData] = await Promise.all([
                listArduinoPorts().catch(() => []),
                fetchDevices(userId).catch(() => []),
            ]);
            setPorts(portsData);
            const arduino = devicesData.find(d => d.protocol === 'arduino');
            if (arduino) {
                setArduinoDevice(arduino);
                setLedOn(arduino.isOn);
                setSelectedPort(arduino.comPort || 'COM3');
            }
        } catch (e) {
            console.error('[Arduino] Load error:', e);
        } finally {
            setLoadingPorts(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    // Test connection
    const handleTest = async () => {
        setConnectionStatus('testing');
        setConnectionMsg('Connecting...');
        try {
            const result = await testArduinoConnection(selectedPort);
            if (result.success) {
                setConnectionStatus('connected');
                setConnectionMsg(result.response || 'Connected!');
            } else {
                setConnectionStatus('failed');
                setConnectionMsg(result.error || 'Connection failed');
            }
        } catch (e) {
            setConnectionStatus('failed');
            setConnectionMsg(e.message || 'Connection failed');
        }
    };

    // Toggle LED — accepts optional explicit target state to avoid stale closure issues
    const handleToggle = async (targetState) => {
        if (!arduinoDevice) {
            Alert.alert('No Arduino Device', 'Please add an Arduino device in Live Devices first.');
            return;
        }
        setToggling(true);
        const newState = targetState !== undefined ? targetState : !ledOn;
        setLedOn(newState); // Optimistic
        try {
            const updated = await toggleDevice(arduinoDevice.id, userId);
            setLedOn(updated.isOn);
            setArduinoDevice(updated);
        } catch (e) {
            setLedOn(!newState); // Revert
            Alert.alert('Error', 'Failed to toggle LED');
        } finally {
            setToggling(false);
        }
    };

    // Status indicator
    const statusColor = connectionStatus === 'connected' ? C.accent
        : connectionStatus === 'failed' ? C.red
            : connectionStatus === 'testing' ? C.amber : C.textSec;
    const statusIcon = connectionStatus === 'connected' ? 'checkmark-circle'
        : connectionStatus === 'failed' ? 'close-circle'
            : connectionStatus === 'testing' ? 'hourglass' : 'help-circle-outline';

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={[s.header, { paddingTop: top + 14 }]}>
                <MenuButton />
                <View>
                    <Text style={s.headerTitle}>{t.nav_arduino || '⚡ Arduino Control'}</Text>
                    <Text style={s.headerSub}>Bluetooth LED Controller</Text>
                </View>
                <TouchableOpacity onPress={() => { setRefreshing(true); load(); }}>
                    <Ionicons name="refresh-outline" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
            >
                {/* Connection Status Card */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Ionicons name="bluetooth" size={20} color={C.blue} />
                        <Text style={s.cardTitle}>Connection Status</Text>
                    </View>
                    <View style={s.statusRow}>
                        <Ionicons name={statusIcon} size={18} color={statusColor} />
                        <Text style={[s.statusText, { color: statusColor }]}>
                            {connectionStatus === 'connected' ? 'Connected'
                                : connectionStatus === 'failed' ? 'Disconnected'
                                    : connectionStatus === 'testing' ? 'Testing...'
                                        : 'Not tested'}
                        </Text>
                    </View>
                    {connectionMsg ? (
                        <Text style={s.connectionMsg}>
                            {connectionMsg}
                        </Text>
                    ) : null}
                </View>

                {/* COM Ports Card */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Ionicons name="hardware-chip-outline" size={20} color={C.amber} />
                        <Text style={s.cardTitle}>COM Ports</Text>
                        {loadingPorts && <ActivityIndicator size="small" color={C.accent} style={{ marginLeft: 8 }} />}
                    </View>
                    <Text style={s.hint}>Select the port your HC-05/HC-06 is paired on:</Text>
                    <View style={s.portList}>
                        {ports.length === 0 && !loadingPorts && (
                            <Text style={s.noPortsText}>No COM ports found. Pair your HC-05/HC-06 module first.</Text>
                        )}
                        {ports.map((p, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[s.portChip, selectedPort === p.path && s.portChipActive]}
                                onPress={() => setSelectedPort(p.path)}
                            >
                                <Ionicons name="radio-button-on" size={14}
                                    color={selectedPort === p.path ? C.accent : C.textSec} />
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={[s.portPath, selectedPort === p.path && { color: C.accent }]}>
                                        {p.path}
                                    </Text>
                                    <Text style={s.portMfr}>{p.manufacturer}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={s.testBtn} onPress={handleTest}
                        disabled={connectionStatus === 'testing'}>
                        {connectionStatus === 'testing'
                            ? <ActivityIndicator size="small" color={C.white} />
                            : <Ionicons name="flash" size={16} color={C.white} />}
                        <Text style={s.testBtnText}>
                            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* LED Control Card */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Ionicons name="bulb" size={20} color={ledOn ? '#ffd600' : C.textSec} />
                        <Text style={s.cardTitle}>LED Control</Text>
                        {arduinoDevice && (
                            <View style={[s.badge, { backgroundColor: arduinoDevice.protocol === 'arduino' ? C.accentDim : C.border }]}>
                                <Text style={[s.badgeText, { color: C.accent }]}>REAL</Text>
                            </View>
                        )}
                    </View>

                    {/* Big LED indicator */}
                    <View style={s.ledContainer}>
                        <TouchableOpacity
                            style={[s.ledBtn, ledOn && s.ledBtnOn]}
                            onPress={handleToggle}
                            disabled={toggling}
                            activeOpacity={0.7}
                        >
                            {toggling ? (
                                <ActivityIndicator size="large" color={C.white} />
                            ) : (
                                <>
                                    <Ionicons name="power" size={48}
                                        color={ledOn ? '#fff' : C.textSec} />
                                    <Text style={[s.ledLabel, ledOn && { color: '#fff' }]}>
                                        {ledOn ? 'ON' : 'OFF'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Text style={s.ledHint}>Tap to toggle LED on Pin 13</Text>
                    </View>

                    {/* Quick buttons */}
                    <View style={s.quickRow}>
                        <TouchableOpacity style={[s.quickBtn, { backgroundColor: '#1b5e20' }]}
                            onPress={() => handleToggle(true)}>
                            <Ionicons name="bulb" size={18} color="#a5d6a7" />
                            <Text style={[s.quickText, { color: '#a5d6a7' }]}>Turn ON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.quickBtn, { backgroundColor: '#b71c1c' }]}
                            onPress={() => handleToggle(false)}>
                            <Ionicons name="bulb-outline" size={18} color="#ef9a9a" />
                            <Text style={[s.quickText, { color: '#ef9a9a' }]}>Turn OFF</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Setup Guide Card */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Ionicons name="book-outline" size={20} color={C.blue} />
                        <Text style={s.cardTitle}>Setup Guide</Text>
                    </View>
                    <View style={s.stepsList}>
                        {[
                            { icon: 'cloud-upload', text: 'Upload arduino_led.ino to your Arduino board' },
                            { icon: 'swap-horizontal', text: 'Wire: HC-05 TX→RX, RX→TX, VCC→5V, GND→GND' },
                            { icon: 'bluetooth', text: 'Pair HC-05/HC-06 in Windows Bluetooth (PIN: 1234)' },
                            { icon: 'settings', text: 'Find COM port in Device Manager → Ports' },
                            { icon: 'flash', text: 'Select the port above and tap Test Connection' },
                            { icon: 'power', text: 'Use the toggle to control your LED!' },
                        ].map((step, i) => (
                            <View key={i} style={s.stepItem}>
                                <View style={s.stepNum}>
                                    <Text style={s.stepNumText}>{i + 1}</Text>
                                </View>
                                <Ionicons name={step.icon} size={16} color={C.blue} style={{ marginRight: 8 }} />
                                <Text style={s.stepText}>{step.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Wiring Diagram */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Ionicons name="git-network-outline" size={20} color={C.accent} />
                        <Text style={s.cardTitle}>Wiring Diagram</Text>
                    </View>
                    <View style={s.wiringBox}>
                        <Text style={s.wiringText}>
                            {`┌─────────────┐     ┌──────────┐
│   Arduino   │     │ HC-05/06 │
│             │     │          │
│  RX (Pin 0) ├─────┤ TX       │
│  TX (Pin 1) ├─────┤ RX       │
│  5V         ├─────┤ VCC      │
│  GND        ├─────┤ GND      │
│             │     └──────────┘
│  Pin 13 ────┤
│    │        │    ┌──────┐
│    ├──[220Ω]┼────┤ LED  │
│    │        │    └──┬───┘
│  GND ───────┼──────┘
└─────────────┘`}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
        backgroundColor: '#0f2742', paddingHorizontal: 20, paddingBottom: 18,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    headerTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
    headerSub: { color: C.textSec, fontSize: 11, marginTop: 2 },
    card: {
        backgroundColor: C.card, borderRadius: 16, padding: 18,
        marginBottom: 14, borderWidth: 1, borderColor: C.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    cardTitle: { color: C.white, fontSize: 15, fontWeight: '700', flex: 1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    statusText: { fontSize: 15, fontWeight: '700' },
    connectionMsg: { color: C.textSec, fontSize: 12, marginTop: 4, fontFamily: 'monospace' },
    hint: { color: C.textSec, fontSize: 12, marginBottom: 10 },
    portList: { gap: 6, marginBottom: 12 },
    noPortsText: { color: C.red, fontSize: 13, textAlign: 'center', padding: 12 },
    portChip: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        borderRadius: 10, backgroundColor: C.cardLight, borderWidth: 1, borderColor: C.border,
    },
    portChipActive: { borderColor: C.accent, backgroundColor: C.accentDim },
    portPath: { color: C.text, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
    portMfr: { color: C.textSec, fontSize: 10, marginTop: 2 },
    testBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: C.blue, borderRadius: 12, paddingVertical: 12,
    },
    testBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    ledContainer: { alignItems: 'center', paddingVertical: 20 },
    ledBtn: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: C.cardLight,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: C.border,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    ledBtnOn: {
        backgroundColor: '#2e7d32', borderColor: C.accent,
        shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 20,
    },
    ledLabel: { color: C.textSec, fontSize: 14, fontWeight: '900', marginTop: 4, letterSpacing: 2 },
    ledHint: { color: C.textSec, fontSize: 11, marginTop: 10 },
    quickRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    quickBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12, borderRadius: 10,
    },
    quickText: { fontSize: 13, fontWeight: '700' },
    stepsList: { gap: 10 },
    stepItem: { flexDirection: 'row', alignItems: 'center' },
    stepNum: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: C.blue + '33',
        justifyContent: 'center', alignItems: 'center', marginRight: 8,
    },
    stepNumText: { color: C.blue, fontSize: 11, fontWeight: '800' },
    stepText: { color: C.text, fontSize: 12, flex: 1, lineHeight: 18 },
    wiringBox: {
        backgroundColor: '#0d1b2a', borderRadius: 10, padding: 12,
        borderWidth: 1, borderColor: C.border,
    },
    wiringText: { color: C.accent, fontSize: 10, fontFamily: 'monospace', lineHeight: 15 },
});
