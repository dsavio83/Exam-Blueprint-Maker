
import React, { useState, useEffect } from 'react';
import {
    Trash2, Plus, Edit2, Eye, EyeOff
} from 'lucide-react';
import {
    User, Role
} from '../types';
import {
    getUsers, saveUsers
} from '../services/db';

const AdminUserManager = () => {
    const [userList, setUserList] = useState<User[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        username: '',
        password: '',
        name: '',
        email: '',
        role: Role.USER
    });

    useEffect(() => {
        getUsers().then(setUserList);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username || !formData.name || !formData.role) return alert("Please fill required fields");

        let newUsers = [...userList];
        if (editingUser) {
            newUsers = newUsers.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u);
        } else {
            if (userList.find(u => u.username === formData.username)) return alert("Username already exists");
            newUsers.push({
                ...formData as User,
                id: Math.random().toString(36).substr(2, 9)
            });
        }

        setUserList(newUsers);
        saveUsers(newUsers).then(() => {
            // Optional: refresh list to confirm
            getUsers().then(setUserList);
        });
        setIsFormOpen(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', name: '', email: '', role: Role.USER });
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData(user);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        const newUsers = userList.filter(u => u.id !== id);
        setUserList(newUsers);
        saveUsers(newUsers).then(() => {
            getUsers().then(setUserList);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ username: '', password: '', name: '', email: '', role: Role.USER });
                        setIsFormOpen(true);
                    }}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center shadow hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    <span>Add User</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-4 sm:p-6 rounded shadow border-l-4 border-blue-500 mb-6">
                    <h3 className="font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                            <input
                                className="border w-full p-2 rounded mt-1"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                className="border w-full p-2 rounded mt-1"
                                type="email"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username *</label>
                            <input
                                className="border w-full p-2 rounded mt-1"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                                disabled={!!editingUser}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password {editingUser ? '(Leave blank to keep current)' : '*'}</label>
                            <div className="relative mt-1">
                                <input
                                    className="border w-full p-2 pr-10 rounded"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password || ''}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role *</label>
                            <select
                                className="border w-full p-2 rounded mt-1"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                            >
                                <option value={Role.ADMIN}>Admin</option>
                                <option value={Role.USER}>User</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded shadow border overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Name / Email</th>
                                <th className="p-4 font-semibold text-gray-600">Username</th>
                                <th className="p-4 font-semibold text-gray-600">Role</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userList.map(u => (
                                <tr key={u.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{u.name}</div>
                                        <div className="text-xs text-gray-500">{u.email || '-'}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 font-mono text-sm">{u.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => handleEdit(u)} className="text-blue-600 hover:text-blue-800" title="Edit User">
                                                <Edit2 size={16} />
                                            </button>
                                            {u.username !== 'admin' && (
                                                <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700" title="Delete User">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y">
                    {userList.map(u => (
                        <div key={u.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-gray-900">{u.name}</div>
                                    <div className="text-sm text-gray-500">{u.email || 'No email provided'}</div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                    {u.role}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                                <div className="text-gray-600">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Username</span>
                                    <span className="font-mono">{u.username}</span>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => handleEdit(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                        <Edit2 size={20} />
                                    </button>
                                    {u.username !== 'admin' && (
                                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {userList.length === 0 && (
                        <div className="p-8 text-center text-gray-500 italic">
                            No users found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUserManager;
