import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
}

export interface ClassGrade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface PaperSection {
  id: string;
  marks: number;
  count: number;
  optionCount?: number;
  instruction?: string;
}

export interface PaperType {
  id: string;
  name: string;
  totalMarks: number;
  description?: string;
  sections: PaperSection[];
}

export interface SavedBlueprint {
  name: string;
  classId: string;
  subjectId: string;
  examType: string;
  paperTypeId: string;
  maxScore: number;
  timeAllotted: number;
  setId: string;
  academicYear: string;
}

// ─── Term / Unit Logic ────────────────────────────────────────────────────────

interface TermMeta {
  label: string;
  /** AT units active for this term */
  atUnits: number;
  /** BT units active for this term */
  btUnits: number;
  /** Total sub-units per unit */
  subUnitsPerUnit: number;
}

const TERM_META: Record<string, TermMeta> = {
  'First Term':     { label: 'முதல் பருவம்',   atUnits: 2, btUnits: 1, subUnitsPerUnit: 3 },
  'Second Term':    { label: 'இரண்டாம் பருவம்', atUnits: 4, btUnits: 2, subUnitsPerUnit: 3 },
  'Third Term':     { label: 'மூன்றாம் பருவம்', atUnits: 6, btUnits: 3, subUnitsPerUnit: 3 },
  'SSLC Exam (Final)': { label: 'இறுதி / SSLC',  atUnits: 5, btUnits: 3, subUnitsPerUnit: 3 },
};

/** Detect if a subject string is BT type */
const isBT = (subjectName: string) => subjectName.toLowerCase().includes('bt') || subjectName.toLowerCase().includes('part b');

function getUnitCount(examType: string, subjectName: string): { units: number; subUnitsPerUnit: number } {
  const meta = TERM_META[examType] ?? { atUnits: 2, btUnits: 1, subUnitsPerUnit: 3 };
  return {
    units: isBT(subjectName) ? meta.btUnits : meta.atUnits,
    subUnitsPerUnit: meta.subUnitsPerUnit,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BlueprintSetupProps {
  classes: ClassGrade[];
  paperTypes: PaperType[];
  onCancel: () => void;
  onConfirm: (config: Partial<SavedBlueprint>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const BlueprintSetup: React.FC<BlueprintSetupProps> = ({
  classes,
  paperTypes,
  onCancel,
  onConfirm,
}) => {
  const [formData, setFormData] = React.useState<SavedBlueprint>({
    name: '',
    classId: classes[0]?.id ?? '',
    subjectId: classes[0]?.subjects[0]?.id ?? '',
    examType: 'First Term',
    paperTypeId: paperTypes[0]?.id ?? '',
    maxScore: paperTypes[0]?.totalMarks ?? 40,
    timeAllotted: 90,
    setId: 'A',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const selectedClass = classes.find(c => c.id === formData.classId);
  const selectedSubject = selectedClass?.subjects.find(s => s.id === formData.subjectId);
  const selectedPaperType = paperTypes.find(pt => pt.id === formData.paperTypeId);

  const unitInfo = React.useMemo(() =>
    getUnitCount(formData.examType, selectedSubject?.name ?? ''),
    [formData.examType, selectedSubject?.name],
  );

  // Auto-sync maxScore from paper type
  React.useEffect(() => {
    if (selectedPaperType) {
      setFormData(p => ({ ...p, maxScore: selectedPaperType.totalMarks }));
    }
  }, [selectedPaperType]);

  // ── Validation ──
  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = 'Blueprint பெயர் இடவேண்டும்.';
    if (!formData.subjectId) next.subjectId = 'பாடத்தை தேர்வு செய்யவும்.';
    if (!formData.paperTypeId) next.paperTypeId = 'Paper Type தேர்வு செய்யவும்.';
    if (formData.maxScore <= 0) next.maxScore = 'மதிப்பெண் 0-க்கு மேல் இருக்க வேண்டும்.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = () => {
    if (validate()) onConfirm(formData);
  };

  const field = <K extends keyof SavedBlueprint>(key: K, value: SavedBlueprint[K]) =>
    setFormData(p => ({ ...p, [key]: value }));

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] -mr-32 -mt-32 opacity-30 pointer-events-none" />
        <h2 className="text-3xl font-black uppercase tracking-widest relative">Initialize Blueprint</h2>
        <p className="text-slate-400 mt-2 font-medium relative">
          Configure assessment parameters — term logic auto-applied.
        </p>
      </div>

      <div className="p-10 space-y-8">

        {/* Blueprint Name */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-indigo-600 tracking-[0.2em]">
            Blueprint Name *
          </label>
          <input
            className={`w-full p-5 border-2 rounded-2xl bg-slate-50 font-bold text-lg focus:bg-white outline-none transition-all placeholder:text-slate-300
              ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-indigo-600'}`}
            placeholder="e.g., IX Std Tamil AT — முதல் பருவம் Set A"
            value={formData.name}
            onChange={e => field('name', e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Grid fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Class */}
          <FieldBlock label="Grade / Class">
            <select
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all focus:border-indigo-600"
              value={formData.classId}
              onChange={e => {
                const cls = classes.find(c => c.id === e.target.value);
                field('classId', e.target.value);
                if (cls) field('subjectId', cls.subjects[0]?.id ?? '');
              }}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FieldBlock>

          {/* Subject */}
          <FieldBlock label="Subject Selection" error={errors.subjectId}>
            <select
              className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all
                ${errors.subjectId ? 'border-red-400' : 'border-slate-100 focus:border-indigo-600'}`}
              value={formData.subjectId}
              onChange={e => field('subjectId', e.target.value)}
            >
              {selectedClass?.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </FieldBlock>

          {/* Exam Term */}
          <FieldBlock label="Exam Term">
            <select
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all focus:border-indigo-600"
              value={formData.examType}
              onChange={e => field('examType', e.target.value)}
            >
              {Object.keys(TERM_META).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {/* Term-aware unit info */}
            <TermInfoBadge examType={formData.examType} subjectName={selectedSubject?.name ?? ''} />
          </FieldBlock>

          {/* Paper Type */}
          <FieldBlock label="Template Pattern" error={errors.paperTypeId}>
            <select
              className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all
                ${errors.paperTypeId ? 'border-red-400' : 'border-slate-100 focus:border-indigo-600'}`}
              value={formData.paperTypeId}
              onChange={e => field('paperTypeId', e.target.value)}
            >
              <option value="">No Template (Free Form)</option>
              {paperTypes.map(pt => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} ({pt.totalMarks}M)
                </option>
              ))}
            </select>
            {selectedPaperType && <PaperTypePreview paperType={selectedPaperType} />}
          </FieldBlock>

          {/* Set */}
          <FieldBlock label="Set">
            <select
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all focus:border-indigo-600"
              value={formData.setId}
              onChange={e => field('setId', e.target.value)}
            >
              {['A', 'B', 'C'].map(s => <option key={s} value={s}>Set {s}</option>)}
            </select>
          </FieldBlock>

          {/* Academic Year */}
          <FieldBlock label="Academic Year">
            <input
              type="text"
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all"
              value={formData.academicYear}
              placeholder="2026-2027"
              onChange={e => field('academicYear', e.target.value)}
            />
          </FieldBlock>

          {/* Max Score */}
          <FieldBlock label="Aggregated Score (Marks)" error={errors.maxScore}>
            <div className={`flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border-2 ${errors.maxScore ? 'border-red-400' : 'border-slate-100'}`}>
              <StepButton onClick={() => field('maxScore', Math.max(0, formData.maxScore - 10))} label="−" />
              <input
                type="number"
                className="flex-1 bg-transparent text-center font-black text-2xl outline-none"
                value={formData.maxScore}
                onChange={e => field('maxScore', Number(e.target.value))}
                min={0}
              />
              <StepButton onClick={() => field('maxScore', formData.maxScore + 10)} label="+" />
            </div>
          </FieldBlock>

          {/* Time */}
          <FieldBlock label="Time Allotted (Minutes)">
            <input
              type="number"
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-black text-2xl text-center outline-none focus:bg-white focus:border-indigo-600 transition-all"
              value={formData.timeAllotted}
              onChange={e => field('timeAllotted', Number(e.target.value))}
              min={0}
            />
          </FieldBlock>
        </div>

        {/* Matrix Structure Preview */}
        <MatrixPreview
          units={unitInfo.units}
          subUnitsPerUnit={unitInfo.subUnitsPerUnit}
          paperType={selectedPaperType}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-5 pt-6 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 p-5 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 p-5 rounded-2xl font-black uppercase tracking-widest bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            Create Matrix Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Helper sub-components ────────────────────────────────────────────────────

const FieldBlock: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const StepButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-11 h-11 flex items-center justify-center bg-white rounded-xl font-black text-xl shadow-sm hover:bg-slate-100 transition-colors"
  >
    {label}
  </button>
);

const TermInfoBadge: React.FC<{ examType: string; subjectName: string }> = ({ examType, subjectName }) => {
  const { units, subUnitsPerUnit } = getUnitCount(examType, subjectName);
  const bt = isBT(subjectName);
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
        {bt ? 'BT' : 'AT'} · {units} பாடம்
      </span>
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
        {subUnitsPerUnit} துணைப்பாடம்/பாடம்
      </span>
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
        மொத்தம்: {units * subUnitsPerUnit} rows
      </span>
    </div>
  );
};

const PaperTypePreview: React.FC<{ paperType: PaperType }> = ({ paperType }) => (
  <div className="mt-2 flex flex-wrap gap-1.5">
    {paperType.sections.map(s => (
      <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
        {s.count}×{s.marks}M{s.optionCount ? ` (+${s.optionCount}OR)` : ''}
      </span>
    ))}
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-bold">
      = {paperType.totalMarks}M
    </span>
  </div>
);

interface MatrixPreviewProps {
  units: number;
  subUnitsPerUnit: number;
  paperType: PaperType | undefined;
}
const MatrixPreview: React.FC<MatrixPreviewProps> = ({ units, subUnitsPerUnit, paperType }) => {
  if (!paperType) return null;
  const totalRows = units * subUnitsPerUnit;
  const totalQ = paperType.sections.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
      <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest mb-3">
        Matrix Preview
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <StatCard label="Units" value={units} />
        <StatCard label="Total Rows" value={totalRows} />
        <StatCard label="Total Questions" value={totalQ} />
        <StatCard label="Max Marks" value={paperType.totalMarks} accent />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {paperType.sections.map(s => (
          <div key={s.id} className="flex-1 min-w-[80px] bg-white border border-indigo-100 rounded-xl p-2 text-center">
            <div className="text-lg font-black text-indigo-700">{s.count}</div>
            <div className="text-[10px] text-indigo-400">{s.marks}M Qs</div>
            {(s.optionCount ?? 0) > 0 && (
              <div className="text-[9px] text-purple-500">{s.optionCount} OR</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`p-3 rounded-xl ${accent ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'} border border-indigo-100`}>
    <div className={`text-2xl font-black ${accent ? 'text-white' : 'text-indigo-600'}`}>{value}</div>
    <div className={`text-[10px] uppercase tracking-wide ${accent ? 'text-indigo-200' : 'text-slate-500'}`}>{label}</div>
  </div>
);

export default BlueprintSetup;
