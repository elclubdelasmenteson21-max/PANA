import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES } from '@constants/theme';
import { useAuth } from '@context/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <LinearGradient colors={['#000000', '#0A0A0A', '#1A0A00']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <Text style={styles.headerSubtitle}>Tu cuenta PANA</Text>
      </View>

      <View style={styles.content}>
        {isAuthenticated && user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.displayName?.charAt(0).toUpperCase() || 'P'}
              </Text>
            </View>
            <Text style={styles.displayName}>{user.displayName || 'Usuario PANA'}</Text>
            <Text style={styles.email}>{user.email || ' '}</Text>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Siguiendo</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginIcon}>🔐</Text>
            <Text style={styles.loginTitle}>Inicia Sesión</Text>
            <Text style={styles.loginText}>
              Crea una cuenta para disfrutar de todas las funciones de PANA.
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  headerSubtitle: { fontSize: SIZES.fontSmall, color: COLORS.textMuted, marginTop: 4 },
  content: { flex: 1, padding: SIZES.padding },
  profileCard: { alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: COLORS.text },
  displayName: { fontSize: SIZES.fontXLarge, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  email: { fontSize: SIZES.fontMedium, color: COLORS.textMuted, marginBottom: SIZES.paddingLarge },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SIZES.paddingLarge,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: SIZES.fontXLarge, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: SIZES.fontSmall, color: COLORS.textMuted, marginTop: 4 },
  logoutButton: {
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.paddingLarge,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: { color: COLORS.error, fontSize: SIZES.fontMedium, fontWeight: '600' },
  loginPrompt: { alignItems: 'center', paddingTop: 100 },
  loginIcon: { fontSize: 64, marginBottom: SIZES.padding },
  loginTitle: { fontSize: SIZES.fontXLarge, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.paddingSmall },
  loginText: { fontSize: SIZES.fontMedium, color: COLORS.textMuted, textAlign: 'center' },
});

export default ProfileScreen;
