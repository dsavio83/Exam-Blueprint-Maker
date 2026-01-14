
import React, { useState } from 'react';
import { Subject, BlueprintEntry, SavedBlueprint } from '../types';
import { COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS, ITEM_FORMATS } from '../constants';

interface AnalysisReportProps {
  blueprint: SavedBlueprint;
  subject: Subject;
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

const AnalysisReport: React.FC<AnalysisReportProps> = ({ blueprint, subject, onUpdateEntry, onAddEntry, onUpdateOverrides }) => {
  const [showAddModal, setShowAddModal] = useState(false);
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

  const getSubUnitEntries = (uId: string, sId: string) => entries.filter(e => e.unitId === uId && e.subUnitId === sId);

  return (
    <div className="space-y-16 bg-white p-10 max-w-[1250px] mx-auto rounded-[3rem] shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0 print:rounded-none">
      
      {/* HEADER */}
      <div className="text-center border-b-4 border-indigo-600 pb-8 mb-12">
        <h1 className="text-4xl font-black text-indigo-700 uppercase tracking-[0.2em] mb-4">Question Paper Design - HS</h1>
        <div className="grid grid-cols-2 mt-6 text-left max-w-3xl mx-auto gap-x-12 gap-y-4 font-black text-slate-700 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-1"><span>Class</span> <span className="text-indigo-600">: {blueprint.classId}</span></div>
          <div className="flex justify-between border-b border-slate-100 pb-1"><span>Time</span> <span className="text-indigo-600">: {blueprint.timeAllotted} Minutes</span></div>
          <div className="flex justify-between border-b border-slate-100 pb-1"><span>Subject</span> <span className="text-indigo-600">: {subject.name}</span></div>
          <div className="flex justify-between border-b border-slate-100 pb-1"><span>Max Score</span> <span className="text-indigo-600">: {blueprint.maxScore}</span></div>
          <div className="flex justify-between border-b border-slate-100 pb-1"><span>Examination</span> <span className="text-indigo-600">: {blueprint.examType}</span></div>
        </div>
      </div>

      {/* TABLE SECTION I */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4">I. Weightage to Content Area</h3>
          <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 print:hidden hover:bg-emerald-700">
             + Add Item Matrix Entry
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-2xl border-2 border-slate-900 shadow-2xl">
          <table className="w-full border-collapse text-[11px] font-bold leading-tight">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th rowSpan={2} className="p-4 border border-slate-700 w-32 uppercase tracking-tighter">Topic/Unit/Chapter</th>
                <th rowSpan={2} className="p-4 border border-slate-700 w-48 uppercase tracking-tighter">Learning Objective</th>
                <th rowSpan={2} className="p-4 border border-slate-700 w-32 uppercase tracking-tighter">Sub-topic / Discourse</th>
                <th colSpan={7} className="p-2 border border-slate-700 text-center uppercase tracking-widest text-[10px] bg-slate-800">Cognitive Process</th>
                <th colSpan={3} className="p-2 border border-slate-700 text-center uppercase tracking-widest text-[10px] bg-indigo-900">Knowledge Level</th>
                <th colSpan={5} className="p-2 border border-slate-700 text-center uppercase tracking-widest text-[10px] bg-emerald-900">Item Format</th>
                <th rowSpan={2} className="p-2 border border-slate-700 w-10 text-center bg-slate-800">Time</th>
                <th rowSpan={2} className="p-2 border border-slate-700 w-10 text-center bg-slate-800">Items</th>
                <th rowSpan={2} className="p-2 border border-slate-700 w-10 text-center bg-slate-800">Score</th>
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
                      <tr key={sub.id} className="group hover:bg-slate-50 transition-colors">
                        {sIdx === 0 && (
                          <td rowSpan={unit.subUnits.length} className="p-3 border border-slate-300 align-top bg-slate-50/50">
                             <input 
                                className="w-full bg-transparent font-black text-indigo-700 uppercase outline-none"
                                value={blueprint.topicNameOverrides[unit.id] || unit.name}
                                onChange={(e) => onUpdateOverrides(unit.id, e.target.value, 'name')}
                             />
                          </td>
                        )}
                        <td className="p-3 border border-slate-300 italic text-slate-500">
                          <textarea 
                             className="w-full bg-transparent border-none outline-none resize-none h-10 scrollbar-hide text-xs"
                             value={blueprint.objectiveOverrides[sub.id] || sub.learningObjective}
                             onChange={(e) => onUpdateOverrides(sub.id, e.target.value, 'objective')}
                             placeholder="Enter Objective..."
                          />
                        </td>
                        <td className="p-3 border border-slate-300 font-bold text-slate-800 bg-slate-50/30">
                          {sub.name}
                        </td>
                        
                        {COGNITIVE_PROCESSES.map(cp => {
                          const eIndex = entries.findIndex(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.cognitiveId === cp.id);
                          const e = eIndex > -1 ? entries[eIndex] : null;
                          return (
                            <td key={cp.id} className="border border-slate-200 text-center relative group/cell h-12">
                               {e ? (
                                 <div className="flex flex-col cursor-pointer" onClick={() => onUpdateEntry(null, eIndex)}>
                                   <span className="text-[9px]">({e.numQuestions}, {e.marksPerItem})</span>
                                 </div>
                               ) : null}
                            </td>
                          );
                        })}
                        {KNOWLEDGE_LEVELS.map(kl => {
                          const eIndex = entries.findIndex(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.knowledgeId === kl.id);
                          const e = eIndex > -1 ? entries[eIndex] : null;
                          return (
                            <td key={kl.id} className="border border-slate-200 text-center h-12">
                               {e ? <span className="text-[9px]">({e.numQuestions}, {e.marksPerItem})</span> : null}
                            </td>
                          );
                        })}
                        {ITEM_FORMATS.map(f => {
                          const eIndex = entries.findIndex(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.formatId === f.id);
                          const e = eIndex > -1 ? entries[eIndex] : null;
                          return (
                            <td key={f.id} className="border border-slate-200 text-center h-12">
                               {e ? <span className="text-[9px]">({e.numQuestions}, {e.marksPerItem})</span> : null}
                            </td>
                          );
                        })}
                        
                        <td className="p-2 border border-slate-300 text-center font-black bg-slate-100">{subTime || '-'}</td>
                        <td className="p-2 border border-slate-300 text-center font-black bg-slate-100">{subItems || '-'}</td>
                        <td className="p-2 border border-slate-300 text-center font-black bg-indigo-600 text-white">{subScore || '-'}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
               <tr>
                 <td colSpan={3} className="p-4 border border-slate-700 text-right">Grand Total Summary</td>
                 {COGNITIVE_PROCESSES.map(cp => <td key={cp.id} className="border border-slate-700 text-center">{entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                 {KNOWLEDGE_LEVELS.map(kl => <td key={kl.id} className="border border-slate-700 text-center">{entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                 {ITEM_FORMATS.map(f => <td key={f.id} className="border border-slate-700 text-center">{entries.filter(e => e.formatId === f.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                 <td className="border border-slate-700 text-center bg-slate-800 text-sm">{totalTime}</td>
                 <td className="border border-slate-700 text-center bg-slate-800 text-sm">{totalItems}</td>
                 <td className="border border-slate-700 text-center bg-indigo-600 text-sm">{totalScore}</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* WEIGHTAGE SUMMARIES */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 print:block print:space-y-12">
        
        {/* CP Weightage */}
        <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden shadow-xl">
           <div className="bg-slate-900 text-white p-4 font-black uppercase text-xs tracking-widest">II. Weightage to Cognitive Process</div>
           <table className="w-full text-xs font-bold">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900">
                   <th className="p-3 border-r border-slate-200">S.No</th><th className="p-3 border-r border-slate-200 text-left">Process</th><th className="p-3 border-r border-slate-200">Score</th><th className="p-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {COGNITIVE_PROCESSES.map((cp, i) => {
                  const score = entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                  return (
                    <tr key={cp.id} className="border-b border-slate-100">
                      <td className="p-3 border-r border-slate-200 text-center">{i+1}</td>
                      <td className="p-3 border-r border-slate-200">{cp.name}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-black">{score || '-'}</td>
                      <td className="p-3 text-center">{score ? ((score/totalScore)*100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-indigo-600 text-white font-black">
                <tr><td colSpan={2} className="p-3 text-right">TOTAL</td><td className="p-3 text-center">{totalScore}</td><td className="p-3 text-center">100%</td></tr>
              </tfoot>
           </table>
        </div>

        {/* Knowledge Weightage */}
        <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden shadow-xl">
           <div className="bg-slate-900 text-white p-4 font-black uppercase text-xs tracking-widest">III. Weightage to Knowledge Level</div>
           <table className="w-full text-xs font-bold">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900">
                   <th className="p-3 border-r border-slate-200">S.No</th><th className="p-3 border-r border-slate-200 text-left">Knowledge Level</th><th className="p-3 border-r border-slate-200">Score</th><th className="p-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {KNOWLEDGE_LEVELS.map((kl, i) => {
                  const score = entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                  return (
                    <tr key={kl.id} className="border-b border-slate-100">
                      <td className="p-3 border-r border-slate-200 text-center">{i+1}</td>
                      <td className="p-3 border-r border-slate-200">{kl.name}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-black">{score || '-'}</td>
                      <td className="p-3 text-center">{score ? ((score/totalScore)*100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-emerald-600 text-white font-black">
                <tr><td colSpan={2} className="p-3 text-right">TOTAL</td><td className="p-3 text-center">{totalScore}</td><td className="p-3 text-center">100%</td></tr>
              </tfoot>
           </table>
        </div>

        {/* Item Format Weightage */}
        <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-900 overflow-hidden shadow-xl">
           <div className="bg-slate-900 text-white p-4 font-black uppercase text-xs tracking-widest">IV. Weightage to Item Format</div>
           <table className="w-full text-xs font-bold">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900">
                   <th className="p-3 border-r border-slate-200">S.No</th><th className="p-3 border-r border-slate-200 text-left">Item Format</th><th className="p-3 border-r border-slate-200">Items</th><th className="p-3 border-r border-slate-200">Est. Time</th><th className="p-3 border-r border-slate-200">Score</th><th className="p-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {ITEM_FORMATS.map((f, i) => {
                  const fEntries = entries.filter(e => e.formatId === f.id);
                  const items = fEntries.reduce((s, e) => s + e.numQuestions, 0);
                  const score = fEntries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                  const time = fEntries.reduce((s, e) => s + e.estimatedTime, 0);
                  return (
                    <tr key={f.id} className="border-b border-slate-100">
                      <td className="p-3 border-r border-slate-200 text-center">{i+1}</td>
                      <td className="p-3 border-r border-slate-200">{f.name} ({f.code})</td>
                      <td className="p-3 border-r border-slate-200 text-center">{items || '-'}</td>
                      <td className="p-3 border-r border-slate-200 text-center">{time || '-'}</td>
                      <td className="p-3 border-r border-slate-200 text-center font-black">{score || '-'}</td>
                      <td className="p-3 text-center">{score ? ((score/totalScore)*100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-800 text-white font-black">
                <tr><td colSpan={2} className="p-3 text-right">TOTAL</td><td className="p-3 text-center">{totalItems}</td><td className="p-3 text-center">{totalTime}</td><td className="p-3 text-center">{totalScore}</td><td className="p-3 text-center">100%</td></tr>
              </tfoot>
           </table>
        </div>

      </section>

      {/* ADD ENTRY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up border-2 border-indigo-600">
             <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
               <h3 className="font-black text-xl uppercase tracking-widest">New Matrix Entry</h3>
               <button onClick={() => setShowAddModal(false)} className="text-white hover:rotate-90 transition-transform font-bold text-2xl">×</button>
             </div>
             <div className="p-8 space-y-5">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Unit</label>
                   <select className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.unitId} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}>
                     {subject.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Sub-unit</label>
                   <select className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.subUnitId} onChange={e => setNewEntry({...newEntry, subUnitId: e.target.value})}>
                     {subject.units.find(u => u.id === newEntry.unitId)?.subUnits.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Cognitive (CP)</label>
                   <select className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.cognitiveId} onChange={e => setNewEntry({...newEntry, cognitiveId: e.target.value})}>
                     {COGNITIVE_PROCESSES.map(cp => <option key={cp.id} value={cp.id}>{cp.code}: {cp.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Knowledge (K)</label>
                   <select className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.knowledgeId} onChange={e => setNewEntry({...newEntry, knowledgeId: e.target.value})}>
                     {KNOWLEDGE_LEVELS.map(kl => <option key={kl.id} value={kl.id}>{kl.code}: {kl.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Item Format</label>
                   <select className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.formatId} onChange={e => setNewEntry({...newEntry, formatId: e.target.value})}>
                     {ITEM_FORMATS.map(f => <option key={f.id} value={f.id}>{f.code}: {f.abbreviation}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Marks Per Item</label>
                   <input type="number" min="1" className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.marksPerItem} onChange={e => setNewEntry({...newEntry, marksPerItem: Number(e.target.value)})}/>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">No. of Items</label>
                   <input type="number" min="1" className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.numQuestions} onChange={e => setNewEntry({...newEntry, numQuestions: Number(e.target.value)})}/>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Est. Time (Mins)</label>
                   <input type="number" min="1" className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={newEntry.estimatedTime} onChange={e => setNewEntry({...newEntry, estimatedTime: Number(e.target.value)})}/>
                 </div>
               </div>
               <div className="pt-4">
                 <button onClick={() => { onAddEntry(newEntry); setShowAddModal(false); }} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:-translate-y-1 transition-all">
                   Add to Matrix Proforma
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      <footer className="text-center mt-20 pt-10 border-t border-slate-100 hidden print:block text-slate-400 text-xs italic">
         HS Official Question Paper Design Analysis Proforma &bull; Generated via Blueprint Pro
      </footer>
    </div>
  );
};

export default AnalysisReport;
