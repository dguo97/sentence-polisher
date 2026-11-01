// Put this file at src/api.ts in your Expo project.
const API_URL = 'https://word-polish-api.dguo97.workers.dev';
const REQUEST_TIMEOUT_MS = 15_000;
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (APP_SECRET) {
    headers['x-app-secret'] = APP_SECRET;
  }

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The request took too long. Check your connection and try again.');
    }
    throw new Error('No connection. Check your internet and try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.error ?? `The service is unavailable right now (HTTP ${response.status}).`,
    );
  }
  return data as T;
}

export function lookupWord(word: string): Promise<WordResult> {
  return post<WordResult>('/dictionary', { word });
}

export function polishSentence(text: string): Promise<PolishResult> {
  return post<PolishResult>('/polish', { text });
}