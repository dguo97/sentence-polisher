// Put this file at src/api.ts in your Expo project.
const API_URL = 'https://word-polish-api.dguo97.workers.dev';
// Leave empty unless you create an APP_SECRET secret in Cloudflare.
const APP_SECRET = '';

export type WordResult = {
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  fastMode?: boolean;
};

export type PolishVersion = {
  tone: string;
  polished: string;
  note: string;
};

export type PolishResult = {
  versions: PolishVersion[];
  fastMode?: boolean;
};

async function post<T>(path: string, body: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(APP_SECRET ? { 'x-app-secret': APP_SECRET } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('No connection. Check your internet and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? 'Something went wrong. Please try again.');
  }
  return data as T;
}

export function lookupWord(word: string): Promise<WordResult> {
  return post<WordResult>('/dictionary', { word });
}

export function polishSentence(text: string): Promise<PolishResult> {
  return post<PolishResult>('/polish', { text });
}