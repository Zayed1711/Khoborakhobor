/**
 * Small quiz helpers that remain after the template quiz generator was retired.
 * Every quiz shown to students is now built from a real sentence of the story
 * (src/lib/study/extractive.ts).
 */

/** Shape of the homepage daily quiz (see src/lib/study/daily.ts). */
export interface GeneratedQuiz {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  topicTag: string;
  sourceName?: string;
  articleTitle?: string;
  articleSlug?: string;
  contextQuote?: string;
  paragraphRef?: string;
}

/** Fisher-Yates shuffle that returns where the correct option ended up. */
export function shuffleQuizOptions(options: string[], correctIndex: number): {
  options: string[];
  correctOption: number;
} {
  const correctText = options[correctIndex];
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const newCorrectOption = shuffled.indexOf(correctText);
  return { options: shuffled, correctOption: newCorrectOption >= 0 ? newCorrectOption : 0 };
}
