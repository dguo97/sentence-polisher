import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WordResult } from '@/api';

export type { WordResult };

const SAVED_WORDS_KEY = '@word-polish/saved-words';

export async function getSavedWords(): Promise<WordResult[]> {
  const stored = await AsyncStorage.getItem(SAVED_WORDS_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved words data is invalid.');
  }

  return parsed as WordResult[];
}

export async function saveWord(word: WordResult): Promise<void> {
  const savedWords = await getSavedWords();
  const alreadySaved = savedWords.some(
    (savedWord) => savedWord.word.toLowerCase() === word.word.toLowerCase(),
  );
  if (alreadySaved) return;

  await AsyncStorage.setItem(SAVED_WORDS_KEY, JSON.stringify([...savedWords, word]));
}

export async function removeSavedWord(word: string): Promise<void> {
  const savedWords = await getSavedWords();
  const remainingWords = savedWords.filter(
    (savedWord) => savedWord.word.toLowerCase() !== word.toLowerCase(),
  );
  await AsyncStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(remainingWords));
}
