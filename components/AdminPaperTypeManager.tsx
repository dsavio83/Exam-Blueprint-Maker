
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
    const defaultSection: QuestionPatternSection = { id: '', marks: 1, count: 1 };

    useEffect(() => { setTypes(getQuestionPaperTypes()); }, []);

    const handleSave = () => {
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
        saveQuestionPaperTypes(newTypes);
        setEditingId(null);
        setFormData({ name: '', description: '', sections: [] });
        setIsFormOpen(false);
    };

    const handleDeleteType = (id: string) => {
        if (window.confirm("Are you sure you want to delete this paper type? This cannot be undone.")) {
            const newTypes = types.filter(t => t.id !== id);
            setTypes(newTypes);
            saveQuestionPaperTypes(newTypes);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Question Paper Types</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyJSON}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        <FileJson size={16} /> Export JSON
                    </button>
                    {!isFormOpen && (
                        <button
                            onClick={handleAddNew}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg font-bold shadow-md transition-all text-sm flex items-center gap-2"
                        >
                            <Plus size={18} /> Add New Paper Type
                        </button>
                    )}
                </div>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100 mb-6 animate-fade-in">
                    <h3 className="font-bold text-lg mb-4 text-purple-700 flex items-center gap-2 border-b pb-2">
                        {editingId ? <Edit size={18} /> : <Plus size={18} />}
                        {editingId ? 'Edit Paper Type' : 'Configure New Paper Type'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type Name</label>
                            <input
                                placeholder="e.g. Revision Exam / Monthly Test"
                                className="border p-2 rounded w-full focus:ring-2 focus:ring-purple-200 outline-none"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                            <input
                                placeholder="Optional description"
                                className="border p-2 rounded w-full focus:ring-2 focus:ring-purple-200 outline-none"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Sections Configuration</label>
                            <div className="text-xs font-bold text-purple-600">
                                Total Marks: {(formData.sections || []).reduce((sum, s) => sum + (s.marks * s.count), 0)}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(formData.sections || []).map((s, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-400">Q.Count:</span>
                                            <input type="number" className="border w-16 p-1 rounded text-center text-sm" value={s.count} onChange={e => updateSection(idx, 'count', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-400">Marks/Q:</span>
                                            <input type="number" className="border w-16 p-1 rounded text-center text-sm" value={s.marks} onChange={e => updateSection(idx, 'marks', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div className="bg-purple-50 px-2 py-1 rounded border border-purple-100 flex items-center gap-1 min-w-[80px] justify-center">
                                            <span className="text-[10px] text-purple-400 font-bold">TOTAL:</span>
                                            <span className="text-sm font-black text-purple-700">{s.count * s.marks}</span>
                                        </div>
                                        <div className="ml-auto flex items-center">
                                            <button onClick={() => removeSection(idx)} className="text-red-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors" title="Remove Section"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <input
                                            placeholder="Section Instruction (e.g. Answer all questions)"
                                            className="border p-1.5 rounded w-full text-xs italic bg-gray-50 focus:bg-white transition-all outline-none"
                                            value={s.instruction || ''}
                                            onChange={e => updateSection(idx, 'instruction', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addSection}
                            className="w-full mt-3 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all font-medium flex items-center justify-center gap-1"
                        >
                            <Plus size={14} /> Add New Section
                        </button>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all text-sm flex items-center gap-2"
                        >
                            <Save size={18} /> {editingId ? 'Update Type' : 'Save Type'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {types.map(t => (
                        <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all flex flex-col group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors uppercase text-sm tracking-wide">{t.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{t.description || 'No description'}</p>
                                </div>
                                <div className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                                    {t.totalMarks} Marks
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 mb-4 bg-gray-50/50 p-2 rounded-lg">
                                {t.sections.slice(0, 3).map((s, i) => (
                                    <div key={i} className="text-[11px] text-gray-600 flex justify-between border-b border-gray-100 pb-1">
                                        <span>{s.count} qns × {s.marks}M</span>
                                        <span className="font-bold text-gray-400">{s.marks * s.count}M</span>
                                    </div>
                                ))}
                                {t.sections.length > 3 && (
                                    <div className="text-[10px] text-gray-400 italic text-center">+{t.sections.length - 3} more sections...</div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors"
                                >
                                    <Edit size={14} /> Edit Configuration
                                </button>
                                <button
                                    onClick={() => handleDeleteType(t.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    title="Delete Type"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {types.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                            <FileText size={64} className="mx-auto mb-4 opacity-10" />
                            <p className="text-lg font-medium">No question paper types defined yet.</p>
                            <button onClick={handleAddNew} className="mt-4 text-purple-600 font-bold hover:underline">Click here to create your first pattern</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPaperTypeManager;
