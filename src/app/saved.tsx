import * as Speech from 'expo-speech';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { getSavedWords, removeSavedWord, type WordResult } from '@/utils/saved-words';

export default function SavedScreen() {
  const [savedWords, setSavedWords] = useState<WordResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSavedWords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSavedWords(await getSavedWords());
    } catch {
      setError('Could not load your saved words.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSavedWords();
    }, [loadSavedWords]),
  );

  async function handleRemove(word: string) {
    try {
      await removeSavedWord(word);
      setSavedWords((currentWords) =>
        currentWords.filter(
          (savedWord) => savedWord.word.toLowerCase() !== word.toLowerCase(),
        ),
      );
    } catch {
      setError('Could not remove that saved word.');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Saved</ThemedText>
          {loading && <ActivityIndicator style={styles.spinner} />}
          {!!error && <ThemedText>{error}</ThemedText>}
          {!loading && !error && savedWords.length === 0 && (
            <ThemedText themeColor="textSecondary">
              Words you save from Dictionary will appear here.
            </ThemedText>
          )}

          {savedWords.map((result) => (
            <ThemedView key={result.word.toLowerCase()} type="backgroundElement" style={styles.card}>
              <ThemedView style={styles.wordHeader}>
                <ThemedText type="subtitle">{result.word}</ThemedText>
                <Pressable
                  onPress={() => handleRemove(result.word)}
                  accessibilityLabel={`Remove ${result.word} from saved words`}>
                  <ThemedText style={styles.remove}>Remove</ThemedText>
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
              {result.examples.map((example, index) => (
                <ThemedText key={index}>• {example}</ThemedText>
              ))}
              <ThemedText style={styles.label}>Synonyms</ThemedText>
              <ThemedText>{result.synonyms.join(', ')}</ThemedText>
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
  remove: {
    color: '#c0392b',
  },
  label: {
    marginTop: 10,
    fontWeight: '700',
  },
});
