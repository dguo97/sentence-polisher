import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { polishSentence, type PolishResult, type PolishVersion } from '@/api';
import {
  addSentenceHistory,
  getLastInput,
  setLastInput,
} from '@/utils/app-storage';
import { diffWords } from '@/utils/word-diff';

export default function PolishScreen() {
  const { historySentence, historyVersions, historyFastMode } = useLocalSearchParams<{
    historySentence?: string;
    historyVersions?: string;
    historyFastMode?: string;
  }>();
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PolishVersion[] | null>(null);
  const [fastMode, setFastMode] = useState(false);
  const [error, setError] = useState('');
  const [copyErrorTone, setCopyErrorTone] = useState<string | null>(null);
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
  const [showChanges, setShowChanges] = useState(true);
  const requestId = useRef(0);
  const inputHydrated = useRef(false);

  useEffect(() => {
    void getLastInput('polish').then((lastInput) => {
      setText(lastInput);
      inputHydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!inputHydrated.current) return;
    void setLastInput('polish', text);
  }, [text]);

  useEffect(() => {
    if (!historySentence || !historyVersions) return;

    const sentence = Array.isArray(historySentence) ? historySentence[0] : historySentence;
    const serializedVersions = Array.isArray(historyVersions)
      ? historyVersions[0]
      : historyVersions;
    try {
      const savedVersions = JSON.parse(serializedVersions) as PolishVersion[];
      if (!Array.isArray(savedVersions)) throw new Error('Invalid history.');
      setText(sentence);
      setResults(savedVersions);
      setFastMode(historyFastMode === 'true');
      setError('');
    } catch {
      setError('Could not open that sentence history.');
    }
  }, [historyFastMode, historySentence, historyVersions]);

  function clearPolish() {
    requestId.current += 1;
    setText('');
    setResults(null);
    setFastMode(false);
    setError('');
  }

  async function handlePaste() {
    try {
      setText(await Clipboard.getStringAsync());
    } catch {
      setError('Could not paste from the clipboard.');
    }
  }

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
        await addSentenceHistory(sentence, nextResult.versions, nextResult.fastMode);
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

          <ThemedView style={styles.utilityRow}>
            <Pressable onPress={handlePaste}>
              <ThemedText type="link">Paste</ThemedText>
            </Pressable>
            <Pressable onPress={clearPolish}>
              <ThemedText type="link">Clear</ThemedText>
            </Pressable>
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
          {results && fastMode && (
            <ThemedText type="small">Fast mode: double-check the grammar.</ThemedText>
          )}

          {results && (
            <ThemedView style={styles.changesToggle}>
              <ThemedText>Show changes</ThemedText>
              <Switch
                value={showChanges}
                onValueChange={setShowChanges}
                trackColor={{ false: '#888', true: '#2f6fed' }}
              />
            </ThemedView>
          )}

          {results?.map((result) => (
            <ThemedView key={result.tone} type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.toneHeading}>{result.tone}</ThemedText>
              <ThemedText>
                {diffWords(text, result.polished).map((token, index) =>
                  showChanges && token.changed ? (
                    <Text
                      key={`${index}-${token.text}`}
                      style={[
                        styles.changedWord,
                        { backgroundColor: isDark ? '#735c16' : '#fde68a' },
                      ]}>
                      {token.text}
                    </Text>
                  ) : (
                    token.text
                  ),
                )}
              </ThemedText>

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
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  changesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changedWord: {
    fontWeight: '700',
    borderRadius: 3,
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
