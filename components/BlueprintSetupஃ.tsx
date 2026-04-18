
import React from 'react';
import { ClassGrade, PaperType, SavedBlueprint } from '../types';

interface BlueprintSetupProps {
  classes: ClassGrade[];
  paperTypes: PaperType[];
  onCancel: () => void;
  onConfirm: (config: Partial<SavedBlueprint>) => void;
}

const BlueprintSetup: React.FC<BlueprintSetupProps> = ({ classes, paperTypes, onCancel, onConfirm }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    classId: classes[0]?.id || '',
    subjectId: classes[0]?.subjects[0]?.id || '',
    examType: 'First Term',
    paperTypeId: paperTypes[0]?.id || '',
    maxScore: 40,
    timeAllotted: 90
  });

  const selectedClass = classes.find(c => c.id === formData.classId);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden animate-in">
      <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] -mr-32 -mt-32 opacity-30"></div>
        <h2 className="text-4xl font-black uppercase tracking-widest relative">Initialize Analysis</h2>
        <p className="text-slate-400 mt-3 font-medium text-lg relative">Configure your assessment parameters to begin mapping.</p>
      </div>
      
      <div className="p-12 space-y-10">
        <div className="space-y-3">
          <label className="text-xs font-black uppercase text-indigo-600 tracking-[0.2em]">Assignment Name</label>
          <input 
            className="w-full p-6 border-2 border-slate-50 rounded-[2rem] bg-slate-50 font-black text-xl focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-slate-200" 
            placeholder="e.g., IX Std Tamil Monthly Proforma"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade / Class</label>
            <select 
              className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all"
              value={formData.classId}
              onChange={e => setFormData({...formData, classId: e.target.value, subjectId: classes.find(c => c.id === e.target.value)?.subjects[0]?.id || ''})}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Subject Selection</label>
            <select 
              className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all"
              value={formData.subjectId}
              onChange={e => setFormData({...formData, subjectId: e.target.value})}
            >
              {selectedClass?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Exam Terminology</label>
            <select 
              className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all"
              value={formData.examType}
              onChange={e => setFormData({...formData, examType: e.target.value})}
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
              <option value="SSLC Exam (Final)">SSLC Exam (Final)</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Template Pattern</label>
            <select 
              className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer hover:bg-white transition-all"
              value={formData.paperTypeId}
              onChange={e => setFormData({...formData, paperTypeId: e.target.value})}
            >
              <option value="">No Template (Free Form)</option>
              {paperTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Aggregated Score</label>
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-3xl border-2 border-slate-50">
               <button onClick={() => setFormData(p => ({...p, maxScore: Math.max(0, p.maxScore-10)}))} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl font-black text-xl shadow-sm">-</button>
               <input type="number" className="flex-1 bg-transparent text-center font-black text-2xl outline-none" value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: Number(e.target.value)})}/>
               <button onClick={() => setFormData(p => ({...p, maxScore: p.maxScore+10}))} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl font-black text-xl shadow-sm">+</button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Time Allotted (Mins)</label>
            <input type="number" className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 font-black text-2xl text-center outline-none focus:bg-white transition-all" value={formData.timeAllotted} onChange={e => setFormData({...formData, timeAllotted: Number(e.target.value)})}/>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 pt-10">
          <button onClick={onCancel} className="flex-1 p-6 rounded-[2rem] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
          <button 
            disabled={!formData.name || !formData.subjectId}
            onClick={() => onConfirm(formData)} 
            className="flex-1 p-6 rounded-[2rem] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:-translate-y-2 active:scale-95 transition-all disabled:opacity-30"
          >
            Create Matrix Proforma
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlueprintSetup;
