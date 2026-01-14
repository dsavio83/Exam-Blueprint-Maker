
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

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    updateClasses([...classes, { id: `c_${Date.now()}`, name: newClassName.trim(), subjects: [] }]);
    setNewClassName('');
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
    updatePaperTypes([...paperTypes, { id: `pt_${Date.now()}`, name: newPaperTypeName, questionTypes: [] }]);
    setNewPaperTypeName('');
  };

  const handleAddQuestionType = (ptId: string) => {
    updatePaperTypes(paperTypes.map(pt => pt.id === ptId ? {
      ...pt, 
      questionTypes: [...pt.questionTypes, { id: `qt_${Date.now()}`, marks: newMarkValue, maxQuestions: newMaxQuestions }]
    } : pt));
  };

  const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-12">
      <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">{title}</h2>
      <p className="text-slate-500 font-medium text-lg">{desc}</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      
      {view === 'class-subject' && (
        <div className="bg-white p-6 md:p-12 rounded-[4rem] border border-slate-100 shadow-xl">
          <SectionHeader title="Academic Infrastructure" desc="Configure institutional hierarchy and subject groupings." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <label className="text-xs font-black uppercase text-indigo-600 tracking-widest px-2">Institutional Grades</label>
              <div className="flex gap-4 p-3 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                <input className="flex-1 px-6 py-4 rounded-[1.8rem] bg-white font-black text-lg outline-none shadow-sm focus:ring-2 focus:ring-indigo-600" placeholder="e.g. Class IX" value={newClassName} onChange={e => setNewClassName(e.target.value)}/>
                <button onClick={handleAddClass} className="bg-indigo-600 text-white px-8 rounded-[1.8rem] font-black shadow-xl">Add</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {classes.map(c => (
                  <div key={c.id} className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex justify-between items-center ${selectedClassId === c.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'}`} onClick={() => setSelectedClassId(c.id)}>
                    <span className="font-black text-slate-800 text-lg">{c.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{c.subjects.length} Subjects</span>
                      <div className={`w-3 h-3 rounded-full ${selectedClassId === c.id ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-8">
              <label className="text-xs font-black uppercase text-indigo-600 tracking-widest px-2">Assigned Subjects</label>
              <div className="flex gap-4 p-3 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                <input className="flex-1 px-6 py-4 rounded-[1.8rem] bg-white font-black text-lg outline-none shadow-sm focus:ring-2 focus:ring-emerald-600" placeholder="e.g. Tamil AT" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} disabled={!selectedClassId}/>
                <button onClick={handleAddSubject} className="bg-emerald-600 text-white px-8 rounded-[1.8rem] font-black shadow-xl" disabled={!selectedClassId}>Add</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {classes.find(c => c.id === selectedClassId)?.subjects.map(s => (
                  <div key={s.id} className="p-6 rounded-[2.5rem] border border-slate-100 bg-white flex justify-between items-center shadow-sm">
                    <span className="font-black text-slate-700 uppercase tracking-tight">{s.name}</span>
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full">{s.units.length} Units</span>
                  </div>
                ))}
                {!selectedClassId && <div className="p-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem] text-slate-300 font-black uppercase tracking-widest">Select a class</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'unit-subunit' && (
        <div className="bg-white p-6 md:p-12 rounded-[4rem] border border-slate-100 shadow-xl">
          <SectionHeader title="Unit & Topic Architecture" desc="Manage chapters, subunits, and specific learning objectives." />
          <div className="flex flex-col md:flex-row gap-6 mb-16 bg-slate-50 p-4 rounded-[3rem] border border-slate-200">
            <select className="flex-1 p-5 rounded-[2rem] bg-white font-black outline-none border border-slate-200 shadow-sm" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">Select Grade</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="flex-1 p-5 rounded-[2rem] bg-white font-black outline-none border border-slate-200 shadow-sm" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId}>
              <option value="">Select Subject</option>
              {classes.find(c => c.id === selectedClassId)?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {selectedSubjectId ? (
            <div className="space-y-12">
               <div className="bg-indigo-50 p-10 rounded-[4rem] border border-indigo-100">
                  <h4 className="font-black text-indigo-600 uppercase text-xs mb-6 tracking-widest">Create New Chapter / Unit</h4>
                  <div className="flex gap-4">
                    <input className="flex-1 p-6 rounded-[2rem] bg-white font-black text-xl outline-none shadow-sm focus:ring-4 focus:ring-indigo-100 border border-indigo-100" placeholder="Unit Name..." value={newUnitName} onChange={e => setNewUnitName(e.target.value)}/>
                    <button onClick={handleAddUnit} className="bg-indigo-600 text-white px-12 rounded-[2rem] font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Commit</button>
                  </div>
               </div>
               
               <div className="space-y-12">
                  {classes.find(c => c.id === selectedClassId)?.subjects.find(s => s.id === selectedSubjectId)?.units.map(u => (
                    <div key={u.id} className="p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10 bg-white hover:border-indigo-100 transition-all">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-50 pb-8">
                        <h4 className="font-black text-3xl text-slate-900 uppercase tracking-tight">{u.name}</h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.subUnits.length} Topics</span>
                      </div>
                      
                      <div className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-[3rem] space-y-6 border border-slate-100">
                           <div className="flex gap-4">
                             <input className="flex-1 p-5 rounded-2xl bg-white font-black text-lg outline-none border border-slate-100 shadow-sm" placeholder="Sub-topic Label..." value={newSubUnitName} onChange={e => setNewSubUnitName(e.target.value)}/>
                             <button onClick={() => handleAddSubUnit(u.id)} className="bg-slate-900 text-white px-10 rounded-2xl font-black text-xs uppercase tracking-widest">Add Label</button>
                           </div>
                           <textarea className="w-full p-5 text-sm font-medium rounded-2xl bg-white outline-none border border-slate-100 shadow-sm custom-scrollbar" placeholder="Enter Detailed Learning Objective..." rows={3} value={newObjective} onChange={e => setNewObjective(e.target.value)}/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {u.subUnits.map(sub => (
                            <div key={sub.id} className="p-8 rounded-[3rem] border border-slate-50 bg-slate-50/50 flex flex-col justify-between hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                              <div className="font-black text-indigo-700 text-lg mb-3 tracking-tight">{sub.name}</div>
                              <div className="text-[11px] font-medium text-slate-500 italic leading-relaxed">{sub.learningObjective}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="py-40 text-center border-4 border-dashed border-slate-100 rounded-[4rem] text-slate-300 font-black text-3xl uppercase tracking-widest">
               Select Subject to Architect Units
            </div>
          )}
        </div>
      )}

      {view === 'paper-types' && (
        <div className="bg-white p-6 md:p-12 rounded-[4rem] border border-slate-100 shadow-xl">
           <SectionHeader title="Assessment Templates" desc="Global patterns used to enforce uniform marks distribution." />
           <div className="space-y-12">
              <div className="flex gap-4 p-5 bg-slate-50 rounded-[3rem] border border-slate-200">
                <input className="flex-1 px-8 py-5 rounded-[2.2rem] bg-white font-black text-xl outline-none shadow-sm focus:ring-4 focus:ring-indigo-100 border border-indigo-100" placeholder="e.g. Summative - 100 Marks" value={newPaperTypeName} onChange={e => setNewPaperTypeName(e.target.value)}/>
                <button onClick={handleAddPaperType} className="bg-indigo-600 text-white px-12 rounded-[2.2rem] font-black shadow-xl">Create</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {paperTypes.map(pt => (
                   <div key={pt.id} className="p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8 bg-white hover:shadow-2xl transition-all group">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                         <h4 className="font-black text-2xl text-slate-900 uppercase tracking-tight">{pt.name}</h4>
                         <span className="text-xs font-black text-indigo-600">{pt.questionTypes.length} Slots</span>
                      </div>
                      <div className="space-y-6">
                         <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-[2.5rem]">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase text-slate-400 px-4">Marks</label>
                               <input type="number" className="w-full p-4 rounded-2xl bg-white font-black text-lg outline-none" value={newMarkValue} onChange={e => setNewMarkValue(Number(e.target.value))}/>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase text-slate-400 px-4">Count</label>
                               <input type="number" className="w-full p-4 rounded-2xl bg-white font-black text-lg outline-none" value={newMaxQuestions} onChange={e => setNewMaxQuestions(Number(e.target.value))}/>
                            </div>
                            <button onClick={() => handleAddQuestionType(pt.id)} className="col-span-2 bg-slate-900 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all">Add Category</button>
                         </div>
                         <div className="space-y-3">
                           {pt.questionTypes.map(qt => (
                             <div key={qt.id} className="flex justify-between items-center p-5 bg-indigo-50/30 rounded-3xl border border-indigo-50 font-black text-sm">
                                <div className="flex flex-col">
                                   <span className="text-[10px] text-slate-400 uppercase tracking-widest">Configuration</span>
                                   <span className="text-indigo-900">{qt.maxQuestions} Items &times; {qt.marks} Marks</span>
                                </div>
                                <div className="bg-indigo-600 text-white px-5 py-2 rounded-2xl text-lg shadow-lg">
                                   {qt.marks * qt.maxQuestions}M
                                </div>
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
        <div className="bg-white p-6 md:p-12 rounded-[4rem] border border-slate-100 shadow-xl space-y-16">
           <SectionHeader title="Taxonomy Standards" desc="Non-mutable reference standards used for generating institutional matrix." />
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="p-10 bg-indigo-50/40 rounded-[4rem] border border-indigo-50 space-y-8">
                <h4 className="font-black text-indigo-600 uppercase tracking-widest text-xs border-b border-indigo-100 pb-4">Cognitive Flow (CP)</h4>
                <div className="space-y-3">
                   {COGNITIVE_PROCESSES.map(cp => (
                     <div key={cp.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <span className="bg-indigo-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0">{cp.code.slice(-1)}</span>
                        <span className="font-black text-slate-700 text-sm tracking-tight">{cp.name}</span>
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="p-10 bg-emerald-50/40 rounded-[4rem] border border-emerald-50 space-y-8">
                <h4 className="font-black text-emerald-600 uppercase tracking-widest text-xs border-b border-emerald-100 pb-4">Knowledge Tiers</h4>
                <div className="space-y-3">
                   {KNOWLEDGE_LEVELS.map(kl => (
                     <div key={kl.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <span className="bg-emerald-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0">{kl.code}</span>
                        <span className="font-black text-slate-700 text-sm tracking-tight">{kl.name}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-10 bg-orange-50/40 rounded-[4rem] border border-orange-50 space-y-8">
                <h4 className="font-black text-orange-600 uppercase tracking-widest text-xs border-b border-orange-100 pb-4">Matrix Formats</h4>
                <div className="space-y-3">
                   {ITEM_FORMATS.map(f => (
                     <div key={f.id} className="flex flex-col gap-1 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center">
                           <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{f.type} Group</span>
                           <span className="bg-orange-600 text-white px-4 py-1 rounded-full font-black text-[10px]">{f.code}</span>
                        </div>
                        <span className="font-black text-slate-800 text-sm tracking-tight mt-2">{f.name}</span>
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
