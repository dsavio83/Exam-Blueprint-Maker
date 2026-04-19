import React, { useState, useMemo, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Info, RefreshCw, ClipboardCheck } from 'lucide-react';

// ─── Enums ───────────────────────────────────────────────────────────────────
export enum KnowledgeLevel {
  BASIC = 'Basic',
  AVERAGE = 'Average',
  PROFOUND = 'Profound',
}

export enum CognitiveProcess {
  CP1 = 'Conceptual Clarity',
  CP2 = 'Application Skill',
  CP3 = 'Computational Thinking',
  CP4 = 'Analytical Thinking',
  CP5 = 'Critical Thinking',
  CP6 = 'Creative Thinking',
  CP7 = 'Values/Attitudes'
}

export enum ItemFormat {
  SR1 = 'MCI',
  SR2 = 'MI',
  CRS1 = 'VSA',
  CRS2 = 'SA',
  CRL = 'E',
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

/** Bloom's KL weightage targets — computed per totalMarks in validation */
const KL_TARGETS: Record<KnowledgeLevel, number> = {
  [KnowledgeLevel.BASIC]: 0.30,
  [KnowledgeLevel.AVERAGE]: 0.50,
  [KnowledgeLevel.PROFOUND]: 0.20,
};

const KL_COLORS: Record<KnowledgeLevel, { bg: string; border: string; text: string; badge: string }> = {
  [KnowledgeLevel.BASIC]:    { bg: 'bg-green-50',  border: 'border-l-green-500',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800'  },
  [KnowledgeLevel.AVERAGE]:  { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  [KnowledgeLevel.PROFOUND]: { bg: 'bg-red-50',    border: 'border-l-red-500',    text: 'text-red-700',    badge: 'bg-red-100 text-red-800'       },
};

const MARK_COLORS: Record<number, string> = {
  1: 'bg-blue-50 border-blue-200 text-blue-900',
  2: 'bg-green-50 border-green-200 text-green-900',
  3: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  5: 'bg-orange-50 border-orange-200 text-orange-900',
  6: 'bg-purple-50 border-purple-200 text-purple-900',
};

// ─── Validation Engine ───────────────────────────────────────────────────────

interface ValidationError {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  detail?: string;
}

interface ValidationResult {
  errors: ValidationError[];
  klSummary: Record<KnowledgeLevel, { marks: number; target: number }>;
  sectionSummary: { sectionId: string; marks: number; count: number; filled: number }[];
  orStatus: Record<string, { filled: number; required: number; label: string }>;
  grandTotal: number;
  isValid: boolean;
  subUnitCoverage: { unitId: string; subUnitId: string; marks: number; pct: number }[];
}

function validateBlueprint(blueprint: Blueprint, paperType: PaperType, curriculum: Curriculum): ValidationResult {
  const rawErrors: ValidationError[] = [];
  const items = blueprint.items;

  // deduplicated push
  const pushError = (err: ValidationError) => {
    if (!rawErrors.some(e => e.code === err.code && e.message === err.message)) {
      rawErrors.push(err);
    }
  };

  // safe empty klSummary
  const emptyKlSummary = (): ValidationResult['klSummary'] =>
    Object.fromEntries(
      Object.values(KnowledgeLevel).map(kl => [kl, { marks: 0, target: 0 }])
    ) as ValidationResult['klSummary'];

  if (!paperType?.sections) {
    return { errors: [{ type: 'error', code: 'PAPER_TYPE_MISSING', message: 'பேப்பர் டைப் கிடைக்கவில்லை.' }],
      klSummary: emptyKlSummary(), sectionSummary: [], orStatus: {}, grandTotal: 0, isValid: false, subUnitCoverage: [] };
  }
  if (!curriculum?.units) {
    return { errors: [{ type: 'error', code: 'CURRICULUM_MISSING', message: 'பாடத்திட்டம் கிடைக்கவில்லை.' }],
      klSummary: emptyKlSummary(), sectionSummary: [], orStatus: {}, grandTotal: 0, isValid: false, subUnitCoverage: [] };
  }

  // ── 1. Grand total ──────────────────────────────────────────────────────────
  const grandTotal = items.reduce((acc, i) => acc + i.totalMarks, 0);
  if (items.length > 0 && grandTotal !== blueprint.totalMarks) {
    pushError({
      type: 'error', code: 'TOTAL_MISMATCH',
      message: `மொத்த மதிப்பெண் ${grandTotal}M ≠ எதிர்பார்க்கப்பட்ட ${blueprint.totalMarks}M`,
      detail: 'Blueprint மதிப்பெண்ணை சரியாக பகிர்ந்தளிக்கவும்.',
    });
  }

  // ── 2. Knowledge Level distribution ────────────────────────────────────────
  const klMarks: Record<KnowledgeLevel, number> = {
    [KnowledgeLevel.BASIC]: 0, [KnowledgeLevel.AVERAGE]: 0, [KnowledgeLevel.PROFOUND]: 0,
  };
  items.forEach(item => { klMarks[item.knowledgeLevel] += item.totalMarks; });

  let perfectKL = items.length > 0;
  const klSummary = emptyKlSummary();

  ([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).forEach(kl => {
    // Targets computed from actual totalMarks (not hardcoded)
    const target = Math.round(blueprint.totalMarks * KL_TARGETS[kl]);
    const marks = klMarks[kl] || 0;
    klSummary[kl] = { marks, target };

    if (items.length === 0) return;

    if (marks === 0) {
      perfectKL = false;
      pushError({ type: 'error', code: `KL_MISSING_${kl.toUpperCase()}`,
        message: `${kl}: 0M — தேவை ${target}M (${Math.round(KL_TARGETS[kl] * 100)}%)`,
        detail: `${kl} நிலை வினாக்கள் இல்லை.` });
    } else if (marks !== target) {
      perfectKL = false;
      const diff = marks - target;
      pushError({ type: 'warning', code: `KL_DEVIATION_${kl.toUpperCase()}`,
        message: `${kl}: ${marks}M — இலக்கு ${target}M (${diff > 0 ? '+' : ''}${diff}M)`,
        detail: `${target}M இருக்க வேண்டும் (${Math.round(KL_TARGETS[kl] * 100)}%).` });
    }
  });

  if (perfectKL && items.length > 0) {
    pushError({ type: 'info', code: 'EXCELLENCE_KL',
      message: "Bloom's Target மிகச்சரியாக உள்ளது",
      detail: 'அனைத்து Knowledge Level களும் இலக்கிற்கு ஏற்ப உள்ளன.' });
  }

  // ── 3. Section fill validation ──────────────────────────────────────────────
  const sectionSummary: ValidationResult['sectionSummary'] = paperType.sections.map(s => {
    const filled = items.filter(i => i.sectionId === s.id).reduce((acc, i) => acc + i.questionCount, 0);
    if (items.length > 0 && filled !== s.count) {
      pushError({
        type: filled > s.count ? 'error' : 'warning',
        code: `SEC_COUNT_${s.id}`,
        message: `${s.marks}M பிரிவு: ${filled}/${s.count} வினாக்கள்`,
        detail: filled > s.count ? 'பிரிவு வரம்பை மீறியுள்ளது.' : 'பிரிவு முழுமையாக நிரப்பப்படவில்லை.',
      });
    }
    return { sectionId: s.id, marks: s.marks, count: s.count, filled };
  });

  // ── 4. Internal Choice (OR) validation ─────────────────────────────────────
  // Rule: Each section with optionCount > 0 needs exactly 1 OR question.
  // OR counts must use questionCount (not item count).
  const orStatus: ValidationResult['orStatus'] = {};
  paperType.sections.forEach(s => {
    if (s.optionCount > 0) {
      const orItems = items.filter(i => i.sectionId === s.id && i.hasInternalChoice);
      const orQCount = orItems.reduce((acc, i) => acc + i.questionCount, 0);
      orStatus[s.id] = { filled: orQCount, required: s.optionCount, label: `${s.marks}M` };
      if (items.length > 0) {
        if (orQCount === 0) {
          pushError({ type: 'warning', code: `OR_MISSING_${s.id}`,
            message: `${s.marks}M: ஆப்ஷன் வினா (OR) இல்லை`,
            detail: `${s.optionCount} வினாவிற்கு internal choice அமைக்கவும்.` });
        } else if (orQCount > s.optionCount) {
          pushError({ type: 'error', code: `OR_EXCESS_${s.id}`,
            message: `${s.marks}M: OR ${orQCount} — அனுமதிக்கப்பட்டது ${s.optionCount} மட்டுமே`,
            detail: 'கூடுதல் OR வினாக்களை நீக்கவும்.' });
        } else {
          pushError({ type: 'info', code: `OR_OK_${s.id}`,
            message: `${s.marks}M: OR சரியாக உள்ளது (${orQCount}/${s.optionCount})`,
            detail: 'Internal choice சரியாக அமைக்கப்பட்டுள்ளது.' });
        }
      }
    }
  });

  // ── 5. OR Sub-unit & Unit spread validation ─────────────────────────────────
  // Rule A: ஒரே sub-unit-ல் OR வரக்கூடாது → alert
  // Rule B: ஒரே unit-ல் OR குவியக்கூடாது (multiple units exist) → alert
  const choiceItems = items.filter(i => i.hasInternalChoice);
  const totalUnitCount = curriculum.units.length;

  if (choiceItems.length > 0 && items.length > 0) {
    // Sub-unit clash check
    const subUnitOrMap = new Map<string, string[]>(); // subUnitId → [sectionIds]
    choiceItems.forEach(item => {
      const existing = subUnitOrMap.get(item.subUnitId) || [];
      subUnitOrMap.set(item.subUnitId, [...existing, item.sectionId]);
    });
    subUnitOrMap.forEach((sectionIds, subUnitId) => {
      if (sectionIds.length > 1) {
        const subName = curriculum.units.flatMap(u => u.subUnits).find(su => su.id === subUnitId)?.name || subUnitId;
        pushError({ type: 'warning', code: `OR_SUBUNIT_CLASH_${subUnitId}`,
          message: `"${subName}" — ஒரே பாடப்பகுதியில் ${sectionIds.length} OR வினாக்கள்`,
          detail: 'OR வினாக்களை வெவ்வேறு பாடப்பகுதிகளில் பரவச் செய்யவும்.' });
      }
    });

    // Unit concentration check (only when > 1 unit)
    if (totalUnitCount > 1) {
      const unitOrMap = new Map<string, number>(); // unitId → count
      choiceItems.forEach(item => {
        unitOrMap.set(item.unitId, (unitOrMap.get(item.unitId) || 0) + item.questionCount);
      });
      const totalOrQ = choiceItems.reduce((acc, i) => acc + i.questionCount, 0);
      unitOrMap.forEach((cnt, unitId) => {
        const unit = curriculum.units.find(u => u.id === unitId);
        const unitName = unit?.name || unitId;
        const pct = totalOrQ > 0 ? Math.round((cnt / totalOrQ) * 100) : 0;
        if (pct > 60) {
          pushError({ type: 'warning', code: `OR_UNIT_CONCENTRATION_${unitId}`,
            message: `"${unitName}" — OR வினாக்களில் ${pct}% குவிந்துள்ளது`,
            detail: 'OR வினாக்களை வெவ்வேறு பாடங்களில் பரவச் செய்வது சிறந்தது.' });
        }
      });
    }

    // KL mismatch between Option A & B
    choiceItems.forEach(item => {
      if (item.knowledgeLevelB && item.knowledgeLevel !== item.knowledgeLevelB) {
        pushError({ type: 'error', code: `OPTION_KL_MISMATCH_${item.id}`,
          message: `${item.marksPerQuestion}M OR: A(${item.knowledgeLevel}) ≠ B(${item.knowledgeLevelB})`,
          detail: 'Option A மற்றும் B ஒரே KL-ல் இருக்க வேண்டும்.' });
      }
    });

    // All good OR spread
    const subUnitClashes = [...subUnitOrMap.values()].filter(v => v.length > 1).length;
    if (subUnitClashes === 0 && choiceItems.length > 1) {
      pushError({ type: 'info', code: 'EXCELLENCE_OR',
        message: 'OR வினாக்கள் சரியாக பரவியுள்ளன',
        detail: 'சாய்ஸ் வினாக்கள் வெவ்வேறு பாடங்களில் சீராக உள்ளன.' });
    }
  }

  // ── 6. Sub-unit coverage & balance ────────────────────────────────────────
  const subUnitCoverage: ValidationResult['subUnitCoverage'] = [];
  let uncoveredSubUnits = 0;

  curriculum.units.forEach(unit => {
    unit.subUnits.forEach(su => {
      const suMarks = items.filter(i => i.unitId === unit.id && i.subUnitId === su.id)
                           .reduce((acc, i) => acc + i.totalMarks, 0);
      const pct = blueprint.totalMarks > 0 ? Math.round((suMarks / blueprint.totalMarks) * 100) : 0;
      subUnitCoverage.push({ unitId: unit.id, subUnitId: su.id, marks: suMarks, pct });
      if (suMarks === 0 && items.length > 0) {
        uncoveredSubUnits++;
        pushError({ type: 'warning', code: `SUBUNIT_EMPTY_${su.id}`,
          message: `"${su.name}" — வினாக்கள் ஒதுக்கப்படவில்லை`,
          detail: 'இந்த பாடப்பகுதியிலிருந்து குறைந்தது ஒரு வினா சேர்க்கவும்.' });
      }
    });
  });

  if (uncoveredSubUnits === 0 && items.length > 0) {
    pushError({ type: 'info', code: 'EXCELLENCE_COVERAGE',
      message: 'அனைத்து பாடப்பகுதிகளும் உள்ளடக்கப்பட்டுள்ளன',
      detail: 'எல்லா sub-units-லும் வினாக்கள் ஒதுக்கப்பட்டுள்ளன.' });
  }

  // ── 7. Unit mark concentration check ──────────────────────────────────────
  if (curriculum.units.length > 1 && items.length > 0) {
    curriculum.units.forEach(unit => {
      const uMarks = items.filter(i => i.unitId === unit.id).reduce((acc, i) => acc + i.totalMarks, 0);
      const uPct = blueprint.totalMarks > 0 ? Math.round((uMarks / blueprint.totalMarks) * 100) : 0;
      if (uPct > 50) {
        pushError({ type: 'warning', code: `UNIT_OVERWEIGHT_${unit.id}`,
          message: `"${unit.name}" — ${uPct}% மதிப்பெண்கள் (அதிகம்)`,
          detail: 'ஒரு பாடத்தில் 50%-க்கும் அதிகம் வினாக்கள் குவிவதை தவிர்க்கவும்.' });
      }
    });
  }

  // ── 8. Sub-unit mark balance check ────────────────────────────────────────
  if (items.length > 0) {
    const allSubMarks = subUnitCoverage.filter(s => s.marks > 0).map(s => s.marks);
    if (allSubMarks.length > 1) {
      const maxM = Math.max(...allSubMarks);
      const minM = Math.min(...allSubMarks);
      // Allow ±marks-of-one-section difference as reasonable imbalance
      const sectionMarkValues = paperType.sections.map(s => s.marks);
      const maxAllowedDiff = Math.max(...sectionMarkValues, 2);
      if ((maxM - minM) > maxAllowedDiff * 2) {
        pushError({ type: 'info', code: 'SUBUNIT_IMBALANCE',
          message: `பாடப்பகுதி மதிப்பெண் வேறுபாடு: ${minM}M – ${maxM}M`,
          detail: 'இது சாதாரணமானது. தேவைப்பட்டால் மதிப்பெண்களை சமப்படுத்தலாம்.' });
      }
    }
  }

  // ── 9. itemFormat for OR B side missing ────────────────────────────────────
  if (items.length > 0) {
    choiceItems.forEach(item => {
      if (!item.itemFormatB) {
        pushError({ type: 'info', code: `OR_FORMAT_B_MISSING_${item.id}`,
          message: `${item.marksPerQuestion}M OR: Option B format அமைக்கப்படவில்லை`,
          detail: 'Option B-க்கு Item Format தேர்வு செய்யவும்.' });
      }
    });
  }

  return {
    errors: rawErrors,
    klSummary,
    sectionSummary,
    orStatus,
    grandTotal,
    isValid: rawErrors.filter(e => e.type === 'error').length === 0,
    subUnitCoverage,
  };
}

// ─── Auto-fill Engine ────────────────────────────────────────────────────────
/**
 * Produces corrected items array:
 * 1. KL targets satisfied (Basic 30%, Average 50%, Profound 20%)
 * 2. OR: exactly s.optionCount per section, spread across different sub-units
 * 3. No OR in same sub-unit twice
 */
export function autoFillBlueprint(
  items: BlueprintItem[],
  paperType: PaperType,
  curriculum: Curriculum,
  totalMarks: number
): BlueprintItem[] {
  if (!items.length || !paperType || !curriculum) return items;

  const result = items.map(item => ({ ...item }));

  // Step 1: Fix KL distribution
  const klTargetMarks: Record<KnowledgeLevel, number> = {
    [KnowledgeLevel.BASIC]:    Math.round(totalMarks * KL_TARGETS[KnowledgeLevel.BASIC]),
    [KnowledgeLevel.AVERAGE]:  Math.round(totalMarks * KL_TARGETS[KnowledgeLevel.AVERAGE]),
    [KnowledgeLevel.PROFOUND]: Math.round(totalMarks * KL_TARGETS[KnowledgeLevel.PROFOUND]),
  };

  // Assign KL based on section marks: 1-2M → Basic, 3M → Average, 5-6M → Profound
  result.forEach(item => {
    if (item.marksPerQuestion <= 2) {
      item.knowledgeLevel = KnowledgeLevel.BASIC;
    } else if (item.marksPerQuestion === 3) {
      item.knowledgeLevel = KnowledgeLevel.AVERAGE;
    } else {
      item.knowledgeLevel = KnowledgeLevel.PROFOUND;
    }
    // Sync B side
    if (item.hasInternalChoice) {
      item.knowledgeLevelB = item.knowledgeLevel;
    }
  });

  // Verify and adjust Average — may need to absorb remainder
  const klActual: Record<KnowledgeLevel, number> = {
    [KnowledgeLevel.BASIC]: 0, [KnowledgeLevel.AVERAGE]: 0, [KnowledgeLevel.PROFOUND]: 0,
  };
  result.forEach(i => { klActual[i.knowledgeLevel] += i.totalMarks; });

  // If Basic overfills, reclassify some 2M items as Average
  if (klActual[KnowledgeLevel.BASIC] > klTargetMarks[KnowledgeLevel.BASIC]) {
    const excess = klActual[KnowledgeLevel.BASIC] - klTargetMarks[KnowledgeLevel.BASIC];
    let toMove = Math.round(excess / 2);
    result.forEach(item => {
      if (toMove > 0 && item.marksPerQuestion === 2 && item.knowledgeLevel === KnowledgeLevel.BASIC) {
        item.knowledgeLevel = KnowledgeLevel.AVERAGE;
        if (item.hasInternalChoice) item.knowledgeLevelB = KnowledgeLevel.AVERAGE;
        toMove -= item.totalMarks;
      }
    });
  }

  // Step 2: Fix OR — clear all existing, then assign correctly
  result.forEach(item => {
    item.hasInternalChoice = false;
    item.knowledgeLevelB = undefined;
    item.cognitiveProcessB = undefined;
    item.itemFormatB = undefined;
  });

  const allSubUnitIds = curriculum.units.flatMap(u => u.subUnits.map(su => su.id));
  const usedSubUnits = new Set<string>();

  paperType.sections.forEach(section => {
    if (section.optionCount <= 0) return;

    const sectionItems = result.filter(i => i.sectionId === section.id);
    let assigned = 0;

    // Pick items from different sub-units
    for (const item of sectionItems) {
      if (assigned >= section.optionCount) break;
      if (!usedSubUnits.has(item.subUnitId)) {
        item.hasInternalChoice = true;
        item.knowledgeLevelB = item.knowledgeLevel;
        item.cognitiveProcessB = item.cognitiveProcess;
        item.itemFormatB = item.itemFormat;
        usedSubUnits.add(item.subUnitId);
        assigned++;
      }
    }

    // If couldn't find unique sub-units, allow same sub-unit (fallback)
    if (assigned < section.optionCount) {
      for (const item of sectionItems) {
        if (assigned >= section.optionCount) break;
        if (!item.hasInternalChoice) {
          item.hasInternalChoice = true;
          item.knowledgeLevelB = item.knowledgeLevel;
          item.cognitiveProcessB = item.cognitiveProcess;
          item.itemFormatB = item.itemFormat;
          assigned++;
        }
      }
    }
  });

  return result;
}

// ─── KL Badge ────────────────────────────────────────────────────────────────
interface KLBadgeProps { level: KnowledgeLevel; short?: boolean }
const KLBadge: React.FC<KLBadgeProps> = ({ level, short }) => {
  const c = KL_COLORS[level];
  return (
    <span className={`text-[9px] uppercase font-bold px-1 rounded ${c.badge}`}>
      {short ? level[0] : level}
    </span>
  );
};

// ─── Validation Panel ────────────────────────────────────────────────────────
interface ValidationPanelProps {
  result: ValidationResult;
  paperType: PaperType;
  onAutoFill: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ result, paperType, onAutoFill }) => {
  const [checked, setChecked] = useState(false);

  const errors  = result.errors.filter(e => e.type === 'error');
  const warnings = result.errors.filter(e => e.type === 'warning');
  const infos   = result.errors.filter(e => e.type === 'info');

  const handleCheck = () => setChecked(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-sm bg-white h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Validation</span>
        {checked && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${result.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {result.isValid ? '✓ சரியாக உள்ளது' : `${errors.length} பிழை`}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* KL Progress bars — always visible */}
        {([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).map(kl => {
          const { marks, target } = result.klSummary[kl] || { marks: 0, target: 0 };
          const pct = Math.min(100, (marks / Math.max(target, 1)) * 100);
          const c = KL_COLORS[kl];
          const ok = marks === target;
          return (
            <div key={kl}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-semibold ${c.text}`}>{kl}</span>
                <span className={`text-xs font-bold ${ok ? 'text-green-600' : 'text-red-500'}`}>
                  {marks}/{target}M
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ok ? 'bg-green-500' : marks > target ? 'bg-red-400' : 'bg-amber-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {Math.round(KL_TARGETS[kl] * 100)}% இலக்கு
              </div>
            </div>
          );
        })}

        <hr className="border-gray-100" />

        {/* OR Status chips */}
        {Object.keys(result.orStatus).length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">OR நிலை</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(result.orStatus).map(([sId, info]) => (
                <span key={sId}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                    info.filled === info.required ? 'bg-green-50 text-green-700 border-green-300'
                    : info.filled > info.required ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-orange-50 text-orange-700 border-orange-300'}`}>
                  {info.label}: {info.filled}/{info.required}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Check button */}
        {!checked && (
          <button
            onClick={handleCheck}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ClipboardCheck size={14} /> Blueprint சரிபார்க்கவும்
          </button>
        )}

        {/* Results — shown only after check */}
        {checked && (
          <div className="space-y-2">
            {/* Re-check button */}
            <button
              onClick={() => setChecked(false)}
              className="w-full py-1.5 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              மீண்டும் சரிபார்க்கவும்
            </button>

            {result.errors.length === 0 ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 p-2.5 rounded-lg">
                <CheckCircle size={14} className="shrink-0" />
                <span className="text-xs font-semibold">அனைத்தும் சரியாக உள்ளது!</span>
              </div>
            ) : (
              <>
                {/* Errors */}
                {errors.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1">
                      <X size={10} /> பிழைகள் ({errors.length})
                    </div>
                    {errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                        <X size={12} className="mt-0.5 shrink-0 text-red-500" />
                        <div>
                          <div className="text-xs font-bold text-red-700">{e.message}</div>
                          {e.detail && <div className="text-[10px] text-red-500 mt-0.5">{e.detail}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-orange-600 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={10} /> கவனிக்கவும் ({warnings.length})
                    </div>
                    {warnings.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0 text-orange-500" />
                        <div>
                          <div className="text-xs font-bold text-orange-700">{e.message}</div>
                          {e.detail && <div className="text-[10px] text-orange-500 mt-0.5">{e.detail}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info / Good items */}
                {infos.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-green-600 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle size={10} /> நன்மைகள் ({infos.length})
                    </div>
                    {infos.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle size={12} className="mt-0.5 shrink-0 text-green-500" />
                        <div>
                          <div className="text-xs font-bold text-green-700">{e.message}</div>
                          {e.detail && <div className="text-[10px] text-green-600 mt-0.5">{e.detail}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Auto-fill button */}
            <button
              onClick={onAutoFill}
              className="w-full py-2 border-2 border-amber-400 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} /> Auto-fix Blueprint
            </button>
          </div>
        )}

        {/* Rules Quick-Ref */}
        <hr className="border-gray-100" />
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">விதிகள்</div>
          <table className="w-full text-[10px]">
            <tbody>
              {([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).map(kl => {
                const t = result.klSummary[kl]?.target || 0;
                return (
                  <tr key={kl} className="border-b border-gray-50">
                    <td className="py-0.5 text-gray-600 font-medium">{kl}</td>
                    <td className="py-0.5 text-gray-400">{t}M ({Math.round(KL_TARGETS[kl] * 100)}%)</td>
                  </tr>
                );
              })}
              <tr>
                <td className="py-0.5 text-gray-600 font-medium">OR</td>
                <td className="py-0.5 text-gray-400">Section optionCount-க்கு ஏற்ப</td>
              </tr>
            </tbody>
          </table>
        </div>
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
        className={`p-1.5 rounded-sm text-xs border shadow-sm w-full relative transition-all group/item ${markColor} ${klBorder} ${!readOnly ? 'hover:shadow-md cursor-pointer active:scale-95' : 'cursor-default'}`}
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
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 hover:bg-red-600 transition-opacity text-[9px] font-bold z-10 group-hover/item:opacity-100"
            title="Remove"
          >
            ×
          </button>
        )}
      </div>

      {/* OR (Option B) card */}
      {item.hasInternalChoice && (
        <div
          className={`p-1.5 rounded-sm text-xs text-center border shadow-sm w-full relative transition-all border-dashed bg-purple-50/60 border-purple-300 group/or ${!readOnly ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
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
          {!readOnly && (
            <button
              onClick={e => { e.stopPropagation(); onUpdate(item.id, 'hasInternalChoice', false); }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center opacity-0 hover:bg-purple-600 transition-opacity text-[9px] font-bold z-10 group-hover/or:opacity-100"
              title="Remove OR"
            >
              ×
            </button>
          )}
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

          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Question Count</label>
            <input
              type="number" min="0" max="10"
              value={item.questionCount}
              onChange={e => onUpdate(item.id, 'questionCount', Number(e.target.value))}
              className="w-full text-sm border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Knowledge Level (A)</label>
            <select value={item.knowledgeLevel}
              onChange={e => onUpdate(item.id, 'knowledgeLevel', e.target.value as KnowledgeLevel)}
              className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Cognitive Process (A)</label>
            <select value={item.cognitiveProcess}
              onChange={e => onUpdate(item.id, 'cognitiveProcess', e.target.value as CognitiveProcess)}
              className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Item Format</label>
            <select value={item.itemFormat}
              onChange={e => onUpdate(item.id, 'itemFormat', e.target.value as ItemFormat)}
              className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {Object.values(ItemFormat).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id={`or-${item.id}`}
              checked={item.hasInternalChoice}
              onChange={e => onUpdate(item.id, 'hasInternalChoice', e.target.checked)}
              disabled={item.marksPerQuestion === 1}
              className="rounded" />
            <label htmlFor={`or-${item.id}`} className="text-xs text-gray-700">Internal Choice (OR)</label>
          </div>

          {item.hasInternalChoice && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-[10px] font-bold text-purple-600 uppercase">Option B Settings</div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Knowledge Level (B)</label>
                <select value={item.knowledgeLevelB || item.knowledgeLevel}
                  onChange={e => onUpdate(item.id, 'knowledgeLevelB', e.target.value as KnowledgeLevel)}
                  className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Cognitive Process (B)</label>
                <select value={item.cognitiveProcessB || item.cognitiveProcess}
                  onChange={e => onUpdate(item.id, 'cognitiveProcessB', e.target.value as CognitiveProcess)}
                  className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Item Format (B)</label>
                <select value={item.itemFormatB || item.itemFormat}
                  onChange={e => onUpdate(item.id, 'itemFormatB', e.target.value as ItemFormat)}
                  className="w-full text-xs border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {Object.values(ItemFormat).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
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
  readOnly?: boolean;
  onRegenerate?: () => void;
  onConfirm?: () => void;
}
const SummaryBar: React.FC<SummaryBarProps> = ({ result, totalMarks, readOnly, onRegenerate, onConfirm }) => {
  const filled = result.grandTotal;
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs bg-gray-50/50 p-2 rounded-xl border border-gray-100 shadow-sm">
      {([KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND] as KnowledgeLevel[]).map(kl => {
        const { marks, target } = result.klSummary[kl] || { marks: 0, target: 0 };
        const c = KL_COLORS[kl];
        const ok = marks === target;
        return (
          <div key={kl} className={`px-3 py-1.5 rounded-full border font-bold ${ok && marks > 0 ? c.badge : 'bg-white text-gray-400 border-gray-200'}`}>
            {kl.toUpperCase()}: {marks}/{target}M
          </div>
        );
      })}

      {!readOnly && (
        <div className="flex items-center gap-2 ml-2 border-l pl-4 border-gray-200">
          <button onClick={onRegenerate}
            className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-100 flex items-center gap-1.5 transition-all text-[10px] shadow-sm">
            <RefreshCw size={12} /> Reset
          </button>
          <button onClick={onConfirm}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-1.5 transition-all text-[10px] shadow-sm shadow-blue-100">
            <CheckCircle size={12} /> Confirm
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 pr-2">
        <div className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Grand Total:</div>
        <div className={`font-black text-sm md:text-lg ${filled === totalMarks ? 'text-green-600' : 'text-red-600'}`}>
          {filled}/{totalMarks}M
        </div>
      </div>
    </div>
  );
};

// ─── Blueprint Summary Table ──────────────────────────────────────────────────

interface BlueprintSummaryTableProps {
  blueprint: Blueprint;
  validation: ValidationResult;
}

const BlueprintSummaryTable: React.FC<BlueprintSummaryTableProps> = ({ blueprint, validation }) => {
  const items = blueprint.items;
  const [open, setOpen] = useState(true);

  const klRows = (Object.values(KnowledgeLevel) as KnowledgeLevel[]).map(kl => ({
    label: kl,
    count: items.filter(i => i.knowledgeLevel === kl).length,
    marks: validation.klSummary[kl]?.marks || 0,
  }));

  const formatMap: Record<string, { count: number; marks: number }> = {};
  items.forEach(i => {
    if (!formatMap[i.itemFormat]) formatMap[i.itemFormat] = { count: 0, marks: 0 };
    formatMap[i.itemFormat].count++;
    formatMap[i.itemFormat].marks += i.totalMarks;
  });

  const cpMap: Record<string, { count: number; marks: number }> = {};
  items.forEach(i => {
    if (!cpMap[i.cognitiveProcess]) cpMap[i.cognitiveProcess] = { count: 0, marks: 0 };
    cpMap[i.cognitiveProcess].count++;
    cpMap[i.cognitiveProcess].marks += i.totalMarks;
  });

  // FIX: correct withOR/withoutOR counts
  const withORItems   = items.filter(i => i.hasInternalChoice);
  const withoutORItems = items.filter(i => !i.hasInternalChoice);
  const withORCount   = withORItems.reduce((a, i) => a + i.questionCount, 0);
  const withoutORCount = withoutORItems.reduce((a, i) => a + i.questionCount, 0);
  const withORMarks   = withORItems.reduce((a, i) => a + i.totalMarks, 0);
  const withoutORMarks = withoutORItems.reduce((a, i) => a + i.totalMarks, 0);

  // FIX: correct totalItems (no double-count)
  const totalItems = items.reduce((acc, i) => acc + i.questionCount, 0);
  const totalM = validation.grandTotal;

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-3 bg-blue-50 text-blue-800 font-bold text-sm hover:bg-blue-100 transition-colors">
        <span className="flex items-center gap-2"><Info size={14} /> Blueprint Summary</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-normal text-blue-500">Grand Total: {totalItems} Items | {totalM} Marks</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <SummaryColumn title="Knowledge Level"
            rows={klRows.map(r => ({ label: r.label, count: r.count, marks: r.marks }))} />
          <SummaryColumn title="Item Format"
            rows={Object.entries(formatMap).map(([k, v]) => ({ label: k, count: v.count, marks: v.marks }))} />
          <SummaryColumn title="Cognitive Process"
            rows={Object.entries(cpMap).map(([k, v]) => ({ label: k.split(' ')[0], count: v.count, marks: v.marks }))} />
          {/* FIX: corrected Choice column */}
          <SummaryColumn title="Option / Choice"
            rows={[
              { label: 'With Choice',    count: withORCount,    marks: withORMarks    },
              { label: 'Without Choice', count: withoutORCount, marks: withoutORMarks },
            ]} />
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
        {rows.map((r, i) => {
          const isTamil = /[\u0B80-\u0BFF]/.test(r.label);
          return (
            <tr key={i} className="border-t border-gray-100">
              <td className={`py-1 text-gray-700 font-medium whitespace-nowrap ${isTamil ? 'tamil-font' : ''}`}
                lang={isTamil ? 'ta' : 'en'}>{r.label}</td>
              <td className="py-1 text-center text-gray-600">{r.count}</td>
              <td className="py-1 text-center font-bold text-gray-800">{r.marks}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

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
  onRegenerate?: () => void;
  onConfirm?: () => void;
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
  onRegenerate,
  onConfirm,
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const sections = useMemo(
    () => [...(paperType?.sections || [])].sort((a, b) => a.marks - b.marks),
    [paperType],
  );

  const validation = useMemo(
    () => validateBlueprint(blueprint, paperType, curriculum),
    [blueprint, paperType, curriculum],
  );

  // ── Drag handlers ────────────────────────────────────────────────────────────
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

  // ── Cell helpers ─────────────────────────────────────────────────────────────
  const getCellItems = useCallback((unitId: string, subUnitId: string, sectionId: string): BlueprintItem[] =>
    blueprint.items.filter(i => i.unitId === unitId && i.subUnitId === subUnitId && i.sectionId === sectionId),
    [blueprint.items]);

  const getSubUnitTotal = useCallback((unitId: string, subUnitId: string): number =>
    blueprint.items.filter(i => i.unitId === unitId && i.subUnitId === subUnitId)
      .reduce((acc, i) => acc + i.totalMarks, 0),
    [blueprint.items]);

  const getUnitTotal = useCallback((unitId: string): number =>
    blueprint.items.filter(i => i.unitId === unitId)
      .reduce((acc, i) => acc + i.totalMarks, 0),
    [blueprint.items]);

  const getUnitPercent = useCallback((unitId: string): number => {
    const t = getUnitTotal(unitId);
    return blueprint.totalMarks > 0 ? Math.round((t / blueprint.totalMarks) * 100) : 0;
  }, [getUnitTotal, blueprint.totalMarks]);

  const getSubUnitPercent = useCallback((unitId: string, subUnitId: string): number => {
    const t = getSubUnitTotal(unitId, subUnitId);
    return blueprint.totalMarks > 0 ? Math.round((t / blueprint.totalMarks) * 100) : 0;
  }, [getSubUnitTotal, blueprint.totalMarks]);

  return (
    <div className="flex flex-col space-y-4 text-black">
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
      <SummaryBar
        result={validation}
        totalMarks={blueprint.totalMarks}
        readOnly={readOnly}
        onRegenerate={onRegenerate}
        onConfirm={onConfirm}
      />

      {/* Blueprint Summary Table */}
      <div className="md:order-last">
        <BlueprintSummaryTable blueprint={blueprint} validation={validation} />
      </div>

      {/* Matrix + Validation side-by-side */}
      <div className="flex flex-col md:flex-row gap-4 items-start w-full">
        {/* Matrix table */}
        <div className="w-full overflow-x-auto border border-gray-200 md:border-none">
          <table className="w-full text-sm border-collapse border border-gray-800 min-w-[800px] md:min-w-full">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="border border-gray-700 p-2 w-8 text-center">#</th>
                <th className="border border-gray-700 p-2 text-left">UNIT</th>
                <th className="border border-gray-700 p-2 text-left">SUB UNIT</th>
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
                      const subPct  = getSubUnitPercent(unit.id, subUnit.id);
                      return (
                        <tr key={subUnit.id} className="hover:bg-gray-50 group">
                          {sIdx === 0 && (
                            <td rowSpan={unit.subUnits.length}
                              className="border border-gray-300 p-2 text-center font-bold text-gray-500 bg-white align-middle">
                              {unit.unitNumber}
                            </td>
                          )}
                          {sIdx === 0 && (
                            <td rowSpan={unit.subUnits.length}
                              className="border border-gray-300 p-1 text-center bg-white align-middle w-10">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="font-bold text-blue-800 [writing-mode:vertical-rl] rotate-180 py-2 whitespace-nowrap text-[10px]">
                                  {unit.name}
                                </div>
                                <div className="text-[10px] text-indigo-700 font-bold">{unitPct}%</div>
                              </div>
                            </td>
                          )}

                          {/* Sub-unit name + per-lesson progress */}
                          <td className="border border-gray-300 p-2 align-top">
                            <div className="flex flex-col gap-1.5">
                              <div className="text-gray-600 italic text-xs leading-tight">{subUnit.name}</div>
                              {subTotal > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500"
                                      style={{ width: `${Math.min(subPct, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{subPct}%</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Sub-unit marks total */}
                          <td className="border border-gray-300 p-2 text-center font-bold bg-yellow-50 text-sm">
                            {subTotal || '-'}
                          </td>

                          {/* Section cells */}
                          {sections.map(section => {
                            const cellItems = getCellItems(unit.id, subUnit.id, section.id);
                            return (
                              <td key={section.id}
                                className="border border-gray-300 p-1 align-top min-h-[3rem] min-w-[5rem] relative"
                                onDragOver={handleDragOver}
                                onDrop={e => handleDrop(e, unit.id, subUnit.id, section.id)}>
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
                                      title="Add question">
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
                  const total  = blueprint.items.filter(i => i.sectionId === s.id).reduce((acc, i) => acc + i.questionCount, 0);
                  const totalM = blueprint.items.filter(i => i.sectionId === s.id).reduce((acc, i) => acc + i.totalMarks, 0);
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
        <div className="w-full md:w-64 shrink-0">
          <ValidationPanel
            result={validation}
            paperType={paperType}
            onAutoFill={onAutoFill}
          />
        </div>
      </div>
    </div>
  );
};

export default BlueprintMatrix;
