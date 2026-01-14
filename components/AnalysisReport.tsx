
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

  const handleAutoGenerate = () => {
    if (!paperPattern) {
      alert("Please select a Paper Pattern first.");
      return;
    }
    if (!confirm("Auto-generate blueprint using exact Term Weightage (10/20/70) and 30/50/20 Knowledge rules?")) return;

    const isBT = subject.name.toLowerCase().includes('bt');
    const exam = blueprint.examType;
    const totalMax = blueprint.maxScore;

    // Define Target Marks Per Unit Bucket (10% / 20% / 70%)
    const getUnitTargetMarks = (): number[] => {
      if (exam === 'Third Term') {
        const t1 = Math.round(totalMax * 0.10); // 4 marks
        const t2 = Math.round(totalMax * 0.20); // 8 marks
        const t3 = totalMax - t1 - t2;          // 28 marks
        
        if (isBT) return [t1, t2, t3]; // U1, U2, U3
        return [t1/2, t1/2, t2/2, t2/2, t3/2, t3/2]; // U1, U2, U3, U4, U5, U6
      }
      if (exam === 'Second Term') {
        const prev = Math.round(totalMax * 0.20);
        const curr = totalMax - prev;
        if (isBT) return [prev, curr];
        return [prev/2, prev/2, curr/2, curr/2];
      }
      return [totalMax];
    };

    const targetMarksPerUnit = getUnitTargetMarks();
    
    // Knowledge Distribution Targets (30/50/20)
    const targetB = Math.round(totalMax * 0.30);
    const targetA = Math.round(totalMax * 0.50);
    const targetP = totalMax - targetB - targetA;

    // Available Slots from Pattern
    const allSlots: {marks: number}[] = [];
    paperPattern.questionTypes.forEach(qt => {
      for (let i = 0; i < qt.maxQuestions; i++) allSlots.push({ marks: qt.marks });
    });

    // Bucket filling algorithm for units
    const sortedSlots = [...allSlots].sort((a, b) => b.marks - a.marks);
    const unitAssignments: { unitIdx: number, marks: number }[] = [];
    const unitCurrentMarks = new Array(targetMarksPerUnit.length).fill(0);

    // Hard assignment for Units to ensure exact marks
    sortedSlots.forEach(slot => {
      let assigned = false;
      // Try to fit in current available bucket
      for (let i = 0; i < targetMarksPerUnit.length; i++) {
        if (unitCurrentMarks[i] + slot.marks <= targetMarksPerUnit[i]) {
          unitCurrentMarks[i] += slot.marks;
          unitAssignments.push({ unitIdx: i, marks: slot.marks });
          assigned = true;
          break;
        }
      }
      // Overflow to largest available bucket if no perfect fit
      if (!assigned) {
         const biggestLeftIdx = unitCurrentMarks.map((m, i) => targetMarksPerUnit[i] - m).indexOf(Math.max(...unitCurrentMarks.map((m, i) => targetMarksPerUnit[i] - m)));
         unitCurrentMarks[biggestLeftIdx] += slot.marks;
         unitAssignments.push({ unitIdx: biggestLeftIdx, marks: slot.marks });
      }
    });

    // Assign Knowledge Levels and entries
    let currB = 0, currA = 0;
    const newEntries: BlueprintEntry[] = [];
    const subUnitCounters: Record<number, number> = {};

    unitAssignments.sort((a,b) => b.marks - a.marks).forEach((slot, idx) => {
      let kCode: 'B' | 'A' | 'P' = 'P';
      if (currB + slot.marks <= targetB + 2) { kCode = 'B'; currB += slot.marks; }
      else if (currA + slot.marks <= targetA + 2) { kCode = 'A'; currA += slot.marks; }
      const kId = KNOWLEDGE_LEVELS.find(k => k.code === kCode)?.id || KNOWLEDGE_LEVELS[1].id;

      const unit = subject.units[slot.unitIdx] || subject.units[0];
      subUnitCounters[slot.unitIdx] = (subUnitCounters[slot.unitIdx] || 0) + 1;
      const subUnit = unit.subUnits[(subUnitCounters[slot.unitIdx] - 1) % unit.subUnits.length];

      let formatId = 'sr1';
      if (slot.marks === 1) formatId = Math.random() > 0.5 ? 'sr1' : 'sr2';
      else if (slot.marks === 2) formatId = 'crs1';
      else if (slot.marks <= 4) formatId = 'crs2';
      else formatId = 'crl';

      const cog = COGNITIVE_PROCESSES[idx % COGNITIVE_PROCESSES.length];

      const match = newEntries.find(e => 
        e.unitId === unit.id && e.subUnitId === subUnit.id && 
        e.formatId === formatId && e.cognitiveId === cog.id && e.knowledgeId === kId && e.marksPerItem === slot.marks
      );

      if (match) {
        match.numQuestions += 1;
        match.estimatedTime += (slot.marks * 2);
      } else {
        newEntries.push({
          unitId: unit.id,
          subUnitId: subUnit.id,
          formatId,
          numQuestions: 1,
          marksPerItem: slot.marks,
          cognitiveId: cog.id,
          knowledgeId: kId,
          estimatedTime: slot.marks * 2
        });
      }
    });

    onSetEntries(newEntries);
  };

  const getSubUnitEntryInCol = (uId: string, sId: string, marks: number) => 
    entries.filter(e => e.unitId === uId && e.subUnitId === sId && e.marksPerItem === marks);

  return (
    <div className="space-y-10 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex bg-white p-1 rounded-3xl border border-slate-200 shadow-sm w-full md:w-auto overflow-hidden">
           <button onClick={() => setActiveTab('matrix')} className={`flex-1 md:flex-none px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Assignments Matrix</button>
           <button onClick={() => setActiveTab('summaries')} className={`flex-1 md:flex-none px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'summaries' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Report Summaries</button>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={handleAutoGenerate} className="flex-1 md:flex-none bg-amber-500 text-white px-8 py-4 rounded-3xl font-black text-xs shadow-xl shadow-amber-200 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Auto-Generate (Exact Rules)
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Print Report
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[4rem] shadow-2xl border border-slate-100 print:shadow-none print:p-0 overflow-hidden">
        {activeTab === 'matrix' ? (
          <div className="space-y-12">
            <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-900 shadow-2xl custom-scrollbar">
              <table className="w-full border-collapse text-[11px] font-bold leading-none min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 w-12 text-center uppercase tracking-tighter">#</th>
                    <th className="p-4 w-40 text-left bg-slate-800 uppercase tracking-widest text-[9px]">Unit</th>
                    <th className="p-4 w-48 text-left bg-slate-800 uppercase tracking-widest text-[9px]">Sub-Unit</th>
                    <th className="p-4 w-16 text-center bg-yellow-500 text-black uppercase tracking-widest text-[9px]">Marks</th>
                    {formatColumns.map(col => (
                      <th key={col.id} className="p-4 border-l border-slate-700 text-center min-w-[100px] bg-slate-800">
                         <div className="flex flex-col gap-1">
                           <span className="text-[12px]">{col.marks} Marks</span>
                           <span className="opacity-50 text-[8px] font-black uppercase">Max: {col.maxQuestions}</span>
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
                          <tr key={sub.id} className="hover:bg-indigo-50/40 border-b border-slate-100 h-20 group transition-colors">
                            {sIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-4 border-r border-slate-100 text-center font-black text-slate-400 bg-slate-50/30">{uIdx + 1}</td>}
                            {sIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-4 border-r border-slate-100 font-black uppercase text-indigo-700 bg-slate-50/30 pr-6">{unit.name}</td>}
                            <td className="p-4 border-r border-slate-100 font-bold text-slate-600 italic pr-8">{sub.name}</td>
                            <td className="p-4 border-r border-slate-100 text-center bg-yellow-50 font-black text-sm text-yellow-700">{subTotal || ''}</td>
                            {formatColumns.map(col => {
                              const matches = getSubUnitEntryInCol(unit.id, sub.id, col.marks);
                              return (
                                <td key={col.id} className="p-2 border-r border-slate-100 text-center relative">
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
                                          className={`${bgColor} text-[9px] p-1.5 rounded-lg border font-black shadow-sm flex items-center gap-1 cursor-pointer hover:scale-110 active:scale-95 transition-all no-print`}
                                          onClick={() => onUpdateEntry(null, entries.indexOf(m))}
                                        >
                                          <span>{m.numQuestions}({cogCode})</span>
                                          <span className="opacity-40">{fmt?.code}</span>
                                        </div>
                                      );
                                    })}
                                    <div className="hidden print:block text-[9px]">
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
                     <td colSpan={3} className="p-5 text-right uppercase tracking-[0.2em] text-[10px] bg-indigo-900">Total Distribution</td>
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
                    <span className="text-slate-400">Target Weightage</span>
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
                               <div className={`text-xl font-black ${Math.abs(actual-target) < 5 ? 'text-emerald-600' : 'text-amber-500'}`}>{actual.toFixed(1)}%</div>
                               <div className="text-[9px] font-black text-slate-400 uppercase">Goal: {target}%</div>
                             </div>
                           </div>
                           <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${actual}%` }}></div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>

               <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                  <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-8">Unit Weightage Compliance</h3>
                  <div className="space-y-4">
                    {subject.units.map((u, i) => {
                      const exam = blueprint.examType;
                      const totalMks = entries.filter(e => e.unitId === u.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const pc = totalScore > 0 ? (totalMks / totalScore) * 100 : 0;
                      
                      // Identify compliance based on Third Term rules
                      let complianceClass = 'text-slate-400';
                      if (exam === 'Third Term') {
                         if (i === 0 && totalMks === 4) complianceClass = 'text-emerald-600';
                         if (i === 1 && totalMks === 8) complianceClass = 'text-emerald-600';
                         if (i === 2 && totalMks === 28) complianceClass = 'text-emerald-600';
                      }

                      return (
                        <div key={u.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                           <div className="font-black uppercase text-[11px] text-slate-500 tracking-tight">{u.name}</div>
                           <div className={`font-black text-lg ${complianceClass}`}>
                             {totalMks} <span className="text-[10px] opacity-40">Mks</span>
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
               <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight mb-4">Analysis Summaries</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Administrative Taxonomy Reports & Standards</p>
             </div>
             <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-lg">
                  <h3 className="font-black text-xl mb-6 uppercase tracking-widest text-indigo-600 border-l-4 border-indigo-600 pl-4">Item Formats</h3>
                  <table className="w-full text-sm font-bold">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-widest text-left">
                      <tr><th className="pb-4">Format</th><th className="pb-4">Count</th><th className="pb-4">Score</th><th className="pb-4 text-right">%</th></tr>
                    </thead>
                    <tbody>
                      {ITEM_FORMATS.map(f => {
                         const match = entries.filter(e => e.formatId === f.id);
                         const qs = match.reduce((s, e) => s + e.numQuestions, 0);
                         const mk = match.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                         const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;
                         return (
                           <tr key={f.id} className="border-t border-slate-50">
                             <td className="py-4 text-indigo-700">{f.code}</td>
                             <td className="py-4">{qs || '-'}</td>
                             <td className="py-4 font-black">{mk || '-'}</td>
                             <td className="py-4 text-right text-slate-400">{pc.toFixed(1)}%</td>
                           </tr>
                         );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-lg">
                  <h3 className="font-black text-xl mb-6 uppercase tracking-widest text-indigo-600 border-l-4 border-indigo-600 pl-4">Cognitive Processes</h3>
                  <table className="w-full text-sm font-bold">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-widest text-left">
                      <tr><th className="pb-4">Process</th><th className="pb-4 text-center">Score</th><th className="pb-4 text-right">%</th></tr>
                    </thead>
                    <tbody>
                      {COGNITIVE_PROCESSES.map(cp => {
                         const mk = entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                         const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;
                         return (
                           <tr key={cp.id} className="border-t border-slate-50">
                             <td className="py-4 text-slate-700">{cp.name}</td>
                             <td className="py-4 text-center font-black">{mk || '-'}</td>
                             <td className="py-4 text-right text-slate-400">{pc.toFixed(1)}%</td>
                           </tr>
                         );
                      })}
                    </tbody>
                  </table>
                </div>
             </section>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-8 border-t border-slate-100 no-print opacity-30 text-[9px] font-black uppercase tracking-[0.4em] text-center pb-20">
         High-Fidelity Matrix Engine &bull; System Proforma V3 &bull; Authorized Access Only
      </footer>
    </div>
  );
};

export default AnalysisReport;
