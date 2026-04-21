import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Discourse, SubjectType, CognitiveProcess, DiscourseScores } from '@/types';
import { getDiscourses, saveDiscourses } from '@/services/db';
import { Plus, Trash2, Edit2, X, Search, Printer } from 'lucide-react';

const AdminDiscourseManager: React.FC = () => {
    const [discourses, setDiscourses] = useState<Discourse[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDiscourse, setEditingDiscourse] = useState<Discourse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubject, setFilterSubject] = useState<string>('All');

    const formatMarkString = (m: number) => {
        const s = m.toString();
        if (s.endsWith('.5')) {
            const whole = s.split('.')[0];
            return whole === '0' ? '½' : `${whole}½`;
        }
        return s;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const subjectTitle = filterSubject === 'All' ? 'All Subjects' : filterSubject;
        
        let tableRows = '';
        filteredDiscourses.forEach((d, idx) => {
            let rubricsHtml = '';
            if (d.rubrics && d.rubrics.length > 0) {
                rubricsHtml = `<div style="margin-top: 8px; margin-left: 20px; font-size: 11pt;">
                    ${d.rubrics.map(r => `
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding: 2px 0;">
                            <span>${r.point}</span>
                            <span style="font-family: 'Times New Roman', serif; font-weight: bold; margin-left: 20px;">${formatMarkString(r.marks)}</span>
                        </div>
                    `).join('')}
                </div>`;
            }

            tableRows += `
                <tr>
                    <td style="text-align: center; font-family: 'Times New Roman', serif;">${idx + 1}</td>
                    <td>
                        <div style="font-weight: bold; font-size: 13pt;">${d.name}</div>
                        ${rubricsHtml}
                    </td>
                    <td style="text-align: center; font-family: 'Times New Roman', serif; font-weight: bold;">${formatMarkString(d.marks)}</td>
                    <td style="text-align: center; font-size: 10pt;">${d.cognitiveProcess || '-'}</td>
                </tr>
            `;
        });

        const html = `
            <html>
                <head>
                    <title>Discourses - ${subjectTitle}</title>
                    <style>
                        @font-face {
                            font-family: 'TAU-Paalai';
                            src: url('/fonts/TAU-Paalai.ttf') format('truetype');
                        }
                        body { font-family: 'TAU-Paalai', 'Times New Roman', serif; padding: 20px; }
                        h2 { text-align: center; color: #333; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #333; padding: 10px; text-align: left; vertical-align: top; }
                        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
                        .tamil-font { font-family: 'TAU-Paalai', serif; }
                        @media print {
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h2>Discourses & Rubrics Analysis - ${subjectTitle}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px;">Sl No</th>
                                <th>Discourse</th>
                                <th style="width: 80px;">Total Marks</th>
                                <th style="width: 150px;">Cognitive Process</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <script>
                        window.onload = () => { 
                            // Give fonts a moment to load if needed
                            setTimeout(() => {
                                window.print();
                                // window.close(); 
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

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
        if (!formData.name) return Swal.fire("Required", "Discourse name is required", "warning");

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
            Swal.fire("Saved", "Discourse saved successfully", "success");
            setIsFormOpen(false);
            setEditingDiscourse(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving discourse:', error);
            Swal.fire("Error", "Error saving discourse. Please check your connection.", "error");
        }
    };

    const handleEdit = (d: Discourse) => {
        setEditingDiscourse(d);
        setFormData({ ...d });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const all = await getDiscourses();
                    await saveDiscourses(all.filter(d => d.id !== id));
                    Swal.fire("Deleted", "Discourse has been removed", "success");
                    loadData();
                } catch (error) {
                    Swal.fire("Error", "Failed to delete discourse", "error");
                }
            }
        });
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

    const formatMark = (m: number) => {
        const s = m.toString();
        let result = s;
        if (s.endsWith('.5')) {
            const whole = s.split('.')[0];
            result = whole === '0' ? '½' : `${whole}½`;
        }
        return <span className="english-font" style={{ fontFamily: "'Times New Roman', serif" }}>{result}</span>;
    };

    const renderMixedText = (text: string | undefined | null) => {
        if (!text) return '-';
        // Split by Tamil characters vs others (English/Numbers/Symbols)
        const segments = text.toString().split(/([அ-ஹ\u0B80-\u0BFF]+)/);
        
        return segments.map((seg, i) => {
            if (!seg) return null;
            const isTamil = /[அ-ஹ\u0B80-\u0BFF]/.test(seg);
            return (
                <span 
                    key={i} 
                    className={isTamil ? "tamil-font" : "english-font"}
                    style={{ 
                        fontFamily: isTamil ? `'TAU-Paalai', 'Latha', serif` : `'Times New Roman', serif`,
                        fontSize: isTamil ? 'inherit' : 'inherit',
                        lineHeight: isTamil ? '1.4' : '1.2'
                    }}
                >
                    {seg}
                </span>
            );
        });
    };

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
                        onClick={handlePrint}
                        className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded flex items-center shadow hover:border-blue-300 hover:text-blue-600 transition-all"
                        title="Print Discourses"
                    >
                        <Printer size={18} className="mr-2" /> Print
                    </button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">{editingDiscourse ? 'Edit Discourse' : 'New Discourse'}</h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                                    <select
                                        className="border w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value as SubjectType })}
                                    >
                                        {Object.values(SubjectType).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Marks Category</label>
                                    <select
                                        className="border w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.marks}
                                        onChange={e => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                                    >
                                        <option value="3">3 Marks</option>
                                        <option value="5">5 Marks</option>
                                        <option value="6">6 Marks</option>
                                        <option value="8">8 Marks</option>
                                        <option value="10">10 Marks</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cognitive Process</label>
                                    <select
                                        className="border w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.cognitiveProcess || ''}
                                        onChange={e => setFormData({ ...formData, cognitiveProcess: e.target.value as CognitiveProcess })}
                                    >
                                        <option value="">-- Select --</option>
                                        {Object.entries(CognitiveProcess).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discourse Name</label>
                                    <input
                                        className="border w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Essay, Letter, Diary Entry"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-gray-700 text-sm">Evaluation Rubrics (Optional)</h4>
                                    <button onClick={addRubric} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full flex items-center transition-all">
                                        <Plus size={14} className="mr-1" /> Add Point
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {(formData.rubrics || []).map((r, idx) => (
                                        <div key={idx} className="flex gap-2 items-start group">
                                            <div className="flex-1">
                                                <input
                                                    className="border w-full p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="Point / Description"
                                                    value={r.point}
                                                    onChange={e => updateRubric(idx, 'point', e.target.value)}
                                                />
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    className="border w-full p-2 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="Marks"
                                                    step="0.5"
                                                    value={r.marks}
                                                    onChange={e => updateRubric(idx, 'marks', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => removeRubric(idx)} 
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!formData.rubrics || formData.rubrics.length === 0) && (
                                        <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
                                            <p className="text-xs text-gray-400">No rubric points added yet</p>
                                        </div>
                                    )}
                                </div>
                                
                                {(formData.rubrics || []).length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Rubric:</span>
                                        <span className={`text-sm font-black px-3 py-1 rounded-full ${
                                            (formData.rubrics || []).reduce((sum, r) => sum + r.marks, 0) === formData.marks 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {formatMark((formData.rubrics || []).reduce((sum, r) => sum + r.marks, 0))} / {formData.marks}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                            <button 
                                onClick={() => setIsFormOpen(false)} 
                                className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                            >
                                Save Discourse
                            </button>
                        </div>
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
                                        <h3 className="font-bold text-gray-800">{renderMixedText(d.name)}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{d.subject}</span>
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded english-font">{formatMark(d.marks)} Marks</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(d)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(d.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                {d.rubrics && d.rubrics.length > 0 && (
                                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                                        <p className="text-xs font-semibold text-gray-400 mb-1 uppercase">Rubrics</p>
                                        <ul className="list-disc pl-4 space-y-1 mb-2">
                                            {d.rubrics.slice(0, 5).map((r, i) => (
                                                <li key={i}>{renderMixedText(r.point)} - <b>{formatMark(r.marks)}</b></li>
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
