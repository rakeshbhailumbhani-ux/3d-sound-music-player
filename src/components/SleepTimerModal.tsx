import React, { useState } from 'react';
import { Timer, X } from 'lucide-react';
import { SleepTimerState, Language } from '../types';
import { translations } from '../utils/i18n';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimer: SleepTimerState;
  onSetTimer: (minutes: number) => void;
  onCancelTimer: () => void;
  language: Language;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  sleepTimer,
  onSetTimer,
  onCancelTimer,
  language,
}) => {
  if (!isOpen) return null;
  const t = translations[language];
  const [customMinutes, setCustomMinutes] = useState(15);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-6 h-6 text-indigo-400" />
          <h3 className="text-lg font-bold">{t.setTimer}</h3>
        </div>

        {sleepTimer.active ? (
          <div className="space-y-4 text-center py-4">
            <p className="text-sm text-indigo-300 font-semibold">{t.timerActive}</p>
            <div className="text-3xl font-mono font-bold text-white">
              {Math.floor(sleepTimer.remainingSeconds / 60)}:
              {sleepTimer.remainingSeconds % 60 < 10 ? '0' : ''}
              {sleepTimer.remainingSeconds % 60}
            </div>
            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all"
            >
              {t.cancelTimer}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    onSetTimer(mins);
                    onClose();
                  }}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs transition-all"
                >
                  {mins} {t.minutes}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={300}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 font-mono"
              />
              <button
                onClick={() => {
                  onSetTimer(customMinutes);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs whitespace-nowrap"
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
