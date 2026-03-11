import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {

    return (
        <div className="flex h-screen bg-background overflow-hidden dark:bg-dark-bg">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background dark:bg-dark-bg p-6">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Logout Button (Visible only on small screens if needed, otherwise handled in Sidebar) */}
            {/* Assuming Sidebar handles main navigation, but we might want a global header or similar for logout on mobile if Sidebar is hidden */}
        </div>
    );
};
