import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
    TouchableOpacity, Modal, Share, Animated, Easing, Dimensions, Platform,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchEnvironment } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#edf2f7', white: '#ffffff', blueDark: '#0b2a52', blue: '#1a66d9',
    blueLight: '#e6f0ff', green: '#2e7d32', greenLight: '#e8f5e9',
    text: '#1a2332', textSec: '#5a6a7a', muted: '#8a97a6', border: '#dfe7ef',
};

const TREE_PER_CO2 = 1.81; // 1 tree absorbs ~21.77 kg CO₂/yr → 1.81 kg/month
const BADGE_LEVELS = [
    { minTrees: 55, icon: '🌍', label: 'Planet Guardian', color: '#f57f17', bg: '#fff8e1', desc: '55+ trees/mo · Elite eco-warrior!' },
    { minTrees: 27, icon: '🏆', label: 'Forest Champion', color: '#1b5e20', bg: '#e8f5e9', desc: '27+ trees/mo · Incredible impact!' },
    { minTrees: 11, icon: '🌳', label: 'Grove Protector', color: '#2e7d32', bg: '#f1f8e9', desc: '11+ trees/mo · Great commitment!' },
    { minTrees: 3, icon: '🌿', label: 'Eco Gardener', color: '#00897b', bg: '#e0f2f1', desc: '3+ trees/mo · Growing stronger!' },
    { minTrees: 1, icon: '🌱', label: 'Seedling Saver', color: '#43a047', bg: '#f9fbe7', desc: '1+ tree/mo · Every tree counts!' },
];

const { width: SW, height: SH } = Dimensions.get('window');

// ── Story Share Modal ─────────────────────────────────────────────────────────
function StoryModal({ badge, treesSaved, onClose, autoShare = false }) {
    const progress = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const cardRef = useRef(null);

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        Animated.timing(progress, {
            toValue: SW - 32, duration: 6000, easing: Easing.linear, useNativeDriver: false,
        }).start(() => onClose());

        if (autoShare) {
            const t = setTimeout(() => captureAndShare(), 500);
            return () => clearTimeout(t);
        }
    }, []);

    const captureAndShare = async () => {
        try {
            const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Share ${badge.label} Badge` });
            } else {
                await Share.share({ url: uri, message: `I earned the ${badge.icon} ${badge.label} badge on PowerPilot!` });
            }
        } catch (e) { console.error('capture error', e); }
        finally { onClose(); }
    };

    return (
        <Modal transparent animationType="none" onRequestClose={onClose}>
            <View style={story.overlay}>
                <Animated.View ref={cardRef} style={[story.card, { opacity, transform: [{ scale }] }]}>
                    <View style={[story.gradBg, { backgroundColor: badge.color }]}>
                        <View style={story.gradOverlay} />
                    </View>

                    {/* Progress bar */}
                    <View style={story.progressTrack}>
                        <Animated.View style={[story.progressFill, { width: progress }]} />
                    </View>

                    {/* Close */}
                    <TouchableOpacity style={story.closeBtn} onPress={onClose}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>✕</Text>
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={story.content}>
                        <View style={[story.glowOrb, { backgroundColor: badge.color }]} />
                        <Text style={story.badgeIcon}>{badge.icon}</Text>
                        <View style={story.achievedPill}>
                            <Text style={story.achievedPillText}>✦ Achievement Unlocked</Text>
                        </View>
                        <Text style={story.badgeTitle}>{badge.label}</Text>
                        <View style={story.infoBox}>
                            <Text style={story.infoTreeCount}>{treesSaved.toFixed(1)} trees/month</Text>
                            <Text style={story.infoBoxSub}>{badge.desc}</Text>
                        </View>
                        <Text style={story.poweredBy}>PowerPilot · Smart Energy Management</Text>
                    </View>
                </Animated.View>

                {/* Share button OUTSIDE the captured area */}
                <TouchableOpacity style={story.shareBtn} onPress={captureAndShare} activeOpacity={0.85}>
                    <Text style={story.shareBtnText}>Save &amp; Share as Image</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const story = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center', justifyContent: 'center', padding: 16,
    },
    card: {
        width: SW - 32, height: Math.min(SH * 0.72, 500),
        borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    },
    gradBg: { ...StyleSheet.absoluteFillObject },
    gradOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
    progressTrack: {
        position: 'absolute', top: 16, left: 16, right: 16,
        height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden',
    },
    progressFill: { height: 3, backgroundColor: '#fff', borderRadius: 4 },
    closeBtn: {
        position: 'absolute', top: 28, right: 14, zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20,
        width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    },
    content: { alignItems: 'center', paddingHorizontal: 28, zIndex: 2 },
    glowOrb: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        opacity: 0.2, top: -80, alignSelf: 'center',
    },
    badgeIcon: {
        fontSize: 88, marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12
    },
    achievedPill: {
        backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 5, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)', marginBottom: 12,
    },
    achievedPillText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
    badgeTitle: {
        color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center',
        marginBottom: 16, letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
    },
    infoBox: {
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16,
        paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)', width: '100%', alignItems: 'center',
    },
    infoTreeCount: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
    infoBoxSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    poweredBy: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 14, fontWeight: '600' },
    shareBtn: {
        marginTop: 16, backgroundColor: '#fff', borderRadius: 16,
        paddingVertical: 14, paddingHorizontal: 32,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
        width: SW - 32,
    },
    shareBtnText: { color: '#1a1a1a', fontSize: 15, fontWeight: '800' },
});

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, isEarned, onPress, onShare }) {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isEarned) return;
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.04, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, [isEarned]);

    if (!isEarned) {
        return (
            <View style={[bStyles.card, bStyles.locked]}>
                <Text style={{ fontSize: 26, opacity: 0.4 }}>{badge.icon}</Text>
                <View style={bStyles.lockBadge}><Text style={bStyles.lockIcon}>🔒</Text></View>
                <Text style={bStyles.lockedLabel}>{badge.label}</Text>
                <Text style={bStyles.lockedReq}>{badge.minTrees}+ trees/mo</Text>
            </View>
        );
    }

    return (
        <View>
            <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
                <Animated.View style={[
                    bStyles.card, bStyles.earned,
                    { backgroundColor: badge.bg, borderColor: badge.color + '66', transform: [{ scale: pulse }] }
                ]}>
                    <View style={[bStyles.shine, { backgroundColor: badge.color + '18' }]} />
                    <Text style={bStyles.icon}>{badge.icon}</Text>
                    <Text style={[bStyles.label, { color: badge.color }]}>{badge.label}</Text>
                    <Text style={bStyles.sub}>{badge.minTrees}+ trees/mo</Text>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const bStyles = StyleSheet.create({
    card: {
        borderRadius: 20, borderWidth: 1.5, padding: 14,
        alignItems: 'center', minWidth: 110, flex: 1, overflow: 'hidden',
    },
    locked: {
        backgroundColor: '#f4f6f9', borderColor: '#e2e8f0',
        opacity: 0.65, position: 'relative',
    },
    earned: {
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    },
    shine: {
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
    },
    icon: { fontSize: 34, marginBottom: 8, zIndex: 1 },
    label: { fontSize: 12, fontWeight: '800', textAlign: 'center', zIndex: 1, marginBottom: 2 },
    sub: { color: '#8a97a6', fontSize: 10, fontWeight: '600', textAlign: 'center', zIndex: 1 },
    lockBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#e2e8f0', borderRadius: 10, padding: 2 },
    lockIcon: { fontSize: 10 },
    lockedLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textAlign: 'center' },
    lockedReq: { color: '#b0bec5', fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 2 },
    shareRow: {
        borderRadius: 10, borderWidth: 1, paddingVertical: 7,
        alignItems: 'center', marginTop: 4,
    },
    shareRowText: { fontSize: 11, fontWeight: '800' },
});

// ── Badges Section ────────────────────────────────────────────────────────────
function BadgesSection({ co2Saved }) {
    const treesSaved = co2Saved / TREE_PER_CO2;
    const earned = BADGE_LEVELS.filter(b => treesSaved >= b.minTrees);
    const top = earned[0];
    const next = [...BADGE_LEVELS].reverse().find(b => treesSaved < b.minTrees);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [autoShare, setAutoShare] = useState(false);

    const openPreview = (b) => { setAutoShare(false); setSelectedBadge(b); };
    const openShare = (b) => { setAutoShare(true); setSelectedBadge(b); };

    return (
        <View style={badgeStyle.container}>
            {selectedBadge && (
                <StoryModal
                    badge={selectedBadge}
                    treesSaved={treesSaved}
                    onClose={() => setSelectedBadge(null)}
                    autoShare={autoShare}
                />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={badgeStyle.sectionTitle}>🌳 Tree Achievement Badges</Text>
                <View style={badgeStyle.treesCount}>
                    <Text style={badgeStyle.treesCountText}>{treesSaved.toFixed(1)} 🌳/mo</Text>
                </View>
            </View>
            <Text style={badgeStyle.sectionSub}>Tap a badge to preview · Tap 📸 to share as image</Text>

            {/* Top badge banner */}
            <TouchableOpacity
                onPress={() => top && openPreview(top)}
                activeOpacity={top ? 0.85 : 1}
                style={[badgeStyle.topBadge, {
                    backgroundColor: top ? top.bg : '#f7f9fc',
                    borderColor: top ? top.color + '66' : '#dfe7ef',
                }]}
            >
                <Text style={{ fontSize: 36 }}>{top ? top.icon : '🔒'}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: top ? top.color : '#8a97a6', fontWeight: '900', fontSize: 13 }} numberOfLines={1}>🏅 Highest Achievement</Text>
                    {/* Badge name pill — highlighted like home page */}
                    <View style={{
                        alignSelf: 'flex-start', marginTop: 4,
                        backgroundColor: top ? top.color + '22' : '#e8ecf2',
                        borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3,
                        borderWidth: 1, borderColor: top ? top.color + '55' : '#dfe7ef',
                    }}>
                        <Text style={{
                            color: top ? top.color : '#8a97a6', fontWeight: '800', fontSize: 12,
                        }}>{top ? `${top.icon} ${top.label}` : 'No Badge Yet'}</Text>
                    </View>
                    <Text style={{ color: '#5a6a7a', fontSize: 11, marginTop: 4 }} numberOfLines={2}>{top ? top.desc : 'Save CO₂ to earn your first badge!'}</Text>
                </View>
                {top && (
                    <TouchableOpacity
                        onPress={() => openShare(top)}
                        style={[badgeStyle.topShareBtn, { backgroundColor: top.color + '22', borderColor: top.color + '55' }]}
                    >
                        <Text style={{ color: top.color, fontSize: 18, fontWeight: '800' }}>↑</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* Badge cards grid */}
            <View style={badgeStyle.grid}>
                {BADGE_LEVELS.map((b) => (
                    <View key={b.label} style={{ width: '47%' }}>
                        <BadgeCard
                            badge={b}
                            isEarned={treesSaved >= b.minTrees}
                            onPress={() => openPreview(b)}
                            onShare={() => openShare(b)}
                        />
                    </View>
                ))}
            </View>

            {/* Tier ladder */}
            <View style={badgeStyle.ladder}>
                {BADGE_LEVELS.map((b, i) => {
                    const isEarned = treesSaved >= b.minTrees;
                    return (
                        <View key={b.label} style={[
                            badgeStyle.ladderRow,
                            i < BADGE_LEVELS.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#eef2f7' }
                        ]}>
                            <Text style={{ fontSize: 22, opacity: isEarned ? 1 : 0.3 }}>{b.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[badgeStyle.ladderLabel, { color: isEarned ? b.color : '#8a97a6' }]}>{b.label}</Text>
                                <Text style={badgeStyle.ladderSub}>{b.minTrees}+ trees/month</Text>
                            </View>
                            {isEarned ? (
                                <View style={[badgeStyle.earnedPill, { backgroundColor: b.color + '22', borderColor: b.color + '55' }]}>
                                    <Text style={[badgeStyle.earnedText, { color: b.color }]}>✓ Earned</Text>
                                </View>
                            ) : (
                                <Text style={badgeStyle.lockText}>🔒 {(b.minTrees - treesSaved).toFixed(1)} more</Text>
                            )}
                        </View>
                    );
                })}
            </View>

            {next && (
                <View style={badgeStyle.nextBadge}>
                    <Text style={badgeStyle.nextText}>
                        🎯 Next: {next.icon} {next.label} — need {next.minTrees} trees/mo ({(next.minTrees - treesSaved).toFixed(1)} more!)
                    </Text>
                </View>
            )}
        </View>
    );
}

const badgeStyle = StyleSheet.create({
    container: {
        marginHorizontal: 20, marginTop: 20, backgroundColor: '#fff', borderRadius: 18,
        padding: 20, borderWidth: 1, borderColor: '#dfe7ef',
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    },
    sectionTitle: { color: '#1a2332', fontSize: 15, fontWeight: '800', marginBottom: 0, flex: 1 },
    sectionSub: { color: '#8a97a6', fontSize: 12, marginBottom: 14 },
    treesCount: { backgroundColor: '#e8f5e9', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#a5d6a7' },
    treesCountText: { color: '#2e7d32', fontSize: 12, fontWeight: '800' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    topShareBtn: {
        padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    topBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 14,
    },
    ladder: { borderRadius: 12, borderWidth: 1, borderColor: '#eef2f7', overflow: 'hidden', marginBottom: 14 },
    ladderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 10, backgroundColor: '#fafcff' },
    ladderLabel: { fontSize: 13, fontWeight: '700' },
    ladderSub: { color: '#8a97a6', fontSize: 10, marginTop: 2 },
    earnedPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
    earnedText: { fontSize: 11, fontWeight: '700' },
    lockText: { color: '#8a97a6', fontSize: 11, fontWeight: '600' },
    nextBadge: {
        marginTop: 12, backgroundColor: '#f7f9fc', borderRadius: 10,
        padding: 12, borderWidth: 1, borderColor: '#dfe7ef',
    },
    nextText: { color: '#5a6a7a', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});



export default function CarbonScreen() {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [liveCarbon, setLiveCarbon] = useState(0);
    const [headerModal, setHeaderModal] = useState(null); // badge opened from header

    async function load(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(false);
        try {
            const userId = await AsyncStorage.getItem('userId') ?? '';
            const d = await fetchEnvironment(userId);
            setData(d);
            setLiveCarbon(d.carbonSavedKg ?? 0);
        } catch (e) {
            console.error('Environment:', e);
            setError(true);
        }
        finally { setLoading(false); setRefreshing(false); }
    }

    useEffect(() => {
        load();
        // Simulate live carbon savings tick
        const interval = setInterval(() => {
            setLiveCarbon(prev => +(prev + 0.0001).toFixed(4));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={C.green} /></View>;
    }

    if (error || !data) {
        return (
            <View style={[styles.container, styles.center]}>
                <View style={[styles.header, { paddingTop: top + 14, width: '100%' }]}>
                    <MenuButton />
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>{t.environment_title}</Text>
                        <Text style={styles.headerSub}>{t.environment_sub}</Text>
                    </View>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 48 }}>📡</Text>
                    <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Could not reach server</Text>
                    <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>Make sure the backend is running and your phone is on the same WiFi.</Text>
                    <TouchableOpacity
                        onPress={() => load()}
                        style={{ backgroundColor: C.green, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>↺ Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const offsetPercent = ((liveCarbon / data.carbonFootprintKg) * 100).toFixed(0);
    const treesSavedNow = liveCarbon / TREE_PER_CO2;
    const topBadge = BADGE_LEVELS.find(b => treesSavedNow >= b.minTrees);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 90 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => load(true)}
                    colors={['#2e7d32']}
                    tintColor="#2e7d32"
                />
            }
        >
            {/* ── Header ──────────────────────────────────── */}

            <View style={[styles.header, { paddingTop: top + 14 }]}>
                <MenuButton />
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t.environment_title}</Text>
                    <Text style={styles.headerSub}>{t.environment_sub}</Text>
                </View>
                {/* Highest badge pill in header — tappable → opens story modal */}
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {topBadge ? (
                        <TouchableOpacity
                            onPress={() => setHeaderModal(topBadge)}
                            activeOpacity={0.75}
                            style={[styles.headerBadgePill, { backgroundColor: topBadge.color + '33', borderColor: topBadge.color + '88' }]}
                        >
                            <Text style={styles.headerBadgePillText}>{topBadge.icon} {topBadge.label} ↗</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.headerBadgePill, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}>
                            <Text style={styles.headerBadgePillText}>🔒 No Badge Yet</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Screen-level modal for header badge tap */}
            {headerModal && (
                <StoryModal
                    badge={headerModal}
                    treesSaved={treesSavedNow}
                    onClose={() => setHeaderModal(null)}
                    autoShare={false}
                />
            )}

            {/* ── Hero: Trees Saved ───────────────────────── */}
            <View style={styles.heroCard}>
                <View style={styles.heroTreeCircle}>
                    <MaterialCommunityIcons name="tree" size={36} color={C.green} />
                </View>
                <Text style={styles.heroValue}>{data.treesSavedMonthly}</Text>
                <Text style={styles.heroLabel}>Trees Saved This Month</Text>
                <View style={styles.heroDivider} />
                <View style={styles.heroSubRow}>
                    <View style={styles.heroSubCol}>
                        <Text style={styles.heroSubValue}>{data.treesSavedYearly}</Text>
                        <Text style={styles.heroSubLabel}>Trees / Year</Text>
                    </View>
                    <View style={styles.heroSubDivider} />
                    <View style={styles.heroSubCol}>
                        <Text style={styles.heroSubValue}>{liveCarbon.toFixed(2)} kg</Text>
                        <Text style={styles.heroSubLabel}>CO₂ Saved / Mo</Text>
                    </View>
                </View>
            </View>

            {/* ── Impact Meter ────────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🌱 Carbon Offset</Text>
                <View style={styles.meterContainer}>
                    <View style={styles.meterLabelRow}>
                        <Text style={styles.meterText}>0%</Text>
                        <Text style={[styles.meterText, { fontWeight: '700', color: C.green }]}>{offsetPercent}%</Text>
                        <Text style={styles.meterText}>100%</Text>
                    </View>
                    <View style={styles.meterTrack}>
                        <View style={[styles.meterFill, { width: `${Math.min(offsetPercent, 100)}%` }]}>
                            <View style={styles.meterThumb} />
                        </View>
                    </View>
                    <Text style={styles.meterCaption}>
                        Offsetting {offsetPercent}% of your {data.carbonFootprintKg} kg monthly footprint
                    </Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <MaterialCommunityIcons name="leaf" size={24} color={C.green} style={{ marginBottom: 8 }} />
                    <Text style={styles.statValue}>{liveCarbon.toFixed(2)} kg</Text>
                    <Text style={styles.statLabel}>CO₂ Reduced</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialCommunityIcons name="car-off" size={24} color={C.blue} style={{ marginBottom: 8 }} />
                    <Text style={styles.statValue}>{data.carKmEquivalent} km</Text>
                    <Text style={styles.statLabel}>Car Travel Saved</Text>
                </View>
            </View>

            {/* ── Did You Know? ──────────────────────────────── */}
            <Text style={styles.sectionTitle}>💡 Did You Know?</Text>
            <View style={[styles.card, { backgroundColor: '#fffde7', borderColor: '#ffd54f', borderWidth: 1.5 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Text style={{ fontSize: 28 }}>⚡</Text>
                    <Text style={[styles.eqText, { flex: 1 }]}>
                        India's power sector emits <Text style={{ fontWeight: '800', color: '#e65100' }}>
                            ~0.82 kg of CO₂</Text> per kWh generated — one of the highest in Asia due to coal dependence.
                        Every kWh you save prevents nearly a kilogram of greenhouse gas from entering the atmosphere.
                    </Text>
                </View>
            </View>

            {/* ── Green Tips ─────────────────────────────────── */}
            <Text style={styles.sectionTitle}>🌿 Green Energy Tips</Text>
            {
                [
                    {
                        icon: 'clock-time-eight-outline',
                        color: '#1565c0',
                        bg: '#e3f2fd',
                        title: 'Shift to Off-Peak Hours',
                        desc: 'Run heavy appliances like washing machines and geysers between 10 PM – 6 AM when grid demand is low and tariffs are cheapest.',
                    },
                    {
                        icon: 'thermometer-low',
                        color: '#2e7d32',
                        bg: '#e8f5e9',
                        title: 'Set AC to 24°C',
                        desc: 'Each degree increase in AC temperature saves ~6% electricity. 24°C is WHO-recommended for comfort and efficiency.',
                    },
                    {
                        icon: 'power-standby',
                        color: '#c62828',
                        bg: '#ffebee',
                        title: 'Eliminate Standby Power',
                        desc: 'Devices in standby mode can consume up to 10% of your total bill. Switch off at the socket when not in use.',
                    },
                    {
                        icon: 'led-on',
                        color: '#e65100',
                        bg: '#fff3e0',
                        title: 'Switch to LED Lighting',
                        desc: 'LED bulbs use 75% less energy than incandescent bulbs and last 25× longer — an easy upgrade with instant savings.',
                    },
                    {
                        icon: 'solar-panel',
                        color: '#f57f17',
                        bg: '#fffde7',
                        title: 'Consider Rooftop Solar',
                        desc: 'India\'s PM Surya Ghar scheme offers subsidised rooftop solar for residential consumers. A 3 kW system can offset ₹1,500–2,000/month.',
                    },
                ].map((tip, i) => (
                    <View key={i} style={styles.eqRow}>
                        <View style={[styles.eqIconBox, { backgroundColor: tip.bg }]}>
                            <MaterialCommunityIcons name={tip.icon} size={20} color={tip.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: C.text, fontWeight: '700', fontSize: 13, marginBottom: 2 }}>{tip.title}</Text>
                            <Text style={[styles.eqText, { marginBottom: 0 }]}>{tip.desc}</Text>
                        </View>
                    </View>
                ))
            }

            {/* ── Climate Urgency Banner ─────────────────────── */}
            <View style={[styles.card, { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7', borderWidth: 1.5, marginTop: 8 }]}>
                <Text style={{ color: C.green, fontWeight: '800', fontSize: 15, marginBottom: 8 }}>🌍 Why This Matters</Text>
                <Text style={[styles.eqText, { lineHeight: 22, marginBottom: 8 }]}>
                    The <Text style={{ fontWeight: '800' }}>IPCC AR6 Report</Text> warns that the world must reduce carbon emissions by <Text style={{ fontWeight: '800', color: C.green }}>43% by 2030</Text> to limit global warming to 1.5°C. Household electricity accounts for <Text style={{ fontWeight: '800' }}>~25%</Text> of India's total energy consumption.
                </Text>
                <Text style={[styles.eqText, { lineHeight: 22 }]}>
                    Small changes in daily energy habits — spread across crores of homes — can collectively prevent millions of tonnes of CO₂ emissions every year. <Text style={{ fontWeight: '800', color: C.green }}>Your actions count.</Text>
                </Text>
            </View>

            {/* ── Green Pledge Card ──────────────────────────── */}
            <View style={[styles.card, { backgroundColor: '#1b5e20', marginBottom: 12 }]}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, textAlign: 'center', marginBottom: 6 }}>🌱 Take the Green Pledge</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    "I pledge to reduce my electricity consumption by 10% this month by shifting usage to off-peak hours, eliminating standby waste, and using the PowerPilot AI Optimizer."
                </Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, marginTop: 12 }}>
                    <Text style={{ color: '#a5d6a7', fontSize: 11, textAlign: 'center', fontWeight: '600' }}>
                        🌳 If every PowerPilot user saves 10%, together we offset{'\n'}
                        <Text style={{ color: '#fff', fontWeight: '800' }}>100,000+ kg of CO₂ every month</Text>
                    </Text>
                </View>
            </View>

            {/* ── CO₂ Achievement Badges ────────────────────── */}
            <BadgesSection co2Saved={liveCarbon} />

        </ScrollView >
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: '#1b5e20', paddingHorizontal: 20, paddingBottom: 22,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#1b5e20', shadowOpacity: 0.25, shadowRadius: 18, elevation: 6,
    },
    headerContent: { flex: 1, marginLeft: 12 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
    headerBadgePill: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        borderWidth: 1,
    },
    headerBadgePillText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // Hero
    heroCard: {
        marginHorizontal: 20, marginTop: 16, backgroundColor: C.white, borderRadius: 18,
        padding: 28, alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 }, elevation: 4
    },
    heroTreeCircle: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: C.greenLight,
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
        borderWidth: 3, borderColor: '#a5d6a7'
    },
    // heroTreeEmoji: { fontSize: 36 }, // Removed
    heroValue: { color: C.green, fontSize: 48, fontWeight: '900', letterSpacing: -2 },
    heroLabel: { color: C.textSec, fontSize: 14, fontWeight: '600', marginTop: 2 },
    heroDivider: { height: 1, backgroundColor: C.border, alignSelf: 'stretch', marginVertical: 18 },
    heroSubRow: { flexDirection: 'row', alignSelf: 'stretch' },
    heroSubCol: { flex: 1, alignItems: 'center' },
    heroSubValue: { color: C.text, fontSize: 18, fontWeight: '800' },
    heroSubLabel: { color: C.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    heroSubDivider: { width: 1, backgroundColor: C.border },

    // Impact Meter
    card: {
        marginHorizontal: 20, marginTop: 20, backgroundColor: C.white, borderRadius: 18,
        padding: 20, marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, elevation: 3
    },
    cardTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 16 },
    meterContainer: { marginTop: 4 },
    meterTrack: { height: 14, backgroundColor: '#e8f5e9', borderRadius: 8, overflow: 'hidden', marginVertical: 8 },
    meterFill: { height: '100%', backgroundColor: C.green, borderRadius: 8, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    meterThumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', borderWidth: 2, borderColor: C.green },
    meterLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    meterText: { color: C.muted, fontSize: 11, fontWeight: '600' },
    meterCaption: { color: C.textSec, fontSize: 12, textAlign: 'center', marginTop: 6 },

    // Stats Grid
    statsGrid: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 24, paddingHorizontal: 20 },
    statCard: {
        flex: 1, backgroundColor: C.white, borderRadius: 18, padding: 20,
        alignItems: 'center', borderWidth: 1, borderColor: C.border,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, elevation: 3
    },
    // statIcon: { fontSize: 24, marginBottom: 8 }, // Removed
    statValue: { color: C.text, fontSize: 16, fontWeight: '800' },
    statLabel: { color: C.textSec, fontSize: 11, marginTop: 2, textAlign: 'center' },

    // Equivalencies
    sectionTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 16, marginHorizontal: 20 },
    eqRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14, marginHorizontal: 20 },
    eqIconBox: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff8e1',
        justifyContent: 'center', alignItems: 'center'
    },
    // eqIcon: { fontSize: 20 }, // Removed
    eqText: { color: C.textSec, fontSize: 14, lineHeight: 20 },
});
