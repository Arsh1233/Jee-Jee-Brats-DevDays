import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Safe import — expo-image-picker needs a dev build; gracefully degrade in Expo Go
let ImagePicker = null;
try { ImagePicker = require('expo-image-picker'); } catch { }
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuButton from '../components/MenuButton';
import { API_BASE } from '../services/api';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#f0f4f8', card: '#ffffff', accent: '#1565c0', accentLight: '#e3f0ff',
    text: '#132340', sub: '#5c7a9a', green: '#2e7d32', greenLight: '#e8f5e9',
    red: '#c62828', border: '#dce6f0', headerBg: '#0b2a52',
    gold: '#f59e0b', goldLight: '#fef3c7',
};

const FIELDS = [
    { key: 'name', label: 'Full Name', icon: 'person-outline', keyboard: 'default' },
    { key: 'email', label: 'Email Address', icon: 'mail-outline', keyboard: 'email-address' },
    { key: 'phone', label: 'Phone Number', icon: 'call-outline', keyboard: 'phone-pad' },
    { key: 'city', label: 'City / Location', icon: 'location-outline', keyboard: 'default' },
    { key: 'address', label: 'Full Address', icon: 'home-outline', keyboard: 'default', multiline: true },
];

const READONLY = [
    { key: 'bpNumber', label: 'BP Number', icon: 'barcode-outline' },
    { key: 'meterId', label: 'Meter ID', icon: 'speedometer-outline' },
    { key: 'connType', label: 'Connection Type', icon: 'flash-outline' },
    { key: 'sanctionedLoad', label: 'Sanctioned Load', icon: 'options-outline', suffix: ' kW' },
    { key: 'userId', label: 'User ID', icon: 'finger-print-outline' },
];

export default function ProfileScreen() {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarUri, setAvatarUri] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId') || 'USR000001';
            const res = await api.get(`/api/users/${userId}`);
            const u = res.data;
            setProfile(u);
            setDraft({
                name: u.name || '', email: u.email || '', phone: u.phone || '',
                city: u.city || '', address: u.address || '',
            });
            if (u.avatar) setAvatarUri(`${API_BASE}${u.avatar}`);
        } catch (e) {
            console.error('Profile load error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const pickImage = async () => {
        if (!ImagePicker) {
            Alert.alert('Not Available', 'Image picker requires a development build. Please use a dev build to upload photos.');
            return;
        }
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permission needed', 'Please allow gallery access to change your avatar.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setAvatarUri(asset.uri);
            // Upload immediately
            try {
                const userId = await AsyncStorage.getItem('userId') || 'USR000001';
                const form = new FormData();
                form.append('avatar', {
                    uri: asset.uri,
                    name: 'avatar.jpg',
                    type: 'image/jpeg',
                });
                await api.post(`/api/users/${userId}/avatar`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    transformRequest: (data) => data,
                });
            } catch (e) {
                console.warn('Avatar upload failed:', e);
            }
        }
    };

    const takePhoto = async () => {
        if (!ImagePicker) {
            Alert.alert('Not Available', 'Camera requires a development build. Please use a dev build to take photos.');
            return;
        }
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permission needed', 'Please allow camera access.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setAvatarUri(asset.uri);
            try {
                const userId = await AsyncStorage.getItem('userId') || 'USR000001';
                const form = new FormData();
                form.append('avatar', {
                    uri: asset.uri,
                    name: 'avatar.jpg',
                    type: 'image/jpeg',
                });
                await api.post(`/api/users/${userId}/avatar`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    transformRequest: (data) => data,
                });
            } catch (e) {
                console.warn('Avatar upload failed:', e);
            }
        }
    };

    const showAvatarOptions = () => {
        Alert.alert('Change Profile Photo', 'Choose an option', [
            { text: 'Camera', onPress: takePhoto },
            { text: 'Gallery', onPress: pickImage },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const userId = await AsyncStorage.getItem('userId') || 'USR000001';
            const res = await api.put(`/api/users/${userId}/profile`, draft);
            setProfile(prev => ({ ...prev, ...res.data }));
            setEditing(false);
            Alert.alert('✅ Saved', 'Your profile has been updated.');
        } catch (e) {
            Alert.alert('Error', 'Could not save profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[st.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </View>
        );
    }

    const initials = (profile?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={st.root} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* ── Header ───────────────────────────────────── */}
                <View style={[st.header, { paddingTop: top + 14 }]}>
                    <View style={st.headerRow}>
                        <MenuButton />
                        <Text style={st.headerTitle}>{t.nav_profile}</Text>
                        <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={st.headerAction}>{editing ? t.save : 'Edit'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Avatar Section ───────────────────────────── */}
                <View style={st.avatarSection}>
                    <TouchableOpacity onPress={showAvatarOptions} activeOpacity={0.8}>
                        <View style={st.avatarRing}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={st.avatarImg} />
                            ) : (
                                <View style={st.avatarPlaceholder}>
                                    <Text style={st.avatarInitials}>{initials}</Text>
                                </View>
                            )}
                            <View style={st.cameraBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    <Text style={st.userName}>{profile?.name || 'User'}</Text>
                    <Text style={st.userEmail}>{profile?.email || ''}</Text>
                    <View style={st.statusBadge}>
                        <View style={[st.statusDot, { backgroundColor: profile?.isActive ? C.green : C.red }]} />
                        <Text style={st.statusText}>{profile?.isActive ? t.active : t.inactive}</Text>
                    </View>
                </View>

                {/* ── Editable Fields ──────────────────────────── */}
                <View style={st.section}>
                    <Text style={st.sectionTitle}>Personal Information</Text>
                    {FIELDS.map(f => (
                        <View key={f.key} style={st.fieldCard}>
                            <View style={st.fieldIconBox}>
                                <Ionicons name={f.icon} size={18} color={C.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={st.fieldLabel}>{f.label}</Text>
                                {editing ? (
                                    <TextInput
                                        style={[st.fieldInput, f.multiline && { height: 60, textAlignVertical: 'top' }]}
                                        value={draft[f.key] || ''}
                                        onChangeText={v => setDraft(prev => ({ ...prev, [f.key]: v }))}
                                        keyboardType={f.keyboard || 'default'}
                                        multiline={f.multiline}
                                        placeholder={`Enter ${f.label.toLowerCase()}`}
                                        placeholderTextColor="#b0bec5"
                                    />
                                ) : (
                                    <Text style={st.fieldValue}>{profile?.[f.key] || '—'}</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Account Details (Read Only) ──────────────── */}
                <View style={st.section}>
                    <Text style={st.sectionTitle}>Account Details</Text>
                    {READONLY.map(f => (
                        <View key={f.key} style={st.fieldCard}>
                            <View style={[st.fieldIconBox, { backgroundColor: C.goldLight }]}>
                                <Ionicons name={f.icon} size={18} color={C.gold} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={st.fieldLabel}>{f.label}</Text>
                                <Text style={st.fieldValue}>
                                    {profile?.[f.key] || '—'}{f.suffix || ''}
                                </Text>
                            </View>
                            <Ionicons name="lock-closed" size={14} color={C.border} />
                        </View>
                    ))}
                </View>

                {/* ── Quick Stats ──────────────────────────────── */}
                <View style={st.section}>
                    <Text style={st.sectionTitle}>Account Summary</Text>
                    <View style={st.statsRow}>
                        {[
                            { label: 'Connection', value: profile?.connType || '—', icon: 'flash', color: C.accent },
                            { label: 'Auto Optimize', value: profile?.autoOptimize ? 'ON' : 'OFF', icon: 'rocket', color: profile?.autoOptimize ? C.green : C.red },
                            { label: 'Load', value: `${profile?.sanctionedLoad || '—'} kW`, icon: 'speedometer', color: C.gold },
                        ].map(s => (
                            <View key={s.label} style={st.statCard}>
                                <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
                                <Text style={[st.statValue, { color: s.color }]}>{s.value}</Text>
                                <Text style={st.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Cancel Button (edit mode) ────────────────── */}
                {editing && (
                    <TouchableOpacity
                        style={st.cancelBtn}
                        onPress={() => { setEditing(false); setDraft({ name: profile?.name, email: profile?.email, phone: profile?.phone, city: profile?.city, address: profile?.address }); }}
                    >
                        <Text style={st.cancelText}>{t.cancel}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        backgroundColor: C.headerBg, paddingHorizontal: 20, paddingBottom: 18,
        borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
        shadowColor: '#0b2a52', shadowOpacity: 0.2, shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    headerAction: { color: '#64b5f6', fontSize: 15, fontWeight: '700' },

    avatarSection: { alignItems: 'center', paddingVertical: 24 },
    avatarRing: {
        width: 110, height: 110, borderRadius: 55,
        borderWidth: 3, borderColor: C.accent,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: C.card,
        shadowColor: C.accent, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    avatarImg: { width: 102, height: 102, borderRadius: 51 },
    avatarPlaceholder: {
        width: 102, height: 102, borderRadius: 51,
        backgroundColor: C.accentLight, justifyContent: 'center', alignItems: 'center',
    },
    avatarInitials: { fontSize: 36, fontWeight: '800', color: C.accent },
    cameraBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: C.card,
    },
    userName: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 12 },
    userEmail: { fontSize: 13, color: C.sub, marginTop: 2 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 10, backgroundColor: C.greenLight, paddingHorizontal: 12,
        paddingVertical: 5, borderRadius: 20,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700', color: C.green },

    section: { marginHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        fontSize: 13, fontWeight: '700', color: C.sub, letterSpacing: 0.8,
        textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4,
    },

    fieldCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: C.card, borderRadius: 14, padding: 14,
        marginBottom: 8, borderWidth: 1, borderColor: C.border,
        shadowColor: '#0b2a52', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    fieldIconBox: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: C.accentLight, justifyContent: 'center', alignItems: 'center',
    },
    fieldLabel: { fontSize: 10, fontWeight: '600', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    fieldValue: { fontSize: 15, fontWeight: '600', color: C.text },
    fieldInput: {
        fontSize: 15, fontWeight: '600', color: C.text,
        borderBottomWidth: 1.5, borderBottomColor: C.accent,
        paddingVertical: 2, paddingHorizontal: 0,
    },

    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
        flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
        alignItems: 'center', borderWidth: 1, borderColor: C.border,
        shadowColor: '#0b2a52', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    statValue: { fontSize: 16, fontWeight: '800', marginTop: 6 },
    statLabel: { fontSize: 10, color: C.sub, fontWeight: '600', marginTop: 2 },

    cancelBtn: {
        marginHorizontal: 16, marginTop: 20, paddingVertical: 14,
        borderRadius: 14, borderWidth: 1.5, borderColor: C.red,
        alignItems: 'center',
    },
    cancelText: { color: C.red, fontSize: 14, fontWeight: '700' },
});
