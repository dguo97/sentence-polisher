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
  polishedText: string;
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
async function polishSentence(text: string, tone: Tone): Promise<PolishResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const trimmedText = text.trim();
  const polishedText = `${trimmedText.replace(/[.!?]*$/, '')}.`;

  return {
    polishedText,
    note: `Adjusted the wording to feel ${tone.toLowerCase()}.`,
  };
}

export default function PolishScreen() {
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');
  const [tone, setTone] = useState<Tone>('Natural and conversational');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolishResult | null>(null);
  const [error, setError] = useState('');
  const [copyError, setCopyError] = useState('');
  const [copied, setCopied] = useState(false);
  const requestId = useRef(0);

  async function handlePolish() {
    const sentence = text.trim();
    if (!sentence) return;

    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError('');
    setCopyError('');
    setCopied(false);
    setResult(null);

    try {
      const nextResult = await polishSentence(sentence, tone);
      if (currentRequestId === requestId.current) {
        setResult(nextResult);
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

  async function handleCopy() {
    if (!result) return;

    try {
      await Clipboard.setStringAsync(result.polishedText);
      setCopyError('');
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError('Could not copy the polished text.');
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

          <ThemedText style={styles.label}>Tone</ThemedText>
          <ThemedView type="backgroundElement" style={styles.toneSelector}>
            {tones.map((option) => (
              <Pressable
                key={option}
                onPress={() => setTone(option)}
                style={[styles.toneOption, tone === option && styles.selectedTone]}>
                <ThemedText style={tone === option ? styles.selectedToneText : undefined}>
                  {option}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>

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

          {result && !loading && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="subtitle">Polished sentence</ThemedText>
              <ThemedText>{result.polishedText}</ThemedText>

              <ThemedText style={styles.label}>What changed</ThemedText>
              <ThemedText type="small">{result.note}</ThemedText>

              <Pressable onPress={handleCopy} style={styles.copyButton}>
                <ThemedText type="link">{copied ? 'Copied' : 'Copy'}</ThemedText>
              </Pressable>
              {!!copyError && <ThemedText>{copyError}</ThemedText>}
            </ThemedView>
          )}
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
  toneSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toneOption: {
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedTone: {
    backgroundColor: '#2f6fed',
  },
  selectedToneText: {
    color: '#fff',
    fontWeight: '600',
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
