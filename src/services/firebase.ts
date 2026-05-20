import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import { User } from '@apptypes/index';

export class AuthService {
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Usuario PANA',
          photoURL: firebaseUser.photoURL || undefined,
          phoneNumber: firebaseUser.phoneNumber || undefined,
          createdAt: new Date(),
          isBusiness: false,
          businessType: 'AMBOS',
          state: '',
          city: '',
          followersCount: 0,
          followingCount: 0,
        };
        callback(userData);
      } else {
        callback(null);
      }
    });
  }

  static async login(email: string, password: string) {
    await auth().signInWithEmailAndPassword(email, password);
  }

  static async register(email: string, password: string, displayName: string) {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
    return result;
  }

  static async logout() {
    await auth().signOut();
  }

  static getCurrentUser() {
    return auth().currentUser;
  }
}

export class FirestoreService {
  static async getDocument(collection: string, docId: string) {
    const doc = await firestore().collection(collection).doc(docId).get();
    return doc.data();
  }

  static async setDocument(collection: string, docId: string, data: any) {
    await firestore().collection(collection).doc(docId).set(data);
  }

  static async updateDocument(collection: string, docId: string, data: any) {
    await firestore().collection(collection).doc(docId).update(data);
  }

  static async deleteDocument(collection: string, docId: string) {
    await firestore().collection(collection).doc(docId).delete();
  }

  static async getCollection(collection: string) {
    const snapshot = await firestore().collection(collection).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async query(
    collection: string,
    field: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
  ) {
    const snapshot = await firestore()
      .collection(collection)
      .where(field, operator, value)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export class StorageService {
  static async uploadFile(path: string, uri: string) {
    const ref = storage().ref(path);
    await ref.putFile(uri);
    return await ref.getDownloadURL();
  }

  static async deleteFile(path: string) {
    await storage().ref(path).delete();
  }

  static async getDownloadURL(path: string) {
    return await storage().ref(path).getDownloadURL();
  }
}

export class FunctionsService {
  static async call(name: string, data?: any) {
    const result = await functions().httpsCallable(name)(data);
    return result.data;
  }
}
