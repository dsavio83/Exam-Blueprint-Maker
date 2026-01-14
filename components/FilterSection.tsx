
import React from 'react';
import { ClassGrade, PaperType } from '../types';

interface FilterSectionProps {
  classes: ClassGrade[];
  paperTypes: PaperType[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  selectedExamType: string;
  setSelectedExamType: (val: string) => void;
  selectedPaperTypeId: string;
  setSelectedPaperTypeId: (id: string) => void;
  onGenerate: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  classes,
  paperTypes,
  selectedClassId,
  setSelectedClassId,
  selectedSubjectId,
  setSelectedSubjectId,
  selectedExamType,
  setSelectedExamType,
  selectedPaperTypeId,
  setSelectedPaperTypeId,
  onGenerate
}) => {
  const currentClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Class</label>
          <select 
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full rounded-lg border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none border"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
          <select 
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full rounded-lg border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none border"
          >
            {currentClass?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Exam Term</label>
          <select 
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="w-full rounded-lg border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none border"
          >
            <option value="Term1">First Term</option>
            <option value="Term2">Second Term</option>
            <option value="Term3">Third Term</option>
            <option value="SSLC">SSLC Exam (Final)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Question Paper Type</label>
          <select 
            value={selectedPaperTypeId}
            onChange={(e) => setSelectedPaperTypeId(e.target.value)}
            className="w-full rounded-lg border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none border"
          >
            {paperTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end pt-2 border-t border-slate-100">
         <button 
           onClick={onGenerate}
           className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
         >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
           Generate Blueprint
         </button>
      </div>
    </div>
  );
};

export default FilterSection;
