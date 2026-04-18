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
    isAdmin?: boolean;
}

export const ReportsView = ({ blueprint, curriculum, discourses, paperType, onDownloadPDF, onDownloadWord, isAdmin = false }: ReportsViewProps) => {
    const [activeTab, setActiveTab] = useState('report1');
    const [customMinutes, setCustomMinutes] = useState<number | null>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [tempMinutes, setTempMinutes] = useState<string>("");

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

    const normalizeCPValue = (stored: string): string => {
        if (!stored) return '';
        const s = stored.toString().trim().toLowerCase();
        const clean = (str: string) => str.replace(/[^a-z0-9]/g, '');
        const sClean = clean(s);
        const byVal = cpDefinitions.find(def => clean(def.value.toLowerCase()) === sClean);
        if (byVal) return byVal.value;
        const byKey = cpDefinitions.find(def => clean(def.key.toLowerCase()) === sClean);
        if (byKey) return byKey.value;
        const byLabel = cpDefinitions.find(def => clean(def.label.toLowerCase()) === sClean);
        if (byLabel) return byLabel.value;
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

    const termTamil = blueprint.examTerm === ExamTerm.FIRST ? 'முதல்' : blueprint.examTerm === ExamTerm.SECOND ? 'இரண்டாம்' : 'மூன்றாம்';
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

    // ============================================================
    // PRINT HANDLER — Dynamically inject @page size before printing
    // ============================================================
    const handlePrint = () => {
        const isLandscape = activeTab === 'report2' || activeTab === 'report3';
        const existing = document.getElementById('qp-dynamic-print-page');
        if (existing) existing.remove();
        const style = document.createElement('style');
        style.id = 'qp-dynamic-print-page';
        style.textContent = `
            @media print {
                @page {
                    size: A4 ${isLandscape ? 'landscape' : 'portrait'};
                    margin: 10mm;
                }
            }
        `;
        document.head.appendChild(style);
        setTimeout(() => {
            window.print();
            setTimeout(() => { document.getElementById('qp-dynamic-print-page')?.remove(); }, 1500);
        }, 80);
    };

    // ============================================================
    // COLLECT ALL DOCUMENT STYLES (for PDF/Word export)
    // ============================================================
    const collectStyles = (): string => {
        const sheets: string[] = [];
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || []).map(r => r.cssText).join('\n');
                    sheets.push(rules);
                } catch { /* cross-origin, skip */ }
            });
        } catch { /* ignore */ }
        return sheets.join('\n');
    };

    // ============================================================
    // COMMON: Build reportable header string
    // ============================================================
    const pdfHeaderLeft = `Class: ${blueprint.classLevel}  |  ${subjectInfo.english}`;
    const pdfHeaderRight = `Set: ${setId}  |  Type: ${displayQpType}`;

    // ============================================================
    // PDF DOWNLOAD — Opens print dialog in a new window with header/footer
    // ============================================================
    const handleDownloadPDF = (tab: string) => {
        const isLandscape = tab === 'report2' || tab === 'report3';

        // Pick the capture element id
        let captureId = '';
        if (tab === 'report1') captureId = 'pdf-report1-pages';
        else if (tab === 'report2') captureId = 'pdf-report2-page';
        else if (tab === 'report3') captureId = 'pdf-report3-page';
        else captureId = 'pdf-report1-pages';

        const el = document.getElementById(captureId);
        const bodyHTML = el ? el.innerHTML : '<p>Content not found.</p>';
        const allStyles = collectStyles();

        const html = `<!DOCTYPE html>
<html lang="ta">
<head>
<meta charset="utf-8">
<title>QP Design - ${blueprint.classLevel} - ${academicYear}</title>
<style>
/* ===== Page Setup ===== */
@page {
    size: A4 ${isLandscape ? 'landscape' : 'portrait'};
    margin: 18mm 10mm 16mm 10mm;
}
*, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}
html, body {
    margin: 0; padding: 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 10pt;
    background: white;
    color: black;
}

/* ===== Fixed Header (repeats on every printed page) ===== */
.pdf-page-header {
    position: fixed;
    top: -14mm;
    left: 0; right: 0;
    height: 12mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2mm;
    font-size: 7.5pt;
    font-weight: bold;
    border-bottom: 1px solid #555;
    font-family: Arial, sans-serif;
}

/* ===== Fixed Footer (repeats on every printed page) ===== */
.pdf-page-footer {
    position: fixed;
    bottom: -12mm;
    left: 0; right: 0;
    height: 10mm;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 7.5pt;
    font-family: Arial, sans-serif;
    border-top: 1px solid #555;
    counter-increment: page;
}

.pdf-page-footer::after {
    content: counter(page);
}

/* ===== Content wrapper ===== */
.pdf-body-content {
    width: 100%;
}

/* ===== Preserve all original table styles ===== */
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid black; }
.tamil-font { font-family: 'TAU-Paalai', 'Latha', Arial Unicode MS, serif !important; }
.report-topic-cell, .report-lo-cell { font-family: 'TAU-Paalai', 'Latha', serif !important; font-size: 8px !important; line-height: 1.4 !important; }
.report-analysis-table { table-layout: fixed; width: 100% !important; border-collapse: collapse; }
.report-analysis-table th, .report-analysis-table td { word-break: break-word; vertical-align: middle; border: 1px solid black !important; }
.break-after-page { break-after: page; page-break-after: always; }
.bg-gray-50 { background-color: #f9fafb !important; }
.bg-gray-100 { background-color: #f3f4f6 !important; }
.bg-gray-200 { background-color: #e5e7eb !important; }
.bg-\\[\\#d9ead3\\] { background-color: #d9ead3 !important; }
.bg-\\[\\#fff2cc\\] { background-color: #fff2cc !important; }
.font-bold { font-weight: bold; }
.font-semibold { font-weight: 600; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.uppercase { text-transform: uppercase; }
.italic { font-style: italic; }
.no-print { display: none !important; }

/* App-collected styles */
${allStyles}

/* Override print media queries from app styles */
@media screen {
    .landscape-fit-capture { 
        width: ${isLandscape ? '277mm' : '190mm'} !important;
    }
}
</style>
</head>
<body>
<div class="pdf-page-header">
    <span>${pdfHeaderLeft}</span>
    <span>${pdfHeaderRight}</span>
</div>
<div class="pdf-page-footer"></div>
<div class="pdf-body-content">
${bodyHTML}
</div>
<script>
window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
};
window.onafterprint = function() {
    setTimeout(function() { window.close(); }, 300);
};
</script>
</body>
</html>`;

        const pw = window.open('', '_blank', 'width=1200,height=900,scrollbars=no');
        if (!pw) { alert('Please allow pop-ups to download PDF.'); return; }
        pw.document.open();
        pw.document.write(html);
        pw.document.close();
    };

    // ============================================================
    // WORD DOWNLOAD — Office HTML format (.doc)
    // ============================================================
    const handleDownloadWord = (tab: string) => {
        const isLandscape = tab === 'report2' || tab === 'report3';

        let captureId = '';
        if (tab === 'report1') captureId = 'pdf-report1-pages';
        else if (tab === 'report2') captureId = 'pdf-report2-page';
        else if (tab === 'report3') captureId = 'pdf-report3-page';
        else captureId = 'pdf-report1-pages';

        const el = document.getElementById(captureId);
        const bodyHTML = el ? el.innerHTML : '<p>Content not found.</p>';

        const pageWidth = isLandscape ? '29.7cm' : '21cm';
        const pageHeight = isLandscape ? '21cm' : '29.7cm';
        const marginStr = '1.0cm 1.0cm 1.0cm 1.0cm';

        const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>QP Design - ${blueprint.classLevel} - ${academicYear}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
<style>
/* Word page setup */
@page {
    size: ${pageWidth} ${pageHeight};
    margin: ${marginStr};
    mso-page-orientation: ${isLandscape ? 'landscape' : 'portrait'};
    mso-header-margin: 0.8cm;
    mso-footer-margin: 0.8cm;
    mso-header: h1;
    mso-footer: f1;
}
body {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 10pt;
    color: black;
    margin: 0;
    padding: 0;
}
table {
    border-collapse: collapse;
    width: 100%;
    mso-table-layout-alt: fixed;
}
th, td {
    border: 1pt solid black;
    padding: 2pt 4pt;
    font-size: 8pt;
    vertical-align: middle;
    word-wrap: break-word;
}
.tamil-font, .report-topic-cell, .report-lo-cell {
    font-family: "TAU-Paalai", "Latha", "Arial Unicode MS", serif;
    font-size: 8pt;
    line-height: 1.4;
}
.bg-gray-50 { background: #f9fafb; }
.bg-gray-100 { background: #f3f4f6; }
.bg-gray-200 { background: #e5e7eb; }
.bg-\\[\\#d9ead3\\] { background: #d9ead3; }
.bg-\\[\\#fff2cc\\] { background: #fff2cc; }
.font-bold { font-weight: bold; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.uppercase { text-transform: uppercase; }
.no-print { display: none !important; }
h1 { font-size: 14pt; font-weight: bold; text-align: center; }
h3 { font-size: 11pt; font-weight: bold; }

/* Word header/footer div style */
div.header-div {
    display: block;
    border-bottom: 1pt solid #555;
    padding-bottom: 2pt;
    margin-bottom: 4pt;
    font-size: 8pt;
    font-family: Arial, sans-serif;
}
div.footer-div {
    display: block;
    border-top: 1pt solid #555;
    padding-top: 2pt;
    text-align: center;
    font-size: 8pt;
    font-family: Arial, sans-serif;
}
</style>
</head>
<body>
<!--[if gte mso 9]>
<div style="mso-element:header" id="h1">
  <div class="header-div">
    <table style="width:100%;border:none;"><tr>
      <td style="border:none;text-align:left;font-size:8pt;font-weight:bold;">${pdfHeaderLeft}</td>
      <td style="border:none;text-align:right;font-size:8pt;font-weight:bold;">${pdfHeaderRight}</td>
    </tr></table>
  </div>
</div>
<div style="mso-element:footer" id="f1">
  <div class="footer-div">
    <p style="text-align:center;font-size:8pt;">- <span style="mso-field-code:PAGE"></span> -</p>
  </div>
</div>
<![endif]-->
${bodyHTML}
</body>
</html>`;

        const blob = new Blob(['\ufeff', wordHtml], {
            type: 'application/vnd.ms-word;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QP_Design_${tab}_${blueprint.classLevel}_${setId}_${academicYear}.doc`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
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

            return (
                <div className="bg-white mx-auto w-full flex flex-col font-serif text-black r1-page-inner">
                    <div className="flex justify-between items-start mb-4 relative">
                        <div className="flex-1 text-center">
                            <h1 className="text-2xl font-bold text-black border-b-2 border-black inline-block px-4 pb-0.5 uppercase tracking-tight">Question Paper Design - HS</h1>
                        </div>
                        <div className="absolute right-0 top-0 px-1.5 py-0.5 text-[10pt] font-bold bg-white whitespace-nowrap">
                            {blueprint.classLevel}-{subjectInfo.code === '02' ? 'AT' : 'BT'} | Set {setId} | Type: {displayQpType}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-[11pt] font-bold border-b border-black pb-3">
                        <div className="flex"><span className="w-24 text-gray-700">Class</span><span className="mx-2">:</span><span>{blueprint.classLevel}</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Time</span><span className="mx-2">:</span><span>{totalExamMinutes} Minutes</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Subject</span><span className="mx-2">:</span><span className="tamil-font leading-none !text-[11pt] !font-normal !not-italic">{subjectInfo.tamil}</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Score</span><span className="mx-2">:</span><span>{totalScore} Marks</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Term</span><span className="mx-2">:</span><span className="!font-normal !not-italic">{termEnglish}</span></div>
                        <div className="flex"><span className="w-24 text-gray-700">Year</span><span className="mx-2">:</span><span>{academicYear}</span></div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[12pt] font-bold text-black border-b border-black mb-1.5 pb-0.5">I. Weightage to Content Area</h3>
                        <table className="w-full border-collapse border border-black text-[10pt] leading-none">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black px-1 py-0 text-center font-bold w-[6%]">Sl. No</th>
                                    <th className="border border-black px-1.5 py-0 text-center font-bold w-[28%]">Learning Objective</th>
                                    <th className="border border-black px-1.5 py-0 text-center font-bold w-[22%]">Unit / Topic / Chapter</th>
                                    <th className="border border-black px-1.5 py-0 text-center font-bold w-[22%]">Sub-unit / Sub-topic</th>
                                    <th className="border border-black px-1 py-0 text-center font-bold w-[6%]">Score</th>
                                    <th className="border border-black px-1 py-0 text-center font-bold w-[7%]">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contentAreaStats.map((row, idx) => (
                                    <tr key={row.unit.id}>
                                        <td className="border border-black px-1 py-2 text-center align-middle">{idx + 1}</td>
                                        <td className="border border-black px-1.5 py-2 tamil-font !leading-[1] text-[9pt] text-left whitespace-pre-line">{row.unit.learningOutcomes || '-'}</td>
                                        <td className="border border-black px-1.5 py-2 tamil-font !leading-[1] text-left">{row.unit.name}</td>
                                        <td className="border border-black px-1.5 py-2 tamil-font italic !leading-[1] text-[9pt] text-left whitespace-pre-line">{row.unit.subUnits.map(s => s.name).join(', ')}</td>
                                        <td className="border border-black px-1 py-2 text-center font-bold align-middle">{row.score}</td>
                                        <td className="border border-black px-1 py-2 text-center align-middle">{Math.round((row.score / totalScore) * 100)}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-white font-bold">
                                    <td colSpan={4} className="border border-black px-1.5 py-1 text-center uppercase tracking-wider">Total</td>
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
                </div>
            );
        }

        if (page === 2) {
            const levelStats = levelDefinitions.map(def => {
                const score = blueprint.items.reduce((sum, item) =>
                    item.knowledgeLevel === def.value ? sum + getItemTotalScore(item) : sum, 0);
                return { ...def, score };
            });

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
                <div className="bg-white mx-auto w-full flex flex-col font-serif text-black r1-page-inner">
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
                </div>
            );
        }
        return null;
    };

    // ============================================================
    // QUESTION ROWS for Report 3
    // ============================================================
    const questionRows = report3Items.flatMap((item, index) => {
        const unit = curriculum.units.find(u => u.id === item.unitId);
        const subUnit = unit?.subUnits.find(s => s.id === item.subUnitId);
        const effectiveHasInternalChoice = !!item.hasInternalChoice;
        const normalizedCP = normalizeCPValue(item.cognitiveProcess as string) as CognitiveProcess;
        const normalizedCPB = normalizeCPValue((item.cognitiveProcessB || item.cognitiveProcess) as string) as CognitiveProcess;

        const baseRow = {
            id: `${item.id}-A`,
            qNo: `${index + 1}${effectiveHasInternalChoice ? ' (அ)' : ''}`,
            item, unit, subUnit,
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

    // ============================================================
    // REPORT 2 ROWS
    // ============================================================
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

    // ============================================================
    // SHARED: Report Header
    // ============================================================
    const renderReportHeader = (partLabel: string) => (
        <div className="mb-4 relative">
            <div className="flex justify-between items-start mb-4 relative">
                <div className="flex-1 text-center">
                    <h1 className="text-2xl font-bold text-black border-b-2 border-black inline-block px-4 pb-1">Proforma for Analysing Question Paper</h1>
                    <div className="text-lg font-bold mt-1">Topic/Sub Topic wise Analysis</div>
                </div>
                <div className="absolute right-0 top-0 px-2 py-1 text-sm font-bold bg-white whitespace-nowrap">
                    {blueprint.classLevel}-{subjectInfo.code === '02' ? 'AT' : 'BT'} | Set: {setId} | Type: {displayQpType}
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

    // ============================================================
    // SHARED: Analysis Table ColGroup & Header
    // ============================================================
    const renderAnalysisColGroup = (showFirst: boolean) => (
        <colgroup>
            {showFirst && <col style={{ width: '3.5%' }} />}
            <col style={{ width: showFirst ? '9.5%' : '10%' }} />
            <col style={{ width: showFirst ? '24%' : '25%' }} />
            <col style={{ width: showFirst ? '9.5%' : '10%' }} />
            {cpDefinitions.map(def => <col key={def.key} style={{ width: '2.5%' }} />)}
            {levelDefinitions.map(def => <col key={def.key} style={{ width: '2.5%' }} />)}
            {formatDefinitions.map(def => <col key={def.key} style={{ width: '2.5%' }} />)}
            <col style={{ width: '4%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: '4%' }} />
        </colgroup>
    );

    const renderAnalysisTableHeader = (firstColumnLabel: string) => {
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
                    <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px' }}>Total Score</th>
                    <th rowSpan={2} className="border border-black font-bold text-center align-middle" style={{ fontSize: '7.5px' }}>Time</th>
                </tr>
                <tr className="bg-[#fff2cc] text-[7.5px] leading-tight">
                    <th className="border border-black p-[2px] font-bold" style={{ fontSize: '7.5px' }}>Topic / Unit</th>
                    <th className="border border-black p-[2px] font-bold" style={{ fontSize: '7.5px' }}>Learning Objective</th>
                    <th className="border border-black p-[2px] font-bold" style={{ fontSize: '7.5px' }}>Sub Topic / Sub Unit</th>
                    {cpDefinitions.map(def => <th key={def.key} className="border border-black p-[1px] font-bold" title={def.label} style={{ fontSize: '9px' }}>{def.key}</th>)}
                    {levelDefinitions.map(def => <th key={def.key} className="border border-black p-[1px] font-bold" title={def.label} style={{ fontSize: '9px' }}>{def.key}</th>)}
                    {formatDefinitions.map(def => <th key={def.key} className="border border-black p-[1px] font-bold" title={def.label} style={{ fontSize: '9px' }}>{def.key}</th>)}
                </tr>
            </thead>
        );
    };

    // ============================================================
    // RENDER REPORT 2 (Landscape)
    // ============================================================
    const renderReport2Content = () => {
        const grandTotals = createStats();
        report2Rows.forEach(row => {
            Object.keys(grandTotals.cp).forEach(k => { grandTotals.cp[k].count += row.unitStats.cp[k].count; grandTotals.cp[k].score += row.unitStats.cp[k].score; });
            Object.keys(grandTotals.levels).forEach(k => { grandTotals.levels[k].count += row.unitStats.levels[k].count; grandTotals.levels[k].score += row.unitStats.levels[k].score; });
            Object.keys(grandTotals.formats).forEach(k => { grandTotals.formats[k].count += row.unitStats.formats[k].count; grandTotals.formats[k].score += row.unitStats.formats[k].score; });
        });
        const totalItemsInTable = Object.values(grandTotals.cp).reduce((s, cp) => s + cp.count, 0);
        const totalScoreInTable = Object.values(grandTotals.cp).reduce((s, cp) => s + cp.score, 0);

        return (
            <div className="text-black">
                {renderReportHeader('Part – II : Unit-wise Analysis')}
                <table className="w-full border-collapse border-2 border-black text-[8px] leading-[1.05] report-analysis-table">
                    {renderAnalysisColGroup(false)}
                    {renderAnalysisTableHeader('')}
                    <tbody>
                        {report2Rows.map((row) => (
                            <React.Fragment key={row.id}>
                                {row.subUnitsStats.map((su, suIdx) => (
                                    <tr key={su.subUnit.id} className="bg-white">
                                        {suIdx === 0 && (
                                            <>
                                                <td rowSpan={row.subUnitsStats.length} className="border border-black px-[2px] py-[1.5px] text-[9px] leading-[1] tamil-font report-topic-cell font-semibold align-top">{`${row.unit.unitNumber}. ${row.unit.name}`}</td>
                                                <td rowSpan={row.subUnitsStats.length} className="border border-black px-[2px] py-[1.5px] text-[9px] leading-[1] tamil-font report-lo-cell align-top">{row.unit.learningOutcomes || '-'}</td>
                                            </>
                                        )}
                                        <td className="border border-black px-[2px] py-[1.5px] text-[9px] leading-[1] tamil-font report-topic-cell">{su.subUnit.name}</td>
                                        {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px]">{su.stats.cp[def.key].count ? `${su.stats.cp[def.key].count}(${su.stats.cp[def.key].score})` : ''}</td>)}
                                        {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px]">{su.stats.levels[def.key].count ? `${su.stats.levels[def.key].count}(${su.stats.levels[def.key].score})` : ''}</td>)}
                                        {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px]">{su.stats.formats[def.key].count ? `${su.stats.formats[def.key].count}(${su.stats.formats[def.key].score})` : ''}</td>)}
                                        <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px]">{su.totalItems || ''}</td>
                                        <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px] font-bold">{su.totalScore || ''}</td>
                                        <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px]">{su.totalTime || ''}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100">
                                    <td colSpan={3} className="border border-black px-[2px] py-[1.5px] text-[9px] leading-[1] text-black font-normal">
                                        {row.hasOptions ? `Options / Choice Questions (${row.optionCount})` : 'Options / Choice Questions'}
                                    </td>
                                    {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px] text-gray-600 font-medium bg-gray-100">{row.optionStats.cp[def.key].count ? `${row.optionStats.cp[def.key].count}(${row.optionStats.cp[def.key].score})` : ''}</td>)}
                                    {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px] text-gray-600 font-medium bg-gray-100">{row.optionStats.levels[def.key].count ? `${row.optionStats.levels[def.key].count}(${row.optionStats.levels[def.key].score})` : ''}</td>)}
                                    {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[1.5px] text-center text-[9px] text-gray-600 font-medium bg-gray-100">{row.optionStats.formats[def.key].count ? `${row.optionStats.formats[def.key].count}(${row.optionStats.formats[def.key].score})` : ''}</td>)}
                                    <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px] text-gray-600 font-semibold bg-gray-100">{row.hasOptions ? row.optionCount : ''}</td>
                                    <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px] text-gray-600 font-bold bg-gray-100">{row.hasOptions ? row.optionScore : ''}</td>
                                    <td className="border border-black px-[1px] py-[1.5px] text-center text-[9px] text-gray-600 bg-gray-100"></td>
                                </tr>
                            </React.Fragment>
                        ))}
                        <tr className="bg-gray-200 font-bold">
                            <td colSpan={3} className="border border-black px-[3px] py-[4px] text-right uppercase text-[7.5px]">Total Item</td>
                            {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px]">{grandTotals.cp[def.key].count || ''}</td>)}
                            {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px]">{grandTotals.levels[def.key].count || ''}</td>)}
                            {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px]">{grandTotals.formats[def.key].count || ''}</td>)}
                            <td className="border border-black px-[1px] py-[4px] text-center text-[9px] font-bold">{totalItemsInTable}</td>
                            <td className="border border-black px-[1px] py-[4px] bg-black"></td>
                            <td className="border border-black px-[1px] py-[4px] text-center text-[9px] font-bold" rowSpan={2}>{orderedItems.reduce((s, i) => s + getDisplayTime(i), 0)}</td>
                        </tr>
                        <tr className="bg-gray-200 font-bold">
                            <td colSpan={3} className="border border-black px-[3px] py-[4px] text-right uppercase text-[7.5px]">Total Score</td>
                            {cpDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px]">{grandTotals.cp[def.key].score || ''}</td>)}
                            {levelDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px]">{grandTotals.levels[def.key].score || ''}</td>)}
                            {formatDefinitions.map(def => <td key={def.key} className="border border-black px-[1px] py-[4px] text-center text-[9px]">{grandTotals.formats[def.key].score || ''}</td>)}
                            <td className="border border-black px-[1px] py-[4px] bg-black"></td>
                            <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold">{totalScoreInTable}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    // ============================================================
    // RENDER REPORT 3 (Landscape)
    // ============================================================
    const renderReport3Content = () => {
        const totals = questionRows.filter(row => !row.id.endsWith('-B')).reduce((acc, row) => {
            const rowMarks = getItemTotalScore(row.item);
            const rowQuestionCount = getItemQuestionCount(row.item);
            addToStats(acc.stats, row.cognitiveProcess as CognitiveProcess, row.knowledgeLevel as KnowledgeLevel, row.itemFormat as ItemFormat, rowMarks, rowQuestionCount);
            return acc;
        }, { stats: createStats() });

        const tableTotalItems = Object.values(totals.stats.cp).reduce((s, cp) => s + cp.count, 0);
        const tableTotalMarks = Object.values(totals.stats.cp).reduce((s, cp) => s + cp.score, 0);

        return (
            <div className="text-black">
                {renderReportHeader('Part – III : Item-wise Analysis')}
                <table className="w-full border-collapse border-2 border-black text-[8px] leading-[1.05] report-analysis-table">
                    {renderAnalysisColGroup(true)}
                    {renderAnalysisTableHeader('Item / Q. No')}
                    <tbody>
                        {questionRows.map((row) => {
                            const isOptionRow = row.id.endsWith('-B');
                            const rowMarks = getItemTotalScore(row.item);
                            const rowQuestionCount = getItemQuestionCount(row.item);
                            return (
                                <tr key={row.id} className={isOptionRow ? "bg-gray-50/50" : "bg-white"}>
                                    <td className="border border-black px-[2px] py-[2px] text-center text-[7.5px] font-bold">{row.qNo}</td>
                                    <td className="border border-black px-[3px] py-[2px] text-[8px] leading-[1.05] tamil-font report-topic-cell font-semibold">{row.unit ? `${row.unit.unitNumber}. ${row.unit.name}` : '-'}</td>
                                    <td className="border border-black px-[3px] py-[2px] text-[7px] leading-[1.02] tamil-font report-lo-cell">{row.unit?.learningOutcomes || '-'}</td>
                                    <td className="border border-black px-[3px] py-[2px] text-[8px] leading-[1.05] tamil-font report-topic-cell">{row.subUnit?.name || '-'}</td>
                                    {cpDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[7px] ${row.cognitiveProcess === def.value ? "bg-gray-100 font-bold" : ""}`}>{row.cognitiveProcess === def.value ? `${rowQuestionCount} (${rowMarks})` : ''}</td>)}
                                    {levelDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[7px] ${row.knowledgeLevel === def.value ? "bg-gray-100 font-bold" : ""}`}>{row.knowledgeLevel === def.value ? `${rowQuestionCount} (${rowMarks})` : ''}</td>)}
                                    {formatDefinitions.map(def => <td key={def.key} className={`border border-black px-[1px] py-[2px] text-center text-[7px] ${row.itemFormat === def.value ? "bg-gray-100 font-bold" : ""}`}>{row.itemFormat === def.value ? `${rowQuestionCount} (${rowMarks})` : ''}</td>)}
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
                            <td className="border border-black px-[1px] py-[4px] text-center text-[7.5px] font-bold" rowSpan={2}>{orderedItems.reduce((s, i) => s + getDisplayTime(i), 0)}</td>
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
        );
    };

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
        <div className="mt-10 w-full text-black reports-container relative">

            {/* ─── Time Warning ─── */}
            {timeWarning && (
                <div className={`mb-4 p-3 font-bold no-print flex items-center justify-center gap-2 ${examMinutes > 90 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                    <span>⚠️</span>
                    <span>{timeWarning} ({examMinutes} Mins)</span>
                </div>
            )}

            {/* ─── Sticky Tab Bar ─── */}
            <div className="sticky top-[72px] z-30 bg-white py-4 mb-4 no-print border-b flex justify-center items-center gap-4 flex-wrap px-4">
                <div className="flex bg-gray-100 p-1 border border-black/20 overflow-x-auto scrollbar-hide">
                    {['report1', 'report2', 'report3'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === tab ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}>
                            {tab === 'report1' ? 'Report 1' : tab === 'report2' ? 'Report 2' : 'Report 3'}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <button onClick={() => handleDownloadPDF(activeTab)}
                                className="bg-white text-black border-2 border-black px-5 py-2 font-bold hover:bg-gray-100 flex items-center gap-2 transition-all text-sm md:text-base outline-none">
                                <Download size={18} /> PDF
                            </button>
                            <button onClick={() => handleDownloadWord(activeTab)}
                                className="bg-white text-black border-2 border-black px-5 py-2 font-bold hover:bg-gray-100 flex items-center gap-2 transition-all text-sm md:text-base outline-none">
                                <FileText size={18} /> Word
                            </button>
                        </>
                    )}
                    <button onClick={handlePrint}
                        className="bg-black text-white border-2 border-black px-5 py-2 font-bold hover:bg-gray-800 flex items-center gap-2 transition-all text-sm md:text-base outline-none">
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            {/* ─── Visible Report Content ─── */}
            <div className="reports-visible-content">

                {/* REPORT 1 — A4 Portrait */}
                {activeTab === 'report1' && (
                    <div className="report-1-screen-wrapper mx-auto">
                        {/* Page 1 */}
                        <div className="report-1-screen-page bg-white shadow mb-4 border border-gray-200 p-[12mm]">
                            {renderReport1Content(1)}
                        </div>
                        {/* Page 2 */}
                        <div className="report-1-screen-page bg-white shadow border border-gray-200 p-[12mm]">
                            {renderReport1Content(2)}
                        </div>
                    </div>
                )}

                {/* REPORT 2 — Landscape */}
                {activeTab === 'report2' && (
                    <div className="report-landscape-screen-wrapper bg-white shadow border border-gray-200 p-4 overflow-x-auto">
                        {renderReport2Content()}
                    </div>
                )}

                {/* REPORT 3 — Landscape */}
                {activeTab === 'report3' && (
                    <div className="report-landscape-screen-wrapper bg-white shadow border border-gray-200 p-4 overflow-x-auto">
                        {renderReport3Content()}
                    </div>
                )}
            </div>

            {/* ─── Hidden Print / PDF / Word Capture Sources ─── */}
            <div className="no-print" aria-hidden="true">
                {/* Report 1 capture — both pages */}
                <div id="pdf-report1-pages" style={{ position: 'absolute', left: '-99999px', top: 0, width: '190mm', background: 'white', pointerEvents: 'none' }}>
                    <div className="r1-capture-page" style={{ padding: '10mm 10mm 8mm', pageBreakAfter: 'always', breakAfter: 'page' }}>
                        {renderReport1Content(1)}
                    </div>
                    <div className="r1-capture-page" style={{ padding: '10mm 10mm 8mm' }}>
                        {renderReport1Content(2)}
                    </div>
                </div>

                {/* Report 2 capture */}
                <div id="pdf-report2-page" style={{ position: 'absolute', left: '-99999px', top: 0, width: '277mm', background: 'white', pointerEvents: 'none' }}>
                    <div style={{ padding: '8mm' }}>
                        {renderReport2Content()}
                    </div>
                </div>

                {/* Report 3 capture */}
                <div id="pdf-report3-page" style={{ position: 'absolute', left: '-99999px', top: 0, width: '277mm', background: 'white', pointerEvents: 'none' }}>
                    <div style={{ padding: '8mm' }}>
                        {renderReport3Content()}
                    </div>
                </div>
            </div>

            {/* ─── Styles ─── */}
            <style dangerouslySetInnerHTML={{
                __html: `
/* ======================================================
   SCREEN styles
====================================================== */
.report-1-screen-wrapper {
    width: 210mm;
    max-width: 100%;
}
.report-1-screen-page {
    width: 100%;
    min-height: 297mm;
}
.report-landscape-screen-wrapper {
    width: 100%;
    max-width: 297mm;
    margin: 0 auto;
    min-height: 210mm;
}

/* Tamil font */
.tamil-font,
.report-topic-cell,
.report-lo-cell {
    font-family: 'TAU-Paalai', 'Latha', Arial Unicode MS, serif !important;
}
.report-lo-cell  { font-size: 9px !important; line-height: 1.5 !important; }
.report-topic-cell { font-size: 9px !important; line-height: 1.5 !important; }

/* Analysis table */
.report-analysis-table {
    table-layout: fixed;
    width: 100% !important;
    border-collapse: collapse;
}
.report-analysis-table th,
.report-analysis-table td {
    word-break: break-word;
    vertical-align: middle;
    border: 1px solid black !important;
}

.break-after-page {
    break-after: page;
    page-break-after: always;
}

/* ======================================================
   PRINT styles
====================================================== */
@media print {
    /* ─── Basics ─── */
    *,
    *::before,
    *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
    }
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        overflow: visible !important;
    }

    /* ─── Hide all UI chrome ─── */
    .no-print,
    .sticky {
        display: none !important;
    }

    /* ─── Remove overflow/scroll from all elements ─── */
    * {
        overflow: visible !important;
        max-height: none !important;
    }

    /* ─── Report 1: Portrait ─── */
    .report-1-screen-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .report-1-screen-page {
        width: 100% !important;
        min-height: 0 !important;
        box-shadow: none !important;
        border: none !important;
        padding: 8mm 8mm 6mm !important;
        margin: 0 !important;
        break-after: page;
        page-break-after: always;
    }
    .report-1-screen-page:last-child {
        break-after: avoid !important;
        page-break-after: avoid !important;
    }
    .r1-page-inner {
        width: 100% !important;
        min-height: 0 !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
    }

    /* ─── Reports 2 & 3: Landscape ─── */
    .report-landscape-screen-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 4mm !important;
        box-shadow: none !important;
        border: none !important;
        min-height: 0 !important;
        overflow: visible !important;
    }

    /* ─── Analysis table in print ─── */
    .report-analysis-table {
        font-size: 7px !important;
        width: 100% !important;
        table-layout: fixed !important;
    }
    .report-analysis-table th,
    .report-analysis-table td {
        padding: 0.5mm 0.8mm !important;
        line-height: 1.1 !important;
        font-size: 7px !important;
        border-width: 0.5pt !important;
    }

    /* ─── Hide hidden capture divs in print ─── */
    #pdf-report1-pages,
    #pdf-report2-page,
    #pdf-report3-page {
        display: none !important;
    }

    /* ─── Prevent table row from splitting across pages ─── */
    tr { break-inside: avoid; page-break-inside: avoid; }
}
`}} />
        </div>
    );
};