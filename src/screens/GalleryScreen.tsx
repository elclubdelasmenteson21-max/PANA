import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { COLORS, SIZES } from '@constants/theme';
import { useAuth } from '@context/AuthContext';
import { VideoService } from '@services/firebase';
import { Video } from '@types/index';
import VideoCard from '@components/VideoCard';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;

const GalleryScreen: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadUserVideos = useCallback(async () => {
    if (!user) return;
    try {
      const userVideos = await VideoService.getUserVideos(user.uid);
      setVideos(userVideos);
    } catch (error) {
      console.warn('Error loading gallery:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserVideos();
  }, [loadUserVideos]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUserVideos();
  };

  const renderGridItem = ({ item }: { item: Video }) => (
    <TouchableOpacity style={styles.gridItem} activeOpacity={0.8}>
      <View style={styles.gridThumbnail}>
        <Icon name="video" size={32} color={COLORS.textMuted} />
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.gridViews}>{item.views} vistas</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu galería...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mi Galería</Text>
          <Text style={styles.subtitle}>
            {videos.length} {videos.length === 1 ? 'publicación' : 'publicaciones'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          <Icon
            name={viewMode === 'grid' ? 'view-list' : 'grid-view'}
            size={22}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {viewMode === 'grid' ? (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.gridRow}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="video-off-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Tu galería está vacía</Text>
              <Text style={styles.emptySubtitle}>
                Publica tu primer video para que aparezca aquí
              </Text>
              <Text style={styles.cloudNote}>
                Todos tus videos se guardan en la nube. Puedes acceder a ellos cuando quieras.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="video-off-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Tu galería está vacía</Text>
              <Text style={styles.emptySubtitle}>
                Publica tu primer video para que aparezca aquí
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: {
    paddingHorizontal: SIZES.padding,
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridThumbnail: {
    height: 120,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: {
    padding: 10,
  },
  gridTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  gridViews: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  cloudNote: {
    color: COLORS.info,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
    opacity: 0.8,
  },
});

export default GalleryScreen;
