
import React, { useState, useEffect } from 'react';
import {
    Users, FileText, FileType, Settings, CheckCircle, Clock
} from 'lucide-react';
import {
    getUsers, getBlueprints, getQuestionPaperTypes, getExamConfigs, getHealth
} from '../services/db';
import { Blueprint, User } from '../types';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        blueprints: 0,
        paperTypes: 0,
        configs: 0
    });
    const [health, setHealth] = useState({ status: 'connecting', database: 'initializing' });
    const [recentBlueprints, setRecentBlueprints] = useState<Blueprint[]>([]);
    const [allBlueprints, setAllBlueprints] = useState<Blueprint[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [userData, blueprintsData, paperTypesData, configsData, healthData] = await Promise.all([
                    getUsers(),
                    getBlueprints('all'),
                    getQuestionPaperTypes(),
                    getExamConfigs(),
                    getHealth()
                ]);

                setStats({
                    users: userData.length,
                    blueprints: blueprintsData.length,
                    paperTypes: paperTypesData.length,
                    configs: configsData.length
                });
                setHealth(healthData);
                setUsers(userData);
                setAllBlueprints(blueprintsData);

                // Default to term + year of the last created blueprint
                if (blueprintsData.length > 0) {
                    const sorted = [...blueprintsData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    const latest = sorted[0];
                    setSelectedFilter(`${latest.examTerm}|${latest.academicYear || '2025-26'}`);
                }
            } catch (err) {
                console.error("Failed to load dashboard stats:", err);
                const healthData = await getHealth();
                setHealth(healthData);
            }
        };
        loadStats();
    }, []);

    // Extract unique Term + Academic Year combinations
    const filterOptions = React.useMemo(() => {
        const options = new Set<string>();
        allBlueprints.forEach(bp => {
            const year = bp.academicYear || '2025-26';
            options.add(`${bp.examTerm}|${year}`);
        });
        return Array.from(options).sort();
    }, [allBlueprints]);

    useEffect(() => {
        let filtered = [...allBlueprints];
        if (selectedFilter && selectedFilter !== 'all') {
            const [term, year] = selectedFilter.split('|');
            filtered = filtered.filter(bp => bp.examTerm === term && (bp.academicYear || '2025-26') === year);
        }
        const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentBlueprints(sorted.slice(0, 5));
    }, [selectedFilter, allBlueprints]);

    const StatCard = ({ title, count, icon: Icon, color }: any) => (
        <div className="ap-card p-6 flex items-center justify-between group hover:border-blue-300 transition-all duration-300 cursor-default">
            <div className="space-y-1">
                <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-widest font-display">{title}</h3>
                <p className="text-3xl font-extrabold text-gray-900 font-display tracking-tight group-hover:text-blue-600 transition-colors">{count}</p>
            </div>
            <div className="p-3.5 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ backgroundColor: `${color}15` }}>
                <Icon size={24} style={{ color: color }} strokeWidth={2.5} />
            </div>
        </div>
    );

    const isHealthy = health.status === 'ok';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-0">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-display tracking-tight">Overview</h2>
                    <p className="text-gray-500 mt-1 font-medium italic">Welcome to the administrative control center.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-100/50 px-3 py-1.5 rounded-full">
                    <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {isHealthy ? 'SYSTEM LIVE' : 'SYSTEM ISSUES'}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Users" count={stats.users} icon={Users} color="#2563EB" />
                <StatCard title="Total Papers" count={stats.blueprints} icon={FileText} color="#059669" />
                <StatCard title="Paper Types" count={stats.paperTypes} icon={FileType} color="#7C3AED" />
                <StatCard title="System Config" count={stats.configs} icon={Settings} color="#ea580c" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 ap-card overflow-hidden h-fit">
                    <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30">
                        <h3 className="font-bold text-gray-800 font-display flex items-center gap-2">
                            <Clock size={16} className="text-blue-500" />
                            Recent Blueprints
                        </h3>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                className="text-[11px] font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none bg-white text-gray-700 shadow-sm"
                            >
                                <option value="all">All Exams</option>
                                {filterOptions.map(opt => {
                                    const [term, year] = opt.split('|');
                                    return (
                                        <option key={opt} value={opt}>{term} {year}</option>
                                    );
                                })}
                            </select>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">Latest Activity</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 border-b border-gray-50 bg-gray-50/10">
                                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest">Teacher / PEN</th>
                                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest">Class</th>
                                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest">Subject</th>
                                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest">Question Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentBlueprints.length === 0 ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-medium italic">No recent activity found.</td></tr>
                                ) : (
                                    recentBlueprints.map(bp => {
                                        const owner = users.find(u => u.id === bp.ownerId);
                                        return (
                                            <tr key={bp.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-800">{owner ? owner.name : 'Unknown'}</div>
                                                    <div className="text-[11px] text-gray-400 font-medium">{owner?.pen || 'N/A'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Class {bp.classLevel}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-500">{bp.subject}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">{bp.questionPaperTypeName}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>




                <div className="ap-card flex flex-col h-fit">
                    <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                        <h3 className="font-bold text-gray-800 font-display">System Logic</h3>
                    </div>
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className={`absolute inset-0 ${isHealthy ? 'bg-green-400' : 'bg-red-400'} blur-2xl opacity-20 animate-pulse`}></div>
                            <div className={`relative w-24 h-24 rounded-3xl ${isHealthy ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} flex items-center justify-center shadow-inner`}>
                                <CheckCircle size={48} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-xl font-display tracking-tight">
                            {isHealthy ? 'Backend Operational' : 'Backend Issues'}
                        </h4>
                        <p className="text-sm text-gray-400 mt-2 font-medium leading-relaxed">
                            {isHealthy
                                ? 'System resources are optimized and database connections are healthy.'
                                : 'There are issues connecting to the backend or database.'}
                        </p>

                        <div className="w-full mt-8 space-y-3">
                            <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                <span className="text-gray-500 font-bold uppercase tracking-wider">Database</span>
                                <span className={`font-mono ${isHealthy ? 'text-green-600 bg-green-100/50' : 'text-red-600 bg-red-100/50'} font-bold px-2 py-0.5 rounded uppercase`}>
                                    {health.database}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                <span className="text-gray-500 font-bold uppercase tracking-wider">Sync Integrity</span>
                                <span className={`font-mono ${isHealthy ? 'text-blue-600 bg-blue-100/50' : 'text-gray-600 bg-gray-100/50'} font-bold px-2 py-0.5 rounded`}>
                                    {isHealthy ? 'VERIFIED' : 'PENDING'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 w-full">
                            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Build Version</div>
                            <div className="text-sm font-black text-gray-400 mt-1">v.1.0-STABLE</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
