
import React, { useState } from 'react';
import { ClassGrade, CognitiveLevel, QuestionType, Subject } from '../types';

interface SettingsManagerProps {
  classes: ClassGrade[];
  levels: CognitiveLevel[];
  questionTypes: QuestionType[];
  updateClasses: (c: ClassGrade[]) => void;
  updateLevels: (l: CognitiveLevel[]) => void;
  updateQuestionTypes: (qt: QuestionType[]) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ 
  classes, levels, questionTypes, updateClasses, updateLevels, updateQuestionTypes 
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'levels' | 'marks'>('classes');
  
  // States for forms
  const [newClassName, setNewClassName] = useState('');
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelDesc, setNewLevelDesc] = useState('');
  const [newMark, setNewMark] = useState(1);
  const [maxQ, setMaxQ] = useState(5);

  const addClass = () => {
    if (!newClassName.trim()) return;
    updateClasses([...classes, { id: `c_${Date.now()}`, name: newClassName.trim(), subjects: [] }]);
    setNewClassName('');
  };

  const addSubject = (classId: string, name: string) => {
    if (!name.trim()) return;
    updateClasses(classes.map(c => c.id === classId ? { ...c, subjects: [...c.subjects, { id: `s_${Date.now()}`, name: name.trim(), units: [] }] } : c));
  };

  const addLevel = () => {
    if (!newLevelName.trim()) return;
    updateLevels([...levels, { id: `l_${Date.now()}`, name: newLevelName.toUpperCase(), description: newLevelDesc }]);
    setNewLevelName('');
    setNewLevelDesc('');
  };

  const addMarkType = () => {
    updateQuestionTypes([...questionTypes, { id: `m_${Date.now()}`, marks: newMark, maxQuestions: maxQ }]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
      <div className="flex bg-slate-50 border-b border-slate-200">
        {(['classes', 'levels', 'marks'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab === 'classes' ? 'Classes' : tab === 'levels' ? 'Cognitive Levels' : 'Mark Groups'}
          </button>
        ))}
      </div>

      <div className="p-8">
        {activeTab === 'classes' && (
          <div className="space-y-8">
            <div className="flex gap-4">
              <input 
                className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Class Name (e.g., 10th Standard)"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
              />
              <button onClick={addClass} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Add</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map(c => (
                <div key={c.id} className="p-5 border border-slate-100 bg-slate-50 rounded-2xl">
                  <h4 className="font-bold text-slate-800 text-lg mb-3 flex justify-between">
                    {c.name}
                    <button onClick={() => updateClasses(classes.filter(cls => cls.id !== c.id))} className="text-red-400 hover:text-red-600 text-xs uppercase font-bold">Delete</button>
                  </h4>
                  <div className="space-y-2 mb-4">
                    {c.subjects.map(s => (
                      <div key={s.id} className="bg-white p-2 rounded-lg text-sm border border-slate-200 flex justify-between items-center shadow-sm">
                        {s.name}
                        <button onClick={() => updateClasses(classes.map(cls => cls.id === c.id ? {...cls, subjects: cls.subjects.filter(subj => subj.id !== s.id)} : cls))} className="text-slate-400 hover:text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input id={`subj-${c.id}`} className="flex-1 p-2 text-xs border rounded-lg" placeholder="New Subject" />
                    <button 
                      onClick={() => {
                        const input = document.getElementById(`subj-${c.id}`) as HTMLInputElement;
                        addSubject(c.id, input.value);
                        input.value = '';
                      }}
                      className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'levels' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
               <input className="p-3 border rounded-xl outline-none" placeholder="Code (e.g. K1)" value={newLevelName} onChange={e => setNewLevelName(e.target.value)} />
               <input className="p-3 border rounded-xl outline-none" placeholder="Description" value={newLevelDesc} onChange={e => setNewLevelDesc(e.target.value)} />
               <button onClick={addLevel} className="bg-indigo-600 text-white rounded-xl font-bold">Add</button>
             </div>
             <div className="grid grid-cols-1 gap-3">
               {levels.map(l => (
                 <div key={l.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                   <div>
                     <span className="font-bold text-indigo-600 mr-4">{l.name}</span>
                     <span className="text-slate-500 text-sm">{l.description}</span>
                   </div>
                   <button onClick={() => updateLevels(levels.filter(lvl => lvl.id !== l.id))} className="text-red-400 hover:text-red-600">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-end p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Marks</label>
                <input type="number" className="p-3 border rounded-xl w-32" value={newMark} onChange={e => setNewMark(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Max Q</label>
                <input type="number" className="p-3 border rounded-xl w-32" value={maxQ} onChange={e => setMaxQ(Number(e.target.value))} />
              </div>
              <button onClick={addMarkType} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Add Group</button>
            </div>
            <div className="flex flex-wrap gap-4">
              {questionTypes.map(qt => (
                <div key={qt.id} className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800">{qt.marks}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Marks</span>
                  <div className="mt-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">Max Q: {qt.maxQuestions}</div>
                  <button onClick={() => updateQuestionTypes(questionTypes.filter(q => q.id !== qt.id))} className="mt-3 text-red-300 hover:text-red-500 text-[10px] uppercase font-bold">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsManager;
