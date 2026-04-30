import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Blueprint, Curriculum, BlueprintItem, CognitiveProcess, ItemFormat, QuestionPaperType, ExamTerm, KnowledgeLevel, Discourse, ReportSettings } from '@/types';
import { Download, FileText, Settings, X, Check } from 'lucide-react';
import AnswerKeyView from './AnswerKeyView';

interface ReportsViewProps {
    blueprint: Blueprint;
    curriculum: Curriculum;
    discourses?: Discourse[];
    paperType?: QuestionPaperType;
    onDownloadPDF: (tab: string) => void;
    onDownloadWord: (tab: string) => void;
    isAdmin?: boolean;
    onUpdateReportSettings?: (settings: Blueprint['reportSettings'], perReport?: Blueprint['perReportSettings']) => void;
    onSaveSettings?: () => Promise<void>;
    onMoveItem?: (itemId: string, newUnitId: string, newSectionId: string, newSubUnitId?: string) => void;
    onUpdateItemField?: (id: string, field: keyof BlueprintItem, val: any) => void;
}

export const ReportsView = ({
    blueprint,
    curriculum,
    discourses,
    paperType,
    onDownloadPDF,
    onDownloadWord,
    isAdmin = false,
    onUpdateReportSettings,
    onSaveSettings,
    onMoveItem,
    onUpdateItemField
}: ReportsViewProps) => {
    const [activeTab, setActiveTab] = useState('report1');
    const [customMinutes, setCustomMinutes] = useState<number | null>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [tempMinutes, setTempMinutes] = useState<string>("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const handleSave = async () => {
        if (onSaveSettings) {
            setIsSavingSettings(true);
            try {
                await onSaveSettings();
                setIsSettingsOpen(false);
            } catch (error) {
                console.error("Failed to save settings:", error);
                Swal.fire("Error", "Failed to save settings to database.", "error");
            } finally {
                setIsSavingSettings(false);
            }
        } else {
            setIsSettingsOpen(false);
        }
    };

    const defaultSettings: ReportSettings = {
        fontFamily: 'TAU-Paalai',
        fontFamilyEnglish: 'Georgia',
        headerFontStyle: 'Syne',
        fontSizeBody: 12,
        fontSizeTitle: 14,
        fontSizeTamil: 14,
        lineHeight: 1.2,
        rowHeight: 35,
        columnWidths: {},
        showLogo: true,
        compactMode: false,
        orientation: 'p'
    };

    const getSettingsForTab = (tab: string): ReportSettings => {
        const defaultOrient = (tab === 'report2' || tab === 'report3') ? 'l' : 'p';
        const globalOrient = blueprint.reportSettings?.orientation;
        const perReportOrient = blueprint.perReportSettings?.[tab]?.orientation;

        const perReport = blueprint.perReportSettings?.[tab];

        return {
            ...defaultSettings,
            ...blueprint.reportSettings,
            ...perReport,
            orientation: perReportOrient || globalOrient || defaultOrient
        };
    };

    const settings = getSettingsForTab(activeTab);

    const getDisplayTime = (item: BlueprintItem) => {
        if (item.time !== undefined && item.time !== null && item.time !== 0) return item.time;
        const section = paperType?.sections.find(s => s.id === item.sectionId);
        if (section?.timePerQuestion) return section.timePerQuestion;
        const marks = item.marksPerQuestion;
        if (marks <= 2) return 5;
        if (marks <= 4) return 10;
        return 15;
    };

    const getTotalExamMinutes = () => {
        const totalFromItems = blueprint.items.reduce((sum, item) => sum + getDisplayTime(item), 0);
        if (totalFromItems > 0) return totalFromItems;
        if (!paperType) return 150;
        const totalMinutes = paperType.sections.reduce((sum, section) => sum + ((section.timePerQuestion || 0) * section.count), 0);
        return totalMinutes || 150;
    };

    const getItemQuestionCount = (item: BlueprintItem) => Math.max(item.questionCount || 1, 1);
    const getItemTotalScore = (item: BlueprintItem) => getItemQuestionCount(item) * (item.marksPerQuestion || 0);

    const derivedTotalItems = blueprint.items.reduce((sum, item) => sum + getItemQuestionCount(item), 0);
    const derivedTotalMarks = blueprint.items.reduce((sum, item) => sum + getItemTotalScore(item), 0);

    const examMinutes = customMinutes || getTotalExamMinutes();
    const timeWarning = examMinutes > 90
        ? "மொத்த நேரம் 90 நிமிடங்களுக்கு மிகாமல் இருக்க வேண்டும்!"
        : examMinutes < 90
            ? "மொத்த நேரம் 90 நிமிடங்களுக்கு குறைவாக உள்ளது."
            : null;

    const cpDefinitions = [
        { key: 'CP1', label: 'Conceptual Clarity', value: CognitiveProcess.CP1 },
        { key: 'CP2', label: 'Application Skill', value: CognitiveProcess.CP2 },
        { key: 'CP3', label: 'Computational Thinking', value: CognitiveProcess.CP3 },
        { key: 'CP4', label: 'Analytical Thinking', value: CognitiveProcess.CP4 },
        { key: 'CP5', label: 'Critical Thinking', value: CognitiveProcess.CP5 },
        { key: 'CP6', label: 'Creative Thinking', value: CognitiveProcess.CP6 },
        { key: 'CP7', label: 'Values / Attitude', value: CognitiveProcess.CP7 }
    ];
    const levelDefinitions = [
        { key: 'B', label: 'Basic Level', value: KnowledgeLevel.BASIC },
        { key: 'A', label: 'Average Level', value: KnowledgeLevel.AVERAGE },
        { key: 'P', label: 'Profound Level', value: KnowledgeLevel.PROFOUND }
    ];
    const formatDefinitions = [
        { key: 'SR1', label: 'Multiple Choice Item', value: ItemFormat.SR1 },
        { key: 'SR2', label: 'Matching Item', value: ItemFormat.SR2 },
        { key: 'CRS1', label: 'VSA', value: ItemFormat.CRS1 },
        { key: 'CRS2', label: 'SA', value: ItemFormat.CRS2 },
        { key: 'CRL', label: 'Essay', value: ItemFormat.CRL }
    ];

    const createStats = () => ({
        cp: Object.fromEntries(cpDefinitions.map(def => [def.key, { count: 0, score: 0 }])) as Record<string, { count: number; score: number }>,
        levels: Object.fromEntries(levelDefinitions.map(def => [def.key, { count: 0, score: 0 }])) as Record<string, { count: number; score: number }>,
        formats: Object.fromEntries(formatDefinitions.map(def => [def.key, { count: 0, score: 0 }])) as Record<string, { count: number; score: number }>
    });

    const normalizeValue = (stored: string, definitions: any[]): string => {
        if (!stored) return '';
        const s = stored.toString().trim().toLowerCase();
        const clean = (str: string) => str.replace(/[^a-z0-9]/g, '');
        const sClean = clean(s);
        const byVal = definitions.find(def => clean(def.value.toLowerCase()) === sClean);
        if (byVal) return byVal.value;
        const byKey = definitions.find(def => clean(def.key.toLowerCase()) === sClean);
        if (byKey) return byKey.value;
        const byLabel = definitions.find(def => clean(def.label.toLowerCase()) === sClean);
        if (byLabel) return byLabel.value;
        return stored;
    };

    const normalizeCPValue = (stored: string) => normalizeValue(stored, cpDefinitions);
    const normalizeLevelValue = (stored: string) => normalizeValue(stored, levelDefinitions);
    const normalizeFormatValue = (stored: string) => normalizeValue(stored, formatDefinitions);

    const addToStats = (
        stats: ReturnType<typeof createStats>,
        cognitiveProcess: CognitiveProcess,
        knowledgeLevel: KnowledgeLevel,
        itemFormat: ItemFormat,
        score: number,
        questionCount: number = 1
    ) => {
        const normalizedCP = normalizeCPValue(cognitiveProcess as string) as CognitiveProcess;
        const normalizedLevel = normalizeLevelValue(knowledgeLevel as string) as KnowledgeLevel;
        const normalizedFormat = normalizeFormatValue(itemFormat as string) as ItemFormat;
        const cpKey = cpDefinitions.find(def => def.value === normalizedCP)?.key;
        const levelKey = levelDefinitions.find(def => def.value === normalizedLevel)?.key;
        const formatKey = formatDefinitions.find(def => def.value === normalizedFormat)?.key;
        if (cpKey) { stats.cp[cpKey].count += questionCount; stats.cp[cpKey].score += score; }
        if (levelKey) { stats.levels[levelKey].count += questionCount; stats.levels[levelKey].score += score; }
        if (formatKey) { stats.formats[formatKey].count += questionCount; stats.formats[formatKey].score += score; }
    };

    const formatMark = (m: number) => {
        const s = m.toString();
        let result = s;
        if (s.endsWith('.5')) {
            const whole = s.split('.')[0];
            result = whole === '0' ? '½' : `${whole}½`;
        }
        return <span className="english-font" style={{ fontFamily: "'Times New Roman', serif" }}>{result}</span>;
    };

    const renderMixedText = (text: string | undefined | null) => {
        if (!text) return '-';
        const segments = text.toString().split(/([அ-ஹ\u0B80-\u0BFF]+)/);
        return segments.map((seg, i) => {
            if (!seg) return null;
            const isTamil = /[அ-ஹ\u0B80-\u0BFF]/.test(seg);
            return (
                <span
                    key={i}
                    className={isTamil ? "tamil-font" : "english-font"}
                    style={{
                        fontFamily: isTamil ? `'TAU-Paalai', 'Latha', serif` : `'Times New Roman', serif`,
                        fontSize: isTamil ? `${settings.fontSizeTamil}pt` : `${settings.fontSizeBody}pt`,
                        lineHeight: isTamil ? `1.4` : '1.2'
                    }}
                >
                    {seg}
                </span>
            );
        });
    };

    const termEnglish = blueprint.examTerm;
    const academicYear = blueprint.academicYear || '2025-26';
    const qpCodeValue = blueprint.questionPaperTypeId?.split('-').shift() || 'QP';
    const qpTypeNumber = qpCodeValue.replace(/[^0-9]/g, '');
    const displayQpType = qpTypeNumber || qpCodeValue;
    const setId = blueprint.setId?.split(' ').pop() || 'A';
    const subjectInfo = blueprint.subject.includes('AT')
        ? { tamil: 'Tamil Language Paper I (AT)', english: 'Tamil Language Paper I (AT)', code: '02' }
        : blueprint.subject.includes('BT')
            ? { tamil: 'Tamil Language Paper II (BT)', english: 'Tamil Language Paper II (BT)', code: '12' }
            : { tamil: blueprint.subject, english: blueprint.subject, code: '00' };

    const sectionIndexMap = new Map((paperType?.sections || []).map((section, idx) => [section.id, idx]));
    const unitOrderMap = new Map((curriculum?.units || []).map(unit => [unit.id, unit.unitNumber]));
    const orderedItems = [...blueprint.items].sort((a, b) => {
        const aIdx = a.sectionId ? sectionIndexMap.get(a.sectionId) ?? 999 : 999;
        const bIdx = b.sectionId ? sectionIndexMap.get(b.sectionId) ?? 999 : 999;
        if (aIdx !== bIdx) return aIdx - bIdx;
        const unitA = unitOrderMap.get(a.unitId) || 999;
        const unitB = unitOrderMap.get(b.unitId) || 999;
        if (unitA !== unitB) return unitA - unitB;
        if (a.marksPerQuestion !== b.marksPerQuestion) return a.marksPerQuestion - b.marksPerQuestion;
        return blueprint.items.indexOf(a) - blueprint.items.indexOf(b);
    });

    const report3Items = orderedItems;

    // ============================================================
    // WORD DOWNLOAD
    // ============================================================
    const handleDownloadWord = (tab: string) => {
        if (onDownloadWord) {
            onDownloadWord(tab);
        } else {
            Swal.fire("Error", "Word export is not available in this view.", "error");
        }
    };

    // ============================================================
    // RENDER REPORT 1 (Portrait A4 — 2 pages)
    // ============================================================
    const renderReport1Content = (page: number = 1) => {
        const totalScore = derivedTotalMarks;
        const totalExamMinutes = examMinutes;

        if (page === 1) {
            const contentAreaStats = curriculum.units.map(unit => {
                const unitItems = orderedItems.filter(item => item.unitId === unit.id);
                const score = unitItems.reduce((sum, item) => sum + getItemTotalScore(item), 0);
                return { unit, score };
            }).filter(s => s.score > 0);

            const cpStats = cpDefinitions.map(def => {
                const score = blueprint.items.reduce((sum, item) => {
                    const normalizedCP = normalizeCPValue(item.cognitiveProcess as string);
                    return normalizedCP === def.value ? sum + getItemTotalScore(item) : sum;
                }, 0);
                return { ...def, score };
            });

            const levelStats = levelDefinitions.map(def => {
                const score = blueprint.items.reduce((sum, item) =>
                    item.knowledgeLevel === def.value ? sum + getItemTotalScore(item) : sum, 0);
                return { ...def, score };
            });

            return (
                <div className="bg-white mx-auto w-full flex flex-col font-serif text-black r1-page-inner reports-visible-content">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold text-black border-b border-black inline-block px-12 pb-0.5">Proforma for Analysing Question Paper</h1>
                        <div className="text-xl font-bold mt-1">Topic/Sub Topic wise Analysis</div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-1 mb-2 text-[11pt] font-bold">
                        <div className="flex justify-start"><span className="w-20">Class</span><span className="mx-2">:</span><span className="english-font">{blueprint.classLevel}</span></div>
                        <div className="flex justify-start"><span className="w-24">Subject</span><span className="mx-2">:</span><span className="leading-none !text-[11pt] !font-normal !not-italic">{renderMixedText(subjectInfo.tamil)}</span></div>
                        <div className="flex justify-start"><span className="w-20">Set</span><span className="mx-2">:</span><span className="english-font">{setId}</span></div>
                        <div className="flex justify-start"><span className="w-24">Type</span><span className="mx-2">:</span><span className="english-font">1</span></div>
                        <div className="flex justify-start"><span className="w-20">Score</span><span className="mx-2">:</span><span className="english-font">{totalScore} Marks</span></div>
                        <div className="flex justify-start"><span className="w-24">Time</span><span className="mx-2">:</span><span className="english-font">{totalExamMinutes} Minutes</span></div>
                        <div className="flex justify-start"><span className="w-20">Term</span><span className="mx-2">:</span><span className="!font-normal !not-italic english-font">{termEnglish}</span></div>
                        <div className="flex justify-start"><span className="w-24">Year</span><span className="mx-2">:</span><span className="english-font">{academicYear}</span></div>
                    </div>
                    <div className="border-b border-black w-full mb-4"></div>

                    <div className="text-center text-xl font-bold text-black mb-1 uppercase tracking-tight">
                        PART - I: QUESTION PAPER DESIGN - HS
                    </div>
                    <div className="border-b border-black w-full mb-4"></div>

                    <div className="mb-6">
                        <h3 className="text-[12pt] font-bold text-black mb-1">I. Weightage to Content Area</h3>
                        <div className="border-b border-black w-full mb-2"></div>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-tight" style={{ fontFamily: "'TAU-Paalai', serif" }}>
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black text-center font-bold w-[6%] text-[9pt]" style={{ padding: '5px' }}>Sl. No</th>
                                    <th className="border border-black text-center font-bold w-[28%] text-[9pt]" style={{ padding: '5px' }}>Learning Objective</th>
                                    <th className="border border-black text-center font-bold w-[22%] text-[9pt]" style={{ padding: '5px' }}>Unit / Topic / Chapter</th>
                                    <th className="border border-black text-center font-bold w-[22%] text-[9pt]" style={{ padding: '5px' }}>Sub-unit / Sub-topic</th>
                                    <th className="border border-black text-center font-bold w-[6%] text-[9pt]" style={{ padding: '5px' }}>Score</th>
                                    <th className="border border-black text-center font-bold w-[7%] text-[9pt]" style={{ padding: '5px' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contentAreaStats.map((row, idx) => (
                                    <tr key={row.unit.id}>
                                        <td className="border border-black px-1 py-2 text-center align-middle english-font">{idx + 1}</td>
                                        <td className="border border-black px-2 py-2 text-[10pt] text-left whitespace-pre-line leading-relaxed">{row.unit.learningOutcomes || '-'}</td>
                                        <td className="border border-black px-2 py-2 text-left leading-relaxed">{row.unit.name}</td>
                                        <td className="border border-black px-2 py-2 italic text-[10pt] text-left whitespace-pre-line leading-relaxed">{row.unit.subUnits.map(s => s.name).join(', ')}</td>
                                        <td className="border border-black px-1 py-2 text-center font-bold align-middle english-font">{formatMark(row.score)}</td>
                                        <td className="border border-black px-1 py-2 text-center align-middle english-font">{totalScore > 0 ? Math.round((row.score / totalScore) * 100) : 0}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold h-8">
                                    <td colSpan={4} className="border border-black px-1.5 py-1 text-center uppercase tracking-widest">Total</td>
                                    <td className="border border-black px-1.5 py-1 text-center english-font">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-1 text-center english-font">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black mb-1">II. Weightage to Cognitive Process</h3>
                        <div className="border-b border-black w-full mb-2"></div>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-tight">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black text-center font-bold w-[12%] text-[9pt]" style={{ padding: '5px' }}>Sl. No.</th>
                                    <th className="border border-black text-center font-bold w-[54%] text-[9pt]" style={{ padding: '5px' }}>Cognitive Process</th>
                                    <th className="border border-black text-center font-bold w-[17%] text-[9pt]" style={{ padding: '5px' }}>Score</th>
                                    <th className="border border-black text-center font-bold w-[17%] text-[9pt]" style={{ padding: '5px' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cpStats.map((row, idx) => (
                                    <tr key={row.key}>
                                        <td className="border border-black px-1.5 py-1 text-center font-bold english-font">CP{idx + 1}</td>
                                        <td className="border border-black px-4 py-1 text-left leading-tight text-[10pt]">{row.label}</td>
                                        <td className="border border-black px-1.5 py-1 text-center english-font">{row.score ? formatMark(row.score) : '-'}</td>
                                        <td className="border border-black px-1.5 py-1 text-center english-font">{row.score > 0 && totalScore > 0 ? (row.score / totalScore * 100).toFixed(row.score / totalScore * 100 % 1 === 0 ? 0 : 1) + '%' : '-'}</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold h-8">
                                    <td colSpan={2} className="border border-black px-1.5 py-1 text-center uppercase tracking-widest">Total</td>
                                    <td className="border border-black px-1.5 py-1 text-center english-font">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-1 text-center english-font">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black mb-1">III. Weightage to Knowledge Level</h3>
                        <div className="border-b border-black w-full mb-2"></div>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-tight">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black text-center font-bold w-[12%] text-[9pt]" style={{ padding: '5px' }}>Sl. No.</th>
                                    <th className="border border-black text-left font-bold w-[54%] text-[9pt]" style={{ padding: '5px' }}>Knowledge Level</th>
                                    <th className="border border-black text-center font-bold w-[17%] text-[9pt]" style={{ padding: '5px' }}>Score</th>
                                    <th className="border border-black text-center font-bold w-[17%] text-[9pt]" style={{ padding: '5px' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {levelStats.map((row, idx) => (
                                    <tr key={row.key}>
                                        <td className="border border-black px-1.5 py-1 text-center english-font">{idx + 1}</td>
                                        <td className="border border-black px-1.5 py-1 text-left leading-tight text-[10pt]">{row.label.split(' ')[0]}</td>
                                        <td className="border border-black px-1.5 py-1 text-center english-font">{row.score ? formatMark(row.score) : '-'}</td>
                                        <td className="border border-black px-1.5 py-1 text-center english-font">{row.score > 0 && totalScore > 0 ? (row.score / totalScore * 100).toFixed(0) + '%' : '-'}</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold h-8">
                                    <td colSpan={2} className="border border-black px-1.5 py-1 text-center uppercase tracking-widest">Total</td>
                                    <td className="border border-black px-1.5 py-1 text-center english-font">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-1 text-center english-font">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        if (page === 2) {
            const getFormatGroupStats = (formats: string[]) => {
                return blueprint.items.reduce((acc, item) => {
                    if (formats.includes(item.itemFormat as string)) {
                        acc.count += getItemQuestionCount(item);
                        acc.score += getItemTotalScore(item);
                        acc.time += getDisplayTime(item);
                    }
                    return acc;
                }, { count: 0, score: 0, time: 0 });
            };

            const sr1Stats = getFormatGroupStats([ItemFormat.SR1]);
            const sr2Stats = getFormatGroupStats([ItemFormat.SR2]);
            const crs1Stats = getFormatGroupStats([ItemFormat.CRS1]);
            const crs2Stats = getFormatGroupStats([ItemFormat.CRS2]);
            const crlStats = getFormatGroupStats([ItemFormat.CRL]);

            const totalInternalChoiceScore = blueprint.items
                .filter(item => item.hasInternalChoice)
                .reduce((sum, item) => sum + getItemTotalScore(item), 0);
            const internalChoicePercent = totalScore > 0 ? Math.round((totalInternalChoiceScore / totalScore) * 100) : 0;
            const hasInternalChoice = totalInternalChoiceScore > 0;

            return (
                <div className="bg-white mx-auto w-full flex flex-col font-serif text-black r1-page-inner reports-visible-content">
                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black border-b border-black mb-1.5 pb-0.5 uppercase tracking-tight">IV. Weightage to Item Format</h3>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-tight">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black text-center font-bold w-[7%]" style={{ padding: '5px' }}>Sl. No.</th>
                                    <th className="border border-black text-left font-bold w-[18%]" style={{ padding: '5px' }}>Item Format</th>
                                    <th className="border border-black text-center font-bold w-[8%]" style={{ padding: '5px' }}>Code</th>
                                    <th className="border border-black text-center font-bold w-[8%]" style={{ padding: '5px' }}>Format</th>
                                    <th className="border border-black text-center font-bold w-[12%]" style={{ padding: '5px' }}>No. of Items</th>
                                    <th className="border border-black text-center font-bold w-[12%]" style={{ padding: '5px' }}>Estimated Time</th>
                                    <th className="border border-black text-center font-bold w-[12%]" style={{ padding: '5px' }}>Score allotted</th>
                                    <th className="border border-black text-center font-bold w-[10%]" style={{ padding: '5px' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { s: sr1Stats, code: 'SR1', fmt: 'MCI', n: 'SR Item', sl: 1 },
                                    { s: sr2Stats, code: 'SR2', fmt: 'MI', n: 'SR Item', sl: 2 },
                                    { s: crs1Stats, code: 'CRS1', fmt: 'VSA', n: 'CRS Item', sl: 3 },
                                    { s: crs2Stats, code: 'CRS2', fmt: 'SA', n: 'CRS Item', sl: 4 },
                                    { s: crlStats, code: 'CRL', fmt: 'E', n: 'CRL Item', sl: 5 }
                                ].map(r => (
                                    <tr key={r.code}>
                                        <td className="border border-black px-1.5 py-0.5 text-center english-font">{r.sl}</td>
                                        <td className="border border-black px-1.5 py-0.5 font-semibold leading-tight">{r.n}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center font-bold english-font">{r.code}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center font-bold english-font">{r.fmt}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center english-font">{r.s.count || '-'}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center english-font">{r.s.time || '-'}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center font-bold">{r.s.score ? formatMark(r.s.score) : '-'}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center english-font">{r.s.score > 0 ? Math.round((r.s.score / totalScore) * 100) : '-'}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold">
                                    <td colSpan={4} className="border border-black px-1.5 py-0.5 text-center uppercase">Total</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center english-font">{blueprint.items.reduce((sum, item) => sum + getItemQuestionCount(item), 0)}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center english-font">{totalExamMinutes}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center english-font">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center english-font">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 text-[10pt] leading-tight">
                        <div className="font-bold underline mb-2">Index of Abbreviations:</div>
                        <div className="grid grid-cols-2 gap-x-12">
                            <div className="space-y-1">
                                <div>SR - Selected Response</div>
                                <div>CRS - Constructed Response Short Answer</div>
                                <div>CRL - Constructed Response Long Answer</div>
                            </div>
                            <div className="space-y-1">
                                <div>MCI - Multiple Choice Items</div>
                                <div>MI - Matching Item</div>
                                <div>VSA - Very Short Answer</div>
                                <div>SA - Short Answer</div>
                                <div>E - Essay</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 mt-8">
                        <h3 className="text-lg font-bold text-black border-b border-black mb-2 pb-1 uppercase tracking-tight">V. Scheme of Sections :</h3>
                        <div className="min-h-[40px] border-b border-gray-200"></div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-black border-b border-black mb-2 pb-1 uppercase tracking-tight">VI. Pattern of Options :</h3>
                        <div className="space-y-2 ml-4">
                            <div className="flex items-center gap-4">
                                <span className="w-40 font-bold text-sm">Internal choice</span>
                                <div className="border border-black w-6 h-6 flex items-center justify-center text-lg font-bold english-font">
                                    {hasInternalChoice ? '✓' : ''}
                                </div>
                                <span className="text-sm font-bold ml-2 english-font">
                                    {hasInternalChoice ? `${internalChoicePercent}%` : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="w-40 font-bold text-sm">Overall choice</span>
                                <div className="border border-black w-6 h-6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const questionRows = report3Items.flatMap((item, index) => {
        const unit = curriculum.units.find(u => u.id === item.unitId);
        const subUnit = unit?.subUnits.find(s => s.id === item.subUnitId);
        const effectiveHasInternalChoice = !!item.hasInternalChoice;
        const baseRow = {
            id: `${item.id}-A`,
            qNo: `${index + 1}${effectiveHasInternalChoice ? ' (அ)' : ''}`,
            item, unit, subUnit,
            cognitiveProcess: normalizeCPValue(item.cognitiveProcess as string) as CognitiveProcess,
            knowledgeLevel: normalizeLevelValue(item.knowledgeLevel as string) as KnowledgeLevel,
            itemFormat: normalizeFormatValue(item.itemFormat as string) as ItemFormat
        };
        if (!effectiveHasInternalChoice) return [baseRow];
        return [
            baseRow,
            {
                ...baseRow,
                id: `${item.id}-B`,
                qNo: `${index + 1} (ஆ)`,
                cognitiveProcess: normalizeCPValue((item.cognitiveProcessB || item.cognitiveProcess) as string) as CognitiveProcess,
                knowledgeLevel: normalizeLevelValue((item.knowledgeLevelB || item.knowledgeLevel) as string) as KnowledgeLevel,
                itemFormat: normalizeFormatValue((item.itemFormatB || item.itemFormat) as string) as ItemFormat
            }
        ];
    });

    const activeUnitIds = new Set(orderedItems.map(item => item.unitId));
    const report2Rows = curriculum.units
        .filter(unit => activeUnitIds.has(unit.id))
        .map((unit) => {
            const unitItems = orderedItems.filter(item => item.unitId === unit.id);
            const subUnitsStats = (unit.subUnits || []).map(subUnit => {
                const subUnitItems = unitItems.filter(item => item.subUnitId === subUnit.id);
                const stats = createStats();
                subUnitItems.forEach(item => addToStats(stats, item.cognitiveProcess, item.knowledgeLevel, item.itemFormat, getItemTotalScore(item), getItemQuestionCount(item)));
                return { subUnit, stats, totalItems: subUnitItems.reduce((s, i) => s + getItemQuestionCount(i), 0), totalScore: subUnitItems.reduce((s, i) => s + getItemTotalScore(i), 0), totalTime: subUnitItems.reduce((s, i) => s + getDisplayTime(i), 0) };
            });
            const unitStats = createStats();
            unitItems.forEach(item => addToStats(unitStats, item.cognitiveProcess, item.knowledgeLevel, item.itemFormat, getItemTotalScore(item), getItemQuestionCount(item)));
            const optionStats = createStats();
            unitItems.filter(item => item.hasInternalChoice).forEach(item => addToStats(optionStats, item.cognitiveProcessB || item.cognitiveProcess, item.knowledgeLevelB || item.knowledgeLevel, item.itemFormatB || item.itemFormat, getItemTotalScore(item), getItemQuestionCount(item)));
            return {
                id: unit.id, unit, subUnitsStats, unitStats, optionStats,
                hasOptions: unitItems.some(i => i.hasInternalChoice),
                optionCount: unitItems.filter(i => i.hasInternalChoice).reduce((s, i) => s + getItemQuestionCount(i), 0),
                optionScore: unitItems.filter(i => i.hasInternalChoice).reduce((s, i) => s + getItemTotalScore(i), 0),
                totalTime: unitItems.reduce((s, i) => s + getDisplayTime(i), 0),
                totalItems: unitItems.reduce((s, i) => s + getItemQuestionCount(i), 0),
                totalScore: unitItems.reduce((s, i) => s + getItemTotalScore(i), 0)
            };
        });

    const renderReportHeader = (partLabel: string) => (
        <div className="mb-4 relative">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-black border-b-2 border-black inline-block px-4 pb-1">Proforma for Analysing Question Paper</h1>
                <div className="text-lg font-bold mt-1">Topic/Sub Topic wise Analysis</div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-[11pt] font-bold border-b border-black pb-3">
                <div className="flex"><span className="w-24">Class</span><span className="mx-2">:</span><span className="english-font">{blueprint.classLevel}</span></div>
                <div className="flex"><span className="w-24">Subject</span><span className="mx-2">:</span><span>{renderMixedText(subjectInfo.tamil)}</span></div>
                <div className="flex"><span className="w-24">Set</span><span className="mx-2">:</span><span className="english-font">{setId}</span></div>
                <div className="flex"><span className="w-24">Type</span><span className="mx-2">:</span><span className="english-font">{displayQpType}</span></div>
                <div className="flex"><span className="w-24">Term</span><span className="mx-2">:</span><span>{termEnglish}</span></div>
                <div className="flex"><span className="w-24">Year</span><span className="mx-2">:</span><span className="english-font">{academicYear}</span></div>
            </div>
            <div className="text-center text-xl font-bold text-black mb-2 uppercase tracking-tight border-b border-black/50 pb-1 inline-block w-full">{partLabel}</div>
        </div>
    );

    const renderAnalysisColGroup = (showFirst: boolean) => (
        <colgroup>
            {showFirst && <col style={{ width: '4%' }} />}
            <col style={{ width: showFirst ? '15%' : '17.5%' }} />
            <col style={{ width: showFirst ? '10%' : '11.5%' }} />
            <col style={{ width: showFirst ? '15%' : '17.5%' }} />
            {cpDefinitions.map(def => <col key={def.key} style={{ width: '2.6%' }} />)}
            {levelDefinitions.map(def => <col key={def.key} style={{ width: '2.6%' }} />)}
            {formatDefinitions.map(def => <col key={def.key} style={{ width: '2.6%' }} />)}
            <col style={{ width: '3.2%' }} />
            <col style={{ width: '3.2%' }} />
            <col style={{ width: '3.2%' }} />
        </colgroup>
    );

    const renderAnalysisTableHeader = (firstColumnLabel: string, padding: string = '3px') => {
        const showFirst = !!firstColumnLabel;
        return (
            <thead>
                <tr className="bg-[#d9ead3] text-[9px]">
                    {showFirst && <th rowSpan={2} className="border border-black font-bold text-center" style={{ padding }}>{firstColumnLabel}</th>}
                    <th colSpan={3} className="border border-black font-bold text-center" style={{ padding }}>Content Area</th>
                    <th colSpan={7} className="border border-black font-bold text-center" style={{ fontSize: '7.5px', padding }}>Cognitive Process</th>
                    <th colSpan={3} className="border border-black font-bold text-center" style={{ fontSize: '7.5px', padding }}>Knowledge Level</th>
                    <th colSpan={5} className="border border-black font-bold text-center" style={{ fontSize: '7.5px', padding }}>Item Format</th>
                    <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px', padding }}>Total Item</th>
                    <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px', padding }}>Total Score</th>
                    <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px', padding }}>Time</th>
                </tr>
                <tr className="bg-[#fff2cc] text-[7.5px] leading-tight">
                    <th className="border border-black font-bold" style={{ padding }}>Topic / Unit</th>
                    <th className="border border-black font-bold" style={{ padding }}>Learning Objective</th>
                    <th className="border border-black font-bold" style={{ padding }}>Sub Topic</th>
                    {cpDefinitions.map(def => <th key={def.key} className="border border-black font-bold english-font" style={{ fontSize: '9px', padding }}>{def.key}</th>)}
                    {levelDefinitions.map(def => <th key={def.key} className="border border-black font-bold english-font" style={{ fontSize: '9px', padding }}>{def.key}</th>)}
                    {formatDefinitions.map(def => <th key={def.key} className="border border-black font-bold english-font" style={{ fontSize: '9px', padding }}>{def.key}</th>)}
                </tr>
            </thead>
        );
    };

    const renderReport2Content = () => {
        const grandTotals = createStats();
        orderedItems.forEach(item => {
            addToStats(
                grandTotals,
                item.cognitiveProcess,
                item.knowledgeLevel,
                item.itemFormat,
                getItemTotalScore(item),
                getItemQuestionCount(item)
            );
        });
        return (
            <div className="text-black">
                {renderReportHeader('Part – II : Unit-wise Analysis')}
                <table className="border-collapse border-2 border-black text-[8px] leading-[1.05] table-fixed" style={{ width: '99%', margin: '0 auto 0 0' }}>
                    {renderAnalysisColGroup(false)}
                    {renderAnalysisTableHeader('', '5px')}
                    <tbody>
                        {report2Rows.map((row) => (
                            <React.Fragment key={row.id}>
                                {row.subUnitsStats.map((su, suIdx) => (
                                    <tr key={su.subUnit.id} className="bg-white">
                                        {suIdx === 0 && (
                                            <>
                                                <td rowSpan={row.subUnitsStats.length} className="border border-black px-[2px] py-[1.5px] text-[9px] leading-[1] font-semibold align-top">{renderMixedText(`${row.unit.unitNumber}. ${row.unit.name}`)}</td>
                                                <td rowSpan={row.subUnitsStats.length} className="border border-black px-[2px] py-[1.5px] text-[9px] leading-[1] align-top">{renderMixedText(row.unit.learningOutcomes || '-')}</td>
                                            </>
                                        )}
                                        <td className="border border-black px-[2px] py-[1.5px] text-[9px] leading-[1]">{renderMixedText(su.subUnit.name)}</td>
                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px] english-font">{su.stats.cp[def.key].count ? <>{su.stats.cp[def.key].count}({formatMark(su.stats.cp[def.key].score)})</> : ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px] english-font">{su.stats.levels[def.key].count ? <>{su.stats.levels[def.key].count}({formatMark(su.stats.levels[def.key].score)})</> : ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px] english-font">{su.stats.formats[def.key].count ? <>{su.stats.formats[def.key].count}({formatMark(su.stats.formats[def.key].score)})</> : ''}</td>)}
                                        <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px] english-font">{su.totalItems || ''}</td>
                                        <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px] font-bold english-font">{su.totalScore ? formatMark(su.totalScore) : ''}</td>
                                        <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px] english-font">{su.totalTime || ''}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100">
                                    <td colSpan={3} className="border border-black text-[9px] text-black font-bold whitespace-nowrap leading-[1] align-middle" style={{ padding: '8px' }}>
                                        {row.hasOptions ? `Options / Choice Questions (${row.optionCount})` : 'Options / Choice Questions'}
                                    </td>
                                    {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px] text-black font-bold bg-gray-100 leading-[1] align-middle">{row.optionStats.cp[def.key].count ? <>{row.optionStats.cp[def.key].count}({formatMark(row.optionStats.cp[def.key].score)})</> : ''}</td>)}
                                    {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px] text-black font-bold bg-gray-100 leading-[1] align-middle">{row.optionStats.levels[def.key].count ? <>{row.optionStats.levels[def.key].count}({formatMark(row.optionStats.levels[def.key].score)})</> : ''}</td>)}
                                    {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px] text-black font-bold bg-gray-100 leading-[1] align-middle">{row.optionStats.formats[def.key].count ? <>{row.optionStats.formats[def.key].count}({formatMark(row.optionStats.formats[def.key].score)})</> : ''}</td>)}
                                    <td className="border border-black px-[1px] py-[4px] text-center text-[9px] text-black font-bold bg-gray-100 leading-[1] align-middle">{row.hasOptions ? row.optionCount : ''}</td>
                                    <td className="border border-black px-[1px] py-[4px] text-center text-[9px] text-black font-bold bg-gray-100 leading-[1] align-middle">{row.hasOptions ? formatMark(row.optionScore) : ''}</td>
                                    <td className="border border-black px-[1px] py-[4px] bg-gray-100 leading-[1] align-middle"></td>
                                </tr>
                            </React.Fragment>
                        ))}
                        <tr className="bg-gray-100 font-black">
                            <td colSpan={3} className="border border-black text-right uppercase tracking-widest text-[10px]" style={{ padding: '5px' }}>TOTAL ITEM</td>
                            {cpDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[10px] english-font font-black" style={{ padding: '5px' }}>{grandTotals.cp[def.key].count || ''}</td>)}
                            {levelDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[10px] english-font font-black" style={{ padding: '5px' }}>{grandTotals.levels[def.key].count || ''}</td>)}
                            {formatDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[10px] english-font font-black" style={{ padding: '5px' }}>{grandTotals.formats[def.key].count || ''}</td>)}
                            <td className="border border-black text-center text-[10px] english-font font-black" style={{ padding: '5px' }}>{derivedTotalItems}</td>
                            <td className="border border-black bg-black"></td>
                            <td rowSpan={2} className="border border-black text-center text-[10px] font-black english-font align-middle" style={{ padding: '5px' }}>{examMinutes}</td>
                        </tr>
                        <tr className="bg-gray-100 font-black">
                            <td colSpan={3} className="border border-black text-right uppercase tracking-widest text-[10px]" style={{ padding: '5px' }}>TOTAL SCORE</td>
                            {cpDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[10px] english-font font-black" style={{ padding: '5px' }}>{grandTotals.cp[def.key].score ? formatMark(grandTotals.cp[def.key].score) : ''}</td>)}
                            {levelDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[10px] english-font font-black" style={{ padding: '5px' }}>{grandTotals.levels[def.key].score ? formatMark(grandTotals.levels[def.key].score) : ''}</td>)}
                            {formatDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[10px] english-font font-black" style={{ padding: '5px' }}>{grandTotals.formats[def.key].score ? formatMark(grandTotals.formats[def.key].score) : ''}</td>)}
                            <td className="border border-black bg-black"></td>
                            <td className="border border-black text-center text-[10px] font-black english-font" style={{ padding: '5px' }}>{formatMark(derivedTotalMarks)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderReport3Content = () => {
        const totals = questionRows.filter(row => !row.id.endsWith('-B')).reduce((acc, row) => {
            const rowMarks = getItemTotalScore(row.item);
            const rowQuestionCount = getItemQuestionCount(row.item);
            addToStats(acc.stats, row.cognitiveProcess as CognitiveProcess, row.knowledgeLevel as KnowledgeLevel, row.itemFormat as ItemFormat, rowMarks, rowQuestionCount);
            return acc;
        }, { stats: createStats() });
        return (
            <div className="text-black">
                {renderReportHeader('Part – III : Item-wise Analysis')}
                <table className="border-collapse border-2 border-black text-[8px] leading-[1.05] table-fixed" style={{ width: '99%', margin: '0 auto 0 0' }}>
                    {renderAnalysisColGroup(true)}
                    {renderAnalysisTableHeader('Item / Q. No', '5px')}
                    <tbody>
                        {questionRows.map((row) => {
                            const isOptionRow = row.id.endsWith('-B');
                            const rowMarks = getItemTotalScore(row.item);
                            const rowQuestionCount = getItemQuestionCount(row.item);
                            return (
                                <tr key={row.id} className={isOptionRow ? "bg-gray-50/50" : "bg-white"}>
                                    <td className="border border-black px-[2px] py-[2px] text-center text-[7.5px] font-bold english-font">{row.qNo}</td>
                                    <td className="border border-black px-[3px] py-[2px] text-[8px] leading-[1.05] font-semibold">{renderMixedText(row.unit ? `${row.unit.unitNumber}. ${row.unit.name}` : '-')}</td>
                                    <td className="border border-black px-[3px] py-[2px] text-[7px] leading-[1.02]">{renderMixedText(row.unit?.learningOutcomes || '-')}</td>
                                    <td className="border border-black px-[3px] py-[2px] text-[8px] leading-[1.05]">{renderMixedText(row.subUnit?.name || '-')}</td>
                                    {cpDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[7px] english-font ${row.cognitiveProcess === def.value ? "font-bold" : ""}`}>{row.cognitiveProcess === def.value ? <>{rowQuestionCount} ({formatMark(rowMarks)})</> : ''}</td>)}
                                    {levelDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[7px] english-font ${row.knowledgeLevel === def.value ? "font-bold" : ""}`}>{row.knowledgeLevel === def.value ? <>{rowQuestionCount} ({formatMark(rowMarks)})</> : ''}</td>)}
                                    {formatDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[7px] english-font ${row.itemFormat === def.value ? "font-bold" : ""}`}>{row.itemFormat === def.value ? <>{rowQuestionCount} ({formatMark(rowMarks)})</> : ''}</td>)}
                                    <td className="border border-black px-[1px] py-[2px] text-center text-[7px] english-font">{rowQuestionCount}</td>
                                    <td className="border border-black px-[1px] py-[2px] text-center text-[7px] font-bold english-font">{formatMark(rowMarks)}</td>
                                    <td className="border border-black px-[1px] py-[2px] text-center text-[7px] english-font">{getDisplayTime(row.item)}</td>
                                </tr>
                            );
                        })}
                        <tr className="bg-gray-100 font-black">
                            <td colSpan={4} className="border border-black text-right uppercase tracking-widest text-[9px]" style={{ padding: '5px' }}>TOTAL ITEM</td>
                            {cpDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[8px] english-font font-black" style={{ padding: '5px' }}>{totals.stats.cp[def.key].count || ''}</td>)}
                            {levelDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[8px] english-font font-black" style={{ padding: '5px' }}>{totals.stats.levels[def.key].count || ''}</td>)}
                            {formatDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[8px] english-font font-black" style={{ padding: '5px' }}>{totals.stats.formats[def.key].count || ''}</td>)}
                            <td className="border border-black text-center text-[8px] english-font font-black" style={{ padding: '5px' }}>{derivedTotalItems}</td>
                            <td className="border border-black bg-black"></td>
                            <td rowSpan={2} className="border border-black text-center text-[8px] font-black english-font align-middle" style={{ padding: '5px' }}>{examMinutes}</td>
                        </tr>
                        <tr className="bg-gray-100 font-black">
                            <td colSpan={4} className="border border-black text-right uppercase tracking-widest text-[9px]" style={{ padding: '5px' }}>TOTAL SCORE</td>
                            {cpDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[8px] english-font font-black" style={{ padding: '5px' }}>{totals.stats.cp[def.key].score ? formatMark(totals.stats.cp[def.key].score) : ''}</td>)}
                            {levelDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[8px] english-font font-black" style={{ padding: '5px' }}>{totals.stats.levels[def.key].score ? formatMark(totals.stats.levels[def.key].score) : ''}</td>)}
                            {formatDefinitions.map(def => <td key={def.key} className="border border-black text-center text-[8px] english-font font-black" style={{ padding: '5px' }}>{totals.stats.formats[def.key].score ? formatMark(totals.stats.formats[def.key].score) : ''}</td>)}
                            <td className="border border-black bg-black"></td>
                            <td className="border border-black text-center text-[8px] font-black english-font" style={{ padding: '5px' }}>{formatMark(derivedTotalMarks)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const isLandscape = settings.orientation === 'l';

    return (
        <div className="mt-10 w-full text-black reports-container relative overflow-x-auto">
            {timeWarning && (
                <div className={`mb-4 p-3 font-bold no-print flex items-center justify-center gap-2 ${examMinutes > 90 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                    <span>⚠️</span><span>{timeWarning} ({examMinutes} Mins)</span>
                </div>
            )}

            <div className="sticky top-[2px] z-30 bg-white py-4 mb-4 no-print border-b flex justify-center items-center gap-4 flex-wrap px-4">
                <div className="flex bg-gray-100 p-1 border border-black/20 overflow-x-auto">
                    {['report1', 'report2', 'report3', 'answerkey', 'massview'].filter(tab => isAdmin || tab !== 'massview').map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === tab ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}>
                            {tab === 'report1' ? 'Report 1' : tab === 'report2' ? 'Report 2' : tab === 'report3' ? 'Report 3' : tab === 'answerkey' ? 'Answer Key' : 'Question Paper'}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button onClick={() => onDownloadPDF(activeTab)} className="bg-white text-black border-2 border-black px-5 py-2 font-bold hover:bg-gray-100 flex items-center gap-2 transition-all text-sm md:text-base"><Download size={18} /> PDF</button>
                    {isAdmin && (
                        <button onClick={() => onDownloadWord(activeTab)} className="bg-white text-black border-2 border-black px-5 py-2 font-bold hover:bg-gray-100 flex items-center gap-2 transition-all text-sm md:text-base"><FileText size={18} /> Word</button>
                    )}
                    <button onClick={() => setIsSettingsOpen(true)} className="bg-gray-100 text-black border-2 border-gray-300 px-5 py-2 font-bold hover:bg-gray-200 flex items-center gap-2 transition-all text-sm md:text-base rounded-lg"><Settings size={18} /></button>
                </div>
            </div>

            <div className="reports-visible-content" style={{ fontFamily: `${settings.fontFamilyEnglish || 'Georgia'}, ${settings.fontFamily}, serif`, fontSize: `${settings.fontSizeBody}pt` }}>
                {activeTab === 'report1' && (
                    <div className={`${isLandscape ? 'report-landscape-screen-wrapper' : 'report-1-screen-wrapper'} mx-auto`}>
                        <div id="report-page-1" className={`${isLandscape ? 'w-full min-h-[210mm]' : 'report-1-screen-page'} bg-white shadow mb-4 border border-gray-200 p-[12mm]`}>{renderReport1Content(1)}</div>
                        <div id="report-page-2" className={`${isLandscape ? 'w-full min-h-[210mm]' : 'report-1-screen-page'} bg-white shadow border border-gray-200 p-[12mm]`}>{renderReport1Content(2)}</div>
                    </div>
                )}
                {activeTab === 'report2' && (
                    <div id="report-item-analysis-page-0" className={`${isLandscape ? 'report-landscape-screen-wrapper' : 'report-1-screen-wrapper'} bg-white shadow border border-gray-200 p-4 overflow-x-auto`}>{renderReport2Content()}</div>
                )}
                {activeTab === 'report3' && (
                    <div id="report-page-blueprint-matrix" className={`${isLandscape ? 'report-landscape-screen-wrapper' : 'report-1-screen-wrapper'} bg-white shadow border border-gray-200 p-4 overflow-x-auto`}>{renderReport3Content()}</div>
                )}
                {activeTab === 'answerkey' && (
                    <div className="report-1-screen-wrapper mx-auto">
                        <div id="report-answer-key" className="report-1-screen-page bg-white shadow border border-gray-200 p-[12mm]">
                            <AnswerKeyView blueprint={blueprint} curriculum={curriculum} discourses={discourses} isPdf={false} />
                        </div>
                    </div>
                )}
                {activeTab === 'massview' && (() => {
                    // Helper functions (mirroring AdminQuestionConsolidator)
                    const fmk = (m: number) => {
                        const s = m.toString();
                        if (s.endsWith('.5')) { const w = s.split('.')[0]; return w === '0' ? '½' : `${w}½`; }
                        return s;
                    };
                    const toRoman = (n: number) => (['I','II','III','IV','V','VI','VII','VIII','IX','X'][n-1] || n.toString());

                    const generateHeaderHTML = (bp: Blueprint): string => {
                        const setLetter = (bp.setId || 'A').replace(/SET\s+/i, '').trim().charAt(0).toUpperCase();
                        const subj = bp.subject.includes('BT') ? 'BT' : 'AT';
                        const codeMap: Record<string, string> = {
                            '10-AT': 'T1002', '10-BT': 'T1012', '9-AT': 'T902', '9-BT': 'T912', '8-AT': 'T802', '8-BT': 'T812'
                        };
                        const paperCode = codeMap[`${bp.classLevel}-${subj}`] || `T${bp.classLevel}${subj === 'AT' ? '02' : '12'}`;
                        const year = (bp.academicYear || '2026-27').replace(/^(\d{4})-(\d{2,4})$/, (_, s, e) => `${s}-${String(e).slice(-2)}`);
                        let termHeading = `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
                        if (bp.examTerm === 'Second Term Summative') termHeading = `இரண்டாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
                        if (bp.examTerm === 'Third Term Summative') termHeading = `இறுதிப் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
                        const subjectTitle = bp.subject.includes('AT')
                            ? { tamil: 'தமிழ் முதல் தாள்', eng: 'Tamil Language Paper I (AT)' }
                            : { tamil: 'தமிழ் இரண்டாம் தாள்', eng: 'Tamil Language Paper II (BT)' };
                        return `<div style="margin-bottom: 20px; font-family: 'TAU-Paalai', serif; line-height: 1.5; text-align: center;">
    <div style="position: relative; display: flex; justify-content: center; align-items: center;">
        <div style="position: absolute; left: 0; top: 0;">
            <div style="border: 2px solid black; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;">${setLetter}</div>
        </div>
        <h1 style="font-weight: bold; font-size: 20px; margin: 0; line-height: 1;">சமக்ர சிக்ஷா கேரளம்</h1>
        <div style="position: absolute; right: 0; top: 0;">
            <div style="background: black; color: white; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: bold;">${paperCode}</div>
        </div>
    </div>
    <div style="margin-top: 10px;">
        <h2 style="font-size: 16px; font-weight: bold; margin: 0;">${termHeading}</h2>
        <h2 style="font-size: 16px; font-weight: bold; margin: 5px 0 0 0;">${subjectTitle.tamil}</h2>
        <h3 style="font-size: 14px; font-weight: bold; margin: 5px 0 0 0;">${subjectTitle.eng}</h3>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; font-weight: bold; margin-top: 15px; font-size: 11pt; text-align: left;">
        <div style="line-height: 1.4;">நேரம்: 90 நிமிடம்<br/>சிந்தனை நேரம் : 15 நிமிடம்</div>
        <div style="text-align: right; line-height: 1.4;">வகுப்பு: ${bp.classLevel}<br/>மதிப்பெண்: ${fmk(bp.totalMarks)}</div>
    </div>
    </div>
    <div style="border-top: 1px solid black; border-bottom: 1px solid black; padding: 10px 0; margin-bottom: 20px; font-family: 'TAU-Paalai', serif; font-size: 11pt; font-weight: bold; line-height: 1.5; text-align: left;">
    <div style="margin-bottom: 5px;">குறிப்புகள்:</div>
    <div style="margin-left: 20px; font-weight: normal;">
        - முதல் 15 நிமிடம் சிந்தனை நேரமாகும்.<br/>
        - வினாக்களை வாசித்து விடைகளை வரிசைப்படுத்த இந்த நேரத்தைப் பயன்படுத்தலாம்.<br/>
        - வினாக்களையும் குறிப்புகளையும் நன்கு வாசித்துப் புரிந்து விடையளிக்கவும்.<br/>
        - விடையளிக்கும்போது மதிப்பெண், நேரம் போன்றவற்றை கவனித்து செயல்படவும்.
    </div>
    </div>`;
                    };

                    const buildQPHTML = (): string => {
                        // If already saved to DB, use that
                        if (blueprint.massViewHeader) return blueprint.massViewHeader;
                        // Otherwise generate dynamically from blueprint + paperType
                        if (!paperType) return '<div style="text-align:center;padding:40px;color:#888;font-style:italic;">Paper Type not configured. Please select a valid exam.</div>';
                        const header = generateHeaderHTML(blueprint);
                        const sIdxMap = new Map((paperType.sections || []).map((s, i) => [s.id, i]));
                        const bpItems = blueprint.items || [];
                        const ordered = [...bpItems].sort((a, b) => {
                            const ai = a.sectionId ? sIdxMap.get(a.sectionId) ?? 999 : 999;
                            const bi = b.sectionId ? sIdxMap.get(b.sectionId) ?? 999 : 999;
                            if (ai !== bi) return ai - bi;
                            return bpItems.indexOf(a) - bpItems.indexOf(b);
                        });
                        let content = '<div style="margin-top: 10px; font-family: \'TAU-Paalai\', serif; font-size: 12pt; text-align: justify; line-height: 1.6;">';
                        let qNo = 1;
                        paperType.sections.forEach((section, sIdx) => {
                            const secItems = ordered.filter(item => item.sectionId === section.id);
                            if (secItems.length === 0) return;
                            const qStart = qNo;
                            const qEnd = qNo + secItems.length - 1;
                            const rangeStr = qStart === qEnd ? `${qStart} ஆவது வினாவிற்கு` : `${qStart} முதல் ${qEnd} வரையுள்ள`;
                            const roman = toRoman(sIdx + 1);
                            const baseInstr = (section.instruction || '').trim();
                            const isFormatted = /^[IVX]+\./.test(baseInstr) || /\d+\s*முதல்\s*\d+/.test(baseInstr);
                            if (isFormatted) {
                                content += `<div style="font-weight: bold; margin-top: 25px; margin-bottom: 15px;">${baseInstr}</div>`;
                            } else {
                                content += `<div style="font-weight: bold; margin-top: 25px; margin-bottom: 15px;">${roman}. ${rangeStr} ${baseInstr} (${fmk(section.marks)} மதிப்பெண் வீதம்) (${section.count} x ${fmk(section.marks)} = ${fmk(section.count * section.marks)})</div>`;
                            }
                            secItems.forEach(item => {
                                const hasChoice = !!item.hasInternalChoice;
                                content += `<div style="margin-bottom: 12px; padding-left: 20px;">`;
                                if (hasChoice) {
                                    content += `<div style="font-weight: bold; margin-bottom: 5px;">${qNo}. ஏதேனும் ஒன்றிற்கு விடையளிக்கவும்.</div>`;
                                    content += `<div style="display: flex; gap: 10px; margin-bottom: 5px;"><div style="min-width: 25px;">அ)</div><div style="flex: 1;">${item.questionText || '(Question not entered)'}</div></div>`;
                                    content += `<div style="text-align: center; font-weight: bold; margin: 8px 0; font-style: italic;">(அல்லது)</div>`;
                                    content += `<div style="display: flex; gap: 10px;"><div style="min-width: 25px;">ஆ)</div><div style="flex: 1;">${item.questionTextB || '(Question not entered)'}</div></div>`;
                                } else {
                                    content += `<div style="display: flex; gap: 10px;"><div style="min-width: 25px; font-weight: bold;">${qNo}.</div><div style="flex: 1;">${item.questionText || '(Question not entered)'}</div></div>`;
                                }
                                content += `</div>`;
                                qNo++;
                            });
                        });
                        content += '</div>';
                        return header + content;
                    };

                    return (
                        <div className="report-1-screen-wrapper mx-auto">
                            <div id="report-mass-view" className="report-1-screen-page bg-white shadow border border-gray-200 p-[12mm]">
                                <div
                                    dangerouslySetInnerHTML={{ __html: buildQPHTML() }}
                                    style={{ fontFamily: "'TAU-Paalai', serif", fontSize: '14pt', lineHeight: '1.6', color: '#000' }}
                                ></div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-blue-600" size={20} /> Report Settings</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Tamil Font</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50" value={settings.fontFamily} onChange={(e) => { const newPer = { ...(blueprint.perReportSettings || {}), [activeTab]: { ...settings, fontFamily: e.target.value } }; onUpdateReportSettings && onUpdateReportSettings(blueprint.reportSettings, newPer); }}>
                                        <option value="TAU-Paalai">TAU-Paalai</option><option value="Latha">Latha</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Orientation</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50" value={settings.orientation || 'p'} onChange={(e) => { const newPer = { ...(blueprint.perReportSettings || {}), [activeTab]: { ...settings, orientation: e.target.value as 'p' | 'l' } }; onUpdateReportSettings && onUpdateReportSettings(blueprint.reportSettings, newPer); }}>
                                        <option value="p">Portrait</option><option value="l">Landscape</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                            <button onClick={handleSave} disabled={isSavingSettings} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
                                {isSavingSettings ? 'Saving...' : <><Check size={20} /> Save Settings</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
