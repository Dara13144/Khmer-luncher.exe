import React, { useState } from 'react';
import { Upload, Sparkles, Check, ShieldCheck, RefreshCw } from 'lucide-react';

interface CapePreset {
  id: string;
  name: string;
  previewUrl: string;
}

const PRESETS: CapePreset[] = [
  { id: 'angkor-gold', name: 'Angkor Wat Gold Emblem', previewUrl: '/assets/capes/angkor_gold.png' },
  { id: 'pvp-emerald', name: 'Tournament Emerald PvP', previewUrl: '/assets/capes/emerald_pvp.png' },
  { id: 'royal-cambodia', name: 'Kingdom Royal Flag', previewUrl: '/assets/capes/cambodia_flag.png' },
];

export default function CapeManager() {
  const [selectedPreset, setSelectedPreset] = useState<string>('angkor-gold');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [capeFile, setCapeFile] = useState<File | null>(null);

  const username = 'Dara111111'; // Active launcher player

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCapeFile(file);
      setSelectedPreset('');
    }
  };

  const handleApplyCape = async () => {
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('username', username);
      if (capeFile) {
        formData.append('cape', capeFile);
      } else {
        formData.append('presetId', selectedPreset);
      }

      // Sync with the central Cape CDN/API
      const response = await fetch('https://api.khmerlauncher.site/api/cape/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadSuccess(true);
      }
    } catch (err) {
      console.error('Failed to sync cape with server:', err);
      // Fallback: Save directly to .minecraft/capes/ for offline mode
      if ((window as any).api?.saveLocalCape) {
        await (window as any).api.saveLocalCape(username, capeFile);
        setUploadSuccess(true);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#0e1118]/95 backdrop-blur-md rounded-2xl border border-[#202738] text-white select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#202738]">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Sparkles className="text-emerald-400" size={20} />
            Custom Cape Cosmetics
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Wear exclusive community capes visible to all Khmer Launcher players in multiplayer.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141824] px-3 py-1.5 rounded-lg border border-[#232c40] text-xs text-emerald-400 font-semibold">
          <ShieldCheck size={14} />
          Khmer Network Sync Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Left: Cape Selector & Upload */}
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold text-gray-300">Choose Launcher Preset:</span>
          
          <div className="grid grid-cols-1 gap-2.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset.id);
                  setCapeFile(null);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedPreset === preset.id
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-[#131722] border-[#22293b] text-gray-300 hover:border-gray-500'
                }`}
              >
                <span className="text-xs font-semibold">{preset.name}</span>
                {selectedPreset === preset.id && <Check size={16} className="text-emerald-400" />}
              </button>
            ))}
          </div>

          <div className="relative border-2 border-dashed border-[#2d374d] hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors mt-2 bg-[#10141f]">
            <input
              type="file"
              accept=".png"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload size={22} className="mx-auto text-emerald-400 mb-1" />
            <p className="text-xs font-semibold text-gray-200">
              {capeFile ? capeFile.name : 'Upload Custom PNG Cape'}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Standard 64x32 or HD 1024x512 PNG supported</p>
          </div>
        </div>

        {/* Right: Live Player 3D/2D Preview */}
        <div className="bg-[#121622] rounded-xl border border-[#202738] p-5 flex flex-col items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 self-start">
            Live Character Preview
          </span>

          {/* Character Backside & Cape Visual */}
          <div className="relative w-36 h-52 bg-[#0c0e14] rounded-lg border border-[#222a3d] flex items-center justify-center overflow-hidden my-4">
            <div className="relative w-24 h-40 bg-gradient-to-b from-emerald-500 to-teal-800 rounded shadow-2xl flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-black font-extrabold rotate-90 tracking-widest">
                CAPE PREVIEW
              </span>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyCape}
            disabled={isUploading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Synchronizing Cape...
              </>
            ) : uploadSuccess ? (
              <>
                <Check size={14} />
                Cape Applied & Synced!
              </>
            ) : (
              'Apply & Equip Cape'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
