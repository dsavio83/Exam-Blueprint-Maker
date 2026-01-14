
import React, { useState } from 'react';
import { ClassGrade, CognitiveLevel, DifficultyLevel, PaperType, QuestionType, SubUnit } from '../types';

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
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newSubUnitName, setNewSubUnitName] = useState('');
  const [newObjective, setNewObjective] = useState('');

  // --- HANDLERS ---
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

  const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-10">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium">{desc}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      
      {view === 'class-subject' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <SectionHeader title="Classes & Subjects" desc="Configure your institution's academic structure." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex gap-3">
                <input className="flex-1 p-4 border rounded-2xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-600 border-transparent transition-all" placeholder="Enter Class Name (e.g. Class XII)" value={newClassName} onChange={e => setNewClassName(e.target.value)}/>
                <button onClick={handleAddClass} className="bg-slate-900 text-white px-6 rounded-2xl font-black shadow-lg">Add</button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {classes.map(c => (
                  <div key={c.id} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedClassId === c.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-200'}`} onClick={() => setSelectedClassId(c.id)}>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    {selectedClassId === c.id && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-3">
                <input className="flex-1 p-4 border rounded-2xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-emerald-600 border-transparent transition-all" placeholder="Enter Subject Name" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} disabled={!selectedClassId}/>
                <button onClick={handleAddSubject} className="bg-emerald-600 text-white px-6 rounded-2xl font-black shadow-lg" disabled={!selectedClassId}>Add</button>
              </div>
              <div className="space-y-3">
                {classes.find(c => c.id === selectedClassId)?.subjects.map(s => (
                  <div key={s.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex justify-between items-center group">
                    <span className="font-bold text-slate-700">{s.name}</span>
                    <button className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                  </div>
                ))}
                {!selectedClassId && <div className="p-10 text-center text-slate-400 italic font-medium">Select a class on the left to manage its subjects.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'unit-subunit' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <SectionHeader title="Unit Hierarchy & Objectives" desc="Define chapters, topics, and specific learning outcomes." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <select className="p-4 border rounded-2xl bg-slate-50 font-bold outline-none border-transparent" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="p-4 border rounded-2xl bg-slate-50 font-bold outline-none border-transparent" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId}>
              <option value="">Select Subject</option>
              {classes.find(c => c.id === selectedClassId)?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-8">
             <div className="flex gap-4">
                <input className="flex-1 p-4 border rounded-2xl bg-slate-50 font-bold outline-none" placeholder="Add New Unit / Chapter Name" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} disabled={!selectedSubjectId}/>
                <button onClick={handleAddUnit} className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-lg shadow-indigo-600/20" disabled={!selectedSubjectId}>+ Unit</button>
             </div>
             
             <div className="grid grid-cols-1 gap-6">
                {classes.find(c => c.id === selectedClassId)?.subjects.find(s => s.id === selectedSubjectId)?.units.map(u => (
                  <div key={u.id} className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-black text-indigo-700 text-xl tracking-tight uppercase">{u.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.subUnits.length} Sub-topics</span>
                    </div>
                    <div className="space-y-4">
                       <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <input className="w-full p-2 border-b font-bold text-sm outline-none border-slate-100" placeholder="New Sub-topic Name" value={newSubUnitName} onChange={e => setNewSubUnitName(e.target.value)}/>
                          <textarea className="w-full p-2 text-xs font-medium bg-slate-50 rounded-xl outline-none" placeholder="Describe Learning Objective / Competency..." rows={2} value={newObjective} onChange={e => setNewObjective(e.target.value)}/>
                          <button onClick={() => handleAddSubUnit(u.id)} className="ml-auto bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Add Discourse</button>
                       </div>
                       <div className="space-y-2">
                         {u.subUnits.map(sub => (
                           <div key={sub.id} className="flex justify-between items-start p-3 bg-white rounded-xl border border-slate-100 text-sm group">
                             <div>
                               <div className="font-bold text-slate-800">{sub.name}</div>
                               <div className="text-[10px] text-slate-500 italic mt-1">{sub.learningObjective}</div>
                             </div>
                             <button className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
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
         <div className="p-10 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-xl">
            <SectionHeader title="Taxonomy & Knowledge Levels" desc="Cognitive processes and Depth of Knowledge definitions." />
            <p className="text-slate-400 italic">The CP1-CP7 and B/A/P frameworks are hardcoded to match the official Analysis Proforma standards shown in your documentation.</p>
         </div>
      )}
      
      {view === 'paper-types' && (
         <div className="p-10 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-xl">
            <SectionHeader title="Question Paper Patterns" desc="Define mark distributions and item quantities." />
            <p className="text-slate-400 italic">Configure standard exam patterns like Half-yearly or Annual here.</p>
         </div>
      )}

    </div>
  );
};

export default SettingsManager;
