
import React, { useState, useEffect } from 'react';
import {
    Trash2, Plus, X, FileJson, Edit, Save, FileText
} from 'lucide-react';
import {
    QuestionPaperType, QuestionPatternSection
} from '../types';
import {
    getQuestionPaperTypes, saveQuestionPaperTypes
} from '../services/db';

const AdminPaperTypeManager = () => {
    const [types, setTypes] = useState<QuestionPaperType[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<QuestionPaperType>>({
        name: '',
        description: '',
        sections: []
    });
    const defaultSection: QuestionPatternSection = { id: '', marks: 1, count: 1, optionCount: 0, timePerQuestion: 0 };

    useEffect(() => {
        const load = async () => {
            const data = await getQuestionPaperTypes();
            setTypes(data);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!formData.name) return alert("Name is required.");
        if (!formData.sections || formData.sections.length === 0) return alert("At least one section is required.");

        const totalMarks = (formData.sections || []).reduce((sum, s) => sum + (s.marks * s.count), 0);
        const finalData: QuestionPaperType = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            name: formData.name,
            totalMarks: totalMarks,
            description: formData.description || '',
            sections: formData.sections || []
        };

        const newTypes = editingId
            ? types.map(t => t.id === editingId ? finalData : t)
            : [...types, finalData];

        setTypes(newTypes);
        await saveQuestionPaperTypes(newTypes);
        setEditingId(null);
        setFormData({ name: '', description: '', sections: [] });
        setIsFormOpen(false);
    };

    const handleDeleteType = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this paper type? This cannot be undone.")) {
            const newTypes = types.filter(t => t.id !== id);
            setTypes(newTypes);
            await saveQuestionPaperTypes(newTypes);
        }
    };

    const handleCopyJSON = () => {
        const json = JSON.stringify(types, null, 2);
        navigator.clipboard.writeText(json).then(() => alert("JSON copied to clipboard! You can use this to update INITIAL_PAPER_TYPES in db.ts."));
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', sections: [] });
        setIsFormOpen(true);
    };

    const handleEdit = (t: QuestionPaperType) => {
        setEditingId(t.id);
        setFormData(t);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', sections: [] });
        setIsFormOpen(false);
    };

    const addSection = () => setFormData({ ...formData, sections: [...(formData.sections || []), { ...defaultSection, id: Math.random().toString(36).substr(2, 9) }] });
    const removeSection = (idx: number) => { const s = [...(formData.sections || [])]; s.splice(idx, 1); setFormData({ ...formData, sections: s }); };
    const updateSection = (idx: number, field: keyof QuestionPatternSection, val: string | number) => { const s = [...(formData.sections || [])]; s[idx] = { ...s[idx], [field]: val } as any; setFormData({ ...formData, sections: s }); };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-display tracking-tight">Paper Types</h2>
                    <p className="text-gray-500 mt-1 font-medium italic">Define exam patterns and marks distribution.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleCopyJSON}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <FileJson size={18} className="text-blue-500" /> Export JSON
                    </button>
                    {!isFormOpen && (
                        <button
                            onClick={handleAddNew}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-purple-100 transition-all text-sm flex items-center gap-2 active:scale-95"
                        >
                            <Plus size={18} /> New Pattern
                        </button>
                    )}
                </div>
            </div>

            {isFormOpen ? (
                <div className="ap-card border-purple-100 p-0 overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-6 bg-gradient-to-r from-purple-50/50 to-white border-b border-purple-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-purple-700 font-display flex items-center gap-2">
                            {editingId ? <Edit size={20} /> : <Plus size={20} />}
                            {editingId ? 'Edit Paper Type' : 'Configure New Pattern'}
                        </h3>
                        {editingId && <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded-lg uppercase tracking-widest">ID: {editingId}</span>}
                    </div>

                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Pattern Name</label>
                                <input
                                    placeholder="e.g. Revision Exam / Monthly Test"
                                    className="w-full text-sm border border-gray-100 rounded-2xl p-4 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all font-bold text-gray-700"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Brief Description</label>
                                <input
                                    placeholder="What is this exam pattern for?"
                                    className="w-full text-sm border border-gray-100 rounded-2xl p-4 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all font-medium text-gray-600"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Sections Configuration</label>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 bg-purple-100/50 px-3 py-1.5 rounded-full border border-purple-100">
                                        <span className="text-[10px] font-black text-purple-400 uppercase uppercase">Marks:</span>
                                        <span className="text-sm font-black text-purple-700">{(formData.sections || []).reduce((sum, s) => sum + (s.marks * s.count), 0)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-blue-100/50 px-3 py-1.5 rounded-full border border-blue-100">
                                        <span className="text-[10px] font-black text-blue-400 uppercase uppercase">Time:</span>
                                        <span className="text-sm font-black text-blue-700">{(formData.sections || []).reduce((sum, s) => sum + ((s.timePerQuestion || 0) * s.count), 0)}m</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(formData.sections || []).map((s, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group/sec relative">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Q. Count</label>
                                                <input type="number" className="w-full border-none bg-gray-50 rounded-xl p-2 text-center text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-100 transition-all font-mono" value={s.count} onChange={e => updateSection(idx, 'count', parseInt(e.target.value) || 0)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Marks/Q</label>
                                                <input type="number" className="w-full border-none bg-gray-50 rounded-xl p-2 text-center text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-100 transition-all font-mono" value={s.marks} onChange={e => updateSection(idx, 'marks', parseInt(e.target.value) || 0)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Options</label>
                                                <input type="number" className="w-full border-none bg-gray-50 rounded-xl p-2 text-center text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-100 transition-all font-mono" value={s.optionCount || 0} onChange={e => updateSection(idx, 'optionCount', parseInt(e.target.value) || 0)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Time (m)</label>
                                                <input type="number" className="w-full border-none bg-gray-50 rounded-xl p-2 text-center text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-100 transition-all font-mono" value={s.timePerQuestion || 0} onChange={e => updateSection(idx, 'timePerQuestion', parseInt(e.target.value) || 0)} />
                                            </div>
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Section Instruction</label>
                                                <input
                                                    placeholder="E.g. Answer all questions"
                                                    className="w-full border-none bg-gray-50 rounded-xl p-2 text-sm italic font-medium text-gray-600 focus:ring-2 focus:ring-purple-100 transition-all"
                                                    value={s.instruction || ''}
                                                    onChange={e => updateSection(idx, 'instruction', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeSection(idx)} 
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-red-50 text-red-300 hover:text-red-500 hover:border-red-200 rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addSection}
                                className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-100/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:text-purple-500 shadow-sm">
                                    <Plus size={16} />
                                </div>
                                Add New Section
                            </button>
                        </div>

                        <div className="flex justify-end items-center gap-4 pt-4">
                            <button
                                onClick={handleCancel}
                                className="px-6 py-2.5 text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors"
                            >
                                Cancel Changes
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-purple-100 transition-all text-sm flex items-center gap-2 active:scale-95"
                            >
                                <Save size={18} /> {editingId ? 'Update Pattern' : 'Create Pattern'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {types.map(t => (
                        <div key={t.id} className="ap-card group hover:border-purple-200 transition-all duration-300 flex flex-col h-full hover:shadow-xl hover:shadow-purple-50/50">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-gray-800 font-display tracking-tight group-hover:text-purple-700 transition-colors uppercase text-sm">{t.name}</h3>
                                        <p className="text-[11px] font-medium text-gray-400 italic line-clamp-1">{t.description || 'General exam pattern definition'}</p>
                                    </div>
                                    <div className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg shadow-purple-100">
                                        {t.totalMarks} Marks
                                    </div>
                                </div>

                                <div className="space-y-2.5 bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                                    {t.sections.slice(0, 3).map((s, i) => (
                                        <div key={i} className="text-[11px] text-gray-600 flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1 h-1 bg-purple-300 rounded-full"></span>
                                                <span className="font-bold text-gray-500">{s.count} Qns</span>
                                                <span className="text-gray-300">·</span>
                                                <span className="font-medium">{s.marks} Marks ea.</span>
                                            </div>
                                            <span className="font-black text-purple-400/60">{s.marks * s.count}M</span>
                                        </div>
                                    ))}
                                    {t.sections.length > 3 && (
                                        <div className="text-[10px] text-gray-300 font-bold italic text-center pt-1 border-t border-gray-100/50">+{t.sections.length - 3} more sections</div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center rounded-b-2xl">
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="text-blue-600 hover:text-blue-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:gap-3"
                                >
                                    <Edit size={14} strokeWidth={3} /> Edit Pattern
                                </button>
                                <button
                                    onClick={() => handleDeleteType(t.id)}
                                    className="text-gray-300 hover:text-red-500 transition-all p-1"
                                    title="Delete Type"
                                >
                                    <Trash2 size={18} strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {types.length === 0 && (
                        <div className="col-span-full py-24 text-center ap-card bg-gray-50/50 border-dashed border-2 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center text-gray-200">
                                <FileText size={40} strokeWidth={1} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-400 font-display">No Patterns Defined</p>
                                <p className="text-sm text-gray-400 mt-1 italic">Start by creating your first exam configuration.</p>
                            </div>
                            <button onClick={handleAddNew} className="mt-2 text-purple-600 font-black text-xs uppercase tracking-widest hover:underline hover:scale-105 transition-all">Create Pattern Now</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPaperTypeManager;
