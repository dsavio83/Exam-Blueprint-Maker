
import React, { useState, useEffect } from 'react';
import {
    Trash2, Plus, X, FileJson
} from 'lucide-react';
import {
    ClassLevel, SubjectType, Curriculum, Unit
} from '../types';
import {
    getCurriculum, saveCurriculum, getDB
} from '../services/db';

const AdminCurriculumManager = () => {
    const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel._10);
    const [selectedSubject, setSelectedSubject] = useState<SubjectType>(SubjectType.TAMIL_AT);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await getCurriculum(selectedClass, selectedSubject);
            setCurriculum(data || { classLevel: selectedClass, subject: selectedSubject, units: [] });
        };
        load();
    }, [selectedClass, selectedSubject]);

    const handleCopyJSON = () => {
        const db = getDB();
        if (!db) {
            alert("Database not initialized yet.");
            return;
        }
        const json = JSON.stringify(db.curriculums, null, 2);
        navigator.clipboard.writeText(json).then(() => alert("All Curriculum data copied to clipboard! You can use this to update INITIAL_CURRICULUM in db.ts."));
    };

    const saveCurr = async (curr: Curriculum) => {
        setCurriculum(curr);
        await saveCurriculum(curr);
    };

    const handleAddUnit = () => {
        if (!curriculum) return;
        const newUnit: Unit = {
            id: Math.random().toString(36).substr(2, 9),
            unitNumber: curriculum.units.length + 1,
            name: 'New Unit',
            subUnits: [],
            learningOutcomes: ''
        };
        saveCurr({ ...curriculum, units: [...curriculum.units, newUnit] });
    };

    const updateUnit = (id: string, field: keyof Unit, val: any) => {
        if (!curriculum) return;
        saveCurr({ ...curriculum, units: curriculum.units.map(u => u.id === id ? { ...u, [field]: val } : u) });
    };

    const addSubUnit = (unitId: string) => {
        if (!curriculum) return;
        saveCurr({
            ...curriculum, units: curriculum.units.map(u => u.id === unitId ? {
                ...u, subUnits: [...u.subUnits, { id: Math.random().toString(36).substr(2, 9), name: 'New SubUnit' }]
            } : u)
        });
    };

    const updateSubUnit = (unitId: string, sId: string, val: string) => {
        if (!curriculum) return;
        saveCurr({
            ...curriculum, units: curriculum.units.map(u => u.id === unitId ? {
                ...u, subUnits: u.subUnits.map(s => s.id === sId ? { ...s, name: val } : s)
            } : u)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Curriculum & Units</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyJSON}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                        <FileJson size={16} /> Export JSON
                    </button>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(parseInt(e.target.value, 10) as ClassLevel)} className="border p-2 rounded text-sm">
                        {Object.values(ClassLevel).filter(v => typeof v === 'number').map(v => <option key={v} value={v}>Class {v}</option>)}
                    </select>
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value as SubjectType)} className="border p-2 rounded text-sm">
                        {Object.values(SubjectType).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {curriculum?.units.map((unit, idx) => (
                    <div key={unit.id} className="bg-white border rounded p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Unit {unit.unitNumber}</span>
                            <input
                                className="font-semibold text-lg border-b border-transparent focus:border-blue-500 outline-none flex-1"
                                value={unit.name}
                                onChange={(e) => updateUnit(unit.id, 'name', e.target.value)}
                                placeholder="Unit Name"
                            />
                            <button onClick={() => {
                                const confirm = window.confirm("Delete Unit?");
                                if (confirm && curriculum) saveCurr({ ...curriculum, units: curriculum.units.filter(u => u.id !== unit.id) });
                            }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>

                        {/* Learning Outcomes Input */}
                        <div className="ml-8 mb-4">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Learning Outcomes (LOs)</label>
                            <textarea
                                className="w-full text-sm border rounded p-2 bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                rows={2}
                                value={unit.learningOutcomes || ''}
                                onChange={(e) => updateUnit(unit.id, 'learningOutcomes', e.target.value)}
                                placeholder="Enter Learning Outcomes for this unit..."
                            />
                        </div>

                        <div className="ml-8 space-y-2">
                            {unit.subUnits.map(sub => (
                                <div key={sub.id} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    <input
                                        className="text-sm border-b border-gray-100 focus:border-blue-300 outline-none w-full"
                                        value={sub.name}
                                        onChange={(e) => updateSubUnit(unit.id, sub.id, e.target.value)}
                                        placeholder="Subunit Name"
                                    />
                                    <button onClick={() => {
                                        saveCurr({ ...curriculum, units: curriculum.units.map(u => u.id === unit.id ? { ...u, subUnits: u.subUnits.filter(s => s.id !== sub.id) } : u) })
                                    }} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => addSubUnit(unit.id)} className="text-xs text-blue-600 flex items-center mt-2 hover:underline">
                                <Plus size={12} className="mr-1" /> Add Sub-unit
                            </button>
                        </div>
                    </div>
                ))}
                <button onClick={handleAddUnit} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded hover:border-blue-500 hover:text-blue-500 transition flex justify-center items-center">
                    <Plus className="mr-2" /> Add New Unit
                </button>
            </div>
        </div>
    );
};

export default AdminCurriculumManager;
