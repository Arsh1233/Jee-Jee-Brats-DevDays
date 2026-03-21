import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    Animated, Easing, Keyboard, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { sendVoiceCommand, transcribeAudio, fetchDevices, toggleDevice, submitComplaint } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

// Safe import — expo-av needs a dev build; gracefully degrade in Expo Go
let Audio = null;
try { Audio = require('expo-av').Audio; } catch { }

const C = {
    bg: '#edf2f7', white: '#fff', blueDark: '#0b2a52', blue: '#1a66d9',
    blueLight: '#e6f0ff', green: '#2e7d32', greenLight: '#e8f5e9',
    text: '#1a2332', textSec: '#5a6a7a', muted: '#8a97a6', border: '#dfe7ef',
};

const INTENT_ICONS = {
    greet: { icon: 'hand-wave', color: '#ffb300' },
    check_usage: { icon: 'chart-line', color: '#1976d2' },
    control_device: { icon: 'toggle-switch', color: '#7b1fa2' },
    check_bill: { icon: 'receipt', color: '#e65100' },
    get_tips: { icon: 'lightbulb-on', color: '#2e7d32' },
    file_complaint: { icon: 'clipboard-alert', color: '#c62828' },
    compare_usage: { icon: 'chart-bar', color: '#0097a7' },
    check_tariff: { icon: 'cash-multiple', color: '#558b2f' },
    goodbye: { icon: 'hand-wave', color: '#78909c' },
    general_query: { icon: 'help-circle', color: '#5c6bc0' },
    complaint_filed: { icon: 'clipboard-check', color: '#2e7d32' },
};

const QUICK_COMMANDS = [
    { label: '📊 My usage', cmd: 'What is my usage today?' },
    { label: '💡 Saving tips', cmd: 'Give me saving tips' },
    { label: '💰 My bill', cmd: 'How much is my bill?' },
    { label: '⚡ Tariff rate', cmd: "What's the tariff rate?" },
    { label: '📋 Complaint', cmd: 'I want to file a complaint' },
    { label: '🔌 Turn off AC', cmd: 'Turn off the AC' },
];

export default function VoiceAssistantScreen() {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { id: 0, from: 'bot', text: '👋 Hi! I\'m the PowerPilot Voice Assistant.\nSpeak or type a command — I\'ll understand your intent and respond with ML-powered intelligence.', intent: 'greet', confidence: 1.0 },
    ]);
    const [listening, setListening] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [recording, setRecording] = useState(null);
    const scrollRef = useRef(null);

    // ── Mic button animations ──
    const micScale = useRef(new Animated.Value(1)).current;
    const micGlow = useRef(new Animated.Value(0)).current;
    const pulseRing = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(null);

    const startMicAnim = () => {
        // Scale up the mic button
        Animated.spring(micScale, { toValue: 1.2, friction: 4, useNativeDriver: true }).start();
        Animated.timing(micGlow, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        // Start the pulsing ring
        pulseAnim.current = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseRing, { toValue: 2.2, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseRing, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
                ]),
            ])
        );
        pulseOpacity.setValue(0.5);
        pulseAnim.current.start();
    };

    const stopMicAnim = () => {
        pulseAnim.current?.stop();
        Animated.spring(micScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        Animated.timing(micGlow, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        pulseRing.setValue(1);
        pulseOpacity.setValue(0);
    };

    // ── Send a text command (from input box or quick commands) ──
    const sendCommand = async (text) => {
        const cmd = text || input.trim();
        if (!cmd) return;
        setInput('');
        Keyboard.dismiss();
        const uid = Date.now();
        setMessages(prev => [...prev, { id: uid, from: 'user', text: cmd }]);
        setProcessing(true);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const result = await sendVoiceCommand(cmd);
            const raw = result.response;
            const reply = typeof raw === 'object' ? (raw.text || JSON.stringify(raw)) : (raw || 'No response');
            setMessages(prev => [...prev, {
                id: uid + 1,
                from: 'bot',
                text: reply,
                intent: result.intent,
                confidence: result.confidence,
                entities: result.entities,
            }]);

            // ── Actually toggle the device if intent is control_device ──
            if (result.intent === 'control_device' && result.entities?.appliances?.length > 0) {
                try {
                    const userId = await AsyncStorage.getItem('userId') ?? '';
                    const devices = await fetchDevices(userId);
                    const targetName = result.entities.appliances[0].toLowerCase();
                    const match = devices.find(d =>
                        d.name.toLowerCase().includes(targetName) ||
                        targetName.includes(d.name.toLowerCase())
                    );
                    if (match) {
                        await toggleDevice(match.id, userId);
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            from: 'bot',
                            text: `🔌 ${match.name} has been toggled on your Devices page.`,
                            intent: 'device_action',
                            confidence: 1.0,
                        }]);
                    } else {
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            from: 'bot',
                            text: `⚠️ No device named "${result.entities.appliances[0]}" found in your Devices list. Add it in Live Devices first.`,
                            intent: 'device_not_found',
                            confidence: 1.0,
                        }]);
                    }
                } catch (err) {
                    console.error('[Voice] Device toggle error:', err);
                }
            }

            // ── Actually file a complaint if intent is file_complaint ──
            if (result.intent === 'file_complaint') {
                try {
                    const userId = await AsyncStorage.getItem('userId') ?? 'USR000001';
                    const userName = await AsyncStorage.getItem('userName') ?? 'User';
                    const complaint = await submitComplaint({
                        userId,
                        name: userName,
                        category: 'General',
                        subject: `Voice complaint: ${cmd.substring(0, 80)}`,
                        description: cmd,
                        contact: '',
                    });
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        from: 'bot',
                        text: `✅ Complaint #${complaint.id} has been filed successfully! Category: ${complaint.category}. Status: ${complaint.status}. You can track it in the Complaints section.`,
                        intent: 'complaint_filed',
                        confidence: 1.0,
                    }]);
                } catch (err) {
                    console.error('[Voice] Complaint filing error:', err);
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        from: 'bot',
                        text: '⚠️ Could not file the complaint automatically. Please try from the Complaints screen.',
                        intent: 'error',
                        confidence: 0,
                    }]);
                }
            }
        } catch {
            setMessages(prev => [...prev, {
                id: uid + 1, from: 'bot',
                text: '❌ Could not connect to the AI Engine. Make sure the API server is running.',
                intent: 'error', confidence: 0,
            }]);
        } finally {
            setProcessing(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    // ── Mic press → start recording ──
    const onMicPressIn = async () => {
        startMicAnim();
        setListening(true);

        if (!Audio) {
            // expo-av not available — show a tip after a moment
            return;
        }

        try {
            // Clean up any previous recording
            if (recording) {
                try { await recording.stopAndUnloadAsync(); } catch { }
                setRecording(null);
            }

            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Alert.alert('Permission needed', 'Microphone access is required for voice commands.');
                setListening(false);
                stopMicAnim();
                return;
            }
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: rec } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(rec);
        } catch (err) {
            console.warn('[Voice] startRecording error:', err.message);
            // Don't show errors for Expo Go — mic just won't work
        }
    };

    // ── Mic release → stop recording, transcribe, send ──
    const onMicPressOut = async () => {
        stopMicAnim();
        setListening(false);

        if (!recording) {
            // No actual recording (Expo Go or error) → show helpful message
            if (!Audio) {
                setMessages(p => [...p, {
                    id: Date.now(), from: 'bot',
                    text: '⚠️ Mic recording requires a dev build. Use the text input below to type your command.',
                }]);
            }
            return;
        }

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

            if (!uri) return;

            // Show a "listening" placeholder
            const listenId = Date.now();
            setMessages(p => [...p, { id: listenId, from: 'user', text: '🎤 Processing speech...' }]);
            setProcessing(true);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

            try {
                const t = await transcribeAudio(uri);
                if (t.transcript) {
                    // Replace placeholder with actual transcript
                    setMessages(p => p.map(m =>
                        m.id === listenId ? { ...m, text: t.transcript } : m
                    ));
                    setProcessing(false);
                    // Now send the command — but DON'T add another user message
                    // Call the voice API directly instead of sendCommand()
                    setProcessing(true);
                    try {
                        const result = await sendVoiceCommand(t.transcript);
                        const raw = result.response;
                        const reply = typeof raw === 'object' ? (raw.text || JSON.stringify(raw)) : (raw || 'No response');
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            from: 'bot',
                            text: reply,
                            intent: result.intent,
                            confidence: result.confidence,
                            entities: result.entities,
                        }]);

                        // Device toggle for control_device intent
                        if (result.intent === 'control_device' && result.entities?.appliances?.length > 0) {
                            try {
                                const userId = await AsyncStorage.getItem('userId') ?? '';
                                const devices = await fetchDevices(userId);
                                const targetName = result.entities.appliances[0].toLowerCase();
                                const match = devices.find(d =>
                                    d.name.toLowerCase().includes(targetName) ||
                                    targetName.includes(d.name.toLowerCase())
                                );
                                if (match) {
                                    await toggleDevice(match.id, userId);
                                    setMessages(prev => [...prev, {
                                        id: Date.now() + 1,
                                        from: 'bot',
                                        text: `🔌 ${match.name} has been toggled on your Devices page.`,
                                        intent: 'device_action',
                                        confidence: 1.0,
                                    }]);
                                }
                            } catch (err) {
                                console.error('[Voice] Device toggle error:', err);
                            }
                        }
                    } catch {
                        setMessages(prev => [...prev, {
                            id: Date.now(), from: 'bot',
                            text: '❌ Could not connect to the AI Engine.',
                            intent: 'error', confidence: 0,
                        }]);
                    }
                } else {
                    // Couldn't understand — update the placeholder
                    setMessages(p => p.map(m =>
                        m.id === listenId ? { ...m, text: '⚠️ Could not understand. Try again.', from: 'bot' } : m
                    ));
                }
            } catch (err) {
                console.error('[Voice] Transcription error:', err);
                setMessages(p => p.map(m =>
                    m.id === listenId
                        ? { ...m, text: '⚠️ Speech service unavailable. Type your command instead.', from: 'bot' }
                        : m
                ));
            } finally {
                setProcessing(false);
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            }
        } catch (err) {
            console.error('[Voice] stopRecording error:', err);
            setRecording(null);
            setProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0b2a52', '#0d3b6e']} style={[styles.header, { paddingTop: top + 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MenuButton />
                    <View>
                        <Text style={styles.headerTitle}>{t.nav_voiceai}</Text>
                        <Text style={styles.headerSub}>🎙️ ML-Powered Intent Recognition</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Messages */}
            <ScrollView
                ref={scrollRef}
                style={styles.chatArea}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map(msg => (
                    <View key={msg.id} style={msg.from === 'user' ? styles.userRow : styles.botRow}>
                        {msg.from === 'bot' && (
                            <View style={styles.botAvatarBox}>
                                <MaterialCommunityIcons name="robot-happy-outline" size={16} color="#1976d2" />
                            </View>
                        )}
                        <View style={[styles.bubble, msg.from === 'user' ? styles.userBubble : styles.botBubble]}>
                            {/* Intent badge */}
                            {msg.from === 'bot' && msg.intent && msg.intent !== 'error' && (
                                <View style={styles.intentBadge}>
                                    <MaterialCommunityIcons
                                        name={INTENT_ICONS[msg.intent]?.icon || 'brain'}
                                        size={12}
                                        color={INTENT_ICONS[msg.intent]?.color || '#1976d2'}
                                    />
                                    <Text style={[styles.intentText, { color: INTENT_ICONS[msg.intent]?.color || '#1976d2' }]}>
                                        {msg.intent?.replace(/_/g, ' ')}
                                    </Text>
                                    {msg.confidence > 0 && (
                                        <Text style={styles.confText}>
                                            {(msg.confidence * 100).toFixed(0)}%
                                        </Text>
                                    )}
                                </View>
                            )}
                            <Text style={msg.from === 'user' ? styles.userText : styles.botText}>{msg.text}</Text>
                        </View>
                    </View>
                ))}
                {processing && (
                    <View style={styles.botRow}>
                        <View style={styles.botAvatarBox}>
                            <MaterialCommunityIcons name="robot-happy-outline" size={16} color="#1976d2" />
                        </View>
                        <View style={[styles.bubble, styles.botBubble, { paddingVertical: 14 }]}>
                            <Text style={{ color: '#64b5f6', fontSize: 13 }}>Analyzing intent…</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Quick Commands */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {QUICK_COMMANDS.map(q => (
                    <TouchableOpacity key={q.cmd} onPress={() => sendCommand(q.cmd)}
                        style={styles.quickBtn} activeOpacity={0.7}>
                        <Text style={styles.quickText}>{q.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Mic + Input Area */}
            <View style={styles.bottomBar}>
                {/* Mic Button with pulse ring */}
                <View style={styles.micArea}>
                    {/* Pulse ring */}
                    <Animated.View style={[styles.pulseRing, {
                        transform: [{ scale: pulseRing }],
                        opacity: pulseOpacity,
                    }]} />

                    {/* Mic button */}
                    <Animated.View style={{ transform: [{ scale: micScale }] }}>
                        <TouchableOpacity
                            style={[styles.micBtn, listening && styles.micBtnActive]}
                            onPressIn={onMicPressIn}
                            onPressOut={onMicPressOut}
                            activeOpacity={1}
                        >
                            <Animated.View style={{
                                opacity: micGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
                                ...StyleSheet.absoluteFillObject,
                                backgroundColor: '#1976d2',
                                borderRadius: 25,
                            }} />
                            <Ionicons name={listening ? 'mic' : 'mic-outline'} size={24}
                                color={listening ? '#fff' : '#1976d2'} />
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Text Input */}
                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder={t.nav_voiceai ? `${t.nav_voiceai}…` : 'Type a voice command…'}
                        placeholderTextColor="#8a97a6"
                        returnKeyType="send"
                        onSubmitEditing={() => sendCommand()}
                    />
                    <TouchableOpacity
                        onPress={() => sendCommand()}
                        disabled={!input.trim() || processing}
                        style={[styles.sendBtn, (!input.trim() || processing) && { opacity: 0.4 }]}
                    >
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    header: {
        paddingHorizontal: 24, paddingBottom: 20,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        shadowColor: '#0b2a52', shadowOpacity: 0.25, shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },

    chatArea: { flex: 1 },

    userRow: { alignItems: 'flex-end', marginBottom: 10 },
    botRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },

    botAvatarBox: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: C.blueLight, justifyContent: 'center', alignItems: 'center',
    },

    bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
    userBubble: {
        backgroundColor: '#1976d2', borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: C.white, borderBottomLeftRadius: 4,
        borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 }, elevation: 1,
    },

    userText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    botText: { color: C.text, fontSize: 14, lineHeight: 20 },

    intentBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(25,118,210,0.08)', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
        marginBottom: 6,
    },
    intentText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
    confText: { fontSize: 9, color: C.muted, fontWeight: '700', marginLeft: 4 },

    quickRow: { maxHeight: 44, borderTopWidth: 1, borderTopColor: C.border },
    quickBtn: {
        backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: C.border,
    },
    quickText: { color: C.text, fontSize: 12, fontWeight: '600' },

    bottomBar: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border,
    },

    micArea: {
        width: 56, height: 56,
        justifyContent: 'center', alignItems: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#1976d2',
    },
    micBtn: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: C.blueLight, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#1976d2',
        overflow: 'hidden',
    },
    micBtnActive: {
        backgroundColor: '#1976d2', borderColor: '#0d47a1',
    },

    inputWrap: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f0f4f8', borderRadius: 24,
        paddingLeft: 16, paddingRight: 4, height: 46,
        borderWidth: 1, borderColor: C.border,
    },
    input: { flex: 1, fontSize: 14, color: C.text },
    sendBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center',
    },
});
