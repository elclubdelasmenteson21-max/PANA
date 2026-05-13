# PANA - Tu Mercado con Inteligencia Artificial

**Version:** 1.0.0 Beta  
**Desarrollador:** Alvaro Tabata  
**Tagline:** ¡AQUI HAY PANA PA' RATO!

## Descripción

PANA es una aplicación Android controlada por Inteligencia Artificial para negocios B2B y B2C en Venezuela. Los usuarios pueden publicar videos de máximo 60 segundos sobre lo que venden, producen, comercializan, importan o exportan.

### Diferenciadores clave
- **Control por IA:** Interfaz controlada por voz y texto con IA generativa
- **Solo videos:** Publicaciones únicamente en formato video (60s máx)
- **Cultura venezolana:** IA responde en español venezolano
- **Nube:** Videos guardados en la nube, acceso desde galería personal
- **Gratuito:** Versión beta completamente gratis

## Stack Tecnológico

### Frontend
- **Framework:** React Native 0.73 + TypeScript
- **Navegación:** React Navigation (Stack + Bottom Tabs)
- **Animaciones:** React Native Reanimated
- **Video:** react-native-video + react-native-image-picker
- **Voz:** react-native-voice (STT) + react-native-tts (TTS)
- **Estado:** Zustand + React Context
- **Estilos:** StyleSheet + LinearGradient

### Backend
- **Plataforma:** Firebase (Auth, Firestore, Storage, Functions)
- **Cloud Functions:** Node.js 18 + TypeScript
- **AI:** OpenAI GPT-4 + Google Cloud Speech/TTS
- **Base de datos:** Firestore (NoSQL) + índices compuestos

### Servicios Externos
- OpenAI GPT-4 (IA conversacional venezolana)
- Google Cloud Speech-to-Text (voz a texto)
- Google Cloud Text-to-Speech (texto a voz)
- Firebase Storage (videos en la nube)

## Estructura del Proyecto

```
PANA/
├── src/
│   ├── screens/          # Pantallas de la app
│   │   ├── SplashScreen.tsx    # Pantalla líquida con aro pulsante
│   │   ├── AIScreen.tsx        # Interfaz principal de IA
│   │   ├── LoginScreen.tsx     # Inicio de sesión
│   │   ├── RegisterScreen.tsx  # Registro
│   │   ├── HomeScreen.tsx      # Feed de videos
│   │   ├── UploadScreen.tsx    # Subir video
│   │   ├── GalleryScreen.tsx   # Galería personal
│   │   └── ProfileScreen.tsx   # Perfil de usuario
│   ├── components/       # Componentes reutilizables
│   │   └── VideoCard.tsx       # Tarjeta de video
│   ├── services/         # Servicios y APIs
│   │   ├── firebase.ts         # Firebase CRUD
│   │   ├── aiService.ts        # IA conversacional
│   │   └── voiceService.ts     # Voz STT/TTS
│   ├── navigation/       # Configuración de navegación
│   │   └── AppNavigator.tsx
│   ├── context/          # Contextos (Auth)
│   │   └── AuthContext.tsx
│   ├── types/            # Tipos TypeScript
│   │   └── index.ts
│   └── constants/        # Temas y textos
│       ├── theme.ts            # Colores, tamaños, animaciones
│       └── strings.ts          # Textos de la app
├── backend/
│   ├── functions/        # Firebase Cloud Functions
│   │   └── src/
│   │       └── index.ts        # Todas las cloud functions
│   ├── firestore.rules         # Reglas de seguridad
│   ├── storage.rules           # Reglas de storage
│   └── firestore.indexes.json  # Índices de Firestore
├── App.tsx               # Entry point
├── index.js              # Registro de app
├── package.json          # Dependencias
└── tsconfig.json         # Config TypeScript
```

## Instalación

### Prerrequisitos
- Node.js >= 18
- React Native CLI
- Android Studio (para Android)
- Firebase CLI (`npm install -g firebase-tools`)
- Cuenta de OpenAI (para IA)
- Cuenta de Google Cloud (para voz)

### Pasos

```bash
# 1. Clonar e instalar dependencias
cd PANA
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus keys de Firebase, OpenAI y Google Cloud

# 3. Configurar Firebase
firebase login
firebase init
# Seleccionar: Firestore, Functions, Storage, Emulators

# 4. Desplegar Cloud Functions (cuando esté listo)
cd backend/functions
npm install
npm run build
cd ../..
firebase deploy --only functions

# 5. Ejecutar en Android
npx react-native run-android
```

### Para desarrollo con emuladores Firebase

```bash
# Terminal 1: Iniciar app React Native
npx react-native start

# Terminal 2: Iniciar emuladores Firebase
cd backend
firebase emulators:start
```

## Configuración de Firebase

### Colecciones en Firestore

```
users/{userId}
  ├── uid: string
  ├── email: string
  ├── displayName: string
  ├── photoURL: string?
  ├── isBusiness: boolean
  ├── businessType: "B2B" | "B2C" | "AMBOS"
  ├── followersCount: number
  └── followingCount: number

videos/{videoId}
  ├── id: string
  ├── userId: string
  ├── title: string
  ├── description: string
  ├── videoURL: string
  ├── thumbnailURL: string
  ├── category: string
  ├── transactionType: string
  ├── price: number?
  ├── currency: "Bs" | "USD" | "EUR"
  ├── location: string
  ├── views: number
  ├── likes: number
  ├── isActive: boolean
  ├── createdAt: timestamp
  └── expiresAt: timestamp?
```

## Funcionalidades por Pantalla

### 🎯 Splash Screen / Pantalla de Inicio
- Fondo líquido negro intenso con animación ondulante
- Aro circular naranja intenso palpitando (efecto corazón)
- Texto "PANA" en el centro, palpita sincronizado
- Al pulsar: activa la IA con saludo venezolano

### 🤖 AI Screen (Pantalla principal)
- Chat con IA que responde en venezolano
- Entrada por TEXTO y por VOZ
- La IA detecta intenciones: publicar, buscar, galería, perfil
- Comandos de voz activan navegación automática

### 📹 Upload Screen
- Grabar video (cámara) o seleccionar de galería
- Validación: máximo 60 segundos
- Formulario: título, descripción, categoría, tipo de transacción
- Precio en Bs, USD o EUR

### 🏠 Home Screen
- Feed de videos con scroll infinito
- Filtros por categoría
- Tarjetas de video con reproducción, likes, vistas

### 🖼️ Gallery Screen
- Galería personal del usuario (vista grid/lista)
- Todos los videos del usuario almacenados en la nube
- Acceso permanente a las publicaciones

## Licencia

Beta - Todos los derechos reservados © 2024 Alvaro Tabata

---

**¡AQUI HAY PANA PA' RATO!**
