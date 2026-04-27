import React, { useState, useEffect } from 'react';
import { Blueprint, BlueprintItem, Curriculum, CognitiveProcess, KnowledgeLevel, ItemFormat, QuestionPaperType, Discourse } from '../types';
import { getBlueprintById, initDB } from '../services/db';
import { RefreshCw } from 'lucide-react';

/**
 * PrintView Component
 * 
 * Strict A4 layout (210mm x 297mm)
 * Handles Report 1, 2, 3 and Answer Key individually based on 'tab' query param.
 */
const PrintView: React.FC<{ id: string }> = ({ id }) => {
    const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [paperType, setPaperType] = useState<QuestionPaperType | null>(null);
    const [discourses, setDiscourses] = useState<Discourse[]>([]);
    const [loading, setLoading] = useState(true);

    // Get current tab from URL
    const queryParams = new URLSearchParams(window.location.search);
    const currentTab = queryParams.get('tab') || 'report1';
    const renderMode = queryParams.get('mode') || 'admin';
    const showUserDraftWatermark = renderMode === 'user' && currentTab.startsWith('report');

    useEffect(() => {
        const loadData = async () => {
            try {
                const db = await initDB();
                const bp = await getBlueprintById(id);
                if (bp) {
                    setBlueprint(bp);
                    const curr = db.curriculums.find(c => c.classLevel === bp.classLevel && c.subject === bp.subject);
                    setCurriculum(curr || null);
                    const pt = db.questionPaperTypes.find(t => t.id === bp.questionPaperTypeId);
                    setPaperType(pt || null);
                    setDiscourses(db.discourses || []);
                }
            } catch (err) {
                console.error("Failed to load print data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-gray-500 font-bold uppercase tracking-widest font-serif">Preparing {currentTab.toUpperCase()}...</p>
            </div>
        );
    }

    if (!blueprint || !curriculum) {
        return <div className="p-10 text-red-600 font-bold font-serif">Error: Blueprint or Curriculum not found.</div>;
    }

    const isLandscape = (currentTab === 'report2' || currentTab === 'report3');
    
    // --- Helper Functions ---
    
    const getItemQuestionCount = (item: BlueprintItem) => Math.max(item.questionCount || 1, 1);
    const getItemTotalScore = (item: BlueprintItem) => getItemQuestionCount(item) * (item.marksPerQuestion || 0);
    
    const getDisplayTime = (item: BlueprintItem) => {
        if (item.time !== undefined && item.time !== null && item.time !== 0) return item.time;
        const marks = item.marksPerQuestion;
        if (marks <= 2) return 5;
        if (marks <= 4) return 10;
        return 15;
    };

    const cpDefinitions = [
        { key: 'CP1', label: 'Conceptual Clarity', value: CognitiveProcess.CP1 },
        { key: 'CP2', label: 'Application Skill', value: CognitiveProcess.CP2 },
        { key: 'CP3', label: 'Computational Thinking', value: CognitiveProcess.CP3 },
        { key: 'CP4', label: 'Analytical Thinking', value: CognitiveProcess.CP4 },
        { key: 'CP5', label: 'Critical Thinking', value: CognitiveProcess.CP5 },
        { key: 'CP6', label: 'Creative Thinking', value: CognitiveProcess.CP6 },
        { key: 'CP7', label: 'Values/Attitudes', value: CognitiveProcess.CP7 }
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

    const createStats = () => ({
        cp: Object.fromEntries(cpDefinitions.map(def => [def.key, { count: 0, score: 0 }])) as Record<string, { count: number; score: number }>,
        levels: Object.fromEntries(levelDefinitions.map(def => [def.key, { count: 0, score: 0 }])) as Record<string, { count: number; score: number }>,
        formats: Object.fromEntries(formatDefinitions.map(def => [def.key, { count: 0, score: 0 }])) as Record<string, { count: number; score: number }>
    });

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
        if (s.endsWith('.5')) {
            const whole = s.split('.')[0];
            return whole === '0' ? '½' : `${whole}½`;
        }
        return s;
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
                    style={{ 
                        fontFamily: isTamil ? `'TAU-Paalai', serif` : `'Times New Roman', serif`,
                        fontSize: isTamil ? `12pt` : `10pt`,
                    }}
                >
                    {seg}
                </span>
            );
        });
    };

    const subjectInfo = blueprint.subject.includes('AT')
        ? { tamil: 'Tamil Language Paper I (AT)', english: 'Tamil Language Paper I (AT)', code: '02' }
        : blueprint.subject.includes('BT')
            ? { tamil: 'Tamil Language Paper II (BT)', english: 'Tamil Language Paper II (BT)', code: '12' }
            : { tamil: blueprint.subject, english: blueprint.subject, code: '00' };

    const totalScore = blueprint.items.reduce((sum, item) => sum + getItemTotalScore(item), 0);
    const totalExamMinutes = blueprint.items.reduce((sum, item) => sum + getDisplayTime(item), 0);

    const sectionIndexMap = new Map((paperType?.sections || []).map((section, idx) => [section.id, idx]));
    const unitOrderMap = new Map((curriculum?.units || []).map(unit => [unit.id, unit.unitNumber]));
    
    const sortItems = (items: BlueprintItem[]) => [...items].sort((a, b) => {
        const aIdx = a.sectionId ? sectionIndexMap.get(a.sectionId) ?? 999 : 999;
        const bIdx = b.sectionId ? sectionIndexMap.get(b.sectionId) ?? 999 : 999;
        if (aIdx !== bIdx) return aIdx - bIdx;
        const unitA = unitOrderMap.get(a.unitId) || 999;
        const unitB = unitOrderMap.get(b.unitId) || 999;
        if (unitA !== unitB) return unitA - unitB;
        if (a.marksPerQuestion !== b.marksPerQuestion) return a.marksPerQuestion - b.marksPerQuestion;
        return blueprint.items.indexOf(a) - blueprint.items.indexOf(b);
    });

    const orderedItems = sortItems(blueprint.items);
    const derivedTotalItems = blueprint.items.reduce((sum, item) => sum + getItemQuestionCount(item), 0);
    const derivedTotalMarks = blueprint.items.reduce((sum, item) => sum + getItemTotalScore(item), 0);

    const renderReportHeader = () => (
        <div className="mb-4 text-center font-serif">
            <h1 className="text-2xl font-bold text-black border-b-2 border-black inline-block px-10 pb-1">Proforma for Analysing Question Paper</h1>
            <div className="text-lg font-bold mt-2">Topic / Sub Topic wise Analysis</div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 mt-4 text-[11pt] border-b-2 border-black pb-3 text-left font-bold">
                <div className="flex"><span className="w-24">Class</span><span className="mx-2">: {blueprint.classLevel}</span></div>
                <div className="flex"><span className="w-24">Subject</span><span className="mx-2">: {renderMixedText(subjectInfo.tamil)}</span></div>
                
                <div className="flex"><span className="w-24">Set</span><span className="mx-2">: {blueprint.setId || 'A'}</span></div>
                <div className="flex"><span className="w-24">Type</span><span className="mx-2">: 1</span></div>
                
                <div className="flex"><span className="w-24">Term</span><span className="mx-2">: {blueprint.examTerm}</span></div>
                <div className="flex"><span className="w-24">Year</span><span className="mx-2">: {blueprint.academicYear || '2026-27'}</span></div>
            </div>
        </div>
    );

    const renderDraftWatermark = () => (
        showUserDraftWatermark ? (
            <div className="draft-watermark">
                <div className="draft-watermark-text">Draft</div>
            </div>
        ) : null
    );

    const renderAnalysisTableHeader = (firstCol: string | null) => (
        <thead className="font-serif">
            <tr className="bg-[#d9ead3] text-[9pt]">
                {firstCol && <th rowSpan={2} className="border border-black p-1 font-bold text-center">{firstCol}</th>}
                <th colSpan={3} className="border border-black p-1 font-bold text-center">Content Area</th>
                <th colSpan={7} className="border border-black p-1 font-bold text-center" style={{ fontSize: '8pt' }}>Cognitive Process</th>
                <th colSpan={3} className="border border-black p-1 font-bold text-center" style={{ fontSize: '8pt' }}>Knowledge Level</th>
                <th colSpan={5} className="border border-black p-1 font-bold text-center" style={{ fontSize: '8pt' }}>Item Format</th>
                <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '8pt' }}>Total Item</th>
                <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '8pt' }}>Total Score</th>
                <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '8pt' }}>Time</th>
            </tr>
            <tr className="bg-[#fff2cc] text-[8pt] leading-tight">
                <th className="border border-black p-1 font-bold">Topic / Unit</th>
                <th className="border border-black p-1 font-bold">Learning Objective</th>
                <th className="border border-black p-1 font-bold">Sub Topic / Sub Unit</th>
                {cpDefinitions.map(def => <th key={def.key} className="border border-black p-0.5 font-bold text-[8pt] text-black">{def.key}</th>)}
                {levelDefinitions.map(def => <th key={def.key} className="border border-black p-0.5 font-bold text-[8pt] text-black">{def.key}</th>)}
                {formatDefinitions.map(def => <th key={def.key} className="border border-black p-0.5 font-bold text-[8pt] text-black">{def.key}</th>)}
            </tr>
        </thead>
    );

    const renderAnalysisColGroup = (showFirst: boolean) => (
        <colgroup>
            {showFirst && <col style={{ width: '4%' }} />}
            <col style={{ width: showFirst ? '10%' : '12%' }} />
            <col style={{ width: showFirst ? '16%' : '18%' }} />
            <col style={{ width: showFirst ? '10%' : '12%' }} />
            {cpDefinitions.map(def => <col key={def.key} style={{ width: '2.6%' }} />)}
            {levelDefinitions.map(def => <col key={def.key} style={{ width: '2.6%' }} />)}
            {formatDefinitions.map(def => <col key={def.key} style={{ width: '2.6%' }} />)}
            <col style={{ width: '3.2%' }} />
            <col style={{ width: '3.2%' }} />
            <col style={{ width: '3.2%' }} />
        </colgroup>
    );

    // --- Report 1 Content ---
    const renderReport1Page1Content = () => {
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

        return (
            <>
                <div className="header-section mb-6">
                    <h1 className="text-2xl font-bold uppercase text-center mb-8">
                        <span className="border-b-2 border-black pb-1 px-12">QUESTION PAPER DESIGN - HS</span>
                    </h1>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[11pt] mb-4 text-left font-bold">
                        <div className="flex"><span className="w-24">Class</span><span className="mr-2">: {blueprint.classLevel}</span></div>
                        <div className="flex"><span className="w-24">Subject</span><span className="mr-2">: {renderMixedText(subjectInfo.tamil)}</span></div>
                        
                        <div className="flex"><span className="w-24">Set</span><span className="mr-2">: {blueprint.setId || 'A'}</span></div>
                        <div className="flex"><span className="w-24">Type</span><span className="mr-2">: 1</span></div>
                        
                        <div className="flex"><span className="w-24">Score</span><span className="mr-2">: {totalScore} Marks</span></div>
                        <div className="flex"><span className="w-24">Time</span><span className="mr-2">: {totalExamMinutes} Minutes</span></div>
                        
                        <div className="flex"><span className="w-24">Term</span><span className="mr-2">: {blueprint.examTerm}</span></div>
                        <div className="flex"><span className="w-24">Year</span><span className="mr-2">: {blueprint.academicYear || '2026-27'}</span></div>
                    </div>
                    <div className="border-b-2 border-black mb-6"></div>
                </div>

                <div className="section avoid-break mb-8 text-left">
                    <h3 className="text-[12pt] font-bold text-black border-b border-black mb-3 pb-0.5 inline-block">I. Weightage to Content Area</h3>
                    <table className="analysis-table w-full border-collapse border border-black">
                        <thead>
                            <tr className="bg-white">
                                <th className="border border-black p-1 text-center font-bold w-[7%] text-[9pt]">Sl. No</th>
                                <th className="border border-black p-1 text-center font-bold w-[28%] text-[9pt]">Learning Objective</th>
                                <th className="border border-black p-1 text-center font-bold w-[23%] text-[9pt]">Unit / Topic / Chapter</th>
                                <th className="border border-black p-1 text-center font-bold w-[22%] text-[9pt]">Sub-unit / Sub-topic</th>
                                <th className="border border-black p-1 text-center font-bold w-[10%] text-[9pt]">Score</th>
                                <th className="border border-black p-1 text-center font-bold w-[10%] text-[9pt]">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contentAreaStats.map((row, idx) => (
                                <tr key={row.unit.id}>
                                    <td className="border border-black p-2 text-center text-[9pt]">{idx + 1}</td>
                                    <td className="border border-black p-2 text-[9pt]">{row.unit.learningOutcomes || '-'}</td>
                                    <td className="border border-black p-2 text-[10pt]">{renderMixedText(row.unit.name)}</td>
                                    <td className="border border-black p-2 text-[9pt] italic">{row.unit.subUnits.map(s => s.name).join(', ')}</td>
                                    <td className="border border-black p-2 text-center font-bold text-[10pt]">{formatMark(row.score)}</td>
                                    <td className="border border-black p-2 text-center text-[9pt] italic">{totalScore > 0 ? Math.round((row.score / totalScore) * 100) : 0}%</td>
                                </tr>
                            ))}
                            <tr className="bg-white font-bold">
                                <td colSpan={4} className="border border-black p-1 text-center uppercase tracking-widest text-[10pt]">TOTAL</td>
                                <td className="border border-black p-1 text-center text-[11pt]">{totalScore}</td>
                                <td className="border border-black p-1 text-center text-[11pt]">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="section avoid-break mb-6 text-left">
                    <h3 className="text-[12pt] font-bold text-black border-b border-black mb-3 pb-0.5 inline-block text-left">II. Weightage to Cognitive Process</h3>
                    <table className="analysis-table w-full border-collapse border border-black">
                        <thead>
                            <tr className="bg-white">
                                <th className="border border-black p-2 text-center font-bold w-[15%] text-[9pt]">Sl. No.</th>
                                <th className="border border-black p-2 text-center font-bold w-[55%] text-[9pt]">Cognitive Process</th>
                                <th className="border border-black p-2 text-center font-bold w-[15%] text-[9pt]">Score</th>
                                <th className="border border-black p-2 text-center font-bold w-[15%] text-[9pt]">Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cpStats.map((row, idx) => (
                                <tr key={row.key}>
                                    <td className="border border-black p-1.5 text-center font-bold text-[10pt]">CP{idx + 1}</td>
                                    <td className="border border-black p-1.5 text-left text-[10pt]">{row.label}</td>
                                    <td className="border border-black p-1.5 text-center text-[11pt]">{row.score ? formatMark(row.score) : '-'}</td>
                                    <td className="border border-black p-1.5 text-center text-[11pt]">{row.score > 0 ? (row.score / totalScore * 100).toFixed(1) + '%' : '-'}</td>
                                </tr>
                            ))}
                            <tr className="bg-white font-bold">
                                <td colSpan={2} className="border border-black p-1.5 text-center uppercase tracking-widest text-[10pt]">TOTAL</td>
                                <td className="border border-black p-1.5 text-center text-[11pt]">{totalScore}</td>
                                <td className="border border-black p-1.5 text-center text-[11pt]">100%</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="mt-4 text-[8pt] italic">
                        Index of Abbreviation: CP - Cognitive Process
                    </div>
                </div>
            </>
        );
    };

    const renderReport1Page2Content = () => {
        const levelStats = levelDefinitions.map(def => {
            const score = blueprint.items.reduce((sum, item) =>
                item.knowledgeLevel === def.value ? sum + getItemTotalScore(item) : sum, 0);
            return { ...def, score };
        });

        const getFormatGroupStats = (formats: string[]) => {
            return blueprint.items.reduce((acc, item) => {
                const normalizedFormat = normalizeFormatValue(item.itemFormat as string);
                if (formats.includes(normalizedFormat)) {
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
            <>
                <div className="section avoid-break mb-6">
                    <h3 className="text-[12pt] font-bold text-black border-b border-black mb-3 pb-0.5 inline-block uppercase tracking-tight">III. Weightage to Knowledge Level</h3>
                    <table className="analysis-table w-full border-collapse border border-black">
                        <thead>
                            <tr className="bg-white">
                                <th className="border border-black p-1.5 text-center font-bold w-[12%] text-[9pt]">Sl. No.</th>
                                <th className="border border-black p-1.5 text-left font-bold w-[54%] text-[9pt]">Knowledge Level</th>
                                <th className="border border-black p-1.5 text-center font-bold w-[17%] text-[9pt]">Score</th>
                                <th className="border border-black p-1.5 text-center font-bold w-[17%] text-[9pt]">Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {levelStats.map((row, idx) => (
                                <tr key={row.key}>
                                    <td className="border border-black p-1.5 text-center text-[11pt]">{idx + 1}</td>
                                    <td className="border border-black p-1.5 text-left text-[10pt]">{row.label}</td>
                                    <td className="border border-black p-1.5 text-center text-[11pt]">{row.score ? formatMark(row.score) : '-'}</td>
                                    <td className="border border-black p-1.5 text-center text-[11pt]">{row.score > 0 ? (row.score / totalScore * 100).toFixed(0) + '%' : '-'}</td>
                                </tr>
                            ))}
                            <tr className="bg-white font-bold">
                                <td colSpan={2} className="border border-black p-1.5 text-center uppercase tracking-widest text-[10pt]">TOTAL</td>
                                <td className="border border-black p-1.5 text-center text-[11pt]">{totalScore}</td>
                                <td className="border border-black p-1.5 text-center text-[11pt]">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="section avoid-break mb-6">
                    <h3 className="text-[12pt] font-bold text-black border-b border-black mb-3 pb-0.5 inline-block uppercase tracking-tight">IV. Weightage to Item Format</h3>
                    <table className="analysis-table w-full border-collapse border border-black text-[9pt] leading-tight">
                        <thead>
                            <tr className="bg-white">
                                <th className="border border-black px-1.5 py-1 text-center font-bold w-[7%]">Sl. No.</th>
                                <th className="border border-black px-1.5 py-1 text-left font-bold w-[18%]">Item Format</th>
                                <th className="border border-black px-1.5 py-1 text-center font-bold w-[8%]">Code</th>
                                <th className="border border-black px-1.5 py-1 text-center font-bold w-[8%]">Format</th>
                                <th className="border border-black px-1.5 py-1 text-center font-bold w-[12%]">No. of Items</th>
                                <th className="border border-black px-1.5 py-1 text-center font-bold w-[12%]">Est. Time</th>
                                <th className="border border-black px-1.5 py-1 text-center font-bold w-[12%]">Score</th>
                                <th className="border border-black px-1.5 py-1 text-center font-bold w-[10%]">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'SR Item', code: 'SR1', fmt: 'MCI', stats: sr1Stats, sl: 1 },
                                { name: 'SR Item', code: 'SR2', fmt: 'MI', stats: sr2Stats, sl: 2 },
                                { name: 'CRS Item', code: 'CRS1', fmt: 'VSA', stats: crs1Stats, sl: 3 },
                                { name: 'CRS Item', code: 'CRS2', fmt: 'SA', stats: crs2Stats, sl: 4 },
                                { name: 'CRL Item', code: 'CRL', fmt: 'E', stats: crlStats, sl: 5 }
                            ].map((row) => (
                                <tr key={row.code}>
                                    <td className="border border-black px-1.5 py-1 text-center">{row.sl}</td>
                                    <td className="border border-black px-1.5 py-1 font-semibold">{row.name}</td>
                                    <td className="border border-black px-1.5 py-1 text-center font-bold">{row.code}</td>
                                    <td className="border border-black px-1.5 py-1 text-center font-bold">{row.fmt}</td>
                                    <td className="border border-black px-1.5 py-1 text-center">{row.stats.count || '-'}</td>
                                    <td className="border border-black px-1.5 py-1 text-center">{row.stats.time || '-'}</td>
                                    <td className="border border-black px-1.5 py-1 text-center font-bold">{row.stats.score ? formatMark(row.stats.score) : '-'}</td>
                                    <td className="border border-black px-1.5 py-1 text-center">{row.stats.score > 0 ? Math.round((row.stats.score / totalScore) * 100) : '-'}%</td>
                                </tr>
                            ))}
                            <tr className="bg-white font-bold">
                                <td colSpan={4} className="border border-black px-1.5 py-1 text-center uppercase tracking-widest">Total</td>
                                <td className="border border-black px-1.5 py-1 text-center">{blueprint.items.reduce((sum, item) => sum + getItemQuestionCount(item), 0)}</td>
                                <td className="border border-black px-1.5 py-1 text-center">{totalExamMinutes}</td>
                                <td className="border border-black px-1.5 py-1 text-center">{totalScore}</td>
                                <td className="border border-black px-1.5 py-1 text-center">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="section avoid-break mt-4 text-[9pt] grid grid-cols-2 gap-x-8 mb-8">
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

                <div className="section avoid-break mb-6 mt-8">
                    <h3 className="text-lg font-bold text-black border-b border-black mb-3 pb-0.5 inline-block uppercase tracking-tight">V. Scheme of Sections :</h3>
                    <div className="min-h-[60px] border-b border-black/20"></div>
                </div>

                <div className="section avoid-break mb-6">
                    <h3 className="text-lg font-bold text-black border-b border-black mb-3 pb-0.5 inline-block uppercase tracking-tight">VI. Pattern of Options :</h3>
                    <div className="space-y-3 ml-4 mt-4">
                        <div className="flex items-center gap-6">
                            <span className="w-48 font-bold text-[11pt]">Internal choice</span>
                            <div className="border border-black w-7 h-7 flex items-center justify-center text-xl font-bold">
                                {hasInternalChoice ? '✓' : ''}
                            </div>
                            <span className="text-[11pt] font-bold ml-2">
                                {hasInternalChoice ? `${internalChoicePercent}%` : ''}
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="w-48 font-bold text-[11pt]">Overall choice</span>
                            <div className="border border-black w-7 h-7 flex items-center justify-center">
                            </div>
                            <span className="text-[11pt] font-bold ml-2">As per standard norms</span>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // --- Report 2 Content ---
    const renderReport2Content = () => {
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
                
                const optionItems = unitItems.filter(item => item.hasInternalChoice);
                const optionStats = createStats();
                optionItems.forEach(item => addToStats(optionStats, item.cognitiveProcessB || item.cognitiveProcess, item.knowledgeLevelB || item.knowledgeLevel, item.itemFormatB || item.itemFormat, getItemTotalScore(item), getItemQuestionCount(item)));

                return {
                    id: unit.id, unit, subUnitsStats, unitStats, optionStats,
                    hasOptions: optionItems.length > 0,
                    optionCount: optionItems.reduce((s, i) => s + getItemQuestionCount(i), 0),
                    optionScore: optionItems.reduce((s, i) => s + getItemTotalScore(i), 0),
                    totalTime: unitItems.reduce((s, i) => s + getDisplayTime(i), 0),
                    totalItems: unitItems.reduce((s, i) => s + getItemQuestionCount(i), 0),
                    totalScore: unitItems.reduce((s, i) => s + getItemTotalScore(i), 0)
                };
            });

        const grandTotals = createStats();
        report2Rows.forEach(row => {
            Object.keys(grandTotals.cp).forEach(k => { grandTotals.cp[k].count += row.unitStats.cp[k].count; grandTotals.cp[k].score += row.unitStats.cp[k].score; });
            Object.keys(grandTotals.levels).forEach(k => { grandTotals.levels[k].count += row.unitStats.levels[k].count; grandTotals.levels[k].score += row.unitStats.levels[k].score; });
            Object.keys(grandTotals.formats).forEach(k => { grandTotals.formats[k].count += row.unitStats.formats[k].count; grandTotals.formats[k].score += row.unitStats.formats[k].score; });
        });
        const totalItemsInTable = Object.values(grandTotals.cp).reduce((s, cp) => s + cp.count, 0);
        const totalScoreInTable = Object.values(grandTotals.cp).reduce((s, cp) => s + cp.score, 0);

        const itemsPerPage = 5;
        const totalPages = Math.ceil(report2Rows.length / itemsPerPage);

        return report2Rows.length > 0 ? Array.from({ length: totalPages }).map((_, pageIdx) => {
            const startIdx = pageIdx * itemsPerPage;
            const endIdx = startIdx + itemsPerPage;
            const pageRows = report2Rows.slice(startIdx, endIdx);
            
            return (
                <div key={pageIdx} className="page landscape relative font-serif">
                    {renderDraftWatermark()}
                    <div className="page-content">
                        {pageIdx === 0 ? renderReportHeader() : (
                            <div className="mb-4 text-center border-b-2 border-black pb-2">
                                <h1 className="text-2xl font-bold text-black border-b border-black inline-block px-10 pb-1">Proforma for Analysing Question Paper</h1>
                                <div className="text-lg font-bold mt-1">Topic / Sub Topic wise Analysis (Continued)</div>
                            </div>
                        )}
                        
                        <div className="text-center text-xl font-bold text-black mb-2 uppercase tracking-tight border-b border-black/50 pb-1 inline-block w-full">
                            Part – II : Unit-wise Analysis
                        </div>

                        <table className="border-collapse border-2 border-black text-[8pt] leading-[1.05] table-fixed" style={{ width: '99%', margin: '0 auto 0 0' }}>
                            {renderAnalysisColGroup(false)}
                            {renderAnalysisTableHeader(null)}
                            <tbody>
                            {pageRows.map((row) => (
                                <React.Fragment key={row.id}>
                                    {row.subUnitsStats.map((su, suIdx) => (
                                        <tr key={su.subUnit.id} className="bg-white">
                                            {suIdx === 0 && (
                                                <>
                                                    <td rowSpan={row.subUnitsStats.length} className="border border-black px-[2px] py-[1.5px] text-[9pt] font-semibold align-top">{renderMixedText(`${row.unit.unitNumber}. ${row.unit.name}`)}</td>
                                                    <td rowSpan={row.subUnitsStats.length} className="border border-black px-[2px] py-[1.5px] text-[9pt] align-top">{renderMixedText(row.unit.learningOutcomes || '-')}</td>
                                                </>
                                            )}
                                            <td className="border border-black px-[2px] py-[1.5px] text-[9pt]">{renderMixedText(su.subUnit.name)}</td>
                                            {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9pt] font-bold text-black">{su.stats.cp[def.key].count ? <>{su.stats.cp[def.key].count}({formatMark(su.stats.cp[def.key].score)})</> : ''}</td>)}
                                            {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9pt] font-bold text-black">{su.stats.levels[def.key].count ? <>{su.stats.levels[def.key].count}({formatMark(su.stats.levels[def.key].score)})</> : ''}</td>)}
                                            {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9pt] font-bold text-black">{su.stats.formats[def.key].count ? <>{su.stats.formats[def.key].count}({formatMark(su.stats.formats[def.key].score)})</> : ''}</td>)}
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[9pt] font-bold text-black">{su.totalItems || ''}</td>
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[9pt] font-bold text-black">{su.totalScore ? formatMark(su.totalScore) : ''}</td>
                                            <td className="border border-black px-[1px] py-[1.5px] text-center text-[9pt] font-bold text-black">{su.totalTime || ''}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 print-bg-gray">
                                        <td colSpan={3} className="border border-black px-[2px] py-[4px] text-[9pt] text-black font-bold whitespace-nowrap leading-[1.15] align-middle">
                                            {row.hasOptions ? `Options / Choice Questions (${row.optionCount})` : 'Options / Choice Questions'}
                                        </td>
                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9pt] text-black font-bold bg-gray-100 print-bg-gray leading-[1.15] align-middle">{row.optionStats.cp[def.key].count ? <>{row.optionStats.cp[def.key].count}({formatMark(row.optionStats.cp[def.key].score)})</> : ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9pt] text-black font-bold bg-gray-100 print-bg-gray leading-[1.15] align-middle">{row.optionStats.levels[def.key].count ? <>{row.optionStats.levels[def.key].count}({formatMark(row.optionStats.levels[def.key].score)})</> : ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9pt] text-black font-bold bg-gray-100 print-bg-gray leading-[1.15] align-middle">{row.optionStats.formats[def.key].count ? <>{row.optionStats.formats[def.key].count}({formatMark(row.optionStats.formats[def.key].score)})</> : ''}</td>)}
                                        <td className="border border-black px-[1px] py-[4px] text-center text-[9pt] text-black font-bold bg-gray-100 print-bg-gray leading-[1.15] align-middle">{row.hasOptions ? row.optionCount : ''}</td>
                                        <td className="border border-black px-[1px] py-[4px] text-center text-[9pt] text-black font-bold bg-gray-100 print-bg-gray leading-[1.15] align-middle">{row.hasOptions ? formatMark(row.optionScore) : ''}</td>
                                        <td className="border border-black px-[1px] py-[4px] bg-gray-100 print-bg-gray leading-[1.15] align-middle"></td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            {pageIdx === totalPages - 1 && (
                                <>
                                    <tr className="bg-gray-100 print-bg-gray font-black">
                                        <td colSpan={3} className="border border-black px-[6px] py-[6px] text-right uppercase tracking-widest text-[10pt] text-black">TOTAL ITEM</td>
                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{grandTotals.cp[def.key].count || ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{grandTotals.levels[def.key].count || ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{grandTotals.formats[def.key].count || ''}</td>)}
                                        <td className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{derivedTotalItems}</td>
                                        <td className="border border-black bg-black"></td>
                                        <td rowSpan={2} className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black align-middle">{totalExamMinutes}</td>
                                    </tr>
                                    <tr className="bg-gray-100 print-bg-gray font-black">
                                        <td colSpan={3} className="border border-black px-[6px] py-[6px] text-right uppercase tracking-widest text-[10pt] text-black">TOTAL SCORE</td>
                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{grandTotals.cp[def.key].score ? formatMark(grandTotals.cp[def.key].score) : ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{grandTotals.levels[def.key].score ? formatMark(grandTotals.levels[def.key].score) : ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{grandTotals.formats[def.key].score ? formatMark(grandTotals.formats[def.key].score) : ''}</td>)}
                                        <td className="border border-black bg-black"></td>
                                        <td className="border border-black px-[1px] py-[6px] text-center text-[10pt] text-black font-black">{formatMark(derivedTotalMarks)}</td>
                                    </tr>
                                </>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }) : null;
    };

    // --- Report 3 Content ---
    const renderReport3Content = () => {
        const itemsPerPage = 15;
        const totalPages = Math.ceil(orderedItems.length / itemsPerPage);
        const grandTotals = createStats();
        orderedItems.forEach(item => {
            addToStats(grandTotals, item.cognitiveProcess, item.knowledgeLevel, item.itemFormat, getItemTotalScore(item), getItemQuestionCount(item));
        });
        
        return orderedItems.length > 0 ? Array.from({ length: totalPages }).map((_, pageIdx) => {
            const startIdx = pageIdx * itemsPerPage;
            const endIdx = startIdx + itemsPerPage;
            const pageItems = orderedItems.slice(startIdx, endIdx);
            
            return (
                <div key={pageIdx} className="page landscape relative font-serif">
                    {renderDraftWatermark()}
                    <div className="page-content">
                        {pageIdx === 0 ? renderReportHeader() : (
                            <div className="mb-4 text-center border-b-2 border-black pb-2">
                                <h1 className="text-2xl font-bold text-black border-b border-black inline-block px-10 pb-1">Proforma for Analysing Question Paper</h1>
                                <div className="text-lg font-bold mt-1">Topic / Sub Topic wise Analysis (Continued)</div>
                            </div>
                        )}

                        <div className="text-center text-xl font-bold text-black mb-2 uppercase tracking-tight border-b border-black/50 pb-1 inline-block w-full">
                            Part – III : Item-wise Analysis
                        </div>

                        <table className="border-collapse border-2 border-black text-[8pt] leading-[1.05] table-fixed" style={{ width: '99%', margin: '0 auto 0 0' }}>
                            {renderAnalysisColGroup(true)}
                            {renderAnalysisTableHeader("Item / Q. No")}
                            <tbody>
                            {pageItems.flatMap((item, idx) => {
                                const unit = curriculum.units.find(u => u.id === item.unitId);
                                const subUnit = unit?.subUnits.find(s => s.id === item.subUnitId);
                                const rowScore = getItemTotalScore(item);
                                const questionCount = getItemQuestionCount(item);
                                const rows = [
                                    {
                                        key: `${item.id}-A`,
                                        qNo: `${startIdx + idx + 1}${item.hasInternalChoice ? ' (அ)' : ''}`,
                                        cognitiveProcess: normalizeCPValue(item.cognitiveProcess as string),
                                        knowledgeLevel: normalizeLevelValue(item.knowledgeLevel as string),
                                        itemFormat: normalizeFormatValue(item.itemFormat as string),
                                    }
                                ];
                                if (item.hasInternalChoice) {
                                    rows.push({
                                        key: `${item.id}-B`,
                                        qNo: `${startIdx + idx + 1} (ஆ)`,
                                        cognitiveProcess: normalizeCPValue((item.cognitiveProcessB || item.cognitiveProcess) as string),
                                        knowledgeLevel: normalizeLevelValue((item.knowledgeLevelB || item.knowledgeLevel) as string),
                                        itemFormat: normalizeFormatValue((item.itemFormatB || item.itemFormat) as string),
                                    });
                                }
                                return rows.map(row => (
                                    <tr key={row.key} className={row.key.endsWith('-B') ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="border border-black px-[2px] py-[2px] text-center text-[8pt] font-bold">{row.qNo}</td>
                                        <td className="border border-black px-[3px] py-[2px] text-[8pt] font-semibold">{renderMixedText(unit ? `${unit.unitNumber}. ${unit.name}` : '-')}</td>
                                        <td className="border border-black px-[3px] py-[2px] text-[7.5pt]">{renderMixedText(unit?.learningOutcomes || '-')}</td>
                                        <td className="border border-black px-[3px] py-[2px] text-[8pt]">{renderMixedText(subUnit?.name)}</td>
                                        {cpDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[8pt] text-black ${row.cognitiveProcess === def.value ? "font-bold" : ""}`}>{row.cognitiveProcess === def.value ? <>{questionCount}({formatMark(rowScore)})</> : ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[8pt] text-black ${row.knowledgeLevel === def.value ? "font-bold" : ""}`}>{row.knowledgeLevel === def.value ? <>{questionCount}({formatMark(rowScore)})</> : ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[8pt] text-black ${row.itemFormat === def.value ? "font-bold" : ""}`}>{row.itemFormat === def.value ? <>{questionCount}({formatMark(rowScore)})</> : ''}</td>)}
                                        <td className="border border-black px-[1px] py-[2px] text-center text-[8pt] font-bold text-black">{questionCount}</td>
                                        <td className="border border-black px-[1px] py-[2px] text-center text-[8pt] font-bold text-black">{formatMark(rowScore)}</td>
                                        <td className="border border-black px-[1px] py-[2px] text-center text-[8pt] font-bold text-black">{getDisplayTime(item)}</td>
                                    </tr>
                                ));
                            })}
                            {pageIdx === totalPages - 1 && (
                                <>
                                    <tr className="bg-gray-100 print-bg-gray font-black">
                                        <td colSpan={4} className="border border-black px-[6px] py-[6px] text-right uppercase tracking-widest text-[9pt] text-black">TOTAL ITEM</td>
                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{grandTotals.cp[def.key].count || ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{grandTotals.levels[def.key].count || ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{grandTotals.formats[def.key].count || ''}</td>)}
                                        <td className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{derivedTotalItems}</td>
                                        <td className="border border-black bg-black"></td>
                                        <td rowSpan={2} className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black align-middle">{totalExamMinutes}</td>
                                    </tr>
                                    <tr className="bg-gray-100 print-bg-gray font-black">
                                        <td colSpan={4} className="border border-black px-[6px] py-[6px] text-right uppercase tracking-widest text-[9pt] text-black">TOTAL SCORE</td>
                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{grandTotals.cp[def.key].score ? formatMark(grandTotals.cp[def.key].score) : ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{grandTotals.levels[def.key].score ? formatMark(grandTotals.levels[def.key].score) : ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{grandTotals.formats[def.key].score ? formatMark(grandTotals.formats[def.key].score) : ''}</td>)}
                                        <td className="border border-black bg-black"></td>
                                        <td className="border border-black px-[1px] py-[6px] text-center text-[9pt] text-black font-black">{formatMark(derivedTotalMarks)}</td>
                                    </tr>
                                </>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }) : null;
    };

    // --- Answer Key Header ---
    const renderAnswerKeyHeader = () => {
        const setLetter = (blueprint.setId || 'A').replace(/SET\s+/i, '').trim().charAt(0).toUpperCase();
        
        const getPaperCode = () => {
            const subject = blueprint.subject.includes('BT') ? 'BT' : 'AT';
            const codeMap: Record<string, string> = {
                '10-AT': 'GI1002', '10-BT': 'GI1012', '9-AT': 'GI902', '9-BT': 'GI912', '8-AT': 'GI802', '8-BT': 'GI812'
            };
            return codeMap[`${blueprint.classLevel}-${subject}`] || `GI${blueprint.classLevel}${subject === 'AT' ? '02' : '12'}`;
        };

        const getTermHeading = () => {
            const year = (blueprint.academicYear || '2026-27').replace(/^(\d{4})-(\d{2,4})$/, (_, start, end) => `${start}-${String(end).slice(-2)}`);
            switch (blueprint.examTerm) {
                case 'First Term Summative': return `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
                case 'Second Term Summative': return `இரண்டாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
                case 'Third Term Summative': return `இறுதிப் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
                default: return `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
            }
        };

        const paperCode = getPaperCode();
        const termHeading = getTermHeading();
        const subjectTitle = blueprint.subject.includes('AT') 
            ? { tamil: 'தமிழ் முதல் தாள்', eng: 'Tamil Language Paper I (AT)' }
            : { tamil: 'தமிழ் இரண்டாம் தாள்', eng: 'Tamil Language Paper II (BT)' };

        return (
            <div className="mb-4 border-b-2 border-black pb-1">
                <div className="relative flex items-center justify-center py-1">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                        <div className="border-2 border-black w-10 h-10 flex items-center justify-center font-bold text-[20px] leading-none">
                            {setLetter}
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-[20px] text-black font-bold uppercase tracking-tight leading-none" style={{ fontFamily: "'TAU-Paalai', serif" }}>
                            சமக்ர சிக்ஷா கேரளம்
                        </h1>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <div className="bg-black text-white px-5 py-1.5 rounded-full text-[13px] font-bold leading-none text-center min-w-[70px] border border-black shadow-sm">
                            {paperCode}
                        </div>
                    </div>
                </div>
                <div className="text-center mt-1">
                    <h2 className="text-[16px] font-bold text-black leading-tight">{termHeading}</h2>
                    <h2 className="text-[16px] font-bold text-black leading-snug">{subjectTitle.tamil}</h2>
                    <h3 className="text-[14px] font-bold text-black leading-snug">{subjectTitle.eng}</h3>
                </div>
                <div className="flex justify-between items-end text-black font-bold pt-2 text-[11pt]">
                    <div className="leading-tight">நேரம்: 90 நிமிடம்<br/>சிந்தனை நேரம் : 15 நிமிடம்</div>
                    <div className="text-right leading-tight">வகுப்பு: {blueprint.classLevel}<br/>மதிப்பெண்: {formatMark(blueprint.totalMarks)}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="print-root bg-gray-100 min-h-screen py-4 md:py-10">
            <style>{`
                @media print {
                    body, .print-root { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .page { 
                        box-shadow: none !important; 
                        margin: 0 !important; 
                        border: none !important; 
                        width: 100% !important;
                        min-height: auto !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    .print-bg-gray { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { 
                        margin: 15mm 15mm 20mm 15mm; 
                        size: A4 ${isLandscape ? 'landscape' : 'portrait'};
                    }
                    .no-print { display: none !important; }
                    
                    /* Global Table Behavior */
                    table {
                        width: 99% !important;
                        margin: 0 auto 0 0 !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto;
                        table-layout: fixed !important;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tfoot {
                        display: table-footer-group;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    th, td {
                        overflow: hidden;
                        word-wrap: break-word;
                    }
                }

                body { margin: 0; padding: 0; }

                .page {
                    background: white;
                    margin: 0 auto 10mm;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    padding: 10mm 10mm 20mm 10mm;
                    position: relative;
                    box-sizing: border-box;
                    overflow: hidden;
                    font-family: 'Times New Roman', serif;
                    color: black;
                }
                .page.portrait { width: 210mm; min-height: 297mm; }
                .page.landscape { width: 297mm; min-height: 210mm; }
                .draft-watermark {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    user-select: none;
                    z-index: 0;
                }
                .draft-watermark-text {
                    transform: rotate(-32deg);
                    font-family: 'Times New Roman', serif;
                    font-size: 92pt;
                    font-weight: 700;
                    letter-spacing: 0.32em;
                    color: rgba(185, 28, 28, 0.12);
                    text-transform: uppercase;
                    white-space: nowrap;
                }
                .page-content {
                    position: relative;
                    z-index: 1;
                }
                
                table { border-collapse: collapse; width: 99%; margin: 0 auto 0 0; table-layout: fixed; }
                th, td { border: 0.3mm solid black; word-break: break-word; vertical-align: middle; color: black !important; }
                th { background-color: #f3f4f6; font-weight: bold; }
                .tamil-font { font-family: 'TAU-Paalai', serif; }
                
                .answer-content img { max-width: 100%; height: auto; }
                .answer-content p { margin-bottom: 4px; }
                .answer-content ul { list-style-type: disc; padding-left: 15px; }

                /* Page Break Control */
                .page-break { page-break-before: always; }
                .avoid-break { page-break-inside: avoid; }
                .section { margin-bottom: 10mm; }
            `}</style>

            {/* Report 1 - Content Sections */}
            {currentTab === 'report1' && (
                <div className="report-container portrait bg-white mx-auto shadow-lg" style={{ width: '210mm', padding: '0mm' }}>
                    <div className="page portrait">
                        {showUserDraftWatermark && <div className="draft-watermark"><div className="draft-watermark-text">Draft</div></div>}
                        <div className="page-content">{renderReport1Page1Content()}</div>
                    </div>
                    <div className="page portrait page-break">
                        {showUserDraftWatermark && <div className="draft-watermark"><div className="draft-watermark-text">Draft</div></div>}
                        <div className="page-content">{renderReport1Page2Content()}</div>
                    </div>
                </div>
            )}

            {/* Report 2 - Landscape */}
            {currentTab === 'report2' && (
                <div className="report-container landscape bg-white mx-auto shadow-lg" style={{ width: '297mm', padding: '0mm' }}>
                    {renderReport2Content()}
                </div>
            )}

            {/* Report 3 - Landscape */}
            {currentTab === 'report3' && (
                <div className="report-container landscape bg-white mx-auto shadow-lg" style={{ width: '297mm', padding: '0mm' }}>
                    {renderReport3Content()}
                </div>
            )}

            {/* Answer Key - Portrait - Continuous Table */}
            {currentTab === 'answerkey' && (
                <div className="report-container portrait bg-white mx-auto shadow-lg" style={{ width: '210mm', padding: '0mm' }}>
                    <div className="page portrait">
                        {renderAnswerKeyHeader()}
                        <div className="text-center my-4">
                            <div className="border-t-2 border-b-2 border-black py-2 inline-block px-12">
                                <h1 className="text-[18px] font-bold text-black uppercase tracking-wider">Answer Key & Scoring Indicators</h1>
                            </div>
                        </div>
                        <table className="w-full border-collapse border border-black mt-2">
                            <thead>
                                <tr className="bg-gray-100 text-black">
                                    <th className="border border-black p-1.5 text-[10pt] font-bold w-16 text-center">Item /<br/>Qn No</th>
                                    <th className="border border-black p-1.5 text-[10pt] font-bold w-12 text-center">Score</th>
                                    <th className="border border-black p-1.5 text-[10pt] font-bold text-center">Answer / Value Points</th>
                                    <th className="border border-black p-1.5 text-[10pt] font-bold w-32 text-center">Further Info</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderedItems.map((item, idx) => {
                                    const qNo = idx + 1;
                                    const renderRow = (it: BlueprintItem, opt: string = '') => (
                                        <tr key={`${it.id}${opt}`} className="avoid-break">
                                            <td className="border border-black p-2 text-center font-bold text-[11pt]">{qNo}{opt}</td>
                                            <td className="border border-black p-2 text-center font-bold text-[11pt]">{formatMark(it.marksPerQuestion)}</td>
                                            <td className="border border-black p-2 text-left align-top">
                                                <div className="answer-content text-[11pt]" dangerouslySetInnerHTML={{ __html: opt === ' (ஆ)' ? (it.answerTextB || '') : (it.answerText || '') }} />
                                            </td>
                                            <td className="border border-black p-2 align-top text-[9pt] italic">
                                                {renderMixedText(opt === ' (ஆ)' ? it.furtherInfoB : it.furtherInfo)}
                                            </td>
                                        </tr>
                                    );

                                    if (!item.hasInternalChoice) return renderRow(item);
                                    return (
                                        <React.Fragment key={item.id}>
                                            {renderRow(item, ' (அ)')}
                                            {renderRow(item, ' (ஆ)')}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mass View - Portrait - Full Rich Text */}
            {currentTab === 'massview' && (
                <div className="report-container portrait bg-white mx-auto shadow-lg" style={{ width: '210mm', padding: '0mm' }}>
                    <div className="page portrait mass-view-print">
                        <div 
                            className="rich-content-area" 
                            style={{ 
                                fontFamily: "'Times New Roman', serif", 
                                fontSize: '12pt', 
                                lineHeight: '1.5' 
                            }}
                            dangerouslySetInnerHTML={{ __html: blueprint.massViewHeader || '' }} 
                        />
                    </div>
                    <style>{`
                        .mass-view-print {
                            padding: 20mm !important;
                        }
                        .mass-view-print h1, .mass-view-print h2, .mass-view-print h3 {
                            margin-top: 1em;
                            margin-bottom: 0.5em;
                        }
                        .mass-view-print p {
                            margin-bottom: 0.5em;
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default PrintView;
