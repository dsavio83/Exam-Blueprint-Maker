
import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, BookOpen, Settings, FileType, List, Users, Menu, X, LogOut, FileText, ChevronLeft, Save, Printer, Download, ClipboardList, RefreshCw, CheckCircle
} from 'lucide-react';
import { User, Blueprint, ClassLevel, SubjectType, ExamTerm, BlueprintItem, Curriculum, QuestionPaperType, Discourse } from '../types';
import AdminDashboard from './AdminDashboard';
import AdminCurriculumManager from './AdminCurriculumManager';
import AdminExamConfigManager from './AdminExamConfigManager';
import AdminPaperTypeManager from './AdminPaperTypeManager';
import AdminUserManager from './AdminUserManager';
import AdminDiscourseManager from './AdminDiscourseManager';
import AdminQuestionPaperManager from './AdminQuestionPaperManager';
import AdminQuestionConsolidator from './AdminQuestionConsolidator';
import AnswerKeyView from './AnswerKeyView';
import { getCurriculum, getQuestionPaperTypes, saveBlueprint, getDefaultFormat, getDefaultKnowledge, generateBlueprintTemplate, getDB, initDB, filterCurriculumByTerm, getDiscourses } from '../services/db';
import { BlueprintMatrix } from './BlueprintMatrix';
import { ReportsView } from './ReportsView';
import { SummaryTable } from './SummaryTable';
import { QuestionEntryForm } from './QuestionEntryForm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const [discourses, setDiscourses] = useState<Discourse[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            const types = await getQuestionPaperTypes();
            setPaperTypes(types);
            const disc = await getDiscourses();
            setDiscourses(disc);
        };
        load();
    }, []);

    useEffect(() => {
        const load = async () => {
            if (viewingBlueprint) {
                const cur = await getCurriculum(viewingBlueprint.classLevel, viewingBlueprint.subject);
                const db = getDB() || await initDB();
                setCurriculum(filterCurriculumByTerm(db, cur, viewingBlueprint.examTerm));
            } else {
                setCurriculum(null);
            }
        };
        load();
    }, [viewingBlueprint]);

    const handleEditBlueprint = (bp: Blueprint) => {
        setViewingBlueprint(bp);
        setShowReports(false);
        setShowQuestions(false);
        setShowAnswerKey(false);
    };

    const handleSaveBlueprint = async () => {
        if (!viewingBlueprint) return;
        await saveBlueprint(viewingBlueprint);
        alert("Blueprint saved successfully!");
    };

    const updateItem = (updatedItem: BlueprintItem) => {
        if (!viewingBlueprint) return;
        const newItems = viewingBlueprint.items.map(item =>
            item.id === updatedItem.id ? updatedItem : item
        );
        setViewingBlueprint({ ...viewingBlueprint, items: newItems });
    };

    const updateItemField = (id: string, field: keyof BlueprintItem, val: any) => {
        if (!viewingBlueprint) return;
        const newItems = viewingBlueprint.items.map(item =>
            item.id === id ? { ...item, [field]: val } : item
        );
        setViewingBlueprint({ ...viewingBlueprint, items: newItems });
    };

    const handleDownloadPDF = async (type: 'all' | 'report1' | 'report2' | 'report3' | 'answerKey' = 'all') => {
        if (!viewingBlueprint) return;
        const MARGIN = 10;
        const pdfWidthPortrait = 210;
        const contentWidthPortrait = pdfWidthPortrait - (MARGIN * 2);

        let pdf = new jsPDF('p', 'mm', 'a4');
        let firstPage = true;

        const addPortraitPage = async (id: string) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (!firstPage) pdf.addPage('a4', 'p');
            const canvas = await html2canvas(el, {
                scale: 2.5,
                useCORS: true,
                logging: false,
                windowWidth: 1024,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const tamilElements = clonedDoc.querySelectorAll('.tamil-font');
                    tamilElements.forEach(el => {
                        (el as HTMLElement).style.fontFamily = "'TAU-Pallai', 'TAU-Palaai', 'Noto Serif', serif";
                    });
                }
            });
            const img = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidthPortrait) / canvas.width;
            pdf.addImage(img, 'PNG', MARGIN, MARGIN, contentWidthPortrait, imgHeight);
            firstPage = false;
        };

        const chunkItems = (items: BlueprintItem[], size: number) => {
            const chunks = [];
            for (let i = 0; i < items.length; i += size) {
                chunks.push(items.slice(i, i + size));
            }
            return chunks;
        };
        const chunkedItems = chunkItems(viewingBlueprint.items, 15);

        if (type === 'report2' || type === 'report3') {
            pdf = new jsPDF('l', 'mm', 'a4');
        }

        if (type === 'all' || type === 'report1') {
            const pageIds = ['report-page-1', 'report-page-2'];
            for (const id of pageIds) await addPortraitPage(id);
        }

        if (type === 'all' || type === 'report2') {
            const pdfWidthLandscape = 297;
            const pdfHeightLandscape = 210;
            const contentWidthLandscape = pdfWidthLandscape - (MARGIN * 2);
            const contentHeightLandscape = pdfHeightLandscape - (MARGIN * 2);

            let pageIdx = 0;
            while (true) {
                const el = document.getElementById(`report-item-analysis-page-${pageIdx}`);
                if (!el) break;
                if (!firstPage) pdf.addPage('a4', 'l');
                const canvas = await html2canvas(el, {
                    scale: 2.5,
                    useCORS: true,
                    logging: false,
                    windowWidth: 1600,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        const headers = clonedDoc.querySelectorAll('th, .table-header-cell');
                        headers.forEach(h => {
                            (h as HTMLElement).style.backgroundColor = h.classList.contains('bg-blue-600') ? '#2563eb' :
                                h.classList.contains('bg-gray-100') ? '#f3f4f6' : '#f9fafb';
                            (h as HTMLElement).style.color = h.classList.contains('bg-blue-600') ? '#ffffff' : '#000000';
                            (h as HTMLElement).style.visibility = 'visible';
                            (h as HTMLElement).style.opacity = '1';
                        });
                    }
                });
                const img = canvas.toDataURL('image/png');
                let imgWidth = contentWidthLandscape;
                let imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (imgHeight > contentHeightLandscape) {
                    const ratio = contentHeightLandscape / imgHeight;
                    imgHeight = contentHeightLandscape;
                    imgWidth = imgWidth * ratio;
                    pdf.addImage(img, 'PNG', MARGIN + (contentWidthLandscape - imgWidth) / 2, MARGIN, imgWidth, imgHeight);
                } else {
                    pdf.addImage(img, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight);
                }
                firstPage = false;
                pageIdx++;
            }
        }

        if (type === 'all' || type === 'report3') {
            const matrixEl = document.getElementById('report-page-blueprint-matrix');
            if (matrixEl) {
                const canvas = await html2canvas(matrixEl, {
                    scale: 2.5,
                    useCORS: true,
                    logging: false,
                    windowWidth: 1920,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        const headers = clonedDoc.querySelectorAll('th');
                        headers.forEach(h => {
                            (h as HTMLElement).style.backgroundColor = h.classList.contains('bg-orange-200') ? '#fed7aa' :
                                h.classList.contains('bg-orange-100') ? '#ffedd5' :
                                    h.classList.contains('bg-blue-50') ? '#eff6ff' :
                                        h.classList.contains('bg-green-50') ? '#f0fdf4' :
                                            h.classList.contains('bg-gray-100') ? '#f3f4f6' : '#f9fafb';
                            (h as HTMLElement).style.color = '#000000';
                            (h as HTMLElement).style.opacity = '1';
                            (h as HTMLElement).style.visibility = 'visible';
                        });
                    }
                });
                const img = canvas.toDataURL('image/png');
                const pxToMm = 0.264583;
                const imgWidthMm = 1920 * pxToMm;
                const imgHeightMm = (canvas.height / 2.5) * pxToMm;
                const pageWidth = imgWidthMm + (MARGIN * 2);
                const pageHeight = imgHeightMm + (MARGIN * 2);

                if (!firstPage) pdf.addPage([pageWidth, pageHeight], 'l');
                else pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: [pageWidth, pageHeight] });

                pdf.addImage(img, 'PNG', MARGIN, MARGIN, imgWidthMm, imgHeightMm);
                firstPage = false;
            }
        }

        if (type === 'all' || type === 'answerKey') {
            await addPortraitPage('report-answer-key');
        }

        pdf.save(`Blueprint_Report_${viewingBlueprint.classLevel}_${viewingBlueprint.subject}_${type}.pdf`);
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
        
        const db = getDB();
        if (!db) {
            alert("Database not initialized. Please refresh.");
            return;
        }

        const newItems = generateBlueprintTemplate(db, curriculum, viewingBlueprint.examTerm, viewingBlueprint.questionPaperTypeId);
        setViewingBlueprint({ ...viewingBlueprint, items: newItems, isConfirmed: false });
    };

    const handleConfirmPattern = async () => {
        if (!viewingBlueprint) return;
        const confirmed = { ...viewingBlueprint, isConfirmed: true };
        setViewingBlueprint(confirmed);
        await saveBlueprint(confirmed);
        alert("Blueprint pattern confirmed!");
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
                                onUpdateItem={updateItemField}
                                paperType={paperTypes.find(p => p.id === viewingBlueprint.questionPaperTypeId)}
                            />
                        )}

                        {showReports && !showAnswerKey && (
                            <ReportsView
                                blueprint={viewingBlueprint}
                                curriculum={curriculum}
                                discourses={discourses}
                                onDownloadPDF={handleDownloadPDF}
                                onDownloadWord={async () => {}}
                            />
                        )}

                        {showAnswerKey && (
                            <AnswerKeyView
                                blueprint={viewingBlueprint}
                                curriculum={curriculum}
                                discourses={discourses}
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
