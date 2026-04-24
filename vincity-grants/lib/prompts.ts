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

QUESTION SEQUENCE — follow this order strictly:
1. Personal emotional truth — why does this project exist for this person right now?
2. Project vision — what is being made, what does it sound/look/feel like specifically?
3. Work plan — timeline, milestones, collaborators, named venues or partners
4. BUDGET — cover this fully before moving to artistic polish: artist fee (amount + justification), collaborator fees (named people + rates), community honorariums, equipment/studio, travel, any other line items. Do not skip or rush this phase.
5. Community impact — specific benefits, named communities, accountability mechanisms, any revenue sharing or reciprocity commitments
6. Professional credentials — named venues performed at, named awards or recognitions (exact title), track record evidence

RULES:
- Ask one question at a time
- Every question must map directly to an evaluation criterion in the grant
- Do not ask generic questions — be specific to this grant and this client
- Ask follow-up questions if an answer is vague, unquantified, or lacks specifics (names, numbers, dates)
- Push for verifiable details: named venues, exact award titles, specific dollar amounts
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
- Each section body: 45–70 words (stay concise so the full JSON fits in one response)
- Include 1–3 flags only (not a long list)
- Flag any sections where more information would strengthen the application

SECTION-SPECIFIC RULES (each section must do exactly one job — no cross-section repetition):

artist_statement:
- Lead with the personal emotional truth: why this project exists for this person right now
- Do NOT discuss compositional architecture or sonic innovation here — that belongs in artistic_significance
- Cultural identity and lived experience belong here as the foundation

project_description:
- What is being made, how, and when — concrete deliverables, timeline, named collaborators
- No emotional or cultural framing here — that's handled in artist_statement and community_impact

artistic_significance:
- This is where sonic/compositional/artistic architecture arguments live
- Innovation in form, genre, craft — not personal story and not community outcomes

community_impact:
- ALWAYS lead the first sentence with any revenue sharing, financial commitments, or economic reciprocity to community (if present — this is a standout differentiator)
- Named communities, specific benefits, accountability mechanisms
- Do NOT repeat cultural identity content from artist_statement here

track_record:
- Named venues only (no "various stages"), exact award titles, verifiable credentials
- If credentials are thin, flag it — do not pad with vague claims

budget_narrative:
- Every line item must be named and given a specific dollar amount
- Every amount must be justified (why this rate, why this cost)
- The total must be stated explicitly
- NEVER use phrases like "remaining funds cover X" without specifying the amount — always name the number
- If any line item is missing a number, flag it

additional_context:
- Systemic barriers, equity context, structural inequities the artist faces
- This is the cultural/structural argument — not community impact content, not artistic merit

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
