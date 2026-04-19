import React, { useState, useEffect } from 'react';
import {
    Users, Search, CheckCircle, AlertCircle, FileText,
    Settings, PlusCircle, ArrowRight, UserPlus,
    BookOpen, Layers, Calendar, Loader2
} from 'lucide-react';
import {
    getUsers, saveBlueprint,
    getQuestionPaperTypes, generateBlueprintTemplate,
    getDB, initDB, getCurriculum, filterCurriculumByTerm
} from '../services/db';
import {
    User, Blueprint, QuestionPaperType, Role,
    ClassLevel, SubjectType, ExamTerm
} from '../types';

interface AdminAssignmentManagerProps {
    onAssign?: () => void;
}

const AdminAssignmentManager: React.FC<AdminAssignmentManagerProps> = ({ onAssign }) => {
    // State
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const [paperTypes, setPaperTypes] = useState<QuestionPaperType[]>([]);

    // Paper Configuration State
    const [config, setConfig] = useState({
        classLevel: 10 as ClassLevel,
        subject: SubjectType.TAMIL_AT,
        examTerm: ExamTerm.FIRST,
        paperType: '',
        setLabel: 'SET A',
        examYear: new Date().getFullYear().toString(),
        totalMarks: 10,
        timeDuration: '40 Mins'
    });

    // Options
    const classOptions: ClassLevel[] = [ClassLevel._8, ClassLevel._9, ClassLevel._10, ClassLevel._11];
    const subjectOptions = Object.values(SubjectType);
    const termOptions = Object.values(ExamTerm);
    const setOptions = ['SET A', 'SET B', 'SET C', 'SET D', 'GENERAL'];

    useEffect(() => {
        const loadData = async () => {
            try {
                let db = getDB();
                if (!db) db = await initDB();

                const [allUsers, pTypes] = await Promise.all([
                    getUsers(),
                    getQuestionPaperTypes()
                ]);

                setUsers(allUsers.filter(u => u.role !== Role.ADMIN));
                setPaperTypes(pTypes);

                if (pTypes.length > 0) {
                    setConfig(prev => ({
                        ...prev,
                        paperType: pTypes[0].id,
                        totalMarks: pTypes[0].totalMarks
                    }));
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.staffId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.pen?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.id));
        }
    };

    const handleAssign = async () => {
        if (selectedUserIds.length === 0) {
            setStatus({ type: 'error', message: 'Please select at least one teacher. (குறைந்தது ஒரு ஆசிரியரைத் தேர்ந்தெடுக்கவும்)' });
            return;
        }

        if (!config.paperType) {
            setStatus({ type: 'error', message: 'Please select a paper type. (வினாத்தாள் வகையைத் தேர்ந்தெடுக்கவும்)' });
            return;
        }

        setIsAssigning(true);
        setStatus({ type: null, message: '' });

        try {
            const db = getDB();
            if (!db) throw new Error("Database not initialized");

            const selectedPaperType = paperTypes.find(t => t.id === config.paperType) || paperTypes[0];
            const timestamp = new Date().toISOString();

            // 1. Get base curriculum
            const curriculum = await getCurriculum(config.classLevel, config.subject);
            if (!curriculum) {
                setStatus({ type: 'error', message: `No curriculum found for Class ${config.classLevel} ${config.subject}.` });
                setIsAssigning(false);
                return;
            }

            // 2. Filter curriculum by term if needed
            const filteredCurriculum = filterCurriculumByTerm(db, curriculum, config.examTerm);
            if (!filteredCurriculum) {
                setStatus({ type: 'error', message: `No active units found for ${config.examTerm}.` });
                setIsAssigning(false);
                return;
            }

            // Create a blueprint for each selected user
            for (const userId of selectedUserIds) {
                // 3. Generate items based on template
                const items = generateBlueprintTemplate(
                    db,
                    filteredCurriculum,
                    config.examTerm,
                    config.paperType
                ).map(item => ({
                    ...item,
                    id: Math.random().toString(36).substr(2, 9)
                }));

                const newBlueprint: Blueprint = {
                    id: Math.random().toString(36).substr(2, 9),
                    ownerId: userId,
                    classLevel: config.classLevel,
                    subject: config.subject,
                    questionPaperTypeId: config.paperType,
                    questionPaperTypeName: selectedPaperType.name,
                    examTerm: config.examTerm,
                    academicYear: config.examYear,
                    setId: config.setLabel,
                    totalMarks: config.totalMarks,
                    items: items,
                    isConfirmed: false,
                    isLocked: false,
                    isHidden: false,
                    createdAt: timestamp,
                    isAdminAssigned: true,
                    reportSettings: {
                        fontFamily: "TAU-Pallai",
                        fontSizeBody: 12,
                        fontSizeTitle: 14,
                        fontSizeTamil: 14,
                        rowHeight: 35,
                        columnWidths: {},
                        showLogo: true,
                        compactMode: false
                    }
                };

                await saveBlueprint(newBlueprint);
            }

            setStatus({
                type: 'success',
                message: `Successfully assigned blueprints to ${selectedUserIds.length} teachers. (வினாத்தாள்கள் ஆசிரியர்களுக்கு வெற்றிகரமாக ஒதுக்கப்பட்டன)`
            });
            setSelectedUserIds([]);

            if (onAssign) {
                setTimeout(() => onAssign(), 2000);
            }

        } catch (error: any) {
            console.error('Assignment failed:', error);
            setStatus({ type: 'error', message: `Assignment process failed: ${error.message}` });
        } finally {
            setIsAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Initializing Database...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-display tracking-tight flex items-center gap-3">
                        <UserPlus className="text-blue-600" />
                        Assign Question Papers
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">
                        Create and assign new blueprints to specific teachers. (வினாத்தாள்களை ஆசிரியர்களுக்கு ஒதுக்கவும்)
                    </p>
                </div>
            </div>

            {status.type && (
                <div className={`p-5 rounded-2xl flex items-start gap-4 animate-in zoom-in-95 duration-300 shadow-sm border ${status.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="mt-0.5 flex-shrink-0" size={24} /> : <AlertCircle className="mt-0.5 flex-shrink-0" size={24} />}
                    <div>
                        <div className="font-black text-sm uppercase tracking-tight">{status.type === 'success' ? 'Operation Successful' : 'Assignment Failed'}</div>
                        <div className="font-bold text-sm mt-0.5 opacity-80">{status.message}</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Configuration */}
                <div className="xl:col-span-5 space-y-6">
                    <div className="ap-card overflow-hidden">
                        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 font-display flex items-center gap-2">
                                <Settings size={18} className="text-blue-600" />
                                1. Paper Setup (வினாத்தாள் அமைப்பு)
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={14} /> Class
                                </label>
                                <select
                                    value={config.classLevel}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const parsedVal = isNaN(Number(val)) ? val : Number(val);
                                        setConfig({ ...config, classLevel: parsedVal as ClassLevel });
                                    }}
                                    className="ap-select w-full"
                                >
                                    <option value={8}>Class 8</option>
                                    <option value={9}>Class 9</option>
                                    <option value={10}>Class 10</option>
                                    <option value={'SSLC'}>SSLC</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={14} /> Subject
                                </label>
                                <select
                                    value={config.subject}
                                    onChange={(e) => setConfig({ ...config, subject: e.target.value as SubjectType })}
                                    className="ap-select w-full"
                                >
                                    {subjectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={14} /> Exam Term
                                </label>
                                <select
                                    value={config.examTerm}
                                    onChange={(e) => setConfig({ ...config, examTerm: e.target.value as ExamTerm })}
                                    className="ap-select w-full"
                                >
                                    {termOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} /> Paper Type
                                </label>
                                <select
                                    value={config.paperType}
                                    onChange={(e) => {
                                        const type = paperTypes.find(t => t.id === e.target.value);
                                        setConfig({
                                            ...config,
                                            paperType: e.target.value,
                                            totalMarks: type?.totalMarks || config.totalMarks
                                        });
                                    }}
                                    className="ap-select w-full"
                                >
                                    <option value="" disabled>Select Type</option>
                                    {paperTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name} ({type.totalMarks} Marks)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <PlusCircle size={14} /> Question Set
                                </label>
                                <select
                                    value={config.setLabel}
                                    onChange={(e) => setConfig({ ...config, setLabel: e.target.value })}
                                    className="ap-select w-full"
                                >
                                    {setOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Marks & Year</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={config.totalMarks}
                                        onChange={(e) => setConfig({ ...config, totalMarks: parseInt(e.target.value) || 0 })}
                                        placeholder="Marks"
                                        className="ap-input"
                                    />
                                    <input
                                        type="text"
                                        value={config.examYear}
                                        onChange={(e) => setConfig({ ...config, examYear: e.target.value })}
                                        placeholder="Year"
                                        className="ap-input"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Preview */}
                    <div className="ap-card bg-blue-600 border-none text-white p-7 shadow-2xl shadow-blue-100 flex flex-col justify-between min-h-[280px]">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl leading-tight uppercase tracking-tight">Assignment Preview</h4>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">ஒதுக்கீடு முன்னோட்டம்</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                                <div className="space-y-0.5">
                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">Target Class</div>
                                    <div className="font-extrabold text-white text-sm">Grade {config.classLevel}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">Examination</div>
                                    <div className="font-extrabold text-white text-sm truncate">{config.examTerm}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">Target Teachers</div>
                                    <div className="font-extrabold text-white text-sm">{selectedUserIds.length} Teachers</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">Subject Details</div>
                                    <div className="font-extrabold text-white text-sm truncate">{config.subject}</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAssign}
                            disabled={isAssigning || selectedUserIds.length === 0}
                            className="w-full mt-8 py-5 bg-white text-blue-700 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-blue-900/30"
                        >
                            {isAssigning ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    Assign Blueprint to Teachers
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column: Teacher Selection Panel */}
                <div className="xl:col-span-7 space-y-6">
                    <div className="ap-card flex flex-col h-[670px]">
                        <div className="p-5 border-b border-gray-100 bg-white/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                            <h3 className="font-bold text-gray-800 font-display flex items-center gap-2">
                                <Users size={18} className="text-blue-600" />
                                2. Select Teachers (ஆசிரியர்களைத் தேர்ந்தெடுக்கவும்)
                            </h3>
                            <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                                {selectedUserIds.length} / {users.length} Selected
                            </div>
                        </div>

                        <div className="p-4 border-b border-gray-50 bg-white">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or PEN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="ap-input pl-12 h-14 bg-gray-50/50 border-gray-100 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50/30 flex items-center justify-between border-b border-gray-50">
                            <button
                                onClick={handleSelectAll}
                                className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle size={14} />
                                {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                            </button>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Total {filteredUsers.length} Results
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredUsers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                                        <Users size={32} />
                                    </div>
                                    <p className="font-bold text-gray-400 text-sm">No teachers found matching your search.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {filteredUsers.map(user => {
                                        const isSelected = selectedUserIds.includes(user.id);
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => toggleUserSelection(user.id)}
                                                className={`p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50/80'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-300 ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 rotate-3' : 'bg-gray-100 text-gray-400 shadow-inner'
                                                        }`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className={`font-black tracking-tight transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                                            {user.name}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">PEN: {user.pen || 'N/A'}</span>
                                                            <span className="text-[10px] font-medium text-gray-400">{user.email || user.username}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                                        : 'border-gray-200 bg-white'
                                                    }`}>
                                                    {isSelected && <CheckCircle size={14} strokeWidth={3} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAssignmentManager;

