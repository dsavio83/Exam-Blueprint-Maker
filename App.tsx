
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, ClassGrade, BlueprintEntry, User, CognitiveLevel, QuestionType, Subject } from './types';
import { INITIAL_CLASSES, COGNITIVE_LEVELS, QUESTION_TYPES } from './constants';
import Navbar from './components/Navbar';
import FilterSection from './components/FilterSection';
import BlueprintTable from './components/BlueprintTable';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import SettingsManager from './components/SettingsManager';

const STORAGE_KEY = 'blueprint_pro_v2_data';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'blueprint' | 'settings'>('blueprint');

  const [classes, setClasses] = useState<ClassGrade[]>(INITIAL_CLASSES);
  const [cognitiveLevels, setCognitiveLevels] = useState<CognitiveLevel[]>(COGNITIVE_LEVELS);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(QUESTION_TYPES);
  const [savedBlueprints, setSavedBlueprints] = useState<Record<string, BlueprintEntry[]>>({});

  // Selection States
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('Term1');

  const [blueprintEntries, setBlueprintEntries] = useState<BlueprintEntry[]>([]);
  const blueprintKey = `${selectedClassId}-${selectedSubjectId}-${selectedExamType}`;

  // Robust Persistence Loading with Error Handling
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      
      // Basic validation to ensure we don't break the UI with malformed data
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.classes)) setClasses(parsed.classes);
        if (Array.isArray(parsed.cognitiveLevels)) setCognitiveLevels(parsed.cognitiveLevels);
        if (Array.isArray(parsed.questionTypes)) setQuestionTypes(parsed.questionTypes);
        if (parsed.savedBlueprints && typeof parsed.savedBlueprints === 'object') {
          setSavedBlueprints(parsed.savedBlueprints);
        }
        console.log("Successfully restored user data.");
      } else {
        throw new Error("Invalid stored data structure");
      }
    } catch (e) {
      console.error("Critical error loading session data from localStorage. Data might be corrupted:", e);
    }
  }, []);

  // Auto-save system settings whenever they change
  useEffect(() => {
    const dataToStore = {
      classes,
      cognitiveLevels,
      questionTypes,
      savedBlueprints
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  }, [classes, cognitiveLevels, questionTypes, savedBlueprints]);

  // Set defaults once classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
      if (classes[0].subjects.length > 0) setSelectedSubjectId(classes[0].subjects[0].id);
    }
  }, [classes, selectedClassId]);

  // Sync entries when key changes
  useEffect(() => {
    const entries = savedBlueprints[blueprintKey] || [];
    setBlueprintEntries(entries);
  }, [blueprintKey, savedBlueprints]);

  const handleSaveBlueprint = () => {
    const newSaved = { ...savedBlueprints, [blueprintKey]: blueprintEntries };
    setSavedBlueprints(newSaved);
    alert('Blueprint saved successfully!');
  };

  const handleUpdateEntry = (unitId: string, subUnitId: string, marks: number, count: number) => {
    setBlueprintEntries(prev => {
      const existingIndex = prev.findIndex(e => 
        e.unitId === unitId && 
        e.subUnitId === subUnitId && 
        e.marksCategory === marks
      );

      if (existingIndex > -1) {
        if (count <= 0) {
          // Remove if count is 0
          return prev.filter((_, i) => i !== existingIndex);
        } else {
          // Update count
          const newEntries = [...prev];
          newEntries[existingIndex] = { ...newEntries[existingIndex], numQuestions: count };
          return newEntries;
        }
      }
      return prev;
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('blueprint');
    setSelectedExamType('Term1');
  };

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
  
  // LOGIC: Get the raw subject first
  const rawSubject = useMemo(() => selectedClass?.subjects.find(s => s.id === selectedSubjectId), [selectedClass, selectedSubjectId]);

  // LOGIC: Determine Visible Units and Weights based on Exam Type
  const examContext = useMemo(() => {
    if (!selectedClass || !rawSubject) return { units: [], note: '' };

    const isTamilBT = rawSubject.type === 'BT'; // Tamil BT (3 units total)
    const isSSLC = selectedClass.name.toLowerCase().includes('10'); // Class 10
    const units = rawSubject.units;
    
    let visibleUnitIndices: number[] = [];
    let note = '';

    if (isTamilBT) {
      // Logic for Tamil BT (Only 3 Units)
      if (selectedExamType === 'Term1') {
        visibleUnitIndices = [0]; // Unit 1
        note = 'Weightage: Unit 1 (100%)';
      } else if (selectedExamType === 'Term2') {
        visibleUnitIndices = [0, 1]; // Unit 1, 2
        note = 'Weightage: Unit 2 (80%), Unit 1 (20%)';
      } else if (selectedExamType === 'Term3' || selectedExamType === 'SSLC') {
        visibleUnitIndices = [0, 1, 2]; // Unit 1, 2, 3
        note = 'Weightage: Unit 3 (70%), Unit 2 (20%), Unit 1 (10%)';
      }
    } else {
      // Standard Logic (Tamil AT / General)
      if (selectedExamType === 'Term1') {
        // First Term: Unit 1 & 2
        visibleUnitIndices = [0, 1];
        note = 'Weightage: Units 1 & 2 (100%)';
      } else if (selectedExamType === 'Term2') {
        // Second Term: Unit 3 & 4 (80%), Term 1 (20%)
        visibleUnitIndices = [0, 1, 2, 3];
        note = 'Weightage: Units 3 & 4 (80%), Units 1 & 2 (20%)';
      } else if (selectedExamType === 'Term3') {
        // Third Term (Class 8 & 9): Unit 5 & 6 (70%), Term 2 (20%), Term 1 (10%)
        visibleUnitIndices = [0, 1, 2, 3, 4, 5];
        note = 'Weightage: Units 5 & 6 (70%), Units 3 & 4 (20%), Units 1 & 2 (10%)';
      } else if (selectedExamType === 'SSLC') {
        if (isSSLC) {
          // SSLC Final: All Units. T1(20%), T2(20%), T3(60%)
          visibleUnitIndices = units.map((_, i) => i);
          note = 'Weightage: Term 3 Content (60%), Term 2 (20%), Term 1 (20%)';
        } else {
          // Fallback for non-10th SSLC selection
          visibleUnitIndices = units.map((_, i) => i);
          note = 'Full Syllabus';
        }
      }
    }

    // Filter the units
    const filteredUnits = units.filter((_, index) => visibleUnitIndices.includes(index));
    return { units: filteredUnits, note };

  }, [selectedClass, rawSubject, selectedExamType]);

  // Construct a "Virtual Subject" to pass to the table that only contains active units
  const activeSubject = useMemo(() => {
    if (!rawSubject) return undefined;
    return {
      ...rawSubject,
      units: examContext.units
    };
  }, [rawSubject, examContext]);


  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 p-2 rounded-lg text-white font-black text-xl shadow-md">B</div>
          <span className="font-bold text-slate-800 tracking-tight">Blueprint Pro <span className="text-indigo-600">v2.1</span></span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{currentUser.fullName}</p>
            <p className="text-[10px] uppercase font-black text-indigo-500 tracking-tighter">{currentUser.role}</p>
          </div>
          <button 
            onClick={handleLogout} 
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 bg-slate-900 text-slate-400 p-4 md:p-6 flex flex-col space-y-4">
          <button 
            onClick={() => setCurrentView('blueprint')}
            className={`flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 rounded-xl transition-all font-bold ${currentView === 'blueprint' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 01-2 2h2a2 2 0 002-2zm12 0v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 01-2 2h2a2 2 0 002-2zM9 7V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden md:block">Generator</span>
          </button>
          
          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => setCurrentView('settings')}
              className={`flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 rounded-xl transition-all font-bold ${currentView === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden md:block">Settings</span>
            </button>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {currentView === 'blueprint' ? (
            <div className="space-y-8 max-w-[1600px] mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Exam Blueprint</h1>
                  <p className="text-slate-500">Exam blueprint planning and management</p>
                </div>
                {currentUser.role === UserRole.ADMIN && (
                   <button 
                    onClick={handleSaveBlueprint}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 md:px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save Configuration
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1">
                  <AdminPanel 
                    classes={classes} 
                    setClasses={setClasses}
                    selectedClassId={selectedClassId}
                    selectedSubjectId={selectedSubjectId}
                    blueprintEntries={blueprintEntries}
                    setBlueprintEntries={setBlueprintEntries}
                    savedBlueprints={savedBlueprints}
                    cognitiveLevels={cognitiveLevels}
                    setCognitiveLevels={setCognitiveLevels}
                    questionTypes={questionTypes}
                    setQuestionTypes={setQuestionTypes}
                  />
                </div>
                <div className="xl:col-span-3 space-y-8">
                  <FilterSection 
                    classes={classes}
                    selectedClassId={selectedClassId}
                    setSelectedClassId={setSelectedClassId}
                    selectedSubjectId={selectedSubjectId}
                    setSelectedSubjectId={setSelectedSubjectId}
                    selectedExamType={selectedExamType}
                    setSelectedExamType={setSelectedExamType}
                  />
                  <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl border border-slate-200 overflow-x-auto">
                    {activeSubject ? (
                      <BlueprintTable 
                        subject={activeSubject} 
                        entries={blueprintEntries}
                        cognitiveLevels={cognitiveLevels}
                        questionTypes={questionTypes}
                        onUpdateEntry={handleUpdateEntry}
                        weightNote={examContext.note}
                      />
                    ) : (
                      <div className="p-12 text-center text-slate-400 font-bold bg-slate-100 rounded-xl">
                        Please select a Class and Subject
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-5xl mx-auto">
               <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">System Configuration</h1>
               <SettingsManager 
                 classes={classes}
                 levels={cognitiveLevels}
                 questionTypes={questionTypes}
                 updateClasses={setClasses}
                 updateLevels={setCognitiveLevels}
                 updateQuestionTypes={setQuestionTypes}
               />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
