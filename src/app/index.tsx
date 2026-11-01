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

type WordResult = {
  word: string;
  partOfSpeech: string;
  definition: string;
  examples: string[];
  synonyms: string[];
};

// Fake data for now. Later, replace the body of this function with a real API call.
async function lookupWord(word: string): Promise<WordResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    word,
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
              <ThemedText type="subtitle">{result.word}</ThemedText>
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
  label: {
    marginTop: 10,
    fontWeight: '700',
  },
});