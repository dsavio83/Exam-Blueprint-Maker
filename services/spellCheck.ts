export type SpellIssueType = 'spelling' | 'grammar' | 'uncertain';

export interface SpellIssue {
  id: string;
  source: string;
  suggestion: string;
  type: SpellIssueType;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

const GEMINI_MODEL = 'gemini-2.0-flash';

declare const __GEMINI_API_KEY__: string | undefined;

const getGeminiApiKey = () =>
  (typeof __GEMINI_API_KEY__ !== 'undefined' ? __GEMINI_API_KEY__ : undefined) ||
  ((import.meta as any)?.env?.VITE_GEMINI_API_KEY) ||
  ((import.meta as any)?.env?.GEMINI_API_KEY) ||
  (typeof process !== 'undefined' ? (process as any)?.env?.GEMINI_API_KEY : undefined) ||
  (typeof process !== 'undefined' ? (process as any)?.env?.API_KEY : undefined);

const extractJson = (raw: string) => {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = Math.min(
    ...['[', '{']
      .map((token) => candidate.indexOf(token))
      .filter((index) => index >= 0)
  );
  if (!Number.isFinite(start)) {
    throw new Error('AI response did not contain JSON');
  }
  const sliced = candidate.slice(start).trim();
  const endArray = sliced.lastIndexOf(']');
  const endObject = sliced.lastIndexOf('}');
  const end = Math.max(endArray, endObject);
  return sliced.slice(0, end + 1);
};

export const analyzeTamilSpellings = async (text: string): Promise<SpellIssue[]> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }
  if (!text.trim()) return [];

  const prompt = `
You are an expert Tamil proofreader. Analyze the given Tamil text for spelling mistakes, grammar issues, and uncertain phrases.

Rules:
- Focus on Tamil language spelling and grammar.
- Return JSON only.
- Use type = "spelling" for spelling mistakes.
- Use type = "grammar" for grammar / phrasing issues that are clearly fixable.
- Use type = "uncertain" when you are not fully sure and the phrase should be manually reviewed.
- Keep source as the exact word or phrase from the input.
- suggestion must be a concrete corrected replacement.
- confidence must be one of: high, medium, low.
- explanation must be short and specific.
- Return at most 25 issues.

JSON schema:
{
  "issues": [
    {
      "source": "exact text from input",
      "suggestion": "replacement",
      "type": "spelling|grammar|uncertain",
      "confidence": "high|medium|low",
      "explanation": "short reason"
    }
  ]
}

Input text:
${text}
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Spell check request failed');
  }

  const data = await response.json();
  const rawText = (data?.candidates || [])
    .flatMap((candidate: any) => candidate?.content?.parts || [])
    .map((part: any) => part?.text || '')
    .join('\n');

  const parsed = JSON.parse(extractJson(rawText));
  const issues = Array.isArray(parsed) ? parsed : parsed?.issues;
  if (!Array.isArray(issues)) return [];

  return issues
    .filter((issue) => issue?.source && issue?.suggestion && issue?.type)
    .map((issue, index) => ({
      id: `issue-${index + 1}`,
      source: String(issue.source),
      suggestion: String(issue.suggestion),
      type: issue.type === 'grammar' || issue.type === 'uncertain' ? issue.type : 'spelling',
      confidence: issue.confidence === 'high' || issue.confidence === 'low' ? issue.confidence : 'medium',
      explanation: String(issue.explanation || '')
    }));
};
