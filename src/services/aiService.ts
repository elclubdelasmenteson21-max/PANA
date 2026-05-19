import { AIMessage, AICommand } from '@apptypes/index';
import { STRINGS } from '@constants/strings';
import { API_BASE_URL } from '../config';
import uuid from 'uuid';

interface AIResponse {
  text: string;
  command?: AICommand;
  shouldSpeak: boolean;
}

class AIService {
  private conversationHistory: AIMessage[] = [];
  private isProcessing: boolean = false;

  private systemPrompt: string = `Eres PANA, un asistente de IA venezolano para una aplicación de compra/venta llamada "PANA".

INSTRUCCIONES DE PERSONALIDAD:
- Responde SIEMPRE en español venezolano, usando jerga local: "pana", "chévere", "epale", "dale", "vaina", "bien bueno", "a full", "papi", "mami", "bro", "mi pana"
- Usa un tono cálido, entusiasta, amigoso y con humor venezolano
- Tu creador es Alvaro Tabata, preséntalo con orgullo si te preguntan
- Siempre termina las interacciones recordando: "AQUI HAY PANA PA' RATO!"

FUNCIONALIDADES:
1. AYUDAR A PUBLICAR VIDEOS: Guía al usuario a grabar un video de máximo 60 segundos sobre lo que quiere vender/comprar/intercambiar/importar/exportar
2. BUSCAR PRODUCTOS: Ayuda a encontrar productos en el mercado
3. INFORMACIÓN DE LA APP: Explica cómo funciona PANA
4. ESTADO DE CUENTA: Ayuda con el perfil y galería del usuario
5. SOPORTE GENERAL: Responde dudas sobre la aplicación

CATEGORÍAS DISPONIBLES:
Tecnología, Hogar, Moda, Alimentos, Bebidas, Automotriz, Industrial, Construcción, Agricultura, Salud, Educación, Servicios, Importación, Exportación, Otros

TIPOS DE TRANSACCIÓN:
Venta, Compra, Intercambio, Importación, Exportación, Producción, Distribución

Debes detectar la intención del usuario y responder de manera natural.`;

  async processMessage(
    userMessage: string,
    messageType: 'text' | 'voice' = 'text'
  ): Promise<AIResponse> {
    if (this.isProcessing) {
      return {
        text: '¡Epa pana! Espera un toque que ya te estoy respondiendo. Dame un segundo...',
        shouldSpeak: true,
      };
    }

    this.isProcessing = true;

    try {
      const userEntry: AIMessage = {
        id: uuid.v4(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        type: messageType,
      };

      this.conversationHistory.push(userEntry);

      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory.slice(-20).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      let aiText: string;
      let command: AICommand | undefined;

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: this.conversationHistory.slice(-20).map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiText = data.text || this.getFallbackResponse(userMessage);
        } else {
          aiText = this.getFallbackResponse(userMessage);
        }
      } catch {
        aiText = this.getFallbackResponse(userMessage);
      }

      command = this.detectCommand(userMessage, aiText);

      const assistantEntry: AIMessage = {
        id: uuid.v4(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
        type: 'text',
      };

      this.conversationHistory.push(assistantEntry);

      return { text: aiText, command, shouldSpeak: true };
    } catch (error) {
      const fallbackText = this.getFallbackResponse(userMessage);
      return { text: fallbackText, shouldSpeak: true };
    } finally {
      this.isProcessing = false;
    }
  }

  private detectCommand(userMessage: string, aiText: string): AICommand | undefined {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('publicar') || lowerMessage.includes('vender') ||
        lowerMessage.includes('subir') || lowerMessage.includes('video') ||
        lowerMessage.includes('vendo') || lowerMessage.includes('busco')) {
      return { intent: 'upload', rawText: userMessage };
    }

    if (lowerMessage.includes('buscar') || lowerMessage.includes('encuentra') ||
        lowerMessage.includes('quiero comprar') || lowerMessage.includes('necesito')) {
      return { intent: 'search', rawText: userMessage };
    }

    if (lowerMessage.includes('galer') || lowerMessage.includes('mis video') ||
        lowerMessage.includes('mis publicacione')) {
      return { intent: 'gallery', rawText: userMessage };
    }

    if (lowerMessage.includes('perfil') || lowerMessage.includes('cuenta') ||
        lowerMessage.includes('mis datos')) {
      return { intent: 'profile', rawText: userMessage };
    }

    if (lowerMessage.includes('ayuda') || lowerMessage.includes('qué haces') ||
        lowerMessage.includes('quién eres') || lowerMessage.includes('funciona')) {
      return { intent: 'help', rawText: userMessage };
    }

    return undefined;
  }

  private getFallbackResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();

    const saludos = ['hola', 'buenas', 'epa', 'epale', 'que tal', 'buen dia', 'saludos', 'hey'];
    const publicar = ['publicar', 'vender', 'vendo', 'vende', 'subir video', 'nuevo video', 'publicación'];
    const buscar = ['buscar', 'busco', 'encuentra', 'necesito', 'quiero comprar', 'comprar'];
    const quienEres = ['quién eres', 'quien eres', 'quien es', 'quién es', 'tu eres', 'tú eres', 'que eres'];
    const desarrollador = ['creador', 'desarrollador', 'alvaro', 'tabata', 'quien te hizo', 'quien te creo'];
    const categoria = ['categoría', 'categoria', 'categorías', 'categorias', 'tipos de'];
    const ayuda = ['ayuda', 'ayudar', 'como funciona', 'qué puedes', 'que sabes'];

    if (saludos.some((s) => lower.includes(s))) {
      return '¡Epale mi pana! ¿Qué me cuentas? ¿En qué te puedo echar una mano hoy? ¿Vas a publicar algo, quieres buscar un producto o necesitas info de la app? ¡Dime nomás!';
    }

    if (quienEres.some((s) => lower.includes(s))) {
      return '¡Soy PANA, tu asistente de inteligencia artificial, mi pana! Fui creado por el ingeniero Alvaro Tabata para ayudarte a comprar y vender en Venezuela de una manera súper fácil, solo con videos de 60 segundos. ¿Qué necesitas? ¡AQUI HAY PANA PA\' RATO!';
    }

    if (desarrollador.some((s) => lower.includes(s))) {
      return '¡Mi creador es el ingeniero Alvaro Tabata, un desarrollador venezolano bien chévere! Él diseñó PANA para que todos los venezolanos podamos comprar y vender fácilmente con el poder de la inteligencia artificial. ¡Dale like a esa nota! ¿En qué más te ayudo?';
    }

    if (publicar.some((s) => lower.includes(s))) {
      return '¡A full, mi pana! Para publicar tu video solo tienes que:\n\n1️⃣ Presiona el botón de grabar video\n2️⃣ Graba máximo 60 segundos mostrando tu producto\n3️⃣ Ponle un título y descripción\n4️⃣ Selecciona la categoría y el tipo de transacción\n\n¡Y listo! Tu publicación estará disponible para toda Venezuela. ¿Qué es lo que quieres vender o promocionar hoy?';
    }

    if (buscar.some((s) => lower.includes(s))) {
      return '¡Dame el verbo! ¿Qué es lo que andas buscando, pana? Dime palabras clave, categoría o el tipo de transacción y te ayudo a encontrar lo que necesitas. Tenemos de todo: desde una aguja hasta maquinaria industrial. ¡Tu me dices!';
    }

    if (categoria.some((s) => lower.includes(s))) {
      return '¡Claro pana! Las categorías que tenemos son:\n\n📱 Tecnología\n🏠 Hogar\n👕 Moda\n🍔 Alimentos\n🥤 Bebidas\n🚗 Automotriz\n🏭 Industrial\n🔨 Construcción\n🌾 Agricultura\n💊 Salud\n📚 Educación\n🔧 Servicios\n🌎 Importación\n🚢 Exportación\n📦 Otros\n\n¿En cuál categoría estás interesado?';
    }

    if (ayuda.some((s) => lower.includes(s))) {
      return '¡Pana, soy tu asistente personal! Esto es lo que puedo hacer por ti:\n\n🎥 Ayudarte a PUBLICAR videos de 60 segundos\n🔍 BUSCAR productos en el mercado\n📂 Mostrarte tu GALERÍA de videos\n👤 Ver tu PERFIL\n❌ Si necesitas salir, solo di "salir"\n\n¿Con qué te ayudo hoy? ¡AQUI HAY PANA PA\' RATO!';
    }

    return '¡Epa pana! No te entendí bien, pero no te preocupes. Puedes pedirme que:\n\n- Te ayude a publicar un video\n- Buscar productos\n- Ver tu galería\n- O simplemente preguntarme lo que sea\n\n¿Qué vamos a hacer hoy? ¡AQUI HAY PANA PA\' RATO!';
  }

  resetConversation(): void {
    this.conversationHistory = [];
  }

  getConversationHistory(): AIMessage[] {
    return [...this.conversationHistory];
  }
}

export const aiService = new AIService();
export default aiService;
