
import React, { useState, useEffect } from 'react';
import {
    Trash2, Plus, Save, FileJson
} from 'lucide-react';
import {
    ClassLevel, SubjectType, ExamTerm, ExamConfiguration, Curriculum, UnitWeightage
} from '../types';
import {
    getExamConfigs, saveExamConfigs, getCurriculum, getDB
} from '../services/db';

const AdminExamConfigManager = () => {
    const [configs, setConfigs] = useState<ExamConfiguration[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel._10);
    const [selectedSubject, setSelectedSubject] = useState<SubjectType>(SubjectType.TAMIL_AT);
    const [selectedTerm, setSelectedTerm] = useState<ExamTerm>(ExamTerm.FIRST);
    const [currentConfig, setCurrentConfig] = useState<ExamConfiguration | null>(null);
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);

    const handleCopyJSON = () => {
        const db = getDB();
        if (!db) {
            alert("Database not initialized yet.");
            return;
        }
        const json = JSON.stringify(db.examConfigs, null, 2);
        navigator.clipboard.writeText(json).then(() => alert("All Exam Configuration data copied to clipboard! You can use this to update INITIAL_EXAM_CONFIGS in db.ts."));
    };

    useEffect(() => {
        const load = async () => {
            const data = await getExamConfigs();
            setConfigs(data);
        };
        load();
    }, []);

    useEffect(() => {
        const load = async () => {
            const cur = await getCurriculum(selectedClass, selectedSubject);
            setCurriculum(cur || null);
        };
        load();
    }, [selectedClass, selectedSubject]);

    useEffect(() => {
        const found = configs.find(c => c.classLevel === selectedClass && c.subject === selectedSubject && c.term === selectedTerm);
        if (found) {
            setCurrentConfig({ ...found });
        } else {
            setCurrentConfig({
                id: `temp-${Date.now()}`,
                classLevel: selectedClass,
                subject: selectedSubject,
                term: selectedTerm,
                weightages: []
            });
        }
    }, [selectedClass, selectedSubject, selectedTerm, configs]);

    const handleSave = async () => {
        if (!currentConfig) return;
        const totalPercent = currentConfig.weightages.reduce((sum, w) => sum + w.percentage, 0);
        if (totalPercent !== 100) {
            alert("Total weightage must be exactly 100%");
            return;
        }

        const existingIdx = configs.findIndex(c => c.classLevel === currentConfig.classLevel && c.subject === currentConfig.subject && c.term === currentConfig.term);
        let newConfigs = [...configs];
        if (existingIdx >= 0) {
            newConfigs[existingIdx] = currentConfig;
        } else {
            newConfigs.push({ ...currentConfig, id: Math.random().toString(36).substr(2, 9) });
        }
        setConfigs(newConfigs);
        await saveExamConfigs(newConfigs);
        alert("Configuration Saved!");
    };

    const addWeightage = () => {
        if (!currentConfig) return;
        setCurrentConfig({ ...currentConfig, weightages: [...currentConfig.weightages, { unitNumber: currentConfig.weightages.length + 1, percentage: 0 }] });
    };

    const updateWeightage = (idx: number, field: keyof UnitWeightage, val: number) => {
        if (!currentConfig) return;
        const newW = [...currentConfig.weightages];
        newW[idx] = { ...newW[idx], [field]: val };
        setCurrentConfig({ ...currentConfig, weightages: newW });
    };

    const removeWeightage = (idx: number) => {
        if (!currentConfig) return;
        const newW = currentConfig.weightages.filter((_, i) => i !== idx);
        setCurrentConfig({ ...currentConfig, weightages: newW });
    };

    const totalPercent = currentConfig?.weightages.reduce((sum, w) => sum + w.percentage, 0) || 0;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Exam Weightage Configuration</h2>
                <button
                    onClick={handleCopyJSON}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                    <FileJson size={16} /> Export JSON
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider block mb-1">Select Class</label>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(parseInt(e.target.value, 10) as ClassLevel)} className="w-full border-none bg-gray-50 rounded-xl p-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all">
                        {Object.values(ClassLevel).filter(v => typeof v === 'number').map(v => <option key={v} value={v}>Class {v}</option>)}
                    </select>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider block mb-1">Select Subject</label>
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value as SubjectType)} className="w-full border-none bg-gray-50 rounded-xl p-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all">
                        {Object.values(SubjectType).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider block mb-1">Select Term</label>
                    <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value as ExamTerm)} className="w-full border-none bg-gray-50 rounded-xl p-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all">
                        {Object.values(ExamTerm).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white border rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Unit Distribution</h3>
                        <p className="text-sm text-gray-400">Define how marks are spread across units</p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl font-black text-sm shadow-sm border ${totalPercent === 100 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                        Total: {totalPercent}%
                    </div>
                </div>

                <div className="space-y-4">
                    {currentConfig?.weightages.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-100 rounded-[1.5rem] flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Plus className="text-gray-300" size={32} />
                            </div>
                            <p className="font-bold text-gray-400">No units configured. Start adding below.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {currentConfig?.weightages.map((w, idx) => {
                                const unitInfo = curriculum?.units.find(u => u.unitNumber === w.unitNumber);
                                return (
                                    <div key={idx} className="flex items-center gap-6 p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 font-black border border-gray-100 group-hover:scale-110 transition-transform">
                                            <input
                                                type="number"
                                                value={w.unitNumber}
                                                onChange={(e) => updateWeightage(idx, 'unitNumber', parseInt(e.target.value))}
                                                className="bg-transparent w-full text-center outline-none"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800">{unitInfo?.name || `Unit ${w.unitNumber}`}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Weightage Allocation</p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="bg-white border-2 border-gray-100 rounded-xl p-3 w-24 text-center font-black text-gray-700 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-50 outline-none transition-all"
                                                    value={w.percentage}
                                                    onChange={(e) => updateWeightage(idx, 'percentage', parseInt(e.target.value))}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xs">%</span>
                                            </div>
                                            <button
                                                onClick={() => removeWeightage(idx)}
                                                className="w-10 h-10 flex items-center justify-center text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        onClick={addWeightage}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl font-bold text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Plus size={20} /> Add Unit Rule
                    </button>
                </div>

                <div className="mt-12">
                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale disabled:pointer-events-none"
                        disabled={totalPercent !== 100}
                    >
                        <Save size={24} />
                        Save Weightage Configuration
                    </button>
                    {totalPercent !== 100 && (
                        <p className="text-center text-red-400 text-xs font-bold mt-4 uppercase tracking-widest animate-pulse">
                            Total Must Be Exactly 100% (Current: {totalPercent}%)
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminExamConfigManager;
