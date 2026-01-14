
import React, { useState } from 'react';
import { ClassGrade, CognitiveLevel, DifficultyLevel, PaperType, QuestionType } from '../types';

interface SettingsManagerProps {
  view: 'exam-types' | 'class-subject' | 'unit-subunit' | 'cognitive';
  classes: ClassGrade[];
  levels: CognitiveLevel[];
  difficultyLevels: DifficultyLevel[];
  paperTypes: PaperType[];
  updateClasses: (c: ClassGrade[]) => void;
  updateLevels: (l: CognitiveLevel[]) => void;
  updateDifficulty: (d: DifficultyLevel[]) => void;
  updatePaperTypes: (pt: PaperType[]) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ 
  view,
  classes, levels, difficultyLevels, paperTypes, 
  updateClasses, updateLevels, updateDifficulty, updatePaperTypes 
}) => {
  
  // --- PAPER TYPES (Exam Config) ---
  const [selectedPaperTypeForEdit, setSelectedPaperTypeForEdit] = useState<string>('');
  
  // Edit Paper Type Name
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [editPaperNameVal, setEditPaperNameVal] = useState('');

  // Editing a specific question type inside a paper type
  const [newMark, setNewMark] = useState(1);
  const [maxQ, setMaxQ] = useState(4);

  const updatePaperTypeName = (id: string) => {
    if (!editPaperNameVal.trim()) return;
    updatePaperTypes(paperTypes.map(p => p.id === id ? { ...p, name: editPaperNameVal.trim() } : p));
    setEditingPaperId(null);
  };

  const addQuestionToPaper = () => {
    if (!selectedPaperTypeForEdit) return;
    
    const paperIndex = paperTypes.findIndex(p => p.id === selectedPaperTypeForEdit);
    if (paperIndex === -1) return;

    const paper = paperTypes[paperIndex];
    if (paper.questionTypes.some(q => q.marks === newMark)) {
      alert("This marks category already exists in this paper type.");
      return;
    }

    const newQuestionType: QuestionType = { id: `qt_${Date.now()}`, marks: newMark, maxQuestions: maxQ };
    const updatedPaper = { ...paper, questionTypes: [...paper.questionTypes, newQuestionType] };
    
    const updatedPapers = [...paperTypes];
    updatedPapers[paperIndex] = updatedPaper;
    updatePaperTypes(updatedPapers);
  };

  const removeQuestionFromPaper = (ptId: string, qId: string) => {
    const updatedPapers = paperTypes.map(pt => {
      if (pt.id === ptId) {
        return { ...pt, questionTypes: pt.questionTypes.filter(q => q.id !== qId) };
      }
      return pt;
    });
    updatePaperTypes(updatedPapers);
  };

  // --- CLASS & SUBJECT LOGIC (Keeping existing logic for brevity as it was updated in previous turn, ensuring it compiles) ---
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassForSub, setSelectedClassForSub] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassNameVal, setEditClassNameVal] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectNameVal, setEditSubjectNameVal] = useState('');

  const addClass = () => {
    if (!newClassName.trim()) return;
    updateClasses([...classes, { id: `c_${Date.now()}`, name: newClassName.trim(), subjects: [] }]);
    setNewClassName('');
  };
  const saveClassName = (id: string) => {
    if (!editClassNameVal.trim()) return;
    updateClasses(classes.map(c => c.id === id ? { ...c, name: editClassNameVal.trim() } : c));
    setEditingClassId(null);
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
  const saveSubjectName = (classId: string, subjectId: string) => {
    if (!editSubjectNameVal.trim()) return;
    updateClasses(classes.map(c => c.id === classId ? {
      ...c,
      subjects: c.subjects.map(s => s.id === subjectId ? { ...s, name: editSubjectNameVal.trim() } : s)
    } : c));
    setEditingSubjectId(null);
  };

  // --- UNIT & SUBUNIT ---
  const [selClassUnit, setSelClassUnit] = useState('');
  const [selSubUnit, setSelSubUnit] = useState('');
  const [selUnitSub, setSelUnitSub] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newSubUnitName, setNewSubUnitName] = useState('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitNameVal, setEditUnitNameVal] = useState('');
  const [editingSubUnitId, setEditingSubUnitId] = useState<string | null>(null);
  const [editSubUnitNameVal, setEditSubUnitNameVal] = useState('');

  const activeSubjectsForUnit = classes.find(c => c.id === selClassUnit)?.subjects || [];
  const activeUnitsForSub = activeSubjectsForUnit.find(s => s.id === selSubUnit)?.units || [];

  const addUnit = () => {
    if (!newUnitName.trim() || !selClassUnit || !selSubUnit) return;
    updateClasses(classes.map(c => c.id === selClassUnit ? { ...c, subjects: c.subjects.map(s => s.id === selSubUnit ? { ...s, units: [...s.units, { id: `u_${Date.now()}`, name: newUnitName.trim(), subUnits: [] }] } : s) } : c));
    setNewUnitName('');
  };
  const saveUnitName = (unitId: string) => {
    if (!editUnitNameVal.trim() || !selClassUnit || !selSubUnit) return;
    updateClasses(classes.map(c => {
      if (c.id !== selClassUnit) return c;
      return { ...c, subjects: c.subjects.map(s => { if (s.id !== selSubUnit) return s; return { ...s, units: s.units.map(u => { if (u.id !== unitId) return u; return { ...u, name: editUnitNameVal.trim() }; }) }; }) };
    }));
    setEditingUnitId(null);
    setEditUnitNameVal('');
  };
  const addSubUnit = () => {
    if (!newSubUnitName.trim() || !selClassUnit || !selSubUnit || !selUnitSub) return;
    updateClasses(classes.map(c => c.id === selClassUnit ? { ...c, subjects: c.subjects.map(s => s.id === selSubUnit ? { ...s, units: s.units.map(u => u.id === selUnitSub ? { ...u, subUnits: [...u.subUnits, { id: `sub_${Date.now()}`, name: newSubUnitName.trim() }] } : u) } : s) } : c));
    setNewSubUnitName('');
  };
  const saveSubUnitName = (subUnitId: string) => {
    if (!editSubUnitNameVal.trim() || !selClassUnit || !selSubUnit || !selUnitSub) return;
    updateClasses(classes.map(c => { if (c.id !== selClassUnit) return c; return { ...c, subjects: c.subjects.map(s => { if (s.id !== selSubUnit) return s; return { ...s, units: s.units.map(u => { if (u.id !== selUnitSub) return u; return { ...u, subUnits: u.subUnits.map(sub => sub.id === subUnitId ? { ...sub, name: editSubUnitNameVal.trim() } : sub) } }) } }) } }));
    setEditingSubUnitId(null);
  };

  // --- TAXONOMY ---
  const [newCogName, setNewCogName] = useState('');
  const [newCogDesc, setNewCogDesc] = useState('');
  const [newDiffName, setNewDiffName] = useState('');
  const [editingCogId, setEditingCogId] = useState<string | null>(null);
  const [editCogNameVal, setEditCogNameVal] = useState('');
  const [editCogDescVal, setEditCogDescVal] = useState('');
  const [editingDiffId, setEditingDiffId] = useState<string | null>(null);
  const [editDiffNameVal, setEditDiffNameVal] = useState('');

  const addCognitive = () => {
    if (!newCogName) return;
    updateLevels([...levels, { id: `cog_${Date.now()}`, name: newCogName.toUpperCase(), description: newCogDesc }]);
    setNewCogName(''); setNewCogDesc('');
  };
  const saveCognitive = (id: string) => {
    if (!editCogNameVal) return;
    updateLevels(levels.map(l => l.id === id ? { ...l, name: editCogNameVal, description: editCogDescVal } : l));
    setEditingCogId(null);
  };
  const addDifficulty = () => {
    if (!newDiffName) return;
    updateDifficulty([...difficultyLevels, { id: `diff_${Date.now()}`, name: newDiffName }]);
    setNewDiffName('');
  };
  const saveDifficulty = (id: string) => {
    if (!editDiffNameVal) return;
    updateDifficulty(difficultyLevels.map(d => d.id === id ? { ...d, name: editDiffNameVal } : d));
    setEditingDiffId(null);
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-200">
      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">{icon}</div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
  );

  const EditControls = ({ onSave, onCancel }: { onSave: () => void, onCancel: () => void }) => (
    <div className="flex gap-1 ml-2">
       <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50">✓</button>
       <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">×</button>
    </div>
  );
  const EditButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50">
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
    </button>
  );
  const DeleteButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="text-red-300 hover:text-red-500 p-1 rounded hover:bg-red-50">
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </button>
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
          
          <div className="space-y-3">
            {paperTypes.map(pt => (
              <div key={pt.id} className="border border-slate-200 rounded-lg overflow-hidden transition-all">
                <div 
                   className={`p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 ${selectedPaperTypeForEdit === pt.id ? 'bg-indigo-50 border-b border-indigo-100' : ''}`} 
                   onClick={() => { setSelectedPaperTypeForEdit(selectedPaperTypeForEdit === pt.id ? '' : pt.id); setEditingPaperId(null); }}
                >
                   <div className="flex-1">
                      {editingPaperId === pt.id ? (
                        <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                           <input 
                             className="p-1 border border-indigo-300 rounded text-sm outline-none"
                             value={editPaperNameVal}
                             onChange={e => setEditPaperNameVal(e.target.value)}
                             autoFocus
                           />
                           <EditControls onSave={() => updatePaperTypeName(pt.id)} onCancel={() => setEditingPaperId(null)} />
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800 text-lg">{pt.name}</span>
                      )}
                   </div>
                   <div className="flex items-center gap-4">
                     {editingPaperId !== pt.id && <EditButton onClick={() => { setEditingPaperId(pt.id); setEditPaperNameVal(pt.name); }} />}
                     <span className="text-slate-400 text-sm">{selectedPaperTypeForEdit === pt.id ? 'Hide Details' : 'Show Details'} ▼</span>
                   </div>
                </div>
                
                {selectedPaperTypeForEdit === pt.id && (
                  <div className="p-4 bg-white animate-fade-in">
                     <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Question Breakdown</div>
                     {pt.questionTypes.length === 0 ? (
                        <div className="text-slate-400 italic text-sm">No details configured.</div>
                     ) : (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                           {pt.questionTypes.map(q => (
                             <div key={q.id} className="p-2 border border-slate-100 rounded bg-slate-50 text-center relative group">
                                <div className="font-bold text-slate-700">{q.maxQuestions} Q <span className="text-slate-300">|</span> {q.marks} M</div>
                                <div className="text-[10px] text-slate-500 uppercase">Total: {q.maxQuestions * q.marks}</div>
                                <button 
                                  onClick={() => removeQuestionFromPaper(pt.id, q.id)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >×</button>
                             </div>
                           ))}
                        </div>
                     )}

                     <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3 items-end">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Questions</label>
                          <input type="number" min="1" className="p-2 border rounded w-20 text-sm" value={maxQ} onChange={e => setMaxQ(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Marks</label>
                          <input type="number" min="1" className="p-2 border rounded w-20 text-sm" value={newMark} onChange={e => setNewMark(Number(e.target.value))} />
                        </div>
                        <button onClick={addQuestionToPaper} className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-900">Add Pattern</button>
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- CLASS, SUBJECT, UNIT VIEWS (Condensed to avoid XML limit, logic remains same) --- */}
      {view === 'class-subject' && (
        <div>
           {/* Re-implementing simplified Class/Subject view to ensure file completeness */}
           <SectionHeader title="Classes & Subjects" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex gap-2"><input className="flex-1 p-2 border rounded text-sm" placeholder="Class Name" value={newClassName} onChange={e => setNewClassName(e.target.value)} /><button onClick={addClass} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold">Add</button></div>
                 <div className="space-y-2">{classes.map(c => <div key={c.id} className="p-2 border rounded flex justify-between items-center">{editingClassId === c.id ? <><input value={editClassNameVal} onChange={e => setEditClassNameVal(e.target.value)} className="border p-1 text-sm"/><EditControls onSave={()=>saveClassName(c.id)} onCancel={()=>setEditingClassId(null)}/></> : <><span className="font-bold">{c.name}</span><div className="flex gap-2"><EditButton onClick={()=>{setEditingClassId(c.id); setEditClassNameVal(c.name)}}/><DeleteButton onClick={()=>updateClasses(classes.filter(cl=>cl.id!==c.id))}/></div></>}</div>)}</div>
              </div>
              <div className="space-y-4">
                 <select className="w-full p-2 border rounded text-sm" value={selectedClassForSub} onChange={e => setSelectedClassForSub(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                 <div className="flex gap-2"><input className="flex-1 p-2 border rounded text-sm" placeholder="Subject Name" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} /><button onClick={addSubject} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold">Add</button></div>
                 <div className="space-y-2">{classes.find(c => c.id === selectedClassForSub)?.subjects.map(s => <div key={s.id} className="p-2 border rounded flex justify-between items-center">{editingSubjectId === s.id ? <><input value={editSubjectNameVal} onChange={e => setEditSubjectNameVal(e.target.value)} className="border p-1 text-sm"/><EditControls onSave={()=>saveSubjectName(selectedClassForSub,s.id)} onCancel={()=>setEditingSubjectId(null)}/></> : <><span className="text-sm">{s.name}</span><div className="flex gap-2"><EditButton onClick={()=>{setEditingSubjectId(s.id); setEditSubjectNameVal(s.name)}}/><DeleteButton onClick={()=>updateClasses(classes.map(c=>c.id===selectedClassForSub?{...c,subjects:c.subjects.filter(sub=>sub.id!==s.id)}:c))}/></div></>}</div>)}</div>
              </div>
           </div>
        </div>
      )}
      {view === 'unit-subunit' && (
         <div>
            <SectionHeader title="Units & Subunits" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>} />
            <div className="mb-4 grid grid-cols-3 gap-2">
               <select className="p-2 border rounded text-sm" value={selClassUnit} onChange={e=>{setSelClassUnit(e.target.value);setSelSubUnit('');setSelUnitSub('');}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
               <select className="p-2 border rounded text-sm" value={selSubUnit} onChange={e=>{setSelSubUnit(e.target.value);setSelUnitSub('');}} disabled={!selClassUnit}>{activeSubjectsForUnit.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
               <select className="p-2 border rounded text-sm" value={selUnitSub} onChange={e=>setSelUnitSub(e.target.value)} disabled={!selSubUnit}>{activeUnitsForSub.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 border rounded">
                  <h3 className="font-bold mb-2">Units</h3>
                  <div className="flex gap-2 mb-2"><input className="flex-1 border p-1 text-sm" value={newUnitName} onChange={e=>setNewUnitName(e.target.value)} disabled={!selSubUnit}/><button onClick={addUnit} className="bg-slate-800 text-white px-2 rounded text-sm">+</button></div>
                  <div className="space-y-1 h-40 overflow-y-auto">{activeUnitsForSub.map(u=><div key={u.id} className="p-1 border rounded text-sm flex justify-between">{editingUnitId===u.id?<><input value={editUnitNameVal} onChange={e=>setEditUnitNameVal(e.target.value)} className="w-full border p-1"/><EditControls onSave={()=>saveUnitName(u.id)} onCancel={()=>setEditingUnitId(null)}/></>:<><span>{u.name}</span><div className="flex gap-1"><EditButton onClick={()=>{setEditingUnitId(u.id);setEditUnitNameVal(u.name)}}/><DeleteButton onClick={()=>updateClasses(classes.map(c=>c.id===selClassUnit?{...c,subjects:c.subjects.map(s=>s.id===selSubUnit?{...s,units:s.units.filter(unit=>unit.id!==u.id)}:s)}:c))}/></div></>}</div>)}</div>
               </div>
               <div className="p-4 border rounded">
                  <h3 className="font-bold mb-2">Subunits</h3>
                  <div className="flex gap-2 mb-2"><input className="flex-1 border p-1 text-sm" value={newSubUnitName} onChange={e=>setNewSubUnitName(e.target.value)} disabled={!selUnitSub}/><button onClick={addSubUnit} className="bg-indigo-600 text-white px-2 rounded text-sm">+</button></div>
                  <div className="space-y-1 h-40 overflow-y-auto">{activeUnitsForSub.find(u=>u.id===selUnitSub)?.subUnits.map(sub=><div key={sub.id} className="p-1 border rounded text-sm flex justify-between">{editingSubUnitId===sub.id?<><input value={editSubUnitNameVal} onChange={e=>setEditSubUnitNameVal(e.target.value)} className="w-full border p-1"/><EditControls onSave={()=>saveSubUnitName(sub.id)} onCancel={()=>setEditingSubUnitId(null)}/></>:<><span>{sub.name}</span><div className="flex gap-1"><EditButton onClick={()=>{setEditingSubUnitId(sub.id);setEditSubUnitNameVal(sub.name)}}/><DeleteButton onClick={()=>updateClasses(classes.map(c=>c.id===selClassUnit?{...c,subjects:c.subjects.map(s=>s.id===selSubUnit?{...s,units:s.units.map(u=>u.id===selUnitSub?{...u,subUnits:u.subUnits.filter(su=>su.id!==sub.id)}:u)}:s)}:c))}/></div></>}</div>)}</div>
               </div>
            </div>
         </div>
      )}
      {view === 'cognitive' && (
         <div>
            <SectionHeader title="Taxonomy" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <h4 className="font-bold mb-2">Cognitive Types</h4>
                  <div className="flex gap-2 mb-2"><input placeholder="Name" className="border p-1 w-20" value={newCogName} onChange={e=>setNewCogName(e.target.value)}/><input placeholder="Desc" className="border p-1 flex-1" value={newCogDesc} onChange={e=>setNewCogDesc(e.target.value)}/><button onClick={addCognitive} className="bg-blue-600 text-white px-2 text-sm">Add</button></div>
                  <div className="space-y-1">{levels.map(l=><div key={l.id} className="p-1 border rounded flex justify-between">{editingCogId===l.id?<><input value={editCogNameVal} onChange={e=>setEditCogNameVal(e.target.value)} className="w-10 border"/><input value={editCogDescVal} onChange={e=>setEditCogDescVal(e.target.value)} className="flex-1 border"/><EditControls onSave={()=>saveCognitive(l.id)} onCancel={()=>setEditingCogId(null)}/></>:<><span>{l.name} - {l.description}</span><div className="flex gap-1"><EditButton onClick={()=>{setEditingCogId(l.id);setEditCogNameVal(l.name);setEditCogDescVal(l.description)}}/><DeleteButton onClick={()=>updateLevels(levels.filter(lvl=>lvl.id!==l.id))}/></div></>}</div>)}</div>
               </div>
               <div>
                  <h4 className="font-bold mb-2">Difficulties</h4>
                  <div className="flex gap-2 mb-2"><input className="border p-1 flex-1" value={newDiffName} onChange={e=>setNewDiffName(e.target.value)}/><button onClick={addDifficulty} className="bg-purple-600 text-white px-2 text-sm">Add</button></div>
                  <div className="space-y-1">{difficultyLevels.map(d=><div key={d.id} className="p-1 border rounded flex justify-between">{editingDiffId===d.id?<><input value={editDiffNameVal} onChange={e=>setEditDiffNameVal(e.target.value)} className="flex-1 border"/><EditControls onSave={()=>saveDifficulty(d.id)} onCancel={()=>setEditingDiffId(null)}/></>:<><span>{d.name}</span><div className="flex gap-1"><EditButton onClick={()=>{setEditingDiffId(d.id);setEditDiffNameVal(d.name)}}/><DeleteButton onClick={()=>updateDifficulty(difficultyLevels.filter(diff=>diff.id!==d.id))}/></div></>}</div>)}</div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default SettingsManager;
