
import React, { useState } from 'react';
import { Subject, BlueprintEntry, SavedBlueprint, PaperType } from '../types';
import { COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS, ITEM_FORMATS } from '../constants';

interface AnalysisReportProps {
  blueprint: SavedBlueprint;
  subject: Subject;
  paperPattern?: PaperType;
  onUpdateEntry: (entry: BlueprintEntry | null, index: number) => void;
  onAddEntry: (entry: BlueprintEntry) => void;
  onUpdateOverrides: (key: string, val: string, type: 'name' | 'objective') => void;
}

const VerticalHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="p-2 border border-slate-300 text-xs font-bold bg-slate-50 relative h-36 align-bottom min-w-[30px]">
    <div className="transform -rotate-90 origin-bottom-left absolute left-1/2 bottom-2 translate-x-[-50%] whitespace-nowrap text-[10px] leading-tight w-0 tracking-tighter uppercase font-black">
      {children}
    </div>
  </th>
);

const AnalysisReport: React.FC<AnalysisReportProps> = ({ blueprint, subject, paperPattern, onUpdateEntry, onAddEntry, onUpdateOverrides }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'summaries'>('matrix');

  const [newEntry, setNewEntry] = useState<BlueprintEntry>({
    unitId: subject.units[0]?.id || '',
    subUnitId: subject.units[0]?.subUnits[0]?.id || '',
    formatId: ITEM_FORMATS[0].id,
    numQuestions: 1,
    marksPerItem: 1,
    cognitiveId: COGNITIVE_PROCESSES[0].id,
    knowledgeId: KNOWLEDGE_LEVELS[0].id,
    estimatedTime: 2
  });

  const { entries } = blueprint;
  const totalScore = entries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
  const totalItems = entries.reduce((s, e) => s + e.numQuestions, 0);
  const totalTime = entries.reduce((s, e) => s + e.estimatedTime, 0);

  // Pattern fulfillment logic
  const patternStatus = paperPattern?.questionTypes.map(qt => {
    const assigned = entries.filter(e => e.marksPerItem === qt.marks).reduce((s, e) => s + e.numQuestions, 0);
    return { ...qt, assigned };
  }) || [];

  const getSubUnitEntries = (uId: string, sId: string) => entries.filter(e => e.unitId === uId && e.subUnitId === sId);

  const ReportHeader = () => (
    <div className="text-center border-b-4 border-indigo-600 pb-8 mb-12">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Question Paper Analysis Proforma - HS</h1>
      <div className="grid grid-cols-2 mt-6 text-left max-w-4xl mx-auto gap-x-12 gap-y-4 font-black text-slate-700 text-sm">
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Class</span> <span className="text-indigo-600">: {blueprint.classId}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Time Allotted</span> <span className="text-indigo-600">: {blueprint.timeAllotted} Minutes</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Subject</span> <span className="text-indigo-600">: {subject.name}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Current Total Score</span> <span className="text-indigo-600">: {totalScore} / {blueprint.maxScore}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Examination</span> <span className="text-indigo-600">: {blueprint.examType}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Date Generated</span> <span className="text-indigo-600">: {new Date().toLocaleDateString()}</span></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Navigation for Edit mode */}
      <div className="flex gap-4 print:hidden">
         <button onClick={() => setActiveTab('matrix')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'}`}>1. Matrix Design</button>
         <button onClick={() => setActiveTab('summaries')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'summaries' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'}`}>2. Final Reports & Summaries</button>
      </div>

      <div className="bg-white p-10 max-w-[1250px] mx-auto rounded-[3rem] shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0 print:rounded-none">
        
        {activeTab === 'matrix' ? (
          <section className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4">I. Item-wise Analysis Proforma (Matrix)</h3>
              <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 print:hidden">
                 + Assign Question to Matrix
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border-2 border-slate-900 shadow-xl mb-12">
              <table className="w-full border-collapse text-[11px] font-bold leading-tight">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th rowSpan={2} className="p-4 border border-slate-700 w-32 uppercase">Content Area</th>
                    <th rowSpan={2} className="p-4 border border-slate-700 w-48 uppercase">Learning Objective</th>
                    <th rowSpan={2} className="p-4 border border-slate-700 w-32 uppercase">Sub-topic</th>
                    <th colSpan={7} className="p-2 border border-slate-700 text-center uppercase text-[10px] bg-slate-800">Cognitive Process</th>
                    <th colSpan={3} className="p-2 border border-slate-700 text-center uppercase text-[10px] bg-indigo-900">Knowledge Level</th>
                    <th colSpan={5} className="p-2 border border-slate-700 text-center uppercase text-[10px] bg-emerald-900">Item Format</th>
                    <th rowSpan={2} className="p-2 border border-slate-700 w-10 text-center">Time</th>
                    <th rowSpan={2} className="p-2 border border-slate-700 w-10 text-center">Items</th>
                    <th rowSpan={2} className="p-2 border border-slate-700 w-10 text-center">Score</th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-900">
                    {COGNITIVE_PROCESSES.map(cp => <VerticalHeader key={cp.id}>{cp.code}: {cp.name}</VerticalHeader>)}
                    {KNOWLEDGE_LEVELS.map(kl => <VerticalHeader key={kl.id}>{kl.code}: {kl.name}</VerticalHeader>)}
                    {ITEM_FORMATS.map(f => <VerticalHeader key={f.id}>{f.code}: {f.abbreviation}</VerticalHeader>)}
                  </tr>
                </thead>
                <tbody>
                  {subject.units.map(unit => (
                    <React.Fragment key={unit.id}>
                      {unit.subUnits.map((sub, sIdx) => {
                        const subEntries = getSubUnitEntries(unit.id, sub.id);
                        const subScore = subEntries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                        const subItems = subEntries.reduce((s, e) => s + e.numQuestions, 0);
                        const subTime = subEntries.reduce((s, e) => s + e.estimatedTime, 0);

                        return (
                          <tr key={sub.id} className="group hover:bg-slate-50">
                            {sIdx === 0 && (
                              <td rowSpan={unit.subUnits.length} className="p-3 border border-slate-300 align-top font-black text-indigo-700 uppercase">
                                 {blueprint.topicNameOverrides[unit.id] || unit.name}
                              </td>
                            )}
                            <td className="p-3 border border-slate-300 italic text-slate-500">
                              {blueprint.objectiveOverrides[sub.id] || sub.learningObjective}
                            </td>
                            <td className="p-3 border border-slate-300 font-bold text-slate-800">{sub.name}</td>
                            {COGNITIVE_PROCESSES.map(cp => {
                              const eIndex = entries.findIndex(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.cognitiveId === cp.id);
                              const e = eIndex > -1 ? entries[eIndex] : null;
                              return (
                                <td key={cp.id} className="border border-slate-200 text-center relative group/cell h-12 cursor-pointer hover:bg-red-50" onClick={() => e && onUpdateEntry(null, eIndex)}>
                                  {e ? <div className="flex flex-col"><span className="text-indigo-600">{e.numQuestions}</span><span className="text-[8px] opacity-40">({e.marksPerItem}M)</span></div> : ''}
                                </td>
                              );
                            })}
                            {KNOWLEDGE_LEVELS.map(kl => {
                              const e = entries.find(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.knowledgeId === kl.id);
                              return <td key={kl.id} className="border border-slate-200 text-center h-12 bg-indigo-50/20">{e ? e.numQuestions : ''}</td>;
                            })}
                            {ITEM_FORMATS.map(f => {
                              const e = entries.find(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.formatId === f.id);
                              return <td key={f.id} className="border border-slate-200 text-center h-12 bg-emerald-50/20">{e ? e.numQuestions : ''}</td>;
                            })}
                            <td className="p-2 border border-slate-300 text-center bg-slate-50">{subTime || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center bg-slate-50">{subItems || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center font-black bg-indigo-600 text-white">{subScore || '-'}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black text-[10px] uppercase">
                   <tr>
                     <td colSpan={3} className="p-4 border border-slate-700 text-right">TOTAL SUMMARY</td>
                     {COGNITIVE_PROCESSES.map(cp => <td key={cp.id} className="border border-slate-700 text-center">{entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                     {KNOWLEDGE_LEVELS.map(kl => <td key={kl.id} className="border border-slate-700 text-center">{entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                     {ITEM_FORMATS.map(f => <td key={f.id} className="border border-slate-700 text-center">{entries.filter(e => e.formatId === f.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                     <td className="border border-slate-700 text-center bg-slate-800">{totalTime}</td>
                     <td className="border border-slate-700 text-center bg-slate-800">{totalItems}</td>
                     <td className="border border-slate-700 text-center bg-indigo-600 text-sm">{totalScore}</td>
                   </tr>
                </tfoot>
              </table>
            </div>

            {paperPattern && (
              <div className="bg-slate-900 text-white p-8 rounded-3xl">
                <h4 className="font-black text-sm uppercase tracking-widest mb-6 text-indigo-400">Blueprint Requirement Verification</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                   {patternStatus.map(p => (
                     <div key={p.id} className={`p-4 rounded-2xl border-2 bg-slate-800 flex flex-col items-center gap-1 ${p.assigned === p.maxQuestions ? 'border-emerald-500 bg-emerald-900/20' : 'border-slate-700'}`}>
                        <span className="text-[10px] font-black uppercase opacity-60">{p.marks} Marks</span>
                        <div className="text-2xl font-black">{p.assigned} / {p.maxQuestions}</div>
                        {p.assigned === p.maxQuestions && <span className="text-[8px] font-black uppercase text-emerald-400">Match!</span>}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="space-y-20 animate-fade-in print:space-y-16">
            <ReportHeader />

            {/* WEIGHTAGE II: CONTENT AREA */}
            <section className="break-after-page">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4 mb-6">II. Weightage to Content Area</h3>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-xs font-bold">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr><th className="p-3 border border-slate-700 w-16">S.No</th><th className="p-3 border border-slate-700 text-left">Content Area (Unit/Topic)</th><th className="p-3 border border-slate-700">Score</th><th className="p-3 border border-slate-700">Percentage</th></tr>
                  </thead>
                  <tbody>
                    {subject.units.map((u, i) => {
                      const score = entries.filter(e => e.unitId === u.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      return (
                        <tr key={u.id} className="border-b border-slate-200">
                          <td className="p-3 border-r text-center">{i+1}</td>
                          <td className="p-3 border-r">{u.name}</td>
                          <td className="p-3 border-r text-center font-black">{score}</td>
                          <td className="p-3 text-center">{score ? ((score/totalScore)*100).toFixed(1) : '0'}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-black">
                    <tr><td colSpan={2} className="p-3 text-right">Grand Total</td><td className="p-3 text-center text-indigo-600">{totalScore}</td><td className="p-3 text-center">100%</td></tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* WEIGHTAGE III: COGNITIVE PROCESS */}
            <section className="break-after-page">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4 mb-6">III. Weightage to Cognitive Process</h3>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-xs font-bold">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr><th className="p-3 border border-slate-700 w-16">S.No</th><th className="p-3 border border-slate-700 text-left">Cognitive Level</th><th className="p-3 border border-slate-700">Score</th><th className="p-3 border border-slate-700">Percentage</th></tr>
                  </thead>
                  <tbody>
                    {COGNITIVE_PROCESSES.map((cp, i) => {
                      const score = entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      return (
                        <tr key={cp.id} className="border-b border-slate-200">
                          <td className="p-3 border-r text-center">{i+1}</td>
                          <td className="p-3 border-r">{cp.name} ({cp.code})</td>
                          <td className="p-3 border-r text-center font-black">{score || '-'}</td>
                          <td className="p-3 text-center">{score ? ((score/totalScore)*100).toFixed(1) : '0'}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-indigo-600 text-white font-black">
                    <tr><td colSpan={2} className="p-3 text-right">TOTAL</td><td className="p-3 text-center">{totalScore}</td><td className="p-3 text-center">100%</td></tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* WEIGHTAGE IV: KNOWLEDGE LEVEL (30/50/20 Rule) */}
            <section className="break-after-page">
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4">IV. Weightage to Knowledge Level</h3>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">*Target: Basic(30%) | Average(50%) | Profound(20%)</span>
              </div>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-xs font-bold">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-3 border border-slate-700 w-16">S.No</th>
                      <th className="p-3 border border-slate-700 text-left">Knowledge Level</th>
                      <th className="p-3 border border-slate-700">Target %</th>
                      <th className="p-3 border border-slate-700">Actual Score</th>
                      <th className="p-3 border border-slate-700">Actual %</th>
                      <th className="p-3 border border-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KNOWLEDGE_LEVELS.map((kl, i) => {
                      const score = entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const target = kl.code === 'B' ? 30 : kl.code === 'A' ? 50 : 20;
                      const actualPercent = score ? (score/totalScore)*100 : 0;
                      const diff = Math.abs(actualPercent - target);
                      
                      return (
                        <tr key={kl.id} className="border-b border-slate-200">
                          <td className="p-3 border-r text-center">{i+1}</td>
                          <td className="p-3 border-r">{kl.name} ({kl.code})</td>
                          <td className="p-3 border-r text-center text-slate-400">{target}%</td>
                          <td className="p-3 border-r text-center font-black">{score || '0'}</td>
                          <td className={`p-3 border-r text-center ${diff < 5 ? 'text-emerald-600' : 'text-amber-600'}`}>{actualPercent.toFixed(1)}%</td>
                          <td className="p-3 text-center">
                             {diff < 5 ? <span className="text-emerald-600 uppercase text-[9px]">Optimized</span> : <span className="text-amber-500 uppercase text-[9px]">Variance: {diff.toFixed(1)}%</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-emerald-600 text-white font-black">
                    <tr><td colSpan={3} className="p-3 text-right">TOTAL</td><td className="p-3 text-center">{totalScore}</td><td className="p-3 text-center">100%</td><td className="p-3"></td></tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* WEIGHTAGE V: ITEM FORMAT */}
            <section className="break-after-page">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4 mb-6">V. Weightage to Item Format</h3>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-xs font-bold">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr><th className="p-3 border border-slate-700 w-16">S.No</th><th className="p-3 border border-slate-700 text-left">Format Type</th><th className="p-3 border border-slate-700">Items</th><th className="p-3 border border-slate-700">Est. Time</th><th className="p-3 border border-slate-700">Score</th><th className="p-3 border border-slate-700">Percentage</th></tr>
                  </thead>
                  <tbody>
                    {ITEM_FORMATS.map((f, i) => {
                      const fEntries = entries.filter(e => e.formatId === f.id);
                      const items = fEntries.reduce((s, e) => s + e.numQuestions, 0);
                      const score = fEntries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const time = fEntries.reduce((s, e) => s + e.estimatedTime, 0);
                      return (
                        <tr key={f.id} className="border-b border-slate-200">
                          <td className="p-3 border-r text-center">{i+1}</td>
                          <td className="p-3 border-r">{f.name} ({f.abbreviation})</td>
                          <td className="p-3 border-r text-center">{items || '-'}</td>
                          <td className="p-3 border-r text-center">{time || '-'}</td>
                          <td className="p-3 border-r text-center font-black">{score || '-'}</td>
                          <td className="p-3 text-center">{score ? ((score/totalScore)*100).toFixed(1) : '0'}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-800 text-white font-black">
                    <tr><td colSpan={2} className="p-3 text-right">TOTALS</td><td className="p-3 text-center">{totalItems}</td><td className="p-3 text-center">{totalTime}m</td><td className="p-3 text-center">{totalScore}</td><td className="p-3 text-center">100%</td></tr>
                  </tfoot>
                </table>
              </div>
            </section>

          </div>
        )}

        <footer className="text-center mt-20 pt-10 border-t border-slate-100 hidden print:block text-slate-400 text-[10px] italic">
           Institutional Question Paper Analysis System &bull; Confidential Administrative Documentation &bull; Generated via Blueprint Pro HS Engine
        </footer>
      </div>

      {/* ADD ENTRY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 print:hidden">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border-2 border-indigo-600 animate-scale-up">
             <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
               <h3 className="font-black text-2xl uppercase tracking-widest">Assign Matrix Entry</h3>
               <button onClick={() => setShowAddModal(false)} className="font-black text-3xl hover:rotate-90 transition-all">×</button>
             </div>
             <div className="p-10 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Unit</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.unitId} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}>
                     {subject.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Sub-unit</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.subUnitId} onChange={e => setNewEntry({...newEntry, subUnitId: e.target.value})}>
                     {subject.units.find(u => u.id === newEntry.unitId)?.subUnits.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Cognitive (CP)</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.cognitiveId} onChange={e => setNewEntry({...newEntry, cognitiveId: e.target.value})}>
                     {COGNITIVE_PROCESSES.map(cp => <option key={cp.id} value={cp.id}>{cp.code}: {cp.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Knowledge (K)</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.knowledgeId} onChange={e => setNewEntry({...newEntry, knowledgeId: e.target.value})}>
                     {KNOWLEDGE_LEVELS.map(kl => <option key={kl.id} value={kl.id}>{kl.code}: {kl.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Marks Slot</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.marksPerItem} onChange={e => setNewEntry({...newEntry, marksPerItem: Number(e.target.value)})}>
                      {[1, 2, 3, 5, 8, 10].map(m => <option key={m} value={m}>{m} Mark Category</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Item Count</label>
                   <input type="number" min="1" className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.numQuestions} onChange={e => setNewEntry({...newEntry, numQuestions: Number(e.target.value)})}/>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Item Format</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.formatId} onChange={e => setNewEntry({...newEntry, formatId: e.target.value})}>
                     {ITEM_FORMATS.map(f => <option key={f.id} value={f.id}>{f.code}: {f.abbreviation}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Estimated Time</label>
                   <input type="number" min="1" className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.estimatedTime} onChange={e => setNewEntry({...newEntry, estimatedTime: Number(e.target.value)})}/>
                 </div>
               </div>
               <button onClick={() => { onAddEntry(newEntry); setShowAddModal(false); }} className="w-full bg-indigo-600 text-white p-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30">Commit Assignment</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;
