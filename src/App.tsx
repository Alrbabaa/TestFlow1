import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomeView } from './components/home/HomeView';
import { PublicCampaignPage } from './components/home/PublicCampaignPage';
import { AppDetailModal } from './components/home/AppDetailModal';
import { DeveloperRegisterModal } from './components/developer/DeveloperRegisterModal';
import { LegalModal } from './components/legal/LegalModal';
import { HowItWorksModal } from './components/common/HowItWorksModal';
import { Toast } from './components/common/Toast';
import { AppCampaign } from './types';
import { firebaseConfigError } from './lib/firebase';

// Dashboards are not needed for the public campaign page. Loading them only
// after a privileged route is opened materially reduces the first page load.
const DeveloperLayout = lazy(() => import('./components/developer/DeveloperLayout').then((module) => ({ default: module.DeveloperLayout })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));

const campaignSlugFromLocation = (pathname: string, search: string) => {
  const query = new URLSearchParams(search);
  const querySlug = query.get('app') || query.get('test');
  const routeMatch = pathname.match(/^\/(?:campaign|test)\/([^/]+)\/?$/);
  return querySlug || routeMatch?.[1] || null;
};

function MainAppContent() {
  const {
    campaigns,
    selectedCampaignSlug,
    setSelectedCampaignSlug,
    activeTab,
    setActiveTab,
  } = useApp();
  const { user, userRole, loading, roleLoading, signInWithGoogle, refreshUserRole } = useAuth();
  const [pathname, setPathname] = useState(window.location.pathname);
  // Resolve invitation routes synchronously. Reading this in an effect caused
  // the home page to flash before a campaign link was rendered on mobile.
  const routeCampaignSlug = campaignSlugFromLocation(pathname, window.location.search);

  // Selected Campaign for Detail/Apply Modal
  const [selectedCampaignForModal, setSelectedCampaignForModal] = useState<AppCampaign | null>(null);

  // Modals state
  const [isDevRegisterOpen, setIsDevRegisterOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [legalModalState, setLegalModalState] = useState<{
    isOpen: boolean;
    tab: 'privacy' | 'terms' | 'deletion';
  }>({
    isOpen: false,
    tab: 'privacy',
  });

  // Resolve shared campaign URLs before rendering the public campaign page.
  useEffect(() => {
    const resolveCampaignSlug = () => {
      setSelectedCampaignSlug(campaignSlugFromLocation(window.location.pathname, window.location.search));
    };
    resolveCampaignSlug();
    window.addEventListener('popstate', resolveCampaignSlug);
    return () => window.removeEventListener('popstate', resolveCampaignSlug);
  }, [setSelectedCampaignSlug]);

  // Find standalone campaign if slug is selected
  const campaignSlug = routeCampaignSlug || selectedCampaignSlug;
  const standaloneCampaign = campaignSlug
    ? campaigns.find((c) => c.slug === campaignSlug)
    : null;

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setPathname(path);
  };

  const openCampaign = (slug: string) => {
    window.history.pushState({}, '', `/campaign/${encodeURIComponent(slug)}`);
    setPathname(window.location.pathname);
    setSelectedCampaignSlug(slug);
  };

  const closeCampaign = () => {
    window.history.pushState({}, '', '/');
    setPathname('/');
    setSelectedCampaignSlug(null);
  };

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (userRole === 'admin' && pathname !== '/admin') {
      window.history.replaceState({}, '', '/admin');
      setPathname('/admin');
      return;
    }
    if (pathname === '/admin' && userRole !== 'admin') {
      window.history.replaceState({}, '', '/');
      setPathname('/');
    } else if (pathname === '/developer' && !user) {
      window.history.replaceState({}, '', '/');
      setPathname('/');
    }
    if (activeTab !== 'home') setActiveTab('home');
  }, [activeTab, loading, pathname, roleLoading, setActiveTab, userRole]);

  const handleDeveloperAccess = async () => {
    const signedInUser = user || await signInWithGoogle();
    if (!signedInUser) return;
    const role = await refreshUserRole();
    // New accounts have no Firestore role yet. The developer route owns the
    // request form, so it cannot disappear during an auth-state re-render.
    navigate('/developer');
  };

  // This entry point is intentionally discreet. Google authentication only
  // identifies the user; server-side role checks remain authoritative.
  const handleAdminAccess = async () => {
    const signedInUser = await signInWithGoogle();
    if (!signedInUser) return;

    if (await refreshUserRole() === 'admin') {
      navigate('/admin');
      return;
    }

    window.alert('هذا الحساب غير مصرح له بالوصول إلى لوحة الإدارة.');
  };

  if (pathname === '/admin') {
    if (loading || roleLoading) {
      return <div className="min-h-screen bg-slate-950" aria-label="جارٍ التحقق من الصلاحية" />;
    }
    return userRole === 'admin' ? <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><AdminLayout /></Suspense> : null;
  }

  if (pathname === '/developer') {
    if (loading || roleLoading) {
      return <div className="min-h-screen bg-slate-100" aria-label="جارٍ التحقق من الحساب" />;
    }
    if (userRole === 'developer' || userRole === 'developer_pending') {
      return <Suspense fallback={<div className="min-h-screen bg-slate-100" />}><DeveloperLayout /></Suspense>;
    }
    // A signed-in account with no role is a new developer applicant.
    return user ? <DeveloperRegisterModal isOpen onClose={() => navigate('/')} /> : null;
  }

  // Do not briefly render the home page when an invitation URL is opened.
  // Campaigns arrive from Firestore asynchronously, so use a neutral loading
  // view until the public campaign document is available.
  if (routeCampaignSlug && !standaloneCampaign) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-slate-50 px-4" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" aria-hidden="true" />
          <h1 className="mt-4 text-base font-black text-slate-900">جارٍ فتح صفحة الحملة</h1>
          <p className="mt-1 text-xs text-slate-600">يرجى الانتظار لحظة…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex w-full max-w-full min-w-0 flex-col overflow-x-hidden bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onDeveloperAccess={() => void handleDeveloperAccess()}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* If viewing a standalone public campaign URL (e.g. platform.com/test/:slug) */}
        {standaloneCampaign ? (
          <PublicCampaignPage
            campaign={standaloneCampaign}
            onBackToAll={closeCampaign}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                onSelectCampaign={(camp) => setSelectedCampaignForModal(camp)}
                onOpenCampaign={openCampaign}
                onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
                onOpenDevRegister={() => void handleDeveloperAccess()}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenLegal={(tab) => setLegalModalState({ isOpen: true, tab })}
        onDeveloperAccess={() => void handleDeveloperAccess()}
        onAdminAccess={() => void handleAdminAccess()}
      />

      {/* Modals */}
      <AppDetailModal
        campaign={selectedCampaignForModal}
        isOpen={Boolean(selectedCampaignForModal)}
        onClose={() => setSelectedCampaignForModal(null)}
        onSuccessApply={() => {
          // Open details or redirect
        }}
      />

      <DeveloperRegisterModal
        isOpen={isDevRegisterOpen}
        onClose={() => setIsDevRegisterOpen(false)}
      />

      <LegalModal
        isOpen={legalModalState.isOpen}
        onClose={() => setLegalModalState({ ...legalModalState, isOpen: false })}
        defaultTab={legalModalState.tab}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onStartTesting={() => {
          setSelectedCampaignSlug(null);
          setActiveTab('home');
        }}
      />

      {/* Global In-App Toast Feedback */}
      <Toast />
    </div>
  );
}

export default function App() {
  if (firebaseConfigError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6" dir="rtl">
        <section className="w-full max-w-xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6 space-y-3">
          <h1 className="text-xl font-bold text-amber-300">إعداد Firebase مطلوب</h1>
          <p className="text-sm text-slate-300">لا يمكن تشغيل TestFlow قبل إضافة متغيرات Firebase إلى بيئة Vercel أو ملف .env.local.</p>
          <code className="block rounded-lg bg-slate-950 p-3 text-xs text-amber-200 break-words">{firebaseConfigError}</code>
          <p className="text-xs text-slate-400">استخدم أسماء المتغيرات الموجودة في .env.example ثم أعد النشر.</p>
        </section>
      </main>
    );
  }
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}
