
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
    <div className="max-w-3xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
      <div className="bg-indigo-600 p-10 text-white">
        <h2 className="text-3xl font-black uppercase tracking-widest">Blueprint Configuration</h2>
        <p className="text-indigo-100 mt-2 font-medium">Select parameters to initialize your analysis proforma.</p>
      </div>
      
      <div className="p-12 space-y-8">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Proforma Name</label>
          <input 
            className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold focus:border-indigo-600 outline-none transition-all" 
            placeholder="e.g., X Std Tamil Quarterly 2024"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Class</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none"
              value={formData.classId}
              onChange={e => setFormData({...formData, classId: e.target.value, subjectId: classes.find(c => c.id === e.target.value)?.subjects[0]?.id || ''})}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Subject</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none"
              value={formData.subjectId}
              onChange={e => setFormData({...formData, subjectId: e.target.value})}
            >
              {selectedClass?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Exam Term</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none"
              value={formData.examType}
              onChange={e => setFormData({...formData, examType: e.target.value})}
            >
              <option>First Term</option>
              <option>Second Term</option>
              <option>Quarterly Exam</option>
              <option>Half-Yearly Exam</option>
              <option>Annual Exam</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Paper Pattern</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none"
              value={formData.paperTypeId}
              onChange={e => setFormData({...formData, paperTypeId: e.target.value})}
            >
              <option value="">No Template (Free Mode)</option>
              {paperTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Score</label>
            <input type="number" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold" value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: Number(e.target.value)})}/>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Time (Mins)</label>
            <input type="number" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold" value={formData.timeAllotted} onChange={e => setFormData({...formData, timeAllotted: Number(e.target.value)})}/>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button onClick={onCancel} className="flex-1 p-5 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Cancel</button>
          <button 
            disabled={!formData.name || !formData.subjectId}
            onClick={() => onConfirm(formData)} 
            className="flex-1 p-5 rounded-2xl font-black uppercase tracking-widest bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            Create Proforma
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlueprintSetup;
