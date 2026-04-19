import React, { useMemo } from 'react';

// ─── Types (inline to avoid import mismatches) ────────────────────────────────
export interface SubUnit {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  name: string;
  subUnits: SubUnit[];
}

export interface Subject {
  id: string;
  name: string;
  units: Unit[];
}

/**
 * BlueprintEntry — the canonical shape used in this component.
 *
 * NOTE: Earlier versions referenced `marksCategory` and `levelId` which do NOT
 * exist on this type. All occurrences have been replaced with `marksPerItem`
 * and `cognitiveId` respectively.
 */
export interface BlueprintEntry {
  id: string;
  unitId: string;
  subUnitId: string;
  /** Marks value for one question in this entry (was incorrectly `marksCategory`) */
  marksPerItem: number;
  /** Number of questions in this entry */
  numQuestions: number;
  /** Cognitive level id — used to look up CognitiveLevel.name (was incorrectly `levelId`) */
  cognitiveId: string;
  /**
   * Format id used to look up LEVEL_COLORS.
   * Must be one of: 'sr1' | 'sr2' | 'crs1' | 'crs2' | 'crl' | 'as1'
   * (was incorrectly used with enum values — now expects lowercase string keys)
   */
  formatId: string;
}

export interface CognitiveLevel {
  id: string;
  name: string;
  color?: string;
}

export interface QuestionType {
  id: string;
  marks: number;
  maxQuestions: number;
  label?: string;
}

// ─── Level color map ──────────────────────────────────────────────────────────
/**
 * Keys must match the `formatId` values stored in BlueprintEntry exactly.
 * Add additional keys here if new formats are introduced.
 */
const LEVEL_COLORS: Record<string, string> = {
  sr1: 'bg-blue-100 border-blue-300',
  sr2: 'bg-orange-100 border-orange-300',
  crs1: 'bg-green-100 border-green-300',
  crs2: 'bg-purple-100 border-purple-300',
  crs3: 'bg-indigo-100 border-indigo-300',  // added — mirrors seed data CRS3
  crl: 'bg-pink-100 border-pink-300',
  as1: 'bg-teal-100 border-teal-300',
};

const FALLBACK_CELL_COLOR = 'bg-slate-100 border-slate-300';

// ─── Props ────────────────────────────────────────────────────────────────────
interface BlueprintTableProps {
  subject: Subject | undefined;
  entries: BlueprintEntry[];
  cognitiveLevels: CognitiveLevel[];
  questionTypes: QuestionType[];
  onUpdateEntry: (unitId: string, subUnitId: string, marks: number, count: number) => void;
  weightNote?: string;
  examTitle?: string;
  paperTypeName?: string;
  /** Academic year string, e.g. "2026-2027" */
  academicYear?: string;
  /** Set identifier, e.g. "Set A" */
  setLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const BlueprintTable: React.FC<BlueprintTableProps> = ({
  subject,
  entries,
  cognitiveLevels,
  questionTypes,
  onUpdateEntry,
  weightNote,
  examTitle,
  paperTypeName,
  academicYear,
  setLabel,
}) => {
  // Guard: no subject selected
  if (!subject) {
    return (
      <div className="p-8 text-center text-slate-500 italic">
        Please select a class or subject to view the blueprint table.
      </div>
    );
  }

  // ── Derived values (memoised to avoid re-computation on every keystroke) ──

  /**
   * Look up a single entry for a (unit, subUnit, marks) combination.
   * FIX: was `e.marksCategory` → now `e.marksPerItem`
   */
  const getEntry = useMemo(() => (unitId: string, subUnitId: string, marks: number): BlueprintEntry | undefined =>
    entries.find(e => e.unitId === unitId && e.subUnitId === subUnitId && e.marksPerItem === marks),
    [entries],
  );

  /**
   * Sum of (numQuestions × marksPerItem) for a given sub-unit.
   * FIX: was `e.marksCategory` → now `e.marksPerItem`
   */
  const calculateSubUnitTotal = useMemo(() => (unitId: string, subUnitId: string): number =>
    entries
      .filter(e => e.unitId === unitId && e.subUnitId === subUnitId)
      .reduce((sum, e) => sum + e.numQuestions * e.marksPerItem, 0),
    [entries],
  );

  /**
   * Sum of (numQuestions × marksPerItem) for an entire unit.
   * FIX: was `e.marksCategory` → now `e.marksPerItem`
   */
  const calculateUnitTotal = useMemo(() => (unitId: string): number =>
    entries
      .filter(e => e.unitId === unitId)
      .reduce((sum, e) => sum + e.numQuestions * e.marksPerItem, 0),
    [entries],
  );

  const visibleUnitIds = useMemo(() => subject.units.map(u => u.id), [subject]);

  const visibleEntries = useMemo(
    () => entries.filter(e => visibleUnitIds.includes(e.unitId)),
    [entries, visibleUnitIds],
  );

  /**
   * Grand total across all visible entries.
   * FIX: was `e.marksCategory` → now `e.marksPerItem`
   */
  const grandTotal = useMemo(
    () => visibleEntries.reduce((sum, e) => sum + e.numQuestions * e.marksPerItem, 0),
    [visibleEntries],
  );

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* ── Toolbar (hidden when printing) ── */}
      <div className="flex flex-wrap justify-between items-start gap-4 print:hidden">
        {weightNote && (
          <div className="flex-1 bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 min-w-0">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wide">
                Exam Pattern Guideline
              </h4>
              <p className="text-sm text-yellow-700 mt-1">{weightNote}</p>
            </div>
          </div>
        )}

        <button
          onClick={handlePrint}
          className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / PDF
        </button>
      </div>

      {/* ── Print header (visible only when printing) ── */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-widest">
          {examTitle || 'Exam Blueprint'}
        </h1>
        <div className="flex justify-center flex-wrap gap-6 mt-2 text-sm font-bold text-slate-600">
          <span>Subject: {subject.name}</span>
          {paperTypeName && <span>Type: {paperTypeName}</span>}
          {setLabel && <span>Set: {setLabel}</span>}
          {academicYear && <span>Year: {academicYear}</span>}
          <span>Max Marks: {grandTotal}</span>
        </div>
      </div>

      {/* ── Main table ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[800px] print:w-full print:min-w-0">
          <thead>
            <tr className="bg-slate-800 text-white print:bg-white print:text-black print:border-b-2 print:border-black">
              <th className="p-3 w-32 border border-slate-600 print:border-slate-300 text-left">Unit</th>
              <th className="p-3 w-48 border border-slate-600 print:border-slate-300 text-left">Sub Unit</th>
              <th className="p-3 w-16 bg-indigo-700 print:bg-white print:text-black border border-slate-600 print:border-slate-300 text-center">
                Marks
              </th>
              {questionTypes.map(qt => (
                <th key={qt.id} className="p-3 w-24 border border-slate-600 print:border-slate-300 text-center font-semibold">
                  <div className="flex flex-col items-center leading-snug">
                    <span>{qt.label ?? `${qt.marks}M`}</span>
                    <span className="text-[10px] opacity-70 font-normal">
                      {qt.maxQuestions} × {qt.marks}
                    </span>
                    <span className="text-[10px] opacity-60 font-normal print:hidden">
                      = {qt.maxQuestions * qt.marks}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {subject.units.map(unit => (
              <React.Fragment key={unit.id}>
                {/* Sub-unit rows */}
                {unit.subUnits.map((sub, subIdx) => (
                  <tr key={sub.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                    {/* Unit name cell (rowspan) */}
                    {subIdx === 0 && (
                      <td
                        rowSpan={unit.subUnits.length}
                        className="p-3 font-black border-r border-b bg-slate-50 print:bg-white align-top border print:border-slate-300 text-slate-800"
                      >
                        {unit.name}
                      </td>
                    )}

                    {/* Sub-unit name */}
                    <td className="p-3 italic text-slate-600 border border-slate-200 print:border-slate-300">
                      {sub.name}
                    </td>

                    {/* Sub-unit total (marks) */}
                    <td className="p-3 text-center bg-indigo-50 font-black border print:bg-white print:border-slate-300">
                      {calculateSubUnitTotal(unit.id, sub.id) || '–'}
                    </td>

                    {/* Question type cells */}
                    {questionTypes.map(qt => {
                      const entry = getEntry(unit.id, sub.id, qt.marks);
                      /**
                       * FIX: was `entry?.levelId` → now `entry?.cognitiveId`
                       */
                      const level = cognitiveLevels.find(l => l.id === entry?.cognitiveId);
                      /**
                       * FIX: LEVEL_COLORS keys are lowercase strings ('sr1', 'crs1', …)
                       * The formatId stored in the entry must already be lowercase.
                       * If it comes from an enum value (e.g. "VSA"), the mapping won't
                       * match — ensure the DB layer stores the lowercase key, not the
                       * human-readable label.
                       */
                      const cellColor = entry
                        ? (LEVEL_COLORS[entry.formatId.toLowerCase()] ?? FALLBACK_CELL_COLOR)
                        : '';

                      return (
                        <td
                          key={qt.id}
                          className="p-1 text-center border border-slate-200 h-14 print:border-slate-300 align-middle"
                        >
                          {entry ? (
                            <div
                              className={`h-full flex flex-col justify-center items-center rounded border ${cellColor} print:border-none print:bg-transparent`}
                            >
                              {/* Screen: editable input */}
                              <input
                                type="number"
                                min="0"
                                className="w-full bg-transparent text-center font-black text-sm outline-none appearance-none m-0 p-0 focus:bg-white/60 rounded print:hidden"
                                value={entry.numQuestions}
                                onChange={e =>
                                  onUpdateEntry(unit.id, sub.id, qt.marks, parseInt(e.target.value, 10) || 0)
                                }
                                onClick={e => e.stopPropagation()}
                                title={`${qt.marks}M question count`}
                              />
                              {level && (
                                <span
                                  className="text-[8px] uppercase font-bold opacity-70 cursor-default select-none print:hidden"
                                  title={level.name}
                                >
                                  {level.name}
                                </span>
                              )}

                              {/* Print: static display */}
                              <div className="hidden print:flex flex-col items-center">
                                <span className="font-bold text-sm">{entry.numQuestions}</span>
                                {level && (
                                  <span className="text-[8px] uppercase">{level.name}</span>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Unit total row */}
                <tr className="bg-indigo-900 text-white font-bold text-center text-xs print:bg-slate-100 print:text-black">
                  <td
                    colSpan={2}
                    className="p-2 text-right uppercase tracking-widest border border-indigo-700 print:border-slate-300 pr-3"
                  >
                    Unit Total:
                  </td>
                  <td className="p-2 border border-indigo-700 print:border-slate-300 font-black">
                    {calculateUnitTotal(unit.id)}
                  </td>
                  {questionTypes.map(qt => {
                    /**
                     * FIX: was `e.marksCategory` → now `e.marksPerItem`
                     */
                    const count = entries
                      .filter(e => e.unitId === unit.id && e.marksPerItem === qt.marks)
                      .reduce((s, e) => s + e.numQuestions, 0);
                    return (
                      <td
                        key={qt.id}
                        className="p-2 text-indigo-200 print:text-black border border-indigo-700 print:border-slate-300"
                      >
                        {count || ''}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}

            {/* Grand Total row */}
            <tr className="bg-slate-100 font-black text-center text-slate-900 border-t-4 border-slate-800 print:border-t-2 print:border-black print:bg-white">
              <td
                colSpan={3}
                className="p-4 text-right text-sm border border-slate-300 uppercase tracking-wider"
              >
                Grand Total:
              </td>
              {questionTypes.map(qt => {
                /**
                 * FIX: was `e.marksCategory` → now `e.marksPerItem`
                 */
                const count = visibleEntries
                  .filter(e => e.marksPerItem === qt.marks)
                  .reduce((s, e) => s + e.numQuestions, 0);
                return (
                  <td
                    key={qt.id}
                    className="p-4 border-l border-slate-300 text-lg"
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Print footer ── */}
      <div className="text-center mt-8 pt-8 border-t hidden print:block text-sm text-slate-500">
        <p>Generated by Blueprint Pro System &bull; {new Date().toLocaleDateString('ta-IN')}</p>
      </div>
    </div>
  );
};

export default BlueprintTable;
