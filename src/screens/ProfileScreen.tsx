import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { COLORS, SIZES } from '@constants/theme';
import { useAuth } from '@context/AuthContext';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  rightElement?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, color, rightElement }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuIcon, { backgroundColor: color ? `${color}15` : 'rgba(255,255,255,0.05)' }]}>
        <Icon name={icon} size={20} color={color || COLORS.textMuted} />
      </View>
      <Text style={[styles.menuLabel, color ? { color } : {}]}>{label}</Text>
    </View>
    {rightElement || <Icon name="chevron-right" size={20} color={COLORS.textMuted} />}
  </TouchableOpacity>
);

const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres salir de PANA?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  const menuSections = [
    {
      title: 'MI CUENTA',
      items: [
        { icon: 'account-details', label: 'Mis datos', onPress: () => {} },
        { icon: 'bell-outline', label: 'Notificaciones', onPress: () => {} },
        { icon: 'shield-check', label: 'Privacidad', onPress: () => {} },
      ],
    },
    {
      title: 'CONTENIDO',
      items: [
        { icon: 'play-box-multiple', label: 'Mi Galería', onPress: () => navigation?.navigate('Gallery') },
        { icon: 'chart-box-outline', label: 'Estadísticas', onPress: () => {} },
        { icon: 'tag-outline', label: 'Mis Categorías', onPress: () => {} },
      ],
    },
    {
      title: 'INFORMACIÓN',
      items: [
        { icon: 'information-outline', label: 'Acerca de PANA', onPress: () => showAboutAlert() },
        { icon: 'help-circle-outline', label: 'Ayuda', onPress: () => {} },
        { icon: 'file-document-outline', label: 'Términos y Condiciones', onPress: () => {} },
      ],
    },
  ];

  const showAboutAlert = () => {
    Alert.alert(
      'Acerca de PANA',
      'PANA v1.0.0 Beta\n\nDesarrollado por Alvaro Tabata\n\n"Una aplicación de mercado venezolano, controlada por inteligencia artificial, donde puedes publicar videos de 60 segundos sobre lo que vendes, compras, produces, importas o exportas."\n\n¡AQUI HAY PANA PA\' RATO!',
      [{ text: '¡Épale!', style: 'default' }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="account" size={48} color={COLORS.primary} />
          </View>
          <View style={styles.badge}>
            <Icon name="check" size={14} color={COLORS.white} />
          </View>
        </View>
        <Text style={styles.displayName}>{user?.displayName || 'Usuario PANA'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Siguiendo</Text>
          </View>
        </View>
      </View>

      <View style={styles.businessBanner}>
        <Icon name="store" size={18} color={COLORS.primary} />
        <Text style={styles.businessText}>Modo: B2B / B2C</Text>
      </View>

      {menuSections.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, index) => (
              <React.Fragment key={item.label}>
                <MenuItem icon={item.icon} label={item.label} onPress={item.onPress} />
                {index < section.items.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>{'PANA'}</Text>
        <Text style={styles.footerTagline}>AQUI HAY PANA PA' RATO!</Text>
        <Text style={styles.footerVersion}>Beta v1.0.0</Text>
        <Text style={styles.footerDeveloper}>Desarrollado por Alvaro Tabata</Text>
        <View style={styles.footerBadge}>
          <Icon name="robot" size={14} color={COLORS.primary} />
          <Text style={styles.footerBadgeText}>Controlado por IA</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  displayName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 30,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  businessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingVertical: 10,
    marginHorizontal: SIZES.padding,
    marginTop: 16,
    borderRadius: 10,
    gap: 8,
  },
  businessText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: SIZES.padding,
    marginTop: 24,
  },
  menuSectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginLeft: 64,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.padding,
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 23, 68, 0.3)',
    gap: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  footerTitle: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  footerTagline: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 2,
    textAlign: 'center',
  },
  footerVersion: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 12,
    opacity: 0.6,
  },
  footerDeveloper: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
  },
  footerBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ProfileScreen;
