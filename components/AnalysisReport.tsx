
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'summaries'>('matrix');

  const { entries } = blueprint;
  const totalScore = useMemo(() => entries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0), [entries]);
  const formatColumns = useMemo(() => paperPattern?.questionTypes || [], [paperPattern]);

  const handleAutoGenerate = () => {
    if (!paperPattern) {
      alert("Please select a Paper Pattern first.");
      return;
    }
    if (!confirm("This will overwrite existing data using the V3 Term-Logic. Proceed?")) return;

    // Rules logic:
    // Tamil BT: 3 Units. T1: U1(100%). T2: U2(80%), U1(20%). T3: U3(70%), U2(20%), U1(10%).
    // Tamil AT: 6 Units. T1: U1,2(100%). T2: U3,4(80%), U1,2(20%). T3: U5,6(70%), U3,4(20%), U1,2(10%).
    const isBT = subject.name.toLowerCase().includes('bt');
    const exam = blueprint.examType;
    const cls = blueprint.classId;

    const getUnitWeights = (): Record<number, number> => {
      if (isBT) {
        if (exam === 'First Term') return { 0: 1.0 };
        if (exam === 'Second Term') return { 1: 0.8, 0: 0.2 };
        return { 2: 0.7, 1: 0.2, 0: 0.1 };
      }
      
      // Tamil AT / Standard
      if (exam === 'First Term') return { 0: 0.5, 1: 0.5 };
      if (exam === 'Second Term') return { 2: 0.4, 3: 0.4, 0: 0.1, 1: 0.1 };
      
      // Class 10 SSLC has 20/20/60 distribution usually, adjusting based on prompt
      const isClass10 = cls.includes('10') || exam.includes('SSLC');
      if (isClass10) return { 4: 0.3, 5: 0.3, 2: 0.1, 3: 0.1, 0: 0.1, 1: 0.1 };

      // Standard T3 Class 8, 9
      return { 4: 0.35, 5: 0.35, 2: 0.1, 3: 0.1, 0: 0.05, 1: 0.05 };
    };

    const unitWeights = getUnitWeights();
    const totalPossibleMarks = blueprint.maxScore;
    
    // Knowledge Distribution: 30/50/20
    const targetB = Math.round(totalPossibleMarks * 0.30);
    const targetA = Math.round(totalPossibleMarks * 0.50);
    const targetP = totalPossibleMarks - targetB - targetA;

    const allSlots: {marks: number}[] = [];
    paperPattern.questionTypes.forEach(qt => {
      for (let i = 0; i < qt.maxQuestions; i++) allSlots.push({ marks: qt.marks });
    });

    const sortedSlots = [...allSlots].sort((a, b) => b.marks - a.marks);
    let currB = 0, currA = 0;
    const newEntries: BlueprintEntry[] = [];
    const subUnitCounters: Record<number, number> = {};

    sortedSlots.forEach((slot, idx) => {
      let kCode: 'B' | 'A' | 'P' = 'P';
      if (currB + slot.marks <= targetB + 1) { kCode = 'B'; currB += slot.marks; }
      else if (currA + slot.marks <= targetA + 1) { kCode = 'A'; currA += slot.marks; }
      const kId = KNOWLEDGE_LEVELS.find(k => k.code === kCode)?.id || KNOWLEDGE_LEVELS[1].id;

      const r = Math.random();
      let acc = 0, uIdx = 0;
      for (const [key, val] of Object.entries(unitWeights)) {
        acc += val;
        if (r <= acc) { uIdx = parseInt(key); break; }
      }
      
      const unit = subject.units[uIdx] || subject.units[0];
      subUnitCounters[uIdx] = (subUnitCounters[uIdx] || 0) + 1;
      const subUnit = unit.subUnits[(subUnitCounters[uIdx] - 1) % unit.subUnits.length];

      // Format Logic:
      // SR1, SR2: all Objective
      // CRS1: 2 marks
      // CRS2: 3-4 marks
      // CRL: 5-6 marks
      let formatId = 'sr1';
      if (slot.marks === 1) formatId = Math.random() > 0.5 ? 'sr1' : 'sr2';
      else if (slot.marks === 2) formatId = 'crs1';
      else if (slot.marks <= 4) formatId = 'crs2';
      else formatId = 'crl';

      const cog = COGNITIVE_PROCESSES[idx % COGNITIVE_PROCESSES.length];

      const existing = newEntries.find(e => 
        e.unitId === unit.id && e.subUnitId === subUnit.id && 
        e.formatId === formatId && e.cognitiveId === cog.id && 
        e.knowledgeId === kId && e.marksPerItem === slot.marks
      );

      if (existing) {
        existing.numQuestions += 1;
        existing.estimatedTime += (slot.marks * 2.5);
      } else {
        newEntries.push({
          unitId: unit.id,
          subUnitId: subUnit.id,
          formatId,
          numQuestions: 1,
          marksPerItem: slot.marks,
          cognitiveId: cog.id,
          knowledgeId: kId,
          estimatedTime: slot.marks * 2.5
        });
      }
    });

    onSetEntries(newEntries);
  };

  const getSubUnitEntryInCol = (uId: string, sId: string, marks: number) => 
    entries.filter(e => e.unitId === uId && e.subUnitId === sId && e.marksPerItem === marks);

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm w-full md:w-auto">
           <button onClick={() => setActiveTab('matrix')} className={`flex-1 md:flex-none px-10 py-3 rounded-3xl font-black text-sm transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Assignments Matrix</button>
           <button onClick={() => setActiveTab('summaries')} className={`flex-1 md:flex-none px-10 py-3 rounded-3xl font-black text-sm transition-all ${activeTab === 'summaries' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Weightage Summary</button>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={handleAutoGenerate} className="flex-1 md:flex-none bg-amber-500 text-white px-8 py-4 rounded-[2rem] font-black text-xs shadow-xl shadow-amber-200 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Auto-Generate
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black text-xs shadow-xl flex items-center justify-center gap-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Print / PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[4rem] shadow-2xl border border-slate-100 print:shadow-none print:p-0">
        {activeTab === 'matrix' ? (
          <div className="space-y-12">
            <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-900 shadow-2xl custom-scrollbar">
              <table className="w-full border-collapse text-[11px] font-bold leading-none min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-700">
                    <th className="p-4 w-12 text-center uppercase">#</th>
                    <th className="p-4 w-40 text-left bg-slate-800 uppercase tracking-widest text-[10px]">Unit Name</th>
                    <th className="p-4 w-48 text-left bg-slate-800 uppercase tracking-widest text-[10px]">Topic/Discourse</th>
                    <th className="p-4 w-16 text-center bg-yellow-500 text-black uppercase tracking-widest text-[10px]">Marks</th>
                    {formatColumns.map(col => (
                      <th key={col.id} className="p-4 border-l border-slate-700 text-center min-w-[100px] bg-slate-800">
                         <div className="flex flex-col gap-1">
                           <span className="text-[12px]">{col.marks} Marks</span>
                           <span className="opacity-50 text-[9px] font-normal uppercase">Slots: {col.maxQuestions}</span>
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
                            {sIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-4 border-r border-slate-100 text-center font-black text-slate-400 bg-slate-50/50">{uIdx + 1}</td>}
                            {sIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-4 border-r border-slate-100 font-black uppercase text-indigo-700 bg-slate-50/50 leading-tight pr-6">{unit.name}</td>}
                            <td className="p-4 border-r border-slate-100 font-bold text-slate-600 italic pr-8">{sub.name}</td>
                            <td className="p-4 border-r border-slate-100 text-center bg-yellow-50 font-black text-sm text-yellow-700">{subTotal || ''}</td>
                            {formatColumns.map(col => {
                              const matches = getSubUnitEntryInCol(unit.id, sub.id, col.marks);
                              return (
                                <td key={col.id} className="p-2 border-r border-slate-100 text-center relative group">
                                  <div className="flex flex-col gap-1.5 items-center justify-center min-h-[40px]">
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
                                          className={`${bgColor} text-[10px] p-2 rounded-xl border font-black shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all no-print`}
                                          onClick={() => onUpdateEntry(null, entries.indexOf(m))}
                                        >
                                          <span>{m.numQuestions}({cogCode})</span>
                                          <span className="opacity-50 font-black">{fmt?.code}</span>
                                        </div>
                                      );
                                    })}
                                    {/* Print View Only */}
                                    <div className="hidden print:block">
                                      {matches.map((m, mIdx) => (
                                        <div key={mIdx} className="text-xs">{m.numQuestions}({m.marksPerItem}) {m.formatId.toUpperCase()}</div>
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
                     <td colSpan={3} className="p-5 text-right uppercase tracking-[0.2em] text-[11px] bg-indigo-900">Final Aggregated Totals</td>
                     <td className="p-5 text-center text-xl bg-yellow-500 text-black border-r border-slate-800">{totalScore}</td>
                     {formatColumns.map(col => {
                        const count = entries.filter(e => e.marksPerItem === col.marks).reduce((s, e) => s + e.numQuestions, 0);
                        const mks = count * col.marks;
                        return (
                          <td key={col.id} className="p-3 text-center border-l border-slate-700 bg-slate-800">
                             <div className="flex flex-col gap-1">
                               <span className="text-indigo-400 text-[10px] uppercase">Items</span>
                               <span className="text-xl leading-none">{count}</span>
                               <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${(count/col.maxQuestions)*100}%` }}></div>
                               </div>
                               <span className="text-[9px] opacity-40 font-normal mt-1">{mks} Marks</span>
                             </div>
                          </td>
                        );
                     })}
                   </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 no-print">
               <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                  <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-8 flex justify-between">
                    <span>Knowledge Level Goals</span>
                    <span className="text-slate-400">Standard: 30 / 50 / 20</span>
                  </h3>
                  <div className="space-y-6">
                    {KNOWLEDGE_LEVELS.map(kl => {
                      const target = kl.code === 'B' ? 30 : kl.code === 'A' ? 50 : 20;
                      const score = entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const actual = totalScore > 0 ? (score / totalScore) * 100 : 0;
                      return (
                        <div key={kl.id} className="space-y-2">
                           <div className="flex justify-between items-end">
                             <span className="font-black text-slate-800 uppercase text-[11px] tracking-wider">{kl.name} ({kl.code})</span>
                             <div className="text-right">
                               <div className={`text-xl font-black ${Math.abs(actual-target) < 5 ? 'text-emerald-600' : 'text-amber-500'}`}>{actual.toFixed(1)}%</div>
                               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target: {target}%</div>
                             </div>
                           </div>
                           <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${actual}%` }}></div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>

               <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                  <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-8">Pattern Adherence Engine</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {formatColumns.map(p => {
                       const assigned = entries.filter(e => e.marksPerItem === p.marks).reduce((s, e) => s + e.numQuestions, 0);
                       const isComplete = assigned === p.maxQuestions;
                       return (
                         <div key={p.id} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-1 transition-all ${isComplete ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xl shadow-emerald-500/10' : 'bg-white border-slate-100 text-slate-400'}`}>
                            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{p.marks} Marks</span>
                            <span className="text-2xl font-black">{assigned} / {p.maxQuestions}</span>
                            <div className={`text-[9px] font-black uppercase mt-1 px-3 py-0.5 rounded-full ${isComplete ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                               {isComplete ? 'Valid' : 'Invalid'}
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-20 animate-in">
             <div className="text-center pb-12 border-b-2 border-slate-100">
               <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-none mb-6">Weightage & Taxonomy Report</h2>
               <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 font-black text-slate-400 text-xs tracking-widest uppercase">
                 <div className="flex items-center gap-2"><span>Class</span> <span className="text-indigo-600">: {blueprint.classId}</span></div>
                 <div className="flex items-center gap-2"><span>Subject</span> <span className="text-indigo-600">: {subject.name}</span></div>
                 <div className="flex items-center gap-2"><span>Examination</span> <span className="text-indigo-600">: {blueprint.examType}</span></div>
                 <div className="flex items-center gap-2"><span>Aggregated Score</span> <span className="text-indigo-600">: {totalScore} Marks</span></div>
               </div>
             </div>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4">I. Weightage to Item Format</h3>
                 <div className="border-2 border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-xs font-bold border-collapse">
                     <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest">
                       <tr><th className="p-4 text-left">Code</th><th className="p-4">Items</th><th className="p-4">Score</th><th className="p-4 text-right">Weightage</th></tr>
                     </thead>
                     <tbody>
                       {ITEM_FORMATS.map(fmt => {
                         const match = entries.filter(e => e.formatId === fmt.id);
                         const qs = match.reduce((s, e) => s + e.numQuestions, 0);
                         const mk = match.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                         const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;
                         return (
                           <tr key={fmt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                             <td className="p-4 font-black text-indigo-700 uppercase">{fmt.code}</td>
                             <td className="p-4 text-center">{qs || '-'}</td>
                             <td className="p-4 text-center font-black">{mk || '-'}</td>
                             <td className="p-4 text-right text-slate-400">{pc.toFixed(1)}%</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>

               <div className="space-y-8">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4">II. Content Area Analysis</h3>
                 <div className="border-2 border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-xs font-bold border-collapse">
                     <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest">
                       <tr><th className="p-4 text-left">Unit</th><th className="p-4">Score</th><th className="p-4 text-right">Percentage</th></tr>
                     </thead>
                     <tbody>
                        {subject.units.map(u => {
                          const mk = entries.filter(e => e.unitId === u.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                          const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;
                          return (
                            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-black uppercase">{u.name}</td>
                              <td className="p-4 text-center font-black text-indigo-600">{mk || '-'}</td>
                              <td className="p-4 text-right text-slate-400">{pc.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                     </tbody>
                   </table>
                 </div>
               </div>
             </section>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-8 border-t border-slate-100 no-print opacity-40 text-[10px] font-black uppercase tracking-[0.3em] text-center pb-20">
         High-Precision Assessment Analysis &bull; Institutional Framework V3 &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AnalysisReport;
