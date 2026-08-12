import React from 'react';
import { HelpCircle, X, Sparkles, Clock, Compass, Headphones } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/i18n';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-bold">{t.infoTitle}</h3>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Millisecond Delay Explanation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30">
            <h4 className="font-bold text-cyan-300 text-sm mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              મિલિ-સેકન્ડ (0 - 300 ms) 3D ડીલે એટલે શું?
            </h4>
            <p className="mt-2 text-slate-300">
              માનવ મગજ ડાબા અને જમણા કાનમાં ઓડિયો પહોંચવાના સમયના સૂક્ષ્મ સમયગાળાના તફાવત (Interaural Time Difference - ITD) ને આધારે અવાજ કઈ દિશામાંથી આવી રહ્યો છે તે નક્કી કરે છે (Haas Effect).
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 font-mono">
              <li>1 millisecond (ms) = 0.001 seconds.</li>
              <li>0 ms: Direct Center Sound (Standard Stereo).</li>
              <li>20 ms - 150 ms: Natural 3D Binaural Haas Expansion.</li>
              <li>300 ms: Maximum 3D Channel Delay (0.3 Seconds).</li>
            </ul>
          </div>

          {/* 3D Spatial Position */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30">
            <h4 className="font-bold text-indigo-300 text-sm mb-1 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              3D સાઉન્ડ પોઝિશનિંગ (Spatial Audio)
            </h4>
            <p className="mt-1">
              તમે મ્યુઝિકના સ્પીકર સોર્સને કાનની આગળ, પાછળ, ઉપર, ડાબે કે જમણે 3D કોઓર્ડિનેટ્સ (X, Y, Z) માં ખસેડી શકો છો. HRTF પ્લેયર તમારા હેડફોનમાં વાસ્તવિક ઓડિયો સ્પાશિયાલાઇઝેશન પ્રદાન કરે છે.
            </p>
          </div>

          {/* 8D Orbit Mode */}
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30">
            <h4 className="font-bold text-purple-300 text-sm mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              8D ઓટો-ઓર્બિટ ચક્ર (8D Audio)
            </h4>
            <p className="mt-1">
              8D મોડ ચાલુ કરવાથી અવાજ તમારા માથાની આસપાસ 360 ડિગ્રી ગોળ ગોળ ફરે છે અને સાથે સાથે માઇક્રો-સેકન્ડ ડીલે પણ સ્વચાલિત રીતે એડજસ્ટ થાય છે.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-center gap-2">
            <Headphones className="w-5 h-5 flex-shrink-0 text-cyan-400" />
            <span>મહત્તમ 3D ઓડિયો અનુભવ માટે હેડફોન અથવા ઈયરફોનનો ઉપયોગ કરવાની ભલામણ કરવામાં આવે છે!</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
