import React, { useEffect, useMemo, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { Check, Copy, FileText, Save, Loader2 } from 'lucide-react';
import { getBlueprints, getQuestionPaperTypes, saveBlueprint } from '../services/db';
import { Blueprint, QuestionPaperType } from '../types';

const QUESTION_SEPARATOR = '============================================================';

const AdminQuestionConsolidator = () => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [selectedBlueprintId, setSelectedBlueprintId] = useState('');
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [workingText, setWorkingText] = useState('');
    
    const editorRef = useRef<HTMLDivElement>(null);


    const formatText = (text: string) => {
        if (!text) return '';
        // Split by lines to preserve structure
        return text.split('\n').map(line => {
            // Convert Tab character to consistent indentation spaces
            const tabbedLine = line.replace(/\t/g, '    ');
            if (!tabbedLine.trim()) return '';
            
            // Wrap only alphanumeric blocks. 
            // Spaces and Tamil characters stay outside spans to avoid font-switching gaps.
            return tabbedLine.replace(/([A-Za-z0-9\-\:\(\)\.\,\|]+)/g, '<span style="font-family: \'Times New Roman\', serif;">$1</span>');
        }).join('<br/>');
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        // Get only the plain text to strip all external HTML/CSS mess
        const text = e.clipboardData.getData('text/plain');
        if (!text) return;

        // Apply our custom formatting (Tamil vs English fonts)
        const formattedHtml = formatText(text);
        
        // Insert at current cursor position
        document.execCommand('insertHTML', false, formattedHtml);
        
        // Trigger state update
        if (editorRef.current) {
            setWorkingText(editorRef.current.innerHTML);
        }
    };



    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const [bps, pts] = await Promise.all([getBlueprints('all'), getQuestionPaperTypes()]);
            const filtered = (bps || []).filter(bp => bp.isConfirmed || bp.isAdminAssigned);
            
            // Ensure unique by Exam properties (Class, Subject, Set, Term, Academic Year)
            const uniqueMap = new Map();
            filtered.forEach(bp => {
                const key = `${bp.classLevel}-${bp.subject}-${bp.setId || 'Set A'}-${bp.examTerm}-${bp.academicYear || '2026-27'}`;
                if (!uniqueMap.has(key) || (bp.isConfirmed && !uniqueMap.get(key).isConfirmed)) {
                    uniqueMap.set(key, bp);
                }
            });
            const unique = Array.from(uniqueMap.values());
            
            setBlueprints(unique);
            setPaperTypes(pts || []);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => { refreshData(); }, []);

    const selectedBlueprint = useMemo(() => blueprints.find(bp => bp.id === selectedBlueprintId), [blueprints, selectedBlueprintId]);
    const selectedPaperType = useMemo(() => paperTypes.find(t => t.id === selectedBlueprint?.questionPaperTypeId), [paperTypes, selectedBlueprint]);

    useEffect(() => {
        if (selectedBlueprint && selectedPaperType) {
            if (selectedBlueprint.massViewHeader) {
                setWorkingText(selectedBlueprint.massViewHeader);
            } else {
                const header = `<div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-family: 'TAU-Urai', serif; font-weight: bold; font-size: 24pt; margin: 0;">சமக்ர சிக்ஷா கேரளம்</h1>
                </div>`;
                setWorkingText(header);
            }
        }
    }, [selectedBlueprint, selectedPaperType]);

    const handleSave = async () => {
        if (!selectedBlueprint || !editorRef.current) return;
        setIsSaving(true);
        try {
            const html = editorRef.current.innerHTML;
            const updated = { ...selectedBlueprint, massViewHeader: html };
            await saveBlueprint(updated);
            setWorkingText(html);
            Swal.fire("Saved", "Changes saved to database!", "success");
        } catch (e) {
            Swal.fire("Error", "Save failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = async () => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative border-sky-100 bg-white p-4 flex flex-col h-full space-y-4">
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Mass View</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleSave} disabled={!selectedBlueprint || isSaving} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!workingText}
                            className={`inline-flex h-9 px-4 items-center justify-center rounded-xl font-bold transition-all ${copied ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'} text-sm`}
                        >
                            {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                            {copied ? 'Copied' : 'Copy Text'}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Question Paper:</span>
                    <select
                        value={selectedBlueprintId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBlueprintId(e.target.value)}
                        className="flex-1 max-w-2xl px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50 text-sm font-bold text-slate-700 shadow-sm"
                    >
                        <option value="">Select Exam to Load...</option>
                        {blueprints.map(bp => (
                            <option key={bp.id} value={bp.id}>
                                Class {bp.classLevel} . {bp.subject} . {bp.setId?.replace(/SET\s+/i, '').replace(/Set\s+/i, '') || 'A'} . {bp.academicYear || '2026-27'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 relative flex flex-col min-h-0 bg-slate-50/50 rounded-xl overflow-hidden border border-sky-50 shadow-inner">
                {!selectedBlueprintId ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-sky-100 rounded-3xl bg-sky-50/30 m-8">
                        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                            <FileText size={40} className="text-sky-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Select an exam to view</h3>
                        <p className="text-slate-500 text-sm mt-1">Full question paper will be loaded into the editor below.</p>
                    </div>
                ) : (
                    <div className="relative w-full h-full bg-white p-12 overflow-auto">
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{ __html: workingText }}
                            onBlur={(e) => setWorkingText(e.currentTarget.innerHTML)}
                            onPaste={handlePaste}
                            className="w-full min-h-full focus:outline-none print:p-0"
                            style={{ 
                                fontFamily: "'TAU-Paalai', serif",
                                fontSize: '14pt',
                                lineHeight: '1.6',
                                color: '#000'
                            }}
                        ></div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminQuestionConsolidator;