import React, { useContext } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContext } from '../contexts/DrawerContext';

/**
 * mode="menu"  → hamburger icon, opens drawer  (Dashboard only)
 * mode="back"  → arrow-back icon, calls goBack() (all other screens)
 * Default is "back".
 *
 * Safe to use outside NavigationContainer (e.g. Voice modal).
 */
export default function MenuButton({ color = '#fff', mode = 'back' }) {
    let navigation = null;
    try {
        // useNavigation throws if not inside NavigationContainer
        navigation = require('@react-navigation/native').useNavigation();
    } catch (_) {}
    const drawer = useContext(DrawerContext);

    const isMenu = mode === 'menu';

    return (
        <TouchableOpacity
            style={styles.btn}
            onPress={() => {
                if (isMenu) {
                    drawer?.open?.();
                } else {
                    navigation?.goBack?.();
                }
            }}
            activeOpacity={0.7}
        >
            <Ionicons
                name={isMenu ? 'menu' : 'arrow-back'}
                size={22}
                color={color}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
