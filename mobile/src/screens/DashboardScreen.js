import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, Dimensions, Animated, Easing, Modal, Keyboard,
    TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Platform, RefreshControl,
    Image, Linking,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_PAD = 16 * 2 + 16 * 2 + 10 * 3;
const ICON_CARD_W = Math.floor((SCREEN_W - GRID_PAD) / 4);
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Safe import — expo-av needs a dev build; gracefully degrade in Expo Go
let Audio = null;
try { Audio = require('expo-av').Audio; } catch { }


// helper: extract text from AI response (can be object {data,text} or string)
const extractText = (raw) => {
    if (!raw) return 'No response';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw.text) return String(raw.text);
    return JSON.stringify(raw);
};

// ── Chatbot Modal (Queries & Help) ────────────────────────────
function ChatbotModal({ visible, onClose }) {
    const [msgs, setMsgs] = useState([
        { id: 0, from: 'bot', text: 'Hi! I\'m PowerBot \u2014 ask me anything about bills, tariffs, complaints, savings, or tips. I\'ll use ML to give you smart answers.' }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const ref = useRef(null);

    const QUICK = [
        { label: '\ud83d\udcb3 Pay Bill', msg: 'How do I pay my bill?' },
        { label: '\u26a1 Power Cut', msg: 'Report a power cut' },
        { label: '\ud83d\udccb Complaint', msg: 'File a complaint' },
        { label: '\ud83d\udcb0 Tariff', msg: "What's the tariff?" },
        { label: '\ud83c\udf31 Tips', msg: 'Energy saving tips' },
        { label: '\ud83d\udcca Usage', msg: 'My usage today' },
    ];

    const send = async (text) => {
        const m = text || input.trim();
        if (!m) return;
        setInput(''); Keyboard.dismiss();
        const uid = Date.now();
        setMsgs(p => [...p, { id: uid, from: 'user', text: m }]);
        setTyping(true);
        setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 80);
        try {
            const r = await sendChatMessage(m);
            const reply = extractText(r.response);
            const qt = r.query_type || '';
            setMsgs(p => [...p, { id: uid + 1, from: 'bot', text: reply, badge: qt ? `\ud83e\udd16 ${qt}` : '\ud83e\udd16 AI' }]);
        } catch {
            setMsgs(p => [...p, { id: uid + 1, from: 'bot', text: '\u26a0\ufe0f AI Engine offline. Try again later or call 1912.' }]);
        } finally {
            setTyping(false);
            setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 80);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={cs.overlay}>
                <TouchableWithoutFeedback onPress={onClose}><View style={StyleSheet.absoluteFillObject} /></TouchableWithoutFeedback>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={cs.sheet}>
                        {/* Header */}
                        <View style={[cs.hdr, { backgroundColor: '#0b2a52' }]}>
                            <View style={[cs.avatar, { backgroundColor: 'rgba(66,165,245,0.25)' }]}>
                                <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={cs.hdrTitle}>PowerBot</Text>
                                <Text style={cs.hdrSub}>Queries & Help \u00b7 ML-Powered</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        </View>

                        {/* Messages */}
                        <ScrollView ref={ref} style={cs.msgArea} contentContainerStyle={{ padding: 14, gap: 8 }}
                            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                            onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}>
                            {msgs.map(msg => (
                                <View key={msg.id} style={msg.from === 'user' ? cs.uRow : cs.bRow}>
                                    {msg.from === 'bot' && <View style={[cs.ico, { backgroundColor: '#e3f2fd' }]}><MaterialCommunityIcons name="robot-happy-outline" size={13} color="#1565c0" /></View>}
                                    <View style={[cs.bbl, msg.from === 'user' ? cs.uBbl : cs.bBbl]}>
                                        {msg.badge && <Text style={cs.badge}>{msg.badge}</Text>}
                                        <Text style={msg.from === 'user' ? cs.uTxt : cs.bTxt}>{msg.text}</Text>
                                    </View>
                                </View>
                            ))}
                            {typing && <View style={[cs.bRow]}><View style={[cs.ico, { backgroundColor: '#e3f2fd' }]}><MaterialCommunityIcons name="robot-happy-outline" size={13} color="#1565c0" /></View><View style={cs.bBbl}><Text style={{ color: '#90caf9', fontSize: 13 }}>Thinking\u2026</Text></View></View>}
                        </ScrollView>

                        {/* Quick replies */}
                        <View style={cs.qRow}>
                            {QUICK.map((q, i) => <TouchableOpacity key={i} style={cs.qBtn} onPress={() => send(q.msg)}><Text style={cs.qTxt}>{q.label}</Text></TouchableOpacity>)}
                        </View>

                        {/* Input */}
                        <View style={cs.iRow}>
                            <TextInput style={cs.iBox} value={input} onChangeText={setInput}
                                placeholder="Ask me anything\u2026" placeholderTextColor="#9bafc0"
                                onSubmitEditing={() => send()} returnKeyType="send" />
                            <TouchableOpacity style={[cs.sBtn, { backgroundColor: '#1a66d9' }]} onPress={() => send()} disabled={!input.trim()}>
                                <Ionicons name="send" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

// ── Voice Assistant Modal (Functional Commands) ───────────────
function VoiceModal({ visible, onClose }) {
    const [msgs, setMsgs] = useState([
        { id: 0, from: 'bot', text: 'I\'m the Voice Assistant \u2014 tap the \ud83c\udfa4 mic button and speak, or type a command. I\'ll classify your intent with ML.', intent: 'greet', confidence: 1.0 }
    ]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const ref = useRef(null);

    const QUICK = [
        { label: '\ud83d\udcca Usage', cmd: 'Check my usage' },
        { label: '\ud83d\udd0c Off AC', cmd: 'Turn off the AC' },
        { label: '\ud83d\udcb0 Bill', cmd: 'How much is my bill?' },
        { label: '\ud83d\udca1 Tips', cmd: 'Give me saving tips' },
    ];

    // ── Mic recording (only if expo-av is available) ──
    const canRecord = !!Audio;
    const startRecording = async () => {
        if (!Audio) return;
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                setMsgs(p => [...p, { id: Date.now(), from: 'bot', text: '\u26a0\ufe0f Microphone permission denied. Please allow mic access in Settings.', intent: 'error', confidence: 0 }]);
                return;
            }
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: rec } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(rec);
            setIsRecording(true);
            // Pulse animation
            Animated.loop(Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])).start();
        } catch (err) {
            console.error('[VoiceModal] startRecording error:', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
        setIsRecording(false);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

            if (uri) {
                setBusy(true);
                setMsgs(p => [...p, { id: Date.now(), from: 'user', text: '\ud83c\udfa4 Listening...' }]);
                setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 80);
                try {
                    const t = await transcribeAudio(uri);
                    if (t.transcript) {
                        // Replace "Listening" with actual transcript
                        setMsgs(p => { const cp = [...p]; cp[cp.length - 1].text = t.transcript; return cp; });
                        await send(t.transcript);
                    } else {
                        setMsgs(p => { const cp = [...p]; cp[cp.length - 1].text = '\u26a0\ufe0f Could not understand. Try again.'; cp[cp.length - 1].from = 'bot'; return cp; });
                        setBusy(false);
                    }
                } catch (err) {
                    console.error('[VoiceModal] Transcription error:', err);
                    setMsgs(p => { const cp = [...p]; cp[cp.length - 1].text = '\u26a0\ufe0f Speech service unavailable.'; cp[cp.length - 1].from = 'bot'; return cp; });
                    setBusy(false);
                }
            }
        } catch (err) {
            console.error('[VoiceModal] stopRecording error:', err);
            setRecording(null);
            setIsRecording(false);
        }
    };

    const send = async (text) => {
        const m = text || input.trim();
        if (!m) return;
        setInput(''); Keyboard.dismiss();
        const uid = Date.now();
        // Only add user msg if not already added by mic
        if (!text) setMsgs(p => [...p, { id: uid, from: 'user', text: m }]);
        setBusy(true);
        setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 80);
        try {
            const r = await sendVoiceCommand(m);
            const reply = extractText(r.response);
            setMsgs(p => [...p, {
                id: uid + 1, from: 'bot', text: reply,
                intent: r.intent, confidence: r.confidence,
            }]);

            // ── Actually file a complaint if intent is file_complaint ──
            if (r.intent === 'file_complaint') {
                try {
                    const userId = await AsyncStorage.getItem('userId') ?? 'USR000001';
                    const userName = await AsyncStorage.getItem('userName') ?? 'User';
                    const complaint = await submitComplaint({
                        userId,
                        name: userName,
                        category: 'General',
                        subject: `Voice complaint: ${m.substring(0, 80)}`,
                        description: m,
                        contact: '',
                    });
                    setMsgs(p => [...p, {
                        id: Date.now(),
                        from: 'bot',
                        text: `✅ Complaint #${complaint.id} filed! Status: ${complaint.status}. Track it in the Complaints section.`,
                        intent: 'complaint_filed',
                        confidence: 1.0,
                    }]);
                } catch (err) {
                    console.error('[Voice] Complaint filing error:', err);
                }
            }
        } catch (err) {
            setMsgs(p => [...p, { id: uid + 1, from: 'bot', text: '\u26a0\ufe0f AI Engine offline.', intent: 'error', confidence: 0 }]);
        } finally {
            setBusy(false);
            setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 80);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={cs.overlay}>
                <TouchableWithoutFeedback onPress={onClose}><View style={StyleSheet.absoluteFillObject} /></TouchableWithoutFeedback>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={cs.sheet}>
                        {/* Header */}
                        <View style={[cs.hdr, { backgroundColor: '#0d3b6e' }]}>
                            <View style={[cs.avatar, { backgroundColor: 'rgba(129,212,250,0.25)' }]}>
                                <Ionicons name="mic" size={20} color="#81d4fa" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={cs.hdrTitle}>Voice Assistant</Text>
                                <Text style={cs.hdrSub}>Commands & Actions \u00b7 ML Intent</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        </View>

                        {/* Messages */}
                        <ScrollView ref={ref} style={cs.msgArea} contentContainerStyle={{ padding: 14, gap: 8 }}
                            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                            onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}>
                            {msgs.map(msg => (
                                <View key={msg.id} style={msg.from === 'user' ? cs.uRow : cs.bRow}>
                                    {msg.from === 'bot' && <View style={[cs.ico, { backgroundColor: '#e1f5fe' }]}><Ionicons name="mic" size={13} color="#0288d1" /></View>}
                                    <View style={[cs.bbl, msg.from === 'user' ? cs.uBbl : cs.bBbl]}>
                                        {msg.intent && msg.intent !== 'error' && (
                                            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 3 }}>
                                                <Text style={[cs.badge, { color: '#0288d1', backgroundColor: 'rgba(2,136,209,0.08)' }]}>\ud83c\udfaf {msg.intent?.replace(/_/g, ' ')}</Text>
                                                {msg.confidence > 0 && <Text style={[cs.badge, { color: '#2e7d32', backgroundColor: 'rgba(46,125,50,0.08)' }]}>{(msg.confidence * 100).toFixed(0)}%</Text>}
                                            </View>
                                        )}
                                        <Text style={msg.from === 'user' ? cs.uTxt : cs.bTxt}>{msg.text}</Text>
                                    </View>
                                </View>
                            ))}
                            {busy && <View style={cs.bRow}><View style={[cs.ico, { backgroundColor: '#e1f5fe' }]}><Ionicons name="mic" size={13} color="#0288d1" /></View><View style={cs.bBbl}><Text style={{ color: '#81d4fa', fontSize: 13 }}>Classifying intent\u2026</Text></View></View>}
                        </ScrollView>

                        {/* Quick commands */}
                        <View style={cs.qRow}>
                            {QUICK.map((q, i) => <TouchableOpacity key={i} style={[cs.qBtn, { borderColor: '#81d4fa' }]} onPress={() => send(q.cmd)}><Text style={[cs.qTxt, { color: '#0288d1' }]}>{q.label}</Text></TouchableOpacity>)}
                        </View>

                        {/* Input + Mic */}
                        <View style={cs.iRow}>
                            <TextInput style={cs.iBox} value={input} onChangeText={setInput}
                                placeholder={canRecord ? "Type or tap mic\u2026" : "Type a command\u2026"} placeholderTextColor="#9bafc0"
                                onSubmitEditing={() => send()} returnKeyType="send" />
                            {/* Mic button (only if expo-av available) */}
                            {canRecord && <TouchableOpacity
                                style={[cs.micBtn, isRecording && cs.micBtnActive]}
                                onPressIn={startRecording}
                                onPressOut={stopRecording}
                                activeOpacity={0.7}>
                                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                    <Ionicons name={isRecording ? 'radio' : 'mic'} size={20} color="#fff" />
                                </Animated.View>
                            </TouchableOpacity>}
                            <TouchableOpacity style={[cs.sBtn, { backgroundColor: '#0288d1' }]} onPress={() => send()} disabled={!input.trim() || busy}>
                                <Ionicons name="send" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

// ── Chat / Voice Modal Styles ─────────────────────────────────
const cs = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,20,40,0.5)' },
    sheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: '85%', overflow: 'hidden',
    },
    hdr: {
        flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20,
        gap: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    },
    avatar: {
        width: 42, height: 42, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    hdrTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
    hdrSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
    msgArea: { maxHeight: 340, backgroundColor: '#f4f7fb' },
    uRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    bRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginBottom: 4, alignItems: 'flex-start' },
    ico: {
        width: 24, height: 24, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2,
    },
    bbl: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    uBbl: { backgroundColor: '#1a66d9', borderBottomRightRadius: 4 },
    bBbl: {
        backgroundColor: '#fff', borderBottomLeftRadius: 4,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    badge: {
        fontSize: 9, fontWeight: '700', color: '#1565c0',
        backgroundColor: 'rgba(25,118,210,0.08)',
        borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
        alignSelf: 'flex-start', marginBottom: 3, overflow: 'hidden',
    },
    uTxt: { color: '#fff', fontSize: 13, lineHeight: 20 },
    bTxt: { color: '#1a2332', fontSize: 13, lineHeight: 20 },
    qRow: {
        backgroundColor: '#f4f7fb', paddingHorizontal: 12, paddingVertical: 10,
        flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    },
    qBtn: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#90caf9',
    },
    qTxt: { color: '#1565c0', fontSize: 12, fontWeight: '700' },
    iRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
    },
    iBox: {
        flex: 1, backgroundColor: '#f4f7fb', borderRadius: 24,
        paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1a2332',
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    sBtn: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
    },
    micBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#0288d1',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#0288d1', shadowOpacity: 0.4, shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 }, elevation: 6,
    },
    micBtnActive: {
        backgroundColor: '#e53935',
        shadowColor: '#e53935',
    },
});


// ── Power Cut Banner ──────────────────────────────────────────
function PowerCutBanner({ alerts }) {
    if (!alerts || alerts.length === 0) return null;
    const latest = alerts[0];
    return (
        <View style={pcStyle.banner}>
            <View style={pcStyle.iconBox}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={pcStyle.title}>{latest.title}</Text>
                <Text style={pcStyle.msg}>{latest.message}</Text>
                {latest.area && <Text style={pcStyle.meta}>📍 {latest.area}{latest.estimatedDuration ? ` · ⏱ ${latest.estimatedDuration}` : ''}</Text>}
            </View>
        </View>
    );
}

const pcStyle = StyleSheet.create({
    banner: {
        marginHorizontal: 16, marginTop: 12, borderRadius: 14,
        backgroundColor: '#b71c1c', flexDirection: 'row',
        alignItems: 'flex-start', padding: 14, gap: 12,
        borderWidth: 1, borderColor: '#ef5350',
        shadowColor: '#b71c1c', shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
    },
    iconBox: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    title: { color: '#fff', fontWeight: '800', fontSize: 14 },
    msg: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2, lineHeight: 17 },
    meta: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
});


// Pulsing live dot
function PulsingDot() {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(Animated.parallel([
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.9, duration: 900, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.1, duration: 900, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
            ]),
        ])).start();
    }, []);
    return (
        <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[styles.statusDotGreen, { transform: [{ scale }], opacity, position: 'absolute' }]} />
            <View style={[styles.statusDotGreen]} />
        </View>
    );
}

// Animated KPI card
function AnimatedKpiCard({ children, delay = 0, style }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, delay, useNativeDriver: true }).start();
    }, []);
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    return (
        <Animated.View style={[style, { transform: [{ scale }], opacity: anim }]}>
            {children}
        </Animated.View>
    );
}

// Animated icon card
function AnimatedIconCard({ item }) {
    const scale = useRef(new Animated.Value(1)).current;
    const press = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
        ]).start(() => item.onPress?.());
    };
    return (
        <TouchableOpacity onPress={press} disabled={!item.onPress} activeOpacity={1}>
            <Animated.View style={[styles.iconCard, { transform: [{ scale }] }]}>
                <MaterialCommunityIcons name={item.icon} size={28} color='#1a2332' style={{ marginBottom: 5 }} />
                <Text style={styles.iconLabel}>{item.label}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}
import {
    fetchCurrentMeter, fetchMeterHistory, fetchCurrentTariff, fetchPowerCutAlerts, fetchEnvironment, fetchFlyers,
    sendChatMessage, sendVoiceCommand, transcribeAudio, API_BASE, submitComplaint, fetchSmartNudges,
} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#edf2f7', white: '#ffffff', blueDark: '#0b2a52',
    blue: '#1a66d9', blueLight: '#e6f0ff', blueAccent: '#2f7ee6',
    green: '#2e7d32', greenLight: '#e8f5e9', red: '#c62828', redLight: '#ffebee',
    amber: '#f57f17', amberLight: '#fff3e0', text: '#1a2332',
    textSec: '#5a6a7a', muted: '#8a97a6', border: '#dfe7ef',
};

// Badge helper
const TREE_PER_CO2 = 1.81;
const BADGES = [
    { minTrees: 55, icon: '🌍', label: 'Planet Guardian', color: '#f57f17' },
    { minTrees: 27, icon: '🏆', label: 'Forest Champion', color: '#1b5e20' },
    { minTrees: 11, icon: '🌳', label: 'Grove Protector', color: '#2e7d32' },
    { minTrees: 3, icon: '🌿', label: 'Eco Gardener', color: '#00897b' },
    { minTrees: 1, icon: '🌱', label: 'Seedling Saver', color: '#43a047' },
];
function getTopBadge(co2Saved) {
    const trees = co2Saved / TREE_PER_CO2;
    return BADGES.find(b => trees >= b.minTrees) || null;
}

// Icon grid sections (MSPDCL style)
const GRID_SECTIONS = (nav) => [
    {
        title: '⚡ Energy',
        bg: '#e3f2fd',
        items: [
            { icon: 'file-document-outline', label: 'Bill History', onPress: () => nav('BillHistory') },
            { icon: 'chart-line', label: 'Consumption', onPress: () => nav('Consumption') },
            { icon: 'wallet-outline', label: 'Savings Hub', onPress: () => nav('Savings') },
            { icon: 'leaf', label: 'Environment', onPress: () => nav('Environment') },
        ],
    },
    {
        title: '🔌 Devices & AI',
        bg: '#e8f5e9',
        items: [
            { icon: 'home-automation', label: 'Devices', onPress: () => nav('Devices') },
            { icon: 'robot', label: 'AI Optimizer', onPress: () => nav('Optimizer') },
            { icon: 'microphone', label: 'Voice AI', onPress: () => nav('VoiceAssistant') },
            { icon: 'chip', label: 'AI Engine', onPress: () => nav('AIInsights') },
        ],
    },
    {
        title: '🛠 Services',
        bg: '#fce4ec',
        items: [
            { icon: 'clipboard-list-outline', label: 'Complaints', onPress: () => nav('Complaints') },
            { icon: 'receipt', label: 'Billing FAQ', onPress: () => nav('BillHistory') },
            { icon: 'phone-outline', label: 'Helpline', onPress: null },
            { icon: 'map-marker-outline', label: 'Service Map', onPress: () => nav('ServiceMap') },
        ],
    },
];

// ── Flyer Carousel ────────────────────────────────────────────
const BACKEND_URL = API_BASE;
const CARD_W = SCREEN_W - 60;
const CARD_SPACING = 10;
const CARD_FULL = CARD_W + CARD_SPACING;

function FlyerCarousel({ flyers }) {
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);
    const [idx, setIdx] = useState(0);
    const idxRef = useRef(0);

    useEffect(() => {
        if (flyers.length <= 1) return;
        const t = setInterval(() => {
            const next = (idxRef.current + 1) % flyers.length;
            idxRef.current = next;
            setIdx(next);
            scrollRef.current?.scrollTo({ x: next * CARD_FULL, animated: true });
        }, 4000);
        return () => clearInterval(t);
    }, [flyers.length]);

    if (!flyers.length) return null;

    const openLink = (url) => {
        if (!url) return;
        Linking.openURL(url).catch(() => { });
    };

    return (
        <View style={{ marginTop: 14 }}>
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                onMomentumScrollEnd={e => {
                    const newIdx = Math.round(e.nativeEvent.contentOffset.x / CARD_FULL);
                    setIdx(newIdx);
                    idxRef.current = newIdx;
                }}
                decelerationRate="fast"
                snapToInterval={CARD_FULL}
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: (SCREEN_W - CARD_W) / 2 }}
                scrollEventThrottle={16}
            >
                {flyers.map((f, i) => {
                    const hasImage = !!f.imageUrl;
                    const hasLink = !!f.linkUrl;
                    const imgSrc = f.imageUrl?.startsWith('/')
                        ? `${BACKEND_URL}${f.imageUrl}`
                        : f.imageUrl;

                    const inputRange = [
                        (i - 1) * CARD_FULL,
                        i * CARD_FULL,
                        (i + 1) * CARD_FULL,
                    ];

                    const scale = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.88, 1, 0.88],
                        extrapolate: 'clamp',
                    });

                    const rotateY = scrollX.interpolate({
                        inputRange,
                        outputRange: ['8deg', '0deg', '-8deg'],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.6, 1, 0.6],
                        extrapolate: 'clamp',
                    });

                    const translateY = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 0, 10],
                        extrapolate: 'clamp',
                    });

                    const card = (
                        <Animated.View style={{
                            width: CARD_W, height: 200, marginRight: CARD_SPACING,
                            transform: [
                                { perspective: 1000 },
                                { scale },
                                { rotateY },
                                { translateY },
                            ],
                            opacity,
                        }}>
                            <View style={{
                                flex: 1, borderRadius: 18, overflow: 'hidden',
                                backgroundColor: f.bgColor,
                                shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16,
                                shadowOffset: { width: 0, height: 8 }, elevation: 10,
                            }}>
                                {hasImage ? (
                                    <Image
                                        source={{ uri: imgSrc }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <>
                                        <View style={{ height: 5, backgroundColor: f.accentColor }} />
                                        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}>
                                            {f.badge ? (
                                                <View style={{
                                                    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
                                                    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8,
                                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
                                                }}>
                                                    <Text style={{ color: f.textColor, fontSize: 10, fontWeight: '800' }}>{f.badge}</Text>
                                                </View>
                                            ) : null}
                                            <Text style={{ color: f.textColor, fontSize: 17, fontWeight: '900', marginBottom: 3 }} numberOfLines={2}>{f.title}</Text>
                                            {f.subtitle ? <Text style={{ color: f.textColor, fontSize: 12, fontWeight: '700', opacity: 0.85, marginBottom: 4 }} numberOfLines={1}>{f.subtitle}</Text> : null}
                                            <Text style={{ color: f.textColor, fontSize: 12, lineHeight: 18, opacity: 0.92 }} numberOfLines={2}>{f.body}</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </Animated.View>
                    );

                    return hasLink ? (
                        <TouchableOpacity
                            key={f.id}
                            activeOpacity={0.88}
                            onPress={() => openLink(f.linkUrl)}
                        >
                            {card}
                        </TouchableOpacity>
                    ) : (
                        <View key={f.id}>{card}</View>
                    );
                })}
            </Animated.ScrollView>

            {/* Dot indicators */}
            {flyers.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                    {flyers.map((_, i) => (
                        <View key={i} style={{
                            width: idx === i ? 20 : 6, height: 6,
                            borderRadius: 3,
                            backgroundColor: idx === i ? '#1a66d9' : '#cfd8e3',
                            transition: 'width 0.3s',
                        }} />
                    ))}
                </View>
            )}
        </View>
    );
}

// Simple sparkline bar chart
function Sparkline({ data, color = '#2196f3', height = 48 }) {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.watt), 1);
    const bars = data.slice(-20); // last 20 readings
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2, flex: 1 }}>
            {bars.map((d, i) => (
                <View
                    key={i}
                    style={{
                        flex: 1,
                        height: Math.max((d.watt / maxVal) * height, 3),
                        backgroundColor: color,
                        borderRadius: 2,
                        opacity: 0.6 + (i / bars.length) * 0.4,
                    }}
                />
            ))}
        </View>
    );
}

export default function DashboardScreen({ navigation }) {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [current, setCurrent] = useState(null);
    const [history, setHistory] = useState([]);
    const [tariff, setTariff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [powerCuts, setPowerCuts] = useState([]);

    const [co2Saved, setCo2Saved] = useState(18);
    const [userName, setUserName] = useState('');
    const [flyers, setFlyers] = useState([]);
    const [nudges, setNudges] = useState([]);

    useEffect(() => {
        loadData();
        AsyncStorage.getItem('userName').then(n => { if (n) setUserName(n); });
        fetchFlyers().then(setFlyers).catch(() => { });
        fetchSmartNudges().then(d => setNudges(d?.nudges || [])).catch(() => {});
        const interval = setInterval(async () => {
            try {
                const [meter, hist] = await Promise.all([
                    fetchCurrentMeter(),
                    fetchMeterHistory(20),
                ]);
                setCurrent(meter);
                setHistory(hist);
            } catch { }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const userId = await AsyncStorage.getItem('userId') ?? '';
            const [meter, hist, trf, pc] = await Promise.all([
                fetchCurrentMeter(), fetchMeterHistory(24),
                fetchCurrentTariff(), fetchPowerCutAlerts(),
            ]);
            setCurrent(meter); setHistory(hist); setTariff(trf);
            setPowerCuts(pc || []);
            // Fetch env badge separately — failure must not break dashboard
            fetchEnvironment(userId)
                .then(env => { if (env?.carbonSavedKg != null) setCo2Saved(env.carbonSavedKg); })
                .catch(() => { });
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.blue} />
            </View>
        );
    }

    const navigate = (name) => navigation?.navigate(name);
    const isPeak = tariff?.name === 'Peak';
    const todayKwh = history.reduce((s, r) => s + r.kwh, 0).toFixed(2);
    const todayCost = (parseFloat(todayKwh) * (tariff?.ratePerUnit ?? 6)).toFixed(2);
    const topBadge = getTopBadge(co2Saved);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadData(true)}
                        tintColor={C.blue}
                        colors={[C.blue]}
                    />
                }
            >
                {/* ── Header ─────────────────────────────────────── */}
                <View style={[styles.header, { paddingTop: top + 14 }]}>
                    <MenuButton mode="menu" />
                    <View style={styles.headerContent}>
                        <Text style={styles.greeting}>{t.greeting}, {userName || 'User'} 👋</Text>
                        <Text style={styles.headerTitle}>PowerPilot</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={styles.statusPill}>
                            <PulsingDot />
                            <Text style={styles.statusText}>{t.live}</Text>
                        </View>
                        {topBadge && (
                            <TouchableOpacity
                                onPress={() => navigation?.navigate('Environment')}
                                activeOpacity={0.75}
                                style={[styles.badgePill, { backgroundColor: topBadge.color + '33', borderColor: topBadge.color + '88' }]}
                            >
                                <Text style={styles.badgePillText}>{topBadge.icon} {topBadge.label} ↗</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Power Cut Alert Banner ─────────────────────── */}
                <PowerCutBanner alerts={powerCuts} />

                {/* ── Flyer Carousel ────────────────────────────── */}
                <FlyerCarousel flyers={flyers} />

                {/* ── ⚡ LIVE DASHBOARD SECTION ──────────────────── */}
                <View style={styles.dashboardSection}>
                    <Text style={styles.dashSectionLabel}>{t.live_dashboard}</Text>

                    {/* 4 KPI tiles — animated */}
                    <View style={styles.kpiRow}>
                        {[{
                            color: C.blueAccent, val: current?.watt?.toFixed(0) ?? '--', unit: 'W Live', tColor: C.text,
                        }, {
                            color: isPeak ? C.red : C.green, val: `₹${tariff?.ratePerUnit ?? '--'}/u`,
                            unit: isPeak ? '🔴 Peak' : '🟢 Off‑Peak', tColor: isPeak ? C.red : C.green,
                        }, {
                            color: C.amber, val: todayKwh, unit: 'kWh Today', tColor: C.text,
                        }, {
                            color: C.green, val: `₹${todayCost}`, unit: 'Est. Cost', tColor: C.text,
                        }].map((k, i) => (
                            <AnimatedKpiCard key={i} delay={i * 80} style={[styles.kpiCard, { borderTopColor: k.color }]}>
                                <Text style={[styles.kpiVal, { color: k.tColor }]}>{k.val}</Text>
                                <Text style={styles.kpiUnit}>{k.unit}</Text>
                            </AnimatedKpiCard>
                        ))}
                    </View>

                    {/* Sparkline chart */}
                    <View style={styles.sparkCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={styles.sparkTitle}>Live Power Reading</Text>
                            <Text style={styles.sparkSub}>{history.length} readings</Text>
                        </View>
                        <Sparkline data={history} color={C.blueAccent} height={60} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                            <Text style={styles.sparkAxis}>Last 20 readings</Text>
                            <Text style={styles.sparkAxis}>Now →</Text>
                        </View>
                    </View>

                    {/* Device quick link */}
                    <TouchableOpacity
                        onPress={() => navigation?.navigate('Devices')}
                        style={{ backgroundColor: '#f0f7ff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <Text style={{ color: C.blue, fontWeight: '700', fontSize: 14 }}>⚡ Manage Live Devices</Text>
                        <Ionicons name="chevron-forward" size={18} color={C.blue} />
                    </TouchableOpacity>
                </View>

                {/* ── 🔔 Smart Tariff Nudges ────────────────────── */}
                {nudges.length > 0 && (
                    <View style={styles.dashboardSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.dashSectionLabel}>🔔 Smart Tariff Tips</Text>
                            <View style={{ backgroundColor: '#ef444420', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
                                <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>{nudges.length} ACTIVE</Text>
                            </View>
                        </View>
                        {nudges.slice(0, 4).map((nudge, idx) => (
                            <TouchableOpacity
                                key={nudge.id || idx}
                                onPress={() => nudge.actionRoute && navigate(nudge.actionRoute)}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 14,
                                    padding: 14,
                                    marginBottom: 10,
                                    borderLeftWidth: 4,
                                    borderLeftColor: nudge.color || '#3b82f6',
                                    shadowColor: '#000',
                                    shadowOpacity: 0.06,
                                    shadowRadius: 8,
                                    shadowOffset: { width: 0, height: 2 },
                                    elevation: 2,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                    <Text style={{ fontSize: 22 }}>{nudge.icon}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a2332', marginBottom: 3 }}>{nudge.title}</Text>
                                        <Text style={{ fontSize: 11.5, color: '#5a6a7a', lineHeight: 16 }}>{nudge.message}</Text>
                                        {nudge.savings?.perMonth > 0 && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                                                <View style={{ backgroundColor: '#22c55e15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                    <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>💰 Save ₹{nudge.savings.perMonth}/mo</Text>
                                                </View>
                                                {nudge.suggestedWindow && (
                                                    <View style={{ backgroundColor: '#3b82f615', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                        <Text style={{ color: '#2563eb', fontSize: 11, fontWeight: '600' }}>⏰ {nudge.suggestedWindow.start}–{nudge.suggestedWindow.end}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#8a97a6" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* ── Icon Grid Sections ─────────────────────────── */}
                {GRID_SECTIONS(navigate).map((section) => (
                    <View key={section.title} style={[styles.section, { backgroundColor: section.bg }]}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.iconGrid}>
                            {section.items.map((item, idx) => (
                                <AnimatedIconCard key={idx} item={item} />
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        backgroundColor: C.blueDark, paddingHorizontal: 20, paddingBottom: 22,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        shadowColor: '#0b2a52', shadowOpacity: 0.25, shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    headerContent: {},
    greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 2 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6,
    },
    statusDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
    statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    badgePill: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        borderWidth: 1,
    },
    badgePillText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // Dashboard Section
    dashboardSection: {
        marginHorizontal: 16, marginTop: 16, backgroundColor: C.white, borderRadius: 18,
        padding: 16, borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
    },
    dashSectionLabel: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 12 },

    // KPI Row (4 tiles)
    kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    kpiCard: {
        flex: 1, backgroundColor: '#f7f9fc', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6,
        alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: C.border,
    },
    kpiVal: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
    kpiUnit: { color: C.muted, fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' },

    // Sparkline
    sparkCard: {
        backgroundColor: '#f7f9fc', borderRadius: 12, padding: 12, marginBottom: 12,
        borderWidth: 1, borderColor: C.border,
    },
    sparkTitle: { color: C.text, fontSize: 13, fontWeight: '700' },
    sparkSub: { color: C.muted, fontSize: 11 },
    sparkAxis: { color: C.muted, fontSize: 9 },

    // Grid Sections (MSPDCL style)
    section: {
        marginHorizontal: 16, marginTop: 14, borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 14 },
    iconGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    iconCard: {
        width: ICON_CARD_W,
        backgroundColor: C.white, borderRadius: 14,
        paddingVertical: 14, paddingHorizontal: 4,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        minHeight: 80,
    },
    iconLabel: {
        color: C.text, fontSize: 10, fontWeight: '600',
        textAlign: 'center', lineHeight: 14,
        marginTop: 5, flexShrink: 1,
        width: '100%', paddingHorizontal: 2,
    },



    // Misc (kept for safety)
    devSummaryRow: { flexDirection: 'row', gap: 8 },
    devSumCard: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    devSumNum: { color: C.green, fontSize: 18, fontWeight: '800' },
    devSumLabel: { color: C.textSec, fontSize: 9, fontWeight: '600', marginTop: 1 },
    card: {
        marginHorizontal: 16, marginTop: 14, backgroundColor: C.white, borderRadius: 16,
        padding: 18, borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    },
    cardTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(10,20,40,0.55)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: C.border,
    },
    modalTitle: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 20 },
    input: {
        backgroundColor: '#f7f9fc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 16,
    },
    modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f7f9fc', alignItems: 'center', borderWidth: 1, borderColor: C.border },
    cancelText: { color: C.textSec, fontSize: 14, fontWeight: '700' },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center' },
    saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});


