"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const admin = __importStar(require("firebase-admin"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();
const storage = admin.storage();
const PORT = process.env.PORT || 3001;
const apiKey = () => process.env.OPENAI_API_KEY || '';
function requireAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No autorizado');
    }
    return authHeader.split('Bearer ')[1];
}
async function verifyToken(token) {
    return await admin.auth().verifyIdToken(token);
}
app.post('/api/ai/message', async (req, res) => {
    var _a, _b;
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
        const aiResponse = ((_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '¡Epa pana! No entendí bien, ¿puedes repetirlo?';
        res.json({
            text: aiResponse,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error procesando el mensaje' });
    }
});
app.post('/api/audio/transcribe', async (req, res) => {
    var _a, _b, _c, _d;
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
        const transcription = ((_a = response.results) === null || _a === void 0 ? void 0 : _a.map((result) => { var _a; return (_a = result.alternatives[0]) === null || _a === void 0 ? void 0 : _a.transcript; }).join(' ')) || '';
        res.json({
            text: transcription,
            confidence: ((_d = (_c = (_b = response.results) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.alternatives[0]) === null || _d === void 0 ? void 0 : _d.confidence) || 0,
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error transcribiendo audio' });
    }
});
app.post('/api/audio/synthesize', async (req, res) => {
    var _a;
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
            audioBase64: (_a = response.audioContent) === null || _a === void 0 ? void 0 : _a.toString('base64'),
            contentType: 'audio/mpeg',
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error generando audio' });
    }
});
app.get('/api/videos/search', async (req, res) => {
    var _a;
    try {
        const { query, category, transactionType, limit = '20', lastDocId } = req.query;
        let firestoreQuery = db.collection('videos')
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
            videos = videos.filter((video) => searchTerms.some((term) => {
                var _a, _b, _c;
                return ((_a = video.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(term)) ||
                    ((_b = video.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(term)) ||
                    ((_c = video.tags) === null || _c === void 0 ? void 0 : _c.some((tag) => tag.toLowerCase().includes(term)));
            }));
        }
        res.json({
            videos,
            lastDocId: ((_a = snapshot.docs[snapshot.docs.length - 1]) === null || _a === void 0 ? void 0 : _a.id) || null,
            hasMore: snapshot.docs.length === Number(limit),
        });
    }
    catch (error) {
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
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        });
        res.json({ videoId, success: true });
    }
    catch (error) {
        if (error.message === 'No autorizado') {
            return res.status(401).json({ error: 'Debes iniciar sesión' });
        }
        console.error('Error:', error);
        res.status(500).json({ error: 'Error procesando video' });
    }
});
app.delete('/api/videos/:videoId', async (req, res) => {
    var _a, _b;
    try {
        const token = requireAuth(req);
        const decoded = await verifyToken(token);
        const { videoId } = req.params;
        const videoDoc = await db.collection('videos').doc(videoId).get();
        if (!videoDoc.exists) {
            return res.status(404).json({ error: 'Video no encontrado' });
        }
        const videoData = videoDoc.data();
        if (videoData.userId !== decoded.uid) {
            return res.status(403).json({ error: 'No autorizado para eliminar este video' });
        }
        if (videoData.videoURL) {
            try {
                const fileRef = storage.bucket().file(decodeURIComponent(((_a = videoData.videoURL.split('/o/')[1]) === null || _a === void 0 ? void 0 : _a.split('?')[0]) || ''));
                await fileRef.delete();
            }
            catch (e) {
                console.warn('Error deleting video file:', e);
            }
        }
        if (videoData.thumbnailURL) {
            try {
                const thumbRef = storage.bucket().file(decodeURIComponent(((_b = videoData.thumbnailURL.split('/o/')[1]) === null || _b === void 0 ? void 0 : _b.split('?')[0]) || ''));
                await thumbRef.delete();
            }
            catch (e) {
                console.warn('Error deleting thumbnail:', e);
            }
        }
        await db.collection('videos').doc(videoId).delete();
        res.json({ success: true });
    }
    catch (error) {
        if (error.message === 'No autorizado') {
            return res.status(401).json({ error: 'Debes iniciar sesión' });
        }
        console.error('Error:', error);
        res.status(500).json({ error: 'Error eliminando video' });
    }
});
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0-beta.1' });
});
app.listen(PORT, () => {
    console.log(`PANA API server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map