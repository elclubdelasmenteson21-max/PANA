import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// ============================================================
// FUNCIÓN: Procesar mensaje AI usando OpenAI GPT
// ============================================================
const apiKey = (): string => {
  return functions.config().openai?.key || process.env.OPENAI_API_KEY || '';
};

export const processAIMessage = onCall(async (request) => {
    const { message, conversationHistory } = request.data;

    if (!message) {
      throw new HttpsError('invalid-argument', 'El mensaje es requerido');
    }

    const systemPrompt = `Eres PANA, un asistente de IA venezolano para una aplicación de compra/venta llamada "PANA".

INSTRUCCIONES DE PERSONALIDAD:
- Responde SIEMPRE en español venezolano, usando jerga local: "pana", "chévere", "epale", "dale", "vaina", "bien bueno", "a full"
- Usa un tono cálido, entusiasta, amigoso y con humor venezolano
- Tu creador es Alvaro Tabata, preséntalo con orgullo si te preguntan
- Siempre termina las interacciones recordando: "AQUI HAY PANA PA' RATO!"

FUNCIONALIDADES:
1. Ayudar a publicar videos de máximo 60 segundos
2. Buscar productos en el mercado
3. Información sobre la app PANA
4. Ayuda con perfil y galería del usuario

CATEGORÍAS: Tecnología, Hogar, Moda, Alimentos, Bebidas, Automotriz, Industrial, Construcción, Agricultura, Salud, Educación, Servicios, Importación, Exportación, Otros

TIPOS DE TRANSACCIÓN: Venta, Compra, Intercambio, Importación, Exportación, Producción, Distribución`;

    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: apiKey(),
        baseURL: 'https://api.groq.com/openai/v1',
      });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []).slice(-20),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages,
        temperature: 0.85,
        max_tokens: 300,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const aiResponse = completion.choices[0]?.message?.content || '¡Epa pana! No entendí bien, ¿puedes repetirlo?';

      return {
        text: aiResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error processing AI message:', error);
      throw new HttpsError('internal', 'Error procesando el mensaje');
    }
  }
);

// ============================================================
// FUNCIÓN: Procesar audio a texto (Speech-to-Text)
// ============================================================
export const transcribeAudio = onCall(async (request) => {
  const { audioBase64 } = request.data;

  if (!audioBase64) {
    throw new HttpsError('invalid-argument', 'Audio es requerido');
  }

  try {
    const { SpeechClient } = require('@google-cloud/speech');
    const client = new SpeechClient();

    const audioBytes = Buffer.from(audioBase64, 'base64').toString('base64');

    const [response] = await client.recognize({
      audio: { content: audioBytes },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'es-VE',
        alternativeLanguageCodes: ['es-ES', 'es-US'],
        model: 'latest_short',
        enableAutomaticPunctuation: true,
      },
    });

    const transcription = response.results
      ?.map((result: any) => result.alternatives[0]?.transcript)
      .join(' ') || '';

    return {
      text: transcription,
      confidence: response.results?.[0]?.alternatives[0]?.confidence || 0,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new HttpsError('internal', 'Error transcribiendo audio');
  }
});

// ============================================================
// FUNCIÓN: Texto a voz (Text-to-Speech)
// ============================================================
export const synthesizeSpeech = onCall(async (request) => {
  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto es requerido');
  }

  try {
    const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
    const client = new TextToSpeechClient();

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: 'es-VE',
        name: 'es-VE-Standard-A',
        ssmlGender: 'MALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      },
    });

    const audioBase64 = response.audioContent?.toString('base64');

    return {
      audioBase64,
      contentType: 'audio/mpeg',
    };
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw new HttpsError('internal', 'Error generando audio');
  }
});

// ============================================================
// FUNCIÓN: Obtener videos por búsqueda
// ============================================================
export const searchVideos = onCall(async (request) => {
  const { query, category, transactionType, limit = 20, lastDocId } = request.data;

  try {
    let firestoreQuery: admin.firestore.Query = db.collection('videos')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (category) {
      firestoreQuery = firestoreQuery.where('category', '==', category);
    }
    if (transactionType) {
      firestoreQuery = firestoreQuery.where('transactionType', '==', transactionType);
    }
    if (lastDocId) {
      const lastDoc = await db.collection('videos').doc(lastDocId).get();
      if (lastDoc.exists) {
        firestoreQuery = firestoreQuery.startAfter(lastDoc);
      }
    }

    const snapshot = await firestoreQuery.get();
    let videos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      videos = videos.filter((video: any) =>
        searchTerms.some(
          (term: string) =>
            video.title?.toLowerCase().includes(term) ||
            video.description?.toLowerCase().includes(term) ||
            video.tags?.some((tag: string) => tag.toLowerCase().includes(term))
        )
      );
    }

    return {
      videos,
      lastDocId: snapshot.docs[snapshot.docs.length - 1]?.id || null,
      hasMore: snapshot.docs.length === limit,
    };
  } catch (error) {
    console.error('Error searching videos:', error);
    throw new HttpsError('internal', 'Error buscando videos');
  }
});

// ============================================================
// FUNCIÓN: Subir video (procesamiento server-side)
// ============================================================
export const processVideoUpload = onCall(async (request) => {
  const { videoData } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  if (!videoData) {
    throw new HttpsError('invalid-argument', 'Datos de video requeridos');
  }

  try {
    const videoId = `${userId}_${Date.now()}`;

    await db.collection('videos').doc(videoId).set({
      id: videoId,
      userId,
      ...videoData,
      views: 0,
      likes: 0,
      shares: 0,
      comments: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      ),
    });

    return { videoId, success: true };
  } catch (error) {
    console.error('Error processing video:', error);
    throw new HttpsError('internal', 'Error procesando video');
  }
});

// ============================================================
// FUNCIÓN: Eliminar video (con limpieza de storage)
// ============================================================
export const deleteVideo = onCall(async (request) => {
  const { videoId } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  if (!videoId) {
    throw new HttpsError('invalid-argument', 'ID de video requerido');
  }

  try {
    const videoDoc = await db.collection('videos').doc(videoId).get();
    if (!videoDoc.exists) {
      throw new HttpsError('not-found', 'Video no encontrado');
    }

    const videoData = videoDoc.data()!;
    if (videoData.userId !== userId) {
      throw new HttpsError('permission-denied', 'No autorizado para eliminar este video');
    }

    if (videoData.videoURL) {
      try {
        const fileRef = storage.bucket().file(decodeURIComponent(
          videoData.videoURL.split('/o/')[1]?.split('?')[0] || ''
        ));
        await fileRef.delete();
      } catch (e) {
        console.warn('Error deleting video file:', e);
      }
    }

    if (videoData.thumbnailURL) {
      try {
        const thumbRef = storage.bucket().file(decodeURIComponent(
          videoData.thumbnailURL.split('/o/')[1]?.split('?')[0] || ''
        ));
        await thumbRef.delete();
      } catch (e) {
        console.warn('Error deleting thumbnail:', e);
      }
    }

    await db.collection('videos').doc(videoId).delete();

    return { success: true };
  } catch (error) {
    console.error('Error deleting video:', error);
    throw new HttpsError('internal', 'Error eliminando video');
  }
});

// ============================================================
// TRIGGER: Al crear usuario, crear documento en Firestore
// ============================================================
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Usuario PANA',
    photoURL: user.photoURL || null,
    phoneNumber: user.phoneNumber || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isBusiness: false,
    businessType: 'AMBOS',
    followersCount: 0,
    followingCount: 0,
  });
});

// ============================================================
// TRIGGER: Al eliminar usuario, limpiar datos
// ============================================================
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const batch = db.batch();

  const videosSnapshot = await db.collection('videos')
    .where('userId', '==', user.uid)
    .get();

  videosSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  batch.delete(db.collection('users').doc(user.uid));

  await batch.commit();
});

// ============================================================
// FUNCIÓN PROGRAMADA: Limpiar videos expirados (diario)
// ============================================================
export const cleanExpiredVideos = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/Caracas')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const expiredSnapshot = await db.collection('videos')
      .where('expiresAt', '<', now)
      .where('isActive', '==', true)
      .get();

    const batch = db.batch();
    expiredSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
    console.log(`Cleaned ${expiredSnapshot.docs.length} expired videos`);
  });
