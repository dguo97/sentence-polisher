import * as Speech from 'expo-speech';
import { SymbolView } from 'expo-symbols';
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
import { saveWord, type WordResult, removeSavedWord, getSavedWords } from '@/utils/saved-words';

// Fake data for now. Later, replace the body of this function with a real API call.
async function lookupWord(word: string): Promise<WordResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    word,
    pronunciation: '/həˈləʊ/',
    partOfSpeech: 'noun',
    definition: 'This is a placeholder definition. The AI will write the real one.',
    examples: [
      `She looked up the word "${word}" in the dictionary.`,
      `He used "${word}" in a sentence to remember it.`,
    ],
    synonyms: ['example', 'sample', 'placeholder'],
  };
}

export default function DictionaryScreen() {
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  async function handleLookup() {
    const word = query.trim();
    if (!word) return;

    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const nextResult = await lookupWord(word);
      if (currentRequestId === requestId.current) {
        setResult(nextResult);
        const savedWords = await getSavedWords();
        setIsSaved(
          savedWords.some(
            (savedWord) => savedWord.word.toLowerCase() === nextResult.word.toLowerCase(),
          ),
        );
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

  async function handleSave() {
    if (!result) return;

    try {
      if (isSaved) {
        await removeSavedWord(result.word);
        setIsSaved(false);
      } else {
        await saveWord(result);
        setIsSaved(true);
      }
    } catch {
      setError('Could not update your saved words.');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Dictionary</ThemedText>

          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleLookup}
            placeholder="Type a word or phrase"
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
          />

          <Pressable
            onPress={handleLookup}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              (pressed || loading) && { opacity: 0.6 },
            ]}>
            <ThemedText style={styles.buttonText}>Look up</ThemedText>
          </Pressable>

          {loading && <ActivityIndicator style={styles.spinner} />}
          {!!error && <ThemedText>{error}</ThemedText>}

          {result && !loading && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedView style={styles.wordHeader}>
                <ThemedText type="subtitle">{result.word}</ThemedText>
                <Pressable onPress={handleSave} accessibilityLabel={isSaved ? 'Remove saved word' : 'Save word'}>
                  <ThemedText style={styles.star}>{isSaved ? '★' : '☆'}</ThemedText>
                </Pressable>
              </ThemedView>
              <ThemedView style={styles.pronunciationRow}>
                <ThemedText type="small">{result.pronunciation}</ThemedText>
                <Pressable
                  onPress={() => Speech.speak(result.word, { language: 'en-GB' })}
                  accessibilityLabel={`Pronounce ${result.word}`}>
                  <SymbolView
                    name={{ ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }}
                    size={20}
                  />
                </Pressable>
              </ThemedView>
              <ThemedText type="small">{result.partOfSpeech}</ThemedText>

              <ThemedText style={styles.label}>Definition</ThemedText>
              <ThemedText>{result.definition}</ThemedText>

              <ThemedText style={styles.label}>Examples</ThemedText>
              {result.examples.map((example, i) => (
                <ThemedText key={i}>• {example}</ThemedText>
              ))}

              <ThemedText style={styles.label}>Synonyms</ThemedText>
              <ThemedText>{result.synonyms.join(', ')}</ThemedText>
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
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
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
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  star: {
    fontSize: 28,
    color: '#e0a400',
  },
  label: {
    marginTop: 10,
    fontWeight: '700',
  },
});