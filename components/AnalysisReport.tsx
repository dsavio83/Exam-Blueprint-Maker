import React, { useState, useMemo } from 'react';
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
  const totalScore = useMemo(() => entries.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0), [entries]);
  const totalItems = useMemo(() => entries.reduce((s, e) => s + e.numQuestions, 0), [entries]);
  const totalTime = useMemo(() => entries.reduce((s, e) => s + e.estimatedTime, 0), [entries]);

  const patternStatus = useMemo(() => paperPattern?.questionTypes.map(qt => {
    const assigned = entries.filter(e => e.marksPerItem === qt.marks).reduce((s, e) => s + e.numQuestions, 0);
    return { ...qt, assigned };
  }) || [], [paperPattern, entries]);

  const handleAutoGenerate = () => {
    if (!paperPattern) {
      alert("Please select a Paper Pattern first to use auto-generation.");
      return;
    }
    if (!confirm("This will clear your current assignments and generate a new distribution based on the 30/50/20 rule. Proceed?")) return;

    // Clear all entries first
    entries.forEach((_, idx) => onUpdateEntry(null, 0));

    const newEntries: BlueprintEntry[] = [];
    const units = subject.units;
    let unitIdx = 0;

    // Distribute for each Question Type category in the pattern
    paperPattern.questionTypes.forEach(qt => {
      const marks = qt.marks;
      const totalToAssign = qt.maxQuestions;

      // Knowledge level quotas for this category
      const quota = {
        B: Math.round(totalToAssign * 0.3),
        A: Math.round(totalToAssign * 0.5),
        P: totalToAssign - Math.round(totalToAssign * 0.3) - Math.round(totalToAssign * 0.5)
      };

      let assignedInCat = 0;
      
      // Knowledge Distribution
      (['B', 'A', 'P'] as const).forEach(kCode => {
        const kId = KNOWLEDGE_LEVELS.find(k => k.code === kCode)?.id || KNOWLEDGE_LEVELS[0].id;
        const count = quota[kCode];

        for (let i = 0; i < count; i++) {
          const unit = units[unitIdx % units.length];
          const subUnit = unit.subUnits[Math.floor(Math.random() * unit.subUnits.length)];
          const cog = COGNITIVE_PROCESSES[Math.floor(Math.random() * COGNITIVE_PROCESSES.length)];
          const format = ITEM_FORMATS.find(f => {
             if (marks === 1) return f.type === 'SR';
             if (marks <= 3) return f.type === 'CRS';
             return f.type === 'CRL';
          }) || ITEM_FORMATS[0];

          newEntries.push({
            unitId: unit.id,
            subUnitId: subUnit.id,
            formatId: format.id,
            numQuestions: 1,
            marksPerItem: marks,
            cognitiveId: cog.id,
            knowledgeId: kId,
            estimatedTime: marks * 2
          });
          unitIdx++;
          assignedInCat++;
        }
      });

      // Cleanup if rounding left some unassigned
      while(assignedInCat < totalToAssign) {
          const unit = units[unitIdx % units.length];
          const subUnit = unit.subUnits[0];
          newEntries.push({
            unitId: unit.id,
            subUnitId: subUnit.id,
            formatId: ITEM_FORMATS[0].id,
            numQuestions: 1,
            marksPerItem: marks,
            cognitiveId: COGNITIVE_PROCESSES[0].id,
            knowledgeId: KNOWLEDGE_LEVELS[1].id,
            estimatedTime: marks * 2
          });
          assignedInCat++;
          unitIdx++;
      }
    });

    newEntries.forEach(e => onAddEntry(e));
  };

  const getSubUnitEntries = (uId: string, sId: string) => entries.filter(e => e.unitId === uId && e.subUnitId === sId);

  const ReportHeader = () => (
    <div className="text-center border-b-4 border-indigo-600 pb-8 mb-12">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-[0.2em] mb-4">HS Question Paper Analysis Engine</h1>
      <div className="grid grid-cols-2 mt-6 text-left max-w-4xl mx-auto gap-x-12 gap-y-4 font-black text-slate-700 text-sm">
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Class</span> <span className="text-indigo-600">: {blueprint.classId}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Subject</span> <span className="text-indigo-600">: {subject.name}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Target Score</span> <span className="text-indigo-600">: {blueprint.maxScore}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Actual Score</span> <span className="text-indigo-600">: {totalScore}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Examination</span> <span className="text-indigo-600">: {blueprint.examType}</span></div>
        <div className="flex justify-between border-b border-slate-100 pb-1"><span>Status</span> <span className={totalScore === blueprint.maxScore ? 'text-emerald-600' : 'text-amber-500'}>: {totalScore === blueprint.maxScore ? 'COMPLETE' : 'IN-PROGRESS'}</span></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Top Controls */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex gap-4">
           <button onClick={() => setActiveTab('matrix')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'}`}>1. Assignment Matrix</button>
           <button onClick={() => setActiveTab('summaries')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'summaries' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'}`}>2. Reports Summary</button>
        </div>
        <div className="flex gap-4">
          <button onClick={handleAutoGenerate} className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-amber-200 flex items-center gap-2 hover:-translate-y-0.5 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Auto-Generate (30/50/20)
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Print All Reports
          </button>
        </div>
      </div>

      <div className="bg-white p-10 max-w-[1300px] mx-auto rounded-[3rem] shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0 print:rounded-none">
        
        {activeTab === 'matrix' ? (
          <section className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4">Matrix Design Proforma</h3>
              <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 print:hidden">
                 + Manual Entry
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-900 shadow-2xl mb-12">
              <table className="w-full border-collapse text-[10px] font-bold leading-tight">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th rowSpan={2} className="p-4 border border-slate-700 w-32 uppercase">Content Area</th>
                    <th rowSpan={2} className="p-4 border border-slate-700 w-48 uppercase">Objective</th>
                    <th rowSpan={2} className="p-4 border border-slate-700 w-32 uppercase">Topic</th>
                    <th colSpan={7} className="p-2 border border-slate-700 text-center uppercase text-[9px] bg-slate-800">Cognitive Process</th>
                    <th colSpan={3} className="p-2 border border-slate-700 text-center uppercase text-[9px] bg-indigo-900">Knowledge Level</th>
                    <th colSpan={5} className="p-2 border border-slate-700 text-center uppercase text-[9px] bg-emerald-900">Format</th>
                    <th rowSpan={2} className="p-2 border border-slate-700 w-8 text-center">T</th>
                    <th rowSpan={2} className="p-2 border border-slate-700 w-8 text-center">I</th>
                    <th rowSpan={2} className="p-2 border border-slate-700 w-8 text-center bg-indigo-600">S</th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-900">
                    {COGNITIVE_PROCESSES.map(cp => <VerticalHeader key={cp.id}>{cp.code}</VerticalHeader>)}
                    {KNOWLEDGE_LEVELS.map(kl => <VerticalHeader key={kl.id}>{kl.code}</VerticalHeader>)}
                    {ITEM_FORMATS.map(f => <VerticalHeader key={f.id}>{f.abbreviation}</VerticalHeader>)}
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
                          <tr key={sub.id} className="group hover:bg-slate-50 border-b border-slate-200">
                            {sIdx === 0 && (
                              <td rowSpan={unit.subUnits.length} className="p-3 border-r border-slate-300 align-top font-black text-indigo-700 uppercase">
                                 {blueprint.topicNameOverrides[unit.id] || unit.name}
                              </td>
                            )}
                            <td className="p-3 border-r border-slate-300 italic text-slate-500">
                              {blueprint.objectiveOverrides[sub.id] || sub.learningObjective}
                            </td>
                            <td className="p-3 border-r border-slate-300 font-bold text-slate-800">{sub.name}</td>
                            {COGNITIVE_PROCESSES.map(cp => {
                              // Fix: Remove the generic type argument from the reduce method and type the accumulator parameter instead to avoid TSX parsing conflicts.
                              const eIndices = entries.reduce((acc: number[], ent, idx) => {
                                if (ent.unitId === unit.id && ent.subUnitId === sub.id && ent.cognitiveId === cp.id) acc.push(idx);
                                return acc;
                              }, []);
                              return (
                                <td key={cp.id} className="border-r border-slate-200 text-center relative h-12">
                                  {eIndices.map(idx => (
                                    <div key={idx} className="bg-indigo-100 text-indigo-700 rounded p-0.5 mb-0.5 cursor-pointer hover:bg-red-100 hover:text-red-700" onClick={() => onUpdateEntry(null, idx)}>
                                      {entries[idx].numQuestions}({entries[idx].marksPerItem})
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                            {KNOWLEDGE_LEVELS.map(kl => {
                              const match = entries.find(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.knowledgeId === kl.id);
                              return <td key={kl.id} className="border-r border-slate-200 text-center h-12 bg-indigo-50/20">{match ? match.numQuestions : ''}</td>;
                            })}
                            {ITEM_FORMATS.map(f => {
                              const match = entries.find(ent => ent.unitId === unit.id && ent.subUnitId === sub.id && ent.formatId === f.id);
                              return <td key={f.id} className="border-r border-slate-200 text-center h-12 bg-emerald-50/20">{match ? match.numQuestions : ''}</td>;
                            })}
                            <td className="p-1 border-r border-slate-300 text-center bg-slate-50">{subTime || '-'}</td>
                            <td className="p-1 border-r border-slate-300 text-center bg-slate-50">{subItems || '-'}</td>
                            <td className="p-1 border-slate-300 text-center font-black bg-indigo-600 text-white">{subScore || '-'}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black text-[10px] uppercase">
                   <tr>
                     <td colSpan={3} className="p-4 text-right">SUMMARY TOTALS</td>
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
            
            {/* Real-time Target Tracker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
               <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                  <h4 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-6 flex justify-between">
                    <span>Knowledge Level Goals</span>
                    <span className="text-slate-400">Target: 30 / 50 / 20</span>
                  </h4>
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
                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${actual}%` }}></div>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>

               <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                  <h4 className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-6">Pattern Adherence</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {patternStatus.map(p => (
                       <div key={p.id} className={`p-4 rounded-2xl border-2 flex flex-col items-center bg-white ${p.assigned === p.maxQuestions ? 'border-emerald-500' : 'border-slate-100'}`}>
                          <span className="text-[10px] font-black opacity-40 uppercase">{p.marks} Marks</span>
                          <span className="text-xl font-black">{p.assigned} / {p.maxQuestions}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </section>
        ) : (
          <div className="space-y-20 animate-fade-in print:space-y-16">
            <ReportHeader />

            <section className="break-after-page">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4 mb-6">II. Weightage to Content Area</h3>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full text-xs font-bold border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr><th className="p-3 border border-slate-700 w-16">S.No</th><th className="p-3 border border-slate-700 text-left">Unit / Topic</th><th className="p-3 border border-slate-700">Actual Marks</th><th className="p-3 border border-slate-700">Percentage</th></tr>
                  </thead>
                  <tbody>
                    {subject.units.map((u, i) => {
                      const score = entries.filter(e => e.unitId === u.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      return (
                        <tr key={u.id} className="border-b border-slate-200">
                          <td className="p-3 border-r text-center">{i+1}</td>
                          <td className="p-3 border-r uppercase">{u.name}</td>
                          <td className="p-3 border-r text-center font-black">{score}</td>
                          <td className="p-3 text-center">{totalScore > 0 ? ((score/totalScore)*100).toFixed(1) : '0'}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="break-after-page">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4 mb-6">III. Weightage to Cognitive Process</h3>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full text-xs font-bold border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr><th className="p-3 border border-slate-700 w-16">S.No</th><th className="p-3 border border-slate-700 text-left">Process Name</th><th className="p-3 border border-slate-700">Score</th><th className="p-3 border border-slate-700">Percentage</th></tr>
                  </thead>
                  <tbody>
                    {COGNITIVE_PROCESSES.map((cp, i) => {
                      const score = entries.filter(e => e.cognitiveId === cp.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      return (
                        <tr key={cp.id} className="border-b border-slate-200">
                          <td className="p-3 border-r text-center">{i+1}</td>
                          <td className="p-3 border-r">{cp.name}</td>
                          <td className="p-3 border-r text-center font-black">{score || '-'}</td>
                          <td className="p-3 text-center">{totalScore > 0 ? ((score/totalScore)*100).toFixed(1) : '0'}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="break-after-page">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4 mb-6">IV. Weightage to Knowledge Level (30/50/20)</h3>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full text-xs font-bold border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr><th className="p-3 border border-slate-700">Level</th><th className="p-3 border border-slate-700">Target %</th><th className="p-3 border border-slate-700">Actual Score</th><th className="p-3 border border-slate-700">Actual %</th><th className="p-3 border border-slate-700">Status</th></tr>
                  </thead>
                  <tbody>
                    {KNOWLEDGE_LEVELS.map(kl => {
                      const target = kl.code === 'B' ? 30 : kl.code === 'A' ? 50 : 20;
                      const score = entries.filter(e => e.knowledgeId === kl.id).reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const actual = totalScore > 0 ? (score / totalScore) * 100 : 0;
                      return (
                        <tr key={kl.id} className="border-b border-slate-200">
                          <td className="p-3 border-r font-black uppercase">{kl.name}</td>
                          <td className="p-3 border-r text-center">{target}%</td>
                          <td className="p-3 border-r text-center font-black text-indigo-600">{score}</td>
                          <td className="p-3 border-r text-center">{actual.toFixed(1)}%</td>
                          <td className="p-3 text-center">{Math.abs(actual - target) < 5 ? 'OPTIMAL' : 'VARIES'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="break-after-page">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest border-l-8 border-indigo-600 pl-4 mb-6">V. Weightage to Item Format</h3>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full text-xs font-bold border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr><th className="p-3 border border-slate-700 text-left">Format</th><th className="p-3 border border-slate-700">Total Items</th><th className="p-3 border border-slate-700">Total Score</th><th className="p-3 border border-slate-700">Estimated Time</th></tr>
                  </thead>
                  <tbody>
                    {ITEM_FORMATS.map(f => {
                      const match = entries.filter(e => e.formatId === f.id);
                      const items = match.reduce((s, e) => s + e.numQuestions, 0);
                      const score = match.reduce((s, e) => s + (e.numQuestions * e.marksPerItem), 0);
                      const time = match.reduce((s, e) => s + e.estimatedTime, 0);
                      return (
                        <tr key={f.id} className="border-b border-slate-200">
                          <td className="p-3 border-r">{f.name} ({f.abbreviation})</td>
                          <td className="p-3 border-r text-center">{items || '-'}</td>
                          <td className="p-3 border-r text-center font-black">{score || '-'}</td>
                          <td className="p-3 text-center">{time || '-'}m</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-black">
                     <tr><td className="p-3 text-right">TOTALS</td><td className="p-3 text-center">{totalItems}</td><td className="p-3 text-center text-indigo-600">{totalScore}</td><td className="p-3 text-center">{totalTime}m</td></tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>
        )}

        <footer className="mt-20 pt-8 border-t border-slate-100 hidden print:block text-slate-400 text-[9px] italic text-center">
           Confidential Administrative Document &bull; Institutional Analysis Report &bull; Powered by Blueprint Pro Engine
        </footer>
      </div>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 print:hidden">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border-2 border-indigo-600 animate-scale-up">
             <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
               <h3 className="font-black text-2xl uppercase tracking-widest">Add Assignment</h3>
               <button onClick={() => setShowAddModal(false)} className="text-3xl font-black">×</button>
             </div>
             <div className="p-10 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.unitId} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}>
                     {subject.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sub-unit</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.subUnitId} onChange={e => setNewEntry({...newEntry, subUnitId: e.target.value})}>
                     {subject.units.find(u => u.id === newEntry.unitId)?.subUnits.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cognitive Process</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.cognitiveId} onChange={e => setNewEntry({...newEntry, cognitiveId: e.target.value})}>
                     {COGNITIVE_PROCESSES.map(cp => <option key={cp.id} value={cp.id}>{cp.code}: {cp.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Knowledge Level</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.knowledgeId} onChange={e => setNewEntry({...newEntry, knowledgeId: e.target.value})}>
                     {KNOWLEDGE_LEVELS.map(kl => <option key={kl.id} value={kl.id}>{kl.code}: {kl.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Marks</label>
                   <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.marksPerItem} onChange={e => setNewEntry({...newEntry, marksPerItem: Number(e.target.value)})}>
                      {[1, 2, 3, 5, 8, 10].map(m => <option key={m} value={m}>{m} Mark Slot</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Item Count</label>
                   <input type="number" min="1" className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" value={newEntry.numQuestions} onChange={e => setNewEntry({...newEntry, numQuestions: Number(e.target.value)})}/>
                 </div>
               </div>
               <button onClick={() => { onAddEntry(newEntry); setShowAddModal(false); }} className="w-full bg-indigo-600 text-white p-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30">Commit to Matrix</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;