import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import Video from 'react-native-video';

import { COLORS, SIZES } from '@constants/theme';
import { useAuth } from '@context/AuthContext';
import { VideoService } from '@services/firebase';
import { Category, TransactionType } from '@apptypes/index';

const CATEGORIES: Category[] = [
  'Tecnologia', 'Hogar', 'Moda', 'Alimentos', 'Bebidas',
  'Automotriz', 'Industrial', 'Construccion', 'Agricultura',
  'Salud', 'Educacion', 'Servicios', 'Importacion', 'Exportacion',
  'Otros',
];

const TRANSACTION_TYPES: TransactionType[] = [
  'Venta', 'Compra', 'Intercambio', 'Importacion', 'Exportacion',
  'Produccion', 'Distribucion',
];

const CURRENCIES = ['Bs', 'USD', 'EUR'] as const;

const UploadScreen: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'details' | 'uploading'>('select');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType | null>(null);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'Bs' | 'USD' | 'EUR'>('Bs');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const handlePickVideo = useCallback(async (fromCamera: boolean) => {
    const options = {
      mediaType: 'video' as MediaType,
      videoQuality: 'high' as const,
      durationLimit: 60,
      saveToPhotos: fromCamera,
    };

    try {
      const result = fromCamera
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.didCancel) return;

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 60) {
          Alert.alert('Error', 'El video excede los 60 segundos permitidos');
          return;
        }
        if (asset.duration && asset.duration < 3) {
          Alert.alert('Error', 'El video debe tener al menos 3 segundos');
          return;
        }
        setVideoUri(asset.uri || null);
        setThumbnailUri(null);
        setVideoDuration(asset.duration || 0);
        setStep('details');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el video');
    }
  }, []);

  const handleUpload = async () => {
    if (!user || !videoUri) return;
    if (!title.trim()) { Alert.alert('Error', 'El título es obligatorio'); return; }
    if (!category) { Alert.alert('Error', 'Selecciona una categoría'); return; }
    if (!transactionType) { Alert.alert('Error', 'Selecciona el tipo de transacción'); return; }

    setStep('uploading');
    try {
      await VideoService.uploadVideo(user.uid, videoUri, thumbnailUri || videoUri, {
        title: title.trim(),
        description: description.trim(),
        category,
        transactionType,
        price: price ? parseFloat(price) : null,
        currency,
        location: location.trim(),
        contactPhone: contactPhone.trim(),
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL,
        duration: videoDuration,
        tags: [category, transactionType, ...title.trim().toLowerCase().split(' ')],
      });

      Alert.alert(
        '¡Publicado!',
        'Tu video se ha publicado exitosamente. ¡AQUI HAY PANA PA\' RATO!',
        [
          {
            text: 'OK',
            onPress: () => {
              setStep('select');
              setVideoUri(null);
              setThumbnailUri(null);
              setTitle('');
              setDescription('');
              setCategory(null);
              setTransactionType(null);
              setPrice('');
              setLocation('');
              setContactPhone('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo publicar el video. Intenta de nuevo.');
      setStep('details');
    }
  };

  if (step === 'uploading') {
    return (
      <View style={styles.uploadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.uploadingText}>Publicando tu video...</Text>
        <Text style={styles.uploadingSubtext}>Esto puede tomar un momento</Text>
      </View>
    );
  }

  if (step === 'select') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.selectHeader}>
          <Icon name="video-plus" size={48} color={COLORS.primary} />
          <Text style={styles.selectTitle}>Publicar Video</Text>
          <Text style={styles.selectSubtitle}>Máximo 60 segundos</Text>
        </View>

        <View style={styles.selectOptions}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handlePickVideo(true)}
          >
            <View style={styles.selectIconContainer}>
              <Icon name="camera" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.selectButtonTitle}>Grabar Video</Text>
            <Text style={styles.selectButtonSubtitle}>Usa la cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handlePickVideo(false)}
          >
            <View style={styles.selectIconContainer}>
              <Icon name="folder-video" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.selectButtonTitle}>Seleccionar de Galería</Text>
            <Text style={styles.selectButtonSubtitle}>Elige un video existente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Icon name="information" size={18} color={COLORS.info} />
          <Text style={styles.infoText}>
            Tu video se guardará en la nube y podrás acceder a él desde tu galería cuando quieras.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.detailsContent}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <TouchableOpacity style={styles.backButton} onPress={() => setStep('select')}>
        <Icon name="arrow-left" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <Text style={styles.detailsTitle}>Detalles de tu publicación</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          placeholder="¿Qué estás ofreciendo?"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe tu producto o servicio..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoría *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de Transacción *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {TRANSACTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, transactionType === type && styles.chipActive]}
              onPress={() => setTransactionType(type)}
            >
              <Text style={[styles.chipText, transactionType === type && styles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Precio</Text>
        <View style={styles.priceRow}>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <View style={styles.currencyRow}>
            {CURRENCIES.map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[styles.currencyChip, currency === cur && styles.currencyChipActive]}
                onPress={() => setCurrency(cur)}
              >
                <Text style={[styles.currencyText, currency === cur && styles.currencyTextActive]}>
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ubicación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Caracas, Miranda"
          placeholderTextColor={COLORS.textMuted}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono de contacto</Text>
        <TextInput
          style={styles.input}
          placeholder="0412-XXX-XXXX"
          placeholderTextColor={COLORS.textMuted}
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Icon name="cloud-upload" size={22} color={COLORS.white} />
        <Text style={styles.uploadButtonText}>PUBLICAR VIDEO</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  selectHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 40,
    paddingBottom: 40,
  },
  selectTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
  },
  selectSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  selectOptions: {
    paddingHorizontal: SIZES.padding,
    gap: 16,
  },
  selectButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectButtonTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
  },
  selectButtonSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(41, 121, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    margin: SIZES.padding,
    marginTop: 24,
  },
  infoText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  detailsContent: {
    padding: SIZES.padding,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailsTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currencyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  currencyTextActive: {
    color: COLORS.white,
  },
  uploadButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    gap: 10,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  uploadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  uploadingSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});

export default UploadScreen;
