import React, { useEffect, useState } from 'react';
import { Edit2, Layers, Save, RefreshCw } from 'lucide-react';
import { Blueprint, BlueprintItem, QuestionPaperType, SystemSettings, Discourse, Curriculum } from '../types';
import { getSettings, getDiscourses, getCurriculum, getDB, initDB, filterCurriculumByTerm } from '../services/db';
import QuestionRow from './QuestionRow';

export const QuestionEntryForm = ({ blueprint, onUpdateItem, paperType, onSave, isSaving }: {
    blueprint: Blueprint,
    onUpdateItem: (id: string, field: keyof BlueprintItem, val: string) => void,
    paperType?: QuestionPaperType,
    onSave?: () => void,
    isSaving?: boolean
}) => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [discourses, setDiscourses] = useState<Discourse[]>([]);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [localSaving, setLocalSaving] = useState(false);

    const handleLocalUpdate = (id: string, field: keyof BlueprintItem, val: string) => {
        setHasChanges(true);
        onUpdateItem(id, field, val);
    };

    const handleSave = async () => {
        if (!onSave) return;
        setLocalSaving(true);
        try {
            await onSave();
            setHasChanges(false);
        } finally {
            setTimeout(() => setLocalSaving(false), 1000);
        }
    };

    const isCurrentlySaving = isSaving || localSaving;
    const isReadyToSave = hasChanges || isCurrentlySaving;

    useEffect(() => {
        const load = async () => {
            const [settingsData, discourseData, curriculumData] = await Promise.all([
                getSettings(),
                getDiscourses(),
                getCurriculum(blueprint.classLevel, blueprint.subject)
            ]);
            const db = getDB() || await initDB();
            setSettings(settingsData);
            setDiscourses(discourseData || []);
            setCurriculum(filterCurriculumByTerm(db, curriculumData, blueprint.examTerm));
        };
        load();
    }, [blueprint.classLevel, blueprint.subject, blueprint.examTerm]);

    if (!settings) {
        return (
            <div className="bg-white p-6 rounded shadow mt-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <Edit2 size={24} className="text-blue-600" />
                    Question & Answer Entry
                </h2>
                <p className="text-sm text-gray-500">Loading question editor...</p>
            </div>
        );
    }

    // Helper for unit order
    const unitOrderMap = new Map<string, number>();
    curriculum?.units.forEach((u: any, idx: number) => {
        unitOrderMap.set(u.id, u.unitNumber);
    });

    // Helper for section order
    const sectionIndexMap = new Map<string, number>();
    paperType?.sections.forEach((s, idx) => sectionIndexMap.set(s.id, idx));

    // Sort items: Section Order -> Unit Order Ascending -> Marks
    const sortedItems = [...blueprint.items].sort((a, b) => {
        // 1. Sort by Section Index (Primary grouping)
        const idxA = a.sectionId ? sectionIndexMap.get(a.sectionId) ?? 999 : 999;
        const idxB = b.sectionId ? sectionIndexMap.get(b.sectionId) ?? 999 : 999;
        if (idxA !== idxB) return idxA - idxB;

        // 2. Sort by Unit (using looked-up order)
        const unitA = unitOrderMap.get(a.unitId) || 999;
        const unitB = unitOrderMap.get(b.unitId) || 999;
        if (unitA !== unitB) return unitA - unitB;

        // 3. Marks (Ascending)
        return a.marksPerQuestion - b.marksPerQuestion;
    });

    return (
        <div className="bg-white p-6 rounded shadow mt-6 relative">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Edit2 size={24} className="text-blue-600" />
                    Question & Answer Entry
                </h2>
                <button
                    onClick={handleSave}
                    disabled={isCurrentlySaving || !hasChanges}
                    className={`fixed bottom-6 right-6 w-12 h-12 md:w-14 md:h-14 rounded-full transition-all shadow-2xl flex items-center justify-center group no-print z-[100] 
                        ${isCurrentlySaving 
                            ? 'bg-blue-600 text-white cursor-wait' 
                            : hasChanges
                                ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-110 shadow-green-100 active:scale-95'
                                : 'bg-gray-400 text-white opacity-60 cursor-not-allowed'
                        }`}
                    title={isCurrentlySaving ? "Saving..." : hasChanges ? "Save All Changes" : "No changes to save"}
                >
                    {isCurrentlySaving ? (
                        <RefreshCw size={20} className="animate-spin" />
                    ) : (
                        <div className="relative">
                            <Save size={20} className={hasChanges ? "group-hover:rotate-12 transition-transform" : ""} />
                            {hasChanges && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                    )}
                </button>
            </div>
            <div className="space-y-6">
                {(() => {
                    // Global tracker for instructions to ensure they only appear once PER SECTION ID
                    const renderedSections = new Set<string>();

                    return sortedItems.map((item, index) => {
                        const section = paperType?.sections.find(s => s.id === item.sectionId);
                        const sectionId = section?.id || item.sectionId;

                        // Only show instruction if:
                        // 1. It exists for this section
                        // 2. It hasn't been rendered yet in this pass
                        const showInstruction = section?.instruction && sectionId && !renderedSections.has(sectionId);

                        // Mark this section as rendered immediately if we are showing or skip it
                        if (showInstruction && sectionId) {
                            renderedSections.add(sectionId);
                        }

                        // Filter discourses for this item
                        const itemDiscourses = discourses.filter(d =>
                            d.subject === blueprint.subject &&
                            d.marks === item.marksPerQuestion
                        );

                        return (
                            <React.Fragment key={item.id}>
                                {showInstruction && (
                                    <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg shadow-sm animate-fade-in group">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-amber-100 text-amber-700 p-1 rounded">
                                                    <Layers size={14} />
                                                </div>
                                                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">SECTION INSTRUCTION</div>
                                            </div>
                                        </div>
                                        <p className="text-[14px] font-bold text-amber-900 leading-relaxed tamil-font">
                                            {section?.instruction}
                                        </p>
                                    </div>
                                )}
                                <QuestionRow
                                    item={item}
                                    index={index}
                                    onUpdateItem={handleLocalUpdate}
                                    availableDiscourses={itemDiscourses}
                                    systemSettings={settings}
                                    curriculum={curriculum}
                                    section={section}
                                    sectionItems={sortedItems.filter(si => si.sectionId === item.sectionId)}
                                />
                            </React.Fragment>
                        );
                    });
                })()}
            </div>
        </div>
    );
};

export default QuestionEntryForm;
