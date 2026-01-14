
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, ClassGrade, BlueprintEntry, User, CognitiveLevel, QuestionType, DifficultyLevel, PaperType, SavedBlueprint } from './types';
import { INITIAL_CLASSES, COGNITIVE_LEVELS, INITIAL_PAPER_TYPES, DIFFICULTY_LEVELS } from './constants';
import FilterSection from './components/FilterSection';
import BlueprintTable from './components/BlueprintTable';
import Login from './components/Login';
import SettingsManager from './components/SettingsManager';

const STORAGE_KEY = 'blueprint_pro_v2_data';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'exam-types' | 'class-subject' | 'unit-subunit' | 'cognitive'>('dashboard');
  const [dashboardMode, setDashboardMode] = useState<'list' | 'edit'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App Data State
  const [classes, setClasses] = useState<ClassGrade[]>(INITIAL_CLASSES);
  const [cognitiveLevels, setCognitiveLevels] = useState<CognitiveLevel[]>(COGNITIVE_LEVELS);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>(DIFFICULTY_LEVELS);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>(INITIAL_PAPER_TYPES);
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprint[]>([]);

  // Editor State
  const [currentBlueprintId, setCurrentBlueprintId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('Term1');
  const [selectedPaperTypeId, setSelectedPaperTypeId] = useState<string>('pt_type1');
  const [blueprintEntries, setBlueprintEntries] = useState<BlueprintEntry[]>([]);

  // Robust Persistence Loading
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.classes)) setClasses(parsed.classes);
        if (Array.isArray(parsed.cognitiveLevels)) setCognitiveLevels(parsed.cognitiveLevels);
        if (Array.isArray(parsed.difficultyLevels)) setDifficultyLevels(parsed.difficultyLevels);
        if (Array.isArray(parsed.paperTypes)) setPaperTypes(parsed.paperTypes);
        // Handle migration from old Record format to new Array format if needed
        if (Array.isArray(parsed.savedBlueprints)) {
           setSavedBlueprints(parsed.savedBlueprints);
        }
      }
    } catch (e) {
      console.error("Error loading data:", e);
    }
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      classes, cognitiveLevels, difficultyLevels, paperTypes, savedBlueprints
    }));
  }, [classes, cognitiveLevels, difficultyLevels, paperTypes, savedBlueprints]);

  // Virtual Subject Logic
  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
  const rawSubject = useMemo(() => selectedClass?.subjects.find(s => s.id === selectedSubjectId), [selectedClass, selectedSubjectId]);
  
  const examContext = useMemo(() => {
    if (!selectedClass || !rawSubject) return { units: [], note: '' };
    const units = rawSubject.units;
    let visibleUnitIndices: number[] = units.map((_, i) => i);
    let note = 'Full Syllabus';
    
    const total = units.length;
    if (selectedExamType === 'Term1') { 
        visibleUnitIndices = units.map((_, i) => i).filter(i => i < Math.ceil(total/3)); 
        note = 'Term 1 Syllabus'; 
    } else if (selectedExamType === 'Term2') {
        visibleUnitIndices = units.map((_, i) => i).filter(i => i >= Math.ceil(total/3) && i < Math.ceil(2*total/3));
        note = 'Term 2 Syllabus';
    } else if (selectedExamType === 'Term3') {
        visibleUnitIndices = units.map((_, i) => i).filter(i => i >= Math.ceil(2*total/3));
        note = 'Term 3 Syllabus';
    }
    
    if (visibleUnitIndices.length === 0) visibleUnitIndices = [0];
    return { units: units.filter((_, i) => visibleUnitIndices.includes(i)), note };
  }, [selectedClass, rawSubject, selectedExamType]);

  const activeSubject = useMemo(() => rawSubject ? { ...rawSubject, units: examContext.units } : undefined, [rawSubject, examContext]);
  const activePaperType = useMemo(() => paperTypes.find(p => p.id === selectedPaperTypeId) || paperTypes[0], [paperTypes, selectedPaperTypeId]);

  // Actions
  const handleCreateNew = () => {
    setCurrentBlueprintId(null);
    setBlueprintEntries([]);
    // Defaults
    if (classes.length > 0) {
      setSelectedClassId(classes[0].id);
      if (classes[0].subjects.length > 0) setSelectedSubjectId(classes[0].subjects[0].id);
    }
    if (paperTypes.length > 0) setSelectedPaperTypeId(paperTypes[0].id);
    setDashboardMode('edit');
  };

  const handleEditSaved = (bp: SavedBlueprint) => {
    setCurrentBlueprintId(bp.id);
    setSelectedClassId(bp.classId);
    setSelectedSubjectId(bp.subjectId);
    setSelectedExamType(bp.examType);
    setSelectedPaperTypeId(bp.paperTypeId);
    setBlueprintEntries(bp.entries);
    setDashboardMode('edit');
  };

  const handleDeleteSaved = (id: string) => {
    if (window.confirm("Delete this saved blueprint?")) {
      setSavedBlueprints(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleSaveSession = () => {
    if (!activeSubject) return;
    const name = prompt("Enter a name for this Blueprint:", `${activeSubject.name} - ${selectedExamType}`);
    if (!name) return;

    const newBlueprint: SavedBlueprint = {
      id: currentBlueprintId || `bp_${Date.now()}`,
      name,
      timestamp: Date.now(),
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      examType: selectedExamType,
      paperTypeId: selectedPaperTypeId,
      entries: blueprintEntries
    };

    setSavedBlueprints(prev => {
      const existing = prev.findIndex(b => b.id === newBlueprint.id);
      if (existing > -1) {
        const updated = [...prev];
        updated[existing] = newBlueprint;
        return updated;
      }
      return [newBlueprint, ...prev];
    });
    
    setCurrentBlueprintId(newBlueprint.id);
    alert("Blueprint saved successfully!");
  };

  const handleGenerate = () => {
    if (!activeSubject || !activePaperType) return;
    if (blueprintEntries.length > 0 && !window.confirm("This will overwrite current entries. Continue?")) return;
      
    const newEntries: BlueprintEntry[] = [];
    const allSubUnits = activeSubject.units.flatMap(u => u.subUnits.map(s => ({ uId: u.id, sId: s.id })));
    
    if (allSubUnits.length === 0) return;

    activePaperType.questionTypes.forEach((qt) => {
      let questionsToDistribute = qt.maxQuestions;
      let subUnitIndex = 0;
      let levelIndex = 0;

      while (questionsToDistribute > 0) {
          const target = allSubUnits[subUnitIndex % allSubUnits.length];
          const level = cognitiveLevels[levelIndex % cognitiveLevels.length];
          
          const existingIdx = newEntries.findIndex(e => e.unitId === target.uId && e.subUnitId === target.sId && e.marksCategory === qt.marks);
          
          if (existingIdx > -1) {
            newEntries[existingIdx].numQuestions += 1;
          } else {
            newEntries.push({
              unitId: target.uId,
              subUnitId: target.sId,
              marksCategory: qt.marks,
              numQuestions: 1,
              levelId: level.id
            });
          }

          questionsToDistribute--;
          subUnitIndex++;
          levelIndex++;
      }
    });

    setBlueprintEntries(newEntries);
  };

  const handleUpdateEntry = (unitId: string, subUnitId: string, marks: number, count: number) => {
    setBlueprintEntries(prev => {
      const existingIndex = prev.findIndex(e => e.unitId === unitId && e.subUnitId === subUnitId && e.marksCategory === marks);
      if (existingIndex > -1) {
        if (count <= 0) return prev.filter((_, i) => i !== existingIndex);
        const newEntries = [...prev];
        newEntries[existingIndex] = { ...newEntries[existingIndex], numQuestions: count };
        return newEntries;
      }
      if (count > 0) {
        return [...prev, { unitId, subUnitId, marksCategory: marks, numQuestions: count, levelId: cognitiveLevels[0]?.id || 'sr1' }];
      }
      return prev;
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const NavItem = ({ view, label, icon }: { view: string, label: string, icon: any }) => (
    <button 
      onClick={() => { setCurrentView(view as any); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${currentView === view ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:bg-white">
      {/* Mobile Header (Hidden on Print) */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <span className="font-bold text-lg">Blueprint Pro</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* Sidebar (Hidden on Print) */}
      <aside className={`
        fixed inset-0 z-40 bg-slate-900 text-slate-400 p-6 flex flex-col space-y-2 transition-transform duration-300 md:translate-x-0 md:relative md:w-64 md:block print:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 px-4 mb-8 text-white">
           <div className="bg-indigo-600 p-2 rounded-lg font-black text-xl">B</div>
           <div>
             <div className="font-bold text-lg leading-tight">Blueprint</div>
             <div className="text-[10px] uppercase font-bold text-indigo-500">Generator</div>
           </div>
           <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto">
             <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          <NavItem view="dashboard" label="Dashboard" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>} />
          <div className="pt-6 pb-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600">Configuration</div>
          <NavItem view="exam-types" label="Paper Config" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <NavItem view="class-subject" label="Classes & Subjects" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
          <NavItem view="unit-subunit" label="Units & Hierarchy" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>} />
          <NavItem view="cognitive" label="Taxonomy & Levels" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
        </div>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-400 hover:text-white hover:bg-red-900/50 rounded-xl transition-all font-bold text-sm">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen bg-slate-50 print:bg-white print:p-0 print:overflow-visible print:max-h-none">
        
        {/* Header (Hidden on Print) */}
        <header className="flex justify-between items-center mb-8 print:hidden">
           <div>
             <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {currentView === 'dashboard' ? (dashboardMode === 'list' ? 'Dashboard' : 'Blueprint Editor') : 
                 currentView === 'exam-types' ? 'Configuration' :
                 currentView === 'class-subject' ? 'Class Management' :
                 currentView === 'unit-subunit' ? 'Unit Management' : 'Taxonomy Settings'}
             </h1>
             <p className="text-slate-500 text-sm">Welcome back, {currentUser.fullName}</p>
           </div>
           
           {currentView === 'dashboard' && dashboardMode === 'edit' && (
             <div className="flex gap-3">
               <button onClick={() => setDashboardMode('list')} className="text-slate-500 font-bold text-sm hover:text-slate-700">
                 Cancel
               </button>
               <button onClick={handleSaveSession} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all text-sm">
                 Save Session
               </button>
             </div>
           )}
        </header>

        {currentView === 'dashboard' ? (
          <>
            {/* --- DASHBOARD LIST MODE --- */}
            {dashboardMode === 'list' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onClick={handleCreateNew} className="p-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center gap-3 text-indigo-600 group h-48">
                       <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                       </div>
                       <span className="font-bold text-lg">Create New Blueprint</span>
                    </button>
                  </div>
                  
                  <div>
                     <h3 className="font-bold text-slate-800 text-lg mb-4">Saved Blueprints</h3>
                     {savedBlueprints.length === 0 ? (
                       <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 italic">No saved blueprints found. Create one above!</div>
                     ) : (
                       <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
                          {savedBlueprints.map(bp => {
                             const className = classes.find(c => c.id === bp.classId)?.name || 'Unknown Class';
                             const subjectName = classes.find(c => c.id === bp.classId)?.subjects.find(s => s.id === bp.subjectId)?.name || 'Unknown Subject';
                             const typeName = paperTypes.find(p => p.id === bp.paperTypeId)?.name || 'Unknown Type';
                             
                             return (
                               <div key={bp.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{bp.name}</h4>
                                    <div className="flex gap-3 text-xs text-slate-500 font-medium mt-1">
                                       <span className="bg-slate-100 px-2 py-1 rounded">{className}</span>
                                       <span className="bg-slate-100 px-2 py-1 rounded">{subjectName}</span>
                                       <span className="bg-slate-100 px-2 py-1 rounded">{bp.examType}</span>
                                       <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{typeName}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                      Saved: {new Date(bp.timestamp).toLocaleDateString()} {new Date(bp.timestamp).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => handleEditSaved(bp)} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900">Open / Edit</button>
                                     <button onClick={() => handleDeleteSaved(bp.id)} className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                     </button>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                     )}
                  </div>
               </div>
            )}

            {/* --- DASHBOARD EDITOR MODE --- */}
            {dashboardMode === 'edit' && (
              <div className="space-y-6">
                <div className="print:hidden">
                  <FilterSection 
                    classes={classes}
                    paperTypes={paperTypes}
                    selectedClassId={selectedClassId}
                    setSelectedClassId={setSelectedClassId}
                    selectedSubjectId={selectedSubjectId}
                    setSelectedSubjectId={setSelectedSubjectId}
                    selectedExamType={selectedExamType}
                    setSelectedExamType={setSelectedExamType}
                    selectedPaperTypeId={selectedPaperTypeId}
                    setSelectedPaperTypeId={setSelectedPaperTypeId}
                    onGenerate={handleGenerate}
                  />
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto print:border-none print:shadow-none print:p-0 print:rounded-none">
                  {activeSubject ? (
                    <BlueprintTable 
                      subject={activeSubject} 
                      entries={blueprintEntries}
                      cognitiveLevels={cognitiveLevels}
                      questionTypes={activePaperType ? activePaperType.questionTypes : []}
                      onUpdateEntry={handleUpdateEntry}
                      weightNote={examContext.note}
                      examTitle={`${selectedClass?.name || ''} - ${activeSubject.name} (${selectedExamType})`}
                      paperTypeName={activePaperType?.name}
                    />
                  ) : (
                    <div className="p-12 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      Select a Class and Subject to begin
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <SettingsManager 
            view={currentView}
            classes={classes}
            levels={cognitiveLevels}
            difficultyLevels={difficultyLevels}
            paperTypes={paperTypes}
            updateClasses={setClasses}
            updateLevels={setCognitiveLevels}
            updateDifficulty={setDifficultyLevels}
            updatePaperTypes={setPaperTypes}
          />
        )}
      </main>
    </div>
  );
};

export default App;
