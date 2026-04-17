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

    // Initialize database connectivity and check for saved session
    useEffect(() => {
        const initializeApp = async () => {
            try {
                await initDB();
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    setCurrentUser(JSON.parse(savedUser));
                }
            } catch (err) {
                console.error("Application initialization failed:", err);
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