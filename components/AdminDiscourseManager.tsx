import React, { useState, useEffect } from 'react';
import { Discourse, SubjectType, CognitiveProcess, DiscourseScores } from '@/types';
import { getDiscourses, saveDiscourses } from '@/services/db';
import { Plus, Trash2, Edit2, X, Search } from 'lucide-react';

const AdminDiscourseManager: React.FC = () => {
    const [discourses, setDiscourses] = useState<Discourse[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDiscourse, setEditingDiscourse] = useState<Discourse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubject, setFilterSubject] = useState<string>('All');

    const [formData, setFormData] = useState<Partial<Discourse>>({
        name: '',
        subject: SubjectType.TAMIL_AT,
        marks: 5,
        rubrics: [],
        cognitiveProcess: CognitiveProcess.CP1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDiscourses();
            setDiscourses(data);
        } catch (error) {
            console.error('Error loading discourses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) return;

        try {
            const all = await getDiscourses();
            if (editingDiscourse) {
                await saveDiscourses(all.map(d => d.id === editingDiscourse.id ? { ...formData, id: d.id } as Discourse : d));
            } else {
                const newDiscourse = {
                    ...formData,
                    id: Math.random().toString(36).substr(2, 9),
                    description: formData.description || ''
                } as Discourse;
                await saveDiscourses([...all, newDiscourse]);
            }
            setIsFormOpen(false);
            setEditingDiscourse(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving discourse:', error);
            alert("Error saving discourse. Please check your connection and login session.");
        }
    };

    const handleEdit = (d: Discourse) => {
        setEditingDiscourse(d);
        setFormData({ ...d });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this discourse?')) {
            const all = await getDiscourses();
            await saveDiscourses(all.filter(d => d.id !== id));
            loadData();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            subject: SubjectType.TAMIL_AT,
            marks: 5,
            rubrics: [],
            cognitiveProcess: CognitiveProcess.CP1
        });
    };

    const addRubric = () => {
        const newRubric: DiscourseScores = { point: '', marks: 1 };
        setFormData({
            ...formData,
            rubrics: [...(formData.rubrics || []), newRubric]
        });
    };

    const removeRubric = (index: number) => {
        const updated = [...(formData.rubrics || [])];
        updated.splice(index, 1);
        setFormData({ ...formData, rubrics: updated });
    };

    const updateRubric = (index: number, field: keyof DiscourseScores, value: string | number) => {
        const updated = [...(formData.rubrics || [])];
        updated[index] = { ...updated[index], [field]: value } as DiscourseScores;
        setFormData({ ...formData, rubrics: updated });
    };

    const filteredDiscourses = discourses.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = filterSubject === 'All' || d.subject === filterSubject;
        return matchesSearch && matchesSubject;
    });

    const formatMark = (m: number) => (m % 1 === 0 ? m.toString() : m.toFixed(1));

    if (loading) return <div className="p-8 text-center text-gray-500">Loading discourses...</div>;

    return (
        <div className="p-4 lg:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Discourse & Rubrics Manager</h2>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search discourses..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="border p-2 rounded-lg bg-white"
                        value={filterSubject}
                        onChange={e => setFilterSubject(e.target.value)}
                    >
                        <option value="All">All Subjects</option>
                        {Object.values(SubjectType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingDiscourse(null);
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
                                onChange={e => setFormData({ ...formData, cognitiveProcess: e.target.value as CognitiveProcess })}
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
