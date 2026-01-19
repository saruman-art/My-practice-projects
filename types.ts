
export enum DifficultyLevel {
  KIDS = 'Elementary/Kids',
  A1 = 'A1 - Beginner',
  A2 = 'A2 - Pre-Intermediate',
  B1 = 'B1 - Intermediate',
  B2 = 'B2 - Upper Intermediate (High School)',
}

export interface Word {
  original: string;
  translation: string;
  phonetic: string;
  example: string;
  timestamp: number;
  mastered: boolean;
}

export interface BilingualSegment {
  en: string;
  zh: string;
}

export interface Paragraph {
  sentences: BilingualSegment[];
}

export interface Article {
  id: string;
  title: string;
  chineseTitle: string;
  paragraphs: Paragraph[];
  difficulty: DifficultyLevel;
  date: string;
  imageUrl?: string;
}

export interface AppState {
  currentLevel: DifficultyLevel;
  vocabulary: Word[];
  readHistory: Article[];
  currentArticle: Article | null;
}
