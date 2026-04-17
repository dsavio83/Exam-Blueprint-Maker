import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileText, RefreshCw, WandSparkles, X } from 'lucide-react';
import { getBlueprints, getQuestionPaperTypes } from '../services/db';
import { Blueprint, BlueprintItem, QuestionPaperType } from '../types';
import { analyzeTamilSpellings, SpellIssue } from '../services/spellCheck';
import { exportMassViewDocx, exportMassViewIcml } from '../services/massViewExport';

const QUESTION_SEPARATOR = '============================================================';

const AdminQuestionConsolidator = () => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [selectedBlueprintId, setSelectedBlueprintId] = useState('');
    const [copied, setCopied] = useState(false);
    const [showQuestions, setShowQuestions] = useState(true);
    const [showAnswers, setShowAnswers] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSpellChecking, setIsSpellChecking] = useState(false);
    const [spellIssues, setSpellIssues] = useState<SpellIssue[]>([]);
    const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
    const [spellCheckError, setSpellCheckError] = useState('');
    const [workingText, setWorkingText] = useState('');

    const formatMarks = (marks: number) => marks === 0.5 ? '½' : `${marks}`;

    const formatAcademicYear = (year?: string) => {
        if (!year) return '2025-26';
        const match = year.match(/^(\d{4})-(\d{2,4})$/);
        if (!match) return year;
        return `${match[1]}-${match[2].slice(-2)}`;
    };

    const getQuestionPaperCode = (bp: Blueprint) => {
        const subject = bp.subject.includes('BT') ? 'BT' : 'AT';
        const codeMap: Record<string, string> = {
            '10-AT': 'T1002',
            '10-BT': 'T1012',
            '9-AT': 'T902',
            '9-BT': 'T912',
            '8-AT': 'T802',
            '8-BT': 'T812'
        };
        return codeMap[`${bp.classLevel}-${subject}`] || `T${bp.classLevel}${subject === 'AT' ? '02' : '12'}`;
    };

    const getAnswerPaperCode = (bp: Blueprint) => {
        const questionCode = getQuestionPaperCode(bp);
        return `GI${questionCode.replace(/^T/, '')}`;
    };

    const getTermHeading = (term: string, academicYear?: string) => {
        const year = formatAcademicYear(academicYear);
        if (term === 'First Term Summative') return `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
        if (term === 'Second Term Summative') return `இரண்டாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
        return `இறுதிப் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
    };

    const getPaperTitles = (subject: string) => {
        if (subject.includes('BT')) {
            return {
                tamil: 'தமிழ் இரண்டாம் தாள்',
                english: 'Tamil Language Paper II (BT)'
            };
        }
        return {
            tamil: 'தமிழ் முதல் தாள்',
            english: 'Tamil Language Paper I (AT)'
        };
    };

    const stripHtml = (html: string) => {
        if (!html) return '';
        const tmp = document.createElement('div');
        const processedHtml = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<li>/gi, '• ')
            .replace(/<tr\s*\/?>/gi, '\n')
            .replace(/<td\s*\/?>|<th\s*\/?>/gi, ' | ');

        tmp.innerHTML = processedHtml;
        let text = tmp.textContent || tmp.innerText || '';

        text = text.replace(/\(\(([அஆஇஈA-Da-d])\)+/g, '($1)');
        text = text.replace(/\(([அஆஇஈA-Da-d])\)\)+/g, '($1)');
        text = text.replace(/([அஆஇஈA-Da-d])\)\)+/g, '$1)');

        const lines = text
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => line.replace(/0\.5M/g, '½M').replace(/0\.5\b/g, '½'));

        const dedupedLines = lines.filter((line, index) => index === 0 || line !== lines[index - 1]);

        return dedupedLines.join('\n').trim();
    };

    const formatAnswerRowsAsText = (rows: string[][]) =>
        rows.map(row => row.map(cell => cell || '').join('\t')).join('\n');

    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const [bps, pts] = await Promise.all([
                getBlueprints('all'),
                getQuestionPaperTypes()
            ]);
            const sortedBlueprints = [...(bps || [])].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setBlueprints(sortedBlueprints);
            setPaperTypes(pts || []);
        } finally {
            setIsRefreshing(false);
        }
    };

    const buildQuestionHeader = (bp: Blueprint) => {
        const paperTitles = getPaperTitles(bp.subject);
        return [
            QUESTION_SEPARATOR,
            getQuestionPaperCode(bp),
            'சமக்ர சிக்ஷா கேரளம்',
            getTermHeading(bp.examTerm, bp.academicYear),
            paperTitles.tamil,
            paperTitles.english,
            '',
            `நேரம்: 90 நிமிடம்                   வகுப்பு: ${bp.classLevel}`,
            `சிந்தனை நேரம் : 15 நிமிடம்          மதிப்பெண்: ${bp.totalMarks}`,
            QUESTION_SEPARATOR,
            '',
            'குறிப்புகள் :',
            'முதல் 15 நிமிடம் சிந்தனை நேரமாகும்.',
            'வினாக்களை வாசித்து விடைகளை வரிசைப்படுத்த இந்த நேரத்தைப் பயன்படுத்தலாம்.',
            'வினாக்களையும் குறிப்புகளையும் நன்கு வாசித்துப் புரிந்து விடையளிக்கவும்.',
            'விடையளிக்கும்போது மதிப்பெண் , நேரம் போன்றவற்றை  கவனித்து செயல்படவும்.',
            ''
        ].join('\n');
    };

    const buildQuestionBody = (bp: Blueprint, paperType?: QuestionPaperType) => {
        const lines: string[] = [];
        let questionNumberOffset = 0;

        const sections = paperType?.sections || [];
        if (sections.length > 0) {
            sections.forEach((section) => {
                const sectionItems = bp.items.filter(item => item.sectionId === section.id);
                if (sectionItems.length === 0) return;

                if (section.instruction) {
                    lines.push(section.instruction, '');
                }

                sectionItems.forEach((item, itemIdx) => {
                    const qNo = questionNumberOffset + itemIdx + 1;
                    const qText = stripHtml(item.questionText || '');
                    if (!qText) return;

                    if (item.hasInternalChoice) {
                        lines.push(`${qNo}. Answer any one of the following:`);
                        lines.push(`   (a) ${qText.split('\n').join('\n       ')}`);
                        if (item.questionTextB) {
                            lines.push('               (or)');
                            lines.push(`   (b) ${stripHtml(item.questionTextB).split('\n').join('\n       ')}`);
                        }
                    } else {
                        lines.push(`${qNo}. ${qText.split('\n').join('\n    ')}`);
                    }
                    lines.push('');
                });

                questionNumberOffset += sectionItems.length;
            });

            return lines.join('\n').trim();
        }

        bp.items.forEach((item, itemIdx) => {
            const qNo = itemIdx + 1;
            const qText = stripHtml(item.questionText || '');
            if (!qText) return;

            if (item.hasInternalChoice) {
                lines.push(`${qNo}. Answer any one of the following:`);
                lines.push(`   (a) ${qText.split('\n').join('\n       ')}`);
                if (item.questionTextB) {
                    lines.push('               (or)');
                    lines.push(`   (b) ${stripHtml(item.questionTextB).split('\n').join('\n       ')}`);
                }
            } else {
                lines.push(`${qNo}. ${qText.split('\n').join('\n    ')}`);
            }
            lines.push('');
        });

        return lines.join('\n').trim();
    };

    const buildAnswerRows = (bp: Blueprint, paperType?: QuestionPaperType) => {
        const paperTitles = getPaperTitles(bp.subject);
        const rows: string[][] = [
            ['', '', '', getAnswerPaperCode(bp)],
            ['சமக்ர சிக்ஷா கேரளம்', '', '', ''],
            [getTermHeading(bp.examTerm, bp.academicYear), '', '', ''],
            [paperTitles.tamil, '', '', ''],
            [paperTitles.english, '', '', ''],
            ['நேரம்: 90 நிமிடம்                   ', '', '', `வகுப்பு: ${bp.classLevel}`],
            ['சிந்தனை நேரம் : 15 நிமிடம்          ', '', '', `மதிப்பெண்: ${bp.totalMarks}`],
            ['Proforma for scoring key & Marking Scheme', '', '', ''],
            ['Item /\nQn No', 'Score', 'Answer / Value Points', 'Further Information']
        ];

        const items: BlueprintItem[] = [];
        if (paperType?.sections?.length) {
            paperType.sections.forEach((section) => {
                items.push(...bp.items.filter(item => item.sectionId === section.id));
            });
        } else {
            items.push(...bp.items);
        }

        items.forEach((item, index) => {
            const qNo = `${index + 1}`;
            const answerA = stripHtml(item.answerText || '');
            const answerB = stripHtml(item.answerTextB || '');
            const score = formatMarks(item.marksPerQuestion);

            if (item.hasInternalChoice) {
                rows.push([`${qNo} (a)`, score, answerA, '']);
                rows.push([`${qNo} (b)`, score, answerB, '']);
            } else {
                rows.push([qNo, score, answerA, '']);
            }
        });

        return rows;
    };

    const buildAnswerPreviewText = (bp: Blueprint, paperType?: QuestionPaperType) =>
        formatAnswerRowsAsText(buildAnswerRows(bp, paperType));

    const formatQuestionPreview = (bp: Blueprint, paperType?: QuestionPaperType) => {
        const paperTitles = getPaperTitles(bp.subject);
        const sections = paperType?.sections || [];
        const sectionBlocks: Array<{ title?: string; items: Array<{ number: number; text: string; optionB?: string; hasChoice: boolean }> }> = [];
        let questionNumberOffset = 0;

        if (sections.length > 0) {
            sections.forEach((section) => {
                const sectionItems = bp.items.filter(item => item.sectionId === section.id);
                if (sectionItems.length === 0) return;
                sectionBlocks.push({
                    title: section.instruction,
                    items: sectionItems
                        .map((item, itemIdx) => {
                            const text = stripHtml(item.questionText || '');
                            if (!text) return null;
                            return {
                                number: questionNumberOffset + itemIdx + 1,
                                text,
                                optionB: item.questionTextB ? stripHtml(item.questionTextB) : '',
                                hasChoice: !!item.hasInternalChoice
                            };
                        })
                        .filter(Boolean) as Array<{ number: number; text: string; optionB?: string; hasChoice: boolean }>
                });
                questionNumberOffset += sectionItems.length;
            });
        } else {
            sectionBlocks.push({
                items: bp.items
                    .map((item, index) => {
                        const text = stripHtml(item.questionText || '');
                        if (!text) return null;
                        return {
                            number: index + 1,
                            text,
                            optionB: item.questionTextB ? stripHtml(item.questionTextB) : '',
                            hasChoice: !!item.hasInternalChoice
                        };
                    })
                    .filter(Boolean) as Array<{ number: number; text: string; optionB?: string; hasChoice: boolean }>
            });
        }

        return {
            code: getQuestionPaperCode(bp),
            termHeading: getTermHeading(bp.examTerm, bp.academicYear),
            paperTitles,
            classLevel: bp.classLevel,
            totalMarks: bp.totalMarks,
            sections: sectionBlocks
        };
    };

    const buildSpellCheckSource = (bp: Blueprint, paperType?: QuestionPaperType) => {
        const sections = paperType?.sections || [];
        const parts: string[] = [];

        if (showQuestions) {
            parts.push(buildQuestionHeader(bp), buildQuestionBody(bp, paperType));
        }

        if (showAnswers) {
            parts.push(
                getAnswerPaperCode(bp),
                'சமக்ர சிக்ஷா கேரளம்',
                getTermHeading(bp.examTerm, bp.academicYear),
                getPaperTitles(bp.subject).tamil,
                getPaperTitles(bp.subject).english
            );

            const orderedItems: BlueprintItem[] = [];
            if (sections.length > 0) {
                sections.forEach((section) => {
                    orderedItems.push(...bp.items.filter(item => item.sectionId === section.id));
                });
            } else {
                orderedItems.push(...bp.items);
            }

            orderedItems.forEach((item, index) => {
                const qNo = `${index + 1}`;
                if (item.hasInternalChoice) {
                    parts.push(`${qNo} (a) ${stripHtml(item.answerText || '')}`);
                    parts.push(`${qNo} (b) ${stripHtml(item.answerTextB || '')}`);
                } else {
                    parts.push(`${qNo} ${stripHtml(item.answerText || '')}`);
                }
            });
        }

        return parts.filter(Boolean).join('\n');
    };

    useEffect(() => {
        refreshData();
    }, []);

    useEffect(() => {
        const handleFocus = () => {
            refreshData();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const selectedBlueprint = useMemo(
        () => blueprints.find((bp: Blueprint) => bp.id === selectedBlueprintId),
        [blueprints, selectedBlueprintId]
    );

    const selectedPaperType = useMemo(
        () => paperTypes.find((type: QuestionPaperType) => type.id === selectedBlueprint?.questionPaperTypeId),
        [paperTypes, selectedBlueprint]
    );

    const questionPreview = useMemo(
        () => (selectedBlueprint && showQuestions ? formatQuestionPreview(selectedBlueprint, selectedPaperType) : null),
        [selectedBlueprint, selectedPaperType, showQuestions]
    );

    const answerPreviewRows = useMemo(
        () => (selectedBlueprint && showAnswers ? buildAnswerRows(selectedBlueprint, selectedPaperType) : []),
        [selectedBlueprint, selectedPaperType, showAnswers]
    );

    const spellCheckSource = useMemo(() => {
        if (!selectedBlueprint) return '';
        if (!showQuestions && !showAnswers) return '';
        return buildSpellCheckSource(selectedBlueprint, selectedPaperType);
    }, [selectedBlueprint, selectedPaperType, showQuestions, showAnswers]);

    useEffect(() => {
        if (!selectedBlueprint || (!showQuestions && !showAnswers)) {
            setWorkingText('');
            setSpellIssues([]);
            setActiveIssueId(null);
            setSpellCheckError('');
            return;
        }

        const parts: string[] = [];
        if (showQuestions) {
            const questionText = [buildQuestionHeader(selectedBlueprint), buildQuestionBody(selectedBlueprint, selectedPaperType)]
                .filter(Boolean)
                .join('\n');
            parts.push(questionText.trim());
        }
        if (showAnswers) {
            parts.push(buildAnswerPreviewText(selectedBlueprint, selectedPaperType));
        }

        setWorkingText(parts.join('\n\n').trim());
        setSpellIssues([]);
        setActiveIssueId(null);
        setSpellCheckError('');
    }, [selectedBlueprint, selectedPaperType, showQuestions, showAnswers]);

    const buildIssueMatches = (text: string) => {
        const ranges: Array<{ start: number, end: number, issue: SpellIssue }> = [];
        let searchStart = 0;

        spellIssues.forEach((issue: SpellIssue) => {
            const source = issue.source.trim();
            if (!source) return;
            const found = text.indexOf(source, searchStart);
            if (found >= 0) {
                ranges.push({ start: found, end: found + source.length, issue });
                searchStart = found + source.length;
            }
        });

        return ranges.sort((a, b) => a.start - b.start);
    };

    const highlightedRanges = buildIssueMatches(workingText);

    const handleSpellCheck = async () => {
        if (!spellCheckSource.trim()) return;
        setIsSpellChecking(true);
        setSpellCheckError('');
        try {
            const issues = await analyzeTamilSpellings(spellCheckSource);
            setSpellIssues(
                issues.filter((issue: SpellIssue) => workingText.includes(issue.source))
            );
            setActiveIssueId(null);
            if (issues.length === 0) {
                setSpellCheckError('No clear Tamil spelling or grammar issues found.');
            }
        } catch (error: any) {
            setSpellCheckError(error?.message || 'AI spell check failed');
        } finally {
            setIsSpellChecking(false);
        }
    };

    const replaceFirstOccurrence = (text: string, source: string, replacement: string) => {
        const index = text.indexOf(source);
        if (index < 0) return text;
        return `${text.slice(0, index)}${replacement}${text.slice(index + source.length)}`;
    };

    const handleApplySuggestion = (issue: SpellIssue) => {
        const updated = replaceFirstOccurrence(workingText, issue.source, issue.suggestion);
        setWorkingText(updated);
        setSpellIssues((prev: SpellIssue[]) => prev.filter((item: SpellIssue) => item.id !== issue.id));
        setActiveIssueId(null);
    };

    const renderHighlightedText = () => {
        if (highlightedRanges.length === 0) {
            return <span>{workingText}</span>;
        }

        const nodes: React.ReactNode[] = [];
        let cursor = 0;

        highlightedRanges.forEach((range) => {
            if (range.start > cursor) {
                nodes.push(<span key={`text-${cursor}`}>{workingText.slice(cursor, range.start)}</span>);
            }

            const issue = range.issue;
            const tone = issue.type === 'grammar'
                ? 'bg-green-100 text-green-800 ring-green-300'
                : issue.type === 'uncertain'
                    ? 'bg-white text-gray-900 font-bold ring-gray-400'
                    : 'bg-red-100 text-red-800 ring-red-300';

            nodes.push(
                <button
                    key={issue.id}
                    type="button"
                    onClick={() => setActiveIssueId(issue.id)}
                    className={`rounded px-1 py-0.5 ring-1 transition-all ${tone} ${activeIssueId === issue.id ? 'shadow-sm scale-[1.01]' : ''}`}
                    title={issue.explanation}
                >
                    {workingText.slice(range.start, range.end)}
                </button>
            );
            cursor = range.end;
        });

        if (cursor < workingText.length) {
            nodes.push(<span key="text-tail">{workingText.slice(cursor)}</span>);
        }

        return nodes;
    };

    const activeIssue = spellIssues.find(issue => issue.id === activeIssueId) || null;

    const handleCopy = async () => {
        if (!workingText) return;
        await navigator.clipboard.writeText(workingText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportDocx = async () => {
        if (!selectedBlueprint || (!showQuestions && !showAnswers)) return;
        const questionText = showQuestions
            ? [buildQuestionHeader(selectedBlueprint), buildQuestionBody(selectedBlueprint, selectedPaperType)].filter(Boolean).join('\n')
            : '';
        const answerRows = showAnswers ? buildAnswerRows(selectedBlueprint, selectedPaperType) : [];

        await exportMassViewDocx({
            blueprint: selectedBlueprint,
            questionText,
            answerRows,
            includeQuestions: showQuestions,
            includeAnswers: showAnswers
        });
    };

    const handleExportIcml = async () => {
        if (!selectedBlueprint || (!showQuestions && !showAnswers)) return;
        const questionText = showQuestions
            ? [buildQuestionHeader(selectedBlueprint), buildQuestionBody(selectedBlueprint, selectedPaperType)].filter(Boolean).join('\n')
            : '';
        const answerRows = showAnswers ? buildAnswerRows(selectedBlueprint, selectedPaperType) : [];

        await exportMassViewIcml({
            blueprint: selectedBlueprint,
            questionText,
            answerRows,
            includeQuestions: showQuestions,
            includeAnswers: showAnswers
        });
    };

    return (
        <div className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-[0_18px_60px_rgba(14,116,144,0.12)] flex flex-col h-full space-y-4">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.45),transparent_30%,transparent_70%,rgba(14,165,233,0.06))]" />
            <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg">
                            <FileText size={20} />
                        </span>
                        Mass View
                    </h2>
                    <p className="text-sm text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                        XML-backed Word and InDesign export with Gemini-based Tamil spell review.
                    </p>
                </div>
            </div>

            <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/80 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
                    <select
                        value={selectedBlueprintId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBlueprintId(e.target.value)}
                        className="min-w-[18rem] flex-1 px-4 py-2.5 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gradient-to-r from-white to-sky-50 text-sm font-medium text-slate-700 shadow-sm"
                    >
                        <option value="">Select Exam...</option>
                        {blueprints.map((bp: Blueprint) => (
                            <option key={bp.id} value={bp.id}>
                                Class {bp.classLevel} . {bp.subject} . {bp.setId || 'Set A'} . {bp.academicYear || '2025-2026'}
                            </option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-sky-50 to-cyan-50 px-4 py-2.5 rounded-2xl border border-sky-100 hover:from-sky-100 hover:to-cyan-100 transition-colors shadow-sm">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                            checked={showQuestions}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowQuestions(!!e.target.checked)}
                        />
                        <span className="text-sm font-semibold text-slate-700">Question</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 rounded-2xl border border-amber-100 hover:from-amber-100 hover:to-orange-100 transition-colors shadow-sm">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            checked={showAnswers}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowAnswers(!!e.target.checked)}
                        />
                        <span className="text-sm font-semibold text-slate-700">Answer</span>
                    </label>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 min-w-[280px]">
                    <button
                        onClick={refreshData}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${isRefreshing ? 'bg-slate-200 text-slate-500 border-slate-200' : 'bg-white text-slate-700 border-sky-100 hover:bg-sky-50 shadow-sm'}`}
                        title="Reload"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={handleSpellCheck}
                        disabled={!workingText || isSpellChecking}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all ${!workingText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white hover:from-fuchsia-700 hover:to-violet-700 shadow-lg shadow-fuchsia-200/60'}`}
                    >
                        <WandSparkles size={16} />
                        {isSpellChecking ? 'AI...' : 'Spell AI'}
                    </button>

                    <button
                        onClick={handleExportDocx}
                        disabled={!selectedBlueprint || (!showQuestions && !showAnswers)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all ${!selectedBlueprint || (!showQuestions && !showAnswers) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-sky-600 to-blue-700 text-white hover:from-sky-700 hover:to-blue-800 shadow-lg shadow-sky-200/70'}`}
                    >
                        <FileText size={16} />
                        Word
                    </button>

                    <button
                        onClick={handleExportIcml}
                        disabled={!selectedBlueprint || (!showQuestions && !showAnswers)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all ${!selectedBlueprint || (!showQuestions && !showAnswers) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200/70'}`}
                    >
                        <FileText size={16} />
                        InDesign
                    </button>

                    <button
                        onClick={handleCopy}
                        disabled={!workingText}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl font-bold transition-all ${!workingText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : copied ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-700 border border-sky-100 hover:bg-sky-50 shadow-sm'}`}
                        title="Copy"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>

            {!showQuestions && !showAnswers && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Both checkboxes are off, so the output is intentionally empty.
                </div>
            )}

            {spellCheckError && (
                <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${spellIssues.length === 0 && !isSpellChecking ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                    {spellCheckError}
                </div>
            )}

            <div className="flex-1 relative flex gap-4 min-h-0">
                <div className={`transition-all ${activeIssue ? 'w-[calc(100%-20rem)]' : 'w-full'}`}>
                    <div className="h-[600px] overflow-auto p-6 bg-[linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(240,249,255,0.85))] border border-sky-100 rounded-[24px] shadow-inner">
                        {workingText ? (
                            <div className="space-y-8">
                                {showQuestions && questionPreview && (
                                    <section className="rounded-[24px] border border-indigo-100 bg-white shadow-sm overflow-hidden">
                                        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 px-6 py-5 text-white">
                                            <div className="text-center font-bold tracking-wide">{questionPreview.code}</div>
                                            <div className="mt-2 text-center text-xl font-bold tamil-font">சமக்ர சிக்ஷா கேரളം</div>
                                            <div className="text-center font-semibold tamil-font">{questionPreview.termHeading}</div>
                                            <div className="mt-1 text-center font-bold tamil-font">{questionPreview.paperTitles.tamil}</div>
                                            <div className="text-center font-semibold">{questionPreview.paperTitles.english}</div>
                                            <div className="mt-4 flex justify-between gap-4 text-sm font-semibold">
                                                <div>
                                                    <div className="tamil-font">நேரம்: 90 நிமிடம்</div>
                                                    <div className="tamil-font">சிந்தனை நேரம் : 15 நிமிடம்</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="tamil-font">வகுப்பு: {questionPreview.classLevel}</div>
                                                    <div className="tamil-font">மதிப்பெண்: {questionPreview.totalMarks}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                                                <div className="font-bold text-amber-800 tamil-font mb-2">குறிப்புகள் :</div>
                                                <div className="space-y-1 text-sm text-amber-900 tamil-font">
                                                    <div>முதல் 15 நிமிடம் சிந்தனை நேரமாகும்.</div>
                                                    <div>வினாக்களை வாசித்து விடைகளை வரிசைப்படுத்த இந்த நேரத்தைப் பயன்படுத்தலாம்.</div>
                                                    <div>வினாக்களையும் குறிப்புகளையும் நன்கு வாசித்துப் புரிந்து விடையளிக்கவும்.</div>
                                                    <div>விடையளிக்கும்போது மதிப்பெண் , நேரம் போன்றவற்றை  கவனித்து செயல்படவும்.</div>
                                                </div>
                                            </div>

                                            {questionPreview.sections.map((section: { title?: string; items: Array<{ number: number; text: string; optionB?: string; hasChoice: boolean }> }, sectionIndex: number) => (
                                                <div key={`question-section-${sectionIndex}`} className="space-y-4">
                                                    {section.title && (
                                                        <div className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3 font-bold text-sky-900 tamil-font">
                                                            {section.title}
                                                        </div>
                                                    )}

                                                    <div className="space-y-4">
                                                        {section.items.map((item: { number: number; text: string; optionB?: string; hasChoice: boolean }) => (
                                                            <article key={`question-${item.number}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                                                {!item.hasChoice ? (
                                                                    <div className="space-y-2">
                                                                        <div className="font-bold text-slate-800">{item.number}.</div>
                                                                        <div className="whitespace-pre-wrap leading-7 text-slate-700 tamil-font">{item.text}</div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        <div className="font-bold text-slate-800">{item.number}. <span>Answer any one of the following</span></div>
                                                                        <div className="rounded-xl bg-white border border-blue-100 p-3">
                                                                            <div className="font-bold text-blue-700 mb-1">(a)</div>
                                                                            <div className="whitespace-pre-wrap leading-7 text-slate-700 tamil-font">{item.text}</div>
                                                                        </div>
                                                                        {item.optionB && (
                                                                            <>
                                                                                <div className="text-center font-bold text-violet-600">or</div>
                                                                                <div className="rounded-xl bg-white border border-violet-100 p-3">
                                                                                    <div className="font-bold text-violet-700 mb-1">(b)</div>
                                                                                    <div className="whitespace-pre-wrap leading-7 text-slate-700 tamil-font">{item.optionB}</div>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </article>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {showAnswers && answerPreviewRows.length > 0 && (
                                    <section className="rounded-[24px] border border-emerald-100 bg-white shadow-sm overflow-hidden">
                                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 px-6 py-5 text-white">
                                            <div className="text-center font-bold tracking-wide">{answerPreviewRows[0]?.[3]}</div>
                                            <div className="mt-2 text-center text-xl font-bold tamil-font">சமக்ர சிக்ஷா கேரளம்</div>
                                            <div className="text-center font-semibold tamil-font">{answerPreviewRows[2]?.[0]}</div>
                                            <div className="mt-1 text-center font-bold tamil-font">{answerPreviewRows[3]?.[0]}</div>
                                            <div className="text-center font-semibold">{answerPreviewRows[4]?.[0]}</div>
                                            <div className="mt-4 flex justify-between gap-4 text-sm font-semibold">
                                                <div>
                                                    <div className="tamil-font">நேரம்: 90 நிமிடம்</div>
                                                    <div className="tamil-font">சிந்தனை நேரம் : 15 நிமிடம்</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="tamil-font">{answerPreviewRows[5]?.[3]}</div>
                                                    <div className="tamil-font">{answerPreviewRows[6]?.[3]}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="mb-4 text-lg font-bold text-slate-800">{answerPreviewRows[7]?.[0]}</div>
                                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                                <table className="min-w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-sky-50">
                                                            {answerPreviewRows[8]?.map((cell: string, index: number) => (
                                                                <th key={`header-${index}`} className="border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 whitespace-pre-wrap">
                                                                    {cell}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {answerPreviewRows.slice(9).map((row: string[], rowIndex: number) => (
                                                            <tr key={`answer-row-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                                                {row.map((cell: string, cellIndex: number) => (
                                                                    <td key={`answer-cell-${rowIndex}-${cellIndex}`} className={`border border-slate-200 px-4 py-3 align-top text-sm ${cellIndex === 2 ? 'whitespace-pre-wrap tamil-font leading-7 text-slate-700' : 'font-medium text-slate-800'}`}>
                                                                        {cell || <span className="text-slate-300">-</span>}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                <div className="hidden">{renderHighlightedText()}</div>
                            </div>
                        ) : (
                            <span className="text-gray-400">
                                {selectedBlueprintId
                                    ? 'No content loaded. Select Question or Answer to populate the output.'
                                    : 'Questions or answers will appear here once an exam is selected.'}
                            </span>
                        )}
                    </div>
                </div>

                {activeIssue && (
                    <aside className="w-80 border border-fuchsia-100 rounded-[24px] bg-white shadow-[0_18px_40px_rgba(168,85,247,0.12)] p-4 flex-shrink-0">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Suggestion</div>
                                <h3 className="text-lg font-bold text-gray-900">Tamil AI Review</h3>
                            </div>
                            <button onClick={() => setActiveIssueId(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <div className="text-[11px] uppercase font-bold text-gray-400 mb-1">Detected</div>
                                <div className={`rounded-lg px-3 py-2 font-medium ${activeIssue.type === 'grammar' ? 'bg-green-50 text-green-800' : activeIssue.type === 'uncertain' ? 'bg-gray-100 text-gray-900 font-bold' : 'bg-red-50 text-red-800'}`}>
                                    {activeIssue.source}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] uppercase font-bold text-gray-400 mb-1">Suggestion</div>
                                <div className="rounded-lg px-3 py-2 bg-blue-50 text-blue-800 font-semibold">
                                    {activeIssue.suggestion}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] uppercase font-bold text-gray-400 mb-1">Type</div>
                                <div className="text-gray-700">{activeIssue.type}</div>
                            </div>
                            <div>
                                <div className="text-[11px] uppercase font-bold text-gray-400 mb-1">Confidence</div>
                                <div className="text-gray-700">{activeIssue.confidence}</div>
                            </div>
                            <div>
                                <div className="text-[11px] uppercase font-bold text-gray-400 mb-1">Reason</div>
                                <div className="text-gray-700">{activeIssue.explanation || 'Manual review recommended.'}</div>
                            </div>
                            <button
                                onClick={() => handleApplySuggestion(activeIssue)}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl px-4 py-2 font-bold hover:from-blue-700 hover:to-indigo-700 transition-colors"
                            >
                                Apply This Suggestion
                            </button>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default AdminQuestionConsolidator;
