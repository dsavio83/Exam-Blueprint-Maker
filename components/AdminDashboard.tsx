
import React, { useState, useEffect } from 'react';
import {
    Users, FileText, FileType, Settings, CheckCircle
} from 'lucide-react';
import {
    getUsers, getBlueprints, getQuestionPaperTypes, getExamConfigs
} from '../services/db';
import { Blueprint } from '../types';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        blueprints: 0,
        paperTypes: 0,
        configs: 0
    });
    const [recentBlueprints, setRecentBlueprints] = useState<Blueprint[]>([]);

    useEffect(() => {
        const loadStats = async () => {
            const [users, blueprints, paperTypes, configs] = await Promise.all([
                getUsers(),
                getBlueprints('all'), 
                getQuestionPaperTypes(),
                getExamConfigs()
            ]);
            
            setStats({
                users: users.length,
                blueprints: blueprints.length,
                paperTypes: paperTypes.length,
                configs: configs.length
            });
            const sorted = [...blueprints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentBlueprints(sorted.slice(0, 5));
        };
        loadStats();
    }, []);

    const StatCard = ({ title, count, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 flex items-center justify-between" style={{ borderLeftColor: color }}>
            <div>
                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-extrabold text-gray-800 mt-2">{count}</p>
            </div>
            <div className={`p-4 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                <Icon size={28} style={{ color: color }} />
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">Admin Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" count={stats.users} icon={Users} color="#2563EB" />
                <StatCard title="Blueprints" count={stats.blueprints} icon={FileText} color="#059669" />
                <StatCard title="Paper Types" count={stats.paperTypes} icon={FileType} color="#7C3AED" />
                <StatCard title="Configs" count={stats.configs} icon={Settings} color="#D97706" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-100">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Recent Blueprints</h3>
                        {recentBlueprints.length > 0 && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded font-medium">Latest 5</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium">Class / Subject</th>
                                    <th className="p-3 font-medium">Term</th>
                                    <th className="p-3 font-medium text-center">Marks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentBlueprints.length === 0 ? (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">No blueprints found.</td></tr>
                                ) : (
                                    recentBlueprints.map(bp => (
                                        <tr key={bp.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-800">{new Date(bp.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-400">{new Date(bp.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold text-gray-700">Class {bp.classLevel}</div>
                                                <div className="text-xs text-blue-600">{bp.subject}</div>
                                            </td>
                                            <td className="p-3 text-gray-600">{bp.examTerm}</td>
                                            <td className="p-3 text-center">
                                                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                                                    {bp.totalMarks}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-100 flex flex-col">
                    <div className="p-4 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-700">System Status</h3>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center items-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle size={48} />
                        </div>
                        <div className="text-center">
                            <h4 className="font-bold text-gray-800 text-lg">System Operational</h4>
                            <p className="text-sm text-gray-500 mt-1">Version 1.0.0</p>
                        </div>
                        <div className="w-full mt-4 space-y-2">
                            <div className="flex justify-between text-sm py-2 border-b border-dashed">
                                <span className="text-gray-500">Last Database Sync</span>
                                <span className="font-mono text-gray-700">Just now</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-dashed">
                                <span className="text-gray-500">Storage Usage</span>
                                <span className="font-mono text-gray-700">12%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
