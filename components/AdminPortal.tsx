
import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, BookOpen, Settings, FileType, List, Users, Menu, X, LogOut, FileText, ChevronLeft, Save, Printer, Download, ClipboardList, RefreshCw, CheckCircle
} from 'lucide-react';
import { User, Blueprint, ClassLevel, SubjectType, ExamTerm, BlueprintItem, Curriculum, QuestionPaperType } from '../types';
import AdminDashboard from './AdminDashboard';
import AdminCurriculumManager from './AdminCurriculumManager';
import AdminExamConfigManager from './AdminExamConfigManager';
import AdminPaperTypeManager from './AdminPaperTypeManager';
import AdminUserManager from './AdminUserManager';
import AdminDiscourseManager from './AdminDiscourseManager';
import AdminQuestionPaperManager from './AdminQuestionPaperManager';
import AdminQuestionConsolidator from './AdminQuestionConsolidator';
import AnswerKeyView from './AnswerKeyView';
import { getCurriculum, getFilteredCurriculum, getQuestionPaperTypes, saveBlueprint, getDefaultFormat, getDefaultKnowledge, generateBlueprintTemplate } from '../services/db';
import { BlueprintMatrix, QuestionEntryForm, ReportsView, SummaryTable } from '../App';

const AdminPortal = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'curriculum' | 'config' | 'papertype' | 'users' | 'discourses' | 'blueprints' | 'consolidated'>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Viewing/Editing Paper State
    const [viewingBlueprint, setViewingBlueprint] = useState<Blueprint | null>(null);
    const [showReports, setShowReports] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPaperTypes(getQuestionPaperTypes());
    }, []);

    useEffect(() => {
        if (viewingBlueprint) {
            const cur = getCurriculum(viewingBlueprint.classLevel, viewingBlueprint.subject);
            const filtered = getFilteredCurriculum(cur || null, viewingBlueprint.examTerm);
            setCurriculum(filtered);
        } else {
            setCurriculum(null);
        }
    }, [viewingBlueprint]);

    const handleEditBlueprint = (bp: Blueprint) => {
        setViewingBlueprint(bp);
        setShowReports(false);
        setShowQuestions(false);
        setShowAnswerKey(false);
    };

    const handleSaveBlueprint = () => {
        if (!viewingBlueprint) return;
        saveBlueprint(viewingBlueprint);
        alert("Blueprint saved successfully!");
    };

    const updateItem = (id: string, field: keyof BlueprintItem, value: any) => {
        if (!viewingBlueprint) return;
        const updatedItems = viewingBlueprint.items.map(i => i.id === id ? { ...i, [field]: value } : i);
        setViewingBlueprint({ ...viewingBlueprint, items: updatedItems });
    };

    const moveItem = (itemId: string, newUnitId: string, newSectionId: string, newSubUnitId?: string) => {
        if (!viewingBlueprint || !curriculum) return;
        const paperType = paperTypes.find(p => p.id === viewingBlueprint.questionPaperTypeId);
        const newSection = paperType?.sections.find(s => s.id === newSectionId);
        const newUnit = curriculum.units.find(u => u.id === newUnitId);

        if (!newSection || !newUnit) return;

        const updatedItems = viewingBlueprint.items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    unitId: newUnitId,
                    sectionId: newSectionId,
                    subUnitId: newSubUnitId || newUnit.subUnits[0]?.id || 'unknown',
                    marksPerQuestion: newSection.marks,
                    totalMarks: newSection.marks * item.questionCount,
                    itemFormat: getDefaultFormat(newSection.marks),
                    knowledgeLevel: getDefaultKnowledge(newSection.marks)
                };
            }
            return item;
        });
        setViewingBlueprint({ ...viewingBlueprint, items: updatedItems });
    };

    const handleRegeneratePattern = () => {
        if (!viewingBlueprint || !curriculum) return;
        if (!window.confirm("This will replace all current questions with a new random pattern. Continue?")) return;
        const newItems = generateBlueprintTemplate(curriculum, viewingBlueprint.examTerm, viewingBlueprint.questionPaperTypeId);
        setViewingBlueprint({ ...viewingBlueprint, items: newItems, isConfirmed: false });
    };

    const handleConfirmPattern = () => {
        if (!viewingBlueprint) return;
        setViewingBlueprint({ ...viewingBlueprint, isConfirmed: true });
        saveBlueprint({ ...viewingBlueprint, isConfirmed: true });
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'curriculum', label: 'Curriculum & Units', icon: BookOpen },
        { id: 'config', label: 'Exam Weightage', icon: Settings },
        { id: 'papertype', label: 'Paper Types', icon: FileType },
        { id: 'discourses', label: 'Discourses', icon: List },
        { id: 'blueprints', label: 'User Papers', icon: FileText },
        { id: 'consolidated', label: 'Mass View', icon: ClipboardList },
        { id: 'users', label: 'User Management', icon: Users },
    ];

    const renderContent = () => {
        // If viewing a specific paper, show the paper view instead of the list
        if (activeTab === 'blueprints' && viewingBlueprint && curriculum) {
            return (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-2 no-print">
                        <button
                            onClick={() => setViewingBlueprint(null)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {viewingBlueprint.questionPaperTypeName}
                                {viewingBlueprint.isConfirmed && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">Confirmed</span>
                                )}
                            </h2>
                            <p className="text-xs text-secondary">
                                {viewingBlueprint.subject} • Class {viewingBlueprint.classLevel} • {viewingBlueprint.examTerm} • {viewingBlueprint.setId}
                            </p>
                        </div>
                    </div>

                    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md py-2 px-3 border-b flex justify-between items-center no-print shadow-sm gap-2 rounded-xl mb-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowReports(false); setShowQuestions(false); setShowAnswerKey(false); }}
                                className={`px-4 py-2 rounded-lg text-sm transition-all font-bold ${!showReports && !showQuestions && !showAnswerKey ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-secondary hover:bg-gray-200'} `}
                            >
                                Matrix
                            </button>
                            {viewingBlueprint.isConfirmed && (
                                <>
                                    <button
                                        onClick={() => { setShowQuestions(true); setShowReports(false); setShowAnswerKey(false); }}
                                        className={`px-4 py-2 rounded-lg text-sm transition-all font-bold ${showQuestions ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-secondary hover:bg-gray-200'} `}
                                    >
                                        Questions
                                    </button>
                                    <button
                                        onClick={() => { setShowReports(true); setShowQuestions(false); setShowAnswerKey(false); }}
                                        className={`px-4 py-2 rounded-lg text-sm transition-all font-bold ${showReports ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-secondary hover:bg-gray-200'} `}
                                    >
                                        Reports
                                    </button>
                                    <button
                                        onClick={() => { setShowAnswerKey(true); setShowReports(false); setShowQuestions(false); }}
                                        className={`px-4 py-2 rounded-lg text-sm transition-all font-bold ${showAnswerKey ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-secondary hover:bg-gray-200'} `}
                                    >
                                        Answer Key
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {!showReports && !showQuestions && !viewingBlueprint.isConfirmed && (
                                <>
                                    <button
                                        onClick={handleRegeneratePattern}
                                        className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 flex items-center font-bold text-sm transition-all"
                                    >
                                        <RefreshCw className="mr-2" size={18} />
                                        New Pattern
                                    </button>
                                    <button
                                        onClick={handleConfirmPattern}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center font-bold text-sm transition-all"
                                    >
                                        <CheckCircle className="mr-2" size={18} />
                                        Confirm
                                    </button>
                                </>
                            )}
                            <button onClick={handleSaveBlueprint} className={`bg-green-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-700 flex items-center font-bold text-sm transition-all ${showAnswerKey ? 'hidden' : ''}`}>
                                <Save className="mr-2" size={18} />
                                Save
                            </button>
                        </div>
                    </div>

                    <div ref={printRef} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${showAnswerKey ? 'p-0 border-none bg-transparent shadow-none' : ''}`}>
                        {!showReports && !showQuestions && !showAnswerKey && (
                            <BlueprintMatrix
                                blueprint={viewingBlueprint}
                                curriculum={curriculum}
                                onUpdateItem={updateItem}
                                onMoveItem={moveItem}
                                paperType={paperTypes.find(p => p.id === viewingBlueprint.questionPaperTypeId)}
                                readOnly={viewingBlueprint.isConfirmed}
                            />
                        )}

                        {showQuestions && !showAnswerKey && (
                            <QuestionEntryForm
                                blueprint={viewingBlueprint}
                                onUpdateItem={updateItem}
                            />
                        )}

                        {showReports && !showAnswerKey && (
                            <ReportsView
                                blueprint={viewingBlueprint}
                                curriculum={curriculum}
                            />
                        )}

                        {showAnswerKey && (
                            <AnswerKeyView
                                blueprint={viewingBlueprint}
                                curriculum={curriculum}
                            />
                        )}

                        {!showReports && !showAnswerKey && viewingBlueprint && (
                            <div className="mt-8 pt-8 border-t">
                                <SummaryTable items={viewingBlueprint.items} />
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'curriculum': return <AdminCurriculumManager />;
            case 'config': return <AdminExamConfigManager />;
            case 'papertype': return <AdminPaperTypeManager />;
            case 'users': return <AdminUserManager />;
            case 'discourses': return <AdminDiscourseManager />;
            case 'blueprints': return <AdminQuestionPaperManager onEditBlueprint={handleEditBlueprint} />;
            case 'consolidated': return <AdminQuestionConsolidator />;
            default: return <AdminDashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            {/* Mobile Header */}
            <header className="bg-white shadow p-4 flex justify-between items-center md:hidden z-20 sticky top-0 no-print">
                <div className="font-bold text-lg text-blue-700">Admin Portal</div>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-600 focus:outline-none">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 transition duration-200 ease-in-out
                bg-white w-64 shadow-lg z-30 flex flex-col no-print
            `}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between md:justify-center">
                    <h1 className="text-2xl font-bold text-blue-700 flex items-center">
                        <Settings className="mr-2" /> Admin
                    </h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); setViewingBlueprint(null); }}
                                className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={20} className="mr-3" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email || user.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-100"
                    >
                        <LogOut size={18} className="mr-2" /> Logout
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden no-print"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8">
                <div className="max-w-5xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminPortal;
