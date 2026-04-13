
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
    const [showAnswers, setShowAnswers] = useState(true);

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
        const isTamilSubject = bp.subject.toLowerCase().includes('tamil');

        let text = '';
        let answerKeyText = '';

        // HEADER BLOCK
        text += `============================================================\n`;
        text += `சமக்ர சிக்ஷா கேரளம் - ${bp.examTerm}\n`;
        text += `SUBJECT: ${bp.subject} | CLASS: ${bp.classLevel} | MARKS: ${bp.totalMarks}\n`;
        text += `TIME: 90 Minutes\n`;
        text += `============================================================\n\n`;

        answerKeyText += `============================================================\n`;
        answerKeyText += `ANSWER KEY: ${bp.subject}\n`;
        answerKeyText += `CLASS: ${bp.classLevel} | ${bp.examTerm}\n`;
        answerKeyText += `============================================================\n\n`;

        if (paperType) {
            let questionNumberOffset = 0;
            paperType.sections.forEach((section, sIdx) => {
                const sectionItems = bp.items.filter(item => item.sectionId === section.id);

                if (sectionItems.length > 0) {
                    text += `------------------------------------------------------------\n`;
                    text += `PART - ${String.fromCharCode(65 + sIdx)} (${section.marks} marks each)\n`;
                    text += `------------------------------------------------------------\n`;

                    if (section.instruction) {
                        text += `${section.instruction}\n\n`;
                    }

                    sectionItems.forEach((item, itemIdx) => {
                        const qNo = questionNumberOffset + itemIdx + 1;
                        const qText = stripHtml(item.questionText || '');
                        const marks = item.marksPerQuestion || 1;

                        if (qText) {
                            if (item.hasInternalChoice) {
                                // Header line: question number + note
                                text += `${qNo}. ஏதேனும் ஒன்றிற்கு விடையளிக்கவும்\n`;
                                // Option A
                                text += `   (அ) ${qText.split('\n').join('\n       ')} [${marks}]\n`;

                                // Option B
                                if (item.questionTextB) {
                                    text += `               (அல்லது)\n`;
                                    text += `   (ஆ) ${stripHtml(item.questionTextB).split('\n').join('\n       ')} [${marks}]\n`;
                                }

                                // Answers for Key
                                answerKeyText += `${qNo}. (அ) ${stripHtml(item.answerText || '---')}\n`;
                                if (item.answerTextB) {
                                    answerKeyText += `    (ஆ) ${stripHtml(item.answerTextB)}\n`;
                                }
                            } else {
                                text += `${qNo}. ${qText.split('\n').join('\n    ')} [${marks}]\n`;
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
                const marks = item.marksPerQuestion || 1;
                
                if (qText) {
                    if (item.hasInternalChoice) {
                        text += `${qNo}. ஏதேனும் ஒன்றிற்கு விடையளிக்கவும்\n`;
                        text += `   (அ) ${qText.split('\n').join('\n       ')} [${marks}]\n`;
                        if (item.questionTextB) {
                            text += `               (அல்லது)\n`;
                            text += `   (ஆ) ${stripHtml(item.questionTextB).split('\n').join('\n       ')} [${marks}]\n`;
                        }
                        answerKeyText += `${qNo}. (அ) ${stripHtml(item.answerText || '---')}\n`;
                        if (item.answerTextB) {
                            answerKeyText += `    (ஆ) ${stripHtml(item.answerTextB)}\n`;
                        }
                    } else {
                        text += `${qNo}. ${qText.split('\n').join('\n    ')} [${marks}]\n`;
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
    }, [selectedBlueprintId, blueprints, paperTypes, showAnswers]);

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

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            checked={showAnswers}
                            onChange={(e) => setShowAnswers(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-gray-700">Include Answer Key</span>
                    </label>

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
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${!consolidatedText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                            copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform active:scale-95'
                            }`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy All'}
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
