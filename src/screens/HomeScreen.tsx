import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { COLORS, SIZES } from '@constants/theme';
import { Video } from '@types/index';
import { VideoService } from '@services/firebase';
import VideoCard from '@components/VideoCard';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  'Todo', 'Tecnologia', 'Hogar', 'Moda', 'Alimentos', 'Bebidas',
  'Automotriz', 'Industrial', 'Construccion', 'Agricultura',
  'Salud', 'Educacion', 'Servicios', 'Importacion', 'Exportacion',
];

const HomeScreen: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadVideos = useCallback(async (refresh = false) => {
    try {
      const result = await VideoService.getVideos(
        refresh ? null : lastVisible,
        10
      );
      if (refresh) {
        setVideos(result.videos);
      } else {
        setVideos((prev) => [...prev, ...result.videos]);
      }
      setLastVisible(result.lastVisible);
      setHasMore(result.videos.length === 10);
    } catch (error) {
      console.warn('Error loading videos:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [lastVisible]);

  useEffect(() => {
    loadVideos(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastVisible(null);
    loadVideos(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadVideos();
    }
  };

  const filteredVideos = selectedCategory === 'Todo'
    ? videos
    : videos.filter((v) => v.category === selectedCategory);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>¡Bienvenido a PANA!</Text>
          <Text style={styles.subtitle}>Descubre lo que hay en Venezuela</Text>
        </View>
        <Icon name="robot" size={36} color={COLORS.primary} />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
        contentContainerStyle={styles.categoriesContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando publicaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard video={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="video-off" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No hay publicaciones</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === 'Todo'
                ? 'Sé el primero en publicar un video'
                : `No hay publicaciones en ${selectedCategory}`}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
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
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 16,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  categoriesList: {
    maxHeight: 44,
  },
  categoriesContent: {
    paddingHorizontal: SIZES.padding,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
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
});

export default HomeScreen;
