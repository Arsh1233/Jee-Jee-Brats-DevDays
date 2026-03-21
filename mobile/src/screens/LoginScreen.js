import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Platform, Keyboard,
    Animated, Dimensions, Easing, KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../i18n/LanguageContext';

const { width: W, height: H } = Dimensions.get('window');
const isSmall = H < 680;

// ── Floating Orb ────────────────────────────────────────────────────
function Orb({ size, color, startX, startY, duration, delay }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 2.5] });
    const opacity = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.5, 0.5, 0] });
    return (
        <Animated.View style={{
            position: 'absolute', left: startX, top: startY,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ translateY }], opacity,
        }} />
    );
}

const ORBS = [
    { size: 9, color: '#64b5f6', startX: W * 0.07, startY: H * 0.68, duration: 3200, delay: 0 },
    { size: 5, color: '#90caf9', startX: W * 0.20, startY: H * 0.78, duration: 2700, delay: 500 },
    { size: 13, color: '#1976d2', startX: W * 0.76, startY: H * 0.63, duration: 3900, delay: 200 },
    { size: 7, color: '#42a5f5', startX: W * 0.87, startY: H * 0.74, duration: 2500, delay: 800 },
    { size: 5, color: '#bbdefb', startX: W * 0.50, startY: H * 0.80, duration: 3100, delay: 100 },
    { size: 11, color: '#1565c0', startX: W * 0.34, startY: H * 0.70, duration: 3600, delay: 600 },
];

export default function LoginScreen({ onLogin }) {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [bpNumber, setBpNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocused] = useState(null);

    // Animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(50)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const btnGlow = useRef(new Animated.Value(0)).current;
    // Logo collapse on keyboard
    const logoHeight = useRef(new Animated.Value(isSmall ? 160 : 200)).current;
    const logoVis = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Staggered entrance
        Animated.stagger(150, [
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(formSlide, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(formOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
            ]),
        ]).start();

        // Button glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(btnGlow, { toValue: 1, duration: 1800, useNativeDriver: false }),
                Animated.timing(btnGlow, { toValue: 0, duration: 1800, useNativeDriver: false }),
            ])
        ).start();

        const show = Keyboard.addListener('keyboardWillShow', shrink);
        const showD = Keyboard.addListener('keyboardDidShow', shrink);
        const hide = Keyboard.addListener('keyboardWillHide', expand);
        const hideD = Keyboard.addListener('keyboardDidHide', expand);
        return () => { show.remove(); showD.remove(); hide.remove(); hideD.remove(); };
    }, []);

    const shrink = () => Animated.parallel([
        Animated.timing(logoHeight, { toValue: 0, duration: 220, useNativeDriver: false }),
        Animated.timing(logoVis, { toValue: 0, duration: 150, useNativeDriver: false }),
    ]).start();

    const expand = () => Animated.parallel([
        Animated.timing(logoHeight, { toValue: isSmall ? 160 : 200, duration: 280, useNativeDriver: false }),
        Animated.timing(logoVis, { toValue: 1, duration: 280, useNativeDriver: false }),
    ]).start();

    const btnElevation = btnGlow.interpolate({ inputRange: [0, 1], outputRange: [6, 18] });

    const handleLogin = async () => {
        if (!email || !bpNumber || !password) { setError('Please fill all fields including BP Number.'); return; }
        setError(''); setLoading(true);
        try {
            const data = await loginUser(email, bpNumber, password);
            await AsyncStorage.setItem('userId', data.user?.userId ?? '');
            await AsyncStorage.setItem('bpNumber', data.user?.bpNumber ?? bpNumber);
            await AsyncStorage.setItem('userName', data.user?.name ?? '');
            onLogin(data.user);
        }
        catch (e) {
            console.log('[LOGIN ERROR]', e?.message, e?.response?.status, e?.response?.data);
            setError(e?.response?.data?.error ?? e?.message ?? 'Login failed. Check your credentials.');
            Animated.sequence([
                Animated.timing(formSlide, { toValue: -12, duration: 60, useNativeDriver: true }),
                Animated.timing(formSlide, { toValue: 12, duration: 60, useNativeDriver: true }),
                Animated.timing(formSlide, { toValue: -6, duration: 60, useNativeDriver: true }),
                Animated.timing(formSlide, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start();
        }
        finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={s.root} behavior="padding">
            <StatusBar style="light" />
            <LinearGradient colors={['#020b18', '#071428', '#081e3a']} style={StyleSheet.absoluteFill} />
            {ORBS.map((o, i) => <Orb key={i} {...o} />)}
            <View style={s.accentLine1} />
            <View style={s.accentLine2} />

            {/* LOGO — collapses smoothly on keyboard */}
            <Animated.View style={[s.logoWrap, { height: logoHeight, opacity: logoVis, overflow: 'hidden' }]}>
                <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity, alignItems: 'center' }}>
                    {/* Simple glow ring — single, not pulsing */}
                    <View style={s.logoRingOuter}>
                        <View style={s.logoRingInner}>
                            <LinearGradient colors={['#2196f3', '#0a47a1']} style={s.logoCircle}>
                                <Ionicons name="flash" size={36} color="#fff" />
                            </LinearGradient>
                        </View>
                    </View>
                    <Text style={s.appName}>PowerPilot</Text>
                    <View style={s.taglineRow}>
                        <View style={s.taglineDash} />
                        <Text style={s.tagline}>Smart Energy Management</Text>
                        <View style={s.taglineDash} />
                    </View>
                </Animated.View>
            </Animated.View>

            {/* FORM */}
            <Animated.View style={[s.card, { transform: [{ translateY: formSlide }], opacity: formOpacity }]}>
                <LinearGradient colors={['#1976d2', '#0d47a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cardAccent} />

                <Text style={s.cardTitle}>{t.login_welcome}</Text>
                <Text style={s.cardSub}>{t.login_sub}</Text>

                {error ? (
                    <View style={s.errorBox}>
                        <Ionicons name="alert-circle" size={15} color="#ff6b6b" />
                        <Text style={s.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={[s.inputWrap, focusedField === 'email' && s.inputFocused]}>
                    <Ionicons name="mail-outline" size={17} color={focusedField === 'email' ? '#64b5f6' : '#3d5e78'} style={s.icon} />
                    <TextInput
                        style={s.input}
                        placeholder={t.login_email}
                        placeholderTextColor="#2a4560"
                        value={email}
                        onChangeText={t => { setEmail(t); setError(''); }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                    />
                </View>

                <View style={[s.inputWrap, focusedField === 'bp' && s.inputFocused]}>
                    <Ionicons name="card-outline" size={17} color={focusedField === 'bp' ? '#64b5f6' : '#3d5e78'} style={s.icon} />
                    <TextInput
                        style={s.input}
                        placeholder={t.login_bp}
                        placeholderTextColor="#2a4560"
                        value={bpNumber}
                        onChangeText={t => { setBpNumber(t.toUpperCase()); setError(''); }}
                        autoCapitalize="characters"
                        returnKeyType="next"
                        onFocus={() => setFocused('bp')}
                        onBlur={() => setFocused(null)}
                    />
                </View>

                <View style={[s.inputWrap, focusedField === 'pass' && s.inputFocused]}>
                    <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'pass' ? '#64b5f6' : '#3d5e78'} style={s.icon} />
                    <TextInput
                        style={[s.input, { flex: 1 }]}
                        placeholder={t.login_password}
                        placeholderTextColor="#2a4560"
                        value={password}
                        onChangeText={t => { setPassword(t); setError(''); }}
                        secureTextEntry={!showPass}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        onFocus={() => setFocused('pass')}
                        onBlur={() => setFocused(null)}
                    />
                    <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color="#3d5e78" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.forgotRow}>
                    <Text style={s.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <Animated.View style={[s.btnShadow, { shadowRadius: btnElevation, elevation: 12 }]}>
                    <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.87}>
                        <LinearGradient colors={loading ? ['#1a3a5c', '#1a3a5c'] : ['#2196f3', '#0d47a1']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <Text style={s.btnText}>{t.login_btn}</Text>
                                    <Ionicons name="arrow-forward-circle" size={20} color="rgba(255,255,255,0.85)" style={{ marginLeft: 10 }} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>



                <View style={s.divider}>
                    <View style={s.divLine} /><Text style={s.divText}>PowerPilot v1.0</Text><View style={s.divLine} />
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: W * 0.055, paddingBottom: H * 0.045 },

    accentLine1: { position: 'absolute', width: W * 1.4, height: 1, backgroundColor: 'rgba(30,136,229,0.1)', top: H * 0.37, left: -W * 0.2, transform: [{ rotate: '-16deg' }] },
    accentLine2: { position: 'absolute', width: W * 1.4, height: 1, backgroundColor: 'rgba(30,136,229,0.05)', top: H * 0.41, left: -W * 0.2, transform: [{ rotate: '-16deg' }] },

    // Logo
    logoWrap: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 20 },
    logoRingOuter: {
        width: 108, height: 108, borderRadius: 54,
        borderWidth: 1.5, borderColor: 'rgba(33,150,243,0.25)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    logoRingInner: {
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 1, borderColor: 'rgba(33,150,243,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    logoCircle: {
        width: isSmall ? 65 : 72, height: isSmall ? 65 : 72, borderRadius: isSmall ? 20 : 22,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#1976d2', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    },
    appName: { fontSize: isSmall ? 28 : 33, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
    taglineDash: { width: 18, height: 1, backgroundColor: '#1976d2' },
    tagline: { fontSize: 11, color: '#5b9bd5', fontWeight: '600', letterSpacing: 0.7 },

    // Card
    card: { backgroundColor: 'rgba(8,22,48,0.85)', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(30,136,229,0.15)' },
    cardAccent: { height: 3 },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#e8f4ff', marginTop: 20, marginHorizontal: 20, marginBottom: 3 },
    cardSub: { fontSize: 13, color: '#4a7fa5', marginHorizontal: 20, marginBottom: 16, fontWeight: '500' },

    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,80,80,0.08)', borderRadius: 10, padding: 10, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,80,80,0.2)' },
    errorText: { color: '#ff7070', fontSize: 12, fontWeight: '500', flex: 1 },

    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 14, height: 50, marginHorizontal: 20, marginBottom: 11 },
    inputFocused: { borderColor: '#1976d2', backgroundColor: 'rgba(25,118,210,0.08)' },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: '#c8dff0', fontWeight: '500' },

    forgotRow: { alignSelf: 'flex-end', marginRight: 20, marginBottom: 18, marginTop: 2 },
    forgotText: { color: '#4a90d9', fontSize: 12, fontWeight: '600' },

    btnShadow: { marginHorizontal: 20, borderRadius: 14, shadowColor: '#1976d2', shadowOpacity: 0.55, shadowOffset: { width: 0, height: 6 } },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },


    divider: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 20, marginTop: 16 },
    divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
    divText: { color: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: '600' },
});
