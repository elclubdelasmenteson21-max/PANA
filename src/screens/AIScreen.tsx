import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES } from '@constants/theme';
import { VoiceService } from '@services/voice';
import { AIService } from '@services/ai';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AIScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: '¡Chevere mi PANA! ¿En qué puedo ayudarte hoy? Recuerda que aquí hay PANA pa\' rato.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const voiceService = VoiceService.getInstance();
  const aiService = AIService.getInstance();

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await aiService.sendMessage(inputText.trim());
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text || 'Entendido mi PANA, déjame procesar eso.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      voiceService.speak(aiMessage.text);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Disculpa mi PANA, hubo un error. Intenta de nuevo.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, aiService, voiceService]);

  const handleVoicePress = async () => {
    if (isListening) {
      await voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      await voiceService.startListening(
        (text) => {
          setInputText(text);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        },
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isUser ? styles.userRow : styles.aiRow]}>
      <LinearGradient
        colors={item.isUser ? ['#FF6B00', '#E06000'] : ['#2A2A2A', '#1A1A1A']}
        style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, item.isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
      </LinearGradient>
    </View>
  );

  return (
    <LinearGradient colors={['#000000', '#0A0A0A', '#1A0A00']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PANA IA</Text>
        <Text style={styles.headerSubtitle}>Tu asistente de negocios</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          inverted={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Habla con PANA IA..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={handleVoicePress}>
            <Text style={styles.voiceButtonText}>{isListening ? '◉' : '🎤'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing}>
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  headerSubtitle: { fontSize: SIZES.fontSmall, color: COLORS.textMuted, marginTop: 4 },
  content: { flex: 1 },
  messageList: { flex: 1 },
  messageListContent: { padding: SIZES.padding },
  messageRow: { marginVertical: 4 },
  userRow: { alignItems: 'flex-end' },
  aiRow: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    padding: SIZES.paddingSmall + 4,
    borderRadius: SIZES.radius,
  },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: SIZES.fontMedium, lineHeight: 20 },
  userText: { color: COLORS.text },
  aiText: { color: COLORS.text },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.paddingSmall,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: SIZES.fontMedium,
    paddingHorizontal: SIZES.paddingSmall,
    maxHeight: 100,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: { backgroundColor: COLORS.primary },
  voiceButtonText: { fontSize: 20 },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 18, color: COLORS.text },
});

export default AIScreen;
