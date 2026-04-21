import React, { useEffect, useMemo, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { Check, Copy, FileText, RefreshCw, WandSparkles, X, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { getBlueprints, getQuestionPaperTypes, saveBlueprint } from '../services/db';
import { Blueprint, BlueprintItem, QuestionPaperType } from '../types';
import { analyzeTamilSpellings, SpellIssue } from '../services/spellCheck';
import { exportMassViewDocx, exportMassViewIcml } from '../services/massViewExport';

const QUESTION_SEPARATOR = '============================================================';

const AdminQuestionConsolidator = () => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [selectedBlueprintId, setSelectedBlueprintId] = useState('');
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSpellChecking, setIsSpellChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [spellIssues, setSpellIssues] = useState<SpellIssue[]>([]);
    const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
    const [spellCheckError, setSpellCheckError] = useState('');
    const [workingText, setWorkingText] = useState('');
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const getQuestionPaperCode = (bp: Blueprint) => {
        return bp.subject.includes('BT') ? 'T1012' : 'T1002';
    };

    const getTermHeading = (term: string, academicYear?: string) => {
        const year = academicYear || '2026-27';
        if (term === 'First Term Summative') return `முதல் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
        if (term === 'Second Term Summative') return `இரண்டாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
        if (term === 'Third Term Summative') return `மூன்றாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
        return `தொகுத்தறி மதிப்பீடு ${year}`;
    };

    const getPaperTitles = (subject: string) => {
        if (subject.includes('BT')) {
            return { tamil: 'தமிழ் இரண்டாம் தாள்', english: 'Tamil Language Paper II (BT)' };
        }
        return { tamil: 'தமிழ் முதல் தாள்', english: 'Tamil Language Paper I (AT)' };
    };

    const stripHtml = (html: string) => {
        if (!html) return '';
        // Special handling for structured points
        if (html.includes('rubric-list')) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const items = tmp.querySelectorAll('li');
            const points: string[] = [];
            items.forEach(li => {
                const pointText = li.querySelector('.rubric-point')?.textContent || li.textContent || '';
                points.push(`- ${pointText.trim()}`);
            });
            return points.join('\n');
        }
        const tmp = document.createElement('div');
        tmp.innerHTML = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n');
        return (tmp.textContent || tmp.innerText || '').trim();
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const [bps, pts] = await Promise.all([getBlueprints('all'), getQuestionPaperTypes()]);
            // Show all confirmed blueprints or admin assigned
            setBlueprints((bps || []).filter(bp => bp.isConfirmed || bp.isAdminAssigned));
            setPaperTypes(pts || []);
        } finally {
            setIsRefreshing(false);
        }
    };

    const buildQuestionHeader = (bp: Blueprint) => {
        const paperTitles = getPaperTitles(bp.subject);
        const code = getQuestionPaperCode(bp);
        const setLabel = bp.setId || 'SET A';
        
        return [
            `[ ${setLabel} ]                                சமக்ர சிக்ஷா கேரளம்                                [ ${code} ]`,
            `                      ${getTermHeading(bp.examTerm, bp.academicYear)}`,
            `                                     ${paperTitles.tamil}`,
            `                                ${paperTitles.english}`,
            `நேரம்: 90 நிமிடம்                                                  வகுப்பு: ${bp.classLevel}`,
            `சிந்தனை நேரம் : 15 நிமிடம்                                         மதிப்பெண்: ${bp.totalMarks}`,
            '',
            'குறிப்புகள்:',
            '- முதல் 15 நிமிடம் சிந்தனை நேரமாகும்.',
            '- வினாக்களை வாசித்து விடைகளை வரிசைப்படுத்த இந்த நேரத்தைப் பயன்படுத்தலாம்.',
            '- வினாக்களையும் குறிப்புகளையும் நன்கு வாசித்துப் புரிந்து விடையளிக்கவும்.',
            '- விடையளிக்கும்போது மதிப்பெண், நேரம் போன்றவற்றை கவனித்து செயல்படவும்.',
            '',
            QUESTION_SEPARATOR,
            ''
        ].join('\n');
    };

    const toRoman = (num: number) => {
        const romanMap: [string, number][] = [['V', 5], ['IV', 4], ['I', 1]];
        let roman = '';
        let n = num;
        for (const [r, v] of romanMap) {
            while (n >= v) { roman += r; n -= v; }
        }
        return roman;
    };

    const buildQuestionBody = (bp: Blueprint, paperType?: QuestionPaperType) => {
        if (!paperType || !paperType.sections) {
            const lines: string[] = [];
            bp.items.forEach((item, idx) => {
                const qNo = idx + 1;
                lines.push(`${qNo}. ${stripHtml(item.questionText || '')}`);
                if (item.enableFurtherInfo && item.furtherInfo) {
                    lines.push(`   (குறிப்பு: ${stripHtml(item.furtherInfo)})`);
                }
                if (item.hasInternalChoice && item.questionTextB) {
                    lines.push(`   (அல்லது)`);
                    lines.push(`${qNo}. ${stripHtml(item.questionTextB)}`);
                    if (item.enableFurtherInfoB && item.furtherInfoB) {
                        lines.push(`   (குறிப்பு: ${stripHtml(item.furtherInfoB)})`);
                    }
                }
                lines.push('');
            });
            return lines.join('\n');
        }

        const lines: string[] = [];
        let currentQNo = 1;

        paperType.sections.forEach((section, sIdx) => {
            const sectionItems = bp.items.filter(item => item.sectionId === section.id);
            if (sectionItems.length === 0) return;

            const startQ = currentQNo;
            const endQ = currentQNo + sectionItems.length - 1;
            const count = sectionItems.length;
            const marks = section.marks;
            const total = count * marks;

            const romanPrefix = toRoman(sIdx + 1);
            const rangeText = count > 1 ? `${startQ} முதல் ${endQ} வரையுள்ள` : `${startQ}`;
            const instruction = section.instruction || 'விடையளிக்க';
            const marksInfo = `(${marks} மதிப்பெண் வீதம்) \t(${count} x ${marks} = ${total})`;

            // Check if instruction already contains the roman numeral or range to avoid duplication
            let header = '';
            const hasRoman = instruction.includes(`${romanPrefix}.`);
            const hasRange = instruction.includes(rangeText);
            const hasMarks = instruction.includes(`${marks} மதிப்பெண் வீதம்`);

            if (hasRoman && hasRange) {
                header = instruction;
                // If marks are missing but instruction exists, we might still want to add them
                if (!hasMarks) header += ` ${marksInfo}`;
            } else if (hasRoman) {
                header = `${romanPrefix}. ${rangeText} அனைத்து வினாக்களுக்கும் ${instruction}`;
                if (!hasMarks) header += `. ${marksInfo}`;
            } else {
                header = `${romanPrefix}. ${rangeText} அனைத்து வினாக்களுக்கும் ${instruction}.`;
                if (!hasMarks) header += ` ${marksInfo}`;
            }
            
            lines.push(header);
            lines.push('');

            sectionItems.forEach((item, iIdx) => {
                const qNo = currentQNo + iIdx;
                const text = stripHtml(item.questionText || '');
                
                if (item.hasInternalChoice) {
                    lines.push(`${qNo}. ஏதேனும் ஒன்றிற்கு விடையளிக்கவும்.`);
                    lines.push(`அ) ${text}`);
                    if (item.enableFurtherInfo && item.furtherInfo) {
                        lines.push(`   (குறிப்பு: ${stripHtml(item.furtherInfo)})`);
                    }
                    lines.push(`    (அல்லது)`);
                    lines.push(`ஆ) ${stripHtml(item.questionTextB || '')}`);
                    if (item.enableFurtherInfoB && item.furtherInfoB) {
                        lines.push(`   (குறிப்பு: ${stripHtml(item.furtherInfoB)})`);
                    }
                } else {
                    lines.push(`${qNo}. ${text}`);
                    if (item.enableFurtherInfo && item.furtherInfo) {
                        lines.push(`   (குறிப்பு: ${stripHtml(item.furtherInfo)})`);
                    }
                }
                lines.push('');
            });

            currentQNo += count;
        });

        return lines.join('\n');
    };

    useEffect(() => { refreshData(); }, []);

    const selectedBlueprint = useMemo(() => blueprints.find(bp => bp.id === selectedBlueprintId), [blueprints, selectedBlueprintId]);
    const selectedPaperType = useMemo(() => paperTypes.find(t => t.id === selectedBlueprint?.questionPaperTypeId), [paperTypes, selectedBlueprint]);

    useEffect(() => {
        if (selectedBlueprint) {
            if (selectedBlueprint.massViewHeader) {
                setWorkingText(selectedBlueprint.massViewHeader);
            } else {
                const header = buildQuestionHeader(selectedBlueprint);
                const body = buildQuestionBody(selectedBlueprint, selectedPaperType);
                setWorkingText(header + body);
            }
            setSpellIssues([]);
        }
    }, [selectedBlueprint, selectedPaperType]);

    const handleSpellCheck = async () => {
        if (!workingText.trim()) return;
        setIsSpellChecking(true);
        setSpellCheckError('');
        try {
            const issues = await analyzeTamilSpellings(workingText);
            setSpellIssues(issues);
            if (issues.length === 0) {
                setSpellCheckError('No errors found! (பிழைகள் ஏதுமில்லை)');
                setTimeout(() => setSpellCheckError(''), 3000);
            }
        } catch (error: any) {
            console.error("AI Spell Check Error:", error);
            setSpellCheckError(`AI Error: ${error.message}`);
        } finally {
            setIsSpellChecking(false);
        }
    };

    const handleApplySuggestion = (issue: SpellIssue) => {
        const newText = workingText.replace(issue.source, issue.suggestion);
        setWorkingText(newText);
        setSpellIssues(prev => prev.filter(i => i.id !== issue.id));
        setActiveIssueId(null);
    };

    const handleSave = async () => {
        if (!selectedBlueprint) return;
        setIsSaving(true);
        try {
            const updated = { ...selectedBlueprint, massViewHeader: workingText };
            await saveBlueprint(updated);
            Swal.fire("Saved", "Changes saved to database!", "success");
        } catch (e) {
            Swal.fire("Error", "Save failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(workingText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportDocx = async () => {
        if (!selectedBlueprint) return;
        await exportMassViewDocx({
            blueprint: selectedBlueprint,
            questionText: workingText,
            includeQuestions: true,
            includeAnswers: false
        });
    };

    const renderMixedTextInternal = (text: string) => {
        if (!text) return null;
        
        const heading = "சமக்ர சிக்ஷா கேரளம்";
        const parts = text.split(new RegExp(`(${heading})`, 'g'));

        return parts.flatMap((part, i) => {
            if (part === heading) {
                return (
                    <span 
                        key={`heading-${i}`} 
                        className="tamil-heading-font"
                        style={{ 
                            fontFamily: "'TAU-Urai', serif",
                            fontWeight: 'bold',
                            fontSize: '18px',
                            color: '#1e293b'
                        }}
                    >
                        {part}
                    </span>
                );
            }

            const segments = part.split(/([அ-ஹ\u0B80-\u0BFF]+)/);
            return segments.map((seg, j) => {
                if (!seg) return null;
                const isTamil = /[அ-ஹ\u0B80-\u0BFF]/.test(seg);
                return (
                    <span 
                        key={`${i}-${j}`} 
                        className={isTamil ? "tamil-font" : "english-font"}
                        style={{ 
                            fontFamily: isTamil ? "'TAU-Paalai', serif" : "'Times New Roman', serif"
                        }}
                    >
                        {seg}
                    </span>
                );
            });
        });
    };

    const renderHighlights = () => {
        if (!workingText) return null;
        let elements: React.ReactNode[] = [];
        let lastIndex = 0;
        
        // Better issue sorting to avoid offset issues
        const sortedIssues = [...spellIssues]
            .map(issue => ({ ...issue, index: workingText.indexOf(issue.source) }))
            .filter(issue => issue.index !== -1)
            .sort((a, b) => a.index - b.index);

        sortedIssues.forEach((issue, i) => {
            const index = workingText.indexOf(issue.source, lastIndex);
            if (index === -1) return;
            
            elements.push(renderMixedTextInternal(workingText.substring(lastIndex, index)));
            
            const color = issue.type === 'grammar' ? 'bg-green-100 border-b-2 border-green-500' : 'bg-red-100 border-b-2 border-red-500';
            
            elements.push(
                <span 
                    key={`${issue.id}-${i}`} 
                    className={`${color} cursor-pointer hover:opacity-80 transition-all px-0.5 rounded-sm`}
                    onClick={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setPopoverPos({ top: rect.bottom + window.scrollY, left: rect.left });
                        setActiveIssueId(issue.id);
                    }}
                >
                    {renderMixedTextInternal(issue.source)}
                </span>
            );
            lastIndex = index + issue.source.length;
        });
        
        elements.push(renderMixedTextInternal(workingText.substring(lastIndex)));
        
        return (
            <div 
                ref={highlightRef}
                className="absolute inset-0 z-0 p-8 text-base leading-relaxed whitespace-pre-wrap break-words overflow-auto pointer-events-none"
                style={{ backgroundColor: 'white' }}
            >
                <div style={{ color: '#334155' }}>{elements}</div>
            </div>
        );
    };

    const activeIssue = spellIssues.find(i => i.id === activeIssueId);

    return (
        <div className="relative border-sky-100 bg-white p-4 flex flex-col h-full space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-2">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg">
                        <FileText size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Mass View</h2>
                    <select
                        value={selectedBlueprintId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBlueprintId(e.target.value)}
                        className="min-w-[20rem] px-4 py-2 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50 text-sm font-medium text-slate-700"
                    >
                        <option value="">Select Exam to Load...</option>
                        {blueprints.map(bp => (
                            <option key={bp.id} value={bp.id}>
                                Class {bp.classLevel} . {bp.subject} . {bp.setId || 'Set A'} . {bp.academicYear || '2026-27'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={isSaving || !selectedBlueprint} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50">
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                        onClick={handleSpellCheck} 
                        disabled={isSpellChecking || !workingText} 
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${isSpellChecking ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        {isSpellChecking ? <Loader2 className="animate-spin" size={16} /> : <WandSparkles size={16} />}
                        {isSpellChecking ? 'Checking Tamil...' : 'AI Spell Check'}
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!workingText}
                        className={`inline-flex h-10 px-4 items-center justify-center rounded-xl font-bold transition-all ${copied ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'} text-sm`}
                    >
                        {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                        {copied ? 'Copied' : 'Copy Text'}
                    </button>
                    <button
                        onClick={handleExportDocx}
                        disabled={!selectedBlueprint}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        <FileText size={16} /> Word
                    </button>
                </div>
            </div>

            <div className="flex-1 relative flex flex-col min-h-0 bg-slate-50/50 rounded-xl overflow-hidden border border-sky-50 shadow-inner">
                {!selectedBlueprintId ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-sky-100 rounded-3xl bg-sky-50/30 m-8">
                        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                            <WandSparkles size={40} className="text-sky-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Select an exam to view</h3>
                        <p className="text-slate-500 text-sm mt-1">Full question paper will be loaded into the editor below.</p>
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        {renderHighlights()}
                        <textarea
                            ref={textareaRef}
                            value={workingText}
                            onChange={(e) => setWorkingText(e.target.value)}
                            onScroll={handleScroll}
                            className="absolute inset-0 z-10 w-full h-full p-8 text-base bg-transparent caret-black focus:outline-none resize-none leading-relaxed shadow-inner overflow-auto"
                            spellCheck={false}
                            style={{ 
                                color: 'transparent',
                                WebkitTextFillColor: 'transparent',
                                border: 'none'
                            }}
                        />
                    </div>
                )}
            </div>

            {activeIssue && (
                <div 
                    className="fixed z-50 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-200"
                    style={{ top: popoverPos.top, left: popoverPos.left }}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className={activeIssue.type === 'grammar' ? 'text-green-500' : 'text-red-500'} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{activeIssue.type}</span>
                        </div>
                        <button onClick={() => setActiveIssueId(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                    </div>
                    <p className="text-xs text-slate-500 italic mb-2">"{activeIssue.source}"</p>
                    <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Suggestion</p>
                        <p className="text-sm font-bold text-blue-600">{activeIssue.suggestion}</p>
                    </div>
                    <button 
                        onClick={() => handleApplySuggestion(activeIssue)}
                        className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        Apply AI Fix
                    </button>
                </div>
            )}

            {spellCheckError && (
                <div className={`absolute bottom-6 right-6 px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 border ${
                    spellCheckError.includes('பிழைகள் ஏதுமில்லை') 
                    ? 'bg-emerald-600 text-white border-emerald-400' 
                    : 'bg-slate-800 text-white border-slate-600'
                }`}>
                    {spellCheckError.includes('பிழைகள் ஏதுமில்லை') ? <Check size={18} /> : <AlertTriangle size={18} className="text-amber-400" />}
                    <span className="font-bold text-sm">{spellCheckError}</span>
                </div>
            )}
        </div>
    );
};

export default AdminQuestionConsolidator;
