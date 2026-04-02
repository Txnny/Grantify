// ─── Grant / Ingest ──────────────────────────────────────────────────────────

export interface IngestedSource {
  id: string;
  label: string;
  text: string;
  url?: string;
  filename?: string;
  type: 'paste' | 'url' | 'file';
}

// ─── Client Profile ───────────────────────────────────────────────────────────

export type CareerStage = 'Emerging' | 'Mid-career' | 'Established';

export interface ClientProfile {
  artistName: string;
  organizationName?: string;
  city: string;
  province: string;
  disciplines: string[];
  careerStage: CareerStage;
  equityIdentities: string[];
  grantName: string;
  projectDescription: string;
  credentials?: string;
}

// ─── Interview ────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
}

// ─── Draft / Application ──────────────────────────────────────────────────────

export interface ApplicationSection {
  id: string;
  title: string;
  content: string;
}

export interface StrengthScores {
  eligibility: number;
  narrative: number;
  community_impact: number;
  financial_viability: number;
  overall: number;
}

export interface ApplicationFlag {
  section: string;
  issue: string;
  suggestion: string;
}

export interface ApplicationDraft {
  sections: ApplicationSection[];
  scores: StrengthScores;
  flags: ApplicationFlag[];
}

// ─── Session context (top-level state) ───────────────────────────────────────

export interface GrantSession {
  sources: IngestedSource[];
  grantText: string;        // concatenated text from all ingested sources
  client: ClientProfile | null;
  conversation: ConversationMessage[];
  draft: ApplicationDraft | null;
}
