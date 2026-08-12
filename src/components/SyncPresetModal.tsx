import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  Download,
  Upload,
  Check,
  Trash2,
  X,
  Sparkles,
  Zap,
  Music2,
  FileJson,
  Layers,
} from 'lucide-react';
import {
  AudioPreset,
  EQSettings,
  Spatial3DSettings,
  MicrosecondDelaySettings,
  Language,
} from '../types';
import { translations } from '../utils/i18n';

interface SyncPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  eqSettings: EQSettings;
  spatialSettings: Spatial3DSettings;
  microDelaySettings: MicrosecondDelaySettings;
  pitchSemi: number;
  onApplyPreset: (preset: AudioPreset) => void;
  onShowNotice: (msg: string) => void;
}

const STORAGE_KEY = '3d_audio_synced_presets_v1';

const BUILT_IN_PRESETS: AudioPreset[] = [
  {
    id: 'builtin-8d-orbit',
    name: '8D Binaural Orbit Surround',
    createdAt: Date.now(),
    eq: {
      bands: [4, 3, 2, 0, 0, 1, 2, 3, 4, 3],
      presetName: 'bass-boost',
      bassBoost: 35,
      trebleBoost: 20,
      reverbLevel: 25,
      compressorEnabled: true,
    },
    spatial: {
      x: 0,
      y: 0,
      z: -2,
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      enabled: true,
    },
    delay: {
      leftDelayUs: 180,
      rightDelayUs: 60,
      enabled: true,
      autoOrbit8D: true,
      orbitSpeed: 1.2,
      centerLockEnabled: true,
      maxDelayRangeUs: 300,
    },
    pitchSemi: 0,
  },
  {
    id: 'builtin-heavy-bass',
    name: 'Heavy Bass & 3D Stage',
    createdAt: Date.now(),
    eq: {
      bands: [7, 6, 4, 1, -1, 0, 2, 4, 5, 4],
      presetName: 'bass-boost',
      bassBoost: 70,
      trebleBoost: 25,
      reverbLevel: 15,
      compressorEnabled: true,
    },
    spatial: {
      x: 0,
      y: 1,
      z: -3,
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      enabled: true,
    },
    delay: {
      leftDelayUs: 240,
      rightDelayUs: 100,
      enabled: true,
      autoOrbit8D: false,
      orbitSpeed: 1.0,
      centerLockEnabled: true,
      maxDelayRangeUs: 300,
    },
    pitchSemi: 0,
  },
  {
    id: 'builtin-haas-expander',
    name: '20ms Haas Stereo Expander',
    createdAt: Date.now(),
    eq: {
      bands: [2, 1, 0, 0, 0, 1, 2, 3, 2, 1],
      presetName: 'flat',
      bassBoost: 15,
      trebleBoost: 30,
      reverbLevel: 10,
      compressorEnabled: true,
    },
    spatial: {
      x: 1,
      y: 0,
      z: -1,
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      enabled: true,
    },
    delay: {
      leftDelayUs: 20,
      rightDelayUs: 0,
      enabled: true,
      autoOrbit8D: false,
      orbitSpeed: 1.0,
      centerLockEnabled: true,
      maxDelayRangeUs: 300,
    },
    pitchSemi: 0,
  },
  {
    id: 'builtin-concert-hall',
    name: 'Concert Hall 3D Echo',
    createdAt: Date.now(),
    eq: {
      bands: [3, 2, 1, 0, -1, 1, 3, 4, 3, 2],
      presetName: 'vocal',
      bassBoost: 20,
      trebleBoost: 35,
      reverbLevel: 50,
      compressorEnabled: true,
    },
    spatial: {
      x: -1,
      y: 2,
      z: -5,
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      enabled: true,
    },
    delay: {
      leftDelayUs: 120,
      rightDelayUs: 40,
      enabled: true,
      autoOrbit8D: false,
      orbitSpeed: 1.0,
      centerLockEnabled: true,
      maxDelayRangeUs: 300,
    },
    pitchSemi: 0,
  },
];

export const SyncPresetModal: React.FC<SyncPresetModalProps> = ({
  isOpen,
  onClose,
  language,
  eqSettings,
  spatialSettings,
  microDelaySettings,
  pitchSemi,
  onApplyPreset,
  onShowNotice,
}) => {
  const t = translations[language] || translations.en;
  const [presetNameInput, setPresetNameInput] = useState('');
  const [userPresets, setUserPresets] = useState<AudioPreset[]>([]);

  // Load saved presets from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setUserPresets(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse saved presets:', e);
    }
  }, []);

  if (!isOpen) return null;

  // Save current setup as a new preset
  const handleSaveCurrentPreset = () => {
    const name = presetNameInput.trim() || `Synced Preset ${userPresets.length + 1}`;
    const newPreset: AudioPreset = {
      id: `preset-${Date.now()}`,
      name,
      createdAt: Date.now(),
      eq: { ...eqSettings },
      spatial: { ...spatialSettings },
      delay: { ...microDelaySettings },
      pitchSemi,
    };

    const updated = [newPreset, ...userPresets];
    setUserPresets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save preset to localStorage', e);
    }

    setPresetNameInput('');
    onShowNotice(t.presetSavedNotice || 'Preset saved and synced successfully!');
  };

  // Delete user preset
  const handleDeletePreset = (id: string) => {
    const updated = userPresets.filter((p) => p.id !== id);
    setUserPresets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage after delete', e);
    }
  };

  // Export preset to a JSON file on disk
  const handleExportPresetFile = (preset: AudioPreset) => {
    const jsonStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.replace(/[/\\?%*:|"<>]/g, '_')}_3D_Preset.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotice(`Exported preset file: ${preset.name}.json`);
  };

  // Import preset file (.json) from disk
  const handleImportPresetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && parsed.eq && parsed.spatial && parsed.delay) {
          const importedPreset: AudioPreset = {
            id: `imported-${Date.now()}`,
            name: parsed.name || file.name.replace('.json', ''),
            createdAt: Date.now(),
            eq: parsed.eq,
            spatial: parsed.spatial,
            delay: parsed.delay,
            pitchSemi: parsed.pitchSemi ?? 0,
          };

          const updated = [importedPreset, ...userPresets];
          setUserPresets(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

          // Auto-apply imported preset
          onApplyPreset(importedPreset);
          onShowNotice(t.presetImportedNotice || 'Preset file imported successfully!');
        } else {
          alert('Invalid preset JSON format!');
        }
      } catch (err) {
        alert('Error parsing JSON preset file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                {t.syncPresetTitle}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  JSON Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400">{t.syncPresetSub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Setup Summary & Save Box */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Active Settings Snapshot:
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              EQ ({eqSettings.presetName}), Delay ({microDelaySettings.leftDelayUs}ms / {microDelaySettings.rightDelayUs}ms), Spatial (Z={spatialSettings.z}), Pitch ({pitchSemi > 0 ? `+${pitchSemi}` : pitchSemi}st)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder={t.presetNameLabel || 'Enter Preset Name (e.g., My Studio 8D)'}
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-indigo-500/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleSaveCurrentPreset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 shrink-0"
            >
              <Save className="w-4 h-4" />
              {t.syncCurrentBtn}
            </button>
          </div>
        </div>

        {/* Export / Import File Section */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-emerald-400" />
            File Import / Export:
          </span>

          <div className="flex items-center gap-2">
            {/* Import JSON button */}
            <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              {t.importPresetFile}
              <input
                type="file"
                accept=".json"
                onChange={handleImportPresetFile}
                className="hidden"
              />
            </label>

            {/* Direct export active setup */}
            <button
              onClick={() => {
                const currentAsPreset: AudioPreset = {
                  id: `active-${Date.now()}`,
                  name: presetNameInput.trim() || 'Current_Active_Preset',
                  createdAt: Date.now(),
                  eq: eqSettings,
                  spatial: spatialSettings,
                  delay: microDelaySettings,
                  pitchSemi,
                };
                handleExportPresetFile(currentAsPreset);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              {t.exportPresetFile}
            </button>
          </div>
        </div>

        {/* User Saved Presets */}
        {userPresets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              {t.savedPresets} ({userPresets.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {userPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-slate-950 p-3 rounded-2xl border border-indigo-500/30 hover:border-indigo-400/60 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-xs text-white truncate max-w-[170px]">
                        {preset.name}
                      </h5>
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(preset.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Delay: {preset.delay.leftDelayUs}ms / {preset.delay.rightDelayUs}ms • EQ: {preset.eq.presetName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        onApplyPreset(preset);
                        onShowNotice(`${preset.name}: ${t.presetAppliedNotice}`);
                      }}
                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Check className="w-3 h-3" />
                      {t.applyPreset}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExportPresetFile(preset)}
                        className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
                        title="Download JSON File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                        title={t.deletePreset}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Built-in Presets */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            {t.builtInPresets}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BUILT_IN_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-slate-950 p-3 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <h5 className="font-bold text-xs text-indigo-300">
                    {preset.name}
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Delay: {preset.delay.leftDelayUs}ms / {preset.delay.rightDelayUs}ms • 8D: {preset.delay.autoOrbit8D ? 'ON' : 'OFF'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onApplyPreset(preset);
                      onShowNotice(`${preset.name}: ${t.presetAppliedNotice}`);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Check className="w-3 h-3 text-indigo-400" />
                    {t.applyPreset}
                  </button>

                  <button
                    onClick={() => handleExportPresetFile(preset)}
                    className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Download JSON File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
