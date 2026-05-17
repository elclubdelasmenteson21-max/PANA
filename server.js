const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const storage = admin.storage();

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.OPENAI_API_KEY || '';

function requireAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) throw new Error('No autorizado');
  return auth.split('Bearer ')[1];
}

async function verifyToken(token) {
  return await admin.auth().verifyIdToken(token);
}

app.post('/api/ai/message', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) return res.status(400).json({ error: 'El mensaje es requerido' });

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

    const systemPrompt = `Eres PANA, un asistente de IA venezolano...
INSTRUCCIONES DE PERSONALIDAD:
- Responde SIEMPRE en español venezolano
- Tu creador es Alvaro Tabata`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []).slice(-20),
        { role: 'user', content: message },
      ],
      temperature: 0.85, max_tokens: 300,
    });

    res.json({ text: completion.choices[0]?.message?.content || '¡Epa pana!', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error procesando el mensaje' });
  }
});

app.post('/api/audio/transcribe', async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'Audio es requerido' });

    const { SpeechClient } = require('@google-cloud/speech');
    const client = new SpeechClient();
    const [response] = await client.recognize({
      audio: { content: Buffer.from(audioBase64, 'base64').toString('base64') },
      config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'es-VE', model: 'latest_short' },
    });

    res.json({ text: response.results?.map(r => r.alternatives[0]?.transcript).join(' ') || '', confidence: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Error transcribiendo audio' });
  }
});

app.post('/api/audio/synthesize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto es requerido' });

    const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
    const client = new TextToSpeechClient();
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: 'es-VE', name: 'es-VE-Standard-A', ssmlGender: 'MALE' },
      audioConfig: { audioEncoding: 'MP3' },
    });

    res.json({ audioBase64: response.audioContent?.toString('base64'), contentType: 'audio/mpeg' });
  } catch (error) {
    res.status(500).json({ error: 'Error generando audio' });
  }
});

app.get('/api/videos/search', async (req, res) => {
  try {
    const { query, category, transactionType, limit = '20', lastDocId } = req.query;
    let q = db.collection('videos').where('isActive', '==', true).orderBy('createdAt', 'desc').limit(Number(limit));

    if (category) q = q.where('category', '==', category);
    if (transactionType) q = q.where('transactionType', '==', transactionType);

    const snapshot = await q.get();
    let videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (query) {
      const terms = query.toLowerCase().split(' ');
      videos = videos.filter(v => terms.some(t => v.title?.toLowerCase().includes(t) || v.description?.toLowerCase().includes(t)));
    }

    res.json({ videos, lastDocId: snapshot.docs[snapshot.docs.length - 1]?.id || null, hasMore: snapshot.docs.length === Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Error buscando videos' });
  }
});

app.post('/api/videos/upload', async (req, res) => {
  try {
    const decoded = await verifyToken(requireAuth(req));
    const { videoData } = req.body;
    if (!videoData) return res.status(400).json({ error: 'Datos de video requeridos' });

    const videoId = `${decoded.uid}_${Date.now()}`;
    await db.collection('videos').doc(videoId).set({
      id: videoId, userId: decoded.uid, ...videoData,
      views: 0, likes: 0, shares: 0, comments: [], isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    });

    res.json({ videoId, success: true });
  } catch (error) {
    if (error.message === 'No autorizado') return res.status(401).json({ error: 'Debes iniciar sesión' });
    res.status(500).json({ error: 'Error procesando video' });
  }
});

app.delete('/api/videos/:videoId', async (req, res) => {
  try {
    const decoded = await verifyToken(requireAuth(req));
    const doc = await db.collection('videos').doc(req.params.videoId).get();
    if (!doc.exists) return res.status(404).json({ error: 'No encontrado' });
    if (doc.data().userId !== decoded.uid) return res.status(403).json({ error: 'No autorizado' });

    const data = doc.data();
    if (data.videoURL) try { await storage.bucket().file(decodeURIComponent(data.videoURL.split('/o/')[1]?.split('?')[0] || '')).delete(); } catch (e) {}
    if (data.thumbnailURL) try { await storage.bucket().file(decodeURIComponent(data.thumbnailURL.split('/o/')[1]?.split('?')[0] || '')).delete(); } catch (e) {}
    await db.collection('videos').doc(req.params.videoId).delete();

    res.json({ success: true });
  } catch (error) {
    if (error.message === 'No autorizado') return res.status(401).json({ error: 'Debes iniciar sesión' });
    res.status(500).json({ error: 'Error eliminando video' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0-beta.1' }));

app.listen(PORT, () => console.log(`PANA API running on port ${PORT}`));
