import React, { useState, useMemo, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Zap, MessageSquare, ChevronDown, ChevronUp, Info } from 'lucide-react';

// ─── Enums (mirrors types.ts) ───────────────────────────────────────────────
export enum KnowledgeLevel {
  BASIC = 'Basic',
  AVERAGE = 'Average',
  PROFOUND = 'Profound',
}

export enum CognitiveProcess {
  CP1 = 'Remember',
  CP2 = 'Understand',
  CP3 = 'Apply',
  CP4 = 'Analyse',
  CP5 = 'Evaluate',
  CP6 = 'Create',
}

export enum ItemFormat {
  SR1 = 'VSA',
  SR2 = 'SA',
  CRS1 = 'SA',
  CRS2 = 'SA',
  CRS3 = 'MCI',
  CRL = 'LA',
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SubUnit {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  name: string;
  subUnits: SubUnit[];
  learningOutcomes?: string;
}

export interface Curriculum {
  classLevel: string;
  subject: string;
  units: Unit[];
}

export interface PaperSection {
  id: string;
  marks: number;
  count: number;
  optionCount: number;
  instruction?: string;
}

export interface PaperType {
  id: string;
  name: string;
  totalMarks: number;
  sections: PaperSection[];
  description?: string;
}

export interface BlueprintItem {
  id: string;
  unitId: string;
  subUnitId: string;
  marksPerQuestion: number;
  totalMarks: number;
  questionCount: number;
  sectionId: string;
  knowledgeLevel: KnowledgeLevel;
  cognitiveProcess: CognitiveProcess;
  itemFormat: ItemFormat;
  hasInternalChoice: boolean;
  knowledgeLevelB?: KnowledgeLevel;
  cognitiveProcessB?: CognitiveProcess;
  itemFormatB?: ItemFormat;
  questionText?: string;
  answerText?: string;
}

export interface Blueprint {
  id: string;
  classLevel: string;
  subject: string;
  totalMarks: number;
  setId?: string;
  examTerm?: string;
  items: BlueprintItem[];
  isLocked?: boolean;
  isConfirmed?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Bloom's KL weightage targets (as fractions of totalMarks) */
const KL_TARGETS: Record<KnowledgeLevel, number> = {
  [KnowledgeLevel.BASIC]: 0.30,
  [KnowledgeLevel.AVERAGE]: 0.50,
  [KnowledgeLevel.PROFOUND]: 0.20,
};

const KL_MAX_MARKS: Record<KnowledgeLevel, number> = {
  [KnowledgeLevel.BASIC]: 8,
  [KnowledgeLevel.AVERAGE]: 20,
  [KnowledgeLevel.PROFOUND]: 8,
};

const KL_COLORS: Record<KnowledgeLevel, { bg: string; border: string; text: string; badge: string }> = {
  [KnowledgeLevel.BASIC]: { bg: 'bg-green-50', border: 'border-l-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  [KnowledgeLevel.AVERAGE]: { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  [KnowledgeLevel.PROFOUND]: { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
};

const MARK_COLORS: Record<number, string> = {
  1: 'bg-blue-50 border-blue-200 text-blue-900',
  2: 'bg-green-50 border-green-200 text-green-900',
  3: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  5: 'bg-orange-50 border-orange-200 text-orange-900',
  6: 'bg-purple-50 border-purple-200 text-purple-900',
};

// ─── AI Validation Engine ─────────────────────────────────────────────────────

interface ValidationError {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  detail?: string;
}

interface ValidationResult {
  errors: ValidationError[];
  klSummary: Record<KnowledgeLevel, { marks: number; target: number; max: number }>;
  sectionSummary: { sectionId: string; marks: number; count: number; filled: number }[];
  orStatus: Record<string, { filled: number; required: number; label: string }>;
  grandTotal: number;
  isValid: boolean;
}

function validateBlueprint(blueprint: Blueprint, paperType: PaperType): ValidationResult {
  const errors: ValidationError[] = [];
  const items = blueprint.items;

  // ── 1. Knowledge Level distribution ──
  const klMarks: Record<KnowledgeLevel, number> = {
    [KnowledgeLevel.BASIC]: 0,
    [KnowledgeLevel.AVERAGE]: 0,
    [KnowledgeLevel.PROFOUND]: 0,
  };
  items.forEach(item => {
    klMarks[item.knowledgeLevel] = (klMarks[item.knowledgeLevel] || 0) + item.totalMarks;
  });

  const klSummary: ValidationResult['klSummary'] = {} as ValidationResult['klSummary'];
  ([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).forEach(kl => {
    const target = Math.round(blueprint.totalMarks * KL_TARGETS[kl]);
    const max = KL_MAX_MARKS[kl];
    const marks = klMarks[kl] || 0;
    klSummary[kl] = { marks, target, max };

    if (marks === 0 && items.length > 0) {
      errors.push({
        type: 'error',
        code: `KL_MISSING_${kl.toUpperCase()}`,
        message: `${kl}: 0M ≠ required ${target}M (${Math.round(KL_TARGETS[kl] * 100)}%)`,
        detail: `${kl} knowledge level has no marks assigned.`,
      });
    } else if (Math.abs(marks - target) > 2 && items.length > 0) {
      errors.push({
        type: 'warning',
        code: `KL_DEVIATION_${kl.toUpperCase()}`,
        message: `${kl}: ${marks}M vs target ${target}M (±2M tolerance)`,
        detail: `Adjust questions to reach Bloom's target.`,
      });
    }
  });

  // ── 2. Section fill validation ──
  const sectionSummary: ValidationResult['sectionSummary'] = paperType.sections.map(s => {
    const filled = items.filter(i => i.sectionId === s.id).reduce((acc, i) => acc + i.questionCount, 0);
    if (filled !== s.count && items.length > 0) {
      errors.push({
        type: filled > s.count ? 'error' : 'warning',
        code: `SEC_COUNT_${s.id}`,
        message: `${s.marks}M section: ${filled}/${s.count} questions filled`,
        detail: filled > s.count ? 'Exceeds section limit.' : 'Section not fully utilised.',
      });
    }
    return { sectionId: s.id, marks: s.marks, count: s.count, filled };
  });

  // ── 3. OR (Internal Choice) validation ──
  const orStatus: ValidationResult['orStatus'] = {};
  paperType.sections.forEach(s => {
    if (s.optionCount > 0) {
      const withOR = items.filter(i => i.sectionId === s.id && i.hasInternalChoice).length;
      orStatus[s.id] = {
        filled: withOR,
        required: s.optionCount,
        label: `${s.marks}M`,
      };
      if (withOR < s.optionCount && items.length > 0) {
        errors.push({
          type: 'warning',
          code: `OR_MISSING_${s.id}`,
          message: `${s.marks}M: ${withOR}/${s.optionCount} OR questions set`,
          detail: 'Internal choice questions missing.',
        });
      }
    }
  });

  // ── 4. Grand total check ──
  const grandTotal = items.reduce((acc, i) => acc + i.totalMarks, 0);
  if (grandTotal !== blueprint.totalMarks && items.length > 0) {
    errors.push({
      type: 'error',
      code: 'TOTAL_MISMATCH',
      message: `Grand total ${grandTotal}M ≠ expected ${blueprint.totalMarks}M`,
      detail: 'Re-distribute marks to match paper total.',
    });
  }

  return {
    errors,
    klSummary,
    sectionSummary,
    orStatus,
    grandTotal,
    isValid: errors.filter(e => e.type === 'error').length === 0,
  };
}

// ─── AI Assistant Messages ────────────────────────────────────────────────────

const AI_SUGGESTIONS: Record<string, string> = {
  TOTAL_MISMATCH: 'மொத்த மதிப்பெண் சரியில்லை. Auto-fill பயன்படுத்தவும் அல்லது கைமுறையாக மதிப்பெண்களை சரிசெய்யவும்.',
  KL_MISSING_BASIC: 'Basic நிலை கேள்விகளை 1M மற்றும் 2M பிரிவில் நிரப்பவும். இது அடிப்படை அறிவை சரிபார்க்கும்.',
  KL_MISSING_AVERAGE: 'Average நிலைக்கு 3M பிரிவில் கேள்விகளை நிரப்பவும். இது புரிதல் திறனை மதிப்பிடும்.',
  KL_MISSING_PROFOUND: 'Profound நிலைக்கு 5M அல்லது 6M பிரிவில் கேள்விகளை நிரப்பவும். இது உயர்சிந்தனை திறனை மதிப்பிடும்.',
};

function getAISuggestion(errors: ValidationError[]): string {
  if (errors.length === 0) return 'Blueprint சரியாக உள்ளது! Confirm செய்யலாம்.';
  const first = errors[0];
  return AI_SUGGESTIONS[first.code] || `${errors.length} பிழை உள்ளது. Validation பலகத்தை சரிபார்க்கவும்.`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KLBadgeProps { level: KnowledgeLevel; short?: boolean }
const KLBadge: React.FC<KLBadgeProps> = ({ level, short }) => {
  const c = KL_COLORS[level];
  return (
    <span className={`text-[9px] uppercase font-bold px-1 rounded ${c.badge}`}>
      {short ? level[0] : level}
    </span>
  );
};

interface ValidationPanelProps {
  result: ValidationResult;
  paperType: PaperType;
  aiMessage: string;
  onAutoFill: () => void;
}
const ValidationPanel: React.FC<ValidationPanelProps> = ({ result, paperType, aiMessage, onAutoFill }) => {
  const [tab, setTab] = useState<'validation' | 'ai'>('validation');
  const hasErrors = result.errors.filter(e => e.type === 'error').length > 0;
  const hasWarnings = result.errors.filter(e => e.type === 'warning').length > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-sm bg-white h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('validation')}
          className={`flex-1 py-2 px-3 text-xs font-semibold transition-colors ${tab === 'validation' ? 'bg-white border-b-2 border-blue-600 text-blue-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Validation
        </button>
        <button
          onClick={() => setTab('ai')}
          className={`flex-1 py-2 px-3 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${tab === 'ai' ? 'bg-white border-b-2 border-blue-600 text-blue-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          <MessageSquare size={12} /> AI Assistant
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'validation' ? (
          <>
            {/* KL Summary */}
            {([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).map(kl => {
              const { marks, target, max } = result.klSummary[kl] || { marks: 0, target: 0, max: 0 };
              const pct = Math.min(100, (marks / Math.max(target, 1)) * 100);
              const c = KL_COLORS[kl];
              const ok = Math.abs(marks - target) <= 2;
              return (
                <div key={kl}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-semibold ${c.text}`}>{kl}</span>
                    <span className={`text-xs font-bold ${ok ? 'text-green-600' : 'text-red-600'}`}>
                      {marks}/{target}M
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ok ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {Math.round(KL_TARGETS[kl] * 100)}% target · max {max}
                  </div>
                </div>
              );
            })}

            <hr className="border-gray-100" />

            {/* Error list */}
            {result.errors.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle size={14} />
                <span className="text-xs font-semibold">No errors found</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  {result.errors.length} Issue{result.errors.length > 1 ? 's' : ''}
                </div>
                {result.errors.map((e, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2 rounded text-xs ${e.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}
                  >
                    {e.type === 'error' ? <X size={12} className="mt-0.5 shrink-0" /> : <AlertTriangle size={12} className="mt-0.5 shrink-0" />}
                    <span>{e.message}</span>
                  </div>
                ))}
              </div>
            )}

            <hr className="border-gray-100" />

            {/* OR Status */}
            {Object.keys(result.orStatus).length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">OR Question Status</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(result.orStatus).map(([sId, info]) => (
                    <span
                      key={sId}
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${info.filled >= info.required ? 'bg-green-50 text-green-700 border-green-300' : 'bg-orange-50 text-orange-700 border-orange-300'}`}
                    >
                      {info.label}: {info.filled}/{info.required}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Rules Quick-Ref */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Rules Quick-Ref</div>
              <table className="w-full text-[10px]">
                <tbody>
                  {([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).map(kl => {
                    const t = Math.round((result.klSummary[kl]?.target || 0));
                    const max = KL_MAX_MARKS[kl];
                    return (
                      <tr key={kl} className="border-b border-gray-50">
                        <td className="py-0.5 text-gray-700 font-medium">{kl}</td>
                        <td className="py-0.5 text-gray-500">{t}M ({Math.round(KL_TARGETS[kl] * 100)}%)</td>
                        <td className="py-0.5 text-gray-400">&lt;={max}Q</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="py-0.5 text-gray-700 font-medium">OR</td>
                    <td className="py-0.5 text-gray-500 col-span-2">3M+5M+6M: 1 each</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* AI Tab */
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <Zap size={12} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-800 mb-1">AI Blueprint Assistant</div>
                <p className="text-xs text-indigo-700 leading-relaxed">{aiMessage}</p>
              </div>
            </div>

            {result.errors.map((e, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded p-2 text-xs space-y-1">
                <div className={`font-semibold ${e.type === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
                  {e.type === 'error' ? '🔴' : '🟡'} {e.message}
                </div>
                {e.detail && <div className="text-gray-600">{e.detail}</div>}
                {AI_SUGGESTIONS[e.code] && (
                  <div className="text-indigo-600 italic">💡 {AI_SUGGESTIONS[e.code]}</div>
                )}
              </div>
            ))}

            {result.errors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-700">
                ✅ Blueprint அனைத்து விதிகளையும் பூர்த்தி செய்கிறது. Confirm செய்யலாம்!
              </div>
            )}

            <button
              onClick={onAutoFill}
              className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={12} /> Auto-fill Blueprint
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: BlueprintItem;
  readOnly: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onUpdate: (id: string, field: keyof BlueprintItem, value: unknown) => void;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent, item: BlueprintItem) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item, readOnly, isEditing, onEdit, onClose, onUpdate, onRemove, onDragStart,
}) => {
  const markColor = MARK_COLORS[item.marksPerQuestion] || 'bg-gray-50 border-gray-200 text-gray-900';
  const klBorder = `border-l-4 ${KL_COLORS[item.knowledgeLevel]?.border || 'border-l-gray-300'}`;

  return (
    <div className="space-y-0.5">
      {/* Main card */}
      <div
        draggable={!readOnly}
        onDragStart={e => onDragStart(e, item)}
        onClick={() => !readOnly && onEdit()}
        className={`p-1.5 rounded-sm text-xs border shadow-sm w-full relative transition-all ${markColor} ${klBorder} ${!readOnly ? 'hover:shadow-md cursor-pointer active:scale-95' : 'cursor-default'}`}
      >
        <div className="font-bold flex justify-between items-center px-0.5">
          <span>{item.questionCount}Q</span>
          <span className="text-[10px] opacity-70">({item.totalMarks}M)</span>
        </div>
        <div className="flex justify-between items-center mt-0.5 gap-1">
          <KLBadge level={item.knowledgeLevel} short />
          <span className="text-[8px] opacity-60">{item.cognitiveProcess.split(' ')[0]}</span>
          <span className="text-[8px] opacity-60">{item.itemFormat}</span>
        </div>
        {!readOnly && (
          <button
            onClick={e => { e.stopPropagation(); onRemove(item.id); }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-60 transition-opacity text-[9px] font-bold"
            title="Remove"
          >
            ×
          </button>
        )}
      </div>

      {/* OR (Option B) card */}
      {item.hasInternalChoice && (
        <div
          className={`p-1.5 rounded-sm text-xs text-center border shadow-sm w-full relative transition-all border-dashed bg-purple-50/60 border-purple-300 ${!readOnly ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
          onClick={() => !readOnly && onEdit()}
        >
          <div className="font-bold flex justify-between items-center px-0.5 text-purple-700">
            <span>{item.questionCount}Q (OR)</span>
            <span className="text-[10px] opacity-70">({item.totalMarks}M)</span>
          </div>
          <div className="flex justify-between items-center mt-0.5 gap-1">
            <KLBadge level={item.knowledgeLevelB || item.knowledgeLevel} short />
            <span className="text-[8px] opacity-60 text-purple-600">{(item.cognitiveProcessB || item.cognitiveProcess).split(' ')[0]}</span>
            <span className="text-[9px] font-bold text-purple-600">OR</span>
          </div>
        </div>
      )}

      {/* Edit popover */}
      {isEditing && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-64 space-y-3 text-sm"
          style={{ top: '100%', left: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-800">Edit Item ({item.marksPerQuestion}M)</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={14} /></button>
          </div>

          {/* Q Count */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Question Count</label>
            <input
              type="number" min="0" max="10"
              value={item.questionCount}
              onChange={e => onUpdate(item.id, 'questionCount', Number(e.target.value))}
              className="w-full text-sm border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Knowledge Level */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Knowledge Level (A)</label>
            <select
              value={item.knowledgeLevel}
              onChange={e => onUpdate(item.id, 'knowledgeLevel', e.target.value as KnowledgeLevel)}
              className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Cognitive Process */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Cognitive Process (A)</label>
            <select
              value={item.cognitiveProcess}
              onChange={e => onUpdate(item.id, 'cognitiveProcess', e.target.value as CognitiveProcess)}
              className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Item Format */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Item Format</label>
            <select
              value={item.itemFormat}
              onChange={e => onUpdate(item.id, 'itemFormat', e.target.value as ItemFormat)}
              className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {Object.values(ItemFormat).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* OR Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`or-${item.id}`}
              checked={item.hasInternalChoice}
              onChange={e => onUpdate(item.id, 'hasInternalChoice', e.target.checked)}
              disabled={item.marksPerQuestion === 1}
              className="rounded"
            />
            <label htmlFor={`or-${item.id}`} className="text-xs text-gray-700">Internal Choice (OR)</label>
          </div>

          {/* Option B settings */}
          {item.hasInternalChoice && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-[10px] font-bold text-purple-600 uppercase">Option B Settings</div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Knowledge Level (B)</label>
                <select
                  value={item.knowledgeLevelB || item.knowledgeLevel}
                  onChange={e => onUpdate(item.id, 'knowledgeLevelB', e.target.value as KnowledgeLevel)}
                  className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Cognitive Process (B)</label>
                <select
                  value={item.cognitiveProcessB || item.cognitiveProcess}
                  onChange={e => onUpdate(item.id, 'cognitiveProcessB', e.target.value as CognitiveProcess)}
                  className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Summary Bar ──────────────────────────────────────────────────────────────

interface SummaryBarProps {
  result: ValidationResult;
  totalMarks: number;
}
const SummaryBar: React.FC<SummaryBarProps> = ({ result, totalMarks }) => {
  const filled = result.grandTotal;
  const pct = Math.min(100, Math.round((filled / Math.max(totalMarks, 1)) * 100));

  return (
    <div className="flex items-center gap-4 text-xs">
      {([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).map(kl => {
        const { marks, target } = result.klSummary[kl] || { marks: 0, target: 0 };
        const c = KL_COLORS[kl];
        const ok = Math.abs(marks - target) <= 2;
        return (
          <div key={kl} className={`px-3 py-1.5 rounded-full border font-semibold ${ok && marks > 0 ? c.badge : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {kl.toUpperCase()} {marks}/{target}M
          </div>
        );
      })}
      <div className="ml-auto flex items-center gap-2">
        <div className="text-gray-500">Total:</div>
        <div className={`font-black text-lg ${filled === totalMarks ? 'text-green-600' : 'text-red-600'}`}>
          {filled}/{totalMarks}M
        </div>
      </div>
    </div>
  );
};

// ─── BlueprintMatrix (main export) ────────────────────────────────────────────

interface BlueprintMatrixProps {
  blueprint: Blueprint;
  curriculum: Curriculum;
  paperType: PaperType;
  onUpdateItem: (id: string, field: keyof BlueprintItem, value: unknown) => void;
  onMoveItem: (itemId: string, unitId: string, sectionId: string, subUnitId: string) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (unitId: string, subUnitId: string, sectionId: string) => void;
  onAutoFill: () => void;
  readOnly?: boolean;
}

export const BlueprintMatrix: React.FC<BlueprintMatrixProps> = ({
  blueprint,
  curriculum,
  paperType,
  onUpdateItem,
  onMoveItem,
  onRemoveItem,
  onAddItem,
  onAutoFill,
  readOnly = false,
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const sections = useMemo(
    () => [...(paperType?.sections || [])].sort((a, b) => a.marks - b.marks),
    [paperType],
  );

  const validation = useMemo(
    () => validateBlueprint(blueprint, paperType),
    [blueprint, paperType],
  );

  const aiMessage = useMemo(
    () => getAISuggestion(validation.errors),
    [validation.errors],
  );

  // ── Drag handlers ──
  const handleDragStart = useCallback((e: React.DragEvent, item: BlueprintItem) => {
    if (readOnly) return;
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  }, [readOnly]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [readOnly]);

  const handleDrop = useCallback((e: React.DragEvent, unitId: string, subUnitId: string, sectionId: string) => {
    if (readOnly) return;
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    onMoveItem(itemId, unitId, sectionId, subUnitId);
  }, [readOnly, onMoveItem]);

  // ── Helpers ──
  const getCellItems = useCallback((unitId: string, subUnitId: string, sectionId: string): BlueprintItem[] =>
    blueprint.items.filter(i => i.unitId === unitId && i.subUnitId === subUnitId && i.sectionId === sectionId),
    [blueprint.items],
  );

  const getSubUnitTotal = useCallback((unitId: string, subUnitId: string): number =>
    blueprint.items.filter(i => i.unitId === unitId && i.subUnitId === subUnitId)
      .reduce((acc, i) => acc + i.totalMarks, 0),
    [blueprint.items],
  );

  const getUnitTotal = useCallback((unitId: string): number =>
    blueprint.items.filter(i => i.unitId === unitId)
      .reduce((acc, i) => acc + i.totalMarks, 0),
    [blueprint.items],
  );

  const getUnitPercent = useCallback((unitId: string): number => {
    const t = getUnitTotal(unitId);
    return blueprint.totalMarks > 0 ? Math.round((t / blueprint.totalMarks) * 100) : 0;
  }, [getUnitTotal, blueprint.totalMarks]);

  return (
    <div className="space-y-4 text-black">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold uppercase border-b-2 border-black inline-block px-6 pb-1 tracking-widest">
          Blue Print
        </h2>
        <div className="flex justify-center flex-wrap gap-6 mt-3 text-sm font-bold text-gray-700">
          <span>Class: {blueprint.classLevel}</span>
          <span>Subject: {blueprint.subject}</span>
          <span>Set: {blueprint.setId || 'A'}</span>
          <span>Max Marks: {blueprint.totalMarks}</span>
        </div>
      </div>

      {/* Summary Bar */}
      <SummaryBar result={validation} totalMarks={blueprint.totalMarks} />

      {/* Matrix + Validation side-by-side */}
      <div className="flex gap-4 items-start">
        {/* Matrix table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-800 min-w-[600px]">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="border border-gray-700 p-2 w-8 text-center">#</th>
                <th className="border border-gray-700 p-2 text-left">UNIT COMPONENT</th>
                <th className="border border-gray-700 p-2 text-left">LESSON / TOPIC</th>
                <th className="border border-gray-700 p-2 text-center bg-yellow-500 text-black font-bold w-14">MARKS</th>
                {sections.map(s => (
                  <th key={s.id} className="border border-gray-700 p-2 text-center">
                    <div className="font-bold">{s.marks} Marks</div>
                    <div className="text-[10px] text-gray-300 font-normal">COUNT: {s.count}</div>
                    {s.optionCount > 0 && (
                      <div className="text-[10px] text-purple-300 font-normal">+OR:{s.optionCount}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {curriculum.units.map(unit => {
                const unitPct = getUnitPercent(unit.id);
                const unitTotal = getUnitTotal(unit.id);
                return (
                  <React.Fragment key={unit.id}>
                    {unit.subUnits.map((subUnit, sIdx) => {
                      const subTotal = getSubUnitTotal(unit.id, subUnit.id);
                      return (
                        <tr key={subUnit.id} className="hover:bg-gray-50 group">
                          {/* Unit cell (rowspan) */}
                          {sIdx === 0 && (
                            <td
                              rowSpan={unit.subUnits.length}
                              className="border border-gray-300 p-2 text-center font-bold text-gray-500 bg-white align-middle"
                            >
                              {unit.unitNumber}
                            </td>
                          )}
                          {sIdx === 0 && (
                            <td
                              rowSpan={unit.subUnits.length}
                              className="border border-gray-300 p-2 font-bold text-blue-800 bg-white align-top"
                            >
                              <div>{unit.name}</div>
                              <div className="text-[15px] text-indigo-700 font-normal mt-0.5">
                                {unitPct}% ({unitTotal}M)
                              </div>
                            </td>
                          )}

                          {/* Sub-unit name */}
                          <td className="border border-gray-300 p-2 text-gray-600 italic text-xs">
                            {subUnit.name}
                          </td>

                          {/* Sub-unit marks total */}
                          <td className="border border-gray-300 p-2 text-center font-bold bg-yellow-50 text-sm">
                            {subTotal || '-'}
                          </td>

                          {/* Section cells */}
                          {sections.map(section => {
                            const cellItems = getCellItems(unit.id, subUnit.id, section.id);
                            return (
                              <td
                                key={section.id}
                                className="border border-gray-300 p-1 align-top min-h-[3rem] min-w-[5rem] relative"
                                onDragOver={handleDragOver}
                                onDrop={e => handleDrop(e, unit.id, subUnit.id, section.id)}
                              >
                                <div className="space-y-0.5 relative">
                                  {cellItems.map(item => (
                                    <div key={item.id} className="relative group/item">
                                      <ItemCard
                                        item={item}
                                        readOnly={readOnly}
                                        isEditing={editingItemId === item.id}
                                        onEdit={() => setEditingItemId(item.id)}
                                        onClose={() => setEditingItemId(null)}
                                        onUpdate={onUpdateItem}
                                        onRemove={onRemoveItem}
                                        onDragStart={handleDragStart}
                                      />
                                    </div>
                                  ))}
                                  {!readOnly && (
                                    <button
                                      onClick={() => onAddItem(unit.id, subUnit.id, section.id)}
                                      className="w-full text-[10px] text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 border border-dashed border-gray-200 hover:border-indigo-300 rounded py-1 transition-all mt-0.5"
                                      title="Add question"
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Unit total row */}
                    <tr className="bg-indigo-900 text-white font-bold text-center text-xs">
                      <td colSpan={3} className="border border-indigo-700 p-1.5 text-right uppercase tracking-wider pr-3">
                        Unit {unit.unitNumber} Total:
                      </td>
                      <td className="border border-indigo-700 p-1.5 bg-yellow-400 text-black font-black">
                        {unitTotal}
                      </td>
                      {sections.map(s => {
                        const count = blueprint.items
                          .filter(i => i.unitId === unit.id && i.sectionId === s.id)
                          .reduce((acc, i) => acc + i.questionCount, 0);
                        return (
                          <td key={s.id} className="border border-indigo-700 p-1.5 text-indigo-200">
                            {count || ''}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* Grand Total row */}
              <tr className="bg-gray-900 text-white font-black text-center text-sm">
                <td colSpan={3} className="border border-gray-700 p-3 text-right uppercase tracking-widest pr-4">
                  Total Aggregates
                </td>
                <td className={`border border-gray-700 p-3 text-xl ${validation.grandTotal === blueprint.totalMarks ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                  {validation.grandTotal}
                </td>
                {sections.map(s => {
                  const total = blueprint.items
                    .filter(i => i.sectionId === s.id)
                    .reduce((acc, i) => acc + i.questionCount, 0);
                  const totalM = blueprint.items
                    .filter(i => i.sectionId === s.id)
                    .reduce((acc, i) => acc + i.totalMarks, 0);
                  return (
                    <td key={s.id} className="border border-gray-700 p-2 align-middle">
                      <div className="text-lg">{total}</div>
                      <div className="text-[10px] opacity-60 font-normal">{totalM}M</div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Validation panel */}
        <div className="w-64 shrink-0">
          <ValidationPanel
            result={validation}
            paperType={paperType}
            aiMessage={aiMessage}
            onAutoFill={onAutoFill}
          />
        </div>
      </div>

      {/* Blueprint Summary (like screenshot 1 bottom section) */}
      <BlueprintSummaryTable blueprint={blueprint} paperType={paperType} validation={validation} />
    </div>
  );
};

// ─── Blueprint Summary Table ─────────────────────────────────────────────────

interface BlueprintSummaryTableProps {
  blueprint: Blueprint;
  paperType: PaperType;
  validation: ValidationResult;
}

const BlueprintSummaryTable: React.FC<BlueprintSummaryTableProps> = ({ blueprint, validation }) => {
  const items = blueprint.items;
  const [open, setOpen] = useState(true);

  // Knowledge Level summary
  const klRows = (Object.values(KnowledgeLevel) as KnowledgeLevel[]).map(kl => ({
    label: kl,
    count: items.filter(i => i.knowledgeLevel === kl).length,
    marks: validation.klSummary[kl]?.marks || 0,
  }));

  // Item Format summary
  const formatMap: Record<string, { count: number; marks: number }> = {};
  items.forEach(i => {
    const k = i.itemFormat;
    if (!formatMap[k]) formatMap[k] = { count: 0, marks: 0 };
    formatMap[k].count++;
    formatMap[k].marks += i.totalMarks;
  });

  // Cognitive Process summary
  const cpMap: Record<string, { count: number; marks: number }> = {};
  items.forEach(i => {
    const k = i.cognitiveProcess;
    if (!cpMap[k]) cpMap[k] = { count: 0, marks: 0 };
    cpMap[k].count++;
    cpMap[k].marks += i.totalMarks;
  });

  // OR summary
  const withOR = items.filter(i => i.hasInternalChoice).length;
  const withoutOR = items.length - withOR;

  const totalItems = items.length;
  const totalM = validation.grandTotal;

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-3 bg-blue-50 text-blue-800 font-bold text-sm hover:bg-blue-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Info size={14} /> Blueprint Summary
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-normal text-blue-500">Grand Total: {totalItems} Items | {totalM} Marks</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-gray-200">
          {/* Knowledge Level */}
          <SummaryColumn
            title="Knowledge Level"
            rows={klRows.map(r => ({ label: r.label, count: r.count, marks: r.marks }))}
          />
          {/* Item Format */}
          <SummaryColumn
            title="Item Format"
            rows={Object.entries(formatMap).map(([k, v]) => ({ label: k, count: v.count, marks: v.marks }))}
          />
          {/* Cognitive Process */}
          <SummaryColumn
            title="Cognitive Process"
            rows={Object.entries(cpMap).map(([k, v]) => ({ label: k.split(' ')[0], count: v.count, marks: v.marks }))}
          />
          {/* Option/Choice */}
          <SummaryColumn
            title="Option / Choice"
            rows={[
              { label: 'With Option', count: withOR, marks: items.filter(i => i.hasInternalChoice).reduce((a, i) => a + i.totalMarks, 0) },
              { label: 'No Option', count: withoutOR, marks: items.filter(i => !i.hasInternalChoice).reduce((a, i) => a + i.totalMarks, 0) },
            ]}
          />
        </div>
      )}
    </div>
  );
};

interface SummaryColumnProps {
  title: string;
  rows: { label: string; count: number; marks: number }[];
}
const SummaryColumn: React.FC<SummaryColumnProps> = ({ title, rows }) => (
  <div className="p-3">
    <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">{title}</div>
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-400 text-[10px]">
          <th className="text-left font-normal pb-1"></th>
          <th className="text-center font-normal pb-1">Qns</th>
          <th className="text-center font-normal pb-1">Marks</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-gray-100">
            <td className="py-1 text-gray-700 font-medium">{r.label}</td>
            <td className="py-1 text-center text-gray-600">{r.count}</td>
            <td className="py-1 text-center font-bold text-gray-800">{r.marks}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default BlueprintMatrix;
