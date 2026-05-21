export interface ActivityConfig {
  subject: string;
  grade: string;
  theme: string;
  bncc: string;
  numQuestions: number;
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    essay: boolean;
    passage: boolean;
  };
}

export interface VisualConfig {
  style: 'modern-professional' | 'ludic-childish' | 'minimalist' | 'classic-traditional';
  color: string; // hex or tailwind name
  fontFamily: string;
}

export interface PageOptions {
  schoolHeader: boolean;
  footerPage: boolean;
  gabarito: boolean;
  spaceForAnswers: boolean;
  linesForEssay: boolean;
}

export interface Question {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'essay';
  prompt: string;
  options?: string[]; // e.g., ["A) ...", "B) ..."] or ["V)", "F)"]
  correctAnswer: string; // e.g. "A" or "V" or "F" or descriptive key
  explanation: string;
  imageUrl?: string;
  imagePrompt?: string;
}

export interface ReadingPassage {
  title: string;
  text: string;
  source?: string;
  imageUrl?: string;
  imagePrompt?: string;
}

export interface Activity {
  id: string;
  config: ActivityConfig;
  visual: VisualConfig;
  pages: PageOptions;
  title: string;
  readingPassage?: ReadingPassage;
  questions: Question[];
  gabaritoNotes?: string;
  createdAt: string;
  schoolName: string;
  teacherName: string;
}

export interface SchoolProfile {
  name: string;
  segment: string;
  logoType: 'shield' | 'book' | 'star' | 'circle';
}

export interface TeacherProfile {
  name: string;
  role: string;
  credits: number;
  savedCount: number;
}
