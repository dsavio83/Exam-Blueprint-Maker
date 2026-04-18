
import React from 'react';
import { Subject, BlueprintEntry, CognitiveLevel, QuestionType } from '../types';

interface BlueprintTableProps {
  subject: Subject | undefined;
  entries: BlueprintEntry[];
  cognitiveLevels: CognitiveLevel[];
  questionTypes: QuestionType[];
  onUpdateEntry: (unitId: string, subUnitId: string, marks: number, count: number) => void;
  weightNote?: string;
  examTitle?: string;
  paperTypeName?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  sr1: 'bg-blue-100 border-blue-200',
  sr2: 'bg-orange-100 border-orange-200',
  crs1: 'bg-green-100 border-green-200',
  crs2: 'bg-purple-100 border-purple-200',
  crl: 'bg-pink-100 border-pink-200',
  as1: 'bg-teal-100 border-teal-200',
};

const BlueprintTable: React.FC<BlueprintTableProps> = ({ 
  subject, 
  entries, 
  cognitiveLevels, 
  questionTypes, 
  onUpdateEntry, 
  weightNote,
  examTitle,
  paperTypeName
}) => {
  if (!subject) return <div className="p-8 text-center text-slate-500">Please select a class or subject.</div>;

  const getEntry = (unitId: string, subUnitId: string, marks: number) => {
    // Fix: marksCategory does not exist on BlueprintEntry, using marksPerItem
    return entries.find(e => e.unitId === unitId && e.subUnitId === subUnitId && e.marksPerItem === marks);
  };

  const calculateSubUnitTotal = (unitId: string, subUnitId: string) => {
    return entries
      .filter(e => e.unitId === unitId && e.subUnitId === subUnitId)
      // Fix: marksCategory does not exist on BlueprintEntry, using marksPerItem
      .reduce((sum, e) => sum + (e.numQuestions * e.marksPerItem), 0);
  };

  const calculateUnitTotal = (unitId: string) => {
    return entries
      .filter(e => e.unitId === unitId)
      // Fix: marksCategory does not exist on BlueprintEntry, using marksPerItem
      .reduce((sum, e) => sum + (e.numQuestions * e.marksPerItem), 0);
  };

  const visibleUnitIds = subject.units.map(u => u.id);
  const visibleEntries = entries.filter(e => visibleUnitIds.includes(e.unitId));
  // Fix: marksCategory does not exist on BlueprintEntry, using marksPerItem
  const grandTotal = visibleEntries.reduce((sum, e) => sum + (e.numQuestions * e.marksPerItem), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        {weightNote && (
           <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 flex-1 mr-4">
             <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <div>
               <h4 className="text-sm font-bold text-yellow-800 uppercase">Exam Pattern Guideline</h4>
               <p className="text-sm text-yellow-700">{weightNote}</p>
             </div>
           </div>
        )}
        <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print / PDF
        </button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
         <h1 className="text-2xl font-black uppercase text-slate-900">{examTitle || 'Exam Blueprint'}</h1>
         <div className="flex justify-center gap-6 mt-2 text-sm font-bold text-slate-600">
            <span>Subject: {subject.name}</span>
            <span>Type: {paperTypeName}</span>
            <span>Max Marks: {grandTotal}</span>
         </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full blueprint-table border-collapse text-xs min-w-[800px] print:w-full print:min-w-0">
          <thead>
            <tr className="bg-slate-800 text-white print:bg-white print:text-black print:border-b-2 print:border-black">
              <th className="p-3 w-32 border print:border-slate-300">Unit</th>
              <th className="p-3 w-48 border print:border-slate-300">Lesson/Topic</th>
              <th className="p-3 w-16 bg-indigo-700 print:bg-white print:text-black border print:border-slate-300">Marks</th>
              {questionTypes.map(qt => (
                <th key={qt.id} className="p-3 font-semibold w-24 border print:border-slate-300">
                  <div className="flex flex-col items-center leading-tight">
                    <span>{qt.maxQuestions} × {qt.marks}M</span>
                    <span className="text-[10px] opacity-75 font-normal print:hidden">= {qt.maxQuestions * qt.marks}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subject.units.map((unit) => (
              <React.Fragment key={unit.id}>
                {unit.subUnits.map((sub, subIdx) => (
                  <tr key={sub.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                    {subIdx === 0 && <td rowSpan={unit.subUnits.length} className="p-3 font-black border-r bg-slate-50 print:bg-white align-top border print:border-slate-300">{unit.name}</td>}
                    <td className="p-3 italic text-slate-600 border-r border print:border-slate-300">{sub.name}</td>
                    <td className="p-3 text-center bg-indigo-50 font-black border print:bg-white print:border-slate-300">{calculateSubUnitTotal(unit.id, sub.id)}</td>
                    {questionTypes.map(qt => {
                      const entry = getEntry(unit.id, sub.id, qt.marks);
                      // Fix: levelId does not exist on BlueprintEntry, using cognitiveId
                      const level = cognitiveLevels.find(l => l.id === entry?.cognitiveId);
                      return (
                        <td key={qt.id} className="p-1 text-center border h-14 w-14 print:border-slate-300">
                          {entry && (
                            // Fix: levelId does not exist on BlueprintEntry, using formatId for color mapping as per LEVEL_COLORS definition
                            <div className={`h-full flex flex-col justify-center items-center rounded border ${LEVEL_COLORS[entry.formatId] || 'bg-slate-100 border-slate-300'} print:border-none print:bg-transparent`}>
                              {/* Screen View */}
                              <input 
                                type="number" 
                                min="0"
                                className="w-full bg-transparent text-center font-black text-sm outline-none appearance-none m-0 p-0 focus:bg-white/50 rounded print:hidden"
                                value={entry.numQuestions}
                                onChange={(e) => onUpdateEntry(unit.id, sub.id, qt.marks, parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()} 
                              />
                              <span className="text-[8px] uppercase font-bold opacity-70 cursor-default select-none print:hidden">{level?.name}</span>
                              
                              {/* Print View */}
                              <div className="hidden print:flex flex-col items-center">
                                <span className="font-bold text-sm">{entry.numQuestions}</span>
                                <span className="text-[8px] uppercase">{level?.name}</span>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-indigo-900 text-white font-bold text-center print:bg-slate-100 print:text-black">
                  <td colSpan={2} className="p-2 text-right uppercase tracking-widest text-[10px] border print:border-slate-300">Unit Total:</td>
                  <td className="p-2 border-r print:border-slate-300">{calculateUnitTotal(unit.id)}</td>
                  {questionTypes.map(qt => {
                     // Fix: marksCategory does not exist on BlueprintEntry, using marksPerItem
                     const count = entries.filter(e => e.unitId === unit.id && e.marksPerItem === qt.marks).reduce((s, e) => s + e.numQuestions, 0);
                     return <td key={qt.id} className="p-2 text-indigo-200 print:text-black border print:border-slate-300">{count || ''}</td>;
                  })}
                </tr>
              </React.Fragment>
            ))}
            <tr className="bg-slate-100 font-black text-center text-slate-900 border-t-4 border-slate-800 print:border-t-2 print:border-black print:bg-white">
              <td colSpan={3} className="p-4 text-right text-base border print:border-slate-300">Grand Total:</td>
              {questionTypes.map(qt => {
                // Fix: marksCategory does not exist on BlueprintEntry, using marksPerItem
                const count = visibleEntries.filter(e => e.marksPerItem === qt.marks).reduce((s, e) => s + e.numQuestions, 0);
                return <td key={qt.id} className="p-4 border-l text-lg border print:border-slate-300">{count}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="text-center mt-8 pt-8 border-t hidden print:block text-sm text-slate-500">
         <p>Generated by Blueprint Pro System • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default BlueprintTable;
