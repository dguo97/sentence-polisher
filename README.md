# Sentence Polisher

*Fix your sentences. Look up your words. Nothing else.*

A small, single-purpose Android app (built with Expo / React Native) for personal writing and journalling. It deliberately does only two things, with no chat and no general AI assistant to distract you:

- **Dictionary:** look up a word or phrase and get a simple definition, British pronunciation (IPA, with audio), two example sentences and synonyms.
- **Polish:** type a sentence and get six rewritten versions in different styles, each with a short note on what changed and a Copy button.

Other features: save words to review later, practice mode for saved words, history, highlighted changes in polished text, and on-device caching of dictionary lookups.

## Why I built this

I sometimes write personal journal entries, and I like to use AI to polish my sentences and look up words. But a general AI chat makes it very easy to drift into other things. I built Sentence Polisher as a small productivity tool for myself: it does these two jobs and nothing else. There is no chat box and no open-ended assistant, so it is easier to stay focused on the writing.

Building it was also a good experience: I am impressed by how AI has streamlined the app development process.

## How it works

```
Phone app (Expo)  ->  Cloudflare Worker  ->  Google Gemini API
```

The app never contains an AI key. It sends text to a small Cloudflare Worker, which holds the Gemini API key as a secret and returns JSON. The Worker source is in `worker/worker.js`.

## Polish styles

Natural and conversational, Simple and clear, Close to original wording, Concise, Slightly stronger and more confident, Reflective and thoughtful. All output is written in British English, and each result goes through a second proofreading pass.

## Run the app locally

Requirements: Node.js (LTS) and the Expo Go app on your phone.

```
npm install
npx expo install --fix
npx expo start -c
```

Scan the QR code with Expo Go (phone and computer on the same Wi-Fi).

If your Worker uses an app password (see below), create a file named `.env` in the project's top folder containing `EXPO_PUBLIC_APP_SECRET=your-password`. This file is ignored by git, so it is never uploaded. Restart with `npx expo start -c` after creating it.

## Set up your own Worker

1. Create a free Cloudflare account and a new Worker.
2. Paste in `worker/worker.js` and deploy.
3. Add a secret named `GEMINI_API_KEY` (create a key in Google AI Studio). Never put this key in the app code or commit it.
4. Put your Worker address in `API_URL` in `src/api.ts`.
5. Optional but recommended: add a second secret named `APP_SECRET` (a long random string) in Cloudflare, and put the same value in your local `.env` file as `EXPO_PUBLIC_APP_SECRET`. The Worker then rejects any request that does not carry the password, so strangers who find the Worker address cannot use your free Gemini allowance. Do not commit the password.

The Worker tries several Gemini models in order and falls back to the next if one is retired, rate-limited, overloaded or slow.

Gemini retires models from time to time. If requests start failing, check the `MODELS` list at the top of `worker/worker.js` against the current model names in the Gemini API documentation.

## Build an Android APK

Builds use Expo's free cloud build service (EAS). `eas.json` defines a `preview` profile that produces an installable `.apk`.

1. Create a free account at expo.dev and log in: `npx eas-cli@latest login`.
2. If you use an app password, give it to the build servers (the `.env` file is not uploaded):

```
npx eas-cli@latest env:create --name EXPO_PUBLIC_APP_SECRET --value "your-password" --environment preview --visibility sensitive
```

3. Build:

```
npx eas-cli@latest build -p android --profile preview
```

Answer "no" when asked to run the build on an emulator, then install the downloaded `.apk` on your phone.

If you fork this project, change the Android `package` in `app.json` to your own unique ID, because the existing one belongs to this project.

## Limitations

- **English words and phrases only.** The dictionary is not designed for personal names or other proper nouns (for example "David"), and may answer "Not found" for them.
- **AI can make mistakes.** Grammar fixes and definitions are very good but not guaranteed to be 100% correct. The "What changed" notes are there so you can check each edit. British IPA pronunciations for rare words are the least reliable part.
- **Needs an internet connection.** Lookups and polishing go through the AI. Only words you have already looked up (cached) and your saved words work offline.
- **Free-tier limits.** The app uses Google's free Gemini tier, which has daily and per-minute limits. If you hit them, the app shows a message and you try again later.
- **Android only, built for personal use.** There is no iPhone build, no accounts and no syncing. Saved words and history live on the phone and are lost if the app is uninstalled.
- **The app password is not fully secret.** It is built into the APK, so it only deters casual misuse of the Worker.
- **Models change.** Google retires Gemini models from time to time, so the model list in the Worker needs occasional updating.

## Privacy

Text you type is sent to Google's Gemini API through the Worker. On the free tier, Google may use it to improve its products, so avoid entering private or sensitive information.

## Project structure

- `src/app/` - screens (Polish, Dictionary, Saved)
- `src/api.ts` - calls the Worker
- `src/utils/` - storage, caching, saved words, word diff
- `worker/worker.js` - Cloudflare Worker (not part of the app bundle)
- `eas.json` - Android build profile
- `.env` - local app password (never committed)
