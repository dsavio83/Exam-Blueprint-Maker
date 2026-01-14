
import React from 'react';
import { Subject, BlueprintEntry, CognitiveLevel, KnowledgeLevel, ItemFormat, SavedBlueprint } from '../types';
import { COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS, ITEM_FORMATS } from '../constants';

interface AnalysisReportProps {
  blueprint: SavedBlueprint;
  subject: Subject;
  onUpdateEntry: (entry: Partial<BlueprintEntry> & { index: number }) => void;
  onUpdateOverrides: (key: string, val: string, type: 'name' | 'objective') => void;
}

/**
 * VerticalHeader component for rotated table headers.
 * Moved outside the main component to avoid re-mounting and typed as React.FC 
 * to properly support standard props like 'key' in mapped collections.
 */
const VerticalHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="p-2 border border-slate-300 text-xs font-bold bg-slate-50 relative h-32 align-bottom">
    <div className="transform -rotate-90 origin-bottom-left absolute left-1/2 bottom-2 translate-x-[-50%] whitespace-nowrap text-[10px] leading-tight w-0">
      {children}
    </div>
  </th>
);

const AnalysisReport: React.FC<AnalysisReportProps> = ({ blueprint, subject, onUpdateEntry, onUpdateOverrides }) => {
  const { entries } = blueprint;

  // Helper to get entries for a specific subunit
  const getSubUnitEntries = (uId: string, sId: string) => entries.filter(e => e.unitId === uId && e.subUnitId === sId);

  // Totals calculations
  const totalScore = entries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
  const totalItems = entries.reduce((s, e) => s + e.numQuestions, 0);
  const totalTime = entries.reduce((s, e) => s + e.estimatedTime, 0);

  return (
    <div className="space-y-12 bg-white p-8 max-w-[1200px] mx-auto print:p-0">
      
      {/* SECTION I: GENERAL INFO */}
      <div className="text-center border-b-2 border-indigo-200 pb-4 mb-8">
        <h1 className="text-2xl font-black text-indigo-600 uppercase tracking-widest">Question Paper Design - HS</h1>
        <div className="grid grid-cols-2 mt-4 text-left max-w-2xl mx-auto gap-y-2 font-bold text-slate-700">
          <div className="flex gap-2"><span>Class</span> <span>: {blueprint.classId}</span></div>
          <div className="flex gap-2"><span>Time</span> <span>: {blueprint.timeAllotted} Minit</span></div>
          <div className="flex gap-2"><span>Subject</span> <span>: {subject.name}</span></div>
          <div className="flex gap-2"><span>Score</span> <span>: {blueprint.maxScore}</span></div>
          <div className="flex gap-2"><span>Term</span> <span>: {blueprint.examType}</span></div>
        </div>
      </div>

      {/* SECTION II: ITEM-WISE ANALYSIS (The Big Table) */}
      <div className="report-section">
        <h3 className="text-lg font-bold text-indigo-700 mb-4">Item-wise Analysis Proforma</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-[10px]">
            <thead>
              <tr className="bg-orange-100">
                <th rowSpan={2} className="p-2 border border-slate-400 w-24">Topic/Unit/Chapter</th>
                <th rowSpan={2} className="p-2 border border-slate-400 w-32">Learning Objective</th>
                <th rowSpan={2} className="p-2 border border-slate-400 w-24">Sub-topic/Discourse</th>
                <th colSpan={7} className="p-1 border border-slate-400 text-center uppercase tracking-tighter">Cognitive Process</th>
                <th colSpan={3} className="p-1 border border-slate-400 text-center uppercase tracking-tighter">Knowledge Level</th>
                <th colSpan={5} className="p-1 border border-slate-400 text-center uppercase tracking-tighter">Item Format</th>
                <th rowSpan={2} className="p-1 border border-slate-400 w-8"><div className="transform -rotate-90">Time</div></th>
                <th rowSpan={2} className="p-1 border border-slate-400 w-8"><div className="transform -rotate-90">Items</div></th>
                <th rowSpan={2} className="p-1 border border-slate-400 w-8"><div className="transform -rotate-90">Score</div></th>
              </tr>
              <tr className="bg-emerald-50">
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
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        {sIdx === 0 && (
                          <td rowSpan={unit.subUnits.length} className="p-2 border border-slate-300 align-top font-bold">
                             <input 
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-200 outline-none"
                                value={blueprint.topicNameOverrides[unit.id] || unit.name}
                                onChange={(e) => onUpdateOverrides(unit.id, e.target.value, 'name')}
                             />
                          </td>
                        )}
                        <td className="p-2 border border-slate-300">
                          <textarea 
                             className="w-full bg-transparent border-none outline-none resize-none h-12"
                             value={blueprint.objectiveOverrides[sub.id] || sub.learningObjective}
                             onChange={(e) => onUpdateOverrides(sub.id, e.target.value, 'objective')}
                          />
                        </td>
                        <td className="p-2 border border-slate-300 font-medium italic">
                          <input 
                              className="w-full bg-transparent outline-none"
                              value={sub.name}
                              readOnly
                          />
                        </td>
                        
                        {/* Cognitive Matrix Rendering - Placeholder Logic for display */}
                        {COGNITIVE_PROCESSES.map(cp => {
                          const e = subEntries.find(ent => ent.cognitiveId === cp.id);
                          return <td key={cp.id} className="border border-slate-200 text-center">{e ? `(${e.numQuestions}, ${e.marksPerItem})` : ''}</td>;
                        })}
                        {KNOWLEDGE_LEVELS.map(kl => {
                          const e = subEntries.find(ent => ent.knowledgeId === kl.id);
                          return <td key={kl.id} className="border border-slate-200 text-center">{e ? `(${e.numQuestions}, ${e.marksPerItem})` : ''}</td>;
                        })}
                        {ITEM_FORMATS.map(f => {
                          const e = subEntries.find(ent => ent.formatId === f.id);
                          return <td key={f.id} className="border border-slate-200 text-center">{e ? `(${e.numQuestions}, ${e.marksPerItem})` : ''}</td>;
                        })}
                        
                        <td className="p-1 border border-slate-300 text-center font-bold">{subTime}</td>
                        <td className="p-1 border border-slate-300 text-center font-bold">{subItems}</td>
                        <td className="p-1 border border-slate-300 text-center font-bold">{subScore}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-emerald-100 font-black text-[11px]">
               <tr>
                 <td colSpan={3} className="p-2 border border-slate-400 text-right uppercase">Total Items & Scores</td>
                 {COGNITIVE_PROCESSES.map(cp => <td key={cp.id} className="border border-slate-400 text-center">{entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                 {KNOWLEDGE_LEVELS.map(kl => <td key={kl.id} className="border border-slate-400 text-center">{entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                 {ITEM_FORMATS.map(f => <td key={f.id} className="border border-slate-400 text-center">{entries.filter(e => e.formatId === f.id).reduce((s, e) => s + e.numQuestions, 0)}</td>)}
                 <td className="border border-slate-400 text-center text-sm">{totalTime}</td>
                 <td className="border border-slate-400 text-center text-sm">{totalItems}</td>
                 <td className="border border-slate-400 text-center text-sm">{totalScore}</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION III: WEIGHTAGE SUMMARY REPORTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 print:block print:space-y-12">
        
        {/* Weightage to Cognitive Process */}
        <div className="border border-slate-200 p-4 rounded-xl">
           <h4 className="font-bold text-indigo-600 mb-4 uppercase text-sm border-b pb-1">Weightage to Cognitive Process</h4>
           <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                   <th className="p-2 border">S.No</th><th className="p-2 border text-left">Cognitive Process</th><th className="p-2 border">Score</th><th className="p-2 border">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {COGNITIVE_PROCESSES.map((cp, i) => {
                  const score = entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                  return (
                    <tr key={cp.id}>
                      <td className="p-2 border text-center">{i+1}</td>
                      <td className="p-2 border">{cp.name} ({cp.code})</td>
                      <td className="p-2 border text-center">{score || '-'}</td>
                      <td className="p-2 border text-center">{score ? ((score/totalScore)*100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-black bg-indigo-50">
                   <td colSpan={2} className="p-2 border text-right">Total</td>
                   <td className="p-2 border text-center">{totalScore}</td>
                   <td className="p-2 border text-center">100%</td>
                </tr>
              </tfoot>
           </table>
        </div>

        {/* Weightage to Knowledge Level */}
        <div className="border border-slate-200 p-4 rounded-xl">
           <h4 className="font-bold text-indigo-600 mb-4 uppercase text-sm border-b pb-1">Weightage to Knowledge Level</h4>
           <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                   <th className="p-2 border">S.No</th><th className="p-2 border text-left">Level</th><th className="p-2 border">Score</th><th className="p-2 border">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {KNOWLEDGE_LEVELS.map((kl, i) => {
                  const score = entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                  return (
                    <tr key={kl.id}>
                      <td className="p-2 border text-center">{i+1}</td>
                      <td className="p-2 border">{kl.name}</td>
                      <td className="p-2 border text-center">{score || '-'}</td>
                      <td className="p-2 border text-center">{score ? ((score/totalScore)*100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-black bg-indigo-50">
                   <td colSpan={2} className="p-2 border text-right">Total</td>
                   <td className="p-2 border text-center">{totalScore}</td>
                   <td className="p-2 border text-center">100%</td>
                </tr>
              </tfoot>
           </table>
        </div>

        {/* Weightage to Item Format */}
        <div className="md:col-span-2 border border-slate-200 p-4 rounded-xl">
           <h4 className="font-bold text-indigo-600 mb-4 uppercase text-sm border-b pb-1">Weightage to Item Format</h4>
           <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                   <th className="p-2 border">S.No</th><th className="p-2 border text-left">Item Format</th><th className="p-2 border">No. of Items</th><th className="p-2 border">Est. Time</th><th className="p-2 border">Score</th><th className="p-2 border">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {ITEM_FORMATS.map((f, i) => {
                  const fEntries = entries.filter(e => e.formatId === f.id);
                  const items = fEntries.reduce((s, e) => s + e.numQuestions, 0);
                  const score = fEntries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                  const time = fEntries.reduce((s, e) => s + e.estimatedTime, 0);
                  return (
                    <tr key={f.id}>
                      <td className="p-2 border text-center">{i+1}</td>
                      <td className="p-2 border">{f.name} ({f.code})</td>
                      <td className="p-2 border text-center">{items || '-'}</td>
                      <td className="p-2 border text-center">{time || '-'}</td>
                      <td className="p-2 border text-center">{score || '-'}</td>
                      <td className="p-2 border text-center">{score ? ((score/totalScore)*100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-black bg-indigo-50">
                   <td colSpan={2} className="p-2 border text-right">Total</td>
                   <td className="p-2 border text-center">{totalItems}</td>
                   <td className="p-2 border text-center">{totalTime}</td>
                   <td className="p-2 border text-center">{totalScore}</td>
                   <td className="p-2 border text-center">100%</td>
                </tr>
              </tfoot>
           </table>
        </div>

      </div>

      <div className="text-center mt-12 pt-8 border-t border-slate-100 hidden print:block italic text-slate-400 text-sm">
         Generated by Blueprint Pro AI Analysis System &bull; Official Proforma System
      </div>
    </div>
  );
};

export default AnalysisReport;
