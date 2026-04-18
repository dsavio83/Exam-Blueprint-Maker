import React, { useState } from 'react';
import { BlueprintItem, KnowledgeLevel, CognitiveProcess, ItemFormat } from '@/types';
import { X } from 'lucide-react';

export const BlueprintMatrix = ({ blueprint, curriculum, onUpdateItem, paperType, onMoveItem, readOnly }: any) => {
    const sections = (paperType?.sections || []).sort((a: any, b: any) => a.marks - b.marks);

    // Drag Handlers
    const handleDragStart = (e: React.DragEvent, item: BlueprintItem) => {
        if (readOnly) return;
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const getMarkColor = (marks: number) => {
        switch (marks) {
            case 1: return 'bg-blue-50 border-blue-200 text-blue-900';
            case 2: return 'bg-green-50 border-green-200 text-green-900';
            case 3: return 'bg-yellow-50 border-yellow-200 text-yellow-900';
            case 4: return 'bg-orange-50 border-orange-200 text-orange-900';
            case 5: return 'bg-purple-50 border-purple-200 text-purple-900';
            case 6: return 'bg-pink-50 border-pink-200 text-pink-900';
            default: return 'bg-gray-50 border-gray-200 text-gray-900';
        }
    };

    const getKnowledgeBorderClass = (level: KnowledgeLevel) => {
        switch (level) {
            case KnowledgeLevel.BASIC: return 'border-l-4 border-l-green-500';
            case KnowledgeLevel.AVERAGE: return 'border-l-4 border-l-yellow-500';
            case KnowledgeLevel.PROFOUND: return 'border-l-4 border-l-red-500';
            default: return 'border-l-4 border-l-gray-300';
        }
    };

    const handleDrop = (e: React.DragEvent, unitId: string, subUnitId: string, sectionId: string) => {
        if (readOnly) return;
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        onMoveItem(itemId, unitId, sectionId, subUnitId);
    };

    const getCellItems = (unitId: string, subUnitId: string, sectionId: string) => {
        return blueprint.items.filter((i: any) => i.unitId === unitId && i.subUnitId === subUnitId && i.sectionId === sectionId);
    };

    return (
        <div className="overflow-x-auto text-black">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold uppercase border-b-2 border-black inline-block px-4 pb-1">Blue Print</h2>
                <div className="flex justify-between mt-4 text-sm font-bold px-10">
                    <span>Class: {blueprint.classLevel}</span>
                    <span>Subject: {blueprint.subject}</span>
                    <span>Set: {blueprint.setId || 'A'}</span>
                    <span>Max Marks: {blueprint.totalMarks}</span>
                </div>
            </div>

            <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="border border-gray-800 p-3 w-10">#</th>
                        <th className="border border-gray-800 p-3 text-left">UNIT COMPONENT</th>
                        <th className="border border-gray-800 p-3 text-left">LESSON/TOPIC</th>
                        <th className="border border-gray-800 p-3 text-center bg-yellow-400 text-black font-bold">MARKS</th>
                        {sections.map((s: any) => (
                            <th key={s.id} className="border border-gray-800 p-3 text-center">
                                {s.marks} Marks <br /> <span className="text-[10px] text-gray-400 uppercase">Count: {s.count}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {curriculum.units.map((unit: any) => {
                        return unit.subUnits.map((subUnit: any, sIdx: number) => {
                            const isFirstSubUnit = sIdx === 0;
                            const subUnitItems = blueprint.items.filter((i: any) => i.unitId === unit.id && i.subUnitId === subUnit.id);
                            const subUnitTotal = subUnitItems.reduce((a: number, b: any) => a + b.totalMarks, 0);

                            return (
                                <tr key={subUnit.id} className="hover:bg-gray-50 font-sans">
                                    {isFirstSubUnit && (
                                        <td className="border border-gray-800 p-3 text-center font-bold text-gray-500 bg-white align-middle" rowSpan={unit.subUnits.length}>
                                            {unit.unitNumber}
                                        </td>
                                    )}
                                    {isFirstSubUnit && (
                                        <td className="border border-gray-800 p-3 font-bold text-blue-800 bg-white align-middle tamil-font" rowSpan={unit.subUnits.length}>
                                            {unit.name}
                                            {(() => {
                                                const unitTotalForPercent = blueprint.items
                                                    .filter((i: any) => i.unitId === unit.id)
                                                    .reduce((acc: number, curr: any) => acc + curr.totalMarks, 0);
                                                const unitPercent = Math.round((unitTotalForPercent / (blueprint.totalMarks || 1)) * 100);

                                                return (
                                                    <div className="text-xs text-gray-500 font-normal mt-1 no-print font-sans">
                                                        {unitPercent}% ({unitTotalForPercent})
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    )}
                                    <td className="border border-gray-800 p-3 italic text-gray-700 bg-white tamil-font">
                                        {subUnit.name}
                                    </td>
                                    <td className="border border-gray-800 p-3 text-center font-bold text-lg bg-yellow-50 text-orange-600">
                                        {subUnitTotal || ''}
                                    </td>

                                    {sections.map((s: any) => {
                                        const items = getCellItems(unit.id, subUnit.id, s.id);
                                        return (
                                            <td
                                                key={s.id}
                                                className="border border-gray-800 p-1 align-top h-16 min-w-[100px] relative group transition-colors"
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, unit.id, subUnit.id, s.id)}
                                            >
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {items.map((item: any) => (
                                                        <React.Fragment key={item.id}>
                                                            <div
                                                                draggable={!readOnly}
                                                                onDragStart={(e) => handleDragStart(e, item)}
                                                                onClick={() => !readOnly && setEditingItemId(item.id)}
                                                                className={`p-1.5 rounded-sm text-xs text-center border shadow-sm w-full relative group transition-all
                                                                    ${!readOnly ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                                                                    ${getMarkColor(item.marksPerQuestion)}
                                                                    ${getKnowledgeBorderClass(item.knowledgeLevel)}
                                                                `}
                                                            >
                                                                <div className="font-bold flex justify-between items-center px-1">
                                                                    <span>{item.questionCount}Q {item.hasInternalChoice ? '(A)' : ''}</span>
                                                                    <span className="text-[10px] opacity-75">({item.totalMarks}M)</span>
                                                                </div>
                                                                <div className="text-[9px] leading-tight mt-1 opacity-90 flex justify-between gap-1">
                                                                    <span title={item.knowledgeLevel}>{item.knowledgeLevel?.[0]}</span>
                                                                    <span title={item.cognitiveProcess}>{item.cognitiveProcess?.split(' ')[0]}</span>
                                                                    <span>{item.itemFormat}</span>
                                                                    {item.hasInternalChoice && <span className="font-bold text-blue-600" title="Option A">OR</span>}
                                                                </div>

                                                                {/* Shared Mini Editor Popover - Attached to Card A */}
                                                                {editingItemId === item.id && (
                                                                    <div className="absolute top-full left-0 mt-1 bg-white border shadow-xl rounded p-3 z-50 w-64 text-left space-y-3" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex justify-between items-center border-b pb-1">
                                                                            <div className="text-xs font-bold text-gray-700 font-sans">Edit Question Properties</div>
                                                                            <button onClick={() => setEditingItemId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                                                        </div>

                                                                        {/* Global Option Toggle */}
                                                                        <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                                                            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider font-sans">Internal Choice (OR)</label>
                                                                            <button
                                                                                onClick={() => onUpdateItem(item.id, 'hasInternalChoice', !item.hasInternalChoice)}
                                                                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${item.hasInternalChoice ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                                            >
                                                                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${item.hasInternalChoice ? 'translate-x-4' : 'translate-x-0'}`} />
                                                                            </button>
                                                                        </div>

                                                                        {/* Option A Section */}
                                                                        <div className="space-y-2">
                                                                            <div className="text-[10px] font-bold text-blue-600 uppercase font-sans">Option A Settings</div>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="block text-[9px] text-gray-500 font-sans">Knowledge</label>
                                                                                    <select
                                                                                        value={item.knowledgeLevel}
                                                                                        onChange={(e) => onUpdateItem(item.id, 'knowledgeLevel', e.target.value)}
                                                                                        className={`w-full text-xs border rounded p-1 ${item.marksPerQuestion === 1 ? 'opacity-75 bg-gray-50' : ''}`}
                                                                                        disabled={item.marksPerQuestion === 1}
                                                                                    >
                                                                                        {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-[9px] text-gray-500 font-sans">Cognitive</label>
                                                                                    <select value={item.cognitiveProcess} onChange={(e) => onUpdateItem(item.id, 'cognitiveProcess', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                        {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v.split(' ')[0]}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] text-gray-500 font-sans">Format</label>
                                                                                <select value={item.itemFormat} onChange={(e) => onUpdateItem(item.id, 'itemFormat', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                    {Object.values(ItemFormat).map(f => <option key={f} value={f}>{f}</option>)}
                                                                                </select>
                                                                            </div>
                                                                        </div>

                                                                        {/* Option B Section (Conditional) */}
                                                                        {item.hasInternalChoice && (
                                                                            <div className="space-y-2 pt-2 border-t font-sans">
                                                                                <div className="text-[10px] font-bold text-purple-600 uppercase">Option B Settings</div>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <label className="block text-[9px] text-gray-500">Knowledge</label>
                                                                                        <select
                                                                                            value={item.knowledgeLevelB || item.knowledgeLevel}
                                                                                            onChange={(e) => onUpdateItem(item.id, 'knowledgeLevelB', e.target.value)}
                                                                                            className={`w-full text-xs border rounded p-1 ${item.marksPerQuestion === 1 ? 'opacity-75 bg-gray-50' : ''}`}
                                                                                            disabled={item.marksPerQuestion === 1}
                                                                                        >
                                                                                            {Object.values(KnowledgeLevel).map(v => <option key={v} value={v}>{v}</option>)}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="block text-[9px] text-gray-500">Cognitive</label>
                                                                                        <select value={item.cognitiveProcessB || item.cognitiveProcess} onChange={(e) => onUpdateItem(item.id, 'cognitiveProcessB', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                            {Object.values(CognitiveProcess).map(v => <option key={v} value={v}>{v.split(' ')[0]}</option>)}
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-[9px] text-gray-500">Format</label>
                                                                                    <select value={item.itemFormatB || item.itemFormat} onChange={(e) => onUpdateItem(item.id, 'itemFormatB', e.target.value)} className="w-full text-xs border rounded p-1">
                                                                                        {Object.values(ItemFormat).map(f => <option key={f} value={f}>{f}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="text-right pt-2">
                                                                            <button onClick={(e) => { e.stopPropagation(); setEditingItemId(null); }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">Done</button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Duplicate Card for Option B */}
                                                            {item.hasInternalChoice && (
                                                                <div
                                                                    onClick={() => !readOnly && setEditingItemId(item.id)}
                                                                    className={`p-1.5 rounded-sm text-xs text-center border shadow-sm w-full mt-1 relative transition-all
                                                                        ${!readOnly ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                                                                        ${getMarkColor(item.marksPerQuestion)}
                                                                        ${getKnowledgeBorderClass(item.knowledgeLevelB || item.knowledgeLevel)}
                                                                        bg-purple-50/30 border-dashed
                                                                    `}
                                                                >
                                                                    <div className="font-bold flex justify-between items-center px-1">
                                                                        <span className="text-purple-700">{item.questionCount}Q (B)</span>
                                                                        <span className="text-[10px] opacity-75">({item.totalMarks}M)</span>
                                                                    </div>
                                                                    <div className="text-[9px] leading-tight mt-1 opacity-90 flex justify-between gap-1">
                                                                        <span title={item.knowledgeLevelB || item.knowledgeLevel}>{(item.knowledgeLevelB || item.knowledgeLevel)?.[0]}</span>
                                                                        <span title={item.cognitiveProcessB || item.cognitiveProcess}>{(item.cognitiveProcessB || item.cognitiveProcess)?.split(' ')[0]}</span>
                                                                        <span>{item.itemFormatB || item.itemFormat}</span>
                                                                        <span className="font-bold text-purple-600">OR</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        });
                    })}
                    <tr className="bg-indigo-900 text-white font-bold h-16">
                        <td className="border border-indigo-900 p-3 text-right uppercase tracking-wider" colSpan={3}>Total Aggregates</td>
                        <td className="border border-indigo-900 p-3 text-center text-2xl bg-yellow-400 text-black">{blueprint.totalMarks}</td>
                        {sections.map((s: any) => {
                            const sectionTotal = blueprint.items.filter((i: any) => i.sectionId === s.id).reduce((a: number, b: any) => a + b.questionCount, 0);
                            const sectionTotalMarks = blueprint.items.filter((i: any) => i.sectionId === s.id).reduce((a: number, b: any) => a + b.totalMarks, 0);
                            return (
                                <td key={s.id} className="border border-indigo-900 p-2 text-center align-middle">
                                    <div className="text-xl">{sectionTotal}</div>
                                    <div className="text-[10px] opacity-75 font-normal">{sectionTotalMarks} Marks</div>
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
