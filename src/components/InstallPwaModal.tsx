import React, { useEffect, useState } from 'react';
import { Smartphone, Download, Check, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface InstallPwaModalProps {
  language: Language;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ language, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isGujarati = language === 'gu';

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show Android/iOS installation instructions alert or guidance
      alert(
        isGujarati
          ? 'તમારા બ્રાઉઝર મેનૂ (3 બિંદુઓ ⋮) પર ક્લિક કરો અને "Add to Home screen" અથવા "એપ ઇન્સ્ટોલ કરો" વિકલ્પ પસંદ કરો.'
          : 'Tap your browser menu (3 dots ⋮) and select "Add to Home screen" or "Install App".'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-cyan-950 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative p-4 bg-gradient-to-tr from-cyan-500 to-emerald-400 rounded-2xl shadow-lg shadow-cyan-500/30">
            <Smartphone className="w-10 h-10 text-slate-950" />
            <Sparkles className="w-4 h-4 text-slate-950 absolute -top-1 -right-1 animate-ping" />
          </div>

          <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-200">
            {isGujarati ? 'મોબાઇલમાં એપ ઇન્સ્ટોલ કરો' : 'Install Mobile App'}
          </h3>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            {isGujarati
              ? '3D સાઉન્ડ મ્યુઝિક પ્લેયરને તમારા એન્ડ્રોઇડ કે સ્માર્ટફોનની હોમ સ્ક્રીન પર હોમ-એપ તરીકે ઇન્સ્ટોલ કરી શકો છો.'
              : 'Install 3D Sound Music Player directly onto your phone home screen for offline playback and quick access.'}
          </p>
        </div>

        {/* Features list */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isGujarati ? 'ઑફલાઇન અને સિંગલ-ટેપથી પ્લે ગીતો' : 'Single-tap home screen access'}</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isGujarati ? '3D એચડી ગ્રાફિક સાઉન્ડ ઇફેક્ટ' : 'Full HD 3D Graphic Equalizer Display'}</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isGujarati ? 'તમારા ફોનના તમામ ઓડિયો સપોર્ટેડ' : 'Full Mobile Local Audio file support'}</span>
          </div>
        </div>

        {/* Installation Steps Guide for Chrome / Android / Safari */}
        <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-3.5 space-y-2 text-[11px] text-cyan-200">
          <p className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            {isGujarati ? 'કેવી રીતે ઇન્સ્ટોલ કરવું:' : 'How to install manually:'}
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300">
            <li>{isGujarati ? 'બ્રાઉઝરના 3 બિંદુઓ (⋮) પર ક્લિક કરો' : 'Tap Chrome menu (3 dots ⋮)'}</li>
            <li>
              {isGujarati ? (
                <span>
                  <PlusSquare className="w-3 h-3 inline mx-1 text-emerald-400" />
                  <b>"Add to Home Screen"</b> અથવા <b>"Install App"</b> પર ક્લિક કરો
                </span>
              ) : (
                'Select "Add to Home screen" or "Install App"'
              )}
            </li>
          </ol>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleInstallClick}
            disabled={isInstalled}
            className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isInstalled
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 cursor-default'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-cyan-500/20 active:scale-95'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>
              {isInstalled
                ? isGujarati
                  ? 'એપ ઇન્સ્ટોલ થઈ ગઈ છે!'
                  : 'App Installed!'
                : isGujarati
                ? 'હમણાં ઇન્સ્ટોલ કરો'
                : 'Install Now'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
