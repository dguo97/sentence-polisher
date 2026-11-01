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
import { polishSentence, type PolishResult, type PolishVersion } from '@/api';

export default function PolishScreen() {
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PolishVersion[] | null>(null);
  const [fastMode, setFastMode] = useState(false);
  const [error, setError] = useState('');
  const [copyErrorTone, setCopyErrorTone] = useState<string | null>(null);
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
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
    setFastMode(false);

    try {
      const nextResult: PolishResult = await polishSentence(sentence);
      if (currentRequestId === requestId.current) {
        setResults(nextResult.versions);
        setFastMode(Boolean(nextResult.fastMode));
      }
    } catch (requestError) {
      if (currentRequestId === requestId.current) {
        setError(requestError instanceof Error ? requestError.message : String(requestError));
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }

  async function handleCopy(result: PolishVersion) {
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
          {results && fastMode && (
            <ThemedText type="small">Fast mode: double-check the grammar.</ThemedText>
          )}

          {results?.map((result) => (
            <ThemedView key={result.tone} type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.toneHeading}>{result.tone}</ThemedText>
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
    padding: 14,
    gap: 4,
  },
  toneHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  copyButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
