
import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, ChevronDown } from 'lucide-react';
import { getDB } from '../services/db';
import { Blueprint, Role, User, QuestionPaperType } from '../types';

const AdminQuestionConsolidator = () => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);
    const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');
    const [consolidatedText, setConsolidatedText] = useState('');
    const [copied, setCopied] = useState(false);

    const stripHtml = (html: string) => {
        if (!html) return "";
        const tmp = document.createElement("DIV");

        // 1. Pre-process HTML to preserve line breaks from block elements
        let processedHtml = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<li>/gi, '\n• ')
            .replace(/<\/li>/gi, '\n');

        tmp.innerHTML = processedHtml;
        let text = tmp.textContent || tmp.innerText || "";

        // 2. Fix clumped options: Detect Tamil (அ, ஆ, இ, ஈ) or English (a, b, c, d) options 
        // that are stuck to the previous character and move them to a new line.
        // Pattern: Any non-newline character followed by (option character + bracket)
        text = text.replace(/([^\n])\s*([அஆஇஈA-Da-d]\))/g, '$1\n$2');

        // 3. Clean up formatting: remove excessive whitespace and leading/trailing newlines
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .join('\n')
            .trim();
    };

    useEffect(() => {
        const db = getDB();
        const bps = db.blueprints || [];

        // Filter blueprints: must be visible (!isHidden)
        // Showing all papers regardless of owner, as long as they are marked visible
        const activeBlueprints = bps.filter(bp => !bp.isHidden);
        setBlueprints(activeBlueprints);
        setPaperTypes(db.questionPaperTypes || []);
    }, []);

    useEffect(() => {
        if (!selectedBlueprintId) {
            setConsolidatedText('');
            return;
        }

        const bp = blueprints.find(b => b.id === selectedBlueprintId);
        if (!bp) return;

        const paperType = paperTypes.find(p => p.id === bp.questionPaperTypeId);

        let text = '';
        text += `========================================\n`;
        text += `PAPER: ${bp.questionPaperTypeName}\n`;
        text += `SUBJECT: ${bp.subject}\n`;
        text += `CLASS: ${bp.classLevel}\n`;
        text += `TERM: ${bp.examTerm}\n`;
        text += `========================================\n\n`;

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
                            text += `${qNo}. ${qText}\n`;
                            if (item.answerText) {
                                text += `Ans: ${stripHtml(item.answerText)}\n`;
                            }

                            if (item.hasInternalChoice && item.questionTextB) {
                                text += `OR\n`;
                                text += `${qNo}B. ${stripHtml(item.questionTextB)}\n`;
                                if (item.answerTextB) {
                                    text += `Ans B: ${stripHtml(item.answerTextB)}\n`;
                                }
                            }
                            text += `\n`;
                        }
                    });
                    questionNumberOffset += sectionItems.length;
                }
            });
        } else {
            // Fallback strategy if paperType is missing
            bp.items.forEach((item, itemIdx) => {
                const qText = stripHtml(item.questionText || '');
                if (qText) {
                    text += `${itemIdx + 1}. ${qText}\n`;
                    if (item.answerText) {
                        text += `Ans: ${stripHtml(item.answerText)}\n`;
                    }
                    text += `\n`;
                }
            });
        }

        setConsolidatedText(text);
    }, [selectedBlueprintId, blueprints, paperTypes]);

    const handleCopy = () => {
        if (!consolidatedText) return;
        navigator.clipboard.writeText(consolidatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-blue-600" /> Mass View
                    </h2>
                    <p className="text-sm text-gray-500">Select a question paper to view and copy all questions.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <select
                            value={selectedBlueprintId}
                            onChange={(e) => setSelectedBlueprintId(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
                        >
                            <option value="">Select Exam...</option>
                            {blueprints.map(bp => (
                                <option key={bp.id} value={bp.id}>
                                    Class {bp.classLevel} . {bp.subject} . {bp.setId || 'Set A'}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                            <ChevronDown size={16} />
                        </div>
                    </div>

                    <button
                        onClick={handleCopy}
                        disabled={!consolidatedText}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${!consolidatedText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                            copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                            }`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <textarea
                    readOnly
                    value={consolidatedText}
                    className="w-full h-[600px] p-6 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                    placeholder="Questions will appear here once an exam is selected..."
                />
            </div>
        </div>
    );
};

export default AdminQuestionConsolidator;
