
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
    if (!confirm("Auto-generate blueprint using 30/50/20 knowledge and Term Weightage rules?")) return;

    const isBT = subject.name.toLowerCase().includes('bt');
    const exam = blueprint.examType;

    const getUnitWeights = (): Record<number, number> => {
      if (isBT) {
        if (exam === 'First Term') return { 0: 1.0 };
        if (exam === 'Second Term') return { 1: 0.8, 0: 0.2 };
        // Third Term BT: 10% T1(U1), 20% T2(U2), 70% T3(U3)
        return { 2: 0.7, 1: 0.2, 0: 0.1 };
      }
      
      // Tamil AT (6 units)
      if (exam === 'First Term') return { 0: 0.5, 1: 0.5 };
      if (exam === 'Second Term') return { 2: 0.4, 3: 0.4, 0: 0.1, 1: 0.1 };
      // Third Term AT: 10% T1(U1,2), 20% T2(U3,4), 70% T3(U5,6)
      return { 4: 0.35, 5: 0.35, 2: 0.1, 3: 0.1, 0: 0.05, 1: 0.05 };
    };

    const unitWeights = getUnitWeights();
    const targetB = Math.round(blueprint.maxScore * 0.30);
    const targetA = Math.round(blueprint.maxScore * 0.50);
    const targetP = blueprint.maxScore - targetB - targetA;

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
        match.estimatedTime += (slot.marks * 2.5);
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
    <div className="space-y-8">
      <div className="flex justify-between items-center print:hidden no-print">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
           <button onClick={() => setActiveTab('matrix')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Matrix View</button>
           <button onClick={() => setActiveTab('summaries')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'summaries' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Summaries</button>
        </div>
        <button onClick={handleAutoGenerate} className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           Auto-Generate
        </button>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 print:shadow-none print:p-0">
        {activeTab === 'matrix' ? (
          <div className="space-y-8">
            <div className="overflow-x-auto rounded-xl border border-slate-300 custom-scrollbar shadow-inner">
              <table className="w-full border-collapse text-[11px] font-bold min-w-[900px]">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-3 w-40 text-left bg-slate-700">Unit</th>
                    <th className="p-3 w-48 text-left bg-slate-700">Sub-Unit</th>
                    <th className="p-3 w-16 text-center bg-yellow-400 text-black">Marks</th>
                    {formatColumns.map(col => (
                      <th key={col.id} className="p-3 border-l border-slate-600 text-center min-w-[80px]">
                        {col.marks}({col.maxQuestions})
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
                          <tr key={sub.id} className="hover:bg-indigo-50/50 border-b border-slate-200">
                            {sIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-3 border-r border-slate-300 font-black uppercase text-indigo-700 bg-slate-50">{unit.name}</td>}
                            <td className="p-3 border-r border-slate-300 font-bold text-slate-600">{sub.name}</td>
                            <td className="p-3 border-r border-slate-300 text-center bg-yellow-100 font-black">{subTotal || ''}</td>
                            {formatColumns.map(col => {
                              const matches = getSubUnitEntryInCol(unit.id, sub.id, col.marks);
                              return (
                                <td key={col.id} className="p-1 border-r border-slate-200 text-center h-14">
                                  {matches.map((m, mIdx) => {
                                    const fmt = ITEM_FORMATS.find(f => f.id === m.formatId);
                                    let color = 'bg-slate-100 text-slate-700';
                                    if (m.formatId.includes('sr')) color = 'bg-blue-100 text-blue-800';
                                    if (m.formatId.includes('crs1')) color = 'bg-emerald-100 text-emerald-800';
                                    if (m.formatId.includes('crs2')) color = 'bg-purple-100 text-purple-800';
                                    if (m.formatId.includes('crl')) color = 'bg-orange-100 text-orange-800';
                                    
                                    const cogIdx = COGNITIVE_PROCESSES.findIndex(c => c.id === m.cognitiveId) + 1;
                                    return (
                                      <div key={mIdx} className={`${color} text-[10px] p-1.5 rounded-lg mb-1 border font-black cursor-pointer hover:brightness-95`} onClick={() => onUpdateEntry(null, entries.indexOf(m))}>
                                        {m.numQuestions}({cogIdx}) {fmt?.code}
                                      </div>
                                    );
                                  })}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800 text-white font-black">
                   <tr>
                     <td colSpan={3} className="p-4 text-right bg-yellow-400 text-black">Total Marks: {totalScore}</td>
                     {formatColumns.map(col => {
                        const count = entries.filter(e => e.marksPerItem === col.marks).reduce((s, e) => s + e.numQuestions, 0);
                        const mks = count * col.marks;
                        return (
                          <td key={col.id} className="p-2 text-center border-l border-slate-700">
                             <div className="flex flex-col text-[10px]">
                               <span className="bg-indigo-600 px-1 rounded">{count} Qns</span>
                               <span className="text-yellow-400 mt-1">{mks} Mks</span>
                             </div>
                          </td>
                        );
                     })}
                   </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                 <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-4">Item Format Weightage</h3>
                 <table className="w-full text-xs font-bold text-center">
                   <thead className="bg-slate-200 text-slate-600">
                     <tr><th className="p-2">Format</th><th className="p-2">Questions</th><th className="p-2">Marks</th><th className="p-2">%</th></tr>
                   </thead>
                   <tbody>
                     {ITEM_FORMATS.map(f => {
                       const match = entries.filter(e => e.formatId === f.id);
                       const qs = match.reduce((s, e) => s + e.numQuestions, 0);
                       const mk = match.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                       const pc = totalScore > 0 ? (mk / totalScore) * 100 : 0;
                       return (
                         <tr key={f.id} className="border-b border-slate-200">
                           <td className="p-2 font-black">{f.code}</td>
                           <td className="p-2">{qs || '-'}</td>
                           <td className="p-2">{mk || '-'}</td>
                           <td className="p-2">{pc.toFixed(1)}%</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                 <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-4">Knowledge Levels (30/50/20)</h3>
                 <div className="space-y-4">
                   {KNOWLEDGE_LEVELS.map(kl => {
                     const target = kl.code === 'B' ? 30 : kl.code === 'A' ? 50 : 20;
                     const score = entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                     const actual = totalScore > 0 ? (score / totalScore) * 100 : 0;
                     return (
                       <div key={kl.id} className="space-y-1">
                         <div className="flex justify-between text-[10px] font-black uppercase">
                            <span>{kl.name} ({kl.code})</span>
                            <span className={Math.abs(actual-target) < 5 ? 'text-emerald-600' : 'text-amber-500'}>{actual.toFixed(1)}% / {target}%</span>
                         </div>
                         <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${actual}%` }}></div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in text-center py-10">
             <h2 className="text-2xl font-black text-slate-800">Summaries & Taxonomy Adherence</h2>
             <p className="text-slate-500 max-w-lg mx-auto">This section provides grouped reports for administrative submission. Use Matrix View for individual mapping.</p>
             {/* Detailed summaries already partially included in Matrix View, can add more grouped tables here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisReport;
