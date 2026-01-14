
import React from 'react';
import { Subject, BlueprintEntry, CognitiveLevel, QuestionType } from '../types';

interface BlueprintTableProps {
  subject: Subject | undefined;
  entries: BlueprintEntry[];
  cognitiveLevels: CognitiveLevel[];
  questionTypes: QuestionType[];
  onUpdateEntry: (unitId: string, subUnitId: string, marks: number, count: number) => void;
  weightNote?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  sr1: 'bg-blue-100 border-blue-200',
  sr2: 'bg-orange-100 border-orange-200',
  crs1: 'bg-green-100 border-green-200',
  crs2: 'bg-purple-100 border-purple-200',
  crl: 'bg-pink-100 border-pink-200',
  as1: 'bg-teal-100 border-teal-200',
};

const LEVEL_PROGRESS_COLORS: Record<string, string> = {
  sr1: 'bg-blue-500',
  sr2: 'bg-orange-500',
  crs1: 'bg-green-500',
  crs2: 'bg-purple-500',
  crl: 'bg-pink-500',
  as1: 'bg-teal-500',
};

const BlueprintTable: React.FC<BlueprintTableProps> = ({ subject, entries, cognitiveLevels, questionTypes, onUpdateEntry, weightNote }) => {
  if (!subject) return <div className="p-8 text-center text-slate-500">Please select a class or subject.</div>;

  const getEntry = (unitId: string, subUnitId: string, marks: number) => {
    return entries.find(e => e.unitId === unitId && e.subUnitId === subUnitId && e.marksCategory === marks);
  };

  const calculateSubUnitTotal = (unitId: string, subUnitId: string) => {
    return entries
      .filter(e => e.unitId === unitId && e.subUnitId === subUnitId)
      .reduce((sum, e) => sum + (e.numQuestions * e.marksCategory), 0);
  };

  const calculateUnitTotal = (unitId: string) => {
    return entries
      .filter(e => e.unitId === unitId)
      .reduce((sum, e) => sum + (e.numQuestions * e.marksCategory), 0);
  };

  // Only calculate grand total based on visible units/entries
  const visibleUnitIds = subject.units.map(u => u.id);
  const visibleEntries = entries.filter(e => visibleUnitIds.includes(e.unitId));

  const grandTotal = visibleEntries.reduce((sum, e) => sum + (e.numQuestions * e.marksCategory), 0);

  const summaryByLevel = cognitiveLevels.map(level => {
    const levelEntries = visibleEntries.filter(e => e.levelId === level.id);
    const questions = levelEntries.reduce((sum, e) => sum + e.numQuestions, 0);
    const marks = levelEntries.reduce((sum, e) => sum + (e.numQuestions * e.marksCategory), 0);
    const percentage = grandTotal > 0 ? (marks / grandTotal) * 100 : 0;
    return { ...level, questions, marks, percentage };
  });

  return (
    <div className="space-y-6">
      {weightNote && (
         <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
           <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <div>
             <h4 className="text-sm font-bold text-yellow-800 uppercase">Exam Pattern Guideline</h4>
             <p className="text-sm text-yellow-700">{weightNote}</p>
           </div>
         </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full blueprint-table border-collapse text-xs min-w-[800px]">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="p-3 w-32">Unit</th>
              <th className="p-3 w-48">Lesson/Topic</th>
              <th className="p-3 w-16 bg-indigo-700">Marks</th>
              {questionTypes.map(qt => (
                <th key={qt.id} className="p-3 font-semibold w-24">
                  <div className="flex flex-col items-center leading-tight">
                    <span>{qt.maxQuestions} × {qt.marks}M</span>
                    <span className="text-[10px] opacity-75 font-normal">= {qt.maxQuestions * qt.marks}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subject.units.map((unit) => (
              <React.Fragment key={unit.id}>
                {unit.subUnits.map((sub, subIdx) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    {subIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-3 font-black border-r bg-slate-50 align-top">{unit.name}</td>}
                    <td className="p-3 italic text-slate-600 border-r">{sub.name}</td>
                    <td className="p-3 text-center bg-indigo-50 font-black">{calculateSubUnitTotal(unit.id, sub.id)}</td>
                    {questionTypes.map(qt => {
                      const entry = getEntry(unit.id, sub.id, qt.marks);
                      const level = cognitiveLevels.find(l => l.id === entry?.levelId);
                      return (
                        <td key={qt.id} className="p-1 text-center border h-14 w-14">
                          {entry && (
                            <div className={`h-full flex flex-col justify-center items-center rounded border ${LEVEL_COLORS[entry.levelId] || 'bg-slate-100 border-slate-300'}`}>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full bg-transparent text-center font-black text-sm outline-none appearance-none m-0 p-0 focus:bg-white/50 rounded"
                                value={entry.numQuestions}
                                onChange={(e) => onUpdateEntry(unit.id, sub.id, qt.marks, parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()} 
                              />
                              <span className="text-[8px] uppercase font-bold opacity-70 cursor-default select-none">{level?.name}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-indigo-900 text-white font-bold text-center">
                  <td colSpan={2} className="p-2 text-right uppercase tracking-widest text-[10px]">Unit Total:</td>
                  <td className="p-2 border-r">{calculateUnitTotal(unit.id)}</td>
                  {questionTypes.map(qt => {
                     const count = entries.filter(e => e.unitId === unit.id && e.marksCategory === qt.marks).reduce((s, e) => s + e.numQuestions, 0);
                     return <td key={qt.id} className="p-2 text-indigo-200">{count || ''}</td>;
                  })}
                </tr>
              </React.Fragment>
            ))}
            <tr className="bg-slate-100 font-black text-center text-slate-900 border-t-4 border-slate-800">
              <td colSpan={3} className="p-4 text-right text-base">Grand Total:</td>
              {questionTypes.map(qt => {
                const count = visibleEntries.filter(e => e.marksCategory === qt.marks).reduce((s, e) => s + e.numQuestions, 0);
                return <td key={qt.id} className="p-4 border-l text-lg">{count}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Level Distribution (Current Exam)</h3>
          <div className="space-y-4">
            {summaryByLevel.map(s => (
              <div key={s.id} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>
                    {s.name} 
                    <span className="text-slate-400 font-normal ml-2">({s.marks} marks)</span>
                  </span>
                  <span>{s.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${LEVEL_PROGRESS_COLORS[s.id] || 'bg-indigo-600'}`} 
                    style={{ width: `${s.percentage}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center p-8 bg-indigo-600 rounded-2xl shadow-xl text-white">
           <div className="text-center">
             <p className="text-xs uppercase font-bold opacity-70 mb-2">Total Maximum Marks</p>
             <p className="text-7xl font-black">{grandTotal}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintTable;
