import React, { useState, useEffect } from 'react';
import { Role, User } from './types';
import { initDB, logout } from './services/db';
import { RefreshCw } from 'lucide-react';
import Login from './components/Login';
import AdminPortal from './components/AdminPortal';
import UserDashboard from './components/UserDashboard';

/**
 * Main Application Component
 * Handles global authentication state and top-level routing between
 * Login, Admin Portal, and User Dashboard.
 */
const App = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [initError, setInitError] = useState('');

    // Initialize database connectivity and check for saved session
    useEffect(() => {
        const initializeApp = async () => {
            try {
                setInitError('');
                await initDB();
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    setCurrentUser(JSON.parse(savedUser));
                }
            } catch (err) {
                console.error("Application initialization failed:", err);
                setInitError(err instanceof Error ? err.message : 'Failed to connect to MongoDB.');
            } finally {
                setInitialized(true);
            }
        };
        initializeApp();
    }, []);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
    };

    const handleLogout = () => {
        logout();
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    // Splash screen while initializing DB connection
    if (!initialized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wider">Exam Blueprint System</h2>
                <p className="text-gray-500 mt-2">Establishing secure connection...</p>
            </div>
        );
    }

    if (initError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
                    <h1 className="text-2xl font-bold text-gray-900">Database Connection Error</h1>
                    <p className="mt-3 text-sm text-gray-600">
                        The application could not load data from MongoDB. Seed or fallback data is disabled.
                    </p>
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {initError}
                    </div>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Unauthenticated view
    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    // Role-based routing
    if (currentUser.role === Role.ADMIN) {
        return <AdminPortal user={currentUser} onLogout={handleLogout} />;
    }

    return <UserDashboard user={currentUser} onLogout={handleLogout} />;
};

export default App;
