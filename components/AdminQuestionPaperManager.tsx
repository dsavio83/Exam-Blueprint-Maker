import React, { useState, useEffect } from 'react';
import {
    FileText, Lock, Unlock, Eye, EyeOff, Search, Trash2, User as UserIcon, Calendar, BookOpen, Clock, Share2, X, Plus, UserPlus, Edit2, CheckCircle, RotateCcw
} from 'lucide-react';
import { Blueprint, User } from '../types';
import { getBlueprints, getUsers, deleteBlueprint, toggleBlueprintLock, toggleBlueprintHidden, getSharedWithUsers, removeShare, shareBlueprint, resetBlueprintConfirmation } from '../services/db';

interface AdminQuestionPaperManagerProps {
    onEditBlueprint: (bp: Blueprint) => void;
}

const AdminQuestionPaperManager = ({ onEditBlueprint }: AdminQuestionPaperManagerProps) => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShareBp, setSelectedShareBp] = useState<string | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setBlueprints(getBlueprints());
        const allUsers = getUsers();
        setUsers(allUsers);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this question paper?')) {
            deleteBlueprint(id);
            loadData();
        }
    };

    const handleToggleLock = (id: string) => {
        toggleBlueprintLock(id);
        loadData();
    };

    const handleToggleHidden = (id: string) => {
        toggleBlueprintHidden(id);
        loadData();
    };

    const handleResetConfirmation = (id: string) => {
        if (window.confirm('Are you sure you want to reset the confirmation for this paper? This will allow users to edit the pattern again.')) {
            resetBlueprintConfirmation(id);
            loadData();
        }
    };

    const handleRemoveShare = (bpId: string, userId: string) => {
        if (window.confirm('Remove sharing access for this user?')) {
            removeShare(bpId, userId);
            loadData();
        }
    };

    const handleAddShare = (bpId: string, toUserId: string) => {
        const bp = blueprints.find(b => b.id === bpId);
        if (!bp) return;

        const fromUserId = bp.ownerId || '1';

        const success = shareBlueprint(bpId, fromUserId, toUserId);
        if (success) {
            loadData();
            setUserSearchTerm('');
        } else {
            alert('Could not share. User might already have access.');
        }
    };

    const getUserName = (userId?: string) => {
        if (!userId) return 'Unknown';
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Unknown';
    };

    const filteredBlueprints = blueprints.filter(bp => {
        const ownerName = getUserName(bp.ownerId).toLowerCase();
        const paperName = bp.questionPaperTypeName.toLowerCase();
        const subject = bp.subject.toLowerCase();
        const search = searchTerm.toLowerCase();

        return ownerName.includes(search) ||
            paperName.includes(search) ||
            subject.includes(search) ||
            bp.classLevel.toString().includes(search) ||
            (bp.setId || '').toLowerCase().includes(search);
    });

    const activeShareBp = blueprints.find(b => b.id === selectedShareBp);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">User Question Papers</h2>
                    <p className="text-gray-500">Manage and monitor question papers created by all users</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search papers/users/sets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Paper Details</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Created By</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Sharing</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredBlueprints.length > 0 ? (
                                filteredBlueprints.map((bp) => (
                                    <tr key={bp.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-blue-700">Class {bp.classLevel}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="font-bold text-gray-900">{bp.subject}</span>
                                                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase ml-1 border border-blue-100">{bp.setId || 'Set A'}</span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-semibold">{bp.questionPaperTypeName}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="font-medium text-gray-700">{bp.examTerm}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-gray-600">{bp.academicYear || '2025-26'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <UserIcon size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800">{getUserName(bp.ownerId)}</div>
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(bp.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedShareBp(bp.id)}
                                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${bp.sharedWith?.length ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                <Share2 size={12} />
                                                {bp.sharedWith?.length ? `${bp.sharedWith.length} Users` : 'Not Shared'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                {bp.isConfirmed ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 gap-1 uppercase w-full justify-center">
                                                        <CheckCircle size={10} /> Confirmed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 gap-1 uppercase w-full justify-center">
                                                        <Clock size={10} /> Draft
                                                    </span>
                                                )}
                                                {bp.isLocked ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 gap-1 uppercase w-full justify-center">
                                                        <Lock size={10} /> Locked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 gap-1 uppercase w-full justify-center">
                                                        <Unlock size={10} /> Editable
                                                    </span>
                                                )}
                                                {bp.isHidden ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 gap-1 uppercase w-full justify-center">
                                                        <EyeOff size={10} /> Hidden
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 gap-1 uppercase w-full justify-center">
                                                        <Eye size={10} /> Visible
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => onEditBlueprint(bp)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View/Edit Paper"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleLock(bp.id)}
                                                    className={`p-2 rounded-lg transition-colors ${bp.isLocked ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                                    title={bp.isLocked ? "Unlock for user" : "Lock for user"}
                                                >
                                                    {bp.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleToggleHidden(bp.id)}
                                                    className={`p-2 rounded-lg transition-colors ${bp.isHidden ? 'text-gray-400 hover:bg-gray-100' : 'text-blue-600 hover:bg-blue-50'}`}
                                                    title={bp.isHidden ? "Make visible" : "Hide from user"}
                                                >
                                                    {bp.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bp.id)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Paper"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                {bp.isConfirmed && (
                                                    <button
                                                        onClick={() => handleResetConfirmation(bp.id)}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Reset Confirmation"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={40} className="text-gray-200" />
                                            <p>No question papers found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sharing Details Modal */}
            {selectedShareBp && activeShareBp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Sharing Management</h3>
                                <p className="text-xs text-gray-500">Managing for: {activeShareBp.questionPaperTypeName}</p>
                            </div>
                            <button
                                onClick={() => setSelectedShareBp(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Current Shared Users */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <Share2 size={16} /> Currently Shared With
                                </h4>
                                <div className="space-y-3">
                                    {(() => {
                                        const sharedUsers = getSharedWithUsers(selectedShareBp);
                                        return sharedUsers.length > 0 ? (
                                            sharedUsers.map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                                                            <div className="text-[10px] text-secondary truncate">{user.username}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveShare(selectedShareBp, user.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove Access"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <Share2 size={32} className="mx-auto text-gray-200 mb-2" />
                                                <p className="text-xs text-gray-500 italic">Not shared with anyone</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Add New Users */}
                            <div className="border-l border-gray-100 md:pl-6">
                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <UserPlus size={16} /> Share with New User
                                </h4>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {users
                                        .filter(u =>
                                            u.id !== activeShareBp.ownerId &&
                                            !activeShareBp.sharedWith?.includes(u.id) &&
                                            (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                u.username.toLowerCase().includes(userSearchTerm.toLowerCase()))
                                        )
                                        .map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleAddShare(selectedShareBp, user.id)}
                                                className="w-full flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm group-hover:bg-blue-100 group-hover:text-blue-700">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-800">{user.name}</div>
                                                        <div className="text-[10px] text-gray-500">{user.username}</div>
                                                    </div>
                                                </div>
                                                <Plus size={16} className="text-gray-400 group-hover:text-blue-600" />
                                            </button>
                                        ))
                                    }
                                    {userSearchTerm && users.filter(u =>
                                        u.id !== activeShareBp.ownerId &&
                                        !activeShareBp.sharedWith?.includes(u.id) &&
                                        (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                            u.username.toLowerCase().includes(userSearchTerm.toLowerCase()))
                                    ).length === 0 && (
                                            <p className="text-xs text-center text-gray-400 py-4 italic">No matching users found</p>
                                        )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right flex-shrink-0">
                            <button
                                onClick={() => setSelectedShareBp(null)}
                                className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQuestionPaperManager;
