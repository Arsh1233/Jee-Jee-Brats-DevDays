import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Animated, Alert, Modal,
    TouchableWithoutFeedback, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { fetchComplaints, submitComplaint } from '../services/api';
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#f0f4f8', white: '#ffffff', blueDark: '#0d2c54', blue: '#1565c0',
    blueLight: '#e3f2fd', green: '#2e7d32', greenLight: '#e8f5e9',
    red: '#c62828', redLight: '#ffebee', amber: '#f57f17', amberLight: '#fff3e0',
    text: '#1a2332', textSec: '#5a6a7a', muted: '#8e99a4', border: '#e2e8f0',
};

const CATEGORIES = ['Power Cut', 'Billing', 'Meter Fault', 'Street Light', 'Other'];

const STATUS_CONFIG = {
    Pending: { bg: '#fff3e0', border: '#ffcc80', color: '#e65100', icon: 'clock-outline' },
    'In Progress': { bg: '#e3f2fd', border: '#90caf9', color: '#1565c0', icon: 'progress-clock' },
    Resolved: { bg: '#e8f5e9', border: '#a5d6a7', color: '#2e7d32', icon: 'check-circle-outline' },
    Closed: { bg: '#f3e5f5', border: '#ce93d8', color: '#6a1b9a', icon: 'archive-outline' },
};

const CAT_ICONS = {
    'Power Cut': 'lightning-bolt',
    'Billing': 'receipt',
    'Meter Fault': 'gauge',
    'Street Light': 'lightbulb-outline',
    'Other': 'help-circle-outline',
};

// Animated complaint card
function ComplaintCard({ item, index }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(anim, {
            toValue: 1, tension: 60, friction: 8,
            delay: index * 60, useNativeDriver: true,
        }).start();
    }, []);
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
    return (
        <Animated.View style={[styles.card, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={[styles.cardHeader, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <View style={styles.cardHeaderLeft}>
                    <View style={[styles.catIconBox, { backgroundColor: C.blueDark }]}>
                        <MaterialCommunityIcons name={CAT_ICONS[item.category] || 'help-circle-outline'} size={18} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.cardCategory}>{item.category}</Text>
                        <Text style={styles.cardDate}>
                            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardSubject}>{item.subject}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                {item.adminNote && (
                    <View style={styles.adminNote}>
                        <MaterialCommunityIcons name="shield-account-outline" size={13} color={C.blue} />
                        <Text style={styles.adminNoteText}>{item.adminNote}</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

export default function ComplaintsScreen({ route }) {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const userId = route?.params?.userId || 'USR000001';
    const bpNumber = route?.params?.bpNumber || 'BP-1000001';
    const userName = route?.params?.name || 'User';

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [category, setCategory] = useState('Power Cut');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [contact, setContact] = useState('');

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const data = await fetchComplaints(userId);
            setComplaints(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false); setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            Alert.alert('Missing Info', 'Please fill in Subject and Description.');
            return;
        }
        setSubmitting(true);
        try {
            await submitComplaint({ userId, bpNumber, name: userName, category, subject, description, contact });
            setSubject(''); setDescription(''); setContact(''); setCategory('Power Cut');
            setShowForm(false);
            await load();
            Alert.alert('✅ Submitted', t.complaint_success);
        } catch (e) {
            Alert.alert('Error', t.complaint_error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: top + 14 }]}>
                <MenuButton />
                <View style={{ marginTop: 20, flex: 1 }}>
                    <Text style={styles.headerTitle}>{t.complaints_title}</Text>
                    <Text style={styles.headerSub}>{t.complaints_sub}</Text>
                </View>
                <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.newBtnText}>{t.complaint_new}</Text>
                </TouchableOpacity>
            </View>

            {/* Stats pills */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Total', val: complaints.length, color: C.blue },
                    { label: 'Pending', val: complaints.filter(c => c.status === 'Pending').length, color: '#e65100' },
                    { label: 'In Progress', val: complaints.filter(c => c.status === 'In Progress').length, color: C.blue },
                    { label: 'Resolved', val: complaints.filter(c => c.status === 'Resolved').length, color: C.green },
                ].map(s => (
                    <View key={s.label} style={styles.statPill}>
                        <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={C.blue} /></View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => load(true)}
                            colors={[C.blue]}
                            tintColor={C.blue}
                        />
                    }
                >
                    {complaints.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={56} color={C.muted} />
                            <Text style={styles.emptyTitle}>{t.complaint_empty_title}</Text>
                            <Text style={styles.emptyText}>{t.complaint_empty_sub}</Text>
                        </View>
                    ) : (
                        complaints.map((c, i) => <ComplaintCard key={c.id} item={c} index={i} />)
                    )}
                </ScrollView>
            )}

            {/* New Complaint Modal */}
            <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
                <TouchableWithoutFeedback onPress={() => setShowForm(false)}>
                    <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>New Complaint</Text>

                        {/* Category */}
                        <Text style={styles.fieldLabel}>{t.complaint_category}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catPill, category === cat && styles.catPillActive]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <MaterialCommunityIcons
                                        name={CAT_ICONS[cat]}
                                        size={14}
                                        color={category === cat ? '#fff' : C.textSec}
                                    />
                                    <Text style={[styles.catPillText, category === cat && { color: '#fff' }]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Subject */}
                        <Text style={styles.fieldLabel}>{t.complaint_subject} *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Brief issue summary…"
                            placeholderTextColor={C.muted}
                            value={subject}
                            onChangeText={setSubject}
                            maxLength={120}
                        />

                        {/* Description */}
                        <Text style={styles.fieldLabel}>{t.complaint_desc} *</Text>
                        <TextInput
                            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                            placeholder="Describe the issue in detail…"
                            placeholderTextColor={C.muted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={500}
                        />

                        {/* Contact */}
                        <Text style={styles.fieldLabel}>{t.complaint_contact}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Phone or alternate email…"
                            placeholderTextColor={C.muted}
                            value={contact}
                            onChangeText={setContact}
                            keyboardType="email-address"
                        />

                        {/* Buttons */}
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                                <Text style={styles.cancelText}>{t.complaint_cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                                {submitting
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.submitText}>{t.complaint_submit}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: C.blueDark, paddingHorizontal: 20, paddingBottom: 22,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        flexDirection: 'row', alignItems: 'flex-end',
        shadowColor: '#0d2c54', shadowOpacity: 0.25, shadowRadius: 18, elevation: 6,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },
    newBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#1976d2', paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 12, marginBottom: 2,
    },
    newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    statsRow: {
        flexDirection: 'row', marginHorizontal: 16, marginTop: 16,
        backgroundColor: C.white, borderRadius: 14, padding: 12,
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        borderWidth: 1, borderColor: C.border,
    },
    statPill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statVal: { fontSize: 20, fontWeight: '800' },
    statLabel: { color: C.muted, fontSize: 10, fontWeight: '600', marginTop: 2 },

    card: {
        backgroundColor: C.white, borderRadius: 16, marginTop: 12,
        borderWidth: 1, borderColor: C.border,
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    catIconBox: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    cardCategory: { color: C.text, fontSize: 13, fontWeight: '700' },
    cardDate: { color: C.muted, fontSize: 10, marginTop: 1 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
        borderWidth: 1,
    },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardBody: { padding: 14 },
    cardSubject: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 6 },
    cardDesc: { color: C.textSec, fontSize: 13, lineHeight: 19 },
    adminNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6,
        marginTop: 10, backgroundColor: '#e3f2fd', borderRadius: 8,
        padding: 10, borderLeftWidth: 3, borderLeftColor: C.blue,
    },
    adminNoteText: { color: C.blue, fontSize: 12, flex: 1, lineHeight: 17 },

    emptyState: { alignItems: 'center', marginTop: 80, gap: 8 },
    emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700', marginTop: 8 },
    emptyText: { color: C.muted, fontSize: 13 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(10,20,40,0.5)' },
    modalWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    modalContent: {
        backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: C.border,
        alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 20 },
    fieldLabel: { color: C.textSec, fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
    input: {
        backgroundColor: '#f7f9fc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 16,
    },
    catPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
        backgroundColor: '#f7f9fc', borderWidth: 1, borderColor: C.border, marginRight: 8,
    },
    catPillActive: { backgroundColor: C.blue, borderColor: C.blue },
    catPillText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#f7f9fc', alignItems: 'center', borderWidth: 1, borderColor: C.border,
    },
    cancelText: { color: C.textSec, fontSize: 14, fontWeight: '700' },
    submitBtn: {
        flex: 2, paddingVertical: 14, borderRadius: 12,
        backgroundColor: C.blue, alignItems: 'center',
        shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
