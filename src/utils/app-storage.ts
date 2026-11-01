import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PolishVersion, WordResult } from '@/api';

export type WordHistoryItem = {
  word: string;
  time: number;
};

export type SentenceHistoryItem = {
  text: string;
  versions: PolishVersion[];
  fastMode?: boolean;
  time: number;
};

type CachedWord = {
  key: string;
  result: WordResult;
  time: number;
};

const WORD_CACHE_KEY = '@word-polish/word-cache';
const WORD_HISTORY_KEY = '@word-polish/word-history';
const SENTENCE_HISTORY_KEY = '@word-polish/sentence-history';
const DICTIONARY_INPUT_KEY = '@word-polish/dictionary-input';
const POLISH_INPUT_KEY = '@word-polish/polish-input';

function normalizedWord(word: string): string {
  return word.trim().toLowerCase();
}

export async function getCachedWord(word: string): Promise<WordResult | null> {
  try {
    const stored = await AsyncStorage.getItem(WORD_CACHE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;

    const cached = parsed.find(
      (entry): entry is CachedWord =>
        typeof entry === 'object' &&
        entry !== null &&
        'key' in entry &&
        entry.key === normalizedWord(word) &&
        'result' in entry,
    );
    return cached?.result ?? null;
  } catch {
    return null;
  }
}

export async function cacheWord(word: string, result: WordResult): Promise<void> {
  if (/^Not found/i.test(result.definition.trim())) return;

  try {
    const stored = await AsyncStorage.getItem(WORD_CACHE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    const cached: CachedWord[] = Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is CachedWord =>
            typeof entry === 'object' &&
            entry !== null &&
            'key' in entry &&
            'result' in entry &&
            'time' in entry,
        )
      : [];
    const key = normalizedWord(word);
    const nextCache = [
      ...cached.filter((entry) => entry.key !== key),
      { key, result, time: Date.now() },
    ].slice(-300);
    await AsyncStorage.setItem(WORD_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // A cache failure should never prevent the lookup result from being shown.
  }
}

export async function addWordHistory(word: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(WORD_HISTORY_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    const history: WordHistoryItem[] = Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is WordHistoryItem =>
            typeof entry === 'object' &&
            entry !== null &&
            'word' in entry &&
            'time' in entry,
        )
      : [];
    const nextHistory = [
      { word: word.trim(), time: Date.now() },
      ...history.filter((entry) => normalizedWord(entry.word) !== normalizedWord(word)),
    ].slice(0, 100);
    await AsyncStorage.setItem(WORD_HISTORY_KEY, JSON.stringify(nextHistory));
  } catch {
    // History is optional and must not interrupt a lookup.
  }
}

export async function addSentenceHistory(
  text: string,
  versions: PolishVersion[],
  fastMode?: boolean,
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SENTENCE_HISTORY_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    const history: SentenceHistoryItem[] = Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is SentenceHistoryItem =>
            typeof entry === 'object' &&
            entry !== null &&
            'text' in entry &&
            'versions' in entry &&
            'time' in entry,
        )
      : [];
    const trimmedText = text.trim();
    const nextHistory = [
      { text: trimmedText, versions, fastMode, time: Date.now() },
      ...history.filter((entry) => entry.text !== trimmedText),
    ].slice(0, 100);
    await AsyncStorage.setItem(SENTENCE_HISTORY_KEY, JSON.stringify(nextHistory));
  } catch {
    // History is optional and must not interrupt polishing.
  }
}

export async function getWordHistory(): Promise<WordHistoryItem[]> {
  return getHistory(WORD_HISTORY_KEY);
}

export async function getSentenceHistory(): Promise<SentenceHistoryItem[]> {
  return getHistory(SENTENCE_HISTORY_KEY);
}

async function getHistory<T>(key: string): Promise<T[]> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.multiRemove([WORD_HISTORY_KEY, SENTENCE_HISTORY_KEY]);
}

export async function getLastInput(key: 'dictionary' | 'polish'): Promise<string> {
  try {
    return (await AsyncStorage.getItem(key === 'dictionary' ? DICTIONARY_INPUT_KEY : POLISH_INPUT_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function setLastInput(
  key: 'dictionary' | 'polish',
  value: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      key === 'dictionary' ? DICTIONARY_INPUT_KEY : POLISH_INPUT_KEY,
      value,
    );
  } catch {
    // Last-input persistence is optional.
  }
}
