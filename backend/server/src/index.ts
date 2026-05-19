import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

let _firebaseReady = false;
let db: admin.firestore.Firestore = null as unknown as admin.firestore.Firestore;
let storage: admin.storage.Storage = null as unknown as admin.storage.Storage;
let auth: admin.auth.Auth = null as unknown as admin.auth.Auth;

try {
  const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (firebaseServiceAccount) {
    const tmpFile = path.join(os.tmpdir(), `firebase-sa-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, firebaseServiceAccount);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpFile;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    db = admin.firestore();
    storage = admin.storage();
    auth = admin.auth();
    _firebaseReady = true;
    console.log('Firebase Admin initialized');
  } else {
    console.warn('Firebase Admin not initialized - no credentials found');
  }
} catch (e) {
  console.warn('Firebase Admin init failed:', e);
}

const PORT = process.env.PORT || 3001;

const apiKey = (): string => process.env.OPENAI_API_KEY || '';

function requireAuth(req: express.Request): string | never {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No autorizado');
  }
  return authHeader.split('Bearer ')[1];
}

async function verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
  if (!_firebaseReady) throw new Error('Firebase Auth no disponible');
  return await auth.verifyIdToken(token);
}

app.post('/api/ai/message', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
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

    res.json({
      text: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error procesando el mensaje', details: error.message || String(error) });
  }
});

app.post('/api/audio/transcribe', async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio es requerido' });
    }

    const { SpeechClient } = require('@google-cloud/speech');
    const client = new SpeechClient();

    const [response] = await client.recognize({
      audio: { content: Buffer.from(audioBase64, 'base64').toString('base64') },
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

    res.json({
      text: transcription,
      confidence: response.results?.[0]?.alternatives[0]?.confidence || 0,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error transcribiendo audio' });
  }
});

app.post('/api/audio/synthesize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Texto es requerido' });
    }

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

    res.json({
      audioBase64: response.audioContent?.toString('base64'),
      contentType: 'audio/mpeg',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error generando audio' });
  }
});

app.get('/api/videos/search', async (req, res) => {
  try {
    const { query, category, transactionType, limit = '20', lastDocId } = req.query;

    let firestoreQuery: admin.firestore.Query = db.collection('videos')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(Number(limit));

    if (category) {
      firestoreQuery = firestoreQuery.where('category', '==', category);
    }
    if (transactionType) {
      firestoreQuery = firestoreQuery.where('transactionType', '==', transactionType);
    }
    if (lastDocId) {
      const lastDoc = await db.collection('videos').doc(lastDocId as string).get();
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
      const searchTerms = (query as string).toLowerCase().split(' ');
      videos = videos.filter((video: any) =>
        searchTerms.some(
          (term: string) =>
            video.title?.toLowerCase().includes(term) ||
            video.description?.toLowerCase().includes(term) ||
            video.tags?.some((tag: string) => tag.toLowerCase().includes(term))
        )
      );
    }

    res.json({
      videos,
      lastDocId: snapshot.docs[snapshot.docs.length - 1]?.id || null,
      hasMore: snapshot.docs.length === Number(limit),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error buscando videos' });
  }
});

app.post('/api/videos/upload', async (req, res) => {
  try {
    const token = requireAuth(req);
    const decoded = await verifyToken(token);
    const { videoData } = req.body;

    if (!videoData) {
      return res.status(400).json({ error: 'Datos de video requeridos' });
    }

    const videoId = `${decoded.uid}_${Date.now()}`;

    await db.collection('videos').doc(videoId).set({
      id: videoId,
      userId: decoded.uid,
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

    res.json({ videoId, success: true });
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return res.status(401).json({ error: 'Debes iniciar sesión' });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error procesando video' });
  }
});

app.delete('/api/videos/:videoId', async (req, res) => {
  try {
    const token = requireAuth(req);
    const decoded = await verifyToken(token);
    const { videoId } = req.params;

    const videoDoc = await db.collection('videos').doc(videoId).get();
    if (!videoDoc.exists) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    const videoData = videoDoc.data()!;
    if (videoData.userId !== decoded.uid) {
      return res.status(403).json({ error: 'No autorizado para eliminar este video' });
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

    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return res.status(401).json({ error: 'Debes iniciar sesión' });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error eliminando video' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, firebase: _firebaseReady, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`PANA API server running on port ${PORT}`);
});

export default app;
