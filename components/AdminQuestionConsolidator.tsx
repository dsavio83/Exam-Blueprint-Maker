
import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, ChevronDown, RefreshCw, WandSparkles, X } from 'lucide-react';
import { getBlueprints, getQuestionPaperTypes } from '../services/db';
import { Blueprint, QuestionPaperType } from '../types';
import { analyzeTamilSpellings, SpellIssue } from '../services/spellCheck';

const AdminQuestionConsolidator = () => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');
    const [consolidatedText, setConsolidatedText] = useState('');
    const [copied, setCopied] = useState(false);
    const [showAnswers, setShowAnswers] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSpellChecking, setIsSpellChecking] = useState(false);
    const [spellIssues, setSpellIssues] = useState<SpellIssue[]>([]);
    const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
    const [spellCheckError, setSpellCheckError] = useState('');
    const [workingText, setWorkingText] = useState('');

    const formatAcademicYear = (year?: string) => {
        if (!year) return '2025-26';
        const match = year.match(/^(\d{4})-(\d{2,4})$/);
        if (!match) return year;
        const end = match[2].slice(-2);
        return `${match[1]}-${end}`;
    };

    const getPaperCode = (bp: Blueprint) => {
        const subject = bp.subject.includes('BT') ? 'BT' : 'AT';
        const codeMap: Record<string, string> = {
            '10-AT': 'T1002',
            '10-BT': 'T1012',
            '9-AT': 'T902',
            '9-BT': 'T912',
            '8-AT': 'T802',
            '8-BT': 'T812'
        };
        return codeMap[`${bp.classLevel}-${subject}`] || `T${bp.classLevel}${subject === 'AT' ? '01' : '12'}`;
    };

    const getTermHeading = (term: string, academicYear?: string) => {
        const year = formatAcademicYear(academicYear);
        if (term === 'First Term Exam') return `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
        if (term === 'Second Term Exam') return `இரண்டாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
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

    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const [bps, pts] = await Promise.all([
                getBlueprints('all'),
                getQuestionPaperTypes()
            ]);
            setBlueprints(bps || []);
            setPaperTypes(pts || []);
        } finally {
            setIsRefreshing(false);
        }
    };

    const stripHtml = (html: string) => {
        if (!html) return "";
        const tmp = document.createElement("DIV");

        // 1. Pre-process HTML to preserve line breaks from block elements
        let processedHtml = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<tr\s*\/?>/gi, '\n')
            .replace(/<td\s*\/?>|<th\s*\/?>/gi, ' | ');

        tmp.innerHTML = processedHtml;

        // Handle lists specifically before getting textContent for better numbering
        const lists = tmp.querySelectorAll('ol, ul');
        lists.forEach(list => {
            const isOrdered = list.tagName.toLowerCase() === 'ol';
            const items = list.querySelectorAll('li');
            items.forEach((li, idx) => {
                const prefix = isOrdered ? `${idx + 1}. ` : '• ';
                li.prepend(document.createTextNode(prefix));
                li.append(document.createTextNode('\n'));
            });
        });

        let text = tmp.textContent || tmp.innerText || "";

        // 2. Handle options (அ, ஆ, இ, ஈ or A, B, C, D)
        // Ensure they start on a new line and use (X) format
        text = text.replace(/([^\n])\s*(\([அஆஇஈA-Da-d]\))/g, '$1\n$2'); // Existing (அ)
        text = text.replace(/([^\n])\s*([அஆஇஈA-Da-d]\))/g, '$1\n($2)'); // அ) -> (அ)
        text = text.replace(/^([அஆஇஈA-Da-d]\))/gm, '($1)'); // அ) at start -> (அ)
        text = text.replace(/\(\(([அஆஇஈA-Da-d])\)\)/g, '($1)'); // Cleanup double brackets

        // 4. Clean up formatting: remove excessive whitespace and leading/trailing newlines
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .join('\n')
            .trim();
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

    useEffect(() => {
        if (!selectedBlueprintId) {
            setConsolidatedText('');
            return;
        }

        const bp = blueprints.find(b => b.id === selectedBlueprintId);
        if (!bp) return;

        const paperType = paperTypes.find(p => p.id === bp.questionPaperTypeId);
        const paperCode = getPaperCode(bp);
        const paperTitles = getPaperTitles(bp.subject);
        let text = '';
        let answerKeyText = '';

        // HEADER BLOCK
        text += `============================================================\n`;
        text += `${paperCode}\n`;
        text += `சமக்ர சிக்ஷா கேரளம்\n`;
        text += `${getTermHeading(bp.examTerm, bp.academicYear)}\n`;
        text += `${paperTitles.tamil}\n`;
        text += `${paperTitles.english}\n\n`;
        text += `நேரம்: 90 நிமிடம்                   வகுப்பு: ${bp.classLevel}\n`;
        text += `சிந்தனை நேரம் : 15 நிமிடம்          மதிப்பெண்: ${bp.totalMarks}\n`;
        text += `============================================================\n\n`;
        text += `குறிப்புகள் :\n`;
        text += `முதல் 15 நிமிடம் சிந்தனை நேரமாகும்.\n`;
        text += `வினாக்களை வாசித்து விடைகளை வரிசைப்படுத்த இந்த நேரத்தைப் பயன்படுத்தலாம்.\n`;
        text += `வினாக்களையும் குறிப்புகளையும் நன்கு வாசித்துப் புரிந்து விடையளிக்கவும்.\n`;
        text += `விடையளிக்கும்போது மதிப்பெண் , நேரம் போன்றவற்றை  கவனித்து செயல்படவும்.\n\n`;
        text += `=============================================================\n\n`;

        answerKeyText += `============================================================\n`;
        answerKeyText += `ANSWER KEY: ${bp.subject}\n`;
        answerKeyText += `CLASS: ${bp.classLevel} | ${bp.examTerm}\n`;
        answerKeyText += `============================================================\n\n`;

        if (paperType) {
            let questionNumberOffset = 0;
            paperType.sections.forEach((section) => {
                const sectionItems = bp.items.filter(item => item.sectionId === section.id);

                if (sectionItems.length > 0) {
                    if (section.instruction) {
                        text += `${section.instruction}\n\n`;
                    }

                    sectionItems.forEach((item, itemIdx) => {
                        const qNo = questionNumberOffset + itemIdx + 1;
                        const qText = stripHtml(item.questionText || '');

                        if (qText) {
                            if (item.hasInternalChoice) {
                                // Header line: question number + note
                                text += `${qNo}. ஏதேனும் ஒன்றிற்கு விடையளிக்கவும்\n`;
                                // Option A
                                text += `   (அ) ${qText.split('\n').join('\n       ')}\n`;

                                // Option B
                                if (item.questionTextB) {
                                    text += `               (அல்லது)\n`;
                                    text += `   (ஆ) ${stripHtml(item.questionTextB).split('\n').join('\n       ')}\n`;
                                }

                                // Answers for Key
                                answerKeyText += `${qNo}. (அ) ${stripHtml(item.answerText || '---')}\n`;
                                if (item.answerTextB) {
                                    answerKeyText += `    (ஆ) ${stripHtml(item.answerTextB)}\n`;
                                }
                            } else {
                                text += `${qNo}. ${qText.split('\n').join('\n    ')}\n`;
                                answerKeyText += `${qNo}. ${stripHtml(item.answerText || '---')}\n`;
                            }
                            text += `\n`;
                        }
                    });
                    questionNumberOffset += sectionItems.length;
                    answerKeyText += `\n`;
                }
            });
        } else {
            // Fallback strategy if paperType is missing
            bp.items.forEach((item, itemIdx) => {
                const qNo = itemIdx + 1;
                const qText = stripHtml(item.questionText || '');
                
                if (qText) {
                    if (item.hasInternalChoice) {
                        text += `${qNo}. ஏதேனும் ஒன்றிற்கு விடையளிக்கவும்\n`;
                        text += `   (அ) ${qText.split('\n').join('\n       ')}\n`;
                        if (item.questionTextB) {
                            text += `               (அல்லது)\n`;
                            text += `   (ஆ) ${stripHtml(item.questionTextB).split('\n').join('\n       ')}\n`;
                        }
                        answerKeyText += `${qNo}. (அ) ${stripHtml(item.answerText || '---')}\n`;
                        if (item.answerTextB) {
                            answerKeyText += `    (ஆ) ${stripHtml(item.answerTextB)}\n`;
                        }
                    } else {
                        text += `${qNo}. ${qText.split('\n').join('\n    ')}\n`;
                        answerKeyText += `${qNo}. ${stripHtml(item.answerText || '---')}\n`;
                    }
                    text += `\n`;
                }
            });
        }

        if (showAnswers) {
            text += `\n\n`;
            text += answerKeyText;
        }

        setConsolidatedText(text);
        setWorkingText(text);
        setSpellIssues([]);
        setActiveIssueId(null);
        setSpellCheckError('');
    }, [selectedBlueprintId, blueprints, paperTypes, showAnswers]);

    const buildIssueMatches = (text: string) => {
        const ranges: Array<{ start: number, end: number, issue: SpellIssue }> = [];
        let searchStart = 0;

        spellIssues.forEach((issue) => {
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
        if (!workingText.trim()) return;
        setIsSpellChecking(true);
        setSpellCheckError('');
        try {
            const issues = await analyzeTamilSpellings(workingText);
            setSpellIssues(issues);
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
        setSpellIssues((prev) => prev.filter((item) => item.id !== issue.id));
        setActiveIssueId(null);
    };

    const handleApplyAllSuggestions = () => {
        let updated = workingText;
        spellIssues.forEach((issue) => {
            updated = replaceFirstOccurrence(updated, issue.source, issue.suggestion);
        });
        setWorkingText(updated);
        setSpellIssues([]);
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
            nodes.push(<span key={`text-tail`}>{workingText.slice(cursor)}</span>);
        }

        return nodes;
    };

    const activeIssue = spellIssues.find((issue) => issue.id === activeIssueId) || null;

    const handleCopy = () => {
        if (!workingText) return;
        navigator.clipboard.writeText(workingText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-blue-600" /> Mass View
                    </h2>
                    <p className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">Select a question paper to view and copy all questions.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[22rem]">
                        <select
                            value={selectedBlueprintId}
                            onChange={(e) => setSelectedBlueprintId(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
                        >
                            <option value="">Select Exam...</option>
                            {blueprints.map(bp => (
                                <option key={bp.id} value={bp.id}>
                                    Class {bp.classLevel} . {bp.subject} . {bp.setId || 'Set A'} . {bp.academicYear || '2025-2026'}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                            <ChevronDown size={16} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            checked={showAnswers}
                            onChange={(e) => setShowAnswers(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-gray-700">Include Answer Key</span>
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                        onClick={refreshData}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${isRefreshing ? 'bg-gray-200 text-gray-500' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        Reload
                    </button>

                    <button
                        onClick={handleSpellCheck}
                        disabled={!workingText || isSpellChecking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${!workingText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'}`}
                    >
                        <WandSparkles size={16} />
                        {isSpellChecking ? 'AI...' : 'AI'}
                    </button>

                    <button
                        onClick={handleApplyAllSuggestions}
                        disabled={spellIssues.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${spellIssues.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'}`}
                    >
                        <WandSparkles size={16} />
                        Auto
                    </button>

                    <button
                        onClick={handleCopy}
                        disabled={!workingText}
                        className={`flex items-center justify-center px-3 py-2 rounded-lg font-bold transition-all ${!workingText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                            copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform active:scale-95'
                            }`}
                        title="Copy"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>

            {spellCheckError && (
                <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${spellIssues.length === 0 && !isSpellChecking ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                    {spellCheckError}
                </div>
            )}

            <div className="flex-1 relative flex gap-4 min-h-0">
                <div className={`transition-all ${activeIssue ? 'w-[calc(100%-20rem)]' : 'w-full'}`}>
                    <div className="h-[600px] overflow-auto p-6 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm leading-relaxed whitespace-pre-wrap">
                        {workingText ? renderHighlightedText() : (
                            <span className="text-gray-400">Questions will appear here once an exam is selected...</span>
                        )}
                    </div>
                </div>

                {activeIssue && (
                    <aside className="w-80 border border-gray-200 rounded-xl bg-white shadow-sm p-4 flex-shrink-0">
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
                                className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-bold hover:bg-blue-700 transition-colors"
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
