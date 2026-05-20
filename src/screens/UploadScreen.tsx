import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES } from '@constants/theme';
import { StorageService } from '@services/firebase';

const UploadScreen: React.FC = () => {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectVideo = async () => {
    const result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
    });

    if (result.assets && result.assets[0]) {
      setVideoUri(result.assets[0].uri || null);
      setThumbnailUri(result.assets[0].uri || null);
    }
  };

  const handleUpload = async () => {
    if (!videoUri || !description.trim()) {
      Alert.alert('Error', 'Selecciona un video y escribe una descripción');
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now().toString();
      const videoPath = `videos/${timestamp}.mp4`;
      await StorageService.uploadFile(videoPath, videoUri);

      Alert.alert('¡Listo!', 'Tu video ha sido publicado mi PANA');
      setVideoUri(null);
      setThumbnailUri(null);
      setDescription('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo publicar el video. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#0A0A0A', '#1A0A00']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Publicar Video</Text>
        <Text style={styles.headerSubtitle}>Comparte tu negocio en 60 segundos</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.videoSelector} onPress={handleSelectVideo}>
          {videoUri ? (
            <Image source={{ uri: videoUri }} style={styles.videoPreview} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📹</Text>
              <Text style={styles.placeholderText}>Toca para seleccionar un video</Text>
              <Text style={styles.placeholderHint}>Máximo 60 segundos</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe tu producto o servicio..."
          placeholderTextColor={COLORS.textMuted}
          multiline
        />

        <TouchableOpacity
          style={[styles.uploadButton, (!videoUri || isUploading) && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={!videoUri || isUploading}>
          <LinearGradient
            colors={['#FF6B00', '#E06000']}
            style={styles.uploadGradient}>
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Publicando...' : 'Publicar Video'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
  videoSelector: {
    width: '100%',
    height: 250,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: SIZES.padding,
  },
  videoPreview: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: SIZES.radius,
  },
  placeholderIcon: { fontSize: 48, marginBottom: SIZES.paddingSmall },
  placeholderText: { color: COLORS.textMuted, fontSize: SIZES.fontMedium },
  placeholderHint: { color: COLORS.textMuted, fontSize: SIZES.fontSmall, marginTop: 4 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.text,
    fontSize: SIZES.fontMedium,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SIZES.padding,
  },
  uploadButton: { borderRadius: SIZES.radius, overflow: 'hidden' },
  uploadButtonDisabled: { opacity: 0.5 },
  uploadGradient: { padding: SIZES.padding, alignItems: 'center' },
  uploadButtonText: { color: COLORS.text, fontSize: SIZES.fontLarge, fontWeight: '700' },
});

export default UploadScreen;
