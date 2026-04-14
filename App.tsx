import React, { useState, useEffect, useRef } from 'react';
import {
    Role, ClassLevel, SubjectType, ExamTerm,
    BlueprintItem, Blueprint, ItemFormat, KnowledgeLevel, CognitiveProcess, Unit, SubUnit, Curriculum, User, ExamConfiguration, UnitWeightage, SystemSettings, QuestionPaperType, QuestionPatternSection,
    QuestionType, Discourse, DiscourseScores
} from './types';
import {
    generateBlueprintTemplate, getCurriculum, getFilteredCurriculum, saveCurriculum,
    getUsers, saveUsers, getExamConfigs, saveExamConfigs, getSettings, getDB, initDB,
    getBlueprints, saveBlueprint, deleteBlueprint, getQuestionPaperTypes, saveQuestionPaperTypes,
    getDefaultFormat, getDefaultKnowledge, getDiscourses, saveDiscourses,
    getAllAccessibleBlueprints, shareBlueprint, removeShare, getSharedWithUsers, filterCurriculumByTerm,
    login, logout
} from './services/db';
import {
    Trash2, Plus, Download, LogOut, FileText,
    Menu, X, Settings, Edit2, Save, Printer, Users, BookOpen, Layers, UserCircle, LayoutDashboard, ChevronLeft, List, FileType, Grip, GripVertical, CheckCircle, RefreshCw, Clock, GripHorizontal,
    Bold, Italic, Underline, ListOrdered, Share2, Eye, EyeOff, Lock, ChevronDown, ChevronUp,
    Image, Table as TableIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AdminPortal from './components/AdminPortal';
import BlueprintSharingModal from './components/BlueprintSharingModal';
import AnswerKeyView from './components/AnswerKeyView';
import { DocExportService } from './services/docExport';
import { QuestionEntryForm } from './components/QuestionEntryForm';

// --- Login & Admin Components remain mostly the same (collapsed for brevity in thought, but included fully here) ---

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login(username, password);
            if (result.success && result.user) {
                onLogin(result.user);
            } else {
                setError(result.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white/90 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
                        <FileText size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Exam Blueprint
                    </h1>
                    <p className="text-gray-500 mt-2">Quality Question Paper System</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-6 rounded text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <UserCircle size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter username"
                                className="block w-full pl-10 pr-3 py-3 rounded-xl border-gray-200 border bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                className="block w-full pl-10 pr-12 py-3 rounded-xl border-gray-200 border bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.01] transition-all"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Admin Components have been moved to ./components/AdminPortal.tsx and its sub-components ---

// --- Reports Component ---

export const ReportsView = ({ blueprint, curriculum, onDownloadPDF, onDownloadWord }: {
    blueprint: Blueprint,
    curriculum: Curriculum,
    onDownloadPDF?: (type: any) => void,
    onDownloadWord?: (type: any) => void
}) => {
    if (!blueprint.isConfirmed) return null;
    const [activeTab, setActiveTab] = useState<'report1' | 'report2' | 'report3' | 'answerKey'>('report1');

    const stats = {
        knowledge: {} as Record<string, { count: number, marks: number }>,
        cognitive: {} as Record<string, { count: number, marks: number }>,
        format: {} as Record<string, { count: number, marks: number }>,
        content: {} as Record<string, number>
    };

    let totalMarks = 0;
    let totalQuestions = 0;
    let totalEstimatedTime = 0;

    blueprint.items.forEach(item => {
        // Knowledge
        if (!stats.knowledge[item.knowledgeLevel]) stats.knowledge[item.knowledgeLevel] = { count: 0, marks: 0 };
        stats.knowledge[item.knowledgeLevel].count += item.questionCount;
        stats.knowledge[item.knowledgeLevel].marks += item.totalMarks;

        // Cognitive
        if (!stats.cognitive[item.cognitiveProcess]) stats.cognitive[item.cognitiveProcess] = { count: 0, marks: 0 };
        stats.cognitive[item.cognitiveProcess].count += item.questionCount;
        stats.cognitive[item.cognitiveProcess].marks += item.totalMarks;

        // Format
        if (!stats.format[item.itemFormat]) stats.format[item.itemFormat] = { count: 0, marks: 0 };
        stats.format[item.itemFormat].count += item.questionCount;
        stats.format[item.itemFormat].marks += item.totalMarks;

        // Content
        stats.content[item.unitId] = (stats.content[item.unitId] || 0) + item.totalMarks;

        totalMarks += item.totalMarks;
        totalQuestions += item.questionCount;

        // Time Calculation Logic
        let time = 2;
        if (item.marksPerQuestion === 1) time = 2;
        else if (item.marksPerQuestion === 2) time = 3;
        else if (item.marksPerQuestion === 3) time = 5;
        else if (item.marksPerQuestion === 4) time = 8;
        else if (item.marksPerQuestion === 5) time = 10;
        else if (item.marksPerQuestion >= 6) time = 15;
        totalEstimatedTime += time * item.questionCount;
    });

    const TableHeader = ({ children, className = "", colSpan, rowSpan }: any) => <th colSpan={colSpan} rowSpan={rowSpan} className={`border border-black p-2 bg-[#e2efda] text-center font-semibold text-sm text-black ${className}`}>{children}</th>;
    const TableCell = ({ children, className = "", colSpan, rowSpan }: any) => <td colSpan={colSpan} rowSpan={rowSpan} className={`border border-black p-2 text-sm text-black ${className} `}>{children}</td>;

    // Helper for QP Code
    const getQPCode = () => {
        const cls = blueprint.classLevel === ClassLevel._8 ? '8' : blueprint.classLevel === ClassLevel._9 ? '9' : '10';
        const sub = blueprint.subject.includes('AT') ? '02' : '12';
        return `T${cls}${sub} `;
    };

    // Helper for Subject Name
    const getSubjectTitle = () => {
        if (blueprint.subject.includes('AT')) {
            return { tamil: 'தமிழ் முதல் தாள் (AT)', eng: 'First Language - Tamil Paper I' };
        }
        return { tamil: 'தமிழ் இரண்டாம் தாள் (BT)', eng: 'First Language - Tamil Paper II' };
    };

    const getTermTamil = () => {
        switch (blueprint.examTerm) {
            case ExamTerm.FIRST: return 'முதல்';
            case ExamTerm.SECOND: return 'இரண்டாம்';
            case ExamTerm.THIRD: return 'மூன்றாம்';
            default: return 'முதல்';
        }
    };
    const getAcademicYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        if (month <= 4) return `${year - 1}-${year}`;
        return `${year}-${year + 1}`;
    };
    const academicYear = blueprint.academicYear || getAcademicYear();
    const qpCode = getQPCode();
    const subjectTitle = getSubjectTitle();
    const termTamil = getTermTamil();
    const setId = (blueprint.setId || 'Set A').replace('Set ', '');
    const termEnglish = blueprint.examTerm === ExamTerm.FIRST ? 'First' : blueprint.examTerm === ExamTerm.SECOND ? 'Second' : 'Third';

    // Pagination and Sorting for Item Analysis (Report 2)
    const ITEMS_PER_PAGE = 15;

    // Grouping identical items for Report 2 & 3
    const groupedItemsMap = blueprint.items.reduce((acc, item) => {
        const key = `${item.unitId}-${item.subUnitId}-${item.marksPerQuestion}-${item.knowledgeLevel}-${item.knowledgeLevelB || ''}-${item.cognitiveProcess}-${item.cognitiveProcessB || ''}-${item.itemFormat}-${item.itemFormatB || ''}-${item.hasInternalChoice ? 'yes' : 'no'}`;
        if (!acc[key]) {
            acc[key] = {
                ...item,
                questionCount: 1,
                totalMarks: item.marksPerQuestion
            };
        } else {
            acc[key].questionCount += 1;
            acc[key].totalMarks += item.marksPerQuestion;
        }
        return acc;
    }, {} as Record<string, any>);

    let runningQNo = 1;
    const sortedGroups = Object.values(groupedItemsMap)
        .sort((a, b) => a.marksPerQuestion - b.marksPerQuestion)
        .map((group) => {
            const start = runningQNo;
            const end = runningQNo + group.questionCount - 1;
            runningQNo += group.questionCount;
            return { 
                ...group, 
                qRange: start === end ? `${start}` : `${start}-${end}` 
            };
        });

    const chunkedItems = [];
    for (let i = 0; i < sortedGroups.length; i += ITEMS_PER_PAGE) {
        chunkedItems.push(sortedGroups.slice(i, i + ITEMS_PER_PAGE));
    }

    // Helper for unit order
    const unitOrderMap = new Map<string, number>();
    curriculum?.units.forEach((u: Unit) => {
        unitOrderMap.set(u.id, u.unitNumber);
    });

    const sortedReportItems = [...blueprint.items].sort((a, b) => {
        const unitA = unitOrderMap.get(a.unitId) || 999;
        const unitB = unitOrderMap.get(b.unitId) || 999;
        if (unitA !== unitB) return unitA - unitB;
        return a.marksPerQuestion - b.marksPerQuestion;
    });

    // --- RENDER HELPERS ---

    const renderReport1Content = (pageOnly?: number) => {
        // Calculate internal choice percentage for Section VI
        // Fixed: 3-mark(1) + 5-mark(1) + 6-mark(1) = 14 marks; 14*100/40 = 35%
        const internalChoiceItems = blueprint.items.filter(i => i.hasInternalChoice);
        const internalPercent = '35';

        return (
            <div className="tamil-font">
                {(!pageOnly || pageOnly === 1) && (
                    <div className="bg-white p-4">
                        <div className="mb-6 font-sans">

                            <div className="flex justify-between items-start mb-4">
                                <div className="border-2 border-black w-10 h-10 flex items-center justify-center text-xl font-bold">{setId}</div>
                                <div className="text-center flex-1">
                                    <h1 className="text-xl font-bold text-black tamil-font">சமக்ர சிக்ஷா கேரளம்</h1>
                                </div>
                                <div className="bg-black text-white rounded-full px-4 py-1 font-bold text-sm">GI {qpCode}</div>
                            </div>
                            <div className="text-center mb-2">
                                <h2 className="text-lg font-bold text-black tamil-font">{termTamil} பருவ தொகுத்தறி மதிப்பீடு {academicYear}</h2>
                                <h3 className="text-md font-bold uppercase text-black">{termEnglish} Term Summative Assessment {academicYear}</h3>
                            </div>
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-bold text-black tamil-font">{subjectTitle.tamil}</h2>
                                <h3 className="text-md font-bold text-black">{subjectTitle.eng}</h3>
                            </div>
                            <div className="flex justify-between items-end border-b-2 border-black pb-2 mt-4 font-bold text-lg text-black">
                                <div className="w-1/3">Std. : {blueprint.classLevel}</div>
                                <div className="text-right w-2/3">
                                    <div className="mb-1 tamil-font">நேரம் : 90 நிமிடங்கள்</div>
                                    <div className="tamil-font">மதிப்பெண் : {blueprint.totalMarks}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-base font-bold text-blue-600 mb-2">I. Weightage to Content Area</h3>
                            <table className="w-full border-collapse border border-black">
                                <thead>
                                    <tr>
                                        <TableHeader className="w-16">Sl. No.</TableHeader>
                                        <TableHeader>Learning Outcomes (LOs)</TableHeader>
                                        <TableHeader>Unit / Topic</TableHeader>
                                        <TableHeader>Sub-unit / Discourse</TableHeader>
                                        <TableHeader className="w-20">Score</TableHeader>
                                        <TableHeader className="w-24">Percentage</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {curriculum.units.map((unit, idx) => {
                                        const unitScore = stats.content[unit.id] || 0;
                                        const percentage = ((unitScore / totalMarks) * 100).toFixed(1);
                                        if (unitScore === 0) return null;
                                        return (
                                            <tr key={unit.id}>
                                                <TableCell className="text-center">{idx + 1}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs whitespace-pre-wrap">{unit.learningOutcomes || '-'}</div>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">{unit.name}</TableCell>
                                                <TableCell>
                                                    <ol className="list-decimal pl-4 text-xs italic">
                                                        {unit.subUnits.map(s => <li key={s.id}>{s.name}</li>)}
                                                    </ol>
                                                </TableCell>
                                                <TableCell className="text-center font-bold">{unitScore}</TableCell>
                                                <TableCell className="text-center">{percentage}%</TableCell>
                                            </tr>
                                        );
                                    })}
                                    <tr className="font-bold bg-[#e2efda]">
                                        <TableCell className="text-center" colSpan={4}>Total</TableCell>
                                        <TableCell className="text-center">{totalMarks}</TableCell>
                                        <TableCell className="text-center">100%</TableCell>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-base font-bold text-blue-600 mb-2">II. Weightage to Cognitive Process</h3>
                            <table className="w-full border-collapse border border-black max-w-2xl">
                                <thead>
                                    <tr>
                                        <TableHeader className="w-16">Sl. No.</TableHeader>
                                        <TableHeader>Cognitive Process</TableHeader>
                                        <TableHeader className="w-20">Score</TableHeader>
                                        <TableHeader className="w-24">Percentage</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(CognitiveProcess).map(([key, value], idx) => {
                                        const data = stats.cognitive[value] || { count: 0, marks: 0 };
                                        const percentage = ((data.marks / totalMarks) * 100).toFixed(1);
                                        return (
                                            <tr key={key}>
                                                <TableCell className="text-center font-bold">CP<sub>{idx + 1}</sub></TableCell>
                                                <TableCell>{value}</TableCell>
                                                <TableCell className="text-center">{data.marks || '-'}</TableCell>
                                                <TableCell className="text-center">{data.marks ? `${percentage}%` : '-'}</TableCell>
                                            </tr>
                                        );
                                    })}
                                    <tr className="font-bold bg-[#e2efda]">
                                        <TableCell className="text-center" colSpan={2}>Total</TableCell>
                                        <TableCell className="text-center">{totalMarks}</TableCell>
                                        <TableCell className="text-center">100%</TableCell>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="text-sm font-bold mt-2">Index of Abbreviation: CP - Cognitive Process</div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-base font-bold text-blue-600 mb-2">III. Weightage to Knowledge Level</h3>
                            <table className="w-full border-collapse border border-black max-w-2xl">
                                <thead>
                                    <tr>
                                        <TableHeader className="w-16">Sl. No.</TableHeader>
                                        <TableHeader>Knowledge Level</TableHeader>
                                        <TableHeader className="w-20">Score</TableHeader>
                                        <TableHeader className="w-24">Percentage</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(KnowledgeLevel).map((kl, idx) => {
                                        const data = stats.knowledge[kl] || { count: 0, marks: 0 };
                                        const percentage = ((data.marks / totalMarks) * 100).toFixed(0);
                                        return (
                                            <tr key={kl}>
                                                <TableCell className="text-center">{idx + 1}</TableCell>
                                                <TableCell>{kl}</TableCell>
                                                <TableCell className="text-center">{data.marks}</TableCell>
                                                <TableCell className="text-center">{percentage}%</TableCell>
                                            </tr>
                                        );
                                    })}
                                    <tr className="font-bold bg-[#e2efda]">
                                        <TableCell className="text-center" colSpan={2}>Total</TableCell>
                                        <TableCell className="text-center">{totalMarks}</TableCell>
                                        <TableCell className="text-center">100%</TableCell>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(!pageOnly || pageOnly === 2) && (
                    <div className="bg-white p-4">
                        <div className="mb-8">
                            <h3 className="text-base font-bold text-blue-600 mb-2">IV. Weightage to Item Format</h3>
                            <table className="w-full border-collapse border border-black">
                                <thead>
                                    <tr>
                                        <TableHeader className="w-16">Sl. No.</TableHeader>
                                        <TableHeader colSpan={2}>Item Format</TableHeader>
                                        <TableHeader>No. of Items</TableHeader>
                                        <TableHeader>Estimated Time</TableHeader>
                                        <TableHeader>Score allotted</TableHeader>
                                        <TableHeader>Percentage</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const rows = [
                                            {
                                                main: 'SR Item',
                                                subs: [
                                                    { code: 'SR1', label: 'MCI', fmt: ItemFormat.SR1 },
                                                    { code: 'SR2', label: 'MI', fmt: ItemFormat.SR2 }
                                                ]
                                            },
                                            {
                                                main: 'CRS Item',
                                                subs: [
                                                    { code: 'CRS1', label: 'VSA', fmt: ItemFormat.CRS1 },
                                                    { code: 'CRS2', label: 'SA', fmt: ItemFormat.CRS2 }
                                                ]
                                            },
                                            {
                                                main: 'CRL Item',
                                                subs: [
                                                    { code: 'CRL', label: 'E', fmt: ItemFormat.CRL }
                                                ]
                                            }
                                        ];

                                        let totalItemsInFormat = 0;
                                        let totalScoreInFormat = 0;

                                        return (
                                            <>
                                                {rows.map((r, rIdx) => {
                                                    const groupScore = r.subs.reduce((acc, s) => acc + (stats.format[s.fmt]?.marks || 0), 0);
                                                    const groupCount = r.subs.reduce((acc, s) => acc + (stats.format[s.fmt]?.count || 0), 0);
                                                    const groupPercent = ((groupScore / totalMarks) * 100).toFixed(0);

                                                    totalItemsInFormat += groupCount;
                                                    totalScoreInFormat += groupScore;

                                                    return r.subs.map((s, sIdx) => {
                                                        const data = stats.format[s.fmt] || { count: 0, marks: 0 };

                                                        // Time calculation for this format
                                                        let formatTime = 0;
                                                        blueprint.items.forEach(item => {
                                                            if (item.itemFormat === s.fmt) {
                                                                let time = 2;
                                                                if (item.marksPerQuestion === 1) time = 2;
                                                                else if (item.marksPerQuestion === 2) time = 3;
                                                                else if (item.marksPerQuestion === 3) time = 5;
                                                                else if (item.marksPerQuestion === 4) time = 8;
                                                                else if (item.marksPerQuestion === 5) time = 10;
                                                                else if (item.marksPerQuestion >= 6) time = 15;
                                                                formatTime += time * item.questionCount;
                                                            }
                                                        });

                                                        return (
                                                            <tr key={s.code}>
                                                                {sIdx === 0 && <TableCell className="text-center" rowSpan={r.subs.length}>{rIdx + 1}</TableCell>}
                                                                {sIdx === 0 && <TableCell rowSpan={r.subs.length}>{r.main}</TableCell>}
                                                                <TableCell>
                                                                    <div className="flex justify-between">
                                                                        <span>{s.code}</span>
                                                                        <span>{s.label}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">{data.count || '-'}</TableCell>
                                                                <TableCell className="text-center">{formatTime || '-'}</TableCell>
                                                                <TableCell className="text-center">{data.marks || '-'}</TableCell>
                                                                {sIdx === 0 && <TableCell className="text-center" rowSpan={r.subs.length}>{groupPercent}%</TableCell>}
                                                            </tr>
                                                        );
                                                    });
                                                })}
                                                <tr className="font-bold bg-[#e2efda]">
                                                    <TableCell className="text-center" colSpan={3}>Total</TableCell>
                                                    <TableCell className="text-center">{totalItemsInFormat}</TableCell>
                                                    <TableCell className="text-center">{totalEstimatedTime}</TableCell>
                                                    <TableCell className="text-center"></TableCell>
                                                    <TableCell className="text-center">100%</TableCell>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                            <div className="grid grid-cols-2 gap-x-4 mt-4 text-sm leading-relaxed">
                                <div className="space-y-1">
                                    <div><strong>Index of Abbreviations:</strong></div>
                                    <div className="flex gap-4"><span>SR</span> <span>- Selected Response</span></div>
                                    <div className="flex gap-4"><span>CRS</span> <span>- Constructed Response Short Answer</span></div>
                                    <div className="flex gap-4"><span>CRL</span> <span>- Constructed Response Long Answer</span></div>
                                </div>
                                <div className="space-y-1 mt-6">
                                    <div className="flex gap-4"><span>MCI</span> <span>- Multiple Choice Items</span></div>
                                    <div className="flex gap-4"><span>MI</span> <span>- Matching Item</span></div>
                                    <div className="flex gap-4"><span>VSA</span> <span>- Very Short Answer</span></div>
                                    <div className="flex gap-4"><span>SA</span> <span>- Short Answer</span></div>
                                    <div className="flex gap-4"><span>E</span> <span>- Essay</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-base font-bold text-blue-600 mb-2 underline">V. Scheme of Sections :</h3>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-base font-bold text-blue-600 mb-4 underline">VI. Pattern of Options :</h3>
                            <div className="flex items-center gap-12 ml-4">
                                <div className="flex items-center gap-4">
                                    <span>Internal choice</span>
                                    <div className="border border-black w-6 h-6 flex items-center justify-center font-bold">
                                        {internalChoiceItems.length > 0 ? '✓' : ''}
                                    </div>
                                    <span className="ml-4">{internalPercent}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span>Overall choice</span>
                                    <div className="border border-black w-6 h-6 flex items-center justify-center font-bold">
                                        {/* Usually not used in this pattern but provided placeholder */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderReport2Content = (chunk: any[], pageIdx: number) => (
        <div className="tamil-font p-4 w-full">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-pink-600 mb-2">Proforma for Analysing Question Paper</h1>
                <h2 className="text-lg font-bold text-pink-500">Item/Question-wise Analysis</h2>
            </div>

            <div className="mb-4 text-[12px] font-bold">
                <div className="grid grid-cols-2 gap-x-12 gap-y-1 px-4">
                    <div className="flex justify-between border-b border-gray-300"><span>Name of the Board</span> <span>: SSLC</span></div>
                    <div className="flex justify-between border-b border-gray-300"><span>Class</span> <span>: {blueprint.classLevel}</span></div>
                    <div className="flex justify-between border-b border-gray-300"><span>Name of Examination</span> <span>: {blueprint.examTerm}</span></div>
                    <div className="flex justify-between border-b border-gray-300"><span>Subject</span> <span>: {blueprint.subject}</span></div>
                    <div className="flex justify-between border-b border-gray-300"><span>Year of Examination</span> <span>: {blueprint.academicYear}</span></div>
                    <div className="flex justify-between border-b border-gray-300"><span>Score</span> <span>: {blueprint.totalMarks}</span></div>
                    <div className="flex justify-between border-b border-gray-300"><span>Q. Paper No./Code</span> <span>: {qpCode}</span></div>
                    <div className="flex justify-between border-b border-gray-300"><span>Time Allotted</span> <span>: 1.30</span></div>
                </div>
            </div>

            <h3 className="text-center font-bold text-blue-600 mb-4 underline">Part – II: Item-wise Analysis</h3>

            <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                    <tr className="bg-orange-200">
                        <th rowSpan={2} className="border border-black p-2 bg-orange-200 text-black align-middle min-w-[40px]">
                            <div className="flex flex-col items-center justify-center h-full">
                                <span>Item/</span>
                                <span>Qn. No.</span>
                            </div>
                        </th>
                        <th colSpan={3} className="border border-black p-2 bg-orange-200 text-black">Content Area</th>
                        <th colSpan={3} className="border border-black p-2 bg-blue-50 text-black">Knowledge level</th>
                        <th colSpan={7} className="border border-black p-2 bg-orange-100 text-black">Cognitive Process</th>
                        <th colSpan={6} className="border border-black p-2 bg-green-50 text-black">Item Format</th>
                        <th rowSpan={2} className="border border-black p-2 bg-orange-200 text-black align-middle min-w-[50px]">
                            <div className="flex flex-col items-center justify-center h-full">
                                <span>Score</span>
                                <span>Allotted</span>
                            </div>
                        </th>
                        <th rowSpan={2} className="border border-black p-2 bg-orange-200 text-black align-middle min-w-[60px]">
                            <div className="flex flex-col items-center justify-center h-full">
                                <span>Est. Time</span>
                                <span className="text-[8px]">(minutes)</span>
                            </div>
                        </th>
                    </tr>
                    <tr className="bg-orange-100 italic">
                        <th className="border border-black p-1 text-black min-w-[150px]">Learning Objective</th>
                        <th className="border border-black p-1 text-black min-w-[100px]">Topic/Unit /Chapter</th>
                        <th className="border border-black p-1 text-black min-w-[100px]">Sub-Topic/Sub-unit</th>
                        <th className="border border-black p-1 text-black w-6">B</th>
                        <th className="border border-black p-1 text-black w-6">A</th>
                        <th className="border border-black p-1 text-black w-6">P</th>
                        {/* Cognitive Processes */}
                        <th className="border border-black p-1 text-black text-[8px] w-6">CP1</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CP2</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CP3</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CP4</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CP5</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CP6</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CP7</th>
                        {/* Item Formats */}
                        <th className="border border-black p-1 text-black text-[8px] w-6">SR1</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">SR2</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CRS1</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CRS2</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CRS3</th>
                        <th className="border border-black p-1 text-black text-[8px] w-6">CRL</th>
                    </tr>
                </thead>
                <tbody>
                    {chunk.map((item, idx) => {
                        const unit = curriculum.units.find((u: any) => u.id === item.unitId);
                        const subUnit = unit?.subUnits.find((s: any) => s.id === item.subUnitId);

                        let time = 2;
                        if (item.totalMarks === 1) time = 2;
                        else if (item.totalMarks === 2) time = 3;
                        else if (item.totalMarks === 3) time = 5;
                        else if (item.totalMarks === 4) time = 8;
                        else if (item.totalMarks === 5) time = 10;
                        else if (item.totalMarks >= 6) time = 15;

                        if (!item.hasInternalChoice) {
                            // Non-choice row
                            return (
                                <tr key={`${item.id}-A`}>
                                    <td className="border border-black p-1 text-center font-bold text-black w-[2.5%]">{idx + 1}</td>
                                    <td className="border border-black p-1 text-black text-[10px] w-[27%]">{unit?.learningOutcomes}</td>
                                    <td className="border border-black p-1 text-center text-black text-[10px] w-[18%]">{unit?.name}</td>
                                    <td className="border border-black p-1 text-center text-black text-[10px] w-[18%]">{subUnit?.name}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.knowledgeLevel === KnowledgeLevel.BASIC ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.knowledgeLevel === KnowledgeLevel.AVERAGE ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.knowledgeLevel === KnowledgeLevel.PROFOUND ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.cognitiveProcess === CognitiveProcess.CP1 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.cognitiveProcess === CognitiveProcess.CP2 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.cognitiveProcess === CognitiveProcess.CP3 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.cognitiveProcess === CognitiveProcess.CP4 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.cognitiveProcess === CognitiveProcess.CP5 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.cognitiveProcess === CognitiveProcess.CP6 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.cognitiveProcess === CognitiveProcess.CP7 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.itemFormat === ItemFormat.SR1 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.itemFormat === ItemFormat.SR2 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.itemFormat === ItemFormat.CRS1 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.itemFormat === ItemFormat.CRS2 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.itemFormat === ItemFormat.CRS3 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold">{item.itemFormat === ItemFormat.CRL ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center font-bold text-black w-[3%]"></td>
                                    <td className="border border-black p-1 text-center font-bold bg-gray-50 text-black w-[4%]">{item.questionCount}({item.totalMarks})</td>
                                    <td className="border border-black p-1 text-center text-black w-[4.5%]">{time}</td>
                                </tr>
                            );
                        }

                        // Internal choice rows (அ and ஆ)
                        // S.No shows 11அ / 11ஆ in separate cells
                        // Learning Objective, Unit, Sub-Unit are all merged with rowSpan=2
                        const klB = item.knowledgeLevelB || item.knowledgeLevel;
                        const cpB = item.cognitiveProcessB || item.cognitiveProcess;
                        const formatB = item.itemFormatB || item.itemFormat;

                        return (
                            <React.Fragment key={item.id}>
                                {/* Row அ */}
                                <tr key={`${item.id}-A`}>
                                    {/* S.No: 11(அ) */}
                                    <td className="border border-black p-1 text-center font-bold text-blue-700 w-[2.5%]">
                                        {idx + 1}<span className="tamil-font font-bold text-[8px] ml-0.5">(அ)</span>
                                    </td>
                                    {/* Learning Objective — merged across அ and ஆ */}
                                    <td className="border border-black p-1 text-black text-[10px] w-[27%] align-top" rowSpan={2}>{unit?.learningOutcomes}</td>
                                    {/* Unit — merged across அ and ஆ */}
                                    <td className="border border-black p-1 text-center text-black text-[10px] w-[18%] align-top" rowSpan={2}>{unit?.name}</td>
                                    {/* Sub-Unit — merged across அ and ஆ */}
                                    <td className="border border-black p-1 text-center text-black text-[10px] w-[18%] align-top" rowSpan={2}>{subUnit?.name}</td>
                                    {/* KL — merged: show A's value spanning both rows */}
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.knowledgeLevel === KnowledgeLevel.BASIC ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.knowledgeLevel === KnowledgeLevel.AVERAGE ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.knowledgeLevel === KnowledgeLevel.PROFOUND ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    {/* CP — merged */}
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.cognitiveProcess === CognitiveProcess.CP1 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.cognitiveProcess === CognitiveProcess.CP2 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.cognitiveProcess === CognitiveProcess.CP3 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.cognitiveProcess === CognitiveProcess.CP4 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.cognitiveProcess === CognitiveProcess.CP5 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.cognitiveProcess === CognitiveProcess.CP6 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.cognitiveProcess === CognitiveProcess.CP7 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    {/* Format — merged */}
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.itemFormat === ItemFormat.SR1 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.itemFormat === ItemFormat.SR2 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.itemFormat === ItemFormat.CRS1 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.itemFormat === ItemFormat.CRS2 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.itemFormat === ItemFormat.CRS3 ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    <td className="border border-black p-1 text-center text-black font-bold align-middle" rowSpan={2}>{item.itemFormat === ItemFormat.CRL ? `${item.questionCount}(${item.totalMarks})` : ''}</td>
                                    {/* OR / Total / Time — merged */}
                                    <td className="border border-black p-1 text-center font-bold bg-gray-50 text-black w-[4%] align-middle" rowSpan={2}>{item.questionCount}({item.totalMarks})</td>
                                    <td className="border border-black p-1 text-center text-black w-[4.5%] align-middle" rowSpan={2}>{time}</td>
                                </tr>
                                {/* Row ஆ — only S.No cell; all others merged from அ row */}
                                <tr key={`${item.id}-B`} className="bg-purple-50/10">
                                    {/* S.No: 11(ஆ) */}
                                    <td className="border border-black p-1 text-center font-bold text-purple-700 w-[2.5%]">
                                        {idx + 1}<span className="tamil-font font-bold text-[8px] ml-0.5">(ஆ)</span>
                                    </td>
                                    {/* All other cells merged from அ row above (rowSpan=2) */}
                                </tr>
                            </React.Fragment>
                        );
                    })}

                    {pageIdx === chunkedItems.length - 1 && (
                        <tr className="font-bold bg-gray-100">
                            <td className="border border-black p-1 text-right text-black" colSpan={4}>Total</td>
                            {Object.values(KnowledgeLevel).map(kl => (
                                <td key={kl} className="border border-black p-1 text-center text-black">
                                    {stats.knowledge[kl] ? `${stats.knowledge[kl].count}(${stats.knowledge[kl].marks})` : ''}
                                </td>
                            ))}
                            {Object.values(CognitiveProcess).map(cp => (
                                <td key={cp} className="border border-black p-1 text-center text-black">
                                    {stats.cognitive[cp] ? `${stats.cognitive[cp].count}(${stats.cognitive[cp].marks})` : ''}
                                </td>
                            ))}
                            {Object.values(ItemFormat).map(fmt => (
                                <td key={fmt} className="border border-black p-1 text-center text-black">
                                    {stats.format[fmt] ? `${stats.format[fmt].count}(${stats.format[fmt].marks})` : ''}
                                </td>
                            ))}
                            <td className="border border-black p-1 text-center text-black font-bold">{totalQuestions}({totalMarks})</td>
                            <td className="border border-black p-1 text-center text-black font-bold">{totalEstimatedTime}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderReport3Content = () => {
        const footerSums = {
            cp: {} as Record<string, { count: number, score: number }>,
            level: {} as Record<string, { count: number, score: number }>,
            format: {} as Record<string, { count: number, score: number }>,
            totalItems: 0,
            totalScore: 0,
            totalTime: 0
        };

        const cpKeys = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7'];
        const levelNames = [KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND];
        const levelKeys = ['B', 'A', 'P'];
        const formatEnums = [ItemFormat.SR1, ItemFormat.SR2, ItemFormat.CRS1, ItemFormat.CRS2, ItemFormat.CRS3, ItemFormat.CRL];
        const formatLabels = ['MCI', 'MI', 'VSA', 'SA', 'SE', 'E'];

        const getDisplayTime = (marks: number) => {
            if (marks === 1) return 2;
            if (marks === 2) return 3;
            if (marks === 3) return 5;
            if (marks === 4) return 8;
            if (marks === 5) return 10;
            if (marks >= 6) return 15;
            return 2;
        };

        return (
            <div className="tamil-font p-1 sm:p-4 bg-white" id="report3-container">
                <style>{`
                    @media print {
                        #report3-container { transform: scale(1.0); transform-origin: top left; }
                    }
                `}</style>

                {/* Report 3 Header Branding */}
                <div className="mb-6 font-sans">
                    <div className="flex justify-between items-start mb-4">
                        <div className="border-2 border-black w-10 h-10 flex items-center justify-center text-xl font-bold">{setId}</div>
                        <div className="text-center flex-1">
                            <h1 className="text-xl font-bold text-black tamil-font">சமக்ர சிக்ஷா கேரளம்</h1>
                            <p className="text-[10px] font-bold tamil-font -mt-1 text-gray-700">கேரளா மாநிலக் கல்வி ஆராய்ச்சி மற்றும் பயிற்சி நிறுவனம்</p>
                        </div>
                        <div className="bg-black text-white rounded-full px-4 py-1 font-bold text-sm">GI {qpCode}</div>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-[16px] font-bold text-black tamil-font">{termTamil} பருவ தொகுத்தறி மதிப்பீடு {academicYear}</h2>
                    <h3 className="text-sm font-bold uppercase text-black mb-3 font-sans">{termEnglish} Term Summative Assessment {academicYear}</h3>
                    
                    <h1 className="text-[18px] font-bold text-black border-b-2 border-black inline-block px-4 pb-1 uppercase">
                        Blueprint Matrix – {blueprint.classLevel}{blueprint.subject.includes('AT') ? 'AT' : 'BT'}
                    </h1>
                    <div className="flex justify-center gap-6 mt-2">
                        <h2 className="text-[14px] font-bold text-black tamil-font">
                            {blueprint.subject.includes('AT') ? 'தமிழ் முதல் தாள் (AT)' : 'தமிழ் இரண்டாம் தாள் (BT)'}
                        </h2>
                        <h2 className="text-[14px] font-bold text-black underline">{blueprint.questionPaperTypeName}</h2>
                    </div>
                </div>

                <table className="w-full border-collapse border-2 border-black text-[9px]">
                    <thead>
                        <tr className="bg-[#e2efda]">
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-8">வி.எண் (S.No)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-[16%]">கற்பித்தல் நோக்கம் (SLO)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-[12%]">அலகு / பாடம் (Unit)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-[12%]">உள் அலகு (Sub Unit)</th>
                            <th colSpan={7} className="border border-black p-1 bg-orange-100 text-black font-bold text-center">அறிவுசார் செயல்பாடுகள் (CP)</th>
                            <th colSpan={3} className="border border-black p-1 bg-blue-100 text-black font-bold text-center">நிலை (Level)</th>
                            <th colSpan={6} className="border border-black p-1 bg-green-100 text-black font-bold text-center">வினா வடிவம் (Fmt)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-7">நேரம் (min)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-7">எண் (Itm)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-8">மதிப். (Scr)</th>
                        </tr>
                        <tr className="bg-[#f2f2f2] text-[8px]">
                            {cpKeys.map(k => <th key={k} className="border border-black p-1 w-6">{k}</th>)}
                            {levelKeys.map(k => <th key={k} className="border border-black p-1 w-6">{k}</th>)}
                            {formatLabels.map(l => <th key={l} className="border border-black p-1 w-7">{l}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedGroups.map((item) => {
                            const unit = curriculum.units.find((u: any) => u.id === item.unitId);
                            const subUnit = unit?.subUnits.find((s: any) => s.id === item.subUnitId);
                            const lo = unit?.learningOutcomes || '-';
                            const hasChoice = item.hasInternalChoice;
                            const time = getDisplayTime(item.marksPerQuestion);
                            const qLabel = item.qRange;

                            // Metadata for Option A
                            const cpA = Object.entries(CognitiveProcess).find(([k, v]) => v === item.cognitiveProcess)?.[0] || '';
                            const klA = item.knowledgeLevel;
                            const klKeyA = klA && klA.length > 0 ? klA[0] : '';
                            const fmtA = item.itemFormat;

                            // Update Footer Sums (Only from Option A profile to represent the distinct item score)
                            if (!footerSums.cp[cpA]) footerSums.cp[cpA] = { count: 0, score: 0 };
                            footerSums.cp[cpA].count += item.questionCount;
                            footerSums.cp[cpA].score += item.totalMarks;

                            if (klKeyA) {
                                if (!footerSums.level[klKeyA]) footerSums.level[klKeyA] = { count: 0, score: 0 };
                                footerSums.level[klKeyA].count += item.questionCount;
                                footerSums.level[klKeyA].score += item.totalMarks;
                            }

                            if (!footerSums.format[fmtA]) footerSums.format[fmtA] = { count: 0, score: 0 };
                            footerSums.format[fmtA].count += item.questionCount;
                            footerSums.format[fmtA].score += item.totalMarks;

                            footerSums.totalItems += item.questionCount;
                            footerSums.totalScore += item.totalMarks;
                            footerSums.totalTime += time * item.questionCount;

                            return (
                                <React.Fragment key={item.id}>
                                    {/* Option A Row */}
                                    <tr className={hasChoice ? 'bg-blue-50/10' : ''}>
                                        <td className="border border-black p-1 text-center font-bold align-middle bg-gray-50" rowSpan={hasChoice ? 2 : 1}>
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span>{qLabel}</span>
                                                {hasChoice && <span className="tamil-font text-[9px] font-bold text-blue-700 bg-blue-100 px-1 rounded">(அ)</span>}
                                            </div>
                                        </td>
                                        <td className="border border-black p-1 tamil-font text-xs align-top bg-white" rowSpan={hasChoice ? 2 : 1}>{lo}</td>
                                        <td className="border border-black p-1 text-center tamil-font text-xs align-top bg-white" rowSpan={hasChoice ? 2 : 1}>Unit {unit?.unitNumber}: {unit?.name}</td>
                                        <td className="border border-black p-1 text-center tamil-font text-xs align-top bg-white" rowSpan={hasChoice ? 2 : 1}>{subUnit?.name}</td>
                                        
                                        {/* CP Columns */}
                                        {cpKeys.map(k => (
                                            <td key={k} className="border border-black p-1 text-center font-bold">
                                                {cpA === k ? `${item.questionCount}(${item.totalMarks})` : ''}
                                            </td>
                                        ))}
                                        {/* Level Columns */}
                                        {levelNames.map(l => (
                                            <td key={l} className="border border-black p-1 text-center font-bold">
                                                {klA === l ? `${item.questionCount}(${item.totalMarks})` : ''}
                                            </td>
                                        ))}
                                        {/* Format Columns */}
                                        {formatEnums.map(f => (
                                            <td key={f} className="border border-black p-1 text-center font-bold">
                                                {fmtA === f ? `${item.questionCount}(${item.totalMarks})` : ''}
                                            </td>
                                        ))}

                                        <td className="border border-black p-1 text-center font-bold" rowSpan={hasChoice ? 2 : 1}>{time * item.questionCount}</td>
                                        <td className="border border-black p-1 text-center font-bold" rowSpan={hasChoice ? 2 : 1}>{item.questionCount}</td>
                                        <td className="border border-black p-1 text-center font-bold" rowSpan={hasChoice ? 2 : 1}>{item.totalMarks}</td>
                                    </tr>

                                    {/* Option B Row */}
                                    {hasChoice && (
                                        <tr className="bg-purple-50/10">
                                            {/* Column 1-4 are rowSpanned from above. 
                                                So this tr starts from column 5 (CP1). 
                                                We'll use a hidden or absolute marker for (ஆ) if needed, 
                                                but we can also put it in the first CP column or just let it be. */}
                                            
                                            {/* CP Columns for B */}
                                            {(() => {
                                                const cpB = Object.entries(CognitiveProcess).find(([k, v]) => v === (item.cognitiveProcessB || item.cognitiveProcess))?.[0] || '';
                                                return cpKeys.map(k => (
                                                    <td key={k} className="border border-black p-1 text-center font-bold">
                                                        {cpB === k ? `${item.questionCount}(${item.totalMarks})` : ''}
                                                    </td>
                                                ));
                                            })()}
                                            {/* Level Columns for B */}
                                            {(() => {
                                                const klB = item.knowledgeLevelB || item.knowledgeLevel;
                                                return levelNames.map(l => (
                                                    <td key={l} className="border border-black p-1 text-center font-bold">
                                                        {klB === l ? `${item.questionCount}(${item.totalMarks})` : ''}
                                                    </td>
                                                ));
                                            })()}
                                            {/* Format Columns for B */}
                                            {(() => {
                                                const fmtB = item.itemFormatB || item.itemFormat;
                                                return formatEnums.map(f => (
                                                    <td key={f} className="border border-black p-1 text-center font-bold">
                                                        {fmtB === f ? `${item.questionCount}(${item.totalMarks})` : ''}
                                                    </td>
                                                ));
                                            })()}
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Totals Item Row */}
                        <tr className="bg-gray-200 font-bold border-t-2 border-black">
                            <td colSpan={4} className="border border-black p-1 uppercase text-right">Total Item</td>
                            {cpKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-blue-800">
                                    {footerSums.cp[k]?.count || ''}
                                </td>
                            ))}
                            {levelKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-blue-800">
                                    {footerSums.level[k]?.count || ''}
                                </td>
                            ))}
                            {formatEnums.map(f => (
                                <td key={f} className="border border-black p-1 text-center text-blue-800">
                                    {footerSums.format[f]?.count || ''}
                                </td>
                            ))}
                            <td className="border border-black p-1 text-center">{footerSums.totalTime}</td>
                            <td className="border border-black p-1 text-center bg-black text-white">{footerSums.totalItems}</td>
                            <td className="border border-black p-1 bg-gray-300"></td>
                        </tr>

                        {/* Totals Score Row */}
                        <tr className="bg-gray-200 font-bold">
                            <td colSpan={4} className="border border-black p-1 uppercase text-right">Total Score</td>
                            {cpKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-red-800">
                                    {footerSums.cp[k]?.score || ''}
                                </td>
                            ))}
                            {levelKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-red-800">
                                    {footerSums.level[k]?.score || ''}
                                </td>
                            ))}
                            {formatEnums.map(f => (
                                <td key={f} className="border border-black p-1 text-center text-red-800">
                                    {footerSums.format[f]?.score || ''}
                                </td>
                            ))}
                            <td className="border border-black p-1 bg-gray-300"></td>
                            <td className="border border-black p-1 bg-gray-300"></td>
                            <td className="border border-black p-1 text-center bg-white text-black font-extrabold text-[11px]">{footerSums.totalScore}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

    );

    }; // end of renderReport3Content

    return (
        <div className="mt-10 w-full text-black reports-container relative">
            {/* Sticky Sub-Header for Reports */}
            <div className="sticky top-[72px] z-30 bg-white/95 backdrop-blur-sm py-4 mb-8 no-print border-b shadow-md flex justify-center items-center gap-4 flex-wrap px-4 rounded-lg">
                <div className="flex bg-gray-200 p-1 rounded-full shadow-inner overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('report1')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report1' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Report 1
                    </button>
                    <button
                        onClick={() => setActiveTab('report2')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report2' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Report 2
                    </button>
                    <button
                        onClick={() => setActiveTab('report3')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report3' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Report 3
                    </button>
                    <button
                        onClick={() => setActiveTab('answerKey')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'answerKey' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Answer Key
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onDownloadPDF?.(activeTab)}
                        className="bg-red-600 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-red-700 flex items-center gap-2 transition-all transform hover:scale-105 text-sm md:text-base outline-none"
                    >
                        <Download size={18} />
                        PDF
                    </button>
                    <button
                        onClick={() => onDownloadWord?.(activeTab)}
                        className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-blue-800 flex items-center gap-2 transition-all transform hover:scale-105 text-sm md:text-base outline-none"
                    >
                        <FileText size={18} />
                        Word
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-gray-700 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-gray-800 flex items-center gap-2 transition-all transform hover:scale-105 text-sm md:text-base outline-none"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                </div>
            </div>

            <div className={`print-only-container ${activeTab === 'report2' || activeTab === 'report3' ? 'landscape-mode' : ''}`}>
                {/* --- UI VIEW (Only active tab) --- */}
                <div className="reports-display-content">
                    {activeTab === 'report1' && (
                        <div className="max-w-[210mm] mx-auto space-y-8 bg-white p-8 mb-8 shadow-md rounded-xl">
                            {renderReport1Content()}
                        </div>
                    )}

                    {activeTab === 'report2' && (
                        <div className="w-full space-y-8">
                            {chunkedItems.map((chunk, pageIdx) => (
                                <div key={pageIdx} className="w-full bg-white p-8 shadow-md mb-8 landscape-report-page rounded-xl">
                                    {renderReport2Content(chunk, pageIdx)}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'report3' && (
                        <div className="w-full bg-white p-8 mb-8 shadow-md rounded-xl overflow-x-auto">
                            {renderReport3Content()}
                        </div>
                    )}

                    {activeTab === 'answerKey' && (
                        <div className="max-w-[210mm] mx-auto bg-white p-8 mb-8 shadow-md rounded-xl">
                            <AnswerKeyView blueprint={blueprint} curriculum={curriculum} />
                        </div>
                    )}
                </div>

                {/* --- PDF CAPTURE SOURCE (positioned off-screen but fully visible for html2canvas) --- */}
                <div id="pdf-capture-source" className="no-print" style={{ position: 'fixed', top: 0, left: '-99999px', zIndex: -1, pointerEvents: 'none' }}>
                    <div id="report-page-1" className="bg-white p-8" style={{ width: '794px' }}>
                        {renderReport1Content(1)}
                    </div>
                    <div id="report-page-2" className="bg-white p-8" style={{ width: '794px' }}>
                        {renderReport1Content(2)}
                    </div>

                    {chunkedItems.map((chunk, pageIdx) => (
                        <div key={pageIdx} id={`report-item-analysis-page-${pageIdx}`} className="bg-white p-8" style={{ width: '1920px' }}>
                            {renderReport2Content(chunk, pageIdx)}
                        </div>
                    ))}

                    <div id="report-page-blueprint-matrix" className="bg-white p-8" style={{ width: '1920px' }}>
                        {renderReport3Content()}
                    </div>

                    <div id="report-answer-key" className="bg-white" style={{ width: '794px', padding: '32px' }}>
                        <AnswerKeyView blueprint={blueprint} curriculum={curriculum} isPdf={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SummaryTable Component ---

export const SummaryTable = ({ items = [] }: { items?: BlueprintItem[] }) => {
    if (!items || items.length === 0) return null;
    const totalMarks = items.reduce((acc, item) => acc + item.totalMarks, 0);



    // 1. Format Stats
    const formatStats = items.reduce((acc, item) => {
        // Count Option A
        if (!acc[item.itemFormat]) acc[item.itemFormat] = { count: 0, marks: 0 };
        acc[item.itemFormat].count += item.questionCount;
        acc[item.itemFormat].marks += item.totalMarks;

        // Count Option B if exists
        if (item.hasInternalChoice) {
            const fmtB = item.itemFormatB || item.itemFormat;
            if (!acc[fmtB]) acc[fmtB] = { count: 0, marks: 0 };
            acc[fmtB].count += item.questionCount;
            acc[fmtB].marks += item.totalMarks;
        }
        return acc;
    }, {} as Record<string, { count: number, marks: number }>);

    // 2. Knowledge Level Stats
    const knowledgeStats = items.reduce((acc, item) => {
        // Count Option A
        const keyA = item.knowledgeLevel || 'Unknown';
        if (!acc[keyA]) acc[keyA] = { count: 0, marks: 0 };
        acc[keyA].count += item.questionCount;
        acc[keyA].marks += item.totalMarks;

        // Count Option B if exists
        if (item.hasInternalChoice) {
            const keyB = item.knowledgeLevelB || item.knowledgeLevel || 'Unknown';
            if (!acc[keyB]) acc[keyB] = { count: 0, marks: 0 };
            acc[keyB].count += item.questionCount;
            acc[keyB].marks += item.totalMarks;
        }
        return acc;
    }, {} as Record<string, { count: number, marks: number }>);

    // 3. Cognitive Process Stats
    const cognitiveStats = items.reduce((acc, item) => {
        // Count Option A
        const cpCodeA = item.cognitiveProcess?.split(' ')[0] || 'N/A';
        if (!acc[cpCodeA]) acc[cpCodeA] = { count: 0, marks: 0 };
        acc[cpCodeA].count += item.questionCount;
        acc[cpCodeA].marks += item.totalMarks;

        // Count Option B if exists
        if (item.hasInternalChoice) {
            const cpCodeB = (item.cognitiveProcessB || item.cognitiveProcess)?.split(' ')[0] || 'N/A';
            if (!acc[cpCodeB]) acc[cpCodeB] = { count: 0, marks: 0 };
            acc[cpCodeB].count += item.questionCount;
            acc[cpCodeB].marks += item.totalMarks;
        }
        return acc;
    }, {} as Record<string, { count: number, marks: number }>);

    // 4. Option Stats
    const optionStats = items.reduce((acc, item) => {
        const key = item.hasInternalChoice ? 'With Option' : 'No Option';
        if (!acc[key]) acc[key] = { count: 0, marks: 0 };
        acc[key].count += item.questionCount;
        acc[key].marks += item.totalMarks;
        return acc;
    }, {} as Record<string, { count: number, marks: number }>);

    const StatTable = ({ title, data }: { title: string, data: Record<string, { count: number, marks: number }> }) => (
        <div className="bg-white border rounded shadow-sm overflow-hidden flex-1 min-w-[200px]">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-2 text-left font-bold text-gray-700 uppercase tracking-wider">{title}</th>
                        <th className="p-2 text-center font-bold text-gray-700 w-16">Qns</th>
                        <th className="p-2 text-center font-bold text-gray-700 w-16">Marks</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).sort((a, b) => b[0].localeCompare(a[0])).map(([key, stat]) => (
                        <tr key={key} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="p-2 font-medium text-gray-800">{key}</td>
                            <td className="p-2 text-center text-gray-600 border-l">{stat.count}</td>
                            <td className="p-2 text-center text-gray-900 font-bold border-l">{stat.marks}</td>
                        </tr>
                    ))}
                    {Object.keys(data).length === 0 && (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-400 italic">No data</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="mt-8 no-print animate-fade-in">
            <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <LayoutDashboard size={16} className="text-blue-600" /> Blueprint Summary
                <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm border border-green-200">
                    Grand Total: {items.length} Items | {totalMarks} Marks
                </span>
            </h4>
            <div className="flex gap-4 items-start flex-wrap">
                <StatTable title="Knowledge Level" data={knowledgeStats} />
                <StatTable title="Item Format" data={formatStats} />
                <StatTable title="Cognitive Process" data={cognitiveStats} />
                <StatTable title="Option/Choice" data={optionStats} />
            </div>
        </div>
    );
};

// --- Matrix Component with Drag and Drop ---

export const BlueprintMatrix = ({ blueprint, curriculum, onUpdateItem, paperType, onMoveItem, readOnly }: any) => {
    const sections = paperType.sections.sort((a: any, b: any) => a.marks - b.marks);

    // Drag Handlers
    const handleDragStart = (e: React.DragEvent, item: BlueprintItem) => {
        if (readOnly) return;
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const getMarkColor = (marks: number) => {
        switch (marks) {
            case 1: return 'bg-blue-50 border-blue-200 text-blue-900';
            case 2: return 'bg-green-50 border-green-200 text-green-900';
            case 3: return 'bg-yellow-50 border-yellow-200 text-yellow-900';
            case 4: return 'bg-orange-50 border-orange-200 text-orange-900';
            case 5: return 'bg-purple-50 border-purple-200 text-purple-900';
            case 6: return 'bg-pink-50 border-pink-200 text-pink-900';
            default: return 'bg-gray-50 border-gray-200 text-gray-900';
        }
    };

    const getKnowledgeBorderClass = (level: KnowledgeLevel) => {
        switch (level) {
            case KnowledgeLevel.BASIC: return 'border-l-4 border-l-green-500';
            case KnowledgeLevel.AVERAGE: return 'border-l-4 border-l-yellow-500';
            case KnowledgeLevel.PROFOUND: return 'border-l-4 border-l-red-500';
            default: return 'border-l-4 border-l-gray-300';
        }
    };

    const handleDrop = (e: React.DragEvent, unitId: string, subUnitId: string, sectionId: string) => {
        if (readOnly) return;
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        onMoveItem(itemId, unitId, sectionId, subUnitId);
    };

    const getCellItems = (unitId: string, subUnitId: string, sectionId: string) => {
        return blueprint.items.filter((i: any) => i.unitId === unitId && i.subUnitId === subUnitId && i.sectionId === sectionId);
    };

    return (
        <div className="overflow-x-auto">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold uppercase border-b-2 border-black inline-block px-4 pb-1">Blue Print</h2>
                <div className="flex justify-between mt-4 text-sm font-bold px-10">
                    <span>Class: {blueprint.classLevel}</span>
                    <span>Subject: {blueprint.subject}</span>
                    <span>Set: {blueprint.setId || 'A'}</span>
                    <span>Max Marks: {blueprint.totalMarks}</span>
                </div>
            </div>

            <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="border border-gray-800 p-3 w-10">#</th>
                        <th className="border border-gray-800 p-3 text-left">UNIT COMPONENT</th>
                        <th className="border border-gray-800 p-3 text-left">LESSON/TOPIC</th>
                        <th className="border border-gray-800 p-3 text-center bg-yellow-400 text-black font-bold">MARKS</th>
                        {sections.map((s: any, i: number) => (
                            <th key={s.id} className="border border-gray-800 p-3 text-center">
                                {s.marks} Marks <br /> <span className="text-[10px] text-gray-400 uppercase">Count: {s.count}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {curriculum.units.map((unit: any) => {
                        return unit.subUnits.map((subUnit: any, sIdx: number) => {
                            const isFirstSubUnit = sIdx === 0;
                            const subUnitItems = blueprint.items.filter((i: any) => i.unitId === unit.id && i.subUnitId === subUnit.id);
                            const subUnitTotal = subUnitItems.reduce((a: number, b: any) => a + b.totalMarks, 0);

                            return (
                                <tr key={subUnit.id} className="hover:bg-gray-50">
                                    {isFirstSubUnit && (
                                        <td className="border border-gray-800 p-3 text-center font-bold text-gray-500 bg-white align-middle" rowSpan={unit.subUnits.length}>
                                            {unit.unitNumber}
                                        </td>
                                    )}
                                    {isFirstSubUnit && (
                                        <td className="border border-gray-800 p-3 font-bold text-blue-800 bg-white align-middle" rowSpan={unit.subUnits.length}>
                                            {unit.name}
                                            {(() => {
                                                const unitTotalForPercent = blueprint.items
                                                    .filter((i: any) => i.unitId === unit.id)
                                                    .reduce((acc: number, curr: any) => acc + curr.totalMarks, 0);
                                                const unitPercent = Math.round((unitTotalForPercent / blueprint.totalMarks) * 100);

                                                return (
                                                    <div className="text-xs text-gray-500 font-normal mt-1 no-print">
                                                        {unitPercent}% ({unitTotalForPercent})
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    )}
                                    <td className="border border-gray-800 p-3 italic text-gray-700 bg-white">
                                        {subUnit.name}
                                    </td>
                                    <td className="border border-gray-800 p-3 text-center font-bold text-lg bg-yellow-50 text-orange-600">
                                        {subUnitTotal || ''}
                                    </td>

                                    {sections.map((s: any) => {
                                        const items = getCellItems(unit.id, subUnit.id, s.id);
                                        return (
                                            <td
                                                key={s.id}
                                                className="border border-gray-800 p-1 align-top h-16 min-w-[100px] relative group transition-colors"
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, unit.id, subUnit.id, s.id)}
                                            >
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {items.map((item: any) => (
                                                        <React.Fragment key={item.id}>
                                                            <div
                                                                draggable={!readOnly}
                                                                onDragStart={(e) => handleDragStart(e, item)}
                                                                onClick={() => !readOnly && setEditingItemId(item.id)}
                                                                className={`p-1.5 rounded-sm text-xs text-center border shadow-sm w-full relative group transition-all
                                                                    ${!readOnly ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                                                                    ${getMarkColor(item.marksPerQuestion)}
                                                                    ${getKnowledgeBorderClass(item.knowledgeLevel)}
                                                                `}
                                                            >
                                                                <div className="font-bold flex justify-between items-center px-1">
                                                                    <span>{item.questionCount}Q {item.hasInternalChoice ? '(A)' : ''}</span>
                                                                    <span className="text-[10px] opacity-75">({item.totalMarks}M)</span>
                                                                </div>
                                                                <div className="text-[9px] leading-tight mt-1 opacity-90 flex justify-between gap-1">
                                                                    <span title={item.knowledgeLevel}>{item.knowledgeLevel[0]}</span>
                                                                    <span title={item.cognitiveProcess}>{item.cognitiveProcess.split(' ')[0]}</span>
                                                                    <span>{item.itemFormat}</span>
                                                                    {item.hasInternalChoice && <span className="font-bold text-blue-600" title="Option A">OR</span>}
                                                                </div>

                                                                {/* Shared Mini Editor Popover - Attached to Card A */}
                                                                {editingItemId === item.id && (
                                                                    <div className="absolute top-full left-0 mt-1 bg-white border shadow-xl rounded p-3 z-50 w-64 text-left space-y-3" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex justify-between items-center border-b pb-1">
                                                                            <div className="text-xs font-bold text-gray-700">Edit Question Properties</div>
                                                                            <button onClick={() => setEditingItemId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                                                        </div>

                                                                        {/* Global Option Toggle */}
                                                                        <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                                                            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Internal Choice (OR)</label>
                                                                            <button
                                                                                onClick={() => onUpdateItem(item.id, 'hasInternalChoice', !item.hasInternalChoice)}
                                                                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${item.hasInternalChoice ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                                            >
                                                                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${item.hasInternalChoice ? 'translate-x-4' : 'translate-x-0'}`} />
                                                                            </button>
                                                                        </div>

                                                                        {/* Option A Section */}
                                                                        <div className="space-y-2">
                                                                            <div className="text-[10px] font-bold text-blue-600 uppercase">Option A Settings</div>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="block text-[9px] text-gray-500">Knowledge</label>
                                                                                    <select
                                                                                        value={item.knowledgeLevel}
                                                                                        onChange={(e) => onUpdateItem(item.id, 'knowledgeLevel', e.target.value)}
                                                                                        className={`w-full text-xs border rounded p-1 ${item.marksPerQuestion === 1 ? 'opacity-75 bg-gray-50' : ''}`}
                                                                                        disabled={item.marksPerQuestion === 1}
                                                                                    >
                                                                                        {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-[9px] text-gray-500">Cognitive</label>
                                                                                    <select value={item.cognitiveProcess} onChange={(e) => onUpdateItem(item.id, 'cognitiveProcess', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                        {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v.split(' ')[0]}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] text-gray-500">Format</label>
                                                                                <select value={item.itemFormat} onChange={(e) => onUpdateItem(item.id, 'itemFormat', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                    {Object.values(ItemFormat).map(f => <option key={f} value={f}>{f}</option>)}
                                                                                </select>
                                                                            </div>
                                                                        </div>

                                                                        {/* Option B Section (Conditional) */}
                                                                        {item.hasInternalChoice && (
                                                                            <div className="space-y-2 pt-2 border-t">
                                                                                <div className="text-[10px] font-bold text-purple-600 uppercase">Option B Settings</div>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <label className="block text-[9px] text-gray-500">Knowledge</label>
                                                                                        <select
                                                                                            value={item.knowledgeLevelB || item.knowledgeLevel}
                                                                                            onChange={(e) => onUpdateItem(item.id, 'knowledgeLevelB', e.target.value)}
                                                                                            className={`w-full text-xs border rounded p-1 ${item.marksPerQuestion === 1 ? 'opacity-75 bg-gray-50' : ''}`}
                                                                                            disabled={item.marksPerQuestion === 1}
                                                                                        >
                                                                                            {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="block text-[9px] text-gray-500">Cognitive</label>
                                                                                        <select value={item.cognitiveProcessB || item.cognitiveProcess} onChange={(e) => onUpdateItem(item.id, 'cognitiveProcessB', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                            {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v.split(' ')[0]}</option>)}
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-[9px] text-gray-500">Format</label>
                                                                                    <select value={item.itemFormatB || item.itemFormat} onChange={(e) => onUpdateItem(item.id, 'itemFormatB', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                        {Object.values(ItemFormat).map(f => <option key={f} value={f}>{f}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="text-right pt-2">
                                                                            <button onClick={(e) => { e.stopPropagation(); setEditingItemId(null); }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">Done</button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Duplicate Card for Option B */}
                                                            {item.hasInternalChoice && (
                                                                <div
                                                                    onClick={() => !readOnly && setEditingItemId(item.id)}
                                                                    className={`p-1.5 rounded-sm text-xs text-center border shadow-sm w-full mt-1 relative transition-all
                                                                        ${!readOnly ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                                                                        ${getMarkColor(item.marksPerQuestion)}
                                                                        ${getKnowledgeBorderClass(item.knowledgeLevelB || item.knowledgeLevel)}
                                                                        bg-purple-50/30 border-dashed
                                                                    `}
                                                                >
                                                                    <div className="font-bold flex justify-between items-center px-1">
                                                                        <span className="text-purple-700">{item.questionCount}Q (B)</span>
                                                                        <span className="text-[10px] opacity-75">({item.totalMarks}M)</span>
                                                                    </div>
                                                                    <div className="text-[9px] leading-tight mt-1 opacity-90 flex justify-between gap-1">
                                                                        <span title={item.knowledgeLevelB || item.knowledgeLevel}>{(item.knowledgeLevelB || item.knowledgeLevel)[0]}</span>
                                                                        <span title={item.cognitiveProcessB || item.cognitiveProcess}>{(item.cognitiveProcessB || item.cognitiveProcess).split(' ')[0]}</span>
                                                                        <span>{item.itemFormatB || item.itemFormat}</span>
                                                                        <span className="font-bold text-purple-600">OR</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        });
                    })}
                    <tr className="bg-indigo-900 text-white font-bold h-16">
                        <td className="border border-indigo-900 p-3 text-right uppercase tracking-wider" colSpan={3}>Total Aggregates</td>
                        <td className="border border-indigo-900 p-3 text-center text-2xl bg-yellow-400 text-black">{blueprint.totalMarks}</td>
                        {sections.map((s: any) => {
                            const sectionTotal = blueprint.items.filter((i: any) => i.sectionId === s.id).reduce((a: number, b: any) => a + b.questionCount, 0);
                            const sectionTotalMarks = blueprint.items.filter((i: any) => i.sectionId === s.id).reduce((a: number, b: any) => a + b.totalMarks, 0);
                            return (
                                <td key={s.id} className="border border-indigo-900 p-2 text-center align-middle">
                                    <div className="text-xl">{sectionTotal}</div>
                                    <div className="text-[10px] opacity-75 font-normal">{sectionTotalMarks} Marks</div>
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

// --- User Dashboard ---

const UserDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [showReports, setShowReports] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [sharingBlueprintId, setSharingBlueprintId] = useState<string | null>(null);
    const [filterView, setFilterView] = useState<'all' | 'owned' | 'shared'>('all');

    const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel._10);
    const [selectedSubject, setSelectedSubject] = useState<SubjectType>(SubjectType.TAMIL_AT);
    const [selectedTerm, setSelectedTerm] = useState<ExamTerm>(ExamTerm.FIRST);
    const [selectedSet, setSelectedSet] = useState<string>('Set A');
    const [selectedPaperType, setSelectedPaperType] = useState<string>('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2025-2026');
    const [currentBlueprint, setCurrentBlueprint] = useState<Blueprint | null>(null);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [isConfigExpanded, setIsConfigExpanded] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    const [allUsers, setAllUsers] = useState<User[]>([]);

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
    }, [view, user.id]);

    useEffect(() => {
        const load = async () => {
            if (view === 'create' || view === 'edit') {
                const cur = await getCurriculum(selectedClass, selectedSubject);
                const db = getDB() || await initDB();
                setCurriculum(filterCurriculumByTerm(db, cur, selectedTerm));
            }
        };
        load();
    }, [selectedClass, selectedSubject, selectedTerm, view]);

    // Automatically collapse config if confirmed
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
        setSelectedSubject(SubjectType.TAMIL_AT);
        setSelectedTerm(ExamTerm.FIRST);
        setSelectedSet('Set A');
        setSelectedAcademicYear('2025-2026');
        setSelectedPaperType('');
        setShowReports(false);
        setShowQuestions(false);
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
        alert("Blueprint saved successfully!");
    };

    const handleDownloadPDF = async (type: 'all' | 'report1' | 'report2' | 'report3' | 'answerKey' = 'all') => {
        if (!printRef.current) return;

        let pdf = new jsPDF('p', 'mm', 'a4');
        const MARGIN = 10;
        const pdfWidthPortrait = 210;
        const pdfHeightPortrait = 297;
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
                onclone: (clonedDoc) => {
                    const tamilElements = clonedDoc.querySelectorAll('.tamil-font');
                    tamilElements.forEach(el => {
                        (el as HTMLElement).style.fontFamily = "'TAU-Pallai', 'TAU-Palaai', 'Noto Serif', serif";
                    });
                }
            });
            const img = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidthPortrait) / canvas.width;
            // Removed Math.min to prevent clipping at the bottom if it's slightly over
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
                
                // Use Custom Page Size for Report 3 to ensure everything fits perfectly
                const pxToMm = 0.264583;
                const imgWidthMm = 1920 * pxToMm; // Based on windowWidth 1920
                const imgHeightMm = (canvas.height / 2.5) * pxToMm;
                
                const pageWidth = imgWidthMm + (MARGIN * 2);
                const pageHeight = imgHeightMm + (MARGIN * 2);

                if (!firstPage) {
                    pdf.addPage([pageWidth, pageHeight], 'l');
                } else {
                    // Start with custom size if it's the only/first report
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
                    onclone: (clonedDoc) => {
                        const headers = clonedDoc.querySelectorAll('th');
                        headers.forEach(h => {
                            (h as HTMLElement).style.backgroundColor = '#dcfce7'; // green-100 approx
                            (h as HTMLElement).style.color = '#000000';
                        });
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
            }
        }

        pdf.save(`blueprint_report_${currentBlueprint.id}.pdf`);
    };

    const handleDownloadWord = async (type: 'report1' | 'report2' | 'report3' | 'answerKey' | 'all') => {
        if (!currentBlueprint || !curriculum) return;

        try {
            if (type === 'report1' || type === 'all') {
                await DocExportService.exportReport1(currentBlueprint, curriculum);
            }
            if (type === 'report2' || type === 'all') {
                await DocExportService.exportReport2(currentBlueprint, curriculum);
            }
            if (type === 'report3' || type === 'all') {
                await DocExportService.exportReport3(currentBlueprint, curriculum);
            }
            if (type === 'answerKey' || type === 'all') {
                await DocExportService.exportAnswerKey(currentBlueprint, curriculum);
            }
        } catch (error) {
            console.error("Word export failed:", error);
            alert("Failed to export Word document. Please check the console for details.");
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
                // Update all relevant fields based on new location
                return {
                    ...item,
                    unitId: newUnitId,
                    sectionId: newSectionId,
                    // Assign to specific sub-unit if provided, else first sub-unit of new unit by default
                    subUnitId: newSubUnitId || newUnit.subUnits[0]?.id || 'unknown',
                    // Update marks based on the new section column
                    marksPerQuestion: newSection.marks,
                    totalMarks: newSection.marks * item.questionCount,
                    // Reset format and knowledge to defaults for this mark level
                    itemFormat: getDefaultFormat(newSection.marks),
                    knowledgeLevel: getDefaultKnowledge(newSection.marks)
                };
            }
            return item;
        });
        setCurrentBlueprint({ ...currentBlueprint, items: updatedItems });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
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
                                {/* Filter Tabs */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setFilterView('all')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterView === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterView('owned')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterView === 'owned'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        My Blueprints
                                    </button>
                                    <button
                                        onClick={() => setFilterView('shared')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterView === 'shared'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
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
                                    <p>
                                        {filterView === 'owned' && 'No blueprints created yet. Create your first one!'}
                                        {filterView === 'shared' && 'No blueprints shared with you yet.'}
                                        {filterView === 'all' && 'No blueprints found. Create your first one!'}
                                    </p>
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
                                                                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit" title={`Shared by ${ownerUser?.name || 'Unknown'}`}>
                                                                        <Share2 size={12} />
                                                                        Shared
                                                                    </span>
                                                                )}
                                                                {bp.isConfirmed ? (
                                                                    <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit">
                                                                        <CheckCircle size={12} />
                                                                        Confirmed
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit">
                                                                        <Clock size={12} />
                                                                        Draft
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-500">{new Date(bp.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-4 font-medium text-blue-600">
                                                            {bp.questionPaperTypeName || 'N/A'}
                                                            {!isOwner && ownerUser && (
                                                                <div className="text-xs text-gray-500 mt-1">by {ownerUser.name}</div>
                                                            )}
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
                                                                    title={bp.isLocked ? "Locked by Admin" : "Edit Paper"}
                                                                >
                                                                    {bp.isLocked && <Lock size={14} />}
                                                                    Edit
                                                                </button>
                                                                {isOwner && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setSharingBlueprintId(bp.id)}
                                                                            className="text-green-600 hover:underline flex items-center gap-1"
                                                                            title="Share this blueprint"
                                                                        >
                                                                            <Share2 size={14} />
                                                                            Share
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(bp.id)}
                                                                            className={`${bp.isLocked ? 'text-gray-300' : 'text-red-500'} hover:underline`}
                                                                            disabled={bp.isLocked}
                                                                        >
                                                                            Delete
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
                                            <button onClick={handleGenerate} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
                                                Generate Matrix
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {currentBlueprint && curriculum && (
                            <div className="space-y-6">
                                {/* Toolbar */}
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
                                                    <span className="hidden md:inline">Question Entry</span>
                                                    <span className="md:hidden">Q-Entry</span>
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
                                                <button
                                                    onClick={handleRegeneratePattern}
                                                    className="bg-orange-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow-md hover:bg-orange-600 flex items-center font-bold text-sm md:text-base whitespace-nowrap transition-all"
                                                    title="Regenerate with different pattern"
                                                >
                                                    <RefreshCw className="mr-1 md:mr-2" size={18} />
                                                    <span className="hidden md:inline">New Pattern</span>
                                                    <span className="md:hidden">Shuff</span>
                                                </button>
                                                <button
                                                    onClick={handleConfirmPattern}
                                                    className="bg-blue-600 text-white px-3 py-1.5 md:px-6 md:py-2 rounded shadow-md hover:bg-blue-700 flex items-center font-bold text-sm md:text-base whitespace-nowrap transition-all"
                                                >
                                                    <CheckCircle className="mr-1 md:mr-2" size={18} />
                                                    <span className="hidden md:inline">Confirm</span>
                                                    <span className="md:hidden">Confirm</span>
                                                </button>
                                            </>
                                        )}
                                        <button onClick={handleSaveToDB} className="bg-green-600 text-white px-3 py-1.5 md:px-6 md:py-2 rounded shadow hover:bg-green-700 flex items-center font-bold text-sm md:text-base whitespace-nowrap transition-all">
                                            <Save className="mr-1 md:mr-2" size={18} />
                                            <span className="hidden md:inline">Save Blueprint</span>
                                            <span className="md:hidden">Save</span>
                                        </button>
                                    </div>
                                </div>

                                <div ref={printRef} className={`bg-white rounded shadow ${showReports ? 'p-0' : 'p-6'}`}>
                                    {/* Conditional Rendering of Views */}
                                    {(() => {
                                        const activeCurriculum = curriculum;

                                        return (
                                            <>
                                                {!showReports && !showQuestions && (
                                                    <BlueprintMatrix
                                                        blueprint={currentBlueprint}
                                                        curriculum={activeCurriculum}
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
                                                        curriculum={activeCurriculum}
                                                        onDownloadPDF={handleDownloadPDF}
                                                        onDownloadWord={handleDownloadWord}
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}


                                    {!showReports && currentBlueprint && (
                                        <div className="mt-8 pt-8 border-t px-6 pb-6">
                                            <SummaryTable items={currentBlueprint.items} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-center gap-4 no-print border-t pt-6">
                                    <button onClick={() => window.print()} className="bg-gray-700 text-white px-6 py-2 rounded flex items-center hover:bg-gray-800">
                                        <Printer className="mr-2" /> Print View
                                    </button>
                                    {!showReports && (
                                        <button onClick={() => handleDownloadPDF('all')} className="bg-red-600 text-white px-6 py-2 rounded flex items-center hover:bg-red-700">
                                            <Download className="mr-2" /> Download Full PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {view === 'create' && !currentBlueprint && (
                            <div className="text-center p-8 text-gray-500 bg-gray-100 rounded border-dashed border-2">
                                Select a Question Paper Type to begin.
                            </div>
                        )}
                    </div>
                )}
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
        </div>
    );
};

// ... [Main App remains] ...
const App = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                await initDB();
                const saved = localStorage.getItem('currentUser');
                if (saved) setCurrentUser(JSON.parse(saved));
            } catch (err) {
                console.error("Initialization failed", err);
            } finally {
                setInitialized(true);
            }
        };
        load();
    }, []);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
    };

    const handleLogout = () => {
        logout();
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    if (!initialized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-700">Connecting to Database...</h2>
                <p className="text-gray-500 mt-2">Please ensure the backend server is running.</p>
            </div>
        );
    }

    if (!currentUser) return <Login onLogin={handleLogin} />;
    if (currentUser.role === Role.ADMIN) return <AdminPortal user={currentUser} onLogout={handleLogout} />;
    return <UserDashboard user={currentUser} onLogout={handleLogout} />;
};

export default App;
