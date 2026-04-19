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
    onUpdateReportSettings?: (settings: Blueprint['reportSettings']) => void;
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
    onUpdateReportSettings,
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
                    <h2 className="text-xl font-bold text-gray-800">
                        {blueprint.questionPaperTypeName}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-secondary">
                        <span>
                            {blueprint.subject} • Class {blueprint.classLevel} • {blueprint.examTerm} • {blueprint.setId}
                        </span>
                        {blueprint.isConfirmed && (
                            <CheckCircle size={14} className="text-emerald-500 animate-fade-in" />
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation & Controls - Simplified */}
            {(showQuestions || showReports) && (
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md py-3 px-4 border-b flex flex-wrap justify-between items-center no-print shadow-sm gap-2 rounded-xl mb-6">
                    <div className="flex w-full md:w-auto bg-gray-100 p-1 rounded-xl border border-gray-200 order-1 md:order-none">
                        <button
                            onClick={() => { setShowQuestions(false); setShowReports(false); }}
                            className={`flex flex-1 items-center justify-center gap-1 md:gap-2 px-2 md:px-6 py-2 rounded-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${activeMode === 'Matrix' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List size={14} className="flex-shrink-0" /> <span className="truncate">Matrix</span>
                        </button>
                        {blueprint.isConfirmed && (
                            <>
                                <button
                                    onClick={() => { setShowQuestions(true); setShowReports(false); }}
                                    className={`flex flex-1 items-center justify-center gap-1 md:gap-2 px-2 md:px-6 py-2 rounded-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${activeMode === 'Questions' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Settings size={14} className="flex-shrink-0" /> <span className="truncate">2. Questions</span>
                                </button>
                                <button
                                    onClick={() => { setShowReports(true); setShowQuestions(false); }}
                                    className={`flex flex-1 items-center justify-center gap-1 md:gap-2 px-2 md:px-6 py-2 rounded-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${activeMode === 'Reports' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <FileText size={14} className="flex-shrink-0" /> <span className="truncate">3. Reports</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div ref={printRef} className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${activeMode === 'Reports' ? 'p-0 border-none bg-transparent shadow-none' : activeMode === 'Questions' ? 'p-0' : 'p-6'}`}>
                {activeMode === 'Matrix' && (
                    <BlueprintMatrix
                        blueprint={blueprint}
                        curriculum={curriculum}
                        onUpdateItem={onUpdateItemField}
                        onMoveItem={onMoveItem}
                        paperType={paperType}
                        readOnly={blueprint.isConfirmed}
                        onRegenerate={onRegenerate}
                        onConfirm={onConfirm}
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
                        onUpdateReportSettings={onUpdateReportSettings}
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
