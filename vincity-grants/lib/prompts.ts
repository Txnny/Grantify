import { ClientProfile, ConversationMessage } from './types';

export function formatProfile(p: ClientProfile): string {
  const lines = [
    `Artist/Client: ${p.artistName}`,
    p.organizationName ? `Organization: ${p.organizationName}` : null,
    `Location: ${p.city}, ${p.province}`,
    `Discipline(s): ${p.disciplines.join(', ')}`,
    `Career stage: ${p.careerStage}`,
    p.equityIdentities.length
      ? `Equity identities: ${p.equityIdentities.join(', ')}`
      : null,
    `Grant: ${p.grantName}`,
    `Project: ${p.projectDescription}`,
    p.credentials ? `Credentials / track record: ${p.credentials}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

export function formatConversation(history: ConversationMessage[]): string {
  if (history.length === 0) return '(No conversation yet)';
  return history
    .map((m) => `${m.role === 'assistant' ? 'INTERVIEWER' : 'CLIENT'}: ${m.content}`)
    .join('\n\n');
}

// ── Interview question generation ─────────────────────────────────────────────
// Conversation history is passed via the messages array, not the system prompt.

export function interviewSystemPrompt(
  grantText: string,
  profile: ClientProfile
): string {
  return `You are a specialized grant writing assistant for VinCity Entertainment, a Toronto-based arts promotions company. Your job is to conduct a structured interview to build a winning grant application for a client.

GRANT CONTEXT:
${grantText}

CLIENT PROFILE:
${formatProfile(profile)}

RULES:
- Ask one question at a time
- Every question must map directly to an evaluation criterion in the grant
- Do not ask generic questions — be specific to this grant and this client
- Ask follow-up questions if an answer is vague or incomplete
- When you have enough information for a strong application, output exactly: INTERVIEW_COMPLETE
- Never repeat a question already asked
- Prioritize gaps — focus on what the application is missing, not what is already strong
- If a question has a natural set of choices, append them on a new line as: OPTIONS: Choice A | Choice B | Choice C`;
}

// ── Application draft generation ──────────────────────────────────────────────

export function draftSystemPrompt(
  grantText: string,
  profile: ClientProfile,
  answers: ConversationMessage[]
): string {
  return `You are an expert grant writer for VinCity Entertainment. Based on the interview answers and grant requirements below, write a complete, compelling grant application.

GRANT REQUIREMENTS:
${grantText}

CLIENT PROFILE:
${formatProfile(profile)}

INTERVIEW ANSWERS:
${formatConversation(answers)}

INSTRUCTIONS:
- Write in first person from the artist's perspective
- Match the tone and formality to the specific granting body
- Be specific — use names, numbers, dates, and real credentials
- Address every evaluation criterion explicitly
- For equity-focused grants: lead with cultural identity as a strength, not an afterthought
- Avoid generic arts grant clichés ("unique voice", "raise awareness", "foster dialogue")
- Each section should be 60–90 words unless the grant specifies otherwise
- Flag any sections where more information would strengthen the application

Return ONLY a valid JSON object — no markdown, no code fences, no explanatory text before or after. Use this exact shape:
{
  "sections": [
    { "id": "artist_statement", "title": "Artist Statement", "content": "..." },
    { "id": "project_description", "title": "Project Description", "content": "..." },
    { "id": "artistic_significance", "title": "Artistic Significance", "content": "..." },
    { "id": "community_impact", "title": "Community Impact", "content": "..." },
    { "id": "track_record", "title": "Track Record & Capacity", "content": "..." },
    { "id": "budget_narrative", "title": "Budget Narrative", "content": "..." },
    { "id": "additional_context", "title": "Additional Context", "content": "..." }
  ],
  "scores": {
    "eligibility": 0,
    "narrative": 0,
    "community_impact": 0,
    "financial_viability": 0,
    "overall": 0
  },
  "flags": [
    { "section": "section_id", "issue": "description of weakness", "suggestion": "how to fix it" }
  ]
}`;
}
