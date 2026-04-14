import React, { useState, useEffect, useRef } from 'react';
import {
    Role, ClassLevel, SubjectType, ExamTerm,
    BlueprintItem, Blueprint, ItemFormat, KnowledgeLevel, CognitiveProcess, Unit, SubUnit, Curriculum, User, QuestionPaperType
} from '@/types';
import {
    generateBlueprintTemplate, getCurriculum,
    getDB, initDB, saveBlueprint, deleteBlueprint, getQuestionPaperTypes, getUsers,
    getDefaultFormat, getDefaultKnowledge, getAllAccessibleBlueprints, filterCurriculumByTerm
} from '@/services/db';
import {
    Trash2, Plus, Download, LogOut, FileText,
    Settings, Edit2, Save, Printer, UserCircle, LayoutDashboard, ChevronLeft, List, CheckCircle, RefreshCw, Clock,
    Share2, Lock, ChevronDown, ChevronUp
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import BlueprintSharingModal from './BlueprintSharingModal';
import { DocExportService } from '@/services/docExport';
import { QuestionEntryForm } from './QuestionEntryForm';
import { SummaryTable } from './SummaryTable';
import { BlueprintMatrix } from './BlueprintMatrix';
import { ReportsView } from './ReportsView';

interface UserDashboardProps {
    user: User;
    onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout }) => {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [currentBlueprint, setCurrentBlueprint] = useState<Blueprint | null>(null);
    const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel.CLASS_10);
    const [selectedSubject, setSelectedSubject] = useState<SubjectType>(SubjectType.TAMIL_AT);
    const [selectedTerm, setSelectedTerm] = useState<ExamTerm>(ExamTerm.FIRST);
    const [selectedSet, setSelectedSet] = useState('Set A');
    const [selectedPaperType, setSelectedPaperType] = useState<string>('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
    const [showReports, setShowReports] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [isConfigExpanded, setIsConfigExpanded] = useState(true);
    const [sharingBlueprintId, setSharingBlueprintId] = useState<string | null>(null);
    const [filterView, setFilterView] = useState<'all' | 'owned' | 'shared'>('all');
    
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            const [bps, pts, usersList] = await Promise.all([
                getAllAccessibleBlueprints(user.id),
                getQuestionPaperTypes(),
                getUsers()
            ]);
            setBlueprints(bps);
            setPaperTypes(pts);
            setAllUsers(usersList);
        };
        load();
    }, [user.id, view]);

    useEffect(() => {
        const loadCurriculum = async () => {
            if (view === 'create' || view === 'edit') {
                const cur = await getCurriculum(selectedClass, selectedSubject);
                const db = getDB() || await initDB();
                setCurriculum(filterCurriculumByTerm(db, cur, selectedTerm));
            }
        };
        loadCurriculum();
    }, [selectedClass, selectedSubject, selectedTerm, view]);

    useEffect(() => {
        if (currentBlueprint?.isConfirmed) {
            setIsConfigExpanded(false);
        } else {
            setIsConfigExpanded(true);
        }
    }, [currentBlueprint?.isConfirmed]);

    const handleCreateNew = () => {
        setCurrentBlueprint(null);
        setSelectedClass(ClassLevel.CLASS_10);
        setSelectedSubject(SubjectType.TAMIL_AT);
        setSelectedTerm(ExamTerm.FIRST);
        setSelectedSet('Set A');
        setSelectedAcademicYear('2025-2026');
        setSelectedPaperType('');
        setShowReports(false);
        setShowQuestions(false);
        setIsConfigExpanded(true);
        setView('create');
    };

    const handleEdit = (bp: Blueprint) => {
        if (bp.isLocked) {
            alert("This question paper is locked by the admin and cannot be edited.");
            return;
        }
        setCurrentBlueprint(bp);
        setSelectedClass(bp.classLevel);
        setSelectedSubject(bp.subject);
        setSelectedTerm(bp.examTerm);
        setSelectedSet(bp.setId || 'Set A');
        setSelectedPaperType(bp.questionPaperTypeId || '');
        setShowReports(false);
        setShowQuestions(false);
        setView('edit');
    };

    const handleDelete = async (id: string) => {
        const bp = blueprints.find(b => b.id === id);
        if (bp?.isLocked) {
            alert("This question paper is locked by the admin and cannot be deleted.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this blueprint?")) {
            await deleteBlueprint(id);
            const updated = await getAllAccessibleBlueprints(user.id);
            setBlueprints(updated);
        }
    };

    const handleGenerate = async () => {
        if (!curriculum) return alert("Curriculum not found for selected Class/Subject!");
        if (!selectedPaperType) return alert("Please select a Question Paper Type.");

        const db = getDB();
        if (!db) await initDB();
        
        const items = generateBlueprintTemplate(getDB()!, curriculum, selectedTerm, selectedPaperType);
        const paperType = paperTypes.find(p => p.id === selectedPaperType);

        const newBlueprint: Blueprint = {
            id: Math.random().toString(36).substr(2, 9),
            examTerm: selectedTerm,
            classLevel: selectedClass,
            subject: selectedSubject,
            questionPaperTypeId: selectedPaperType,
            questionPaperTypeName: paperType?.name || 'Unknown',
            totalMarks: paperType?.totalMarks || 0,
            items,
            createdAt: new Date().toISOString(),
            setId: selectedSet,
            academicYear: selectedAcademicYear,
            ownerId: user.id,
            sharedWith: [],
            isConfirmed: false
        };
        setCurrentBlueprint(newBlueprint);
    };

    const handleRegeneratePattern = async () => {
        if (!currentBlueprint || !curriculum) return;
        if (!window.confirm("This will replace all current questions with a new random pattern. Continue?")) return;
        
        const db = getDB();
        if (!db) await initDB();

        const newItems = generateBlueprintTemplate(getDB()!, curriculum, currentBlueprint.examTerm, currentBlueprint.questionPaperTypeId);
        setCurrentBlueprint({ ...currentBlueprint, items: newItems, isConfirmed: false });
    };

    const handleConfirmPattern = async () => {
        if (!currentBlueprint) return;
        const confirmedBlueprint = { ...currentBlueprint, isConfirmed: true };
        setCurrentBlueprint(confirmedBlueprint);
        await saveBlueprint(confirmedBlueprint);
        alert("Blueprint pattern confirmed!");
    };

    const handleSaveToDB = async () => {
        if (!currentBlueprint) return;
        await saveBlueprint(currentBlueprint);
        const updated = await getAllAccessibleBlueprints(user.id);
        setBlueprints(updated);
        alert("Blueprint saved successfully!");
    };

    const handleDownloadPDF = async (type: string = 'all') => {
        if (!currentBlueprint) return;
        
        let pdf = new jsPDF('p', 'mm', 'a4');
        const MARGIN = 10;
        const pdfWidthPortrait = 210;
        const contentWidthPortrait = pdfWidthPortrait - (MARGIN * 2);

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
            });
            const img = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidthPortrait) / canvas.width;
            pdf.addImage(img, 'PNG', MARGIN, MARGIN, contentWidthPortrait, imgHeight);
            firstPage = false;
        };

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
                });
                const img = canvas.toDataURL('image/png');
                const pxToMm = 0.264583;
                const imgWidthMm = 1920 * pxToMm;
                const imgHeightMm = (canvas.height / 2.5) * pxToMm;
                const pageWidth = imgWidthMm + (MARGIN * 2);
                const pageHeight = imgHeightMm + (MARGIN * 2);

                if (!firstPage) {
                    pdf.addPage([pageWidth, pageHeight], 'l');
                } else {
                    pdf = new jsPDF({
                        orientation: 'l',
                        unit: 'mm',
                        format: [pageWidth, pageHeight]
                    });
                }
                pdf.addImage(img, 'PNG', MARGIN, MARGIN, imgWidthMm, imgHeightMm);
                firstPage = false;
            }
        }

        if (type === 'all' || type === 'answerKey') {
            const akEl = document.getElementById('report-answer-key');
            if (akEl) {
                if (!firstPage) pdf.addPage('a4', 'p');
                const canvas = await html2canvas(akEl, {
                    scale: 2.5,
                    useCORS: true,
                    logging: false,
                    windowWidth: 1024,
                    backgroundColor: '#ffffff',
                });
                const img = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * contentWidthPortrait) / canvas.width;
                pdf.addImage(img, 'PNG', MARGIN, MARGIN, contentWidthPortrait, imgHeight);
                firstPage = false;
            }
        }

        pdf.save(`blueprint_report_${currentBlueprint.id}.pdf`);
    };

    const handleDownloadWord = async (type: string = 'all') => {
        if (!currentBlueprint || !curriculum) return;

        try {
            if (type === 'report1' || type === 'all') await DocExportService.exportReport1(currentBlueprint, curriculum);
            if (type === 'report2' || type === 'all') await DocExportService.exportReport2(currentBlueprint, curriculum);
            if (type === 'report3' || type === 'all') await DocExportService.exportReport3(currentBlueprint, curriculum);
            if (type === 'answerKey' || type === 'all') await DocExportService.exportAnswerKey(currentBlueprint, curriculum);
        } catch (error) {
            console.error("Word export failed:", error);
            alert("Failed to export Word document.");
        }
    };

    const updateItem = (id: string, field: keyof BlueprintItem, value: any) => {
        if (!currentBlueprint) return;
        const updatedItems = currentBlueprint.items.map(i => {
            if (i.id === id) {
                const updated = { ...i, [field]: value };

                // User Requirement: 1-mark (option) questions must be Awareness/Knowledge level (BASIC)
                if (updated.marksPerQuestion === 1) {
                    updated.knowledgeLevel = KnowledgeLevel.BASIC;
                    updated.knowledgeLevelB = KnowledgeLevel.BASIC;
                }

                // User Requirement: Options (A and B) must be at the same knowledge level
                if (updated.hasInternalChoice) {
                    if (field === 'knowledgeLevel') {
                        updated.knowledgeLevelB = value as KnowledgeLevel;
                    } else if (field === 'knowledgeLevelB') {
                        updated.knowledgeLevel = value as KnowledgeLevel;
                    }
                }

                return updated;
            }
            return i;
        });
        setCurrentBlueprint({ ...currentBlueprint, items: updatedItems });
    };

    const moveItem = (itemId: string, newUnitId: string, newSectionId: string, newSubUnitId?: string) => {
        if (!currentBlueprint || !curriculum) return;
        const paperType = paperTypes.find(p => p.id === currentBlueprint.questionPaperTypeId);
        const newSection = paperType?.sections.find(s => s.id === newSectionId);
        const newUnit = curriculum.units.find(u => u.id === newUnitId);

        if (!newSection || !newUnit) return;

        const updatedItems = currentBlueprint.items.map(item => {
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
        setCurrentBlueprint({ ...currentBlueprint, items: updatedItems });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 text-black">
            <header className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-30 no-print">
                <div className="flex items-center gap-2">
                    {view !== 'list' && (
                        <button onClick={() => setView('list')} className="mr-2 text-gray-500 hover:text-blue-600">
                            <ChevronLeft />
                        </button>
                    )}
                    <h1 className="font-bold text-blue-700 flex items-center text-lg">
                        <FileText className="mr-2" /> Blueprint System
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
                    <button onClick={onLogout} title="Logout"><LogOut size={20} className="text-gray-500 hover:text-red-500" /></button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4">

                {/* LIST VIEW */}
                {view === 'list' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Blueprints</h2>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setFilterView('all')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterView === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterView('owned')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterView === 'owned' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        My Blueprints
                                    </button>
                                    <button
                                        onClick={() => setFilterView('shared')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterView === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Shared with Me
                                    </button>
                                </div>
                            </div>
                            <button onClick={handleCreateNew} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center">
                                <Plus className="mr-2" /> Create New
                            </button>
                        </div>

                        {(() => {
                            const filteredBlueprints = blueprints.filter(bp => {
                                if (bp.isHidden) return false;
                                if (filterView === 'owned') return bp.ownerId === user.id;
                                if (filterView === 'shared') return bp.ownerId !== user.id;
                                return true;
                            });

                            return filteredBlueprints.length === 0 ? (
                                <div className="bg-white p-12 text-center rounded shadow text-gray-500">
                                    <List size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No blueprints found.</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded shadow overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-100 border-b">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                                <th className="p-4 font-semibold text-gray-600">Date</th>
                                                <th className="p-4 font-semibold text-gray-600">Paper Type</th>
                                                <th className="p-4 font-semibold text-gray-600">Class</th>
                                                <th className="p-4 font-semibold text-gray-600">Subject</th>
                                                <th className="p-4 font-semibold text-gray-600">Term</th>
                                                <th className="p-4 font-semibold text-gray-600">Set</th>
                                                <th className="p-4 font-semibold text-gray-600 text-center">Marks</th>
                                                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBlueprints.map(bp => {
                                                const isOwner = bp.ownerId === user.id;
                                                const ownerUser = !isOwner ? allUsers.find(u => u.id === bp.ownerId) : null;

                                                return (
                                                    <tr key={bp.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-4">
                                                            <div className="flex flex-col gap-1">
                                                                {isOwner ? (
                                                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit">
                                                                        <UserCircle size={12} />
                                                                        Owner
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit">
                                                                        <Share2 size={12} />
                                                                        Shared
                                                                    </span>
                                                                )}
                                                                {bp.isConfirmed && (
                                                                    <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit">
                                                                        <CheckCircle size={12} />
                                                                        Confirmed
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-500">{new Date(bp.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-4 font-medium text-blue-600">
                                                            {bp.questionPaperTypeName || 'N/A'}
                                                            {!isOwner && ownerUser && <div className="text-xs text-gray-500 mt-1">by {ownerUser.name}</div>}
                                                        </td>
                                                        <td className="p-4">Class {bp.classLevel}</td>
                                                        <td className="p-4">{bp.subject}</td>
                                                        <td className="p-4 text-sm">{bp.examTerm}</td>
                                                        <td className="p-4 text-sm">{bp.setId || 'Set A'}</td>
                                                        <td className="p-4 text-center">{bp.totalMarks}</td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(bp)}
                                                                    className={`${bp.isLocked ? 'text-gray-400' : 'text-blue-600'} hover:underline flex items-center gap-1`}
                                                                >
                                                                    {bp.isLocked && <Lock size={14} />}
                                                                    Edit
                                                                </button>
                                                                {isOwner && (
                                                                    <>
                                                                        <button onClick={() => setSharingBlueprintId(bp.id)} className="text-green-600 hover:underline flex items-center gap-1"><Share2 size={14} /> Share</button>
                                                                        <button onClick={() => handleDelete(bp.id)} className={`${bp.isLocked ? 'text-gray-300' : 'text-red-500'} hover:underline`} disabled={bp.isLocked}>Delete</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* CREATE / EDIT VIEW */}
                {(view === 'create' || view === 'edit') && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 no-print overflow-hidden">
                            <div
                                className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                            >
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Settings size={20} className="text-blue-600" />
                                    {view === 'create' ? 'Create Configuration' : 'Edit Configuration'}
                                    {currentBlueprint?.isConfirmed && (
                                        <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded ml-2 uppercase">Confirmed</span>
                                    )}
                                </h3>
                                <div className="text-gray-400">
                                    {isConfigExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>

                            {isConfigExpanded && (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Question Paper Type <span className="text-red-500">*</span></label>
                                            <select
                                                disabled={view === 'edit' || currentBlueprint?.isConfirmed}
                                                value={selectedPaperType}
                                                onChange={e => setSelectedPaperType(e.target.value)}
                                                className="w-full border p-2 rounded bg-gray-50 focus:border-blue-500 outline-none disabled:opacity-60"
                                            >
                                                <option value="">Select Type</option>
                                                {paperTypes.map(pt => (
                                                    <option key={pt.id} value={pt.id}>{pt.name} ({pt.totalMarks} Marks)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Class</label>
                                            <select
                                                disabled={view === 'edit' || currentBlueprint?.isConfirmed}
                                                value={selectedClass}
                                                onChange={e => setSelectedClass(parseInt(e.target.value, 10) as ClassLevel)}
                                                className="w-full border p-2 rounded bg-gray-50 disabled:opacity-60"
                                            >
                                                {Object.values(ClassLevel).filter(v => typeof v === 'number').map(v => <option key={v} value={v}>Class {v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Subject</label>
                                            <select
                                                disabled={view === 'edit' || currentBlueprint?.isConfirmed}
                                                value={selectedSubject}
                                                onChange={e => setSelectedSubject(e.target.value as SubjectType)}
                                                className="w-full border p-2 rounded bg-gray-50 disabled:opacity-60"
                                            >
                                                {Object.values(SubjectType).map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Term</label>
                                            <select
                                                disabled={view === 'edit' || currentBlueprint?.isConfirmed}
                                                value={selectedTerm}
                                                onChange={e => setSelectedTerm(e.target.value as ExamTerm)}
                                                className="w-full border p-2 rounded bg-gray-50 disabled:opacity-60"
                                            >
                                                {Object.values(ExamTerm).map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Set</label>
                                            <select
                                                className="w-full border p-2 rounded bg-gray-50 focus:border-blue-500 outline-none disabled:opacity-60"
                                                disabled={view === 'edit' || currentBlueprint?.isConfirmed}
                                                value={selectedSet}
                                                onChange={(e) => setSelectedSet(e.target.value)}
                                            >
                                                <option value="Set A">Set A</option>
                                                <option value="Set B">Set B</option>
                                                <option value="Set C">Set C</option>
                                                <option value="Set D">Set D</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                            <input
                                                type="text"
                                                className="w-full border p-2 rounded disabled:opacity-60"
                                                disabled={currentBlueprint?.isConfirmed}
                                                value={selectedAcademicYear}
                                                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                                                placeholder="e.g. 2025-2026"
                                            />
                                        </div>
                                    </div>
                                    {view === 'create' && !currentBlueprint?.isConfirmed && (
                                        <div className="mt-4 text-right">
                                            <button onClick={handleGenerate} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">Generate Matrix</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {currentBlueprint && curriculum && (
                            <div className="space-y-6">
                                <div className="sticky top-[53px] z-20 bg-white/90 backdrop-blur-md py-2 px-3 border-b flex justify-between items-center no-print shadow-md gap-2 transition-all">
                                    <div className="flex gap-2 overflow-x-auto">
                                        <button
                                            onClick={() => { setShowReports(false); setShowQuestions(false); }}
                                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded text-sm md:text-base whitespace-nowrap transition-all font-medium ${!showReports && !showQuestions ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} `}
                                        >
                                            Matrix
                                        </button>
                                        {currentBlueprint.isConfirmed && (
                                            <>
                                                <button
                                                    onClick={() => { setShowQuestions(true); setShowReports(false); }}
                                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded text-sm md:text-base whitespace-nowrap transition-all font-medium ${showQuestions ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} `}
                                                >
                                                    Question Entry
                                                </button>
                                                <button
                                                    onClick={() => { setShowReports(true); setShowQuestions(false); }}
                                                    className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded text-sm md:text-base whitespace-nowrap transition-all font-medium ${showReports ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} `}
                                                >
                                                    Reports
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {!showReports && !showQuestions && !currentBlueprint.isConfirmed && (
                                            <>
                                                <button onClick={handleRegeneratePattern} className="bg-orange-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow-md hover:bg-orange-600 flex items-center font-bold text-sm md:text-base whitespace-nowrap transition-all"><RefreshCw className="mr-1 md:mr-2" size={18} /> New Pattern</button>
                                                <button onClick={handleConfirmPattern} className="bg-blue-600 text-white px-3 py-1.5 md:px-6 md:py-2 rounded shadow-md hover:bg-blue-700 flex items-center font-bold text-sm md:text-base whitespace-nowrap transition-all"><CheckCircle className="mr-1 md:mr-2" size={18} /> Confirm</button>
                                            </>
                                        )}
                                        <button onClick={handleSaveToDB} className="bg-green-600 text-white px-3 py-1.5 md:px-6 md:py-2 rounded shadow hover:bg-green-700 flex items-center font-bold text-sm md:text-base whitespace-nowrap transition-all"><Save className="mr-1 md:mr-2" size={18} /> Save Blueprint</button>
                                    </div>
                                </div>

                                <div ref={printRef} className={`bg-white rounded shadow ${showReports ? 'p-0' : 'p-6'}`}>
                                    {!showReports && !showQuestions && (
                                        <BlueprintMatrix
                                            blueprint={currentBlueprint}
                                            curriculum={curriculum}
                                            onUpdateItem={updateItem}
                                            onMoveItem={moveItem}
                                            paperType={paperTypes.find(p => p.id === currentBlueprint.questionPaperTypeId)}
                                            readOnly={currentBlueprint.isConfirmed}
                                        />
                                    )}

                                    {showQuestions && (
                                        <QuestionEntryForm
                                            blueprint={currentBlueprint}
                                            onUpdateItem={updateItem}
                                            paperType={paperTypes.find(p => p.id === currentBlueprint.questionPaperTypeId)}
                                        />
                                    )}

                                    {showReports && (
                                        <ReportsView
                                            blueprint={currentBlueprint}
                                            curriculum={curriculum}
                                            onDownloadPDF={handleDownloadPDF}
                                            onDownloadWord={handleDownloadWord}
                                        />
                                    )}

                                    {!showReports && currentBlueprint && (
                                        <div className="mt-8 pt-8 border-t px-6 pb-6">
                                            <SummaryTable items={currentBlueprint.items} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {sharingBlueprintId && (
                <BlueprintSharingModal
                    blueprint={blueprints.find(bp => bp.id === sharingBlueprintId)!}
                    currentUserId={user.id}
                    onClose={() => setSharingBlueprintId(null)}
                    onShareComplete={async () => {
                        const updated = await getAllAccessibleBlueprints(user.id);
                        setBlueprints(updated);
                    }}
                />
            )}
        </div>
    );
};

export default UserDashboard;
