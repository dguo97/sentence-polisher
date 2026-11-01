import * as Clipboard from 'expo-clipboard';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';

type Tone =
  | 'Natural and conversational'
  | 'Simple and clear'
  | 'Close to original wording'
  | 'Concise'
  | 'Slightly stronger and more confident'
  | 'Reflective and thoughtful';

type PolishResult = {
  tone: Tone;
  polished: string;
  note: string;
};

const tones: Tone[] = [
  'Natural and conversational',
  'Simple and clear',
  'Close to original wording',
  'Concise',
  'Slightly stronger and more confident',
  'Reflective and thoughtful',
];

// Fake data for now. Later, replace the body of this function with a real API call.
async function polishSentence(text: string): Promise<PolishResult[]> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const trimmedText = text.trim();
  return tones.map((tone) => ({
    tone,
    polished: `${tone}: ${trimmedText}`,
    note: `Adjusted the wording to feel ${tone.toLowerCase()}.`,
  }));
}

export default function PolishScreen() {
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PolishResult[] | null>(null);
  const [error, setError] = useState('');
  const [copyErrorTone, setCopyErrorTone] = useState<Tone | null>(null);
  const [copiedTone, setCopiedTone] = useState<Tone | null>(null);
  const requestId = useRef(0);

  async function handlePolish() {
    const sentence = text.trim();
    if (!sentence) return;

    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError('');
    setCopyErrorTone(null);
    setCopiedTone(null);
    setResults(null);

    try {
      const nextResults = await polishSentence(sentence);
      if (currentRequestId === requestId.current) {
        setResults(nextResults);
      }
    } catch {
      if (currentRequestId === requestId.current) {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }

  async function handleCopy(result: PolishResult) {
    try {
      await Clipboard.setStringAsync(result.polished);
      setCopyErrorTone(null);
      setCopiedTone(result.tone);
    } catch {
      setCopiedTone(null);
      setCopyErrorTone(result.tone);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Polish</ThemedText>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a sentence to polish"
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
            style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
          />

          <Pressable
            onPress={handlePolish}
            disabled={loading || !text.trim()}
            style={({ pressed }) => [
              styles.button,
              (pressed || loading || !text.trim()) && { opacity: 0.6 },
            ]}>
            <ThemedText style={styles.buttonText}>Polish</ThemedText>
          </Pressable>

          {loading && <ActivityIndicator style={styles.spinner} />}
          {!!error && <ThemedText>{error}</ThemedText>}

          {results?.map((result) => (
            <ThemedView key={result.tone} type="backgroundElement" style={styles.card}>
              <ThemedText type="subtitle">{result.tone}</ThemedText>
              <ThemedText>{result.polished}</ThemedText>

              <ThemedText style={styles.label}>What changed</ThemedText>
              <ThemedText type="small">{result.note}</ThemedText>

              <Pressable onPress={() => handleCopy(result)} style={styles.copyButton}>
                <ThemedText type="link">
                  {copiedTone === result.tone ? 'Copied' : 'Copy'}
                </ThemedText>
              </Pressable>
              {copyErrorTone === result.tone && (
                <ThemedText>Could not copy the polished text.</ThemedText>
              )}
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: BottomTabInset + 24,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  label: {
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  spinner: {
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  copyButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});
