import React, { useState, useRef } from 'react';
import {
    Blueprint,
    Curriculum,
    BlueprintItem,
    QuestionPaperType,
    Discourse
} from '@/types';
import {
    ChevronLeft,
    RefreshCw,
    CheckCircle,
    Save,
    List,
    Settings,
    FileText
} from 'lucide-react';
import { BlueprintMatrix } from './BlueprintMatrix';
import { QuestionEntryForm } from './QuestionEntryForm';
import { ReportsView } from './ReportsView';
import { SummaryTable } from './SummaryTable';

interface UniversalBlueprintViewProps {
    blueprint: Blueprint;
    curriculum: Curriculum;
    paperType?: QuestionPaperType;
    discourses?: Discourse[];
    isAdmin: boolean;
    onBack: () => void;
    onUpdateItemField: (id: string, field: keyof BlueprintItem, val: any) => void;
    onMoveItem: (itemId: string, newUnitId: string, newSectionId: string, newSubUnitId?: string) => void;
    onSave: () => Promise<void>;
    onRegenerate: () => void;
    onConfirm: () => Promise<void>;
    onDownloadPDF: (type: string) => void;
    onDownloadWord: (type: string) => void;
    isSaving?: boolean;
}

const UniversalBlueprintView: React.FC<UniversalBlueprintViewProps> = ({
    blueprint,
    curriculum,
    paperType,
    discourses = [],
    isAdmin,
    onBack,
    onUpdateItemField,
    onMoveItem,
    onSave,
    onRegenerate,
    onConfirm,
    onDownloadPDF,
    onDownloadWord,
    isSaving = false
}) => {
    const [showQuestions, setShowQuestions] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const activeMode = showReports
        ? 'Reports'
        : showQuestions
            ? 'Questions'
            : 'Matrix';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2 no-print">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    title="Back to List"
                    id="btn-back-to-list"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {blueprint.questionPaperTypeName}
                        {blueprint.isConfirmed && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">Confirmed</span>
                        )}
                    </h2>
                    <p className="text-xs text-secondary">
                        {blueprint.subject} • Class {blueprint.classLevel} • {blueprint.examTerm} • {blueprint.setId}
                    </p>
                </div>
            </div>

            {/* Navigation & Controls */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md py-3 px-4 border-b flex flex-wrap justify-between items-center no-print shadow-sm gap-2 rounded-xl mb-6">
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                        onClick={() => { setShowQuestions(false); setShowReports(false); }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeMode === 'Matrix' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List size={16} /> 1. Matrix
                    </button>
                    {blueprint.isConfirmed && (
                        <>
                            <button
                                onClick={() => { setShowQuestions(true); setShowReports(false); }}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeMode === 'Questions' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Settings size={16} /> 2. Questions
                            </button>
                            <button
                                onClick={() => { setShowReports(true); setShowQuestions(false); }}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeMode === 'Reports' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FileText size={16} /> 3. Reports
                            </button>
                        </>
                    )}
                </div>

                <div className="flex gap-2 ml-auto items-center">
                    {!blueprint.isConfirmed && (
                        <div className="flex gap-2">
                            <button
                                onClick={onRegenerate}
                                className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl font-bold hover:bg-amber-100 flex items-center gap-2 transition-all text-sm outline-none"
                            >
                                <RefreshCw size={18} /> <span className="hidden md:inline">Reset</span>
                            </button>
                            <button
                                onClick={onConfirm}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 transition-all text-sm outline-none shadow-lg shadow-blue-100"
                            >
                                <CheckCircle size={18} /> <span className="hidden md:inline">Confirm</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div ref={printRef} className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${activeMode === 'Reports' ? 'p-0 border-none bg-transparent shadow-none' : 'p-6'}`}>
                {activeMode === 'Matrix' && (
                    <BlueprintMatrix
                        blueprint={blueprint}
                        curriculum={curriculum}
                        onUpdateItem={onUpdateItemField}
                        onMoveItem={onMoveItem}
                        paperType={paperType}
                        readOnly={blueprint.isConfirmed}
                    />
                )}

                {activeMode === 'Questions' && (
                    <QuestionEntryForm
                        blueprint={blueprint}
                        onUpdateItem={onUpdateItemField}
                        onSave={onSave}
                        isSaving={isSaving}
                        paperType={paperType}
                    />
                )}

                {activeMode === 'Reports' && (
                    <ReportsView
                        blueprint={blueprint}
                        curriculum={curriculum}
                        discourses={discourses}
                        paperType={paperType}
                        onDownloadPDF={onDownloadPDF}
                        onDownloadWord={onDownloadWord}
                        isAdmin={isAdmin}
                        onMoveItem={onMoveItem}
                        onUpdateItemField={onUpdateItemField}
                    />
                )}

                {activeMode === 'Questions' && blueprint && (
                    <div className="mt-8 pt-8 border-t">
                        <SummaryTable items={blueprint.items} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversalBlueprintView;
