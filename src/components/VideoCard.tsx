import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';

import { COLORS, SIZES, SHADOWS } from '@constants/theme';
import { Video as VideoType } from '@types/index';
import { VideoService } from '@services/firebase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - SIZES.padding * 2;
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16;

interface VideoCardProps {
  video: VideoType;
  showFullDetails?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, showFullDetails = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const videoRef = useRef<Video>(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      VideoService.incrementViews(video.id);
    }
  };

  const handleLike = async () => {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikeCount((prev) => prev + (newState ? 1 : -1));
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
    return d.toLocaleDateString('es-VE');
  };

  const categoryColors: Record<string, string> = {
    Tecnologia: '#2979FF',
    Hogar: '#FF6B00',
    Moda: '#E040FB',
    Alimentos: '#00C853',
    Bebidas: '#00BCD4',
    Automotriz: '#FF1744',
    Industrial: '#607D8B',
    Construccion: '#795548',
    Agricultura: '#4CAF50',
    Salud: '#F44336',
    Educacion: '#3F51B5',
    Servicios: '#9E9E9E',
    Importacion: '#FF9800',
    Exportacion: '#2196F3',
    Otros: '#757575',
  };

  return (
    <View style={styles.card}>
      <View style={styles.thumbnailContainer}>
        <TouchableOpacity
          style={styles.thumbnail}
          onPress={handlePlayPause}
          activeOpacity={0.9}
        >
          {isPlaying ? (
            <Video
              ref={videoRef}
              source={{ uri: video.videoURL }}
              style={styles.videoPlayer}
              resizeMode="contain"
              paused={false}
              repeat
              controls
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Icon name="video-outline" size={48} color={COLORS.textMuted} />
            </View>
          )}

          {!isPlaying && (
            <View style={styles.playButton}>
              <Icon name="play" size={28} color={COLORS.white} />
            </View>
          )}

          <View style={styles.durationBadge}>
            <Icon name="clock-outline" size={12} color={COLORS.white} />
            <Text style={styles.durationText}>
              {video.duration ? `${Math.round(video.duration)}s` : '60s'}
            </Text>
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{video.category}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={[styles.typeIndicator, { backgroundColor: categoryColors[video.transactionType] || COLORS.primary }]}>
            <Text style={styles.typeText}>{video.transactionType?.charAt(0)}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
            <Text style={styles.userName}>{video.userDisplayName}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {video.description}
        </Text>

        {video.price != null && video.price > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Precio:</Text>
            <Text style={styles.priceValue}>
              {video.currency === 'Bs' ? 'Bs.' : video.currency === 'USD' ? '$' : '€'}
              {' '}
              {video.price.toLocaleString('es-VE')}
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="map-marker" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{video.location || 'Venezuela'}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(video.createdAt)}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Icon
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? COLORS.error : COLORS.textMuted}
            />
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Icon name="eye-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.actionText}>{video.views || 0}</Text>
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="share-variant" size={20} color={COLORS.textMuted} />
            <Text style={styles.actionText}>{video.shares || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="comment-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.actionText}>{video.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>

        {showFullDetails && video.contactPhone && (
          <TouchableOpacity style={styles.contactButton}>
            <Icon name="phone" size={16} color={COLORS.white} />
            <Text style={styles.contactText}>{video.contactPhone}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    marginHorizontal: SIZES.padding,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnailContainer: {
    width: '100%',
    height: THUMBNAIL_HEIGHT,
  },
  thumbnail: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    flex: 1,
    width: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 107, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  durationText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeIndicator: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  userName: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  priceValue: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  contactText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoCard;
