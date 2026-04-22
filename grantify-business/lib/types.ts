// ─── Grant / Ingest ──────────────────────────────────────────────────────────

export interface IngestedSource {
  id: string;
  label: string;
  text: string;
  url?: string;
  filename?: string;
  type: 'paste' | 'url' | 'file';
}

// ─── Business Profile ─────────────────────────────────────────────────────────

export type CompanyStage = 'Pre-revenue' | 'Early-stage' | 'Growth' | 'Established';

export interface BusinessProfile {
  companyName: string;
  contactName: string;
  sector: string;
  companyStage: CompanyStage;
  annualRevenue: string;
  employeeCount: string;
  city: string;
  province: string;
  grantName: string;
  projectTitle: string;
  projectDescription: string;
  fundingRequested: string;
  womenLed: boolean;
  indigenousLed: boolean;
  socialEnterprise: boolean;
  website?: string;
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
  innovation: number;
  market_viability: number;
  team_capacity: number;
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

// ─── Persisted application (dashboard) ───────────────────────────────────────

export interface SavedApplication {
  id: string;
  grantName: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  status: 'in-progress' | 'draft-ready' | 'exported';
  session: GrantSession;
}

// ─── Session context (top-level state) ───────────────────────────────────────

export interface GrantSession {
  sources: IngestedSource[];
  grantText: string;
  business: BusinessProfile | null;
  conversation: ConversationMessage[];
  draft: ApplicationDraft | null;
}
