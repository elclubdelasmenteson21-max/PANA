export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  isBusiness: boolean;
  businessType: 'AMBOS' | 'COMPRA' | 'VENTA';
  state: string;
  city: string;
  followersCount: number;
  followingCount: number;
}

export interface Video {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  videoURL: string;
  thumbnailURL?: string;
  description: string;
  tags: string[];
  businessType: 'AMBOS' | 'COMPRA' | 'VENTA';
  category: string;
  price?: number;
  currency?: string;
  location?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
}

export interface AIRequest {
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AIResponse {
  text: string;
  audio?: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
  AI: undefined;
};

export type MainTabParamList = {
  AI: undefined;
  Home: undefined;
  Upload: undefined;
  Gallery: undefined;
  Profile: undefined;
};
