
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, ClassGrade, BlueprintEntry, User, CognitiveLevel, KnowledgeLevel, ItemFormat, SavedBlueprint } from './types';
import { INITIAL_CLASSES, COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS, ITEM_FORMATS } from './constants';
import FilterSection from './components/FilterSection';
import AnalysisReport from './components/AnalysisReport';
import Login from './components/Login';
import SettingsManager from './components/SettingsManager';

const DATA_STORAGE_KEY = 'blueprint_pro_v2_data';
const SESSION_STORAGE_KEY = 'blueprint_pro_session';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored).user : null;
    } catch { return null; }
  });
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'exam-types' | 'class-subject' | 'unit-subunit' | 'cognitive'>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? (JSON.parse(stored).view || 'dashboard') : 'dashboard';
    } catch { return 'dashboard'; }
  });

  const [classes, setClasses] = useState<ClassGrade[]>(INITIAL_CLASSES);
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprint[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'list' | 'edit'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active Blueprint Session
  const [activeBlueprint, setActiveBlueprint] = useState<SavedBlueprint | null>(null);

  useEffect(() => {
    const sessionData = { user: currentUser, view: currentView };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }, [currentUser, currentView]);

  useEffect(() => {
    const stored = localStorage.getItem(DATA_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.savedBlueprints)) setSavedBlueprints(parsed.savedBlueprints);
        if (Array.isArray(parsed.classes)) setClasses(parsed.classes);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify({ classes, savedBlueprints }));
  }, [classes, savedBlueprints]);

  const handleCreateNew = () => {
    const newBp: SavedBlueprint = {
      id: `bp_${Date.now()}`,
      name: 'New Analysis Proforma',
      timestamp: Date.now(),
      classId: classes[0]?.id || 'X',
      subjectId: classes[0]?.subjects[0]?.id || 'Tamil BT',
      examType: 'First Term',
      paperTypeId: 'pt_type1',
      maxScore: 40,
      timeAllotted: 90,
      entries: [],
      topicNameOverrides: {},
      objectiveOverrides: {}
    };
    setActiveBlueprint(newBp);
    setDashboardMode('edit');
  };

  const handleEditSaved = (bp: SavedBlueprint) => {
    setActiveBlueprint(bp);
    setDashboardMode('edit');
  };

  const handleUpdateEntry = (update: Partial<BlueprintEntry> & { index: number }) => {
    if (!activeBlueprint) return;
    const newEntries = [...activeBlueprint.entries];
    // In a real app, logic for adding/removing entries would be more complex
    // For now, let's assume we are modifying an existing set or adding on demand
    setActiveBlueprint({ ...activeBlueprint, entries: newEntries });
  };

  const handleUpdateOverrides = (key: string, val: string, type: 'name' | 'objective') => {
    if (!activeBlueprint) return;
    const overrides = type === 'name' ? { ...activeBlueprint.topicNameOverrides } : { ...activeBlueprint.objectiveOverrides };
    overrides[key] = val;
    setActiveBlueprint({
      ...activeBlueprint,
      [type === 'name' ? 'topicNameOverrides' : 'objectiveOverrides']: overrides
    });
  };

  const handleSave = () => {
    if (!activeBlueprint) return;
    setSavedBlueprints(prev => {
      const idx = prev.findIndex(b => b.id === activeBlueprint.id);
      if (idx > -1) {
          const updated = [...prev];
          updated[idx] = activeBlueprint;
          return updated;
      }
      return [activeBlueprint, ...prev];
    });
    alert("Blueprint Analysis Saved!");
  };

  const activeSubject = useMemo(() => {
      if (!activeBlueprint) return null;
      return classes.find(c => c.id === activeBlueprint.classId)?.subjects.find(s => s.id === activeBlueprint.subjectId) || classes[0].subjects[0];
  }, [activeBlueprint, classes]);

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-slate-100 flex print:bg-white">
      {/* Sidebar - Desktop Only for brevity */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col print:hidden">
        <h2 className="text-xl font-black mb-8">Blueprint Pro Analysis</h2>
        <nav className="flex-1 space-y-2">
           <button onClick={() => {setCurrentView('dashboard'); setDashboardMode('list');}} className={`w-full text-left p-3 rounded-xl font-bold ${currentView === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Dashboard</button>
           <button onClick={() => setCurrentView('exam-types')} className={`w-full text-left p-3 rounded-xl font-bold ${currentView === 'exam-types' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Settings</button>
        </nav>
        <button onClick={() => setCurrentUser(null)} className="mt-auto p-3 text-red-400 font-bold hover:bg-red-900/20 rounded-xl">Logout</button>
      </aside>

      <main className="flex-1 overflow-y-auto max-h-screen print:max-h-none print:overflow-visible">
        {currentView === 'dashboard' && (
          <div className="p-8 print:p-0">
             {dashboardMode === 'list' ? (
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h1 className="text-2xl font-black text-slate-800">Exam Analysis Dashboard</h1>
                      <button onClick={handleCreateNew} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200">New Proforma</button>
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      {savedBlueprints.map(bp => (
                        <div key={bp.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                           <div>
                              <div className="font-bold text-lg text-slate-800">{bp.name}</div>
                              <div className="text-xs text-slate-500">{new Date(bp.timestamp).toLocaleDateString()} &bull; {bp.classId} &bull; {bp.examType}</div>
                           </div>
                           <button onClick={() => handleEditSaved(bp)} className="text-indigo-600 font-bold hover:underline">Open Analysis</button>
                        </div>
                      ))}
                      {savedBlueprints.length === 0 && <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 italic">No saved analyses. Create one to begin.</div>}
                   </div>
                </div>
             ) : (
                <div className="space-y-4">
                   <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setDashboardMode('list')} className="text-slate-500 hover:text-slate-800">&larr; Back</button>
                        <h2 className="font-bold text-xl">{activeBlueprint?.name}</h2>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm">Print / PDF</button>
                        <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Save Proforma</button>
                      </div>
                   </div>
                   {activeBlueprint && activeSubject && (
                     <AnalysisReport 
                        blueprint={activeBlueprint} 
                        subject={activeSubject} 
                        onUpdateEntry={handleUpdateEntry}
                        onUpdateOverrides={handleUpdateOverrides}
                     />
                   )}
                </div>
             )}
          </div>
        )}
        
        {currentView !== 'dashboard' && (
           <div className="p-8">
              <SettingsManager 
                view={currentView as any}
                classes={classes}
                levels={COGNITIVE_PROCESSES as any}
                difficultyLevels={KNOWLEDGE_LEVELS as any}
                paperTypes={[]}
                updateClasses={setClasses}
                updateLevels={()=>{}}
                updateDifficulty={()=>{}}
                updatePaperTypes={()=>{}}
              />
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
