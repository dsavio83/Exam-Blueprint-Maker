
import React, { useState, useEffect } from 'react';
import { ClassGrade, BlueprintEntry, Unit, SubUnit, CognitiveLevel, QuestionType } from '../types';

interface AdminPanelProps {
  classes: ClassGrade[];
  setClasses: React.Dispatch<React.SetStateAction<ClassGrade[]>>;
  selectedClassId: string;
  selectedSubjectId: string;
  blueprintEntries: BlueprintEntry[];
  setBlueprintEntries: React.Dispatch<React.SetStateAction<BlueprintEntry[]>>;
  savedBlueprints: Record<string, BlueprintEntry[]>;
  cognitiveLevels: CognitiveLevel[];
  setCognitiveLevels: React.Dispatch<React.SetStateAction<CognitiveLevel[]>>;
  questionTypes: QuestionType[];
  setQuestionTypes: React.Dispatch<React.SetStateAction<QuestionType[]>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  classes, 
  setClasses, 
  selectedClassId, 
  selectedSubjectId, 
  blueprintEntries, 
  setBlueprintEntries, 
  savedBlueprints, 
  cognitiveLevels, 
  setCognitiveLevels,
  questionTypes,
  setQuestionTypes
}) => {
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = selectedClass?.subjects.find(s => s.id === selectedSubjectId);

  // States for Manage Structure
  const [unitName, setUnitName] = useState('');
  const [subUnitName, setSubUnitName] = useState('');
  const [targetUnitForSub, setTargetUnitForSub] = useState('');

  // States for Manage Question Types
  const [newMark, setNewMark] = useState<number>(1);
  const [newMaxQ, setNewMaxQ] = useState<number>(5);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);

  // States for Manage Cognitive Levels
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelDesc, setNewLevelDesc] = useState('');
  const [isLevelManagerOpen, setIsLevelManagerOpen] = useState(false);

  // States for Add Entry
  const [newEntry, setNewEntry] = useState<Partial<BlueprintEntry>>({
    unitId: '',
    subUnitId: '',
    marksCategory: 1,
    numQuestions: 1,
    levelId: ''
  });

  // Initialize and maintain defaults for Quick Entry Form
  useEffect(() => {
    if (selectedSubject && selectedSubject.units.length > 0) {
      // Check if current unitId is valid for the selected subject
      const currentUnit = selectedSubject.units.find(u => u.id === newEntry.unitId);
      
      // If current unit is invalid (e.g. subject changed) or not set, default to first unit
      let targetUnit = currentUnit;
      let shouldUpdate = false;

      if (!targetUnit) {
        targetUnit = selectedSubject.units[0];
        shouldUpdate = true;
      }

      // Check if subUnit is valid for the target unit
      const currentSubUnit = targetUnit.subUnits.find(s => s.id === newEntry.subUnitId);
      let targetSubUnitId = newEntry.subUnitId;

      if (!currentSubUnit && targetUnit.subUnits.length > 0) {
        targetSubUnitId = targetUnit.subUnits[0].id;
        shouldUpdate = true;
      } else if (!currentSubUnit && targetUnit.subUnits.length === 0) {
        targetSubUnitId = '';
        shouldUpdate = true;
      }

      // Check level and marks
      let targetLevelId = newEntry.levelId;
      if ((!targetLevelId || !cognitiveLevels.find(l => l.id === targetLevelId)) && cognitiveLevels.length > 0) {
        targetLevelId = cognitiveLevels[0].id;
        shouldUpdate = true;
      }

      let targetMarks = newEntry.marksCategory;
      if (!questionTypes.some(qt => qt.marks === targetMarks) && questionTypes.length > 0) {
        targetMarks = questionTypes[0].marks;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        setNewEntry(prev => ({
          ...prev,
          unitId: targetUnit?.id || '',
          subUnitId: targetSubUnitId || '',
          levelId: targetLevelId || '',
          marksCategory: targetMarks || 1
        }));
      }

      // Also set default for sub-unit adder dropdown
      if (!selectedSubject.units.find(u => u.id === targetUnitForSub)) {
        setTargetUnitForSub(selectedSubject.units[0]?.id || '');
      }
    }
  }, [selectedSubjectId, selectedSubject, cognitiveLevels, questionTypes]);

  // Handler for Unit change in Quick Entry to auto-select first sub-unit
  const handleQuickEntryUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnitId = e.target.value;
    const newUnit = selectedSubject?.units.find(u => u.id === newUnitId);
    // Auto-select the first sub-unit of the new unit
    const firstSubUnitId = newUnit?.subUnits?.[0]?.id || '';
    
    setNewEntry(prev => ({
      ...prev,
      unitId: newUnitId,
      subUnitId: firstSubUnitId
    }));
  };

  const handleAddUnit = () => {
    if (!unitName.trim() || !selectedSubject) return;
    const newUnit: Unit = { id: `u_${Date.now()}`, name: unitName.trim(), subUnits: [] };
    setClasses(prev => prev.map(c => c.id === selectedClassId ? { ...c, subjects: c.subjects.map(s => s.id === selectedSubjectId ? { ...s, units: [...s.units, newUnit] } : s) } : c));
    setUnitName('');
    if (!targetUnitForSub) setTargetUnitForSub(newUnit.id);
  };

  const handleAddSubUnit = () => {
    if (!subUnitName.trim() || !targetUnitForSub) return;
    const newSubUnit: SubUnit = { id: `s_${Date.now()}`, name: subUnitName.trim() };
    setClasses(prev => prev.map(c => c.id === selectedClassId ? { ...c, subjects: c.subjects.map(s => s.id === selectedSubjectId ? { ...s, units: s.units.map(u => u.id === targetUnitForSub ? { ...u, subUnits: [...u.subUnits, newSubUnit] } : u) } : s) } : c));
    setSubUnitName('');
  };

  const handleAddQuestionType = () => {
    if (questionTypes.some(qt => qt.marks === newMark)) {
      alert('This mark category already exists!');
      return;
    }
    const newType: QuestionType = { id: `qt_${Date.now()}`, marks: newMark, maxQuestions: newMaxQ };
    setQuestionTypes([...questionTypes, newType]);
  };

  const handleRemoveQuestionType = (id: string) => {
    setQuestionTypes(questionTypes.filter(qt => qt.id !== id));
  };

  const handleAddLevel = () => {
    if (!newLevelName.trim()) return;
    const newLevel: CognitiveLevel = { 
      id: `l_${Date.now()}`, 
      name: newLevelName.trim().toUpperCase(), 
      description: newLevelDesc.trim() 
    };
    setCognitiveLevels([...cognitiveLevels, newLevel]);
    setNewLevelName('');
    setNewLevelDesc('');
  };

  const handleRemoveLevel = (id: string) => {
    setCognitiveLevels(cognitiveLevels.filter(l => l.id !== id));
  };

  const handleAddEntry = () => {
    if (newEntry.unitId && newEntry.subUnitId && newEntry.levelId) {
      const existingIdx = blueprintEntries.findIndex(e => e.unitId === newEntry.unitId && e.subUnitId === newEntry.subUnitId && e.marksCategory === newEntry.marksCategory);
      if (existingIdx >= 0) {
        const updated = [...blueprintEntries];
        updated[existingIdx] = newEntry as BlueprintEntry;
        setBlueprintEntries(updated);
      } else {
        setBlueprintEntries([...blueprintEntries, newEntry as BlueprintEntry]);
      }
    }
  };

  const handleClearEntries = () => {
    if (window.confirm("Are you sure you want to clear all entries for the CURRENT blueprint view?")) {
      setBlueprintEntries([]);
    }
  };

  // Helper to get sub-units for current selection in Quick Entry
  const currentEntryUnit = selectedSubject?.units.find(u => u.id === newEntry.unitId);
  const availableSubUnits = currentEntryUnit?.subUnits || [];

  return (
    <div className="space-y-6">
      {/* Manage Structure Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-indigo-600 uppercase mb-3 tracking-tighter flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          Manage Structure
        </h3>
        
        <div className="space-y-4">
          {/* Add Unit */}
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase">Add Unit</label>
             <div className="flex gap-2">
               <input className="flex-1 text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="New Unit Name" value={unitName} onChange={e => setUnitName(e.target.value)} />
               <button onClick={handleAddUnit} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700 transition-colors">Add</button>
             </div>
          </div>

          {/* Add Sub-Unit */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase">Add Sub-Unit</label>
             <select className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={targetUnitForSub} onChange={e => setTargetUnitForSub(e.target.value)}>
               {selectedSubject?.units.length ? selectedSubject.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>) : <option value="">No Units Available</option>}
             </select>
             <div className="flex gap-2">
               <input className="flex-1 text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="New Sub-Unit Name" value={subUnitName} onChange={e => setSubUnitName(e.target.value)} />
               <button onClick={handleAddSubUnit} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-700 transition-colors">Add</button>
             </div>
          </div>
        </div>
      </div>

      {/* Manage Question Types Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <button 
          onClick={() => setIsTypeManagerOpen(!isTypeManagerOpen)}
          className="w-full flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-tighter group"
        >
          <span className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Question Types
          </span>
          <span className="text-slate-400">{isTypeManagerOpen ? '−' : '+'}</span>
        </button>
        
        {isTypeManagerOpen && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Marks</label>
                <input type="number" min="1" className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500" value={newMark} onChange={e => setNewMark(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Max Q</label>
                <input type="number" min="1" className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500" value={newMaxQ} onChange={e => setNewMaxQ(Number(e.target.value))} />
              </div>
            </div>
            <button onClick={handleAddQuestionType} className="w-full bg-slate-800 text-white py-2 rounded text-xs font-bold hover:bg-black transition-colors shadow-sm">Add Category</button>
            
            <div className="pt-3 border-t border-slate-100 space-y-1 max-h-40 overflow-y-auto pr-1">
              {questionTypes.map(qt => (
                <div key={qt.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs border border-slate-100 group">
                  <span className="font-bold text-slate-700">{qt.marks}M <span className="text-slate-400 font-normal ml-1">Limit:{qt.maxQuestions}</span></span>
                  <button onClick={() => handleRemoveQuestionType(qt.id)} className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manage Cognitive Levels Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <button 
          onClick={() => setIsLevelManagerOpen(!isLevelManagerOpen)}
          className="w-full flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-tighter group"
        >
          <span className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Cognitive Levels
          </span>
          <span className="text-slate-400">{isLevelManagerOpen ? '−' : '+'}</span>
        </button>
        
        {isLevelManagerOpen && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <input className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Level Code (e.g. K1)" value={newLevelName} onChange={e => setNewLevelName(e.target.value)} />
              <input className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Description (e.g. Recall)" value={newLevelDesc} onChange={e => setNewLevelDesc(e.target.value)} />
            </div>
            <button onClick={handleAddLevel} className="w-full bg-slate-800 text-white py-2 rounded text-xs font-bold hover:bg-black transition-colors shadow-sm">Add Level</button>
            
            <div className="pt-3 border-t border-slate-100 space-y-1 max-h-40 overflow-y-auto pr-1">
              {cognitiveLevels.map(l => (
                <div key={l.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs border border-slate-100 group">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{l.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{l.description}</span>
                  </div>
                  <button onClick={() => handleRemoveLevel(l.id)} className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Entry Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
        <h3 className="text-xs font-black text-slate-800 uppercase mb-3 tracking-tighter flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Quick Grid Entry
        </h3>
        <div className="space-y-2.5">
          <select 
            className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
            value={newEntry.unitId} 
            onChange={handleQuickEntryUnitChange}
          >
            {selectedSubject?.units.length ? selectedSubject.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>) : <option value="">No Units</option>}
          </select>
          
          <select 
            className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
            value={newEntry.subUnitId} 
            onChange={e => setNewEntry({...newEntry, subUnitId: e.target.value})}
            disabled={!availableSubUnits.length}
          >
             {availableSubUnits.length > 0 ? (
               availableSubUnits.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
             ) : (
               <option value="">No Sub-Units</option>
             )}
          </select>
          
          <div className="grid grid-cols-2 gap-2">
            <select className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={newEntry.marksCategory} onChange={e => setNewEntry({...newEntry, marksCategory: Number(e.target.value)})}>
              {questionTypes.map(qt => <option key={qt.id} value={qt.marks}>{qt.marks} Marks</option>)}
            </select>
            <input type="number" min="1" className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={newEntry.numQuestions} onChange={e => setNewEntry({...newEntry, numQuestions: Number(e.target.value)})} />
          </div>
          <select className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={newEntry.levelId} onChange={e => setNewEntry({...newEntry, levelId: e.target.value})}>
            {cognitiveLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button onClick={handleAddEntry} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-1 shadow-md hover:bg-indigo-700 transition-all active:scale-95">Update Table</button>
        </div>
      </div>

      {/* Dangerous Action */}
      <div className="p-2">
        <button onClick={handleClearEntries} className="w-full text-[10px] font-bold text-white bg-red-400 hover:bg-red-500 uppercase tracking-widest transition-colors py-3 rounded-lg shadow-sm">
          Clear Current Blueprint
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
