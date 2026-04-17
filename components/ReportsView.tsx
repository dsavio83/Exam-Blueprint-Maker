import React, { useState } from 'react';
import { Blueprint, Curriculum, BlueprintItem, CognitiveProcess, ItemFormat, QuestionPaperType, ExamTerm, KnowledgeLevel, Discourse } from '@/types';
import { Download, FileText, Printer } from 'lucide-react';
import AnswerKeyView from './AnswerKeyView';

interface ReportsViewProps {
    blueprint: Blueprint;
    curriculum: Curriculum;
    discourses?: Discourse[];
    paperType?: QuestionPaperType;
    onDownloadPDF: (tab: string) => void;
    onDownloadWord: (tab: string) => void;
}

export const ReportsView = ({ blueprint, curriculum, discourses, paperType, onDownloadPDF, onDownloadWord }: ReportsViewProps) => {
    const [activeTab, setActiveTab] = useState('report1');
    const [customMinutes, setCustomMinutes] = useState<number | null>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [tempMinutes, setTempMinutes] = useState<string>("");

    const getDisplayTime = (item: BlueprintItem) => {
        if (item.time !== undefined && item.time !== null && item.time !== 0) return item.time;

        const section = paperType?.sections.find(s => s.id === item.sectionId);
        if (section?.timePerQuestion) return section.timePerQuestion;

        // Fallback logic
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

    const getTotalExamTime = () => {
        const totalMinutes = getTotalExamMinutes();

        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours === 0) return `${mins} Mins`;
        return `${hours}.${mins.toString().padStart(2, '0')} Hrs`;
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

    // Normalize a stored cognitiveProcess value that may be a code ('CP4') or description ('Analytical Thinking')
    const normalizeCPValue = (stored: string): string => {
        if (!stored) return '';
        const s = stored.toString().trim().toLowerCase();

        // Match by value (description in enum), key (code like CP1), or label (UI text)
        // Use a more robust comparison that ignores spacing and special characters
        const clean = (str: string) => str.replace(/[^a-z0-9]/g, '');
        const sClean = clean(s);

        const byVal = cpDefinitions.find(def => clean(def.value.toLowerCase()) === sClean);
        if (byVal) return byVal.value;

        const byKey = cpDefinitions.find(def => clean(def.key.toLowerCase()) === sClean);
        if (byKey) return byKey.value;

        const byLabel = cpDefinitions.find(def => clean(def.label.toLowerCase()) === sClean);
        if (byLabel) return byLabel.value;

        // Fallback for partial matches (e.g. "Values / Attitude" vs "Values / Attitudes")
        const partial = cpDefinitions.find(def => sClean.startsWith(clean(def.label.toLowerCase()).substring(0, 10)));
        if (partial) return partial.value;

        return stored;
    };

    const normalizeLevelValue = (stored: string): string => {
        if (!stored) return '';
        const s = stored.toString().trim().toLowerCase();
        const clean = (str: string) => str.replace(/[^a-z0-9]/g, '');
        const sClean = clean(s);

        const byVal = levelDefinitions.find(def => clean(def.value.toLowerCase()) === sClean);
        if (byVal) return byVal.value;
        const byKey = levelDefinitions.find(def => clean(def.key.toLowerCase()) === sClean);
        if (byKey) return byKey.value;
        const byLabel = levelDefinitions.find(def => clean(def.label.toLowerCase()) === sClean);
        if (byLabel) return byLabel.value;
        return stored;
    };

    const normalizeFormatValue = (stored: string): string => {
        if (!stored) return '';
        const s = stored.toString().trim().toLowerCase();
        const clean = (str: string) => str.replace(/[^a-z0-9]/g, '');
        const sClean = clean(s);

        const byVal = formatDefinitions.find(def => clean(def.value.toLowerCase()) === sClean);
        if (byVal) return byVal.value;
        const byKey = formatDefinitions.find(def => clean(def.key.toLowerCase()) === sClean);
        if (byKey) return byKey.value;
        const byLabel = formatDefinitions.find(def => clean(def.label.toLowerCase()) === sClean);
        if (byLabel) return byLabel.value;
        return stored;
    };

    const addToStats = (
        stats: ReturnType<typeof createStats>,
        cognitiveProcess: CognitiveProcess,
        knowledgeLevel: KnowledgeLevel,
        itemFormat: ItemFormat,
        score: number,
        questionCount: number = 1
    ) => {
        // Normalize CP to handle both code-based ('CP4') and description-based ('Analytical Thinking') stored values
        const normalizedCP = normalizeCPValue(cognitiveProcess as string) as CognitiveProcess;
        const normalizedLevel = normalizeLevelValue(knowledgeLevel as string) as KnowledgeLevel;
        const normalizedFormat = normalizeFormatValue(itemFormat as string) as ItemFormat;

        const cpKey = cpDefinitions.find(def => def.value === normalizedCP)?.key;
        const levelKey = levelDefinitions.find(def => def.value === normalizedLevel)?.key;
        const formatKey = formatDefinitions.find(def => def.value === normalizedFormat)?.key;

        if (cpKey) {
            stats.cp[cpKey].count += questionCount;
            stats.cp[cpKey].score += score;
        }
        if (levelKey) {
            stats.levels[levelKey].count += questionCount;
            stats.levels[levelKey].score += score;
        }
        if (formatKey) {
            stats.formats[formatKey].count += questionCount;
            stats.formats[formatKey].score += score;
        }
    };

    const termTamil = blueprint.examTerm === ExamTerm.FIRST ? 'முதல்' : blueprint.examTerm === ExamTerm.SECOND ? 'இரண்டாம்' : 'மூன்றாம்';
    const termEnglish = blueprint.examTerm;
    const academicYear = blueprint.academicYear || '2025-26';
    const qpCode = blueprint.questionPaperTypeId?.split('-').shift() || 'QP';
    const setId = blueprint.setId?.split(' ').pop() || 'A';
    const subjectInfo = blueprint.subject.includes('AT')
        ? { tamil: 'Tamil Language Paper I (AT)', english: 'Tamil Language Paper I (AT)', code: '02' }
        : blueprint.subject.includes('BT')
            ? { tamil: 'Tamil Language Paper II (BT)', english: 'Tamil Language Paper II (BT)', code: '12' }
            : { tamil: blueprint.subject, english: blueprint.subject, code: '00' };

    const paperCode = `T${blueprint.classLevel}${subjectInfo.code}`;
    const examYear = academicYear.split('-')[0] || academicYear;
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

            const termDisplay = blueprint.examTerm; // Use full name instead of I, II, III

            return (
                <div className="bg-white mx-auto shadow-none w-[210mm] min-h-[297mm] p-[12mm] flex flex-col font-serif text-black border border-black/10 print:border-none">
                    <div className="flex justify-between items-start mb-4 relative">
                        <div className="flex-1 text-center">
                            <h1 className="text-2xl font-bold text-black border-b-2 border-black inline-block px-4 pb-0.5 uppercase tracking-tight">Question Paper Design - HS</h1>
                        </div>
                        <div className="absolute right-0 top-0 border border-black px-1.5 py-0.5 text-[10pt] font-bold bg-white">
                            {blueprint.classLevel}-{subjectInfo.code === '02' ? 'AT' : 'BT'} | Set {setId} | {qpCode}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-[11pt] font-bold border-b border-black pb-3">
                        <div className="flex"><span className="w-24 text-gray-700">Class</span><span className="mx-2">:</span><span>{blueprint.classLevel}</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Time</span><span className="mx-2">:</span><span>{totalExamMinutes} Minutes</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Subject</span><span className="mx-2">:</span><span className="tamil-font leading-none !text-[11pt] !font-normal !not-italic">{subjectInfo.tamil}</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Score</span><span className="mx-2">:</span><span>{totalScore} Marks</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Term</span><span className="mx-2">:</span><span className="!font-normal !not-italic">{termDisplay}</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Year</span><span className="mx-2">:</span><span>{academicYear}</span></div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black border-b border-black mb-1.5 pb-0.5">I. Weightage to Content Area</h3>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-none">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black px-1 py-0 text-center font-bold w-[6%]">Sl. No</th>
                                    <th className="border border-black px-1.5 py-0 text-center font-bold w-[39%]">Learning Objective</th>
                                    <th className="border border-black px-1.5 py-0 text-center font-bold w-[22%]">Unit / Topic / Chapter</th>
                                    <th className="border border-black px-1.5 py-0 text-center font-bold w-[22%]">Sub-unit / Sub-topic</th>
                                    <th className="border border-black px-1 py-0 text-center font-bold w-[6%]">Score</th>
                                    <th className="border border-black px-1 py-0 text-center font-bold w-[7%]">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contentAreaStats.map((row, idx) => (
                                    <tr key={row.unit.id}>
                                        <td className="border border-black px-1 py-0 text-center align-middle">{idx + 1}</td>
                                        <td className="border border-black px-1.5 py-0 tamil-font !leading-[1] text-[9pt] text-left whitespace-pre-line">{row.unit.learningOutcomes || '-'}</td>
                                        <td className="border border-black px-1.5 py-0 tamil-font !leading-[1] text-left">{row.unit.name}</td>
                                        <td className="border border-black px-1.5 py-0 tamil-font italic !leading-[1] text-[9pt] text-left whitespace-pre-line">{row.unit.subUnits.map(s => s.name).join(', ')}</td>
                                        <td className="border border-black px-1 py-0 text-center font-bold align-middle">{row.score}</td>
                                        <td className="border border-black px-1 py-0 text-center align-middle">{Math.round((row.score / totalScore) * 100)}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold">
                                    <td colSpan={4} className="border border-blackpx-1.5 py-1 text-center uppercase tracking-wider">Total</td>
                                    <td className="border border-black px-1.5 py-0 text-center">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-0 text-center">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black border-b border-black mb-1.5 pb-0.5">II. Weightage to Cognitive Process</h3>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-tight">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[12%]">Sl. No.</th>
                                    <th className="border border-black px-1.5 py-0.5 text-left font-bold w-[54%]">Cognitive Process</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[17%]">Score</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[17%]">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cpStats.map((row, idx) => (
                                    <tr key={row.key}>
                                        <td className="border border-black px-1.5 py-0.5 text-center font-bold">CP{idx + 1}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-left leading-tight">{row.label}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center">{row.score || '-'}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center">{row.score > 0 ? (row.score / totalScore * 100).toFixed(row.score / totalScore * 100 % 1 === 0 ? 0 : 1) + '%' : '-'}</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold">
                                    <td colSpan={2} className="border border-black px-1.5 py-0.5 text-center uppercase tracking-wider">Total</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">100%</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-2 text-[10px] italic font-bold">
                            Index of Abbreviation: CP - Cognitive Process
                        </div>
                    </div>

                    <div className="mt-auto py-4 flex justify-between items-center text-xl font-bold text-gray-400 no-print">
                        <span>Page 1 of 2</span>
                    </div>
                </div>
            );
        }

        if (page === 2) {
            const levelStats = levelDefinitions.map(def => {
                const score = blueprint.items.reduce((sum, item) =>
                    item.knowledgeLevel === def.value ? sum + getItemTotalScore(item) : sum, 0);
                return { ...def, score };
            });

            // Group format stats for Section IV
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

            const internalChoicePercent = totalScore > 0
                ? Math.round((totalInternalChoiceScore / totalScore) * 100)
                : 0;

            const hasInternalChoice = totalInternalChoiceScore > 0;

            return (
                <div className="bg-white mx-auto shadow-none w-[210mm] min-h-[297mm] p-[12mm] flex flex-col font-serif text-black border border-black/10 print:border-none">
                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black border-b border-black mb-1.5 pb-0.5 uppercase tracking-tight">III. Weightage to Knowledge Level</h3>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-tight">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[12%]">Sl. No.</th>
                                    <th className="border border-black px-1.5 py-0.5 text-left font-bold w-[54%]">Knowledge Level</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[17%]">Score</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[17%]">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {levelStats.map((row, idx) => (
                                    <tr key={row.key}>
                                        <td className="border border-black px-1.5 py-0.5 text-center">{idx + 1}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-left leading-tight">{row.label.split(' ')[0]}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center">{row.score || '-'}</td>
                                        <td className="border border-black px-1.5 py-0.5 text-center">{row.score > 0 ? (row.score / totalScore * 100).toFixed(0) + '%' : '-'}</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold">
                                    <td colSpan={2} className="border border-black px-1.5 py-0.5 text-center uppercase tracking-wider">Total</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black border-b border-black mb-1.5 pb-0.5 uppercase tracking-tight">IV. Weightage to Item Format</h3>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-tight">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[7%]">Sl. No.</th>
                                    <th className="border border-black px-1.5 py-0.5 text-left font-bold w-[18%]">Item Format</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[8%]">Code</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[8%]">Format</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[12%]">No. of Items</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[12%]">Estimated Time</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[12%]">Score allotted</th>
                                    <th className="border border-black px-1.5 py-0.5 text-center font-bold w-[10%]">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* SR Item 1 */}
                                <tr>
                                    <td className="border border-black px-1.5 py-0.5 text-center">1</td>
                                    <td className="border border-black px-1.5 py-0.5 font-semibold leading-tight">SR Item</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">SR1</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">MCI</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{sr1Stats.count || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{sr1Stats.time || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">{sr1Stats.score || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{sr1Stats.score > 0 ? Math.round((sr1Stats.score / totalScore) * 100) : '-'}%</td>
                                </tr>

                                {/* SR Item 2 */}
                                <tr>
                                    <td className="border border-black px-1.5 py-0.5 text-center">2</td>
                                    <td className="border border-black px-1.5 py-0.5 font-semibold leading-tight">SR Item</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">SR2</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">MI</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{sr2Stats.count || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{sr2Stats.time || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">{sr2Stats.score || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{sr2Stats.score > 0 ? Math.round((sr2Stats.score / totalScore) * 100) : '-'}%</td>
                                </tr>

                                {/* CRS Item 1 */}
                                <tr>
                                    <td className="border border-black px-1.5 py-0.5 text-center">3</td>
                                    <td className="border border-black px-1.5 py-0.5 font-semibold leading-tight">CRS Item</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">CRS1</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">VSA</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crs1Stats.count || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crs1Stats.time || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">{crs1Stats.score || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crs1Stats.score > 0 ? Math.round((crs1Stats.score / totalScore) * 100) : '-'}%</td>
                                </tr>

                                {/* CRS Item 2 */}
                                <tr>
                                    <td className="border border-black px-1.5 py-0.5 text-center">4</td>
                                    <td className="border border-black px-1.5 py-0.5 font-semibold leading-tight">CRS Item</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">CRS2</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">SA</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crs2Stats.count || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crs2Stats.time || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">{crs2Stats.score || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crs2Stats.score > 0 ? Math.round((crs2Stats.score / totalScore) * 100) : '-'}%</td>
                                </tr>

                                {/* CRL Item Group */}
                                <tr>
                                    <td className="border border-black px-1.5 py-0.5 text-center">5</td>
                                    <td className="border border-black px-1.5 py-0.5 font-semibold leading-tight">CRL Item</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">CRL</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">E</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crlStats.count || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crlStats.time || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center font-bold">{crlStats.score || '-'}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{crlStats.score > 0 ? Math.round((crlStats.score / totalScore) * 100) : '-'}%</td>
                                </tr>

                                <tr className="bg-white font-bold">
                                    <td colSpan={4} className="border border-black px-1.5 py-0.5 text-center uppercase">Total</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{blueprint.items.reduce((sum, item) => sum + getItemQuestionCount(item), 0)}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{totalExamMinutes}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">{totalScore}</td>
                                    <td className="border border-black px-1.5 py-0.5 text-center">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 text-sm grid grid-cols-2 gap-x-8">
                        <div>
                            <span className="font-bold underline">Index of Abbreviations:</span>
                            <div className="ml-4 space-y-0.5 mt-2">
                                <div>SR - Selected Response</div>
                                <div>CRS - Constructed Response Short Answer</div>
                                <div>CRL - Constructed Response Long Answer</div>
                                <div>MCI - Multiple Choice Items</div>
                                <div>MI - Matching Item</div>
                            </div>
                        </div>
                        <div className="pt-8">
                            <div className="space-y-0.5 mt-2">
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
                                <div className="border border-black w-6 h-6 flex items-center justify-center text-lg font-bold">
                                    {hasInternalChoice ? '✓' : ''}
                                </div>
                                <span className="text-sm font-bold ml-2">
                                    {hasInternalChoice ? `${internalChoicePercent}%` : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="w-40 font-bold text-sm">Overall choice</span>
                                <div className="border border-black w-6 h-6"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto py-2 flex justify-between items-center text-xs font-bold text-gray-400 no-print">
                        <span>Page 2 of 2</span>
                    </div>
                </div>
            );
        }

        return null;
    };


    const questionRows = report3Items.flatMap((item, index) => {
        const unit = curriculum.units.find(u => u.id === item.unitId);
        const subUnit = unit?.subUnits.find(s => s.id === item.subUnitId);

        // Trust the toggle from Question Entry page
        const effectiveHasInternalChoice = !!item.hasInternalChoice;

        // Normalize CP values to handle both code ('CP4') and description ('Analytical Thinking') formats
        const normalizedCP = normalizeCPValue(item.cognitiveProcess as string) as CognitiveProcess;
        const normalizedCPB = normalizeCPValue((item.cognitiveProcessB || item.cognitiveProcess) as string) as CognitiveProcess;

        const baseRow = {
            id: `${item.id}-A`,
            qNo: `${index + 1}${effectiveHasInternalChoice ? ' (அ)' : ''}`,
            item,
            unit,
            subUnit,
            cognitiveProcess: normalizedCP,
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
                cognitiveProcess: normalizedCPB,
                knowledgeLevel: normalizeLevelValue((item.knowledgeLevelB || item.knowledgeLevel) as string) as KnowledgeLevel,
                itemFormat: normalizeFormatValue((item.itemFormatB || item.itemFormat) as string) as ItemFormat
            }
        ];
    });

    // Filter Report 2 units: Only show units that belong to the current term (by checking if they have items or relevant unitNumber)
    const activeUnitIds = new Set(orderedItems.map(item => item.unitId));
    const report2Rows = curriculum.units
        .filter(unit => activeUnitIds.has(unit.id)) // Only show units used in the current blueprint
        .map((unit, index) => {
            const unitItems = orderedItems.filter(item => item.unitId === unit.id);
            const stats = createStats();

            unitItems.forEach(item => {
                addToStats(stats, item.cognitiveProcess, item.knowledgeLevel, item.itemFormat, getItemTotalScore(item), getItemQuestionCount(item));
            });

            const usedSubUnitIds = new Set(unitItems.map(item => item.subUnitId));
            const shownSubUnits = unit.subUnits
                .filter(subUnit => usedSubUnitIds.size === 0 || usedSubUnitIds.has(subUnit.id))
                .map(subUnit => subUnit.name)
                .join(', ');

            return {
                id: unit.id,
                unit,
                stats,
                subUnits: shownSubUnits || '-',
                totalTime: unitItems.reduce((sum, item) => sum + getDisplayTime(item), 0),
                totalItems: unitItems.reduce((sum, item) => sum + getItemQuestionCount(item), 0),
                totalScore: unitItems.reduce((sum, item) => sum + getItemTotalScore(item), 0)
            };
        });

    const renderReportHeader = (partLabel: string, showGrid: boolean = false) => (
        <div className="mb-4 relative">
            <div className="flex justify-between items-start mb-4 relative">
                <div className="flex-1 text-center">
                    <h1 className="text-2xl font-bold text-black border-b-2 border-black inline-block px-4 pb-1">Proforma for Analysing Question Paper</h1>
                    <div className="text-lg font-bold mt-1">Topic/Sub Topic wise Analysis</div>
                </div>
                <div className="absolute right-0 top-0 border border-black px-2 py-1 text-sm font-bold bg-white">
                    {blueprint.classLevel}-{subjectInfo.code === '02' ? 'AT' : 'BT'} | Set {setId} | {qpCode}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-[11pt] font-bold border-b border-black pb-3">
                <div className="flex"><span className="w-24">Class</span><span className="mx-2">:</span><span>{blueprint.classLevel}</span></div>
                <div className="flex"><span className="w-24">Time</span><span className="mx-2">:</span><span>{examMinutes} Minutes</span></div>
                <div className="flex"><span className="w-24 text-gray-700">Subject</span><span className="mx-2 text-gray-700">:</span><span className="tamil-font leading-none !text-[11pt] !font-normal !not-italic">{subjectInfo.tamil}</span></div>
                <div className="flex"><span className="w-24">Score</span><span className="mx-2">:</span><span>{derivedTotalMarks} Marks</span></div>
                <div className="flex"><span className="w-24">Term</span><span className="mx-2">:</span><span className="!font-normal !not-italic">{termEnglish}</span></div>
                <div className="flex"><span className="w-24">Year</span><span className="mx-2">:</span><span>{academicYear}</span></div>
            </div>

            <div className="text-center text-xl font-bold text-black mb-2 uppercase tracking-tight border-b border-black/50 pb-1 inline-block w-full">
                {partLabel}
            </div>
        </div>
    );



    const renderAnalysisColGroup = (showFirst: boolean, includeLastCount: number = 3) => {
        // Topic, LO, Sub-Topic proportions differ between Report 2 and 3
        const col1Width = showFirst ? '3.5%' : '0%';
        const topicWidth = showFirst ? '9.5%' : '12.5%';
        const loWidth = showFirst ? '30%' : '25%';
        const subTopicWidth = showFirst ? '9.5%' : '12.5%';

        const finalAnalysisWidth = '2.5%';
        const finalTrailingWidth = '4%';

        return (
            <colgroup>
                {showFirst && <col style={{ width: col1Width }} />}
                <col style={{ width: topicWidth }} />
                <col style={{ width: loWidth }} />
                <col style={{ width: subTopicWidth }} />
                {cpDefinitions.map(def => <col key={def.key} style={{ width: finalAnalysisWidth }} />)}
                {levelDefinitions.map(def => <col key={def.key} style={{ width: finalAnalysisWidth }} />)}
                {formatDefinitions.map(def => <col key={def.key} style={{ width: finalAnalysisWidth }} />)}
                <col style={{ width: finalTrailingWidth }} />
                <col style={{ width: finalTrailingWidth }} />
                <col style={{ width: finalTrailingWidth }} />
            </colgroup>
        );
    };

    // Rotated header style for small vertical headers
    const rotatedHeaderStyle: React.CSSProperties = {
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        whiteSpace: 'nowrap',
        fontSize: '7px',
        padding: '3px 1px',
        textAlign: 'center',
        fontWeight: 'bold'
    };

    const renderAnalysisTableHeader = (firstColumnLabel: string, includeLastCount: number = 3) => {
        const showFirst = !!firstColumnLabel;
        return (
            <thead>
                <tr className="bg-[#d9ead3] text-[9px]">
                    {showFirst && <th rowSpan={2} className="border border-black p-[2px] font-bold text-center">{firstColumnLabel}</th>}
                    <th colSpan={3} className="border border-black p-[2px] font-bold text-center">Content Area</th>
                    <th colSpan={7} className="border border-black p-[2px] font-bold text-center" style={{ fontSize: '7.5px' }}>Cognitive Process</th>
                    <th colSpan={3} className="border border-black p-[2px] font-bold text-center" style={{ fontSize: '7.5px' }}>Knowledge Level</th>
                    <th colSpan={5} className="border border-black p-[2px] font-bold text-center" style={{ fontSize: '7.5px' }}>Item Format</th>
                    <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px' }}>Total Item</th>
                    {includeLastCount === 3 && (
                        <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px' }}>Total Score</th>
                    )}
                    <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px' }}>Time</th>
                </tr>
                <tr className="bg-[#fff2cc] text-[7.5px] leading-tight">
                    <th className="border border-black p-[2px] font-bold" style={{ fontSize: '7.5px' }}>Topic / Unit</th>
                    <th className="border border-black p-[2px] font-bold" style={{ fontSize: '7.5px' }}>Learning Objective</th>
                    <th className="border border-black p-[2px] font-bold" style={{ fontSize: '7.5px' }}>Sub Topic / Sub Unit</th>
                    {cpDefinitions.map(def => <th key={def.key} className="border border-black p-[1px] font-bold" title={def.label} style={{ fontSize: '6.5px' }}>{def.key}</th>)}
                    {levelDefinitions.map(def => <th key={def.key} className="border border-black p-[1px] font-bold" title={def.label} style={{ fontSize: '6.5px' }}>{def.key}</th>)}
                    {formatDefinitions.map(def => <th key={def.key} className="border border-black p-[1px] font-bold" title={def.label} style={{ fontSize: '6.5px' }}>{def.key}</th>)}
                </tr>
            </thead>
        );
    };

    const renderReport2Content = () => {
        const report2OptionStats = curriculum.units.map(unit => {
            const unitItems = orderedItems.filter(item => item.unitId === unit.id && item.hasInternalChoice);
            if (unitItems.length === 0) return null;

            const stats = createStats();
            unitItems.forEach(item => {
                addToStats(
                    stats,
                    item.cognitiveProcessB || item.cognitiveProcess,
                    item.knowledgeLevelB || item.knowledgeLevel,
                    item.itemFormatB || item.itemFormat,
                    getItemTotalScore(item),
                    getItemQuestionCount(item)
                );
            });

            return {
                unitId: unit.id,
                stats,
                count: unitItems.reduce((sum, item) => sum + getItemQuestionCount(item), 0),
                score: unitItems.reduce((sum, item) => sum + getItemTotalScore(item), 0)
            };
        });

        const grandTotals = createStats();
        report2Rows.forEach(row => {
            Object.keys(grandTotals.cp).forEach(k => { grandTotals.cp[k].count += row.stats.cp[k].count; grandTotals.cp[k].score += row.stats.cp[k].score; });
            Object.keys(grandTotals.levels).forEach(k => { grandTotals.levels[k].count += row.stats.levels[k].count; grandTotals.levels[k].score += row.stats.levels[k].score; });
            Object.keys(grandTotals.formats).forEach(k => { grandTotals.formats[k].count += row.stats.formats[k].count; grandTotals.formats[k].score += row.stats.formats[k].score; });
        });

        const totalItemsInTable = Object.values(grandTotals.cp).reduce((sum, cp) => sum + cp.count, 0);
        const totalScoreInTable = Object.values(grandTotals.cp).reduce((sum, cp) => sum + cp.score, 0);

        return (
            <div className={`text-black report-page-container flex flex-col min-h-[1050px] justify-between pb-1`}>
                <div>
                    {renderReportHeader('Part – II : Unit-wise Analysis')}
                    <table className="w-full border-collapse border-2 border-black text-[8px] leading-[1.05] report-analysis-table table-fixed">
                        {renderAnalysisColGroup(false, 3)}
                        {renderAnalysisTableHeader('', 3)}
                        <tbody>
                            {report2Rows.map((row, rowIdx) => {
                                const optionStat = report2OptionStats[rowIdx];
                                return (
                                    <React.Fragment key={row.id}>
                                        <tr className="bg-white">
                                            <td className="border border-black px-[2px] py-[1.5px] text-[8px] leading-[1] tamil-font report-topic-cell font-semibold">{`${row.unit.unitNumber}. ${row.unit.name}`}</td>
                                            <td className="border border-black px-[2px] py-[1.5px] text-[7px] leading-[1] tamil-font report-lo-cell">{row.unit.learningOutcomes || '-'}</td>
                                            <td className="border border-black px-[2px] py-[1.5px] text-[8px] leading-[1] tamil-font report-topic-cell">{row.subUnits}</td>
                                            {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[7px]">{row.stats.cp[def.key].count ? `${row.stats.cp[def.key].count}(${row.stats.cp[def.key].score})` : ''}</td>)}
                                            {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[7px]">{row.stats.levels[def.key].count ? `${row.stats.levels[def.key].count}(${row.stats.levels[def.key].score})` : ''}</td>)}
                                            {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[7px]">{row.stats.formats[def.key].count ? `${row.stats.formats[def.key].count}(${row.stats.formats[def.key].score})` : ''}</td>)}
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[7px]">{row.totalItems || ''}</td>
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[7px] font-bold">{row.totalScore || ''}</td>
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[7px]">{row.totalTime || ''}</td>
                                        </tr>
                                        <tr className="bg-gray-100">
                                            <td colSpan={3} className="border border-black px-[2px] py-[1.5px] text-[7.5px] text-gray-700 font-medium tamil-font italic">
                                                {optionStat ? `Options / Choice Questions (${optionStat.count})` : 'Options / Choice Questions'}
                                            </td>
                                            {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[7px] text-gray-600 font-medium bg-gray-100">{optionStat?.stats.cp[def.key].count ? `${optionStat.stats.cp[def.key].count}(${optionStat.stats.cp[def.key].score})` : ''}</td>)}
                                            {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[7px] text-gray-600 font-medium bg-gray-100">{optionStat?.stats.levels[def.key].count ? `${optionStat.stats.levels[def.key].count}(${optionStat.stats.levels[def.key].score})` : ''}</td>)}
                                            {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[7px] text-gray-600 font-medium bg-gray-100">{optionStat?.stats.formats[def.key].count ? `${optionStat.stats.formats[def.key].count}(${optionStat.stats.formats[def.key].score})` : ''}</td>)}
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[7px] text-gray-600 font-semibold bg-gray-100">{optionStat ? optionStat.count : ''}</td>
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[7px] text-gray-600 font-bold bg-gray-100">{optionStat ? optionStat.score : ''}</td>
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[7px] text-gray-600 bg-gray-100"></td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                            <tr className="bg-gray-200 font-bold">
                                <td colSpan={3} className="border border-black px-[3px] py-[4px] text-right uppercase text-[7.5px]">Total Item</td>
                                {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{grandTotals.cp[def.key].count || ''}</td>)}
                                {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{grandTotals.levels[def.key].count || ''}</td>)}
                                {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{grandTotals.formats[def.key].count || ''}</td>)}
                                <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold">{totalItemsInTable}</td>
                                <td className="border border-black px-[1px] py-[4px] bg-black"></td>
                                <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold" rowSpan={2}>
                                    {orderedItems.reduce((sum, item) => sum + getDisplayTime(item), 0)}
                                </td>
                            </tr>
                            <tr className="bg-gray-200 font-bold">
                                <td colSpan={3} className="border border-black px-[3px] py-[4px] text-right uppercase text-[7.5px]">Total Score</td>
                                {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{grandTotals.cp[def.key].score || ''}</td>)}
                                {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{grandTotals.levels[def.key].score || ''}</td>)}
                                {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{grandTotals.formats[def.key].score || ''}</td>)}
                                <td className="border border-black px-[1px] py-[4px] bg-black"></td>
                                <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold">{totalScoreInTable}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-auto py-2 flex justify-between items-center text-[10px] font-bold text-gray-400">
                    <span>Page 3 of 4</span>
                </div>
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

        const tableTotalItems = Object.values(totals.stats.cp).reduce((sum, cp) => sum + cp.count, 0);
        const tableTotalMarks = Object.values(totals.stats.cp).reduce((sum, cp) => sum + cp.score, 0);

        return (
            <div className={`text-black report-page-container flex flex-col min-h-[1050px] justify-between pb-1`}>
                <div>
                    {renderReportHeader('Part – III : Item-wise Analysis')}
                    <table className="w-full border-collapse border-2 border-black text-[8px] leading-[1.05] report-analysis-table table-fixed">
                        {renderAnalysisColGroup(true, 3)}
                        {renderAnalysisTableHeader('Item / Q. No', 3)}
                        <tbody>
                            {questionRows.map((row) => {
                                const isOptionRow = row.id.endsWith('-B');
                                const rowMarks = getItemTotalScore(row.item);
                                const rowQuestionCount = getItemQuestionCount(row.item);

                                return (
                                    <tr key={row.id} className={isOptionRow ? 'bg-gray-100 text-gray-600' : 'bg-white'}>
                                        <td className="border border-black px-[2px] py-[2px] text-center text-[7.5px] font-bold">{row.qNo}</td>
                                        {isOptionRow ? (
                                            <td className="border border-black px-[3px] py-[8px] text-[7.5px] tamil-font bg-gray-100" colSpan={3}>Option / {row.subUnit?.name || row.unit?.name || '-'}</td>
                                        ) : (
                                            <>
                                                <td className="border border-black px-[3px] py-[2px] text-[8px] leading-[1.05] tamil-font report-topic-cell font-semibold">{row.unit ? `${row.unit.unitNumber}. ${row.unit.name}` : '-'}</td>
                                                <td className="border border-black px-[3px] py-[2px] text-[7px] leading-[1.02] tamil-font report-lo-cell">{row.unit?.learningOutcomes || '-'}</td>
                                                <td className="border border-black px-[3px] py-[2px] text-[8px] leading-[1.05] tamil-font report-topic-cell">{row.subUnit?.name || '-'}</td>
                                            </>
                                        )}

                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[2px] text-center text-[7px]">{row.cognitiveProcess === def.value ? `${rowQuestionCount} (${rowMarks})` : ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[2px] text-center text-[7px]">{row.knowledgeLevel === def.value ? `${rowQuestionCount} (${rowMarks})` : ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[2px] text-center text-[7px]">{row.itemFormat === def.value ? `${rowQuestionCount} (${rowMarks})` : ''}</td>)}
                                        <td className="border border-black px-[1px] py-[2px] text-center text-[7px]">{rowQuestionCount}</td>
                                        <td className="border border-black px-[1px] py-[2px] text-center text-[7px] font-bold">{rowMarks}</td>
                                        <td className="border border-black px-[1px] py-[2px] text-center text-[7px]">{getDisplayTime(row.item)}</td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-gray-200 font-bold">
                                <td colSpan={4} className="border border-black px-[3px] py-[4px] text-right uppercase text-[7.5px]">Total Item</td>
                                {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{totals.stats.cp[def.key].count || ''}</td>)}
                                {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{totals.stats.levels[def.key].count || ''}</td>)}
                                {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{totals.stats.formats[def.key].count || ''}</td>)}
                                <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold">{tableTotalItems}</td>
                                <td className="border border-black px-[1px] py-[4px] bg-black"></td>
                                <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold" rowSpan={2}>
                                    {orderedItems.reduce((sum, item) => sum + getDisplayTime(item), 0)}
                                </td>
                            </tr>
                            <tr className="bg-gray-200 font-bold">
                                <td colSpan={4} className="border border-black px-[3px] py-[4px] text-right uppercase text-[7.5px]">Total Score</td>
                                {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{totals.stats.cp[def.key].score || ''}</td>)}
                                {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{totals.stats.levels[def.key].score || ''}</td>)}
                                {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[7px]">{totals.stats.formats[def.key].score || ''}</td>)}
                                <td className="border border-black px-[1px] py-[4px] bg-black"></td>
                                <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold">{tableTotalMarks}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-auto py-2 flex justify-between items-center text-[10px] font-bold text-gray-400">
                    <span>Page 4 of 4</span>
                </div>
            </div>
        );
    };

    return (
        <div className="mt-10 w-full text-black reports-container relative overflow-x-auto">
            {timeWarning && (
                <div className={`mb-4 p-3 font-bold no-print flex items-center justify-center gap-2 ${examMinutes > 90 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                    <span>⚠️</span>
                    <span>{timeWarning} ({examMinutes} Mins)</span>
                </div>
            )}

            <div className="sticky top-[72px] z-30 bg-white py-4 mb-4 no-print border-b flex justify-center items-center gap-4 flex-wrap px-4">
                <div className="flex bg-gray-100 p-1 border border-black/20 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setActiveTab('report1')} className={`px-4 py-2 font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report1' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}>Report 1</button>
                    <button onClick={() => setActiveTab('report2')} className={`px-4 py-2 font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report2' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}>Report 2</button>
                    <button onClick={() => setActiveTab('report3')} className={`px-4 py-2 font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report3' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}>Report 3</button>
                    <button onClick={() => setActiveTab('answerKey')} className={`px-4 py-2 font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'answerKey' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}>Answer Key</button>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => onDownloadPDF?.(activeTab)} className="bg-white text-black border-2 border-black px-5 py-2 font-bold hover:bg-gray-100 flex items-center gap-2 transition-all text-sm md:text-base outline-none"><Download size={18} /> PDF</button>
                    <button onClick={() => onDownloadWord?.(activeTab)} className="bg-white text-black border-2 border-black px-5 py-2 font-bold hover:bg-gray-100 flex items-center gap-2 transition-all text-sm md:text-base outline-none"><FileText size={18} /> Word</button>
                    <button onClick={() => window.print()} className="bg-black text-white border-2 border-black px-5 py-2 font-bold hover:bg-gray-800 flex items-center gap-2 transition-all text-sm md:text-base outline-none"><Printer size={18} /> Print</button>
                </div>
            </div>

            <div className={`print-only-container ${activeTab === 'report2' || activeTab === 'report3' ? 'landscape-mode' : ''}`}>
                <div className="reports-display-content overflow-x-auto pb-4">
                    {activeTab === 'report1' && (
                        <div className="max-w-[210mm] mx-auto space-y-4 bg-white p-4 mb-4">
                            {renderReport1Content(1)}
                            <div className="mt-8"></div>
                            {renderReport1Content(2)}
                        </div>
                    )}

                    {activeTab === 'report2' && (
                        <div className="w-full bg-white p-4 mb-4 landscape-report-page landscape-fit-page overflow-x-auto">
                            {renderReport2Content()}
                        </div>
                    )}

                    {activeTab === 'report3' && (
                        <div className="w-full bg-white p-4 mb-4 landscape-report-page landscape-fit-page overflow-x-auto">
                            {renderReport3Content()}
                        </div>
                    )}

                    {activeTab === 'answerKey' && (
                        <div className="max-w-[210mm] mx-auto bg-white p-4 mb-4">
                            <AnswerKeyView blueprint={blueprint} curriculum={curriculum} discourses={discourses} />
                        </div>
                    )}
                </div>

                <div id="pdf-capture-source" className="no-print" style={{ position: 'fixed', top: 0, left: '-99999px', zIndex: -1, pointerEvents: 'none' }}>
                    <div id="report-page-1" className="bg-white p-8" style={{ width: '794px' }}>{renderReport1Content(1)}</div>
                    <div id="report-page-2" className="bg-white p-8" style={{ width: '794px' }}>{renderReport1Content(2)}</div>
                    <div id="report-item-analysis-page-report2" className="bg-white landscape-fit-capture p-6" style={{ width: '1123px' }}>{renderReport2Content()}</div>
                    <div id="report-page-blueprint-matrix" className="bg-white landscape-fit-capture p-4" style={{ width: '1123px' }}>{renderReport3Content()}</div>
                    <div id="report-answer-key" className="bg-white" style={{ width: '794px', padding: '32px' }}>
                        <AnswerKeyView blueprint={blueprint} curriculum={curriculum} discourses={discourses} isPdf={true} />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
            .landscape-fit-page { width: 277mm; min-width: 277mm; min-height: 190mm; margin: auto; overflow: auto; }
            .report-analysis-table { table-layout: fixed; width: 100% !important; }
            .report-analysis-table th, .report-analysis-table td { word-break: break-word; vertical-align: middle; }
            .report-topic-cell, .report-lo-cell { font-family: 'TAU-Paalai', 'TAU-Pallai', 'Latha', serif !important; }
            .report-lo-cell { font-size: 7px !important; line-height: 1 !important; }
            .report-topic-cell { font-size: 7px !important; line-height: 1 !important; }
            @media print {
                .landscape-fit-page { width: 100% !important; max-width: 100% !important; min-height: auto !important; margin: 0 !important; padding: 4mm !important; break-after: page; page-break-after: always; }
                .report-analysis-table { font-size: 7px !important; }
                .report-analysis-table th, .report-analysis-table td { padding: 2px !important; line-height: 1.1 !important; }
            }
        `}} />
        </div>
    );
};
