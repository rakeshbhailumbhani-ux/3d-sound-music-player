import React from 'react';
import { Sliders, RotateCw, Power, Zap, Info, Clock, PlayCircle, Sparkles, Download, Layers, VolumeX, Volume2 } from 'lucide-react';
import { MicrosecondDelaySettings, Language } from '../types';
import { translations } from '../utils/i18n';

interface MicrosecondDelayPanelProps {
  settings: MicrosecondDelaySettings;
  onChange: (updated: Partial<MicrosecondDelaySettings>) => void;
  language: Language;
  onToggleAuto20ms?: () => void;
  onSaveNewCopy?: (format?: 'mp3' | 'wav') => void;
  isSavingCopy?: boolean;
  onOpenSyncPreset?: () => void;
}

export const MicrosecondDelayPanel: React.FC<MicrosecondDelayPanelProps> = ({
  settings,
  onChange,
  language,
  onToggleAuto20ms,
  onSaveNewCopy,
  isSavingCopy = false,
  onOpenSyncPreset,
}) => {
  const t = translations[language];

  const maxRange = settings.maxDelayRangeUs || 300;
  const isCenterLock = settings.centerLockEnabled ?? true;

  const diffMs = settings.leftDelayUs - settings.rightDelayUs;
  const absDiffMs = Math.abs(diffMs);

  const is20msActive =
    settings.enabled && (settings.leftDelayUs === 20 || settings.rightDelayUs === 20);

  const applyPreset = (leftMs: number, rightMs: number) => {
    onChange({
      leftDelayUs: leftMs,
      rightDelayUs: rightMs,
      enabled: true,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 md:p-6 text-white shadow-2xl backdrop-blur-md relative overflow-hidden space-y-6">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              {t.delayTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.delaySubtitle}
          </p>
        </div>

        {/* Action Controls: 20ms Auto Tool & Save Copy Button & Master Power */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto 20ms L+R Haas Button */}
          <button
            onClick={onToggleAuto20ms}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-lg ${
              is20msActive
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30 ring-2 ring-amber-400'
                : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-amber-500/40'
            }`}
            title="Auto 20ms Haas Stereo Delay"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{t.auto20msTool}</span>
          </button>

          {/* Sync Preset Button */}
          {onOpenSyncPreset && (
            <button
              onClick={onOpenSyncPreset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 font-bold text-xs shadow-md transition-all active:scale-95"
              title="Sync & Save current audio preset"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{t.syncCurrentBtn || '⚡ Sync Preset'}</span>
            </button>
          )}

          {/* Save New Track Copy Button */}
          {onSaveNewCopy && (
            <button
              onClick={() => onSaveNewCopy('mp3')}
              disabled={isSavingCopy}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95 border border-emerald-300"
              title="Save rendered audio as a new copy in playlist (Original song safe)"
            >
              <Download className="w-4 h-4" />
              <span>{isSavingCopy ? 'સેવિંગ...' : t.saveNewCopy}</span>
            </button>
          )}

          {/* Master Power Toggle */}
          <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
            <span className="text-xs font-semibold text-slate-300">{t.enableDelayEffect}</span>
            <button
              onClick={() => onChange({ enabled: !settings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                settings.enabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Auto 20ms Haas Delay Quick Feature Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-950/90 to-indigo-950/80 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-amber-300 flex items-center gap-2">
              <span>{t.auto20msTool}</span>
              <span className="text-[10px] font-mono bg-amber-950 border border-amber-800 px-2 py-0.5 rounded text-amber-400">
                20 ms Haas
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {t.auto20msSub}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleAuto20ms}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
            is20msActive
              ? 'bg-amber-400 text-slate-950 border-white shadow-md shadow-amber-500/40'
              : 'bg-slate-800 text-amber-300 border-amber-500/50 hover:bg-slate-700'
          }`}
        >
          {is20msActive ? '20ms ઈફેક્ટ ચાલુ છે (ON)' : '૨૦ms ઓટો ઈફેક્ટ ON કરો'}
        </button>
      </div>

      {/* L+R Central Sound Lock & Max Delay Limit Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30">
        {/* Center Vocal Lock Toggle */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => onChange({ centerLockEnabled: !isCenterLock })}
            className={`mt-0.5 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
              isCenterLock ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isCenterLock ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div>
            <span className="text-xs font-bold text-emerald-300 block">
              {t.centerLock}
            </span>
            <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
              {t.centerLockSub}
            </span>
          </div>
        </div>

        {/* Max Delay Limit selector */}
        <div className="flex flex-col justify-between space-y-1.5">
          <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
            <span>{t.delayRange}</span>
            <span className="font-mono text-cyan-400">
              Max {maxRange >= 1000 ? `${(maxRange / 1000).toFixed(1)} Sec` : `${maxRange} ms`}
            </span>
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: '300 ms (Main 3D)', value: 300 },
              { label: '500 ms', value: 500 },
              { label: '1.0 Sec', value: 1000 },
              { label: '2.0 Sec', value: 2000 },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  onChange({
                    maxDelayRangeUs: r.value,
                    leftDelayUs: Math.min(settings.leftDelayUs, r.value),
                    rightDelayUs: Math.min(settings.rightDelayUs, r.value),
                  });
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  maxRange === r.value
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Channel Control */}
        <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 shadow-inner flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"></span>
              {t.leftDelay}
            </label>
            <div className="flex items-center gap-2">
              {/* L MUTE Button */}
              <button
                onClick={() => onChange({ leftMuted: !settings.leftMuted })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                  settings.leftMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500 shadow-md'
                    : 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Left Channel Mute"
              >
                {settings.leftMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{settings.leftMuted ? 'L MUTE (ON)' : 'L MUTE'}</span>
              </button>

              <div className="flex items-center gap-1.5 font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-lg text-sm">
                <input
                  type="number"
                  min={0}
                  max={maxRange}
                  value={settings.leftDelayUs}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onChange({ leftDelayUs: Math.max(0, Math.min(maxRange, val)) });
                  }}
                  className="w-20 bg-transparent text-right font-bold text-cyan-300 focus:outline-none"
                />
                <span className="text-xs text-cyan-400/80">ms</span>
              </div>
            </div>
          </div>

          {/* Slider Bar */}
          <input
            type="range"
            min={0}
            max={maxRange}
            step={1}
            value={settings.leftDelayUs}
            disabled={!settings.enabled}
            onChange={(e) => onChange({ leftDelayUs: parseInt(e.target.value) })}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
          />

          {/* Quick Step Buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-500 font-mono">0 ms</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onChange({ leftDelayUs: Math.max(0, settings.leftDelayUs - 10) })}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono"
              >
                -10ms
              </button>
              <button
                onClick={() => onChange({ leftDelayUs: Math.min(maxRange, settings.leftDelayUs + 10) })}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono"
              >
                +10ms
              </button>
            </div>
            <span className="text-slate-500 font-mono">{maxRange} ms</span>
          </div>
        </div>

        {/* Right Channel Control */}
        <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 shadow-inner flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block shadow-sm shadow-indigo-400/50"></span>
              {t.rightDelay}
            </label>
            <div className="flex items-center gap-2">
              {/* R MUTE Button */}
              <button
                onClick={() => onChange({ rightMuted: !settings.rightMuted })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                  settings.rightMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500 shadow-md'
                    : 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Right Channel Mute"
              >
                {settings.rightMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{settings.rightMuted ? 'R MUTE (ON)' : 'R MUTE'}</span>
              </button>

              <div className="flex items-center gap-1.5 font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 px-3 py-1 rounded-lg text-sm">
                <input
                  type="number"
                  min={0}
                  max={maxRange}
                  value={settings.rightDelayUs}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onChange({ rightDelayUs: Math.max(0, Math.min(maxRange, val)) });
                  }}
                  className="w-20 bg-transparent text-right font-bold text-indigo-300 focus:outline-none"
                />
                <span className="text-xs text-indigo-400/80">ms</span>
              </div>
            </div>
          </div>

          {/* Slider Bar */}
          <input
            type="range"
            min={0}
            max={maxRange}
            step={1}
            value={settings.rightDelayUs}
            disabled={!settings.enabled}
            onChange={(e) => onChange({ rightDelayUs: parseInt(e.target.value) })}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 disabled:opacity-40"
          />

          {/* Quick Step Buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-500 font-mono">0 ms</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onChange({ rightDelayUs: Math.max(0, settings.rightDelayUs - 10) })}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono"
              >
                -10ms
              </button>
              <button
                onClick={() => onChange({ rightDelayUs: Math.min(maxRange, settings.rightDelayUs + 10) })}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono"
              >
                +10ms
              </button>
            </div>
            <span className="text-slate-500 font-mono">{maxRange} ms</span>
          </div>
        </div>
      </div>

      {/* ITD Interaural Time Difference Status & Visual Wave Delay Gauge */}
      <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Delay Difference Stats */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">{t.delayDiff}</div>
            <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
              <span>{absDiffMs} ms</span>
            </div>
            <p className="text-xs text-cyan-300/80 mt-0.5">
              {diffMs === 0
                ? 'સાઉન્ડ સેન્ટરમાં છે (Synchronous L+R)'
                : diffMs > 0
                ? `ડાબો કાન આગળ છે (-${diffMs}ms delay) • Sound perceives from Left`
                : `જમણો કાન આગળ છે (+${absDiffMs}ms delay) • Sound perceives from Right`}
            </p>
          </div>
        </div>

        {/* Live Visual Waveform Offset Representation */}
        <div className="w-full md:w-64 h-16 bg-slate-900 rounded-lg p-2 border border-slate-800 flex flex-col justify-center relative overflow-hidden">
          <div className="text-[10px] text-slate-500 mb-1 flex justify-between font-mono">
            <span className="text-cyan-400">L: {settings.leftDelayUs}ms</span>
            <span className="text-indigo-400">R: {settings.rightDelayUs}ms</span>
          </div>
          <div className="relative h-6 w-full flex items-center bg-slate-950 rounded overflow-hidden">
            {/* L Wave indicator */}
            <div
              className="absolute h-2 rounded bg-cyan-400 shadow-sm shadow-cyan-400 transition-all duration-300"
              style={{
                left: `${(settings.leftDelayUs / maxRange) * 60}%`,
                width: '35%',
                top: '2px',
              }}
            ></div>
            {/* R Wave indicator */}
            <div
              className="absolute h-2 rounded bg-indigo-400 shadow-sm shadow-indigo-400 transition-all duration-300"
              style={{
                left: `${(settings.rightDelayUs / maxRange) * 60}%`,
                width: '35%',
                bottom: '2px',
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Presets & 8D Orbit Controls */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        {/* Presets List */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            {t.delayPresets}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset(0, 0)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-all font-mono"
            >
              0 ms (Flat)
            </button>
            <button
              onClick={() => {
                onChange({ maxDelayRangeUs: Math.max(maxRange, 300) });
                applyPreset(20, 0);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs border border-amber-200 transition-all font-mono shadow-md shadow-amber-500/30 ring-1 ring-amber-400"
            >
              ⚡ 20 ms Auto Haas
            </button>
            <button
              onClick={() => applyPreset(50, 0)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-cyan-500/30 transition-all font-mono"
            >
              50 ms Delay
            </button>
            <button
              onClick={() => applyPreset(100, 0)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-cyan-500/30 transition-all font-mono"
            >
              100 ms Delay
            </button>
            <button
              onClick={() => applyPreset(150, 0)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 border border-indigo-500/30 transition-all font-mono"
            >
              150 ms Delay
            </button>
            <button
              onClick={() => applyPreset(200, 0)}
              className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-xs text-indigo-300 border border-indigo-500/50 transition-all font-mono"
            >
              200 ms Delay
            </button>
            <button
              onClick={() => applyPreset(250, 0)}
              className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-xs text-indigo-300 border border-indigo-500/50 transition-all font-mono"
            >
              250 ms Delay
            </button>
            <button
              onClick={() => {
                onChange({ maxDelayRangeUs: Math.max(maxRange, 300) });
                applyPreset(300, 0);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs border border-cyan-300 transition-all font-mono shadow-md shadow-cyan-500/30 scale-105"
            >
              300 ms Main Delay
            </button>
          </div>
        </div>

        {/* 8D Auto-Orbit Surround Mode */}
        <div className="bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 p-3.5 rounded-xl border border-cyan-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className={`w-4 h-4 text-cyan-400 ${settings.autoOrbit8D ? 'animate-spin' : ''}`} />
              <span className="text-xs font-bold text-cyan-200">{t.orbit8D}</span>
            </div>
            <button
              onClick={() => onChange({ autoOrbit8D: !settings.autoOrbit8D })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                settings.autoOrbit8D
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {settings.autoOrbit8D ? 'ON (Active)' : 'OFF'}
            </button>
          </div>

          {settings.autoOrbit8D && (
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-3">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">{t.orbitSpeed}:</span>
              <input
                type="range"
                min={0.2}
                max={3.0}
                step={0.1}
                value={settings.orbitSpeed}
                onChange={(e) => onChange({ orbitSpeed: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400"
              />
              <span className="text-xs font-mono text-cyan-300 w-8 text-right">
                {settings.orbitSpeed}x
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
