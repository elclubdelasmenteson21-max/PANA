import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES } from '@constants/theme';
import { Video } from '@apptypes/index';

const HomeScreen: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Load videos from Firestore
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderVideo = ({ item }: { item: Video }) => (
    <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={styles.videoCard}>
      <View style={styles.videoThumbnail}>
        {item.thumbnailURL ? (
          <Image source={{ uri: item.thumbnailURL }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Text style={styles.placeholderText}>🎬</Text>
          </View>
        )}
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoDescription}>{item.description}</Text>
        <View style={styles.videoMeta}>
          <Text style={styles.videoUser}>{item.userDisplayName}</Text>
          <Text style={styles.videoLikes}>❤️ {item.likes}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#000000', '#0A0A0A', '#1A0A00']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inicio</Text>
        <Text style={styles.headerSubtitle}>Descubre lo último de PANA</Text>
      </View>

      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📹</Text>
            <Text style={styles.emptyTitle}>Bienvenido a PANA</Text>
            <Text style={styles.emptyText}>
              Publica tu primer video de 60 segundos mostrando tus productos o servicios.
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
  list: { flex: 1 },
  listContent: { padding: SIZES.padding },
  videoCard: {
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    overflow: 'hidden',
  },
  videoThumbnail: { width: '100%', height: 200 },
  thumbnail: { width: '100%', height: '100%' },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 48 },
  videoInfo: { padding: SIZES.paddingSmall },
  videoDescription: { color: COLORS.text, fontSize: SIZES.fontMedium, marginBottom: 4 },
  videoMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  videoUser: { color: COLORS.textMuted, fontSize: SIZES.fontSmall },
  videoLikes: { color: COLORS.textMuted, fontSize: SIZES.fontSmall },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 64, marginBottom: SIZES.padding },
  emptyTitle: { fontSize: SIZES.fontXLarge, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.paddingSmall },
  emptyText: { fontSize: SIZES.fontMedium, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: SIZES.paddingLarge },
});

export default HomeScreen;
