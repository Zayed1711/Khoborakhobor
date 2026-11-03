export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface VocabularyTerm {
  id: string;
  term: string;
  definition: string;
  context?: string | null;
  articleId: string;
}

export interface QuizQuestion {
  id: string;
  articleId?: string;
  question: string;
  options: string[] | string;
  correctOption?: number;
  explanation?: string | null;
  topicTag?: string | null;
  contextQuote?: string | null;
  paragraphRef?: string | null;
}

export interface FactTableRow {
  parameter: string; // e.g. "নিয়ন্ত্রণকারী সংস্থা", "সুদের হার / পরিসংখ্যান", "কার্যকর সময়কাল"
  value: string;     // e.g. "বাংলাদেশ ব্যাংক", "১০.০০% (+৫০ বেসিস পয়েন্ট)", "২৭ অক্টোবর ২০২৪"
  relevance: string; // e.g. "মুদ্রানীতি প্রণয়ন ও মূল্যস্ফীতি নিয়ন্ত্রণ", "লিখিত পরীক্ষা ও রচনায় ব্যবহারের ডেটা"
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  keyTakeaways?: string[];
  factTable?: FactTableRow[];
  sourceName?: string | null;
  sourceUrl?: string | null;
  examTags?: string | null;
  examTagsList?: string[];
  featuredImage: string;
  imageCaption?: string | null;
  category: Category;
  author?: {
    id?: string;
    name: string;
    role?: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
  readTime: string;
  isBreaking?: boolean;
  isLead?: boolean;
  isCapsule?: boolean;
  isFeatured?: boolean;
  isOpinion?: boolean;
  viewCount?: number;
  vocabulary?: VocabularyTerm[];
  quizQuestions?: QuizQuestion[];
  tags?: string[];
}

export interface StudyNote {
  id: string;
  studentId: string;
  articleId: string;
  quoteText: string;
  memo?: string | null;
  createdAt: string | Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  targetTrack: string;
  institution?: string | null;
  streakDays: number;
  avatar?: string | null;
  articlesRead?: number;
  wordsLookedUp?: number;
  quizzesTaken?: number;
  notesSaved?: number;
}
