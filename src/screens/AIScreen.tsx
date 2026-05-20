import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { COLORS, SIZES } from '@constants/theme';
import { STRINGS } from '@constants/strings';
import { AIMessage, AICommand } from '@apptypes/index';
import { getAiService } from '@services/aiService';
import { getVoiceService } from '@services/voiceService';
import SplashScreen from './SplashScreen';

const AIScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [isActivated, setIsActivated] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (isActivated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      const greeting: AIMessage = {
        id: 'greeting',
        role: 'assistant',
        content: STRINGS.aiGreeting,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([greeting]);
      getVoiceService().speak(greeting.content);
    }
  }, [isActivated, fadeAnim, slideAnim]);

  const handleActivate = useCallback(() => {
    setIsActivated(true);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');

    const userEntry: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userEntry]);
    setIsProcessing(true);

    try {
      const response = await getAiService().processMessage(userMessage, 'text');
      const assistantEntry: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        type: 'text',
      };

      setMessages((prev) => [...prev, assistantEntry]);

      if (response.shouldSpeak) {
        setIsSpeaking(true);
        await getVoiceService().speak(response.text);
        setIsSpeaking(false);
      }

      if (response.command) {
        handleAICommand(response.command);
      }
    } catch (error) {
      const errorEntry: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '¡Epa pana! Algo salió mal, pero no te preocupes. Inténtalo de nuevo.',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorEntry]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing]);

  const handleVoiceInput = useCallback(async () => {
    if (isListening) {
      await getVoiceService().stopListening();
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      await getVoiceService().startListening(
        async (text) => {
          setIsListening(false);
          if (text.trim()) {
            const userEntry: AIMessage = {
              id: Date.now().toString(),
              role: 'user',
              content: text,
              timestamp: new Date(),
              type: 'voice',
            };
            setMessages((prev) => [...prev, userEntry]);
            setIsProcessing(true);

            const response = await aiService.processMessage(text, 'voice');
            const assistantEntry: AIMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: response.text,
              timestamp: new Date(),
              type: 'text',
            };
            setMessages((prev) => [...prev, assistantEntry]);

            if (response.shouldSpeak) {
              setIsSpeaking(true);
              await getVoiceService().speak(response.text);
              setIsSpeaking(false);
            }

            if (response.command) {
              handleAICommand(response.command);
            }
            setIsProcessing(false);
          }
        },
        (error) => {
          setIsListening(false);
          console.warn('Voice error:', error);
        },
        (listening) => {
          setIsListening(listening);
        }
      );
    } catch (error) {
      setIsListening(false);
      Alert.alert('Error', 'No se pudo activar el micrófono. ¿Diste permisos?');
    }
  }, [isListening]);

  const handleAICommand = (command: AICommand) => {
    if (!navigation) return;

    switch (command.intent) {
      case 'upload':
        navigation.navigate('Upload');
        break;
      case 'search':
        navigation.navigate('Home');
        break;
      case 'gallery':
        navigation.navigate('Gallery');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'help':
        break;
    }
  };

  const renderMessage = ({ item }: { item: AIMessage }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      {item.role === 'assistant' && (
        <View style={styles.assistantHeader}>
          <Icon name="robot" size={16} color={COLORS.primary} />
          <Text style={styles.assistantName}>PANA IA</Text>
        </View>
      )}
      <Text
        style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText,
        ]}
      >
        {item.content}
      </Text>
      <Text style={styles.messageTime}>
        {item.timestamp.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  if (!isActivated) {
    return <SplashScreen onActivate={handleActivate} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Icon name="robot" size={28} color={COLORS.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>PANA IA</Text>
            <Text style={styles.headerSubtitle}>Siempre listo para ayudarte</Text>
          </View>
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <Icon name="volume-high" size={20} color={COLORS.primary} />
            </View>
          )}
        </View>
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="robot" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>¡Habla con PANA!</Text>
            <Text style={styles.emptySubtitle}>
              Puedes pedirme que publique un video, busque productos, o simplemente conversar
            </Text>
          </View>
        }
      />

      <Animated.View
        style={[
          styles.inputContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={handleVoiceInput}
          >
            <Icon
              name={isListening ? 'microphone' : 'microphone-outline'}
              size={24}
              color={isListening ? COLORS.white : COLORS.primary}
            />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Habla con PANA..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            multiline={false}
          />

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  speakingIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: SIZES.padding,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.surfaceLight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistantName: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  assistantText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
    opacity: 0.7,
  },
  inputContainer: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  voiceButtonActive: {
    backgroundColor: COLORS.primary,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 22,
    paddingHorizontal: 18,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

export default AIScreen;
