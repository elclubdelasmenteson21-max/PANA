import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES } from '@constants/theme';

const GalleryScreen: React.FC = () => {
  const videos: string[] = [];

  return (
    <LinearGradient colors={['#000000', '#0A0A0A', '#1A0A00']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Galería</Text>
        <Text style={styles.headerSubtitle}>Tus videos publicados</Text>
      </View>

      <FlatList
        data={videos}
        renderItem={() => null}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>Tu galería está vacía</Text>
            <Text style={styles.emptyText}>
              Los videos que publiques aparecerán aquí.
            </Text>
          </View>
        }
      />
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
  listContent: { padding: SIZES.padding },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 64, marginBottom: SIZES.padding },
  emptyTitle: { fontSize: SIZES.fontXLarge, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.paddingSmall },
  emptyText: { fontSize: SIZES.fontMedium, color: COLORS.textMuted, textAlign: 'center' },
});

export default GalleryScreen;
