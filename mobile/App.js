import React, { useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
    TouchableWithoutFeedback, Modal, ScrollView, Easing, Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AppliancesScreen from './src/screens/AppliancesScreen';
import OptimizerScreen from './src/screens/OptimizerScreen';
import SavingsScreen from './src/screens/SavingsScreen';
import CarbonScreen from './src/screens/CarbonScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import BillHistoryScreen from './src/screens/BillHistoryScreen';
import ConsumptionScreen from './src/screens/ConsumptionScreen';
import LiveDevicesScreen from './src/screens/LiveDevicesScreen';
import ComplaintsScreen from './src/screens/ComplaintsScreen';
import ServiceMapScreen from './src/screens/ServiceMapScreen';
import VoiceAssistantScreen from './src/screens/VoiceAssistantScreen';
import AIInsightsScreen from './src/screens/AIInsightsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = 280;



const SCREENS = [
    { key: 'nav_home', name: 'Home', icon: 'home-outline', component: DashboardScreen },
    { key: 'nav_bills', name: 'BillHistory', icon: 'document-text-outline', component: BillHistoryScreen },
    { key: 'nav_consumption', name: 'Consumption', icon: 'analytics-outline', component: ConsumptionScreen },
    { key: 'nav_devices', name: 'Devices', icon: 'power-outline', component: LiveDevicesScreen },

    { key: 'nav_optimizer', name: 'Optimizer', icon: 'flash-outline', component: OptimizerScreen },
    { key: 'nav_savings', name: 'Savings', icon: 'wallet-outline', component: SavingsScreen },
    { key: 'nav_environment', name: 'Environment', icon: 'leaf-outline', component: CarbonScreen },
    { key: 'nav_notifications', name: 'Notifications', icon: 'notifications-outline', component: NotificationsScreen },
    { key: 'nav_complaints', name: 'Complaints', icon: 'clipboard-outline', component: ComplaintsScreen },
    { key: 'nav_servicemap', name: 'ServiceMap', icon: 'map-outline', component: ServiceMapScreen },
    { key: 'nav_voiceai', name: 'VoiceAssistant', icon: 'mic-outline', component: VoiceAssistantScreen },
    { key: 'nav_aiengine', name: 'AIInsights', icon: 'hardware-chip-outline', component: AIInsightsScreen },
    { key: 'nav_profile', name: 'Profile', icon: 'person-outline', component: ProfileScreen },
];


// ── Drawer / App Context ───────────────────────────────
import { DrawerContext } from './src/contexts/DrawerContext';

// ── Language Picker Modal ──────────────────────────────
function LangModal({ visible, onClose }) {
    const { lang, setLang, t } = useLanguage();
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={s.langOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={s.langBox}>
                            <Text style={s.langTitle}>{t.langToggleTitle}</Text>
                            {[
                                { code: 'en', label: t.langEn, flag: '🇬🇧' },
                                { code: 'hi', label: t.langHi, flag: '🇮🇳' },
                            ].map(opt => (
                                <TouchableOpacity
                                    key={opt.code}
                                    style={[s.langOption, lang === opt.code && s.langOptionActive]}
                                    onPress={() => { setLang(opt.code); onClose(); }}
                                >
                                    <Text style={s.langFlag}>{opt.flag}</Text>
                                    <Text style={[s.langLabel, lang === opt.code && { color: '#1565c0', fontWeight: '800' }]}>
                                        {opt.label}
                                    </Text>
                                    {lang === opt.code && (
                                        <Ionicons name="checkmark-circle" size={20} color="#1565c0" style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

// ── Main App Shell ─────────────────────────────────────
function AppShell() {
    const { t, lang } = useLanguage();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const slideAnim = useRef(new Animated.Value(-DRAWER_W)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const fabPulse = useRef(new Animated.Value(1)).current;

    // Gentle pulse animation for the FAB
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(fabPulse, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(fabPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const navRef = useRef(null);

    const handleLogin = (user) => { setCurrentUser(user); setIsAuthenticated(true); };

    const openDrawer = () => {
        setIsOpen(true);
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    const closeDrawer = () => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: -DRAWER_W, duration: 200, useNativeDriver: true }),
            Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setIsOpen(false));
    };

    const navigateTo = (name) => {
        closeDrawer();
        setTimeout(() => navRef.current?.navigate(name), 220);
    };

    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <DrawerContext.Provider value={{ open: openDrawer }}>
            <StatusBar style="light" />
            <NavigationContainer ref={navRef}>
                <View style={{ flex: 1 }}>
                    {/* ── Main Tab Navigator ───────────────────── */}
                    <Tab.Navigator
                        screenOptions={{
                            headerShown: false,
                            tabBarStyle: { display: 'none' },
                        }}
                    >
                        {SCREENS.map(s => (
                            <Tab.Screen
                                key={s.name}
                                name={s.name}
                                component={s.component}
                                initialParams={s.name === 'Devices' ? { userId: currentUser?.userId ?? 'USR000001' } : undefined}
                            />
                        ))}
                    </Tab.Navigator>

                    {/* ── Floating Voice Assistant Button ──────── */}
                    <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabPulse }] }]}>
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => setShowVoiceModal(true)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="mic" size={26} color="#fff" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── Overlay ──────────────────────────────── */}
                    {isOpen && (
                        <TouchableWithoutFeedback onPress={closeDrawer}>
                            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
                        </TouchableWithoutFeedback>
                    )}

                    {/* ── Sidebar Drawer ───────────────────────── */}
                    {isOpen && (
                        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                            {/* Brand */}
                            <View style={styles.drawerHeader}>
                                <View style={styles.brandIcon}>
                                    <Ionicons name="flash" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.brandName}>{t.appName}</Text>
                                    <Text style={styles.brandSub}>{t.appSub}</Text>
                                </View>
                            </View>

                            {/* Nav Items */}
                            <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
                                {SCREENS.map(scr => (
                                    <TouchableOpacity
                                        key={scr.name}
                                        style={styles.navItem}
                                        onPress={() => navigateTo(scr.name)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name={scr.icon} size={22} color="rgba(255,255,255,0.7)" />
                                        <Text style={styles.navLabel}>{t[scr.key]}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.drawerFooter}>
                                <TouchableOpacity style={styles.footerItem} onPress={() => setShowLangModal(true)}>
                                    <Ionicons name="language-outline" size={18} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.footerText}>{t.language}</Text>
                                    <View style={styles.langBadge}>
                                        <Text style={styles.langBadgeText}>{lang === 'en' ? '🇬🇧 EN' : '🇮🇳 HI'}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.footerItem} onPress={() => { }}>
                                    <Ionicons name="help-circle-outline" size={18} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.footerText}>{t.help}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.footerItem} onPress={() => { closeDrawer(); setTimeout(() => setIsAuthenticated(false), 300); }}>
                                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                                    <Text style={[styles.footerText, { color: '#ef4444' }]}>{t.logout}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </NavigationContainer>

            {/* ── Language Modal (outside nav) ─────────────── */}
            <LangModal visible={showLangModal} onClose={() => setShowLangModal(false)} />

            {/* ── Voice Assistant Modal ─────────────────────── */}
            <Modal
                visible={showVoiceModal}
                animationType="slide"
                onRequestClose={() => setShowVoiceModal(false)}
            >
                <View style={{ flex: 1 }}>
                    <VoiceAssistantScreen />
                    <TouchableOpacity
                        style={styles.voiceCloseBtn}
                        onPress={() => setShowVoiceModal(false)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </DrawerContext.Provider>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <LanguageProvider>
                <AppShell />
            </LanguageProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 10,
    },
    drawer: {
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: DRAWER_W, backgroundColor: '#0b2a52',
        zIndex: 20,
        borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24,
        shadowOffset: { width: 6, height: 0 }, elevation: 32,
    },
    drawerHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 22, paddingTop: 60, paddingBottom: 28,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    brandIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(66,165,245,0.25)',
        justifyContent: 'center', alignItems: 'center',
    },
    brandName: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    brandSub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    navList: { flex: 1, paddingTop: 14, paddingHorizontal: 12 },
    navItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10,
        marginBottom: 2, backgroundColor: 'rgba(255,255,255,0.04)',
    },
    navLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
    drawerFooter: {
        paddingHorizontal: 24, paddingVertical: 20,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        gap: 16,
    },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
    langBadge: {
        marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    },
    langBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    // Floating Voice Assistant Button
    fabWrap: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        zIndex: 9,
    },
    fab: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#1565c0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1565c0',
        shadowOpacity: 0.45,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    voiceCloseBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 36,
        right: 18,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
});

const s = StyleSheet.create({
    langOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    langBox: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24,
        width: 300, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
    },
    langTitle: { fontSize: 17, fontWeight: '800', color: '#132340', marginBottom: 18, textAlign: 'center' },
    langOption: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#dce6f0', marginBottom: 10,
    },
    langOptionActive: { borderColor: '#1565c0', backgroundColor: '#e8f0fe' },
    langFlag: { fontSize: 24 },
    langLabel: { fontSize: 16, fontWeight: '600', color: '#132340' },
});
