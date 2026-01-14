
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
  
  // --- STATE FOR ADMIN ACTIONS ---
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

  // --- HANDLERS ---
  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    updateClasses([...classes, { id: `c_${Date.now()}`, name: newClassName.trim(), subjects: [] }]);
    setNewClassName('');
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm("Delete this class?")) {
      updateClasses(classes.filter(c => c.id !== id));
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim() || !selectedClassId) return;
    updateClasses(classes.map(c => c.id === selectedClassId ? {
      ...c, subjects: [...c.subjects, { id: `s_${Date.now()}`, name: newSubjectName.trim(), units: [] }]
    } : c));
    setNewSubjectName('');
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
    if (!newSubUnitName.trim() || !selectedClassId || !selectedSubjectId) return;
    updateClasses(classes.map(c => c.id === selectedClassId ? {
      ...c, subjects: c.subjects.map(s => s.id === selectedSubjectId ? {
        ...s, units: s.units.map(u => u.id === unitId ? {
          ...u, subUnits: [...u.subUnits, { id: `sub_${Date.now()}`, name: newSubUnitName.trim(), learningObjective: newObjective }]
        } : u)
      } : s)
    } : c));
    setNewSubUnitName('');
    setNewObjective('');
  };

  const handleAddPaperType = () => {
    if (!newPaperTypeName.trim()) return;
    const newPT: PaperType = {
      id: `pt_${Date.now()}`,
      name: newPaperTypeName,
      questionTypes: []
    };
    updatePaperTypes([...paperTypes, newPT]);
    setNewPaperTypeName('');
  };

  const handleAddQuestionType = (ptId: string) => {
    updatePaperTypes(paperTypes.map(pt => pt.id === ptId ? {
      ...pt, 
      questionTypes: [...pt.questionTypes, { id: `qt_${Date.now()}`, marks: newMarkValue, maxQuestions: newMaxQuestions }]
    } : pt));
  };

  const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-10">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium">{desc}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      
      {view === 'class-subject' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <SectionHeader title="Class & Subject Management" desc="Configure classes and the subjects they contain." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <label className="text-xs font-black uppercase text-indigo-600 tracking-widest">Classes</label>
              <div className="flex gap-3">
                <input className="flex-1 p-4 border rounded-2xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-600 border-slate-200 transition-all" placeholder="Enter Class (e.g. Class IX)" value={newClassName} onChange={e => setNewClassName(e.target.value)}/>
                <button onClick={handleAddClass} className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-lg">Add</button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {classes.map(c => (
                  <div key={c.id} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedClassId === c.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`} onClick={() => setSelectedClassId(c.id)}>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <label className="text-xs font-black uppercase text-indigo-600 tracking-widest">Subjects for Selected Class</label>
              <div className="flex gap-3">
                <input className="flex-1 p-4 border rounded-2xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-emerald-600 border-slate-200 transition-all" placeholder="Enter Subject" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} disabled={!selectedClassId}/>
                <button onClick={handleAddSubject} className="bg-emerald-600 text-white px-8 rounded-2xl font-black shadow-lg" disabled={!selectedClassId}>Add</button>
              </div>
              <div className="space-y-3">
                {classes.find(c => c.id === selectedClassId)?.subjects.map(s => (
                  <div key={s.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <span className="font-bold text-slate-700">{s.name}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400">{s.units.length} Units</span>
                  </div>
                ))}
                {!selectedClassId && <div className="p-12 text-center text-slate-400 italic">Select a class to add subjects.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'unit-subunit' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <SectionHeader title="Units & Learning Objectives" desc="Manage chapters and topics for specific subjects." />
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <select className="flex-1 p-4 border rounded-2xl bg-slate-50 font-black outline-none border-slate-200" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="flex-1 p-4 border rounded-2xl bg-slate-50 font-black outline-none border-slate-200" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId}>
              <option value="">Select Subject</option>
              {classes.find(c => c.id === selectedClassId)?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {selectedSubjectId ? (
            <div className="space-y-8">
               <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-300">
                  <h4 className="font-black text-slate-400 uppercase text-xs mb-4 tracking-widest">Add New Unit</h4>
                  <div className="flex gap-4">
                    <input className="flex-1 p-4 border rounded-2xl bg-white font-bold outline-none" placeholder="Chapter Name" value={newUnitName} onChange={e => setNewUnitName(e.target.value)}/>
                    <button onClick={handleAddUnit} className="bg-indigo-600 text-white px-8 rounded-2xl font-black">Add Unit</button>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 gap-8">
                  {classes.find(c => c.id === selectedClassId)?.subjects.find(s => s.id === selectedSubjectId)?.units.map(u => (
                    <div key={u.id} className="p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-6 bg-white">
                      <div className="flex justify-between items-center border-b pb-4">
                        <h4 className="font-black text-2xl text-slate-800 uppercase tracking-tight">{u.name}</h4>
                        <button className="text-red-400 hover:text-red-600 text-xs font-bold">Remove Unit</button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-indigo-50 p-5 rounded-2xl space-y-3">
                           <div className="flex gap-3">
                             <input className="flex-1 p-3 border rounded-xl bg-white font-bold text-sm outline-none" placeholder="Sub-topic / Discourse" value={newSubUnitName} onChange={e => setNewSubUnitName(e.target.value)}/>
                             <button onClick={() => handleAddSubUnit(u.id)} className="bg-slate-800 text-white px-5 rounded-xl font-bold text-xs uppercase">+ Add</button>
                           </div>
                           <textarea className="w-full p-3 text-xs border rounded-xl bg-white outline-none" placeholder="Learning Objective (Enter text shown in report screenshot...)" rows={2} value={newObjective} onChange={e => setNewObjective(e.target.value)}/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {u.subUnits.map(sub => (
                            <div key={sub.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between group">
                              <div className="font-black text-indigo-600 text-sm mb-1">{sub.name}</div>
                              <div className="text-[10px] text-slate-500 italic line-clamp-2">{sub.learningObjective}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="p-20 text-center border-4 border-dashed border-slate-100 rounded-3xl text-slate-300 font-black text-2xl uppercase italic">
               Select subject to manage units
            </div>
          )}
        </div>
      )}

      {view === 'paper-types' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
           <SectionHeader title="Question Paper Patterns" desc="Define global templates for marks distribution." />
           <div className="space-y-8">
              <div className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <input className="flex-1 p-4 border rounded-2xl font-bold outline-none" placeholder="Pattern Name (e.g. Summative-40 Marks)" value={newPaperTypeName} onChange={e => setNewPaperTypeName(e.target.value)}/>
                <button onClick={handleAddPaperType} className="bg-indigo-600 text-white px-8 rounded-2xl font-black">Create Pattern</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {paperTypes.map(pt => (
                   <div key={pt.id} className="p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                         <h4 className="font-black text-xl text-slate-800 uppercase">{pt.name}</h4>
                         <button className="text-red-400 text-xs font-bold">Delete Pattern</button>
                      </div>
                      <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-2">
                            <input type="number" className="p-2 border rounded-xl text-xs font-bold" placeholder="Marks" value={newMarkValue} onChange={e => setNewMarkValue(Number(e.target.value))}/>
                            <input type="number" className="p-2 border rounded-xl text-xs font-bold" placeholder="Total Qs" value={newMaxQuestions} onChange={e => setNewMaxQuestions(Number(e.target.value))}/>
                            <button onClick={() => handleAddQuestionType(pt.id)} className="col-span-2 bg-slate-900 text-white p-2 rounded-xl text-[10px] font-black uppercase tracking-widest">+ Add Mark Category</button>
                         </div>
                         <div className="space-y-2">
                           {pt.questionTypes.map(qt => (
                             <div key={qt.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs">
                                <span>{qt.maxQuestions} Items</span>
                                <span>×</span>
                                <span>{qt.marks} Marks</span>
                                <span className="text-indigo-600">= {qt.marks * qt.maxQuestions} Marks</span>
                             </div>
                           ))}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {view === 'taxonomy' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-12">
           <SectionHeader title="Taxonomy & Standards" desc="The fixed standards used for generating official analysis proformas." />
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <h4 className="font-black text-indigo-600 uppercase tracking-widest text-xs border-b pb-2">Cognitive Processes</h4>
                <div className="space-y-2">
                   {COGNITIVE_PROCESSES.map(cp => (
                     <div key={cp.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="font-black text-slate-400">{cp.code}</span>
                        <span className="font-bold text-slate-700">{cp.name}</span>
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <h4 className="font-black text-emerald-600 uppercase tracking-widest text-xs border-b pb-2">Knowledge Levels</h4>
                <div className="space-y-2">
                   {KNOWLEDGE_LEVELS.map(kl => (
                     <div key={kl.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="font-black text-slate-400">{kl.code}</span>
                        <span className="font-bold text-slate-700">{kl.name}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <h4 className="font-black text-orange-600 uppercase tracking-widest text-xs border-b pb-2">Item Formats</h4>
                <div className="space-y-2">
                   {ITEM_FORMATS.map(f => (
                     <div key={f.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 text-[10px]">
                        <span className="font-black text-slate-400">{f.code} ({f.abbreviation})</span>
                        <span className="font-bold text-slate-700 text-right">{f.name}</span>
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
