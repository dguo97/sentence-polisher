import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WordResult } from '@/api';

export type { WordResult };

const SAVED_WORDS_KEY = '@word-polish/saved-words';

export async function getSavedWords(): Promise<WordResult[]> {
  try {
    return await readSavedWords();
  } catch {
    return [];
  }
}

async function readSavedWords(): Promise<WordResult[]> {
  const stored = await AsyncStorage.getItem(SAVED_WORDS_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved words data is invalid.');
  }

  return parsed as WordResult[];
}

export async function saveWord(word: WordResult): Promise<boolean> {
  try {
    const savedWords = await readSavedWords();
    const alreadySaved = savedWords.some(
      (savedWord) => savedWord.word.toLowerCase() === word.word.toLowerCase(),
    );
    if (alreadySaved) return true;

    await AsyncStorage.setItem(SAVED_WORDS_KEY, JSON.stringify([...savedWords, word]));
    return true;
  } catch {
    return false;
  }
}

export async function removeSavedWord(word: string): Promise<boolean> {
  try {
    const savedWords = await readSavedWords();
    const remainingWords = savedWords.filter(
      (savedWord) => savedWord.word.toLowerCase() !== word.toLowerCase(),
    );
    await AsyncStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(remainingWords));
    return true;
  } catch {
    return false;
  }
}
