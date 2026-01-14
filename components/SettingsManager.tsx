
import React, { useState } from 'react';
import { ClassGrade, CognitiveLevel, DifficultyLevel, QuestionType, Subject, Unit } from '../types';

interface SettingsManagerProps {
  view: 'exam-types' | 'class-subject' | 'unit-subunit' | 'cognitive';
  classes: ClassGrade[];
  levels: CognitiveLevel[];
  difficultyLevels: DifficultyLevel[];
  questionTypes: QuestionType[];
  updateClasses: (c: ClassGrade[]) => void;
  updateLevels: (l: CognitiveLevel[]) => void;
  updateDifficulty: (d: DifficultyLevel[]) => void;
  updateQuestionTypes: (qt: QuestionType[]) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ 
  view,
  classes, levels, difficultyLevels, questionTypes, 
  updateClasses, updateLevels, updateDifficulty, updateQuestionTypes 
}) => {
  
  // --- PAPER TYPES (Exam Config) ---
  const [newMark, setNewMark] = useState(1);
  const [maxQ, setMaxQ] = useState(4);

  const addQuestionType = () => {
    if (questionTypes.some(qt => qt.marks === newMark)) {
      alert("Marks category already exists");
      return;
    }
    updateQuestionTypes([...questionTypes, { id: `qt_${Date.now()}`, marks: newMark, maxQuestions: maxQ }]);
  };

  // --- CLASS & SUBJECT ---
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassForSub, setSelectedClassForSub] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const addClass = () => {
    if (!newClassName.trim()) return;
    updateClasses([...classes, { id: `c_${Date.now()}`, name: newClassName.trim(), subjects: [] }]);
    setNewClassName('');
  };

  const addSubject = () => {
    if (!newSubjectName.trim() || !selectedClassForSub) return;
    updateClasses(classes.map(c => 
      c.id === selectedClassForSub 
        ? { ...c, subjects: [...c.subjects, { id: `s_${Date.now()}`, name: newSubjectName.trim(), units: [] }] }
        : c
    ));
    setNewSubjectName('');
  };

  // --- UNIT & SUBUNIT (Hierarchical) ---
  const [selClassUnit, setSelClassUnit] = useState('');
  const [selSubUnit, setSelSubUnit] = useState('');
  const [selUnitSub, setSelUnitSub] = useState('');
  
  const [newUnitName, setNewUnitName] = useState('');
  const [newSubUnitName, setNewSubUnitName] = useState('');

  const activeSubjectsForUnit = classes.find(c => c.id === selClassUnit)?.subjects || [];
  const activeUnitsForSub = activeSubjectsForUnit.find(s => s.id === selSubUnit)?.units || [];

  const addUnit = () => {
    if (!newUnitName.trim() || !selClassUnit || !selSubUnit) return;
    updateClasses(classes.map(c => c.id === selClassUnit ? {
      ...c,
      subjects: c.subjects.map(s => s.id === selSubUnit ? {
        ...s,
        units: [...s.units, { id: `u_${Date.now()}`, name: newUnitName.trim(), subUnits: [] }]
      } : s)
    } : c));
    setNewUnitName('');
  };

  const addSubUnit = () => {
    if (!newSubUnitName.trim() || !selClassUnit || !selSubUnit || !selUnitSub) return;
    updateClasses(classes.map(c => c.id === selClassUnit ? {
      ...c,
      subjects: c.subjects.map(s => s.id === selSubUnit ? {
        ...s,
        units: s.units.map(u => u.id === selUnitSub ? {
          ...u,
          subUnits: [...u.subUnits, { id: `sub_${Date.now()}`, name: newSubUnitName.trim() }]
        } : u)
      } : s)
    } : c));
    setNewSubUnitName('');
  };

  // --- TAXONOMY (Cognitive & Difficulty) ---
  const [newCogName, setNewCogName] = useState('');
  const [newCogDesc, setNewCogDesc] = useState('');
  const [newDiffName, setNewDiffName] = useState('');

  const addCognitive = () => {
    if (!newCogName) return;
    updateLevels([...levels, { id: `cog_${Date.now()}`, name: newCogName.toUpperCase(), description: newCogDesc }]);
    setNewCogName(''); setNewCogDesc('');
  };

  const addDifficulty = () => {
    if (!newDiffName) return;
    updateDifficulty([...difficultyLevels, { id: `diff_${Date.now()}`, name: newDiffName }]);
    setNewDiffName('');
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-200">
      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">{icon}</div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[60vh]">
      
      {/* --- EXAM TYPES VIEW --- */}
      {view === 'exam-types' && (
        <div>
          <SectionHeader 
            title="Question Paper Types" 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
          />
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
            <h3 className="text-sm font-bold uppercase text-slate-500 mb-4">Add Configuration (Type 1, 2, 3...)</h3>
            <div className="flex flex-wrap gap-4 items-end">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-700">Question Count</label>
                 <input type="number" min="1" className="p-3 border rounded-lg w-32" value={maxQ} onChange={e => setMaxQ(Number(e.target.value))} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-700">Marks per Q</label>
                 <input type="number" min="1" className="p-3 border rounded-lg w-32" value={newMark} onChange={e => setNewMark(Number(e.target.value))} />
               </div>
               <button onClick={addQuestionType} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">Add Pattern</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {questionTypes.map(qt => (
               <div key={qt.id} className="bg-white p-4 border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                 <div>
                   <div className="text-lg font-black text-slate-800">{qt.maxQuestions} × {qt.marks} Marks</div>
                   <div className="text-xs text-slate-500 font-bold">Total: {qt.maxQuestions * qt.marks} Marks</div>
                 </div>
                 <button onClick={() => updateQuestionTypes(questionTypes.filter(q => q.id !== qt.id))} className="text-red-400 hover:text-red-600">×</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* --- CLASS & SUBJECT VIEW --- */}
      {view === 'class-subject' && (
        <div>
          <SectionHeader 
             title="Classes & Subjects" 
             icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Class */}
            <div className="space-y-4">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h3 className="text-xs font-bold uppercase text-indigo-600 mb-2">Create New Class</h3>
                  <div className="flex gap-2">
                    <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="Class Name" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                    <button onClick={addClass} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                  </div>
               </div>
               <div className="space-y-2">
                 {classes.map(c => (
                   <div key={c.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                      <span className="font-bold">{c.name}</span>
                      <button onClick={() => updateClasses(classes.filter(cl => cl.id !== c.id))} className="text-red-400 text-xs uppercase font-bold">Delete</button>
                   </div>
                 ))}
               </div>
            </div>

            {/* Add Subject */}
            <div className="space-y-4">
               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <h3 className="text-xs font-bold uppercase text-emerald-600 mb-2">Add Subject to Class</h3>
                  <div className="space-y-2">
                    <select className="w-full p-2 border rounded-lg text-sm bg-white" value={selectedClassForSub} onChange={e => setSelectedClassForSub(e.target.value)}>
                       <option value="">Select Class</option>
                       {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="Subject Name" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                      <button onClick={addSubject} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                    </div>
                  </div>
               </div>
               
               {selectedClassForSub && (
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Subjects in Selected Class</h4>
                    <div className="space-y-1">
                       {classes.find(c => c.id === selectedClassForSub)?.subjects.map(s => (
                         <div key={s.id} className="text-sm p-2 bg-white rounded border border-slate-200 flex justify-between">
                            {s.name}
                            <button onClick={() => updateClasses(classes.map(c => c.id === selectedClassForSub ? {...c, subjects: c.subjects.filter(sub => sub.id !== s.id)} : c))} className="text-red-400">×</button>
                         </div>
                       )) || <div className="text-sm text-slate-400 italic">No subjects yet</div>}
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* --- UNIT & SUBUNIT VIEW --- */}
      {view === 'unit-subunit' && (
        <div>
          <SectionHeader 
             title="Units & Subunits (Hierarchy)" 
             icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
          />
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-orange-800 uppercase">1. Select Class</label>
               <select className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white" value={selClassUnit} onChange={e => { setSelClassUnit(e.target.value); setSelSubUnit(''); setSelUnitSub(''); }}>
                 <option value="">-- Class --</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-orange-800 uppercase">2. Select Subject</label>
               <select className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white" value={selSubUnit} onChange={e => { setSelSubUnit(e.target.value); setSelUnitSub(''); }} disabled={!selClassUnit}>
                 <option value="">-- Subject --</option>
                 {activeSubjectsForUnit.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-orange-800 uppercase">3. Select Unit (For Subunit)</label>
               <select className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white" value={selUnitSub} onChange={e => setSelUnitSub(e.target.value)} disabled={!selSubUnit}>
                 <option value="">-- Unit (Optional) --</option>
                 {activeUnitsForSub.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`p-4 rounded-xl border transition-all ${selSubUnit ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-50'}`}>
               <h3 className="font-bold text-slate-800 mb-3">Add Unit</h3>
               <div className="flex gap-2">
                 <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="Unit Name" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} disabled={!selSubUnit} />
                 <button onClick={addUnit} disabled={!selSubUnit} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
               </div>
               <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
                 {activeUnitsForSub.map(u => (
                   <div key={u.id} className="text-sm p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                     {u.name}
                     <button onClick={() => updateClasses(classes.map(c => c.id === selClassUnit ? {...c, subjects: c.subjects.map(s => s.id === selSubUnit ? {...s, units: s.units.filter(unit => unit.id !== u.id)} : s)} : c))} className="text-red-300 hover:text-red-500">×</button>
                   </div>
                 ))}
               </div>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${selUnitSub ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-50'}`}>
               <h3 className="font-bold text-slate-800 mb-3">Add Subunit (Topic)</h3>
               <div className="flex gap-2">
                 <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="Topic Name" value={newSubUnitName} onChange={e => setNewSubUnitName(e.target.value)} disabled={!selUnitSub} />
                 <button onClick={addSubUnit} disabled={!selUnitSub} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
               </div>
               <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
                 {activeUnitsForSub.find(u => u.id === selUnitSub)?.subUnits.map(sub => (
                   <div key={sub.id} className="text-sm p-2 bg-indigo-50 rounded border border-indigo-100 text-indigo-800 flex justify-between">
                     {sub.name}
                     <button className="text-red-300 hover:text-red-500">×</button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAXONOMY VIEW --- */}
      {view === 'cognitive' && (
        <div className="space-y-8">
           <SectionHeader 
             title="Taxonomy Management" 
             icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
          />
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Question Types (Cognitive) */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Question Type (Cognitive)</h3>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 space-y-2">
                   <input className="w-full p-2 border rounded text-sm" placeholder="Code (e.g. SR1, CRS2)" value={newCogName} onChange={e => setNewCogName(e.target.value)} />
                   <input className="w-full p-2 border rounded text-sm" placeholder="Description" value={newCogDesc} onChange={e => setNewCogDesc(e.target.value)} />
                   <button onClick={addCognitive} className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm">Add Type</button>
                </div>
                <div className="space-y-2">
                   {levels.map(l => (
                     <div key={l.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                       <div>
                         <span className="font-bold text-blue-700 block">{l.name}</span>
                         <span className="text-xs text-slate-500">{l.description}</span>
                       </div>
                       <button onClick={() => updateLevels(levels.filter(lvl => lvl.id !== l.id))} className="text-red-300 hover:text-red-500">×</button>
                     </div>
                   ))}
                </div>
              </div>

              {/* Question Level (Difficulty) */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Question Level (Difficulty)</h3>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-4 flex gap-2">
                   <input className="flex-1 p-2 border rounded text-sm" placeholder="Level (e.g. Basic)" value={newDiffName} onChange={e => setNewDiffName(e.target.value)} />
                   <button onClick={addDifficulty} className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-sm">Add</button>
                </div>
                <div className="space-y-2">
                   {difficultyLevels.map(d => (
                     <div key={d.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                       <span className="font-bold text-purple-700">{d.name}</span>
                       <button onClick={() => updateDifficulty(difficultyLevels.filter(diff => diff.id !== d.id))} className="text-red-300 hover:text-red-500">×</button>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default SettingsManager;
