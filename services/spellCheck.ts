export type SpellIssueType = 'spelling' | 'grammar' | 'uncertain';

export interface SpellIssue {
  id: string;
  source: string;
  suggestion: string;
  type: SpellIssueType;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

const GEMINI_MODEL = 'gemini-1.5-flash';

declare const __GEMINI_API_KEY__: string | undefined;

const getGeminiApiKey = () => {
  // 1. Check define from vite.config.ts
  if (typeof __GEMINI_API_KEY__ !== 'undefined' && __GEMINI_API_KEY__) return __GEMINI_API_KEY__;
  
  // 2. Check Vite env variables
  const env = (import.meta as any).env;
  if (env?.VITE_GEMINI_API_KEY) return env.VITE_GEMINI_API_KEY;
  if (env?.GEMINI_API_KEY) return env.GEMINI_API_KEY;
  
  // 3. Check process.env (Node/Webpack)
  if (typeof process !== 'undefined') {
    const pEnv = (process as any).env;
    if (pEnv?.GEMINI_API_KEY) return pEnv.GEMINI_API_KEY;
    if (pEnv?.VITE_GEMINI_API_KEY) return pEnv.VITE_GEMINI_API_KEY;
    if (pEnv?.API_KEY) return pEnv.API_KEY;
  }
  
  // 4. Final fallback: LocalStorage (allows manual override if needed)
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('GEMINI_API_KEY') || '';
  }
  
  return '';
};

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
    try {
        const errorJson = JSON.parse(errorText);
        if (response.status === 429) {
            const delay = errorJson?.error?.details?.find((d: any) => d.retryDelay)?.retryDelay || 'a few seconds';
            throw new Error(`Rate limit exceeded (அதிகப்படியான கோரிக்கைகள்). Please wait ${delay} before trying again.`);
        }
        throw new Error(errorJson?.error?.message || 'AI request failed');
    } catch (e: any) {
        if (e.message.includes('Rate limit')) throw e;
        throw new Error('AI analysis failed. Your free tier quota may be exhausted.');
    }
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
