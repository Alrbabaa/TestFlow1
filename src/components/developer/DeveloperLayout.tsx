import React from 'react';
import { Code2, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TestFlowLogo } from '../common/TestFlowLogo';
import { DeveloperDashboard } from './DeveloperDashboard';

export const DeveloperLayout: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TestFlowLogo size="sm" />
            <span className="h-8 px-2.5 rounded-md bg-blue-50 text-blue-800 text-xs font-semibold flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              مساحة المطور
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block max-w-52 truncate text-xs text-slate-500">{user?.email}</span>
            <button onClick={() => void handleSignOut()} className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>
      <main className="py-2">
        <DeveloperDashboard />
      </main>
    </div>
  );
};
