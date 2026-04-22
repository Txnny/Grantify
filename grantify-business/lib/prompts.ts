import { BusinessProfile, ConversationMessage } from './types';

export function formatProfile(p: BusinessProfile): string {
  const lines = [
    `Company: ${p.companyName}`,
    `Contact: ${p.contactName}`,
    `Sector: ${p.sector}`,
    `Stage: ${p.companyStage}`,
    `Annual Revenue: ${p.annualRevenue || 'Not specified'}`,
    `Employees: ${p.employeeCount || 'Not specified'}`,
    `Location: ${p.city}, ${p.province}`,
    `Grant: ${p.grantName}`,
    `Project: ${p.projectTitle}`,
    `Description: ${p.projectDescription}`,
    `Funding Requested: ${p.fundingRequested || 'Not specified'}`,
    p.womenLed ? 'Women-led business' : null,
    p.indigenousLed ? 'Indigenous-led business' : null,
    p.socialEnterprise ? 'Social enterprise' : null,
    p.website ? `Website: ${p.website}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

export function formatConversation(history: ConversationMessage[]): string {
  if (history.length === 0) return '(No conversation yet)';
  return history
    .map((m) => `${m.role === 'assistant' ? 'ADVISOR' : 'APPLICANT'}: ${m.content}`)
    .join('\n\n');
}

// ── Interview question generation ─────────────────────────────────────────────

export function interviewSystemPrompt(
  grantText: string,
  profile: BusinessProfile
): string {
  return `You are a specialist business grant advisor with deep expertise in Canadian and international funding programs. Your job is to conduct a structured intake interview to build a winning grant application for a business client.

GRANT CONTEXT:
${grantText}

BUSINESS PROFILE:
${formatProfile(profile)}

RULES:
- Ask one focused question at a time
- Every question must map directly to an evaluation criterion in this specific grant
- Do not ask generic questions — be specific to this grant and this company's situation
- Ask follow-up questions if an answer is vague, unquantified, or incomplete
- Push for specifics: numbers, timelines, named partners, measurable outcomes
- When you have enough information to write a strong application, output exactly: INTERVIEW_COMPLETE
- Never repeat a question already asked
- Prioritize gaps — focus on weak spots in the application, not strengths already clear
- For innovation grants: probe technical differentiation and IP
- For job creation grants: get specific headcount projections with timelines
- For export grants: get target markets, buyer relationships, revenue projections
- If a question has natural choices, append: OPTIONS: Choice A | Choice B | Choice C`;
}

// ── Application draft generation ──────────────────────────────────────────────

export function draftSystemPrompt(
  grantText: string,
  profile: BusinessProfile,
  answers: ConversationMessage[]
): string {
  return `You are an expert business grant writer. Based on the interview answers and grant requirements below, write a complete, compelling grant application.

GRANT REQUIREMENTS:
${grantText}

BUSINESS PROFILE:
${formatProfile(profile)}

INTERVIEW ANSWERS:
${formatConversation(answers)}

INSTRUCTIONS:
- Write in first person from the company's perspective
- Match the tone and formality to the specific granting body
- Be specific — use company names, dollar figures, headcount, timelines, market data
- Address every evaluation criterion explicitly
- Lead with the strongest differentiators: innovation, market traction, team credibility
- For equity-focused grants: lead with identity as a strength and market access advantage
- Avoid vague language ("innovative solution", "significant impact") — quantify everything
- Flag any sections where more information would strengthen the application
- Each section should be 60–90 words unless the grant specifies otherwise

Return ONLY a valid JSON object — no markdown, no code fences, no explanatory text. Use this exact shape:
{
  "sections": [
    { "id": "executive_summary", "title": "Executive Summary", "content": "..." },
    { "id": "company_overview", "title": "Company Overview", "content": "..." },
    { "id": "problem_and_opportunity", "title": "Problem & Market Opportunity", "content": "..." },
    { "id": "project_description", "title": "Project Description", "content": "..." },
    { "id": "innovation_and_differentiation", "title": "Innovation & Differentiation", "content": "..." },
    { "id": "team_capacity", "title": "Team & Organizational Capacity", "content": "..." },
    { "id": "expected_outcomes", "title": "Expected Outcomes & Impact", "content": "..." },
    { "id": "budget_narrative", "title": "Budget Narrative", "content": "..." }
  ],
  "scores": {
    "eligibility": 0,
    "innovation": 0,
    "market_viability": 0,
    "team_capacity": 0,
    "financial_viability": 0,
    "overall": 0
  },
  "flags": [
    { "section": "section_id", "issue": "description of weakness", "suggestion": "how to fix it" }
  ]
}`;
}
