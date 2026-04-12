
import React, { useState, useEffect } from 'react';
import {
    Trash2, Plus, Edit2, X, FileJson
} from 'lucide-react';
import {
    SubjectType, Discourse, DiscourseScores, CognitiveProcess
} from '../types';
import {
    getDiscourses, saveDiscourses, getDB
} from '../services/db';

const AdminDiscourseManager = () => {
    const [discourses, setDiscourses] = useState<Discourse[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDiscourse, setEditingDiscourse] = useState<Discourse | null>(null);

    const handleCopyJSON = () => {
        const db = getDB();
        const json = JSON.stringify(db.discourses, null, 2);
        navigator.clipboard.writeText(json).then(() => alert("All Discourse data copied to clipboard! You can use this to update INITIAL_DISCOURSES in db.ts."));
    };

    // Filter States
    const [filterSubject, setFilterSubject] = useState<SubjectType>(SubjectType.TAMIL_AT);
    const [filterMarks, setFilterMarks] = useState<number | 'all'>('all');

    const [formData, setFormData] = useState<Partial<Discourse>>({
        subject: SubjectType.TAMIL_AT,
        marks: 3,
        name: '',
        description: '',
        rubrics: []
    });

    useEffect(() => {
        setDiscourses(getDiscourses() || []);
    }, []);

    const filteredDiscourses = (discourses || []).filter(d => {
        if (d.subject !== filterSubject) return false;
        if (filterMarks !== 'all' && d.marks !== filterMarks) return false;
        return true;
    });

    const handleSave = () => {
        if (!formData.name) return alert("Name is required");

        let newDiscourses = [...discourses];
        if (editingDiscourse) {
            newDiscourses = newDiscourses.map(d => d.id === editingDiscourse.id ? { ...d, ...formData } as Discourse : d);
        } else {
            newDiscourses.push({
                ...formData as Discourse,
                id: Math.random().toString(36).substr(2, 9)
            });
        }
        setDiscourses(newDiscourses);
        saveDiscourses(newDiscourses);

        // Update filters to show the saved item
        if (formData.subject) setFilterSubject(formData.subject);
        if (formData.marks) setFilterMarks(formData.marks);

        setIsFormOpen(false);
        setEditingDiscourse(null);
        setFormData({ subject: formData.subject, marks: formData.marks, name: '', description: '', rubrics: [] });
    };

    const handleEdit = (d: Discourse) => {
        setEditingDiscourse(d);
        setFormData(d);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Delete this Discourse?")) return;
        const newDiscourses = discourses.filter(d => d.id !== id);
        setDiscourses(newDiscourses);
        saveDiscourses(newDiscourses);
    };

    const addRubric = () => {
        setFormData({
            ...formData,
            rubrics: [...(formData.rubrics || []), { point: '', marks: 1 }]
        });
    };

    const removeRubric = (idx: number) => {
        const r = [...(formData.rubrics || [])];
        r.splice(idx, 1);
        setFormData({ ...formData, rubrics: r });
    };

    const updateRubric = (idx: number, field: keyof DiscourseScores, val: any) => {
        const r = [...(formData.rubrics || [])];
        r[idx] = { ...r[idx], [field]: val };
        setFormData({ ...formData, rubrics: r });
    };

    const formatMark = (m: number) => {
        if (m % 1 === 0.5) {
            const floor = Math.floor(m);
            return floor === 0 ? '½' : `${floor}½`;
        }
        return m;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Discourse Management</h2>
                <div className="flex gap-4">
                    <button
                        onClick={handleCopyJSON}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        <FileJson size={16} /> Export JSON
                    </button>
                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value as SubjectType)}
                        className="border p-2 rounded text-sm bg-white"
                    >
                        {Object.values(SubjectType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        value={filterMarks}
                        onChange={(e) => setFilterMarks(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="border p-2 rounded text-sm bg-white"
                    >
                        <option value="all">All Marks</option>
                        <option value="3">3 Marks</option>
                        <option value="5">5 Marks</option>
                        <option value="6">6 Marks</option>
                    </select>
                    <button
                        onClick={() => {
                            setEditingDiscourse(null);
                            setFormData({ subject: filterSubject, marks: typeof filterMarks === 'number' ? filterMarks : 3, name: '', description: '', rubrics: [] });
                            setIsFormOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center shadow hover:bg-blue-700"
                    >
                        <Plus size={18} className="mr-2" /> New Discourse
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500 mb-6">
                    <h3 className="font-bold mb-4">{editingDiscourse ? 'Edit Discourse' : 'New Discourse'}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <select
                                className="border w-full p-2 rounded mt-1"
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value as SubjectType })}
                            >
                                {Object.values(SubjectType).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Marks Category</label>
                            <select
                                className="border w-full p-2 rounded mt-1"
                                value={formData.marks}
                                onChange={e => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                            >
                                <option value="3">3 Marks</option>
                                <option value="5">5 Marks</option>
                                <option value="6">6 Marks</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cognitive Process</label>
                            <select
                                className="border w-full p-2 rounded mt-1"
                                value={formData.cognitiveProcess || ''}
                                onChange={e => setFormData({ ...formData, cognitiveProcess: e.target.value })}
                            >
                                <option value="">-- Select --</option>
                                {Object.entries(CognitiveProcess).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700">Discourse Name</label>
                            <input
                                className="border w-full p-2 rounded mt-1"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Essay, Letter"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded border mb-4">
                        <h4 className="font-semibold text-sm mb-2 text-gray-600">Evaluation Rubrics (Optional)</h4>
                        {(formData.rubrics || []).map((r, idx) => (
                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                <input
                                    className="border p-2 rounded flex-1 text-sm"
                                    placeholder="Point / Description"
                                    value={r.point}
                                    onChange={e => updateRubric(idx, 'point', e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="border p-2 rounded w-20 text-sm text-center"
                                    placeholder="Marks"
                                    step="0.5"
                                    value={r.marks}
                                    onChange={e => updateRubric(idx, 'marks', parseFloat(e.target.value))}
                                />
                                <button onClick={() => removeRubric(idx)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                            </div>
                        ))}
                        <button onClick={addRubric} className="text-xs text-blue-600 flex items-center hover:underline mt-2">
                            <Plus size={14} className="mr-1" /> Add Rubric Point
                        </button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiscourses.map(d => {
                    const totalRubricMarks = d.rubrics?.reduce((sum, r) => sum + r.marks, 0) || 0;
                    return (
                        <div key={d.id} className="bg-white p-4 rounded shadow border hover:shadow-md transition flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{d.name}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{d.subject}</span>
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">{d.marks} Marks</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(d)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(d.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                {d.rubrics && d.rubrics.length > 0 && (
                                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                                        <p className="text-xs font-semibold text-gray-400 mb-1">RUBRICS</p>
                                        <ul className="list-disc pl-4 space-y-1 mb-2">
                                            {d.rubrics.slice(0, 5).map((r, i) => (
                                                <li key={i}>{r.point} - <b>{formatMark(r.marks)}</b></li>
                                            ))}
                                            {d.rubrics.length > 5 && <li className="text-xs italic text-blue-500 font-semibold">+{d.rubrics.length - 5} More...</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {d.rubrics && d.rubrics.length > 0 && (
                                <div className="mt-2 pt-2 border-t flex justify-end">
                                    <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded">
                                        Total: {formatMark(totalRubricMarks)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredDiscourses.length === 0 && (
                    <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded border border-dashed">
                        No discourses found for this selection.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDiscourseManager;
