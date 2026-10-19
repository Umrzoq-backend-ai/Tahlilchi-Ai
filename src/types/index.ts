export type AnalysisMode =
  | 'meeting'
  | 'news'
  | 'education'
  | 'child'
  | 'interview'
  | 'pitch'
  | 'audio'
  | 'chat'
  | 'document'
  | 'multi';

export type OutputLanguage =
  | 'uz'
  | 'ru'
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'hi'
  | 'tr'
  | 'auto';

export interface TimestampItem {
  time: string;
  text: string;
}

export interface SpeakerItem {
  id: string;
  talk_time_pct?: number;
}

export interface KeyDecision {
  decision: string;
  timestamp?: string;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
  timestamp?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  timestamp_hint?: string;
}

export interface CoreConcept {
  concept: string;
  explanation: string;
  timestamp?: string;
}

export interface FactCheckItem {
  claim: string;
  verdict: 'True' | 'False' | 'Misleading' | 'Unverified' | string;
  explanation: string;
  timestamp?: string;
}

export interface ChildTrigger {
  type: string;
  intensity: 'Past' | 'O\'rtacha' | 'Yuqori' | string;
  timestamp?: string;
  description: string;
}

export interface AudioTimelineItem {
  start: string;
  end: string;
  speaker: string;
  emotion: 'Happy' | 'Sad' | 'Angry' | 'Neutral' | string;
  text: string;
  translation?: string;
}

export interface TokensUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AnalysisResponse {
  mode: AnalysisMode;
  summary: string;

  // Meeting
  agenda?: string;
  speakers?: SpeakerItem[];
  key_decisions?: KeyDecision[];
  action_items?: ActionItem[];
  open_questions?: string[];
  key_transcripts?: TimestampItem[];

  // Education
  prerequisites?: string[];
  core_concepts?: CoreConcept[];
  quiz?: QuizQuestion[];

  // News
  headline?: string;
  sentiment?: string;
  bias_indicators?: string[];
  key_facts?: string[];
  fact_check?: FactCheckItem[];

  // Child Review
  safety_verdict?: 'SAFE' | 'CAUTION' | 'UNSAFE' | string;
  safety_score?: number;
  negative_triggers?: ChildTrigger[];
  positive_themes?: string[];
  parental_advice?: string;

  // Interview
  match_score?: number;
  hiring_verdict?: 'STRONG_HIRE' | 'HIRE' | 'LEANING_NO' | 'REJECT' | string;
  strengths?: string[];
  weaknesses?: string[];
  interviewer_advice?: string;
  candidate_advice?: string;

  // Pitch (3V)
  overall_pitch_score?: number;
  verbal_score?: number;
  visual_score?: number;
  vocal_score?: number;
  parasite_words?: string[];
  pitch_recommendations?: string[];

  // Audio Diarization
  audio_timeline?: AudioTimelineItem[];

  // Document & PDF
  document_title?: string;
  key_theses?: string[];
  findings?: { title: string; detail: string; page?: string }[];

  // Global & Technical
  transcript?: string;
  timestamps?: TimestampItem[];
  metadata?: Record<string, any>;
  tokens?: TokensUsage;
  disclaimer?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  mode: AnalysisMode;
  createdAt: string;
  tokens?: number;
  result: AnalysisResponse;
  videoUrl?: string;
}
