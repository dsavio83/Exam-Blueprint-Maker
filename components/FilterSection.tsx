
import React from 'react';
import { ClassGrade } from '../types';

interface FilterSectionProps {
  classes: ClassGrade[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  selectedExamType: string;
  setSelectedExamType: (val: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  classes,
  selectedClassId,
  setSelectedClassId,
  selectedSubjectId,
  setSelectedSubjectId,
  selectedExamType,
  setSelectedExamType
}) => {
  const currentClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">Class</label>
        <select 
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none border"
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">Subject</label>
        <select 
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none border"
        >
          {currentClass?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">Exam</label>
        <select 
          value={selectedExamType}
          onChange={(e) => setSelectedExamType(e.target.value)}
          className="w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none border"
        >
          <option value="Term1">First Term</option>
          <option value="Term2">Second Term</option>
          <option value="Term3">Third Term</option>
          <option value="SSLC">SSLC Exam (Final)</option>
        </select>
      </div>
    </div>
  );
};

export default FilterSection;
