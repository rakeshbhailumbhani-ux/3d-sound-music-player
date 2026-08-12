import React, { useRef } from 'react';
import { Headphones, Languages, Moon, Sun, Timer, HelpCircle, Sparkles, Smartphone, Monitor, Layers, FolderOpen, DownloadCloud, Share2, Download } from 'lucide-react';
import { Language, Theme, SleepTimerState } from '../types';
import { translations } from '../utils/i18n';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  isMobileView: boolean;
  onToggleMobileView: () => void;
  sleepTimer: SleepTimerState;
  onOpenSleepTimer: () => void;
  onOpenInfoModal: () => void;
  onOpenSyncPreset?: () => void;
  onOpenAudioFile?: (file: File) => void;
  onOpenConverterTab?: () => void;
  onOpenInstallModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  isMobileView,
  onToggleMobileView,
  sleepTimer,
  onOpenSleepTimer,
  onOpenInfoModal,
  onOpenSyncPreset,
  onOpenAudioFile,
  onOpenConverterTab,
  onOpenInstallModal,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTimerSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onOpenAudioFile) {
      onOpenAudioFile(e.target.files[0]);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: '3D Sound Music Player',
      text: language === 'gu' ? '3D સ્પાશિયલ સાઉન્ડ ઓડિયો પ્લેયર - તમારા ફોનના કોઈપણ ગીતને 3D સાઉન્ડમાં અનુભવો!' : '3D Spatial Audio Music Player - Experience 3D Surround sound on any audio file!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t.shareAppNotice);
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-cyan-500/20 text-white px-4 py-3 shadow-lg">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/30 animate-pulse">
            <Headphones className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
              {t.appTitle}
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                300ms 3D
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap justify-end gap-2 text-sm">
          {/* Quick Open File Button */}
          {onOpenAudioFile && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold border border-indigo-400 transition-all shadow-md active:scale-95"
              title={t.openFileBtn}
            >
              <FolderOpen className="w-4 h-4 text-indigo-200" />
              <span className="text-xs">{t.openFileBtn}</span>
            </button>
          )}

          {/* Install Mobile App Button */}
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold border border-cyan-300 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
              title={language === 'gu' ? 'મોબાઇલમાં ઇન્સ્ટોલ કરો' : 'Install App'}
            >
              <Download className="w-4 h-4 text-slate-950 animate-bounce" />
              <span className="text-xs">{language === 'gu' ? 'ઇન્સ્ટોલ કરો' : 'Install App'}</span>
            </button>
          )}

          {/* Share App Button */}
          <button
            onClick={handleShareApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold border border-emerald-400 transition-all shadow-md active:scale-95"
            title={t.shareAppBtn}
          >
            <Share2 className="w-4 h-4 text-slate-950" />
            <span className="text-xs">{t.shareAppBtn}</span>
          </button>

          {/* Mobile vs Desktop View Mode Toggle */}
          <button
            onClick={onToggleMobileView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
              isMobileView
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
            }`}
          >
            {isMobileView ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4 text-cyan-400" />}
            <span>{isMobileView ? t.mobileMode : t.desktopMode}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(language === 'gu' ? 'en' : 'gu')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-all font-medium"
            title={t.language}
          >
            <Languages className="w-4 h-4 text-cyan-400" />
            <span>{language === 'gu' ? 'ગુજરાતી' : 'English'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => {
              if (theme === 'dark') onThemeChange('cyberpunk');
              else if (theme === 'cyberpunk') onThemeChange('light');
              else onThemeChange('dark');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all capitalize"
            title={t.theme}
          >
            {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === 'cyberpunk' && <Sparkles className="w-4 h-4 text-cyan-400" />}
            {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
            <span className="hidden md:inline">{theme}</span>
          </button>

          {/* Sleep Timer */}
          <button
            onClick={onOpenSleepTimer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              sleepTimer.active
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={t.sleepTimer}
          >
            <Timer className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-xs">
              {sleepTimer.active ? formatTimerSeconds(sleepTimer.remainingSeconds) : t.sleepTimer}
            </span>
          </button>

          {/* Sync Preset Manager Button */}
          {onOpenSyncPreset && (
            <button
              onClick={onOpenSyncPreset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 hover:border-indigo-400 transition-all font-semibold shadow-sm"
              title={t.syncPresetTitle}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs hidden sm:inline">Sync Preset</span>
            </button>
          )}

          {/* Info Modal Button */}
          <button
            onClick={onOpenInfoModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title={t.infoTitle}
          >
            <HelpCircle className="w-5 h-5 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
