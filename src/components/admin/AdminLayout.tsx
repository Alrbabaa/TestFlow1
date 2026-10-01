import React from 'react';
import { Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TestFlowLogo } from '../common/TestFlowLogo';
import { AdminDashboard } from './AdminDashboard';

export const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <TestFlowLogo size="sm" lightText />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              مساحة خاصة
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block max-w-52 truncate text-xs text-slate-300">{user?.email}</span>
            <button onClick={() => void handleSignOut()} className="h-9 px-3 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>
      <main className="py-2">
        <AdminDashboard />
      </main>
    </div>
  );
};
