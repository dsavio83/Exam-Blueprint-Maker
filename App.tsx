
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, ClassGrade, BlueprintEntry, User, SavedBlueprint, PaperType } from './types';
import { INITIAL_CLASSES, COGNITIVE_PROCESSES, KNOWLEDGE_LEVELS } from './constants';
import AnalysisReport from './components/AnalysisReport';
import Login from './components/Login';
import SettingsManager from './components/SettingsManager';
import BlueprintSetup from './components/BlueprintSetup';

const DATA_STORAGE_KEY = 'blueprint_pro_v3_data';
const SESSION_STORAGE_KEY = 'blueprint_pro_v3_session';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored).user : null;
    } catch { return null; }
  });
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'paper-types' | 'class-subject' | 'unit-subunit' | 'taxonomy'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [classes, setClasses] = useState<ClassGrade[]>(INITIAL_CLASSES);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprint[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'list' | 'setup' | 'edit'>('list');
  const [activeBlueprint, setActiveBlueprint] = useState<SavedBlueprint | null>(null);

  useEffect(() => {
    const sessionData = { user: currentUser };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }, [currentUser]);

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

  const handleStartSetup = () => setDashboardMode('setup');

  const handleConfirmSetup = (config: Partial<SavedBlueprint>) => {
    const newBp: SavedBlueprint = {
      id: `bp_${Date.now()}`,
      name: config.name || 'Untitled Analysis',
      timestamp: Date.now(),
      classId: config.classId || '',
      subjectId: config.subjectId || '',
      examType: config.examType || '',
      paperTypeId: config.paperTypeId || '',
      maxScore: config.maxScore || 40,
      timeAllotted: config.timeAllotted || 90,
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
    if (confirm("Delete this analysis?")) {
      setSavedBlueprints(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleSave = () => {
    if (!activeBlueprint) return;
    const updatedBp = { ...activeBlueprint, timestamp: Date.now() };
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
  };

  const activeSubject = useMemo(() => {
      if (!activeBlueprint) return null;
      return classes.find(c => c.id === activeBlueprint.classId)?.subjects.find(s => s.id === activeBlueprint.subjectId);
  }, [activeBlueprint, classes]);

  const SidebarNavItem = ({ view, label, icon }: { view: any, label: string, icon: any }) => (
    <button 
      onClick={() => { setCurrentView(view); setDashboardMode('list'); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${currentView === view ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 p-4 flex items-center justify-between no-print sticky top-0 z-50">
        <div className="flex items-center gap-3 text-white">
           <div className="bg-indigo-600 w-8 h-8 rounded-lg font-black flex items-center justify-center text-sm">B</div>
           <span className="font-bold tracking-tight">Proforma V3</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>
      </header>

      {/* Sidebar / Mobile Menu */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 p-6 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <div className="hidden md:flex items-center gap-4 px-4 mb-12 text-white">
           <div className="bg-indigo-600 p-2.5 rounded-xl font-black text-2xl shadow-xl shadow-indigo-600/20">B</div>
           <div>
             <div className="font-black text-xl leading-tight">Proforma</div>
             <div className="text-[10px] uppercase font-black text-indigo-500 tracking-widest">Version 3.0</div>
           </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="px-4 pb-2 text-[11px] font-black uppercase tracking-widest text-slate-600">Main Console</div>
          <SidebarNavItem view="dashboard" label="Dashboard" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zM14 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z" /></svg>} />
          
          <div className="pt-8 px-4 pb-2 text-[11px] font-black uppercase tracking-widest text-slate-600">Configuration</div>
          <SidebarNavItem view="class-subject" label="Classes & Subjects" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
          <SidebarNavItem view="unit-subunit" label="Units & Hierarchy" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
          <SidebarNavItem view="paper-types" label="Paper Patterns" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <SidebarNavItem view="taxonomy" label="Standards" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        </div>
        
        <button onClick={() => setCurrentUser(null)} className="mt-8 flex items-center gap-4 px-5 py-4 text-rose-400 hover:text-white hover:bg-rose-900/40 rounded-2xl transition-all font-black text-sm border border-rose-900/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-12 custom-scrollbar">
        {currentView === 'dashboard' ? (
          dashboardMode === 'list' ? (
            <div className="max-w-7xl mx-auto space-y-12 animate-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-10">
                 <div className="space-y-2 text-center md:text-left">
                   <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">Your Proformas</h1>
                   <p className="text-slate-500 font-medium text-lg">High-precision question paper analysis system</p>
                 </div>
                 <button onClick={handleStartSetup} className="bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-black text-sm shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all">Start New Analysis</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {savedBlueprints.map(bp => (
                   <div key={bp.id} onClick={() => handleEditSaved(bp)} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group flex flex-col justify-between h-80 relative cursor-pointer overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => handleDeleteSaved(bp.id, e)} className="p-3 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                      <div className="space-y-4">
                        <div className="inline-flex px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest">{bp.classId} &bull; {bp.examType}</div>
                        <h3 className="font-black text-slate-800 text-2xl leading-tight group-hover:text-indigo-600 transition-colors">{bp.name}</h3>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex flex-col">
                           <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Last Updated</span>
                           <span className="text-sm font-bold text-slate-600">{new Date(bp.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">&rarr;</div>
                      </div>
                   </div>
                 ))}
                 
                 {savedBlueprints.length === 0 && (
                   <div className="col-span-full py-40 text-center border-4 border-dashed border-slate-200 rounded-[4rem] text-slate-300 font-black text-2xl uppercase tracking-[0.2em] flex flex-col items-center gap-6">
                     <div className="bg-slate-100 p-8 rounded-full">
                       <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     </div>
                     No Proformas Created Yet
                   </div>
                 )}
              </div>
            </div>
          ) : dashboardMode === 'setup' ? (
            <BlueprintSetup classes={classes} paperTypes={paperTypes} onCancel={() => setDashboardMode('list')} onConfirm={handleConfirmSetup} />
          ) : (
            <div className="animate-in max-w-[1500px] mx-auto pb-20">
               <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 md:px-10 md:py-8 rounded-[3rem] border border-slate-200 shadow-xl mb-12 no-print gap-6">
                  <div className="flex items-center gap-8">
                    <button onClick={() => setDashboardMode('list')} className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all shadow-sm">&larr;</button>
                    <div>
                      <h2 className="font-black text-3xl text-slate-800 leading-none">{activeBlueprint?.name}</h2>
                      <div className="flex items-center gap-3 mt-3">
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Active Analysis Session</span>
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">{activeBlueprint?.maxScore} Marks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleSave} className="flex-1 md:flex-none bg-indigo-600 text-white px-12 py-4 rounded-[2rem] font-black text-sm shadow-2xl shadow-indigo-600/30 hover:-translate-y-1 transition-all">Save Matrix</button>
                  </div>
               </div>
               {activeBlueprint && activeSubject && (
                 <AnalysisReport 
                    blueprint={activeBlueprint} 
                    subject={activeSubject} 
                    paperPattern={paperTypes.find(p => p.id === activeBlueprint.paperTypeId)}
                    onUpdateEntry={(update, idx) => {
                      setActiveBlueprint(prev => {
                        if (!prev) return null;
                        const newEntries = [...prev.entries];
                        if (update === null) newEntries.splice(idx, 1);
                        else newEntries[idx] = update;
                        return { ...prev, entries: newEntries };
                      });
                    }}
                    onAddEntry={(e) => setActiveBlueprint(prev => prev ? {...prev, entries: [...prev.entries, e]} : null)}
                    onSetEntries={(e) => setActiveBlueprint(prev => prev ? {...prev, entries: e} : null)}
                    onUpdateOverrides={(key, val, type) => {
                      setActiveBlueprint(prev => {
                        if (!prev) return null;
                        const overrides = type === 'name' ? { ...prev.topicNameOverrides } : { ...prev.objectiveOverrides };
                        overrides[key] = val;
                        return { ...prev, [type === 'name' ? 'topicNameOverrides' : 'objectiveOverrides']: overrides };
                      });
                    }}
                 />
               )}
            </div>
          )
        ) : (
          <div className="max-w-6xl mx-auto pb-20 animate-in">
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
          </div>
        )}
      </main>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </div>
  );
};

export default App;
