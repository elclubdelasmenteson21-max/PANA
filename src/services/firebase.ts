import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let app: firebase.FirebaseApp;

try {
  app = firebase.initializeApp(firebaseConfig);
} catch (error) {
  app = firebase.app();
}

export const FIREBASE_AUTH = auth;
export const FIREBASE_STORE = firestore;
export const FIREBASE_STORAGE = storage;
export const FIREBASE_FUNCTIONS = functions;

export const db = firestore();
export const rtdb = firebase.database?.();

export const AuthService = {
  register: async (email: string, password: string, displayName: string) => {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
    await db.collection('users').doc(result.user.uid).set({
      uid: result.user.uid,
      email,
      displayName,
      createdAt: firestore.FieldValue.serverTimestamp(),
      isBusiness: false,
      businessType: 'AMBOS',
      followersCount: 0,
      followingCount: 0,
    });
    return result.user;
  },

  login: async (email: string, password: string) => {
    const result = await auth().signInWithEmailAndPassword(email, password);
    return result.user;
  },

  logout: async () => {
    await auth().signOut();
  },

  getCurrentUser: () => {
    return auth().currentUser;
  },

  onAuthStateChanged: (callback: (user: any) => void) => {
    return auth().onAuthStateChanged(callback);
  },

  updateProfile: async (data: Partial<{ displayName: string; photoURL: string; phoneNumber: string }>) => {
    const user = auth().currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    await user.updateProfile(data);
    await db.collection('users').doc(user.uid).update(data);
  },
};

export const VideoService = {
  uploadVideo: async (userId: string, videoUri: string, thumbnailUri: string, data: any) => {
    const videoId = `${userId}_${Date.now()}`;
    const videoRef = storage().ref(`videos/${userId}/${videoId}.mp4`);
    const thumbRef = storage().ref(`thumbnails/${userId}/${videoId}.jpg`);

    await videoRef.putFile(videoUri);
    await thumbRef.putFile(thumbnailUri);

    const videoURL = await videoRef.getDownloadURL();
    const thumbnailURL = await thumbRef.getDownloadURL();

    await db.collection('videos').doc(videoId).set({
      id: videoId,
      userId,
      videoURL,
      thumbnailURL,
      ...data,
      views: 0,
      likes: 0,
      shares: 0,
      comments: [],
      isActive: true,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return videoId;
  },

  getVideos: async (lastVisible?: any, limit: number = 10) => {
    let query: any = db.collection('videos')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.get();
    const videos = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return { videos, lastVisible: snapshot.docs[snapshot.docs.length - 1] };
  },

  getUserVideos: async (userId: string) => {
    const snapshot = await db.collection('videos')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  },

  getVideoById: async (videoId: string) => {
    const doc = await db.collection('videos').doc(videoId).get();
    if (!doc.exists) throw new Error('Video no encontrado');
    return { id: doc.id, ...doc.data() };
  },

  deleteVideo: async (videoId: string, userId: string) => {
    const video = await db.collection('videos').doc(videoId).get();
    const data = video.data() as any;
    if (data.userId !== userId) throw new Error('No autorizado');

    const videoRef = storage().refFromURL(data.videoURL);
    const thumbRef = storage().refFromURL(data.thumbnailURL);

    await Promise.all([
      videoRef.delete(),
      thumbRef.delete(),
      db.collection('videos').doc(videoId).delete(),
    ]);
  },

  incrementViews: async (videoId: string) => {
    await db.collection('videos').doc(videoId).update({
      views: firestore.FieldValue.increment(1),
    });
  },

  toggleLike: async (videoId: string, userId: string) => {
    const videoRef = db.collection('videos').doc(videoId);
    const likeRef = db.collection('videos').doc(videoId).collection('likes').doc(userId);
    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      await Promise.all([
        likeRef.delete(),
        videoRef.update({ likes: firestore.FieldValue.increment(-1) }),
      ]);
      return false;
    } else {
      await Promise.all([
        likeRef.set({ userId, timestamp: firestore.FieldValue.serverTimestamp() }),
        videoRef.update({ likes: firestore.FieldValue.increment(1) }),
      ]);
      return true;
    }
  },
};

export const SearchService = {
  searchVideos: async (query: string, category?: string, transactionType?: string) => {
    let ref: any = db.collection('videos').where('isActive', '==', true);

    if (category) {
      ref = ref.where('category', '==', category);
    }
    if (transactionType) {
      ref = ref.where('transactionType', '==', transactionType);
    }

    const snapshot = await ref.get();
    let results = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const searchTerms = query.toLowerCase().split(' ');
    results = results.filter((video: any) =>
      searchTerms.some(
        (term: string) =>
          video.title?.toLowerCase().includes(term) ||
          video.description?.toLowerCase().includes(term) ||
          video.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      )
    );

    return results;
  },
};

export default firebase;
