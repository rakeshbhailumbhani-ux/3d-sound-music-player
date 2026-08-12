import React from 'react';
import { SlidersHorizontal, RotateCcw, VolumeX, Sparkles, Disc, Shield, Gauge } from 'lucide-react';
import { EQSettings, Language } from '../types';
import { translations } from '../utils/i18n';
import { EQ_PRESETS } from '../data/demoTracks';

interface EqualizerPanelProps {
  settings: EQSettings;
  onChange: (updated: Partial<EQSettings>) => void;
  language: Language;
}

const FREQ_LABELS = ['31Hz', '62Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];

export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({
  settings,
  onChange,
  language,
}) => {
  const t = translations[language];

  const handleBandChange = (index: number, val: number) => {
    const updatedBands = [...settings.bands];
    updatedBands[index] = val;
    onChange({ bands: updatedBands, presetName: 'custom' });
  };

  const applyPreset = (presetName: string) => {
    const preset = EQ_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      onChange({
        presetName,
        bands: [...preset.bands],
      });
    }
  };

  const resetAll = () => {
    onChange({
      presetName: 'flat',
      bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bassBoost: 0,
      trebleBoost: 0,
      reverbLevel: 0,
      compressorEnabled: true,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 text-white shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              {t.eqTitle}
            </h2>
          </div>
        </div>

        {/* EQ Preset Selector & Reset */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={settings.presetName}
            onChange={(e) => applyPreset(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-purple-300 rounded-xl px-3 py-2 focus:outline-none"
          >
            {EQ_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {language === 'gu' ? p.labelGu : p.labelEn}
              </option>
            ))}
            <option value="custom">Custom Preset</option>
          </select>

          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all font-semibold"
            title={t.resetEQ}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'gu' ? 'ફ્લેટ EQ રિસેટ' : 'Flat EQ Reset'}</span>
          </button>
        </div>
      </div>

      {/* Quick EQ Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 border-b border-slate-800/80">
        <span className="text-[11px] text-slate-400 font-semibold uppercase whitespace-nowrap mr-1">
          {t.eqPresets}:
        </span>
        {EQ_PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p.name)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              settings.presetName === p.name
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {language === 'gu' ? p.labelGu : p.labelEn}
          </button>
        ))}
      </div>

      {/* 10 Band Graphic Equalizer Sliders */}
      <div className="mt-6 bg-slate-950/70 p-4 md:p-6 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-10 gap-2 md:gap-4 h-56 items-end pb-2">
          {settings.bands.map((gainDb, index) => (
            <div key={FREQ_LABELS[index]} className="flex flex-col items-center h-full justify-between">
              {/* dB Label */}
              <span className="text-[10px] font-mono text-slate-400">
                {gainDb > 0 ? `+${gainDb}` : gainDb}dB
              </span>

              {/* Vertical Slider */}
              <div className="relative h-36 flex items-center justify-center">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={gainDb}
                  onChange={(e) => handleBandChange(index, parseFloat(e.target.value))}
                  className="w-2 h-36 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 [writing-mode:vertical-lr] [direction:rtl]"
                />
              </div>

              {/* Frequency Label */}
              <span className="text-[10px] font-semibold text-purple-300 mt-2 rotate-[-45deg] sm:rotate-0">
                {FREQ_LABELS[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audio FX Section (Bass Boost, Treble Boost, Reverb, Auto-Limiter Threshold) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Bass Boost */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="font-bold text-pink-400 flex items-center gap-1.5">
              <Disc className="w-4 h-4" />
              {t.bassBoost}
            </span>
            <span className="font-mono text-pink-300">{settings.bassBoost}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.bassBoost}
            onChange={(e) => onChange({ bassBoost: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-pink-500"
          />
        </div>

        {/* Treble Boost */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {t.trebleBoost}
            </span>
            <span className="font-mono text-cyan-300">{settings.trebleBoost}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.trebleBoost}
            onChange={(e) => onChange({ trebleBoost: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Reverb Level */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5">
              <VolumeX className="w-4 h-4" />
              {t.reverb}
            </span>
            <span className="font-mono text-indigo-300">{settings.reverbLevel}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.reverbLevel}
            onChange={(e) => onChange({ reverbLevel: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-400"
          />
        </div>

        {/* Auto-Limiter & Compression Threshold */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              {t.autoLimiterTitle}
            </span>
            <button
              onClick={() => {
                const nextState = !(settings.autoLimiterEnabled ?? settings.compressorEnabled);
                onChange({ autoLimiterEnabled: nextState, compressorEnabled: nextState });
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                (settings.autoLimiterEnabled ?? settings.compressorEnabled)
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {(settings.autoLimiterEnabled ?? settings.compressorEnabled) ? 'LIMITER ON' : 'OFF'}
            </button>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              {t.limiterThreshold}
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {settings.compressorThreshold ?? -24} dB
            </span>
          </div>

          <input
            type="range"
            min={-60}
            max={0}
            step={1}
            value={settings.compressorThreshold ?? -24}
            onChange={(e) => onChange({ compressorThreshold: parseInt(e.target.value) })}
            disabled={!(settings.autoLimiterEnabled ?? settings.compressorEnabled)}
            className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400 disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
};
