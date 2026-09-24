import React, { useState, useEffect } from 'react';
import {
  Lock,
  Copy,
  Check,
  Headphones,
  RefreshCw,
  Crown,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  MessageCircle,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  LicenseState,
  ensureAndSyncDeviceLicense,
  isWhitelistedAdminMember
} from '../utils/licenseManager';
import { getOrCreateLocalMemberCode, fetchCurrentClientIp } from '../services/firebaseLicenseService';
import { getDeviceFingerprint, DeviceInfo } from '../utils/deviceFingerprint';

interface LockScreenGateProps {
  licenseState: LicenseState | null;
  onOpenAdmin: () => void;
  onLicenseUpdated: (newState: LicenseState) => void;
}

export const LockScreenGate: React.FC<LockScreenGateProps> = ({
  licenseState,
  onOpenAdmin,
  onLicenseUpdated
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isIpWhitelisted, setIsIpWhitelisted] = useState<boolean>(false);

  useEffect(() => {
    getDeviceFingerprint().then(setDeviceInfo);
    fetchCurrentClientIp().then((res) => {
      if (res.isWhitelisted) {
        setIsIpWhitelisted(true);
      }
    });
  }, []);

  const displayMemberCode =
    licenseState?.memberCode ||
    deviceInfo?.memberCode ||
    (deviceInfo ? getOrCreateLocalMemberCode(deviceInfo.deviceId) : getOrCreateLocalMemberCode());

  const isWhitelistedAdmin =
    isIpWhitelisted ||
    licenseState?.isWhitelistedAdmin === true ||
    licenseState?.isAdmin === true ||
    isWhitelistedAdminMember(licenseState);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(displayMemberCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setActionMessage(null);
    try {
      const updated = await ensureAndSyncDeviceLicense();
      onLicenseUpdated(updated);
      if (updated.isPro || updated.isAdmin) {
        setActionMessage({ text: '✓ Thiết bị của bạn đã được kích hoạt thành công!', isError: false });
      } else {
        setActionMessage({
          text: 'Chưa tìm thấy gói VIP mới trên máy chủ. Vui lòng nhắn Admin cấp thời gian rồi bấm Kiểm tra lại!',
          isError: true
        });
      }
    } catch (err: any) {
      setActionMessage({ text: 'Lỗi đồng bộ: ' + (err?.message || 'Lỗi mạng'), isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      id="lock-screen-gate"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#08080c] text-white select-none overflow-y-auto px-4 py-8 sm:py-12"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.08) 0%, rgba(8, 8, 12, 0.98) 70%)'
      }}
    >
      {/* Top ambient space - Only visible for Whitelisted Admin */}
      <div className="w-full max-w-md flex justify-end min-h-[30px]">
        {isWhitelistedAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-2.5 py-1 text-[11px] font-bold text-amber-400 bg-slate-900/80 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm animate-in fade-in"
            title="Dành cho Quản trị viên"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Quản trị viên</span>
          </button>
        )}
      </div>

      {/* Main Lock Card Container */}
      <div className="w-full max-w-md my-auto flex flex-col items-center text-center space-y-6">
        {/* Glowing Lock Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-2 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-[#1e1a29] to-[#121118] border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-500/20">
            <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-2.5 px-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase">
            YÊU CẦU KÍCH HOẠT
          </h1>
          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-sm mx-auto">
            Phiên bản dùng thử 3 ngày của bạn đã hết hạn. Vui lòng gửi mã bên dưới cho quản trị viên để mở khóa hoặc gia hạn thời gian sử dụng.
          </p>
        </div>

        {/* Member Code Box (Matching uploaded reference design) */}
        <div className="w-full bg-[#16161f] border border-[#272738] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="space-y-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest block">
              MÃ THÀNH VIÊN CỦA BẠN
            </span>
            <div className="flex items-center justify-center gap-2.5 py-1">
              <span className="font-mono text-xl sm:text-2xl font-black text-sky-400 tracking-wider select-all break-all">
                {displayMemberCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg transition cursor-pointer shrink-0"
                title="Sao chép Mã Thành Viên"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] font-semibold text-emerald-400 animate-in fade-in duration-200">
                ✓ Đã sao chép mã thành viên vào clipboard!
              </p>
            )}
          </div>

          {/* Primary Action Button: Liên Hệ Quản Trị Viên */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 active:scale-[0.98] transition cursor-pointer"
          >
            <Headphones className="w-5 h-5" />
            <span>LIÊN HỆ QUẢN TRỊ VIÊN ĐỂ MỞ VIP</span>
          </button>

          {/* Quick Realtime Sync Check */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-2.5 px-3 bg-[#1e1e2c] hover:bg-[#252538] text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang kiểm tra dữ liệu máy chủ...' : 'Đã được cấp quyền? Bấm để kiểm tra lại'}</span>
          </button>

          {/* Action Message Alert */}
          {actionMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-start gap-2 text-left ${
                actionMessage.isError
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {actionMessage.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{actionMessage.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer info matching reference */}
      <div className="w-full text-center space-y-1 pt-6 text-slate-500 text-xs">
        <p className="font-medium tracking-wide">vTranslate v6.6 Dùng thử</p>
        <p className="text-[10px] text-slate-600">Được bảo vệ & chứng thực bởi Firebase Cloud Realtime License</p>
      </div>

      {/* Modal Liên Hệ Quản Trị Viên */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#161622] border border-slate-800 rounded-2xl p-5 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">Liên Hệ Quản Trị Viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Vui lòng gửi <b>Mã Thành Viên</b> cho Quản trị viên qua các kênh bên dưới để được cấp quyền hoặc gia hạn gói VIP nhanh nhất:
            </p>

            <div className="bg-[#0f0f18] p-3 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">MÃ THÀNH VIÊN CỦA BẠN:</span>
              <span className="font-mono text-base font-black text-sky-400 block select-all">
                {displayMemberCode}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Nhắn qua Zalo Quản Trị Viên</span>
              </a>

              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Nhắn qua Telegram</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
