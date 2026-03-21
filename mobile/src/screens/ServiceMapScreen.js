import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Linking, ScrollView, FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuButton from '../components/MenuButton';
import { useLanguage } from '../i18n/LanguageContext';

const C = {
    bg: '#edf2f7', white: '#ffffff', blueDark: '#0b2a52', blue: '#1a66d9',
    green: '#2e7d32', text: '#1a2332', textSec: '#5a6a7a', muted: '#8a97a6', border: '#dfe7ef',
};

const BRANCHES = [
    { id: 1, name: 'BSES Rajdhani – Vasant Kunj', lat: 28.5194, lng: 77.1593, city: 'Delhi', phone: '19123', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 2, name: 'BSES Yamuna – Mayur Vihar', lat: 28.6094, lng: 77.2950, city: 'Delhi', phone: '19123', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 3, name: 'TPDDL – Rohini Sector 13', lat: 28.7216, lng: 77.1093, city: 'Delhi', phone: '19124', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection', 'Meter Replacement'] },
    { id: 4, name: 'BSES Rajdhani – Dwarka Sec 6', lat: 28.5921, lng: 77.0536, city: 'Delhi', phone: '19123', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 5, name: 'BEST – Andheri Division', lat: 19.1136, lng: 72.8697, city: 'Mumbai', phone: '22675', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 6, name: 'Adani Electricity – Bandra', lat: 19.0544, lng: 72.8423, city: 'Mumbai', phone: '19122', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 7, name: 'BEST – Colaba Service Centre', lat: 18.9067, lng: 72.8148, city: 'Mumbai', phone: '22675', type: 'Service Centre', services: ['Payment', 'Meter Reading'] },
    { id: 8, name: 'BESCOM – Koramangala', lat: 12.9352, lng: 77.6245, city: 'Bangalore', phone: '1912', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 9, name: 'BESCOM – Whitefield AEE', lat: 12.9698, lng: 77.7499, city: 'Bangalore', phone: '1912', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 10, name: 'BESCOM – Jayanagar Division', lat: 12.9250, lng: 77.5938, city: 'Bangalore', phone: '1912', type: 'Division Office', services: ['Payment', 'Complaint', 'Meter Replacement'] },
    { id: 11, name: 'TSSPDCL – Ameerpet', lat: 17.4374, lng: 78.4487, city: 'Hyderabad', phone: '1912', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 12, name: 'TSSPDCL – Kukatpally', lat: 17.4849, lng: 78.3996, city: 'Hyderabad', phone: '1912', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 13, name: 'TANGEDCO – Guindy', lat: 13.0067, lng: 80.2206, city: 'Chennai', phone: '1912', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 14, name: 'TANGEDCO – Anna Nagar', lat: 13.0850, lng: 80.2101, city: 'Chennai', phone: '1912', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 15, name: 'MSEDCL – Shivajinagar', lat: 18.5308, lng: 73.8474, city: 'Pune', phone: '1912', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 16, name: 'MSEDCL – Hadapsar', lat: 18.5018, lng: 73.9252, city: 'Pune', phone: '1912', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 17, name: 'CESC – Elgin Road HQ', lat: 22.5411, lng: 88.3535, city: 'Kolkata', phone: '1912', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 18, name: 'CESC – Salt Lake Sub-Division', lat: 22.5800, lng: 88.4200, city: 'Kolkata', phone: '1912', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
    { id: 19, name: 'PGVCL – Vastrapur', lat: 23.0434, lng: 72.5271, city: 'Ahmedabad', phone: '1912', type: 'Division Office', services: ['Payment', 'Complaint', 'New Connection'] },
    { id: 20, name: 'PGVCL – Maninagar', lat: 22.9994, lng: 72.6114, city: 'Ahmedabad', phone: '1912', type: 'Sub-Division', services: ['Payment', 'Complaint'] },
];

const TYPE_COLOR = { 'Division Office': '#1565c0', 'Sub-Division': '#2e7d32', 'Service Centre': '#e65100' };
const TYPE_PIN = { 'Division Office': '🔵', 'Sub-Division': '🟢', 'Service Centre': '🟠' };

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Build self-contained Leaflet HTML ──────────────────────────────────
function buildLeafletHTML(userLat, userLng, branches) {
    const markers = branches.map(b => `
        L.marker([${b.lat},${b.lng}], {
            icon: L.divIcon({
                className:'',
                html:'<div style="background:${TYPE_COLOR[b.type] || '#1a66d9'};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">${b.type === 'Division Office' ? '🏢' : b.type === 'Sub-Division' ? '🏬' : '🏪'}</div>',
                iconSize:[30,30], iconAnchor:[15,15], popupAnchor:[0,-15]
            })
        }).addTo(map).bindPopup(
            '<b style="font-size:13px">${b.name.replace(/'/g, "\\'")}</b>' +
            '<br><span style="color:${TYPE_COLOR[b.type] || '#1a66d9'};font-size:11px">${b.type}</span> · ${b.city}' +
            '<br><span style="font-size:11px;color:#555">${b.services.join(', ')}</span>' +
            '<br><a href="tel:${b.phone}" style="color:#2e7d32;font-weight:700;font-size:12px">📞 ${b.phone}</a>' +
            '<br><a href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}" target="_blank" style="color:#1a66d9;font-size:12px;font-weight:700">🗺 Get Directions</a>'
        );
    `).join('\n');

    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#e8edf2}
  .leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.2)}
  .leaflet-popup-content{margin:10px 14px;line-height:1.6}
</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map',{zoomControl:true}).setView([${userLat},${userLng}],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap contributors',maxZoom:19
}).addTo(map);

// User location marker
L.circleMarker([${userLat},${userLng}],{
    radius:10,fillColor:'#1a66d9',color:'#fff',weight:3,fillOpacity:1
}).addTo(map).bindPopup('<b>You are here</b>');

// Accuracy circle
L.circle([${userLat},${userLng}],{radius:600,color:'#1a66d9',fillColor:'#1a66d9',fillOpacity:0.08,weight:1}).addTo(map);

${markers}
</script>
</body></html>`;
}

// ── Branch list card ──────────────────────────────────────────────────
function BranchCard({ branch, distKm, onCall, onDirections }) {
    const tc = TYPE_COLOR[branch.type] || C.blue;
    return (
        <View style={st.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text style={{ fontSize: 24, marginTop: 2 }}>{TYPE_PIN[branch.type] || '📌'}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={st.cardName}>{branch.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                        <Text style={[st.typeBadge, { color: tc, backgroundColor: tc + '18' }]}>{branch.type}</Text>
                        <Text style={st.cityBadge}>{branch.city}</Text>
                        {distKm && <Text style={st.distBadge}>📍 {distKm} km</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {branch.services.map(s => (
                            <View key={s} style={st.servicePill}><Text style={st.serviceText}>{s}</Text></View>
                        ))}
                    </View>
                </View>
            </View>
            <View style={st.cardActions}>
                <TouchableOpacity style={st.callBtn} onPress={onCall}>
                    <Ionicons name="call" size={13} color="#fff" />
                    <Text style={st.callText}>Call {branch.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.navBtn} onPress={onDirections}>
                    <Ionicons name="navigate" size={13} color={C.blue} />
                    <Text style={st.navText}>Directions</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function ServiceMapScreen() {
    const { t } = useLanguage();
    const { top } = useSafeAreaInsets();
    const [location, setLocation] = useState(null);
    const [locError, setLocError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapMode, setMapMode] = useState(true);
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocError('Location denied – showing Hyderabad by default');
                    setLocation({ latitude: 17.4374, longitude: 78.4487 });
                } else {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setLocation(loc.coords);
                }
            } catch {
                setLocError('GPS unavailable – showing Hyderabad by default');
                setLocation({ latitude: 17.4374, longitude: 78.4487 });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const withDist = location
        ? BRANCHES.map(b => ({ ...b, distKm: haversineKm(location.latitude, location.longitude, b.lat, b.lng) }))
            .sort((a, b) => a.distKm - b.distKm)
        : BRANCHES;

    const filterOpts = ['All', 'Division Office', 'Sub-Division', 'Service Centre'];
    const filtered = filterType === 'All' ? withDist : withDist.filter(b => b.type === filterType);
    const nearest = withDist[0];

    const openDir = (b) => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`);

    const mapHtml = location ? buildLeafletHTML(location.latitude, location.longitude, BRANCHES) : null;

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* Header */}
            <View style={[st.header, { paddingTop: top + 14 }]}>
                <MenuButton />
                <View style={{ flex: 1 }}>
                    <Text style={st.title}>{t.nav_servicemap}</Text>
                    <Text style={st.subtitle}>{t.servicemap_sub}</Text>
                </View>
                <View style={st.toggle}>
                    <TouchableOpacity style={[st.tBtn, mapMode && st.tActive]} onPress={() => setMapMode(true)}>
                        <Ionicons name="map-outline" size={16} color={mapMode ? '#fff' : C.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.tBtn, !mapMode && st.tActive]} onPress={() => setMapMode(false)}>
                        <Ionicons name="list-outline" size={16} color={!mapMode ? '#fff' : C.muted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* GPS Banner */}
            {locError
                ? <View style={[st.banner, { backgroundColor: '#fff3e0' }]}>
                    <Ionicons name="warning-outline" size={14} color="#e65100" />
                    <Text style={[st.bannerText, { color: '#e65100' }]}>{locError}</Text>
                </View>
                : location
                    ? <View style={[st.banner, { backgroundColor: '#e8f5e9' }]}>
                        <Ionicons name="location" size={14} color={C.green} />
                        <Text style={[st.bannerText, { color: C.green }]}>GPS active · {filtered.length} offices sorted by distance</Text>
                    </View>
                    : null}

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={C.blue} />
                    <Text style={{ color: C.muted, marginTop: 14, fontSize: 13 }}>Getting your location…</Text>
                </View>
            ) : (
                <>
                    {/* ── MAP VIEW (Leaflet in WebView) ── */}
                    {mapMode && mapHtml && (
                        <View style={{ flex: 1 }}>
                            <WebView
                                source={{ html: mapHtml }}
                                style={{ flex: 1 }}
                                originWhitelist={['*']}
                                javaScriptEnabled
                                domStorageEnabled
                                startInLoadingState
                                renderLoading={() => (
                                    <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#edf2f7' }}>
                                        <ActivityIndicator size="large" color={C.blue} />
                                        <Text style={{ color: C.muted, marginTop: 12, fontSize: 13 }}>Loading map…</Text>
                                    </View>
                                )}
                            />
                            {/* Nearest card overlay */}
                            {nearest && (
                                <View style={st.nearestCard}>
                                    <View style={[st.nearestAccent, { backgroundColor: TYPE_COLOR[nearest.type] || C.blue }]} />
                                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                                        <Text style={st.nearestLabel}>📍 NEAREST · {nearest.distKm?.toFixed(1)} km away</Text>
                                        <Text style={st.nearestName} numberOfLines={1}>{nearest.name}</Text>
                                        <Text style={st.nearestSub}>{nearest.type} · {nearest.city}</Text>
                                    </View>
                                    <View style={{ gap: 6, paddingRight: 10 }}>
                                        <TouchableOpacity style={st.callBtn} onPress={() => Linking.openURL(`tel:${nearest.phone}`)}>
                                            <Ionicons name="call" size={12} color="#fff" /><Text style={st.callText}>Call</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={st.navBtn} onPress={() => openDir(nearest)}>
                                            <Ionicons name="navigate" size={12} color={C.blue} /><Text style={st.navText}>Go</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ── LIST VIEW ── */}
                    {!mapMode && (
                        <View style={{ flex: 1 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                style={st.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                                {filterOpts.map(f => (
                                    <TouchableOpacity key={f}
                                        style={[st.chip, filterType === f && st.chipActive]}
                                        onPress={() => setFilterType(f)}>
                                        <Text style={[st.chipText, filterType === f && { color: '#fff' }]}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <FlatList
                                data={filtered}
                                keyExtractor={b => b.id.toString()}
                                contentContainerStyle={{ padding: 16 }}
                                renderItem={({ item }) => (
                                    <BranchCard
                                        branch={item}
                                        distKm={item.distKm?.toFixed(1)}
                                        onCall={() => Linking.openURL(`tel:${item.phone}`)}
                                        onDirections={() => openDir(item)}
                                    />
                                )}
                            />
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────
const st = StyleSheet.create({
    header: { backgroundColor: C.blueDark, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    title: { color: '#fff', fontSize: 19, fontWeight: '800' },
    subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
    toggle: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 3 },
    tBtn: { width: 34, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    tActive: { backgroundColor: C.blue },

    banner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
    bannerText: { fontSize: 12, fontWeight: '600', flex: 1 },

    filterRow: { maxHeight: 48, paddingVertical: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
    chipActive: { backgroundColor: C.blue, borderColor: C.blue },
    chipText: { color: C.muted, fontSize: 12, fontWeight: '600' },

    card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border, elevation: 2 },
    cardName: { color: C.text, fontWeight: '700', fontSize: 13, lineHeight: 18 },
    typeBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    cityBadge: { fontSize: 10, color: C.muted, fontWeight: '600', backgroundColor: '#f0f4f8', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    distBadge: { fontSize: 10, color: C.blue, fontWeight: '700', backgroundColor: '#e6f0ff', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    servicePill: { backgroundColor: '#f0f4f8', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    serviceText: { color: C.textSec, fontSize: 10, fontWeight: '600' },
    cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },

    callBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    callText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    navBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e6f0ff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#90caf9' },
    navText: { color: C.blue, fontSize: 11, fontWeight: '700' },

    nearestCard: { position: 'absolute', bottom: 16, left: 14, right: 14, backgroundColor: C.white, borderRadius: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', elevation: 8, borderWidth: 1, borderColor: C.border },
    nearestAccent: { width: 5, alignSelf: 'stretch' },
    nearestLabel: { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
    nearestName: { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    nearestSub: { color: C.textSec, fontSize: 11, marginTop: 2 },
});
