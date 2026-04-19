import React, { useState, useEffect, useRef } from 'react';
import {
    Role, ClassLevel, SubjectType, ExamTerm,
    BlueprintItem, Blueprint, ItemFormat, KnowledgeLevel, CognitiveProcess, Unit, SubUnit, Curriculum, User, QuestionPaperType, Discourse
} from '@/types';
import {
    generateBlueprintTemplate, getCurriculum,
    getDB, initDB, saveBlueprint, deleteBlueprint, getQuestionPaperTypes, getUsers,
    getDefaultFormat, getDefaultKnowledge, getAllAccessibleBlueprints, filterCurriculumByTerm, getDiscourses
} from '@/services/db';
import {
    Trash2, Plus, Download, LogOut, FileText,
    Settings, Edit2, Save, Printer, UserCircle, LayoutDashboard, ChevronLeft, List, CheckCircle, RefreshCw, Clock,
    Share2, Lock, ChevronDown, ChevronUp, Sparkles, BookOpen, GraduationCap, Filter
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import BlueprintSharingModal from './BlueprintSharingModal';
import { DocExportService } from '@/services/docExport';
import { QuestionEntryForm } from './QuestionEntryForm';
import { BlueprintMatrix } from './BlueprintMatrix';
import { ReportsView } from './ReportsView';
import { SummaryTable } from './SummaryTable';
import UniversalBlueprintView from './UniversalBlueprintView';
import UserProfile from './UserProfile';

interface UserDashboardProps {
    user: User;
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
}

// ─── Gradient palette per index ───────────────────────────────────────────────
const CARD_GRADIENTS = [
    { from: '#6366f1', to: '#8b5cf6', accent: '#c4b5fd' },
    { from: '#ec4899', to: '#f43f5e', accent: '#fda4af' },
    { from: '#10b981', to: '#059669', accent: '#6ee7b7' },
    { from: '#f59e0b', to: '#ef4444', accent: '#fde68a' },
    { from: '#06b6d4', to: '#3b82f6', accent: '#93c5fd' },
    { from: '#8b5cf6', to: '#ec4899', accent: '#e9d5ff' },
];

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout, onUpdateUser }) => {
    const [view, setView] = useState<'list' | 'create' | 'edit' | 'profile'>('list');
    const [currentBlueprint, setCurrentBlueprint] = useState<Blueprint | null>(null);
    const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel._10);
    const [selectedSubject, setSelectedSubject] = useState<SubjectType>(SubjectType.TAMIL_AT);
    const [selectedTerm, setSelectedTerm] = useState<ExamTerm>(ExamTerm.FIRST);
    const [selectedSet, setSelectedSet] = useState('Set A');
    const [selectedPaperType, setSelectedPaperType] = useState<string>('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
    const [isConfigExpanded, setIsConfigExpanded] = useState(true);
    const [sharingBlueprintId, setSharingBlueprintId] = useState<string | null>(null);
    const [filterView, setFilterView] = useState<'all' | 'owned' | 'shared'>('all');
    const [isSaving, setIsSaving] = useState(false);
    const [animateHeader, setAnimateHeader] = useState(false);

    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [discourses, setDiscourses] = useState<Discourse[]>([]);

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setAnimateHeader(true);
        const load = async () => {
            const [bps, pts, usersList, discList] = await Promise.all([
                getAllAccessibleBlueprints(user.id),
                getQuestionPaperTypes(),
                getUsers(),
                getDiscourses()
            ]);
            setBlueprints(bps);
            setPaperTypes(pts);
            setAllUsers(usersList);
            setDiscourses(discList);
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
        setSelectedClass(ClassLevel._10);
        setSelectedSubject(SubjectType.TAMIL_AT);
        setSelectedTerm(ExamTerm.FIRST);
        setSelectedSet('Set A');
        setSelectedAcademicYear('2025-2026');
        setSelectedPaperType('');
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
        setIsSaving(true);
        try {
            await saveBlueprint(currentBlueprint);
            const updated = await getAllAccessibleBlueprints(user.id);
            setBlueprints(updated);
            alert("Blueprint saved successfully!");
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save blueprint.");
        } finally {
            setIsSaving(false);
        }
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
            const canvas = await html2canvas(el, { scale: 2.5, useCORS: true, logging: false, windowWidth: 1024, backgroundColor: '#ffffff' });
            const img = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidthPortrait) / canvas.width;
            pdf.addImage(img, 'PNG', MARGIN, MARGIN, contentWidthPortrait, imgHeight);
            firstPage = false;
        };
        if (type === 'report2' || type === 'report3') pdf = new jsPDF('l', 'mm', 'a4');
        if (type === 'all' || type === 'report1') {
            for (const id of ['report-page-1', 'report-page-2']) await addPortraitPage(id);
        }
        if (type === 'all' || type === 'report2') {
            const pdfWidthLandscape = 297; const pdfHeightLandscape = 210;
            const contentWidthLandscape = pdfWidthLandscape - (MARGIN * 2);
            const contentHeightLandscape = pdfHeightLandscape - (MARGIN * 2);
            let pageIdx = 0;
            while (true) {
                const el = document.getElementById(`report-item-analysis-page-${pageIdx}`);
                if (!el) break;
                if (!firstPage) pdf.addPage('a4', 'l');
                const canvas = await html2canvas(el, { scale: 2.5, useCORS: true, logging: false, windowWidth: 1600, backgroundColor: '#ffffff' });
                const img = canvas.toDataURL('image/png');
                let imgWidth = contentWidthLandscape;
                let imgHeight = (canvas.height * imgWidth) / canvas.width;
                if (imgHeight > contentHeightLandscape) {
                    const ratio = contentHeightLandscape / imgHeight;
                    imgHeight = contentHeightLandscape; imgWidth = imgWidth * ratio;
                    pdf.addImage(img, 'PNG', MARGIN + (contentWidthLandscape - imgWidth) / 2, MARGIN, imgWidth, imgHeight);
                } else { pdf.addImage(img, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight); }
                firstPage = false; pageIdx++;
            }
        }
        if (type === 'all' || type === 'report3') {
            const matrixEl = document.getElementById('report-page-blueprint-matrix');
            if (matrixEl) {
                const canvas = await html2canvas(matrixEl, { scale: 2.5, useCORS: true, logging: false, windowWidth: 1920, backgroundColor: '#ffffff' });
                const img = canvas.toDataURL('image/png');
                const pxToMm = 0.264583;
                const imgWidthMm = 1920 * pxToMm; const imgHeightMm = (canvas.height / 2.5) * pxToMm;
                const pageWidth = imgWidthMm + (MARGIN * 2); const pageHeight = imgHeightMm + (MARGIN * 2);
                if (!firstPage) { pdf.addPage([pageWidth, pageHeight], 'l'); } else {
                    pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: [pageWidth, pageHeight] });
                }
                pdf.addImage(img, 'PNG', MARGIN, MARGIN, imgWidthMm, imgHeightMm);
                firstPage = false;
            }
        }
        if (type === 'all' || type === 'answerKey') {
            const akEl = document.getElementById('report-answer-key');
            if (akEl) {
                if (!firstPage) pdf.addPage('a4', 'p');
                const canvas = await html2canvas(akEl, { scale: 2.5, useCORS: true, logging: false, windowWidth: 1024, backgroundColor: '#ffffff' });
                const img = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * contentWidthPortrait) / canvas.width;
                pdf.addImage(img, 'PNG', MARGIN, MARGIN, contentWidthPortrait, imgHeight);
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
        setCurrentBlueprint(prev => {
            if (!prev) return prev;
            const updatedItems = prev.items.map(i => {
                if (i.id === id) {
                    const updated = { ...i, [field]: value };
                    if (updated.marksPerQuestion === 1) {
                        updated.knowledgeLevel = KnowledgeLevel.BASIC;
                        updated.knowledgeLevelB = KnowledgeLevel.BASIC;
                    }
                    if (updated.marksPerQuestion <= 2) {
                        updated.enableDiscourse = false;
                        updated.enableDiscourseB = false;
                    }
                    if (updated.hasInternalChoice) {
                        if (field === 'knowledgeLevel') updated.knowledgeLevelB = value as KnowledgeLevel;
                        else if (field === 'knowledgeLevelB') updated.knowledgeLevel = value as KnowledgeLevel;
                    }
                    return updated;
                }
                return i;
            });
            return { ...prev, items: updatedItems };
        });
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

    // ─── stats ─────────────────────────────────────────────────────────────────
    const ownedCount = blueprints.filter(b => b.ownerId === user.id).length;
    const sharedCount = blueprints.filter(b => b.ownerId !== user.id).length;
    const confirmedCount = blueprints.filter(b => b.isConfirmed).length;

    return (
        <>
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
                    --ap-radius: 20px;
                    --ap-font: 'DM Sans', sans-serif;
                    --ap-display: 'Syne', sans-serif;
                }

                .ud-root {
                    min-height: 100vh;
                    background-color: var(--ap-bg);
                    background-image: 
                        radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.05) 0%, transparent 40%);
                    font-family: var(--ap-font);
                    color: var(--ap-text);
                    padding-bottom: 5rem;
                }

                /* ── Header ─────────────────────────────────────── */
                .ud-header {
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border-bottom: 1px solid var(--ap-border);
                    padding: 0 1.5rem;
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 30px rgba(0,0,0,0.02);
                }

                .ud-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-family: var(--ap-display);
                    font-weight: 800;
                    font-size: 1.25rem;
                    letter-spacing: -0.03em;
                    color: var(--ap-text);
                }

                .ud-logo-icon {
                    width: 40px; height: 40px;
                    background: linear-gradient(135deg, #2563eb, #7c3aed);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.3);
                }

                @keyframes iconPulse {
                    0%, 100% { box-shadow: 0 0 18px rgba(124,106,247,0.45); }
                    50% { box-shadow: 0 0 30px rgba(124,106,247,0.7); }
                }

                .ud-back-btn {
                    width: 34px; height: 34px;
                    border-radius: 10px;
                    border: 1px solid var(--dash-border);
                    background: var(--dash-surface);
                    color: var(--dash-muted);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-right: 0.5rem;
                }
                .ud-back-btn:hover { background: var(--dash-surface2); color: var(--dash-text); }

                .ud-user-chip {
                    display: flex; align-items: center; gap: 0.6rem;
                    background: var(--ap-surface2);
                    border: 1px solid var(--ap-border);
                    border-radius: 100px;
                    padding: 0.4rem 1rem 0.4rem 0.4rem;
                    transition: all 0.2s;
                }
                .ud-user-chip:hover { background: #fff; border-color: var(--ap-accent); }
                .ud-avatar {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    background: var(--ap-accent);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.75rem; font-weight: 700; color: #fff;
                    flex-shrink: 0;
                    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
                }
                .ud-username {
                    font-size: 0.85rem; font-weight: 700;
                    color: var(--ap-text);
                    display: none;
                }
                @media (min-width: 480px) { .ud-username { display: block; } }

                .ud-logout-btn {
                    width: 34px; height: 34px;
                    border-radius: 10px;
                    border: 1px solid rgba(239,68,68,0.2);
                    background: rgba(239,68,68,0.05);
                    color: #ef4444;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ud-logout-btn:hover { background: #ef4444; color: #fff; }

                /* ── Content Container ──────────────────────────── */
                .ud-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 1.5rem 1rem;
                }

                /* ── Stats Strip ────────────────────────────────── */
                .ud-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                    margin-bottom: 1.75rem;
                    animation: fadeUp 0.5s ease both;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .ud-stat-card {
                    background: var(--ap-surface);
                    border: 1px solid var(--ap-border);
                    border-radius: var(--ap-radius);
                    padding: 1.5rem;
                    display: flex; flex-direction: column; gap: 0.5rem;
                    position: relative; overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
                }
                .ud-stat-card:hover { 
                    transform: translateY(-4px); 
                    border-color: var(--ap-accent); 
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); 
                }
                .ud-stat-label { font-size: 0.75rem; font-weight: 700; color: var(--ap-muted); text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 0.5rem; }
                .ud-stat-value { font-family: var(--ap-display); font-size: 2.25rem; font-weight: 800; color: var(--ap-text); line-height: 1; }
                .text-violet { color: #2563eb; }
                .text-rose { color: #db2777; }
                .text-emerald { color: #059669; }

                /* ── Section Header ─────────────────────────────── */
                .ud-section-hdr {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                    animation: fadeUp 0.5s 0.1s ease both;
                }
                .ud-section-title {
                    font-family: var(--ap-display);
                    font-size: 1.75rem;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    color: var(--ap-text);
                }

                /* ── New Blueprint Button ───────────────────────── */
                .ud-new-btn {
                    display: flex; align-items: center; gap: 0.6rem;
                    background: var(--ap-accent);
                    color: #fff;
                    border: none;
                    border-radius: 14px;
                    padding: 0.75rem 1.5rem;
                    font-family: var(--ap-display);
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
                    white-space: nowrap;
                }
                .ud-new-btn:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.3); }
                .ud-new-btn:active { transform: translateY(0) scale(0.98); }

                /* ── Filter Tabs ─────────────────────────────────── */
                .ud-tabs {
                    display: flex; gap: 0.4rem;
                    background: var(--ap-surface2);
                    border-radius: 14px;
                    padding: 0.35rem;
                    width: fit-content;
                }
                .ud-tab {
                    padding: 0.5rem 1.25rem;
                    border-radius: 11px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                    color: var(--ap-muted);
                    transition: all 0.2s;
                }
                .ud-tab.active {
                    background: #fff;
                    color: var(--ap-accent);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }

                /* ── Desktop Table ───────────────────────────────── */
                .ud-table-wrap {
                    display: none;
                    background: var(--ap-surface);
                    border: 1px solid var(--ap-border);
                    border-radius: var(--ap-radius);
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    animation: fadeUp 0.6s 0.15s ease both;
                }
                @media (min-width: 1024px) { .ud-table-wrap { display: block; } }

                .ud-table { width: 100%; border-collapse: collapse; }

                .ud-thead { background: var(--ap-surface2); border-bottom: 1px solid var(--ap-border); }
                .ud-th {
                    padding: 1.25rem 1rem;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--ap-muted);
                    white-space: nowrap;
                }
                .ud-th:last-child { text-align: right; }

                .ud-tr {
                    border-bottom: 1px solid var(--dash-border);
                    transition: background 0.15s;
                    animation: rowIn 0.4s ease both;
                }
                @keyframes rowIn {
                    from { opacity: 0; transform: translateX(-8px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .ud-tr:hover { background: rgba(99,102,241,0.04); }
                .ud-tr:last-child { border-bottom: none; }

                .ud-td {
                    padding: 1rem;
                    font-size: 0.9rem;
                    color: var(--ap-text);
                    vertical-align: middle;
                    font-weight: 500;
                }

                /* ── Badges ──────────────────────────────────────── */
                .ud-badge {
                    display: inline-flex; align-items: center; gap: 0.35rem;
                    font-size: 0.65rem; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    padding: 0.35rem 0.75rem;
                    border-radius: 10px;
                    white-space: nowrap;
                    border: 1px solid transparent;
                }
                .ud-badge.owner { background: var(--ap-accent-light); color: var(--ap-accent); border-color: rgba(37, 99, 235, 0.2); }
                .ud-badge.shared { background: #fdf2f8; color: #db2777; border-color: rgba(219, 39, 119, 0.2); }
                .ud-badge.confirmed { background: #f0fdf4; color: #16a34a; border-color: rgba(22, 163, 74, 0.2); }
                .ud-badge.locked { background: #f8fafc; color: #64748b; border-color: var(--ap-border); }

                .ud-marks-pill {
                    display: inline-block;
                    background: var(--dash-surface2);
                    border: 1px solid var(--dash-border);
                    border-radius: 8px;
                    padding: 0.2rem 0.6rem;
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: var(--dash-text);
                }

                /* ── Table Action Buttons ────────────────────────── */
                .ud-action-btn {
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    padding: 0.5rem 0.85rem;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .ud-action-btn.edit { background: var(--ap-surface2); color: var(--ap-text); border-color: var(--ap-border); }
                .ud-action-btn.edit:hover { background: var(--ap-accent); color: #fff; border-color: var(--ap-accent); transform: scale(1.05); }
                .ud-action-btn.edit:disabled { opacity: 0.35; cursor: not-allowed; }
                .ud-action-btn.share { background: #f0fdf4; color: #16a34a; border-color: rgba(22, 163, 74, 0.1); }
                .ud-action-btn.share:hover { background: #16a34a; color: #fff; transform: scale(1.05); }
                .ud-action-btn.del { background: #fef2f2; color: #dc2626; border-color: rgba(220, 38, 38, 0.1); }
                .ud-action-btn.del:hover { background: #dc2626; color: #fff; transform: scale(1.05); }
                .ud-action-btn.del:disabled { opacity: 0.25; cursor: not-allowed; }

                /* ── Empty State ─────────────────────────────────── */
                .ud-empty {
                    background: var(--dash-surface);
                    border: 1px solid var(--dash-border);
                    border-radius: var(--dash-radius);
                    padding: 4rem 2rem;
                    text-align: center;
                    animation: fadeUp 0.5s ease both;
                }
                .ud-empty-icon {
                    width: 60px; height: 60px;
                    border-radius: 18px;
                    background: var(--dash-surface2);
                    border: 1px solid var(--dash-border);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    color: var(--dash-muted);
                }

                /* ── Mobile Cards ────────────────────────────────── */
                .ud-cards {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    animation: fadeUp 0.5s 0.15s ease both;
                }
                @media (min-width: 560px) { .ud-cards { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1024px) { .ud-cards { display: none; } }

                .ud-card {
                    background: var(--ap-surface);
                    border: 1px solid var(--ap-border);
                    border-radius: var(--ap-radius);
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    animation: cardIn 0.5s ease both;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
                }
                .ud-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); border-color: var(--ap-accent); }
                .ud-card:active { transform: scale(0.98); }

                .ud-card-header {
                    height: 100px;
                    position: relative;
                    overflow: hidden;
                    display: flex; align-items: flex-start;
                    padding: 1.25rem;
                    background: var(--ap-surface2);
                }
                .ud-card-marks {
                    position: absolute;
                    top: 1rem; right: 1rem;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(8px);
                    border: 1px solid var(--ap-border);
                    border-radius: 12px;
                    padding: 0.4rem 0.75rem;
                    text-align: center;
                    z-index: 1;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .ud-card-marks-label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ap-muted); }
                .ud-card-marks-val { font-family: var(--ap-display); font-size: 1.25rem; font-weight: 800; color: var(--ap-accent); line-height: 1; }

                .ud-card-badges {
                    display: flex; flex-wrap: wrap; gap: 0.3rem;
                    z-index: 1;
                }

                .ud-card-body { padding: 0.25rem 1rem 1rem; }

                .ud-card-title {
                    font-family: var(--ap-display);
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: var(--ap-text);
                    line-height: 1.25;
                    margin-bottom: 0.35rem;
                }
                .ud-card-by { font-size: 0.75rem; font-weight: 700; color: var(--ap-accent); margin-bottom: 0.15rem; }
                .ud-card-date { font-size: 0.72rem; font-weight: 500; color: var(--ap-muted); margin-bottom: 1rem; }

                .ud-card-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.6rem;
                    margin-bottom: 1rem;
                }
                .ud-card-meta {
                    background: var(--ap-surface2);
                    border: 1px solid var(--ap-border);
                    border-radius: 12px;
                    padding: 0.65rem;
                }
                .ud-card-meta-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ap-muted); margin-bottom: 0.2rem; }
                .ud-card-meta-val { font-size: 0.85rem; font-weight: 700; color: var(--ap-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                .ud-card-actions { display: flex; gap: 0.5rem; }
                .ud-card-btn {
                    flex: 1;
                    display: flex; align-items: center; justify-content: center; gap: 0.35rem;
                    padding: 0.7rem;
                    border-radius: 12px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    border: none;
                    transition: all 0.18s;
                }
                .ud-card-btn.edit { background: #eef2ff; color: #4338ca; }
                .ud-card-btn.edit:hover { background: #6366f1; color: #fff; }
                .ud-card-btn.edit:disabled { opacity: 0.3; cursor: not-allowed; }
                .ud-card-btn.share { background: #f0fdf4; color: #15803d; }
                .ud-card-btn.share:hover { background: #10b981; color: #fff; }
                .ud-card-btn.del { flex: 0 0 44px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
                .ud-card-btn.del:hover { background: #ef4444; color: #fff; }
                .ud-card-btn.del:disabled { opacity: 0.25; cursor: not-allowed; }

                /* ── Config Panel ────────────────────────────────── */
                .ud-config-panel {
                    background: var(--dash-surface);
                    border: 1px solid var(--dash-border);
                    border-radius: var(--dash-radius);
                    overflow: hidden;
                    margin-bottom: 1.25rem;
                    animation: fadeUp 0.4s ease both;
                }
                .ud-config-hdr {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1rem 1.25rem;
                    cursor: pointer;
                    background: var(--dash-surface2);
                    border-bottom: 1px solid var(--dash-border);
                    transition: background 0.2s;
                }
                .ud-config-hdr:hover { background: rgba(124,106,247,0.08); }
                .ud-config-title {
                    display: flex; align-items: center; gap: 0.6rem;
                    font-family: var(--dash-display);
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--dash-text);
                }
                .ud-config-body { padding: 1.25rem; }
                .ud-form-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.85rem;
                }
                @media (min-width: 640px) { .ud-form-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1024px) { .ud-form-grid { grid-template-columns: repeat(4, 1fr); } }

                .ud-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
                .ud-form-label {
                    font-size: 0.72rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--dash-muted);
                }
                .ud-form-label .req { color: #f87171; margin-left: 0.15rem; }

                .ud-form-select, .ud-form-input {
                    background: var(--dash-surface2);
                    border: 1px solid var(--dash-border);
                    border-radius: 10px;
                    padding: 0.6rem 0.85rem;
                    font-size: 0.85rem;
                    font-family: var(--dash-font);
                    color: var(--dash-text);
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    appearance: none;
                    -webkit-appearance: none;
                    width: 100%;
                }
                .ud-form-select:focus, .ud-form-input:focus {
                    border-color: rgba(124,106,247,0.5);
                    box-shadow: 0 0 0 3px rgba(124,106,247,0.12);
                }
                .ud-form-select:disabled, .ud-form-input:disabled { opacity: 0.4; cursor: not-allowed; }
                .ud-form-select option { background: #ffffff; color: #1e293b; }

                .ud-generate-btn {
                    display: flex; align-items: center; gap: 0.5rem;
                    background: linear-gradient(135deg, #7c6af7, #f472b6);
                    border: none; border-radius: 12px;
                    padding: 0.65rem 1.4rem;
                    font-family: var(--dash-display);
                    font-size: 0.85rem; font-weight: 700;
                    color: #fff; cursor: pointer;
                    transition: opacity 0.2s, transform 0.2s;
                    box-shadow: 0 4px 18px rgba(124,106,247,0.35);
                    margin-left: auto;
                    margin-top: 0.5rem;
                }
                .ud-generate-btn:hover { opacity: 0.9; transform: translateY(-1px); }

                /* ── Pulse shimmer for loading ────────────────────── */
                @keyframes shimmer {
                    from { background-position: -200% 0; }
                    to { background-position: 200% 0; }
                }
            `}</style>

            <div className="ud-root no-print-wrapper" ref={printRef}>

                {/* ── Header ────────────────────────────────────────────────── */}
                <header className="ud-header no-print">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {view !== 'list' && (
                            <button className="ud-back-btn" onClick={() => { setView('list'); setCurrentBlueprint(null); }} title="Back">
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <div className="ud-logo">
                            <div className="ud-logo-icon">
                                <FileText size={16} color="#fff" />
                            </div>
                            Blueprint System
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="ud-user-chip" onClick={() => setView('profile')} style={{ cursor: 'pointer' }} title="View Profile">
                            <div className="ud-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
                            <span className="ud-username">{user.name}</span>
                        </div>
                        <button className="ud-logout-btn" onClick={onLogout} title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>

                <div className="ud-container">

                    {/* ══════════════ LIST VIEW ══════════════════════════════════ */}
                    {view === 'list' && (
                        <div>
                            {/* Stats Strip */}
                            <div className="ud-stats">
                                <div className="ud-stat-card purple">
                                    <span className="ud-stat-label"><span className="ud-stat-dot" style={{ background: '#a78bfa' }}></span>Total</span>
                                    <span className="ud-stat-value text-violet">{blueprints.length}</span>
                                </div>
                                <div className="ud-stat-card pink">
                                    <span className="ud-stat-label"><span className="ud-stat-dot" style={{ background: '#f472b6' }}></span>Owned</span>
                                    <span className="ud-stat-value text-rose">{ownedCount}</span>
                                </div>
                                <div className="ud-stat-card green">
                                    <span className="ud-stat-label"><span className="ud-stat-dot" style={{ background: '#34d399' }}></span>Confirmed</span>
                                    <span className="ud-stat-value text-emerald">{confirmedCount}</span>
                                </div>
                            </div>

                            {/* Section Header */}
                            <div className="ud-section-hdr">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                                    <h2 className="ud-section-title">Blueprints</h2>
                                    <div className="ud-tabs">
                                        {(['all', 'owned', 'shared'] as const).map(f => (
                                            <button key={f} className={`ud-tab${filterView === f ? ' active' : ''}`} onClick={() => setFilterView(f)}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button className="ud-new-btn" onClick={handleCreateNew}>
                                    <Plus size={16} />
                                    New Blueprint
                                </button>
                            </div>

                            {/* ── Content ── */}
                            {(() => {
                                const filteredBlueprints = blueprints.filter(bp => {
                                    if (bp.isHidden) return false;
                                    if (filterView === 'owned') return bp.ownerId === user.id;
                                    if (filterView === 'shared') return bp.ownerId !== user.id;
                                    return true;
                                });

                                if (filteredBlueprints.length === 0) return (
                                    <div className="ud-empty">
                                        <div className="ud-empty-icon">
                                            <BookOpen size={26} />
                                        </div>
                                        <p style={{ fontFamily: 'var(--dash-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>No blueprints found</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--dash-muted)', marginBottom: '1.25rem' }}>Create your first blueprint to get started.</p>
                                        <button className="ud-new-btn" style={{ margin: '0 auto' }} onClick={handleCreateNew}>
                                            <Plus size={15} /> New Blueprint
                                        </button>
                                    </div>
                                );

                                return (
                                    <>
                                        {/* ── Desktop Table ─────────────────────────── */}
                                        <div className="ud-table-wrap">
                                            <table className="ud-table">
                                                <thead className="ud-thead">
                                                    <tr>
                                                        {['Status', 'Date', 'Paper Type', 'Class', 'Subject', 'Term', 'Set', 'Marks', 'Actions'].map((h, i) => (
                                                            <th key={h} className="ud-th" style={{ textAlign: i >= 7 ? 'right' : i === 7 ? 'center' : 'left' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredBlueprints.map((bp, idx) => {
                                                        const isOwner = bp.ownerId === user.id;
                                                        const ownerUser = !isOwner ? allUsers.find(u => u.id === bp.ownerId) : null;
                                                        return (
                                                            <tr key={bp.id} className="ud-tr" style={{ animationDelay: `${idx * 40}ms` }}>
                                                                <td className="ud-td">
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                                        {isOwner
                                                                            ? <span className="ud-badge owner"><UserCircle size={10} />Owner</span>
                                                                            : <span className="ud-badge shared"><Share2 size={10} />Shared</span>
                                                                        }
                                                                        {bp.isConfirmed && <span className="ud-badge confirmed"><CheckCircle size={10} />Confirmed</span>}
                                                                        {bp.isLocked && <span className="ud-badge locked"><Lock size={10} />Locked</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="ud-td" style={{ color: 'var(--dash-muted)', fontSize: '0.8rem' }}>
                                                                    {new Date(bp.createdAt).toLocaleDateString()}
                                                                </td>
                                                                <td className="ud-td">
                                                                    <div style={{ fontWeight: 700, color: 'var(--dash-accent)', fontSize: '0.85rem' }}>{bp.questionPaperTypeName || 'N/A'}</div>
                                                                    {!isOwner && ownerUser && (
                                                                        <div style={{ fontSize: '0.72rem', color: 'var(--dash-muted)', marginTop: '0.15rem' }}>by {ownerUser.name}</div>
                                                                    )}
                                                                </td>
                                                                <td className="ud-td">Class {bp.classLevel === 'SSLC' ? '11 (SSLC)' : bp.classLevel}</td>
                                                                <td className="ud-td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bp.subject}</td>
                                                                <td className="ud-td" style={{ color: 'var(--dash-muted)', fontSize: '0.82rem' }}>{bp.examTerm}</td>
                                                                <td className="ud-td" style={{ textAlign: 'center', fontWeight: 700 }}>{bp.setId || 'Set A'}</td>
                                                                <td className="ud-td" style={{ textAlign: 'center' }}>
                                                                    <span className="ud-marks-pill">{bp.totalMarks}</span>
                                                                </td>
                                                                <td className="ud-td">
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                                        <button className="ud-action-btn edit" onClick={() => handleEdit(bp)} disabled={!!bp.isLocked}>
                                                                            {bp.isLocked ? <Lock size={13} /> : <Edit2 size={13} />}
                                                                            Edit
                                                                        </button>
                                                                        {isOwner && (
                                                                            <>
                                                                                <button className="ud-action-btn share" onClick={() => setSharingBlueprintId(bp.id)}>
                                                                                    <Share2 size={13} /> Share
                                                                                </button>
                                                                                <button className="ud-action-btn del" onClick={() => handleDelete(bp.id)} disabled={!!bp.isLocked}>
                                                                                    <Trash2 size={14} />
                                                                                </button>
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

                                        {/* ── Mobile Cards ──────────────────────────── */}
                                        <div className="ud-cards">
                                            {filteredBlueprints.map((bp, index) => {
                                                const isOwner = bp.ownerId === user.id;
                                                const ownerUser = !isOwner ? allUsers.find(u => u.id === bp.ownerId) : null;
                                                const grad = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

                                                return (
                                                    <div key={bp.id} className="ud-card" style={{ animationDelay: `${index * 80}ms` }}>
                                                        {/* Card Header */}
                                                        <div className="ud-card-header">
                                                            <div className="ud-card-header-bg" style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }} />
                                                            <div className="ud-card-header-dots" />
                                                            <div className="ud-card-header-glow1" />
                                                            <div className="ud-card-header-glow2" />
                                                            <div className="ud-card-wave" />

                                                            {/* Badges */}
                                                            <div className="ud-card-badges" style={{ zIndex: 1 }}>
                                                                {isOwner
                                                                    ? <span style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Owner</span>
                                                                    : <span style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Shared</span>
                                                                }
                                                                {bp.isConfirmed && (
                                                                    <span style={{ background: 'rgba(52,211,153,0.3)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>✓ Confirmed</span>
                                                                )}
                                                                {bp.isLocked && (
                                                                    <span style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>🔒 Locked</span>
                                                                )}
                                                            </div>

                                                            {/* Marks bubble */}
                                                            <div className="ud-card-marks">
                                                                <div className="ud-card-marks-label">Marks</div>
                                                                <div className="ud-card-marks-val">{bp.totalMarks}</div>
                                                            </div>
                                                        </div>

                                                        {/* Card Body */}
                                                        <div className="ud-card-body">
                                                            <div className="ud-card-title">{bp.questionPaperTypeName || 'N/A'}</div>
                                                            {!isOwner && ownerUser && <div className="ud-card-by">by {ownerUser.name}</div>}
                                                            <div className="ud-card-date">{new Date(bp.createdAt).toLocaleDateString()}</div>

                                                            <div className="ud-card-grid">
                                                                <div className="ud-card-meta">
                                                                    <div className="ud-card-meta-label">Class</div>
                                                                    <div className="ud-card-meta-val">Class {bp.classLevel === 'SSLC' ? '11 (SSLC)' : bp.classLevel}</div>
                                                                </div>
                                                                <div className="ud-card-meta">
                                                                    <div className="ud-card-meta-label">Term</div>
                                                                    <div className="ud-card-meta-val">{bp.examTerm}</div>
                                                                </div>
                                                                <div className="ud-card-meta">
                                                                    <div className="ud-card-meta-label">Subject</div>
                                                                    <div className="ud-card-meta-val">{bp.subject}</div>
                                                                </div>
                                                                <div className="ud-card-meta">
                                                                    <div className="ud-card-meta-label">Set</div>
                                                                    <div className="ud-card-meta-val">{bp.setId || 'Set A'}</div>
                                                                </div>
                                                            </div>

                                                            <div className="ud-card-actions">
                                                                <button className="ud-card-btn edit" onClick={() => handleEdit(bp)} disabled={!!bp.isLocked}>
                                                                    {bp.isLocked ? <Lock size={14} /> : <Edit2 size={14} />}
                                                                    Edit
                                                                </button>
                                                                {isOwner && (
                                                                    <>
                                                                        <button className="ud-card-btn share" onClick={() => setSharingBlueprintId(bp.id)}>
                                                                            <Share2 size={14} /> Share
                                                                        </button>
                                                                        <button className="ud-card-btn del" onClick={() => handleDelete(bp.id)} disabled={!!bp.isLocked}>
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* ══════════════ CREATE / EDIT VIEW ═════════════════════════ */}
                    {(view === 'create' || view === 'edit') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Section title */}
                            <div className="ud-section-hdr" style={{ marginBottom: 0 }}>
                                <h2 className="ud-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    {view === 'create' ? <><Sparkles size={20} style={{ color: 'var(--dash-accent)' }} /> New Blueprint</> : <><Edit2 size={20} style={{ color: 'var(--dash-accent2)' }} /> Edit Blueprint</>}
                                </h2>
                            </div>

                            {/* Config Panel */}
                            <div className="ud-config-panel no-print">
                                <div className="ud-config-hdr" onClick={() => setIsConfigExpanded(!isConfigExpanded)}>
                                    <div className="ud-config-title">
                                        <Settings size={17} style={{ color: 'var(--dash-accent)' }} />
                                        {view === 'create' ? 'Configuration' : 'Edit Configuration'}
                                        {currentBlueprint?.isConfirmed && (
                                            <span className="ud-badge confirmed" style={{ marginLeft: '0.5rem' }}><CheckCircle size={10} />Confirmed</span>
                                        )}
                                    </div>
                                    <div style={{ color: 'var(--dash-muted)' }}>
                                        {isConfigExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {isConfigExpanded && (
                                    <div className="ud-config-body">
                                        <div className="ud-form-grid">
                                            <div className="ud-form-group">
                                                <label className="ud-form-label">Paper Type<span className="req">*</span></label>
                                                <select className="ud-form-select" disabled={view === 'edit' || !!currentBlueprint?.isConfirmed} value={selectedPaperType} onChange={e => setSelectedPaperType(e.target.value)}>
                                                    <option value="">Select Type</option>
                                                    {paperTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name} ({pt.totalMarks} Marks)</option>)}
                                                </select>
                                            </div>
                                            <div className="ud-form-group">
                                                <label className="ud-form-label">Class</label>
                                                <select className="ud-form-select" disabled={view === 'edit' || !!currentBlueprint?.isConfirmed} value={selectedClass} onChange={e => setSelectedClass(parseInt(e.target.value, 10) as ClassLevel)}>
                                                    {Object.values(ClassLevel).filter(v => typeof v === 'number' || v === 'SSLC').map(v => <option key={v} value={v}>Class {v === 'SSLC' ? '11 (SSLC)' : v}</option>)}
                                                </select>
                                            </div>
                                            <div className="ud-form-group">
                                                <label className="ud-form-label">Subject</label>
                                                <select className="ud-form-select" disabled={view === 'edit' || !!currentBlueprint?.isConfirmed} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value as SubjectType)}>
                                                    {Object.values(SubjectType).map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                            <div className="ud-form-group">
                                                <label className="ud-form-label">Term</label>
                                                <select className="ud-form-select" disabled={view === 'edit' || !!currentBlueprint?.isConfirmed} value={selectedTerm} onChange={e => setSelectedTerm(e.target.value as ExamTerm)}>
                                                    {Object.values(ExamTerm).map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                            <div className="ud-form-group">
                                                <label className="ud-form-label">Set</label>
                                                <select className="ud-form-select" disabled={view === 'edit' || !!currentBlueprint?.isConfirmed} value={selectedSet} onChange={e => setSelectedSet(e.target.value)}>
                                                    {['Set A', 'Set B', 'Set C', 'Set D'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="ud-form-group">
                                                <label className="ud-form-label">Academic Year</label>
                                                <input type="text" className="ud-form-input" disabled={!!currentBlueprint?.isConfirmed} value={selectedAcademicYear} onChange={e => setSelectedAcademicYear(e.target.value)} placeholder="e.g. 2025-2026" />
                                            </div>
                                        </div>

                                        {view === 'create' && !currentBlueprint?.isConfirmed && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                                <button className="ud-generate-btn" onClick={handleGenerate}>
                                                    <Sparkles size={16} /> Generate Matrix
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {currentBlueprint && curriculum && (
                                <UniversalBlueprintView
                                    blueprint={currentBlueprint}
                                    curriculum={curriculum}
                                    paperType={paperTypes.find(p => p.id === currentBlueprint.questionPaperTypeId)}
                                    discourses={discourses}
                                    isAdmin={false}
                                    onBack={() => { setView('list'); setCurrentBlueprint(null); }}
                                    onUpdateItemField={updateItem}
                                    onMoveItem={moveItem}
                                    onSave={handleSaveToDB}
                                    onRegenerate={handleRegeneratePattern}
                                    onConfirm={handleConfirmPattern}
                                    onDownloadPDF={(type) => handleDownloadPDF(type as any)}
                                    onDownloadWord={handleDownloadWord}
                                    isSaving={isSaving}
                                />
                            )}
                        </div>
                    )}

                    {/* ══════════════ PROFILE VIEW ═════════════════════════════════ */}
                    {view === 'profile' && (
                        <UserProfile 
                            user={user} 
                            onUpdate={onUpdateUser} 
                            onBack={() => setView('list')} 
                        />
                    )}
                </div>
            </div>

            {/* Sharing Modal */}
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
        </>
    );
};

export default UserDashboard;
