import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SecurityAuditEntry } from '../../types';
import { runComprehensiveSecurityAudit, validateSecureUrl, maskSensitiveEmail } from '../../utils/security';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Search,
  Filter,
  X,
  Server,
  Key,
  Database,
  Terminal,
  Clock,
  Sparkles,
  Zap,
  Radio,
  Sliders,
  Download,
  Trash2,
  Fingerprint,
  Cpu,
  UserCheck,
  Ban,
  Activity,
} from 'lucide-react';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({ isOpen, onClose }) => {
  const {
    securityLogs,
    isEmailMasked,
    setIsEmailMasked,
    isLockdownMode,
    setIsLockdownMode,
    isAntiBotEnabled,
    setIsAntiBotEnabled,
    isWatermarkEnforced,
    setIsWatermarkEnforced,
    isTwoFactorEnabled,
    setIsTwoFactorEnabled,
    clearSecurityLogs,
    blockSuspiciousIp,
    simulateCyberAttackTest,
    campaigns,
    applications,
    developers,
    currentUserRole,
    logSecurityEvent,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'audit_logs' | 'scanner' | 'defense' | 'compliance'>('audit_logs');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchLog, setSearchLog] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [customIpInput, setCustomIpInput] = useState('');
  const [showIpBlockDialog, setShowIpBlockDialog] = useState(false);
  const [ipBlockReason, setIpBlockReason] = useState('محاولة فحص ثغرات آلية متكررة');

  const [scanResult, setScanResult] = useState<ReturnType<typeof runComprehensiveSecurityAudit> | null>(() => {
    // Initial auto audit
    return runComprehensiveSecurityAudit({
      campaigns,
      applications,
      isLockdownMode,
      isAntiBotEnabled,
      isEmailMasked,
      isWatermarkEnforced,
    });
  });

  if (!isOpen) return null;

  const filteredLogs = securityLogs.filter((log) => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
    if (searchLog.trim()) {
      const q = searchLog.toLowerCase();
      const matchActor = log.actor.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchEvent = log.eventType.toLowerCase().includes(q);
      const matchIp = log.ipAddress.toLowerCase().includes(q);
      if (!matchActor && !matchDetails && !matchEvent && !matchIp) return false;
    }
    return true;
  });

  const handleRunSecurityScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const result = runComprehensiveSecurityAudit({
        campaigns,
        applications,
        isLockdownMode,
        isAntiBotEnabled,
        isEmailMasked,
        isWatermarkEnforced,
      });
      setScanResult(result);

      logSecurityEvent({
        actor: 'مسؤول الأمن السيبراني (CISO)',
        actorRole: currentUserRole,
        eventType: 'security_scan_executed',
        status: 'ALLOWED',
        details: `تم إجراء تدقيق أمني عميق للمنصة بنجاح. النتيجة: ${result.score}% (درجة الأمان ${result.grade}).`,
        ipAddress: '10.0.0.1 (SecOps Console)',
        severity: 'low',
      });
    }, 1200);
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(securityLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `testflow-security-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logSecurityEvent({
      actor: 'مسؤول الأمن السيبراني (CISO)',
      actorRole: currentUserRole,
      eventType: 'bulk_email_export',
      status: 'ALLOWED',
      details: 'تم تصدير سجل التدقيق الأمني بصيغة JSON للأرشفة والامتثال السيبراني.',
      ipAddress: '10.0.0.1 (Local Audit)',
      severity: 'low',
    });
  };

  const handleBlockCustomIp = () => {
    if (!customIpInput.trim()) return;
    blockSuspiciousIp(customIpInput.trim(), ipBlockReason);
    setCustomIpInput('');
    setShowIpBlockDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center relative">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base">مركز العمليات والأمن السيبراني (CISO SOC)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  درع الدفاع السيبراني نشط
                </span>
                {isLockdownMode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse">
                    وضع الطوارئ مُفعل
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                إدارة التهديدات، كشف البوتات، منع تسريب النسخ المغلقة، وسجل التدقيق الأمني الحي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-semibold">مؤشر السلامة السيبرانية</span>
            <div className="font-black text-emerald-600 flex items-center gap-1.5 text-sm mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{scanResult ? `${scanResult.score}% (${scanResult.grade})` : '100% (A+)'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-semibold">حماية الروابط المغلقة</span>
            <div className="font-black text-blue-700 flex items-center gap-1.5 text-sm mt-0.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>{isLockdownMode ? 'مجمدة (طوارئ)' : 'مشفرة ومحمية بـ RBAC'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-semibold">درع مكافحة البوتات (Anti-Bot)</span>
            <div className={`font-black flex items-center gap-1.5 text-sm mt-0.5 ${isAntiBotEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
              <Cpu className="w-4 h-4" />
              <span>{isAntiBotEnabled ? 'مفعل (فلترة الإيميلات المؤقتة)' : 'معطل'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">حجب الهوية (PII Masking)</span>
              <span className="font-bold text-xs text-slate-800">
                {isEmailMasked ? 'مفعل (a***d@)' : 'معطل (إيميل كامل)'}
              </span>
            </div>
            <button
              onClick={() => setIsEmailMasked(!isEmailMasked)}
              className={`p-1.5 rounded-xl border transition-colors ${
                isEmailMasked
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title="تفعيل أو تعطيل إخفاء الإيميلات الحساسة في الواجهة"
            >
              {isEmailMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-2 bg-slate-50/50 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'audit_logs'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            سجل التدقيق الأمني الحي ({securityLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'scanner'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            فاحص الثغرات والتسريب
          </button>

          <button
            onClick={() => setActiveTab('defense')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'defense'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            أدوات الدفاع السيبراني والاستجابة
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'compliance'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            حوكمة الامتثال (PDPL &amp; ISO 27001)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: AUDIT LOGS */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4">
              {/* Actions & Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث في سجلات التدقيق (الفاعل، IP، التفاصيل، الحدث)..."
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="all">جميع مستويات الخطورة</option>
                    <option value="low">منخفض (Low)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="high">مرتفع (High)</option>
                    <option value="critical">حرج (Critical)</option>
                  </select>

                  <button
                    onClick={handleExportLogs}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    title="تصدير السجل بتنسيق JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير</span>
                  </button>

                  <button
                    onClick={() => setShowIpBlockDialog(true)}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    title="حظر عنوان IP مشبوه فوراً"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>حظر IP</span>
                  </button>
                </div>
              </div>

              {/* Simulation Banner */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-slate-700 font-medium">
                    اختبار الاستجابة اللحظية لجدار حماية الويب (WAF) والتصدي لمحاولات الحقن:
                  </span>
                </div>
                <button
                  onClick={simulateCyberAttackTest}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs"
                >
                  محاكاة هجوم واختبار الصد ⚡
                </button>
              </div>

              {/* IP Block Modal / Dialog */}
              {showIpBlockDialog && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-rose-900 text-xs flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-600" />
                      فرض حظر أمني فوري على عنوان IP
                    </h5>
                    <button
                      onClick={() => setShowIpBlockDialog(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="أدخل عنوان IP (مثال: 198.51.100.89)"
                      value={customIpInput}
                      onChange={(e) => setCustomIpInput(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="سبب الحظر"
                      value={ipBlockReason}
                      onChange={(e) => setIpBlockReason(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowIpBlockDialog(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleBlockCustomIp}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700"
                    >
                      تأكيد الحظر فوراً
                    </button>
                  </div>
                </div>
              )}

              {/* Logs Stream */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredLogs.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    لا توجد سجلات مطابقة لمعايير البحث
                  </div>
                ) : (
                  filteredLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-1.5 text-xs text-right"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                              entry.status === 'ALLOWED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.status === 'BLOCKED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {entry.status}
                          </span>
                          <span className="font-bold text-slate-900">{entry.actor}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({entry.actorRole})
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              entry.severity === 'critical'
                                ? 'bg-rose-600 text-white'
                                : entry.severity === 'high'
                                ? 'bg-orange-500 text-white'
                                : entry.severity === 'medium'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {entry.severity}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{entry.ipAddress}</span>
                          <span>•</span>
                          <span>{entry.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed text-[11px] pr-1">
                        {entry.details}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VULNERABILITY & LEAK SCANNER */}
          {activeTab === 'scanner' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-base">
                    فاحص سلامة الروابط ومنع تسريب النسخ التجريبية
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    يقوم الفاحص بالتحقق التلقائي من عدم تسريب روابط Google Play المغلقة للعامة،
                    والتأكد من تطبيق بروتوكول HTTPS المشفر، وفحص نطاقات الإيميلات لمنع البوتات،
                    وخلو جميع نصوص البلاغات من أكواد الحقن.
                  </p>
                </div>

                <button
                  onClick={handleRunSecurityScan}
                  disabled={isScanning}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'جاري الفحص العميق للمنصة...' : 'إعادة تشغيل الفحص الأمني الشامل'}
                </button>
              </div>

              {/* Scan Results */}
              {scanResult && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      نتيجة التدقيق الأمني: درجة {scanResult.score}% ({scanResult.grade})
                    </div>
                    <span className="text-[11px] text-emerald-700 font-mono">
                      وقت الفحص: {scanResult.scannedAt}
                    </span>
                  </div>

                  {/* Findings if any */}
                  {scanResult.findings.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-amber-900 block">
                        ملاحظات وتنبيهات أمنية نشطة:
                      </span>
                      <div className="space-y-1.5">
                        {scanResult.findings.map((f, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2"
                          >
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong>{f.title}</strong>: {f.details}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-900 block">
                      الفحوصات الأمنية التي تم اجتيازها بنجاح:
                    </span>
                    <ul className="space-y-2 text-xs text-emerald-800">
                      {scanResult.passedChecks.map((chk, i) => (
                        <li key={i} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{chk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE DEFENSE & THREAT CONTROLS */}
          {activeTab === 'defense' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Control 1: Emergency Lockdown Mode */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isLockdownMode
                      ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                      <Lock className={`w-5 h-5 ${isLockdownMode ? 'text-rose-600' : 'text-slate-600'}`} />
                      <span>وضع الطوارئ وتجميد الروابط (Lockdown)</span>
                    </div>
                    <button
                      onClick={() => setIsLockdownMode(!isLockdownMode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isLockdownMode
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isLockdownMode ? 'مُفعل (تعطيل؟)' : 'تفعيل فوري'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    في حال الشك بتسريب نسخة التطبيق غير المنشورة، يقوم هذا الإجراء بتجميد كافة روابط
                    التنزيل فوراً لجميع المستخدمين حتى استكمال التحقيق الأمني.
                  </p>
                </div>

                {/* Control 2: Anti-Bot & Sybil Shield */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                      <Cpu className="w-5 h-5 text-blue-600" />
                      <span>درع مكافحة البوتات والإيميلات المؤقتة</span>
                    </div>
                    <button
                      onClick={() => setIsAntiBotEnabled(!isAntiBotEnabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isAntiBotEnabled
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isAntiBotEnabled ? 'مفعل (نشط)' : 'معطل'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    يحظر تسجيل المختبرين بواسطة خدمات البريد المؤقت (Disposable Emails) لضمان أن يكون كل
                    مختبر إنساناً حقيقياً يلتزم بمدة الـ 14 يوماً المطلوبة من Google Play.
                  </p>
                </div>

                {/* Control 3: Anti-Leak Digital Forensic Watermark */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                      <Fingerprint className="w-5 h-5 text-indigo-600" />
                      <span>العلامة المائية الرقمية لتتبع التسريب</span>
                    </div>
                    <button
                      onClick={() => setIsWatermarkEnforced(!isWatermarkEnforced)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isWatermarkEnforced
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isWatermarkEnforced ? 'مفعلة' : 'معطلة'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    توليد بصمة تشفير فريدة لكل مختبر يتم عرضها على شاشات التنزيل التجريبي وروابط
                    التحميل، مما يسمح بتحديد هوية أي مسرب في حال التقاط لقطات شاشة غير مصرح بها.
                  </p>
                </div>

                {/* Control 4: Two-Factor Authentication (2FA) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                      <Key className="w-5 h-5 text-purple-600" />
                      <span>المصادقة الثنائية (2FA) للمطورين والإدارة</span>
                    </div>
                    <button
                      onClick={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isTwoFactorEnabled
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isTwoFactorEnabled ? 'مفعلة إجبارياً' : 'اختيارية'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    فرض التحقق بخطوتين لحماية حسابات المطورين من الاستيلاء أو اختراق بيانات حملات
                    الاختبار وتصدير إيميلات المختبرين.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPLIANCE & PRIVACY */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Database className="w-4 h-4 text-blue-600" />
                    عزل البيانات وصلاحيات المطورين (RBAC)
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    يتم عزل بيانات المختبرين تلقائياً بحيث لا يمكن لأي مطور الوصول إلا إلى المختبرين
                    المرتبطين بحملاته الخاصة حصراً. يُحجب الوصول لغير المعتمدين والموقوفين.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    التشفير وسرية النسخ غير المنشورة (NDA)
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    جميع اتصالات المنصة مشفرة عبر بروتوكول TLS 1.3 مع شهادات أمان معتمدة. اتفاقية
                    السرية ملزمة لكافة المختبرين بعدم مشاركة أو تسريب ميزات التطبيق قبل الإطلاق الرسمي.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Key className="w-4 h-4 text-purple-600" />
                    الامتثال لنظام حماية البيانات الشخصية (PDPL &amp; GDPR)
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    الالتزام التام بحق النسيان ومحو البيانات الشخصية (Right to Erasure)، وطلب الموافقة
                    الصريحة عند تسجيل المختبر، وتشفير أسماء المستخدمين وإخفاء الإيميلات الحساسة.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Server className="w-4 h-4 text-sky-600" />
                    سجلات التدقيق غير القابلة للتلاعب (Audit Trail)
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    توثيق كل عملية تصدير لإيميلات المختبرين، أو تعديل في حالات القبول، أو فحص أمني،
                    لضمان المساءلة والشفافية وفق معايير الحوكمة السحابية.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>نظام الحماية والأمن السيبراني - معتمد ومتوافق مع معايير AppSec &amp; PDPL</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
