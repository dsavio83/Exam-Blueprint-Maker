
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, ClassGrade, BlueprintEntry, User, CognitiveLevel, KnowledgeLevel, ItemFormat, SavedBlueprint, PaperType, DifficultyLevel } from './types';
import { INITIAL_CLASSES, COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS, ITEM_FORMATS } from './constants';
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
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'paper-types' | 'class-subject' | 'unit-subunit' | 'taxonomy'> (() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? (JSON.parse(stored).view || 'dashboard') : 'dashboard';
    } catch { return 'dashboard'; }
  });

  const [classes, setClasses] = useState<ClassGrade[]>(INITIAL_CLASSES);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprint[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'list' | 'edit'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        if (Array.isArray(parsed.paperTypes)) setPaperTypes(parsed.paperTypes);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify({ classes, savedBlueprints, paperTypes }));
  }, [classes, savedBlueprints, paperTypes]);

  const handleCreateNew = () => {
    const defaultClass = classes[0];
    const defaultSub = defaultClass?.subjects[0];
    const newBp: SavedBlueprint = {
      id: `bp_${Date.now()}`,
      name: 'Untitled Analysis Proforma',
      timestamp: Date.now(),
      classId: defaultClass?.name || 'Class X',
      subjectId: defaultSub?.id || 'Tamil BT',
      examType: 'First Term',
      paperTypeId: paperTypes[0]?.id || '',
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

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this analysis proforma?")) {
      setSavedBlueprints(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleUpdateEntry = (update: BlueprintEntry | null, index: number) => {
    if (!activeBlueprint) return;
    const newEntries = [...activeBlueprint.entries];
    if (update === null) {
      newEntries.splice(index, 1);
    } else {
      newEntries[index] = update;
    }
    setActiveBlueprint({ ...activeBlueprint, entries: newEntries });
  };

  const handleAddEntry = (entry: BlueprintEntry) => {
    if (!activeBlueprint) return;
    setActiveBlueprint({ ...activeBlueprint, entries: [...activeBlueprint.entries, entry] });
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
    const name = prompt("Name this analysis proforma:", activeBlueprint.name);
    if (!name) return;
    
    const updatedBp = { ...activeBlueprint, name, timestamp: Date.now() };
    setSavedBlueprints(prev => {
      const idx = prev.findIndex(b => b.id === updatedBp.id);
      if (idx > -1) {
          const updated = [...prev];
          updated[idx] = updatedBp;
          return updated;
      }
      return [updatedBp, ...prev];
    });
    setDashboardMode('list');
    alert("Blueprint Analysis Saved Successfully!");
  };

  const activeSubject = useMemo(() => {
      if (!activeBlueprint) return null;
      // In a real app we'd search more robustly, here we use the name to find the first match or default
      return classes.find(c => c.name === activeBlueprint.classId)?.subjects.find(s => s.id === activeBlueprint.subjectId) || classes[0].subjects[0];
  }, [activeBlueprint, classes]);

  const SidebarNavItem = ({ view, label, icon }: { view: any, label: string, icon: any }) => (
    <button 
      onClick={() => { setCurrentView(view); setDashboardMode('list'); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${currentView === view ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:bg-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <span className="font-bold">Blueprint Pro HS</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-0 z-40 bg-slate-900 text-slate-400 p-6 flex flex-col space-y-1 transition-transform duration-300 md:translate-x-0 md:relative md:w-64 md:block print:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 px-4 mb-8 text-white">
           <div className="bg-indigo-600 p-2 rounded-lg font-black text-xl">B</div>
           <div>
             <div className="font-bold text-lg leading-tight tracking-tight">Proforma</div>
             <div className="text-[10px] uppercase font-bold text-indigo-500">Analysis System</div>
           </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          <SidebarNavItem view="dashboard" label="Dashboard" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
          
          <div className="pt-6 pb-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600">Administrative Panels</div>
          <SidebarNavItem view="class-subject" label="Classes & Subjects" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
          <SidebarNavItem view="unit-subunit" label="Units & Hierarchy" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
          <SidebarNavItem view="paper-types" label="Paper Patterns" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <SidebarNavItem view="taxonomy" label="Taxonomy Setup" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
        </div>

        <button onClick={() => setCurrentUser(null)} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-400 hover:text-white hover:bg-red-900/50 rounded-xl transition-all font-bold text-sm">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto max-h-screen p-4 md:p-10 bg-slate-50 print:bg-white print:p-0 print:overflow-visible print:max-h-none">
        {currentView === 'dashboard' ? (
          dashboardMode === 'list' ? (
            <div className="space-y-10 animate-fade-in">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
                 <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">Exam Analysis Dashboard</h1>
                   <p className="text-slate-500 font-medium mt-1">Select an existing proforma or create a new one to begin analysis.</p>
                 </div>
                 <button onClick={handleCreateNew} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-indigo-600/30 hover:-translate-y-1 transition-all">
                   + Create New Proforma
                 </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {savedBlueprints.map(bp => (
                   <div key={bp.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between h-64 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" /></svg>
                      </div>
                      <div>
                        <div className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] mb-3">{bp.classId} &bull; {bp.examType}</div>
                        <h3 className="font-black text-slate-800 text-2xl leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{bp.name}</h3>
                        <div className="flex flex-wrap gap-2">
                           <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-wider">{bp.maxScore} Score</span>
                           <span className="bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-black text-indigo-700 uppercase tracking-wider">{bp.entries.length} Items Assigned</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(bp.timestamp).toLocaleDateString()}</span>
                        <div className="flex gap-4">
                          <button onClick={(e) => handleDeleteSaved(bp.id, e)} className="text-red-400 hover:text-red-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          <button onClick={() => handleEditSaved(bp)} className="text-sm font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest">Open &rarr;</button>
                        </div>
                      </div>
                   </div>
                 ))}
                 {savedBlueprints.length === 0 && (
                   <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-200 rounded-[3rem] text-slate-300">
                      <svg className="w-20 h-20 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                      <p className="font-black text-2xl uppercase tracking-widest">No Analysis Records Found</p>
                      <button onClick={handleCreateNew} className="mt-6 text-indigo-600 font-black hover:underline uppercase tracking-[0.2em] text-sm">Initialize First Analysis Proforma</button>
                   </div>
                 )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
               <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl mb-10 print:hidden">
                  <div className="flex items-center gap-6">
                    <button onClick={() => setDashboardMode('list')} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                       <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                      <h2 className="font-black text-2xl text-slate-800 tracking-tight leading-none">{activeBlueprint?.name}</h2>
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2">Analysis Proforma Editor</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-slate-900/20">Print Report</button>
                    <button onClick={handleSave} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black text-xs shadow-2xl shadow-indigo-600/20">Finalize & Save</button>
                  </div>
               </div>
               {activeBlueprint && activeSubject && (
                 <AnalysisReport 
                    blueprint={activeBlueprint} 
                    subject={activeSubject} 
                    onUpdateEntry={handleUpdateEntry}
                    onAddEntry={handleAddEntry}
                    onUpdateOverrides={handleUpdateOverrides}
                 />
               )}
            </div>
          )
        ) : (
          <SettingsManager 
            view={currentView as any}
            classes={classes}
            levels={COGNITIVE_PROCESSES as any}
            difficultyLevels={KNOWLEDGE_LEVELS as any}
            paperTypes={paperTypes}
            updateClasses={setClasses}
            updateLevels={()=>{}}
            updateDifficulty={()=>{}}
            updatePaperTypes={setPaperTypes}
          />
        )}
      </main>
    </div>
  );
};

export default App;
