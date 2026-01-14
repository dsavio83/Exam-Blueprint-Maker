
import React, { useState } from 'react';
import { ClassGrade, CognitiveLevel, DifficultyLevel, PaperType, QuestionType, Subject, Unit } from '../types';

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
  const [newPaperTypeName, setNewPaperTypeName] = useState('');
  const [selectedPaperTypeForEdit, setSelectedPaperTypeForEdit] = useState<string>('');
  
  // Edit Paper Type Name
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [editPaperNameVal, setEditPaperNameVal] = useState('');

  // Editing a specific question type inside a paper type
  const [newMark, setNewMark] = useState(1);
  const [maxQ, setMaxQ] = useState(4);

  const addPaperType = () => {
    if (!newPaperTypeName.trim()) return;
    updatePaperTypes([...paperTypes, { 
      id: `pt_${Date.now()}`, 
      name: newPaperTypeName.trim(), 
      questionTypes: [] 
    }]);
    setNewPaperTypeName('');
  };

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

  const deletePaperType = (id: string) => {
    if (window.confirm("Delete this entire paper configuration?")) {
      updatePaperTypes(paperTypes.filter(p => p.id !== id));
      if (selectedPaperTypeForEdit === id) setSelectedPaperTypeForEdit('');
    }
  };

  // --- CLASS & SUBJECT ---
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassForSub, setSelectedClassForSub] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // Edit Class/Subject States
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

  // --- UNIT & SUBUNIT (Hierarchical) ---
  const [selClassUnit, setSelClassUnit] = useState('');
  const [selSubUnit, setSelSubUnit] = useState(''); // Holds Subject ID
  const [selUnitSub, setSelUnitSub] = useState(''); // Holds Unit ID
  
  const [newUnitName, setNewUnitName] = useState('');
  const [newSubUnitName, setNewSubUnitName] = useState('');

  // Editing state for Units/Subunits
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitNameVal, setEditUnitNameVal] = useState('');
  const [editingSubUnitId, setEditingSubUnitId] = useState<string | null>(null);
  const [editSubUnitNameVal, setEditSubUnitNameVal] = useState('');

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

  const saveUnitName = (unitId: string) => {
    if (!editUnitNameVal.trim() || !selClassUnit || !selSubUnit) return;
    updateClasses(classes.map(c => {
      if (c.id !== selClassUnit) return c;
      return {
        ...c,
        subjects: c.subjects.map(s => {
          if (s.id !== selSubUnit) return s;
          return {
            ...s,
            units: s.units.map(u => {
              if (u.id !== unitId) return u;
              return { ...u, name: editUnitNameVal.trim() };
            })
          };
        })
      };
    }));
    setEditingUnitId(null);
    setEditUnitNameVal('');
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

  const saveSubUnitName = (subUnitId: string) => {
    if (!editSubUnitNameVal.trim() || !selClassUnit || !selSubUnit || !selUnitSub) return;
    updateClasses(classes.map(c => {
        if (c.id !== selClassUnit) return c;
        return {
            ...c,
            subjects: c.subjects.map(s => {
                if (s.id !== selSubUnit) return s;
                return {
                    ...s,
                    units: s.units.map(u => {
                        if (u.id !== selUnitSub) return u;
                        return {
                            ...u,
                            subUnits: u.subUnits.map(sub => sub.id === subUnitId ? { ...sub, name: editSubUnitNameVal.trim() } : sub)
                        }
                    })
                }
            })
        }
    }));
    setEditingSubUnitId(null);
  };

  // --- TAXONOMY (Cognitive & Difficulty) ---
  const [newCogName, setNewCogName] = useState('');
  const [newCogDesc, setNewCogDesc] = useState('');
  const [newDiffName, setNewDiffName] = useState('');
  
  // Edit Taxonomy States
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
       <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50">
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
       </button>
       <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
       </button>
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
          
          {/* Add New Paper Type */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 flex gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Create New Paper Type</label>
              <input 
                className="w-full p-3 border rounded-lg text-sm" 
                placeholder="Name (e.g., Monthly Test Type A)" 
                value={newPaperTypeName} 
                onChange={e => setNewPaperTypeName(e.target.value)} 
              />
            </div>
            <button onClick={addPaperType} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-indigo-700">Create</button>
          </div>

          <div className="space-y-4">
            {paperTypes.map(pt => (
              <div key={pt.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                <div 
                   className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${selectedPaperTypeForEdit === pt.id ? 'bg-indigo-50 border-b border-indigo-100' : 'bg-white hover:bg-slate-50'}`} 
                   onClick={() => { setSelectedPaperTypeForEdit(selectedPaperTypeForEdit === pt.id ? '' : pt.id); setEditingPaperId(null); }}
                >
                   <div className="flex items-center gap-3 flex-1">
                      {editingPaperId === pt.id ? (
                        <div className="flex gap-2 items-center flex-1 max-w-sm" onClick={e => e.stopPropagation()}>
                           <input 
                             className="flex-1 p-2 border border-indigo-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
                   <div className="flex items-center gap-2">
                     {editingPaperId !== pt.id && (
                       <div className="flex gap-1">
                         <EditButton onClick={() => { setEditingPaperId(pt.id); setEditPaperNameVal(pt.name); }} />
                         <DeleteButton onClick={() => deletePaperType(pt.id)} />
                       </div>
                     )}
                     <span className="text-slate-400 transform transition-transform duration-200 ml-2" style={{ transform: selectedPaperTypeForEdit === pt.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                   </div>
                </div>
                
                {selectedPaperTypeForEdit === pt.id && (
                  <div className="p-6 bg-white">
                     {/* Add config to this paper */}
                     <div className="flex flex-wrap gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Question Count</label>
                          <input type="number" min="1" className="p-2 border rounded w-24 text-sm" value={maxQ} onChange={e => setMaxQ(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Marks per Q</label>
                          <input type="number" min="1" className="p-2 border rounded w-24 text-sm" value={newMark} onChange={e => setNewMark(Number(e.target.value))} />
                        </div>
                        <button onClick={addQuestionToPaper} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700">Add to {pt.name}</button>
                     </div>
                     
                     {/* List configs */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {pt.questionTypes.length === 0 && <div className="col-span-4 text-center text-slate-400 text-sm italic py-4">No question types added yet.</div>}
                        {pt.questionTypes.map(q => (
                          <div key={q.id} className="flex flex-col justify-between p-3 border border-slate-200 rounded bg-white shadow-sm relative group">
                             <div className="mb-2">
                               <div className="text-2xl font-black text-slate-700">{q.maxQuestions} <span className="text-sm font-normal text-slate-400">×</span> {q.marks}M</div>
                             </div>
                             <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-auto">
                               <span className="text-xs font-bold text-indigo-500">{q.maxQuestions * q.marks} Marks Total</span>
                               <button onClick={() => removeQuestionFromPaper(pt.id, q.id)} className="text-red-300 hover:text-red-500 font-bold px-1">×</button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
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
                   <div key={c.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg group">
                      {editingClassId === c.id ? (
                        <div className="flex items-center gap-2 flex-1">
                           <input 
                             className="flex-1 p-1 border border-indigo-300 rounded text-sm" 
                             value={editClassNameVal} 
                             onChange={e => setEditClassNameVal(e.target.value)}
                             autoFocus
                           />
                           <EditControls onSave={() => saveClassName(c.id)} onCancel={() => setEditingClassId(null)} />
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800">{c.name}</span>
                      )}
                      
                      {editingClassId !== c.id && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EditButton onClick={() => { setEditingClassId(c.id); setEditClassNameVal(c.name); }} />
                          <DeleteButton onClick={() => updateClasses(classes.filter(cl => cl.id !== c.id))} />
                        </div>
                      )}
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
                         <div key={s.id} className="text-sm p-2 bg-white rounded border border-slate-200 flex justify-between items-center group">
                            {editingSubjectId === s.id ? (
                               <div className="flex items-center gap-2 flex-1">
                                  <input 
                                    className="flex-1 p-1 border border-indigo-300 rounded text-sm" 
                                    value={editSubjectNameVal} 
                                    onChange={e => setEditSubjectNameVal(e.target.value)}
                                    autoFocus
                                  />
                                  <EditControls onSave={() => saveSubjectName(selectedClassForSub, s.id)} onCancel={() => setEditingSubjectId(null)} />
                               </div>
                            ) : (
                               <span className="text-slate-700 font-medium">{s.name}</span>
                            )}
                            
                            {editingSubjectId !== s.id && (
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <EditButton onClick={() => { setEditingSubjectId(s.id); setEditSubjectNameVal(s.name); }} />
                                  <DeleteButton onClick={() => updateClasses(classes.map(c => c.id === selectedClassForSub ? {...c, subjects: c.subjects.filter(sub => sub.id !== s.id)} : c))} />
                               </div>
                            )}
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
               <select className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white" value={selClassUnit} onChange={e => { setSelClassUnit(e.target.value); setSelSubUnit(''); setSelUnitSub(''); setEditingUnitId(null); setEditingSubUnitId(null); }}>
                 <option value="">-- Class --</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-orange-800 uppercase">2. Select Subject</label>
               <select className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white" value={selSubUnit} onChange={e => { setSelSubUnit(e.target.value); setSelUnitSub(''); setEditingUnitId(null); setEditingSubUnitId(null); }} disabled={!selClassUnit}>
                 <option value="">-- Subject --</option>
                 {activeSubjectsForUnit.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-orange-800 uppercase">3. Select Unit (For Subunit)</label>
               <select className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white" value={selUnitSub} onChange={e => { setSelUnitSub(e.target.value); setEditingSubUnitId(null); }} disabled={!selSubUnit}>
                 <option value="">-- Unit (Optional) --</option>
                 {activeUnitsForSub.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`p-4 rounded-xl border transition-all ${selSubUnit ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-50'}`}>
               <h3 className="font-bold text-slate-800 mb-3">Add / Manage Unit</h3>
               <div className="flex gap-2 mb-4">
                 <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="Unit Name" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} disabled={!selSubUnit} />
                 <button onClick={addUnit} disabled={!selSubUnit} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
               </div>
               <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                 {activeUnitsForSub.map(u => (
                   <div key={u.id} className="text-sm p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center group hover:border-slate-300 transition-colors">
                     {editingUnitId === u.id ? (
                        <div className="flex gap-1 flex-1 mr-2 items-center">
                            <input 
                                className="w-full p-1 border border-indigo-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editUnitNameVal}
                                onChange={(e) => setEditUnitNameVal(e.target.value)}
                                autoFocus
                            />
                            <EditControls onSave={() => saveUnitName(u.id)} onCancel={() => setEditingUnitId(null)} />
                        </div>
                     ) : (
                        <span className="flex-1 truncate mr-2 font-medium text-slate-700" title={u.name}>{u.name}</span>
                     )}
                     
                     {editingUnitId !== u.id && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EditButton onClick={() => { setEditingUnitId(u.id); setEditUnitNameVal(u.name); }} />
                          <button onClick={() => updateClasses(classes.map(c => c.id === selClassUnit ? {...c, subjects: c.subjects.map(s => s.id === selSubUnit ? {...s, units: s.units.filter(unit => unit.id !== u.id)} : s)} : c))} className="text-red-300 hover:text-red-500 p-1">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                       </div>
                     )}
                   </div>
                 ))}
                 {activeUnitsForSub.length === 0 && <div className="text-xs text-slate-400 italic text-center py-2">No units added yet</div>}
               </div>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${selUnitSub ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-50'}`}>
               <h3 className="font-bold text-slate-800 mb-3">Add Subunit (Topic)</h3>
               <div className="flex gap-2 mb-4">
                 <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="Topic Name" value={newSubUnitName} onChange={e => setNewSubUnitName(e.target.value)} disabled={!selUnitSub} />
                 <button onClick={addSubUnit} disabled={!selUnitSub} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
               </div>
               <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                 {activeUnitsForSub.find(u => u.id === selUnitSub)?.subUnits.map(sub => (
                   <div key={sub.id} className="text-sm p-2 bg-indigo-50 rounded border border-indigo-100 flex justify-between items-center group hover:border-indigo-300 transition-colors">
                     {editingSubUnitId === sub.id ? (
                        <div className="flex gap-1 flex-1 mr-2 items-center">
                            <input 
                                className="w-full p-1 border border-indigo-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editSubUnitNameVal}
                                onChange={(e) => setEditSubUnitNameVal(e.target.value)}
                                autoFocus
                            />
                            <EditControls onSave={() => saveSubUnitName(sub.id)} onCancel={() => setEditingSubUnitId(null)} />
                        </div>
                     ) : (
                        <span className="flex-1 truncate mr-2 font-medium text-indigo-900" title={sub.name}>{sub.name}</span>
                     )}

                     {editingSubUnitId !== sub.id && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EditButton onClick={() => { setEditingSubUnitId(sub.id); setEditSubUnitNameVal(sub.name); }} />
                          <button onClick={() => {
                            const unitId = selUnitSub;
                            updateClasses(classes.map(c => c.id === selClassUnit ? {
                                ...c,
                                subjects: c.subjects.map(s => s.id === selSubUnit ? {
                                    ...s,
                                    units: s.units.map(u => u.id === unitId ? {
                                        ...u,
                                        subUnits: u.subUnits.filter(su => su.id !== sub.id)
                                    } : u)
                                } : s)
                            } : c));
                          }} className="text-red-300 hover:text-red-500 p-1">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                       </div>
                     )}
                   </div>
                 ))}
                 {(!activeUnitsForSub.find(u => u.id === selUnitSub)?.subUnits.length) && <div className="text-xs text-slate-400 italic text-center py-2">No subunits added</div>}
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
                     <div key={l.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg group">
                       {editingCogId === l.id ? (
                          <div className="w-full space-y-2">
                             <input className="w-full p-1 border rounded text-xs font-bold" value={editCogNameVal} onChange={e => setEditCogNameVal(e.target.value)} />
                             <input className="w-full p-1 border rounded text-xs" value={editCogDescVal} onChange={e => setEditCogDescVal(e.target.value)} />
                             <div className="flex justify-end gap-2">
                                <button onClick={() => saveCognitive(l.id)} className="text-green-600 text-xs font-bold">Save</button>
                                <button onClick={() => setEditingCogId(null)} className="text-slate-500 text-xs">Cancel</button>
                             </div>
                          </div>
                       ) : (
                          <div className="flex-1">
                             <span className="font-bold text-blue-700 block">{l.name}</span>
                             <span className="text-xs text-slate-500">{l.description}</span>
                          </div>
                       )}

                       {editingCogId !== l.id && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <EditButton onClick={() => { setEditingCogId(l.id); setEditCogNameVal(l.name); setEditCogDescVal(l.description); }} />
                             <DeleteButton onClick={() => updateLevels(levels.filter(lvl => lvl.id !== l.id))} />
                          </div>
                       )}
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
                     <div key={d.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg group">
                       {editingDiffId === d.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input className="flex-1 p-1 border rounded text-sm" value={editDiffNameVal} onChange={e => setEditDiffNameVal(e.target.value)} />
                            <EditControls onSave={() => saveDifficulty(d.id)} onCancel={() => setEditingDiffId(null)} />
                          </div>
                       ) : (
                          <span className="font-bold text-purple-700">{d.name}</span>
                       )}

                       {editingDiffId !== d.id && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <EditButton onClick={() => { setEditingDiffId(d.id); setEditDiffNameVal(d.name); }} />
                             <DeleteButton onClick={() => updateDifficulty(difficultyLevels.filter(diff => diff.id !== d.id))} />
                          </div>
                       )}
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
