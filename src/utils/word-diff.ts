type Token = {
  text: string;
  word: boolean;
};

export type DiffToken = Token & {
  changed: boolean;
};

function tokenize(value: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*|[^A-Za-z0-9]+/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    tokens.push({
      text: match[0],
      word: /^[A-Za-z0-9]/.test(match[0]),
    });
  }

  return tokens;
}

function comparableWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function diffWords(original: string, polished: string): DiffToken[] {
  const originalWords = tokenize(original)
    .filter((token) => token.word)
    .map((token) => comparableWord(token.text));
  const polishedTokens = tokenize(polished);
  const polishedWords = polishedTokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.word);
  const lengths = originalWords.length;
  const polishedLength = polishedWords.length;
  const lcs = Array.from({ length: lengths + 1 }, () =>
    Array<number>(polishedLength + 1).fill(0),
  );

  for (let originalIndex = lengths - 1; originalIndex >= 0; originalIndex -= 1) {
    for (
      let polishedIndex = polishedLength - 1;
      polishedIndex >= 0;
      polishedIndex -= 1
    ) {
      if (originalWords[originalIndex] === comparableWord(polishedWords[polishedIndex].token.text)) {
        lcs[originalIndex][polishedIndex] = lcs[originalIndex + 1][polishedIndex + 1] + 1;
      } else {
        lcs[originalIndex][polishedIndex] = Math.max(
          lcs[originalIndex + 1][polishedIndex],
          lcs[originalIndex][polishedIndex + 1],
        );
      }
    }
  }

  const matchingTokenIndices = new Set<number>();
  let originalIndex = 0;
  let polishedIndex = 0;
  while (originalIndex < lengths && polishedIndex < polishedLength) {
    const polishedWord = polishedWords[polishedIndex];
    if (originalWords[originalIndex] === comparableWord(polishedWord.token.text)) {
      matchingTokenIndices.add(polishedWord.index);
      originalIndex += 1;
      polishedIndex += 1;
    } else if (lcs[originalIndex + 1][polishedIndex] >= lcs[originalIndex][polishedIndex + 1]) {
      originalIndex += 1;
    } else {
      polishedIndex += 1;
    }
  }

  return polishedTokens.map((token, index) => ({
    ...token,
    changed: token.word && !matchingTokenIndices.has(index),
  }));
}
