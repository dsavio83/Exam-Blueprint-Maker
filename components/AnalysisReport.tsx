
import React, { useState, useMemo } from 'react';
import { Subject, BlueprintEntry, SavedBlueprint, PaperType } from '../types';
import { COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS, ITEM_FORMATS } from '../constants';

interface AnalysisReportProps {
  blueprint: SavedBlueprint;
  subject: Subject;
  paperPattern?: PaperType;
  onUpdateEntry: (entry: BlueprintEntry | null, index: number) => void;
  onAddEntry: (entry: BlueprintEntry) => void;
  onSetEntries: (entries: BlueprintEntry[]) => void;
  onUpdateOverrides: (key: string, val: string, type: 'name' | 'objective') => void;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ blueprint, subject, paperPattern, onUpdateEntry, onAddEntry, onSetEntries, onUpdateOverrides }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'summaries'>('matrix');

  const { entries } = blueprint;
  const totalScore = useMemo(() => entries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0), [entries]);
  const formatColumns = useMemo(() => paperPattern?.questionTypes || [], [paperPattern]);
  // Define isBT globally for the component to fix scope error in summaries section
  const isBT = subject.name.toLowerCase().includes('bt');

  const handleAutoGenerate = () => {
    if (!paperPattern) {
      alert("Please select a Paper Pattern first.");
      return;
    }

    // isBT is now defined at component scope
    const exam = blueprint.examType;
    const totalMax = blueprint.maxScore;

    // 1. Calculate EXACT Target Marks Per Unit Grouping
    // For Third Term: T1=10%(4), T2=20%(8), T3=70%(28) based on 40 marks
    const getTargetBuckets = (): { indices: number[], target: number }[] => {
      const buckets: { indices: number[], target: number }[] = [];

      if (exam === 'Third Term') {
        const t1 = Math.round(totalMax * 0.10);
        const t2 = Math.round(totalMax * 0.20);
        const t3 = totalMax - t1 - t2;

        if (isBT) {
          // BT: Unit 1, 2, 3 mapped 1:1 to Term 1, 2, 3
          buckets.push({ indices: [0], target: t1 });
          buckets.push({ indices: [1], target: t2 });
          buckets.push({ indices: [2], target: t3 });
        } else {
          // AT: Units 1-2(T1), 3-4(T2), 5-6(T3)
          buckets.push({ indices: [0, 1], target: t1 });
          buckets.push({ indices: [2, 3], target: t2 });
          buckets.push({ indices: [4, 5], target: t3 });
        }
      } else if (exam === 'Second Term') {
        const t1 = Math.round(totalMax * 0.20);
        const t2 = totalMax - t1;
        if (isBT) {
          buckets.push({ indices: [0], target: t1 });
          buckets.push({ indices: [1], target: t2 });
        } else {
          buckets.push({ indices: [0, 1], target: t1 });
          buckets.push({ indices: [2, 3], target: t2 });
        }
      } else {
        // First Term or General: All current
        buckets.push({ indices: subject.units.map((_, i) => i), target: totalMax });
      }
      return buckets;
    };

    const targetBuckets = getTargetBuckets();
    if (!confirm(`Confirm Auto-Generate?\nTerm Logic Applied: ${targetBuckets.map(b => b.target + ' Marks').join(' / ')}`)) return;

    // 2. Knowledge Distribution Targets (30/50/20)
    const targetB = Math.round(totalMax * 0.30);
    const targetA = Math.round(totalMax * 0.50);

    // 3. Prepare Item Slots from Paper Pattern
    const allSlots: { marks: number }[] = [];
    paperPattern.questionTypes.forEach(qt => {
      for (let i = 0; i < qt.maxQuestions; i++) allSlots.push({ marks: qt.marks });
    });

    // Sort descending to assign large marks first (essay types)
    const sortedSlots = [...allSlots].sort((a, b) => b.marks - a.marks);

    const results: BlueprintEntry[] = [];
    const bucketProgress = targetBuckets.map(b => ({ ...b, current: 0 }));
    let runningB = 0, runningA = 0;

    // 4. Exact Allocation Loop
    sortedSlots.forEach((slot, slotIdx) => {
      // Find a bucket that can fit this slot
      let bucketIdx = bucketProgress.findIndex(b => b.current + slot.marks <= b.target);

      // If no perfect fit, find the bucket with the largest remaining space
      if (bucketIdx === -1) {
        bucketIdx = bucketProgress.map((b, i) => b.target - b.current).indexOf(Math.max(...bucketProgress.map(b => b.target - b.current)));
      }

      const selectedBucket = bucketProgress[bucketIdx];
      selectedBucket.current += slot.marks;

      // Pick specific unit from indices (Round Robin or alternate)
      const unitIndex = selectedBucket.indices[slotIdx % selectedBucket.indices.length];
      const unit = subject.units[unitIndex] || subject.units[0];

      // Select SubUnit (Round Robin)
      const subUnit = unit.subUnits[Math.floor(Math.random() * unit.subUnits.length)];

      // Knowledge Level
      let kId = KNOWLEDGE_LEVELS[2].id; // Profound
      if (runningB + slot.marks <= targetB + 1) {
        kId = KNOWLEDGE_LEVELS[0].id;
        runningB += slot.marks;
      } else if (runningA + slot.marks <= targetA + 1) {
        kId = KNOWLEDGE_LEVELS[1].id;
        runningA += slot.marks;
      }

      // Format Logic (Requested strict rules)
      let formatId = 'sr1';
      if (slot.marks === 1) formatId = Math.random() > 0.5 ? 'sr1' : 'sr2';
      else if (slot.marks === 2) formatId = 'crs1';
      else if (slot.marks <= 4) formatId = 'crs2';
      else formatId = 'crl';

      const cognitiveId = COGNITIVE_PROCESSES[slotIdx % COGNITIVE_PROCESSES.length].id;

      // Check for identical entry to increment
      const existing = results.find(r =>
        r.unitId === unit.id && r.subUnitId === subUnit.id &&
        r.formatId === formatId && r.cognitiveId === cognitiveId &&
        r.knowledgeId === kId && r.marksPerItem === slot.marks
      );

      if (existing) {
        existing.numQuestions += 1;
      } else {
        results.push({
          unitId: unit.id,
          subUnitId: subUnit.id,
          formatId,
          numQuestions: 1,
          marksPerItem: slot.marks,
          cognitiveId,
          knowledgeId: kId,
          estimatedTime: slot.marks * 2.5
        });
      }
    });

    onSetEntries(results);
  };

  const getSubUnitEntryInCol = (uId: string, sId: string, marks: number) =>
    entries.filter(e => e.unitId === uId && e.subUnitId === sId && e.marksPerItem === marks);

  return (
    <div className="space-y-10 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex bg-white p-1 rounded-3xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button onClick={() => setActiveTab('matrix')} className={`flex-1 md:flex-none px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-900'}`}>Assignments Matrix</button>
          <button onClick={() => setActiveTab('summaries')} className={`flex-1 md:flex-none px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'summaries' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-900'}`}>Analysis Summary</button>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={handleAutoGenerate} className="flex-1 md:flex-none bg-amber-500 text-white px-8 py-4 rounded-3xl font-black text-xs shadow-xl shadow-amber-200 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Auto-Generate (Term Logic)
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-xs shadow-xl flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Generate PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[4rem] shadow-2xl border border-slate-100 print:shadow-none print:p-0">
        {activeTab === 'matrix' ? (
          <div className="space-y-12">
            <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-900 shadow-2xl custom-scrollbar">
              <table className="w-full border-collapse text-[11px] font-bold leading-none min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 w-12 text-center uppercase tracking-tighter">#</th>
                    <th className="p-4 w-40 text-left bg-slate-800 uppercase tracking-widest text-[9px]">Unit</th>
                    <th className="p-4 w-48 text-left bg-slate-800 uppercase tracking-widest text-[9px]">Lesson/Topic</th>
                    <th className="p-4 w-16 text-center bg-yellow-500 text-black uppercase tracking-widest text-[9px]">Marks</th>
                    {formatColumns.map(col => (
                      <th key={col.id} className="p-4 border-l border-slate-700 text-center min-w-[100px] bg-slate-800">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px]">{col.marks} Marks</span>
                          <span className="opacity-50 text-[8px] font-black uppercase">Count: {col.maxQuestions}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subject.units.map((unit, uIdx) => (
                    <React.Fragment key={unit.id}>
                      {unit.subUnits.map((sub, sIdx) => {
                        const subTotal = entries.filter(e => e.unitId === unit.id && e.subUnitId === sub.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                        return (
                          <tr key={sub.id} className="hover:bg-indigo-50/30 border-b border-slate-100 h-20 group transition-colors">
                            {sIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-4 border-r border-slate-100 text-center font-black text-slate-300 bg-slate-50/20">{uIdx + 1}</td>}
                            {sIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-4 border-r border-slate-100 font-black uppercase text-indigo-700 bg-slate-50/20 pr-6">{unit.name}</td>}
                            <td className="p-4 border-r border-slate-100 font-bold text-slate-600 italic pr-8">{sub.name}</td>
                            <td className="p-4 border-r border-slate-100 text-center bg-yellow-50 font-black text-sm text-yellow-700">{subTotal || ''}</td>
                            {formatColumns.map(col => {
                              const matches = getSubUnitEntryInCol(unit.id, sub.id, col.marks);
                              return (
                                <td key={col.id} className="p-2 border-r border-slate-100 text-center relative group">
                                  <div className="flex flex-wrap gap-1 items-center justify-center min-h-[40px]">
                                    {matches.map((m, mIdx) => {
                                      const fmt = ITEM_FORMATS.find(f => f.id === m.formatId);
                                      const cogCode = COGNITIVE_PROCESSES.find(c => c.id === m.cognitiveId)?.code.slice(-1) || '1';
                                      let bgColor = 'bg-slate-100 text-slate-700';
                                      if (m.formatId.includes('sr')) bgColor = 'bg-blue-100 text-blue-800 border-blue-200';
                                      if (m.formatId.includes('crs1')) bgColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                                      if (m.formatId.includes('crs2')) bgColor = 'bg-purple-100 text-purple-800 border-purple-200';
                                      if (m.formatId.includes('crl')) bgColor = 'bg-orange-100 text-orange-800 border-orange-200';

                                      return (
                                        <div
                                          key={mIdx}
                                          className={`${bgColor} text-[10px] p-1.5 rounded-lg border font-black shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-110 active:scale-95 transition-all no-print`}
                                          onClick={() => onUpdateEntry(null, entries.indexOf(m))}
                                        >
                                          <span>{m.numQuestions}({cogCode})</span>
                                          <span className="opacity-40 font-black">{fmt?.code}</span>
                                        </div>
                                      );
                                    })}
                                    <div className="hidden print:block text-[10px]">
                                      {matches.map((m, mIdx) => (
                                        <div key={mIdx}>{m.numQuestions}({m.marksPerItem}) {m.formatId.toUpperCase()}</div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black">
                  <tr className="border-t-2 border-slate-800">
                    <td colSpan={3} className="p-5 text-right uppercase tracking-[0.2em] text-[11px] bg-indigo-900">Total Aggregates</td>
                    <td className="p-5 text-center text-xl bg-yellow-500 text-black border-r border-slate-800">{totalScore}</td>
                    {formatColumns.map(col => {
                      const count = entries.filter(e => e.marksPerItem === col.marks).reduce((s, e) => s + e.numQuestions, 0);
                      const mks = count * col.marks;
                      return (
                        <td key={col.id} className="p-3 text-center border-l border-slate-700 bg-slate-800">
                          <div className="flex flex-col gap-1">
                            <span className="text-xl leading-none">{count}</span>
                            <span className="text-[9px] opacity-40 font-normal uppercase">{mks} Marks</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 no-print">
              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-8 flex justify-between">
                  <span>Knowledge Tiers (30/50/20)</span>
                  <span className="text-slate-400">Target Weight</span>
                </h3>
                <div className="space-y-6">
                  {KNOWLEDGE_LEVELS.map(kl => {
                    const target = kl.code === 'B' ? 30 : kl.code === 'A' ? 50 : 20;
                    const score = entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                    const actual = totalScore > 0 ? (score / totalScore) * 100 : 0;
                    return (
                      <div key={kl.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="font-black text-slate-800 uppercase text-[11px] tracking-wider">{kl.name}</span>
                          <div className="text-right">
                            <div className={`text-xl font-black ${Math.abs(actual - target) < 5 ? 'text-emerald-600' : 'text-amber-500'}`}>{actual.toFixed(1)}%</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase">Goal: {target}%</div>
                          </div>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${actual}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-8 flex justify-between">
                  <span>Term-Unit Adherence</span>
                  <span className="text-slate-400">{blueprint.examType}</span>
                </h3>
                <div className="space-y-4">
                  {subject.units.map((u, uIdx) => {
                    const mk = entries.filter(e => e.unitId === u.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                    const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;

                    // Identify compliance based on Third Term rules specifically
                    let statusText = "Standard Distribution";
                    let statusColor = "text-slate-400";

                    if (blueprint.examType === 'Third Term') {
                      if (uIdx === 0 && mk === 4) { statusText = "10% Exact Reach"; statusColor = "text-emerald-600"; }
                      else if (uIdx === 1 && mk === 8) { statusText = "20% Exact Reach"; statusColor = "text-emerald-600"; }
                      else if (uIdx === 2 && mk === 28) { statusText = "70% Exact Reach"; statusColor = "text-emerald-600"; }
                      else if (isBT) { statusText = "Variance Detected"; statusColor = "text-amber-500"; }
                    }

                    return (
                      <div key={u.id} className="flex justify-between items-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-black uppercase text-[10px] text-slate-400 tracking-tight">{u.name}</span>
                          <span className={`font-black text-[9px] uppercase tracking-widest ${statusColor}`}>{statusText}</span>
                        </div>
                        <div className={`font-black text-xl ${statusColor === 'text-emerald-600' ? 'text-indigo-900' : 'text-slate-900'}`}>
                          {mk} <span className="text-[10px] opacity-40 uppercase">Mks</span>
                          <span className="text-[10px] ml-2 opacity-50">({pc.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in pb-12">
            <div className="text-center pb-12 border-b-2 border-slate-100">
              <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight mb-4">Taxonomy Adherence Reports</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Unit-wise & Cognitive weighting aggregated for review</p>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-200">
                <h3 className="font-black text-xl mb-8 uppercase tracking-widest text-indigo-600 border-l-4 border-indigo-600 pl-6">I. Weightage to Item Format</h3>
                <table className="w-full text-xs font-black">
                  <thead className="text-[9px] text-slate-400 uppercase tracking-widest text-left">
                    <tr><th className="pb-4">Format Code</th><th className="pb-4 text-center">Items</th><th className="pb-4 text-center">Marks</th><th className="pb-4 text-right">Weight</th></tr>
                  </thead>
                  <tbody>
                    {ITEM_FORMATS.map(f => {
                      const match = entries.filter(e => e.formatId === f.id);
                      const qs = match.reduce((s, e) => s + e.numQuestions, 0);
                      const mk = match.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;
                      return (
                        <tr key={f.id} className="border-t border-slate-100">
                          <td className="py-4 text-indigo-700">{f.code}</td>
                          <td className="py-4 text-center">{qs || '-'}</td>
                          <td className="py-4 text-center font-black text-slate-900">{mk || '-'}</td>
                          <td className="py-4 text-right text-slate-400">{pc.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-200">
                <h3 className="font-black text-xl mb-8 uppercase tracking-widest text-indigo-600 border-l-4 border-indigo-600 pl-6">II. Content Area Analysis</h3>
                <table className="w-full text-xs font-black">
                  <thead className="text-[9px] text-slate-400 uppercase tracking-widest text-left">
                    <tr><th className="pb-4">Unit Description</th><th className="pb-4 text-center">Score</th><th className="pb-4 text-right">Distribution</th></tr>
                  </thead>
                  <tbody>
                    {subject.units.map(u => {
                      const mk = entries.filter(e => e.unitId === u.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;
                      return (
                        <tr key={u.id} className="border-t border-slate-100">
                          <td className="py-4 uppercase text-slate-700">{u.name}</td>
                          <td className="py-4 text-center font-black text-indigo-900">{mk || '-'}</td>
                          <td className="py-4 text-right text-slate-400">{pc.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200">
                    <tr className="font-black text-slate-900 uppercase">
                      <td className="py-6">Grand Total Score</td>
                      <td className="py-6 text-center text-xl text-indigo-600">{totalScore}</td>
                      <td className="py-6 text-right">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-12 border-t border-slate-100 no-print opacity-30 text-[9px] font-black uppercase tracking-[0.5em] text-center pb-20">
        Assessment Matrix Engine &bull; Educational Standards V3 &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AnalysisReport;
