import type { EnglishTopic } from "@/lib/study/topics";

/**
 * IELTS Writing Task 2 style prompts, a few per topic, written once. A story gets one
 * prompt from its topic (always the same one for that story), and the student uses
 * the story as evidence. Short-answer practice: 4–5 sentences, not a full essay.
 */
const PROMPTS: Record<EnglishTopic, string[]> = {
  Education: [
    "Some people think public examinations are the fairest way to judge students, while others believe they put too much pressure on young people. Discuss both views and give your opinion.",
    "Many students fail important exams every year. Is this mainly the fault of the students, or of the education system?",
    "Should governments spend more money on schools in villages than on schools in cities? Give your opinion.",
  ],
  Economy: [
    "Some people believe governments should set a minimum wage for all workers. Others think wages should be decided by employers. Discuss both views and give your opinion.",
    "Small businesses often find it hard to get bank loans. What problems does this cause, and what could be done about it?",
    "Is economic growth more important than fair wages for workers? Give your opinion.",
  ],
  Environment: [
    "Some people think protecting the environment should come before economic development. To what extent do you agree or disagree?",
    "Temporary bans on fishing protect fish stocks but hurt fishermen's income. Are such bans worth it? Give your opinion.",
    "Who should be most responsible for protecting rivers and forests: governments, companies or individuals?",
  ],
  Health: [
    "Some people believe healthcare should be free for everyone. Others think people should pay for their own treatment. Discuss both views and give your opinion.",
    "What are the main causes of the spread of diseases in cities, and how can they be reduced?",
    "Is it better to spend money on preventing illness or on treating it? Give your opinion.",
  ],
  Technology: [
    "Technology has made life easier, but some people think it has also created new problems. Discuss both views and give your opinion.",
    "Should mobile phone and internet services be cheaper even if the government earns less money from them? Give your opinion.",
    "Do the advantages of doing more things online outweigh the disadvantages?",
  ],
  Science: [
    "Some people think governments should spend more on scientific research, while others think the money is better spent on everyday needs. Discuss both views and give your opinion.",
    "Is space exploration a good use of public money? Give your opinion.",
    "Should young people be encouraged to choose science subjects at school and university? Why or why not?",
  ],
  Governance: [
    "Some people believe strict laws and punishment are the best way to reduce crime. Others think education is more effective. Discuss both views and give your opinion.",
    "How important is it for people to trust the police and the courts? What can build that trust?",
    "Should government officials who misuse public money be punished more severely than ordinary citizens? Give your opinion.",
  ],
  International: [
    "Some people think their country should focus on its own problems rather than on events abroad. To what extent do you agree or disagree?",
    "Do international organisations such as the United Nations do enough to prevent conflicts? Give your opinion.",
    "Is selling weapons to other countries ever justified? Give your opinion.",
  ],
  Society: [
    "Some people think city life is better than village life, while others disagree. Discuss both views and give your opinion.",
    "What problems do people face when finding affordable housing in big cities, and how could these problems be solved?",
    "Is public protest an effective way for ordinary people to bring about change? Give your opinion.",
  ],
  "Sport & Culture": [
    "Some people think governments should spend money on sports facilities, while others think it should go to other services. Discuss both views and give your opinion.",
    "Do international sporting events bring countries closer together? Give your opinion.",
    "Should traditional culture be protected even when young people are less interested in it?",
  ],
};

/** The prompt for a story: chosen from its topic, always the same for that story. */
export function writingPromptFor(topic: EnglishTopic, storyId: string): string {
  const list = PROMPTS[topic] ?? PROMPTS.Society;
  let h = 0;
  for (let i = 0; i < storyId.length; i++) h = (h * 31 + storyId.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/** Word limits for the short task: about 4–5 sentences. */
export const WRITING_MIN_WORDS = 30;
export const WRITING_MAX_WORDS = 250;

export function wordCount(text: string): number {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}
