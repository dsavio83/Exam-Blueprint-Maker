
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
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
import AdminAssignmentManager from './AdminAssignmentManager';
import AdminTeacherDetailsView from './AdminTeacherDetailsView';
import AnswerKeyView from './AnswerKeyView';
import { getCurriculum, getQuestionPaperTypes, saveBlueprint, getDefaultFormat, getDefaultKnowledge, generateBlueprintTemplate, getDB, initDB, filterCurriculumByTerm, getDiscourses } from '../services/db';
import { DocExportService } from '../services/docExport';
import { BlueprintMatrix } from './BlueprintMatrix';
import { ReportsView } from './ReportsView';
import { SummaryTable } from './SummaryTable';
import { QuestionEntryForm } from './QuestionEntryForm';
import UniversalBlueprintView from './UniversalBlueprintView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminPortal = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'curriculum' | 'config' | 'papertype' | 'users' | 'discourses' | 'blueprints' | 'consolidated' | 'assignment' | 'teacher_details'>(() => {
        const saved = localStorage.getItem('admin_active_tab');
        return (saved as any) || 'dashboard';
    });
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('admin_active_tab', activeTab);
    }, [activeTab]);

    // Viewing/Editing Paper State
    const [viewingBlueprint, setViewingBlueprint] = useState<Blueprint | null>(null);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [discourses, setDiscourses] = useState<Discourse[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const blueprintRef = useRef<Blueprint | null>(null);

    useEffect(() => {
        blueprintRef.current = viewingBlueprint;
    }, [viewingBlueprint]);

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
    };

    const handleSaveBlueprint = async () => {
        const latestBlueprint = blueprintRef.current;
        if (!latestBlueprint) return;
        setIsSaving(true);
        try {
            await saveBlueprint(latestBlueprint);
            Swal.fire("Saved", "Blueprint saved successfully!", "success");
        } finally {
            setIsSaving(false);
        }
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
        const newItems = viewingBlueprint.items.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };
            if (field === 'questionCount') {
                updated.totalMarks = updated.marksPerQuestion * (Number(val) || 0);
            }
            if (updated.hasInternalChoice) {
                updated.unitIdB = updated.unitId;
                updated.subUnitIdB = updated.subUnitIdB || updated.subUnitId;
                updated.knowledgeLevelB = updated.knowledgeLevel;
                updated.itemFormatB = updated.itemFormatB || updated.itemFormat;
            } else {
                updated.unitIdB = undefined;
                updated.subUnitIdB = undefined;
                updated.knowledgeLevelB = undefined;
                updated.cognitiveProcessB = undefined;
                updated.itemFormatB = undefined;
            }
            return updated;
        });
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
                        (el as HTMLElement).style.fontFamily = "'TAU-Paalai', 'Noto Serif', serif";
                        (el as HTMLElement).style.fontSize = "14pt";
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

    const handleDownloadWord = async (type: string = 'all') => {
        if (!viewingBlueprint || !curriculum) return;
        try {
            if (type === 'report1' || type === 'all') await DocExportService.exportReport1(viewingBlueprint, curriculum);
            if (type === 'report2' || type === 'all') await DocExportService.exportReport2(viewingBlueprint, curriculum);
            if (type === 'report3' || type === 'all') await DocExportService.exportReport3(viewingBlueprint, curriculum);
            if (type === 'answerKey' || type === 'all') await DocExportService.exportAnswerKey(viewingBlueprint, curriculum, discourses);
        } catch (error) {
            console.error("Word export failed:", error);
            Swal.fire("Error", "Failed to export Word document.", "error");
        }
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
                    knowledgeLevel: getDefaultKnowledge(newSection.marks),
                    unitIdB: item.hasInternalChoice ? newUnitId : undefined,
                    subUnitIdB: item.hasInternalChoice ? (item.subUnitIdB || newSubUnitId || newUnit.subUnits[0]?.id || 'unknown') : undefined,
                    knowledgeLevelB: item.hasInternalChoice ? getDefaultKnowledge(newSection.marks) : undefined,
                    itemFormatB: item.hasInternalChoice ? getDefaultFormat(newSection.marks) : undefined,
                };
            }
            return item;
        });
        setViewingBlueprint({ ...viewingBlueprint, items: updatedItems });
    };

    const handleRegeneratePattern = () => {
        const latestBlueprint = blueprintRef.current;
        if (!latestBlueprint || !curriculum) return;
        
        Swal.fire({
            title: "Regenerate Pattern?",
            text: "This will replace all current questions with a new random pattern. Continue?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, regenerate"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const db = getDB();
                if (!db) {
                    Swal.fire("Error", "Database not initialized. Please refresh.", "error");
                    return;
                }
                const newItems = generateBlueprintTemplate(db, curriculum, latestBlueprint.examTerm, latestBlueprint.questionPaperTypeId);
                setViewingBlueprint({ ...latestBlueprint, items: newItems, isConfirmed: false });
                Swal.fire("Regenerated", "A new pattern has been generated.", "success");
            }
        });
    };

    const handleConfirmPattern = async () => {
        if (!viewingBlueprint) return;
        const confirmed = { ...viewingBlueprint, isConfirmed: true };
        setViewingBlueprint(confirmed);
        await saveBlueprint(confirmed);
        Swal.fire("Confirmed", "Blueprint pattern confirmed successfully!", "success");
    };

    const handleSaveReportSettings = async () => {
        if (!viewingBlueprint) return;
        await saveBlueprint(viewingBlueprint);
        Swal.fire("Saved", "Report settings saved successfully!", "success");
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'curriculum', label: 'Curriculum & Units', icon: BookOpen },
        ...(user.username === 'admin' ? [{ id: 'config', label: 'Exam Weightage', icon: Settings }] : []),
        { id: 'papertype', label: 'Paper Types', icon: FileType },
        { id: 'discourses', label: 'Discourses', icon: List },
        { id: 'blueprints', label: 'User Papers', icon: FileText },
        { id: 'consolidated', label: 'Mass View', icon: ClipboardList },
        { id: 'assignment', label: 'Assign Paper', icon: RefreshCw },
        { id: 'teacher_details', label: 'Teacher Details', icon: Users },
        { id: 'users', label: 'User Management', icon: Settings },
    ];

    const renderContent = () => {
        // If viewing a specific paper, show the paper view instead of the list
        if (activeTab === 'blueprints' && viewingBlueprint && curriculum) {
            return (
                <UniversalBlueprintView
                    blueprint={viewingBlueprint}
                    curriculum={curriculum}
                    paperType={paperTypes.find(p => p.id === viewingBlueprint.questionPaperTypeId)}
                    discourses={discourses}
                    isAdmin={true}
                    onBack={() => setViewingBlueprint(null)}
                    onUpdateItemField={updateItemField}
                    onMoveItem={moveItem}
                    onSave={handleSaveBlueprint}
                    onRegenerate={handleRegeneratePattern}
                    onConfirm={handleConfirmPattern}
                    onDownloadPDF={(type) => handleDownloadPDF(type as any)}
                    onDownloadWord={(type) => handleDownloadWord(type as any)}
                    onUpdateReportSettings={(s, p) => setViewingBlueprint(prev => prev ? { ...prev, reportSettings: s, perReportSettings: p } : null)}
                    onSaveSettings={handleSaveReportSettings}
                    isSaving={isSaving}
                />
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
            case 'assignment': return <AdminAssignmentManager />;
            case 'teacher_details': return <AdminTeacherDetailsView />;
            default: return <AdminDashboard />;
        }
    };

    return (
        <div className="ap-root min-h-screen flex flex-col md:flex-row">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

                :root {
                    --ap-bg: #f8fafc;
                    --ap-surface: #ffffff;
                    --ap-surface2: #f1f5f9;
                    --ap-border: rgba(0,0,0,0.08);
                    --ap-text: #1e293b;
                    --ap-muted: #64748b;
                    --ap-accent: #2563eb;
                    --ap-accent-light: rgba(37, 99, 235, 0.1);
                    --ap-radius: 16px;
                    --ap-font: 'DM Sans', sans-serif;
                    --ap-display: 'Syne', sans-serif;
                }

                .ap-root {
                    background-color: var(--ap-bg);
                    background-image: 
                        radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.05) 0%, transparent 40%);
                    font-family: var(--ap-font);
                    color: var(--ap-text);
                }

                .ap-header {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid var(--ap-border);
                }

                .ap-sidebar {
                    background: var(--ap-surface);
                    border-right: 1px solid var(--ap-border);
                }

                .ap-nav-item {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ap-nav-item--active {
                    background: var(--ap-accent-light);
                    color: var(--ap-accent);
                    font-weight: 600;
                    box-shadow: inset 4px 0 0 -1px var(--ap-accent);
                }

                .ap-nav-item:not(.ap-nav-item--active):hover {
                    background: var(--ap-surface2);
                    color: var(--ap-text);
                    transform: translateX(4px);
                }

                .ap-card {
                    background: var(--ap-surface);
                    border: 1px solid var(--ap-border);
                    border-radius: var(--ap-radius);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                }

                .ap-button-logout {
                    border: 1px solid #fee2e2;
                    color: #dc2626;
                    transition: all 0.2s;
                }

                .ap-button-logout:hover {
                    background: #fef2f2;
                    border-color: #fca5a5;
                }

                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Mobile Header */}
            <header className="ap-header p-4 flex justify-between items-center md:hidden z-20 sticky top-0 no-print">
                <div className="font-bold text-lg text-blue-700 font-display tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <Settings size={18} />
                    </div>
                    Admin Portal
                </div>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none transition-colors">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar */}
            <aside className={`
                ap-sidebar fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 transition duration-300 ease-in-out
                w-64 z-30 h-screen flex flex-col no-print
            `}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 font-display">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Settings size={20} />
                        </div>
                        <span className="tracking-tight">Admin Portal</span>
                    </h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto hide-scrollbar">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); setViewingBlueprint(null); }}
                                className={`w-full flex items-center p-3 rounded-xl ap-nav-item ${isActive ? 'ap-nav-item--active' : 'text-gray-500'}`}
                            >
                                <Icon size={19} className="mr-3" />
                                <span className="text-[15px]">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-50 bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-blue-600 font-bold text-lg">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-[11px] font-medium text-gray-400 truncate uppercase mt-0.5">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center p-2.5 ap-button-logout rounded-xl transition-all font-semibold text-sm"
                    >
                        <LogOut size={16} className="mr-2" /> Logout
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
            <main className={`flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen ${activeTab === 'consolidated' ? 'p-0' : 'p-4 md:p-8'}`}>
                <div className={`${activeTab === 'consolidated' ? 'w-full h-full' : 'max-w-5xl mx-auto'}`}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminPortal;
