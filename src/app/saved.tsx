import * as Speech from 'expo-speech';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import type { WordResult } from '@/api';
import { getSavedWords, removeSavedWord } from '@/utils/saved-words';
import {
  clearHistory,
  getSentenceHistory,
  getWordHistory,
  type SentenceHistoryItem,
  type WordHistoryItem,
} from '@/utils/app-storage';

export default function SavedScreen() {
  const [view, setView] = useState<'saved' | 'history'>('saved');
  const [practising, setPractising] = useState(false);
  const [practiceDeck, setPracticeDeck] = useState<WordResult[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [savedWords, setSavedWords] = useState<WordResult[]>([]);
  const [wordHistory, setWordHistory] = useState<WordHistoryItem[]>([]);
  const [sentenceHistory, setSentenceHistory] = useState<SentenceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSavedWords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [nextSavedWords, nextWordHistory, nextSentenceHistory] = await Promise.all([
        getSavedWords(),
        getWordHistory(),
        getSentenceHistory(),
      ]);
      setSavedWords(nextSavedWords);
      setWordHistory(nextWordHistory);
      setSentenceHistory(nextSentenceHistory);
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

  function openWordHistory(item: WordHistoryItem) {
    router.push({ pathname: '/', params: { historyWord: item.word } });
  }

  function openSentenceHistory(item: SentenceHistoryItem) {
    router.push({
      pathname: '/explore',
      params: {
        historySentence: item.text,
        historyVersions: JSON.stringify(item.versions),
        historyFastMode: String(Boolean(item.fastMode)),
      },
    });
  }

  function confirmClearHistory() {
    Alert.alert('Clear history?', 'This will remove all dictionary and polish history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await clearHistory();
              setWordHistory([]);
              setSentenceHistory([]);
              setError('');
            } catch {
              setError('Could not clear history.');
            }
          })();
        },
      },
    ]);
  }

  function startPractice() {
    const shuffledWords = [...savedWords];
    for (let index = shuffledWords.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledWords[index], shuffledWords[swapIndex]] = [
        shuffledWords[swapIndex],
        shuffledWords[index],
      ];
    }
    setPracticeDeck(shuffledWords);
    setShowAnswer(false);
    setPractising(true);
  }

  function leavePractice() {
    setPractising(false);
    setPracticeDeck([]);
    setShowAnswer(false);
  }

  function handlePracticeAgain() {
    const [currentWord, ...remainingWords] = practiceDeck;
    if (!currentWord) return;
    setPracticeDeck([...remainingWords, currentWord]);
    setShowAnswer(false);
  }

  function handlePracticeGotIt() {
    setPracticeDeck((currentDeck) => currentDeck.slice(1));
    setShowAnswer(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Saved</ThemedText>
          <ThemedView style={styles.switch}>
            <Pressable
              onPress={() => setView('saved')}
              style={[styles.switchOption, view === 'saved' && styles.selectedSwitchOption]}>
              <ThemedText style={view === 'saved' ? styles.selectedSwitchText : undefined}>
                Saved
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setView('history')}
              style={[styles.switchOption, view === 'history' && styles.selectedSwitchOption]}>
              <ThemedText style={view === 'history' ? styles.selectedSwitchText : undefined}>
                History
              </ThemedText>
            </Pressable>
          </ThemedView>
          {loading && <ActivityIndicator style={styles.spinner} />}
          {!!error && <ThemedText>{error}</ThemedText>}
          {view === 'saved' && !practising && !loading && savedWords.length > 0 && (
            <Pressable onPress={startPractice} style={styles.practiceButton}>
              <ThemedText style={styles.buttonText}>Practise</ThemedText>
            </Pressable>
          )}
          {view === 'saved' && practising && !loading && (
            <ThemedView type="backgroundElement" style={styles.practiceCard}>
              {practiceDeck.length === 0 ? (
                <>
                  <ThemedText type="subtitle">Round complete</ThemedText>
                  <ThemedText themeColor="textSecondary">
                    You practised all the saved words in this round.
                  </ThemedText>
                  <Pressable onPress={leavePractice} style={styles.practiceButton}>
                    <ThemedText style={styles.buttonText}>Back to saved words</ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText type="subtitle">{practiceDeck[0].word}</ThemedText>
                  <ThemedView style={styles.pronunciationRow}>
                    <ThemedText type="small">{practiceDeck[0].pronunciation}</ThemedText>
                    <Pressable
                      onPress={() =>
                        Speech.speak(practiceDeck[0].word, { language: 'en-GB' })
                      }
                      accessibilityLabel={`Pronounce ${practiceDeck[0].word}`}>
                      <SymbolView
                        name={{
                          ios: 'speaker.wave.2.fill',
                          android: 'volume_up',
                          web: 'volume_up',
                        }}
                        size={20}
                      />
                    </Pressable>
                  </ThemedView>

                  {!showAnswer ? (
                    <Pressable onPress={() => setShowAnswer(true)} style={styles.practiceButton}>
                      <ThemedText style={styles.buttonText}>Show answer</ThemedText>
                    </Pressable>
                  ) : (
                    <>
                      <ThemedText style={styles.label}>Definition</ThemedText>
                      <ThemedText>{practiceDeck[0].definition}</ThemedText>
                      <ThemedText style={styles.label}>Examples</ThemedText>
                      {practiceDeck[0].examples.map((example, index) => (
                        <ThemedText key={index}>• {example}</ThemedText>
                      ))}
                      <ThemedText style={styles.label}>Synonyms</ThemedText>
                      <ThemedText>{practiceDeck[0].synonyms.join(', ')}</ThemedText>
                      <ThemedView style={styles.practiceActions}>
                        <Pressable
                          onPress={handlePracticeAgain}
                          style={styles.secondaryPracticeButton}>
                          <ThemedText>Again</ThemedText>
                        </Pressable>
                        <Pressable onPress={handlePracticeGotIt} style={styles.practiceButton}>
                          <ThemedText style={styles.buttonText}>Got it</ThemedText>
                        </Pressable>
                      </ThemedView>
                    </>
                  )}
                  <Pressable onPress={leavePractice} style={styles.backButton}>
                    <ThemedText type="link">Back to saved words</ThemedText>
                  </Pressable>
                </>
              )}
            </ThemedView>
          )}
          {view === 'saved' && !loading && !error && savedWords.length === 0 && (
            <ThemedText themeColor="textSecondary">
              Save some words from Dictionary to practise them here.
            </ThemedText>
          )}

          {view === 'saved' && !practising && savedWords.map((result) => (
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

          {view === 'history' && !loading && (
            <>
              <ThemedText type="subtitle">Words</ThemedText>
              {wordHistory.length === 0 && (
                <ThemedText themeColor="textSecondary">No word history yet.</ThemedText>
              )}
              {wordHistory.map((item) => (
                <Pressable key={`${item.word}-${item.time}`} onPress={() => openWordHistory(item)}>
                  <ThemedView type="backgroundElement" style={styles.historyRow}>
                    <ThemedText>{item.word}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {new Date(item.time).toLocaleString()}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}

              <ThemedText type="subtitle">Sentences</ThemedText>
              {sentenceHistory.length === 0 && (
                <ThemedText themeColor="textSecondary">No sentence history yet.</ThemedText>
              )}
              {sentenceHistory.map((item) => (
                <Pressable
                  key={`${item.text}-${item.time}`}
                  onPress={() => openSentenceHistory(item)}>
                  <ThemedView type="backgroundElement" style={styles.historyRow}>
                    <ThemedText>{item.text}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {new Date(item.time).toLocaleString()}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}

              <Pressable onPress={confirmClearHistory} style={styles.clearHistoryButton}>
                <ThemedText type="link">Clear history</ThemedText>
              </Pressable>
            </>
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
  switch: {
    flexDirection: 'row',
    gap: 8,
  },
  switchOption: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedSwitchOption: {
    backgroundColor: '#2f6fed',
  },
  selectedSwitchText: {
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
  historyRow: {
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  clearHistoryButton: {
    alignSelf: 'flex-start',
  },
  practiceButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  practiceCard: {
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  practiceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  secondaryPracticeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 4,
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
