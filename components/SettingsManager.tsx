
import React, { useState } from 'react';
import { ClassGrade, CognitiveLevel, DifficultyLevel, PaperType, QuestionType, ItemFormat } from '../types';
import { ITEM_FORMATS, COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS } from '../constants';

interface SettingsManagerProps {
  view: 'paper-types' | 'class-subject' | 'unit-subunit' | 'taxonomy';
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
  
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [newUnitName, setNewUnitName] = useState('');
  const [newSubUnitName, setNewSubUnitName] = useState('');
  const [newObjective, setNewObjective] = useState('');

  const [newPaperTypeName, setNewPaperTypeName] = useState('');
  const [newMarkValue, setNewMarkValue] = useState(1);
  const [newMaxQuestions, setNewMaxQuestions] = useState(1);

  // CRUD Actions
  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    updateClasses([...classes, { id: `c_${Date.now()}`, name: newClassName.trim(), subjects: [] }]);
    setNewClassName('');
  };

  const handleDeleteClass = (id: string) => {
    if (confirm("Delete this class?")) updateClasses(classes.filter(c => c.id !== id));
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim() || !selectedClassId) return;
    updateClasses(classes.map(c => c.id === selectedClassId ? {
      ...c, subjects: [...c.subjects, { id: `s_${Date.now()}`, name: newSubjectName.trim(), units: [] }]
    } : c));
    setNewSubjectName('');
  };

  const handleDeleteSubject = (sId: string) => {
    if (confirm("Delete this subject?")) {
      updateClasses(classes.map(c => c.id === selectedClassId ? {
        ...c, subjects: c.subjects.filter(s => s.id !== sId)
      } : c));
    }
  };

  const handleAddUnit = () => {
    if (!newUnitName.trim() || !selectedClassId || !selectedSubjectId) return;
    updateClasses(classes.map(c => c.id === selectedClassId ? {
      ...c, subjects: c.subjects.map(s => s.id === selectedSubjectId ? {
        ...s, units: [...s.units, { id: `u_${Date.now()}`, name: newUnitName.trim(), subUnits: [] }]
      } : s)
    } : c));
    setNewUnitName('');
  };

  const handleAddSubUnit = (unitId: string) => {
    if (!newSubUnitName.trim()) return;
    updateClasses(classes.map(c => c.id === selectedClassId ? {
      ...c, subjects: c.subjects.map(s => s.id === selectedSubjectId ? {
        ...s, units: s.units.map(u => u.id === unitId ? {
          ...u, subUnits: [...u.subUnits, { id: `sub_${Date.now()}`, name: newSubUnitName.trim(), learningObjective: newObjective || 'General Objective' }]
        } : u)
      } : s)
    } : c));
    setNewSubUnitName('');
    setNewObjective('');
  };

  const handleAddPaperType = () => {
    if (!newPaperTypeName.trim()) return;
    updatePaperTypes([...paperTypes, { id: `pt_${Date.now()}`, name: newPaperTypeName, questionTypes: [] }]);
    setNewPaperTypeName('');
  };

  const handleDeletePaperType = (id: string) => {
    if (confirm("Delete this template?")) updatePaperTypes(paperTypes.filter(p => p.id !== id));
  };

  const handleAddQuestionType = (ptId: string) => {
    updatePaperTypes(paperTypes.map(pt => pt.id === ptId ? {
      ...pt, 
      questionTypes: [...pt.questionTypes, { id: `qt_${Date.now()}`, marks: newMarkValue, maxQuestions: newMaxQuestions }]
    } : pt));
  };

  const handleDeleteQuestionType = (ptId: string, qtId: string) => {
    updatePaperTypes(paperTypes.map(pt => pt.id === ptId ? {
      ...pt, 
      questionTypes: pt.questionTypes.filter(q => q.id !== qtId)
    } : pt));
  };

  return (
    <div className="space-y-12 animate-in max-w-5xl mx-auto">
      {view === 'class-subject' && (
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl">
           <h2 className="text-3xl font-black mb-8 text-slate-900 border-l-8 border-indigo-600 pl-6 uppercase tracking-widest">Grades & Curriculum</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-6">
                <label className="text-xs font-black uppercase text-indigo-600 tracking-widest px-2">Academic Grades</label>
                <div className="flex gap-2">
                   <input className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. Class IX" value={newClassName} onChange={e => setNewClassName(e.target.value)}/>
                   <button onClick={handleAddClass} className="bg-indigo-600 text-white px-6 rounded-2xl font-black">Add</button>
                </div>
                <div className="space-y-2">
                   {classes.map(c => (
                     <div key={c.id} onClick={() => setSelectedClassId(c.id)} className={`p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer transition-all ${selectedClassId === c.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="text-slate-300 hover:text-rose-500 p-1">&times;</button>
                     </div>
                   ))}
                </div>
             </div>
             <div className="space-y-6">
                <label className="text-xs font-black uppercase text-emerald-600 tracking-widest px-2">Assigned Subjects</label>
                <div className="flex gap-2">
                   <input className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-600" placeholder="e.g. Tamil AT" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} disabled={!selectedClassId}/>
                   <button onClick={handleAddSubject} className="bg-emerald-600 text-white px-6 rounded-2xl font-black disabled:opacity-30">Add</button>
                </div>
                <div className="space-y-2">
                   {classes.find(c => c.id === selectedClassId)?.subjects.map(s => (
                     <div key={s.id} className="p-4 rounded-xl border border-slate-100 bg-white flex justify-between items-center shadow-sm">
                        <span className="font-bold text-slate-700 uppercase">{s.name}</span>
                        <button onClick={() => handleDeleteSubject(s.id)} className="text-slate-300 hover:text-rose-500 font-black">&times;</button>
                     </div>
                   ))}
                   {!selectedClassId && <div className="text-center py-10 text-slate-400 font-bold italic">Select a grade to see subjects</div>}
                </div>
             </div>
           </div>
        </div>
      )}

      {view === 'unit-subunit' && (
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
           <h2 className="text-3xl font-black text-slate-900 border-l-8 border-indigo-600 pl-6 uppercase tracking-widest">Unit Architecture</h2>
           <div className="flex flex-col md:flex-row gap-4 no-print">
              <select className="flex-1 p-4 rounded-2xl bg-slate-50 font-bold border-none shadow-sm" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                 <option value="">Select Grade</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="flex-1 p-4 rounded-2xl bg-slate-50 font-bold border-none shadow-sm" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId}>
                 <option value="">Select Subject</option>
                 {classes.find(c => c.id === selectedClassId)?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>
           
           {selectedSubjectId ? (
             <div className="space-y-10">
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex gap-4">
                   <input className="flex-1 p-4 rounded-2xl bg-white font-bold outline-none shadow-sm" placeholder="New Unit Name..." value={newUnitName} onChange={e => setNewUnitName(e.target.value)}/>
                   <button onClick={handleAddUnit} className="bg-indigo-600 text-white px-10 rounded-2xl font-black">Create Unit</button>
                </div>
                {classes.find(c => c.id === selectedClassId)?.subjects.find(s => s.id === selectedSubjectId)?.units.map(u => (
                  <div key={u.id} className="p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
                     <h4 className="font-black text-xl text-indigo-700 uppercase">{u.name}</h4>
                     <div className="space-y-4">
                        <div className="flex gap-2">
                           <input className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold" placeholder="Topic Label..." value={newSubUnitName} onChange={e => setNewSubUnitName(e.target.value)}/>
                           <button onClick={() => handleAddSubUnit(u.id)} className="bg-slate-900 text-white px-6 rounded-xl text-xs font-black">Add Topic</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {u.subUnits.map(sub => (
                             <div key={sub.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                <span className="font-bold text-slate-800">{sub.name}</span>
                                <p className="text-[10px] text-slate-400 mt-1 italic">{sub.learningObjective}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="py-20 text-center text-slate-300 font-black uppercase text-xl border-4 border-dashed rounded-[3rem]">Selection Required</div>
           )}
        </div>
      )}

      {view === 'paper-types' && (
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-12">
           <h2 className="text-3xl font-black text-slate-900 border-l-8 border-indigo-600 pl-6 uppercase tracking-widest">Paper Patterns</h2>
           <div className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
             <input className="flex-1 p-4 rounded-2xl bg-white font-bold outline-none shadow-sm" placeholder="Template Name (e.g. Quarterly)" value={newPaperTypeName} onChange={e => setNewPaperTypeName(e.target.value)}/>
             <button onClick={handleAddPaperType} className="bg-indigo-600 text-white px-10 rounded-2xl font-black shadow-lg">Create</button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {paperTypes.map(pt => (
                <div key={pt.id} className="p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm space-y-6 relative group">
                   <button onClick={() => handleDeletePaperType(pt.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity font-black text-xl">&times;</button>
                   <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight">{pt.name}</h4>
                   <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Marks</label>
                            <input type="number" className="w-full p-3 rounded-xl bg-white border border-slate-100 font-bold" value={newMarkValue} onChange={e => setNewMarkValue(Number(e.target.value))}/>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Count</label>
                            <input type="number" className="w-full p-3 rounded-xl bg-white border border-slate-100 font-bold" value={newMaxQuestions} onChange={e => setNewMaxQuestions(Number(e.target.value))}/>
                         </div>
                      </div>
                      <button onClick={() => handleAddQuestionType(pt.id)} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-95 transition-all">Add Category</button>
                   </div>
                   <div className="space-y-2">
                      {pt.questionTypes.map(qt => (
                        <div key={qt.id} className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-xl border border-indigo-50">
                           <span className="font-bold text-xs text-indigo-900">{qt.maxQuestions} Slots &times; {qt.marks} Marks</span>
                           <button onClick={() => handleDeleteQuestionType(pt.id, qt.id)} className="text-slate-400 hover:text-rose-600">&times;</button>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManager;
