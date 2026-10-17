import React, { useState, useEffect } from 'react';
import {
  Target,
  Heart,
  Zap,
  Keyboard,
  Shield,
  Compass,
  Crosshair,
  Tag,
  Check
} from 'lucide-react';

const ACCENT_COLORS = [
  { id: 'cyan', hex: '#00F5FF', border: 'border-cyan-400' },
  { id: 'emerald', hex: '#10B981', border: 'border-emerald-400' },
  { id: 'purple', hex: '#A855F7', border: 'border-purple-400' },
  { id: 'rose', hex: '#F43F5E', border: 'border-rose-400' },
  { id: 'amber', hex: '#FBBF24', border: 'border-amber-400' },
  { id: 'green', hex: '#22C55E', border: 'border-green-400' },
];

export default function PvPHudManager() {
  const [accentColor, setAccentColor] = useState('#10B981');
  const [tagInput, setTagInput] = useState('NMC');
  const [tagColor, setTagColor] = useState('#008080');

  const [modules, setModules] = useState({
    reachDisplay: false,
    targetHealth: true,
    pingFps: true,
    keystrokes: false,
    armorDurability: true,
    coordinates: false,
    crosshairCps: false,
  });

  // Load existing config on mount
  useEffect(() => {
    async function loadInitial() {
      if (typeof window !== 'undefined' && window.hudApi?.loadConfig) {
        const saved = await window.hudApi.loadConfig();
        if (saved) {
          if (saved.accentColor) setAccentColor(saved.accentColor);
          if (saved.modules) setModules(saved.modules);
          if (saved.playerTag) setTagInput(saved.playerTag);
          if (saved.tagColor) setTagColor(saved.tagColor);
        }
      }
    }
    loadInitial();
  }, []);

  // Sync and save changes
  const updateModule = (key) => {
    const updated = { ...modules, [key]: !modules[key] };
    setModules(updated);
    saveAll({ modules: updated, accentColor, playerTag: tagInput, tagColor });
  };

  const handleColorSelect = (hex) => {
    setAccentColor(hex);
    saveAll({ modules, accentColor: hex, playerTag: tagInput, tagColor });
  };

  const handleTagChange = (val) => {
    setTagInput(val);
    saveAll({ modules, accentColor, playerTag: val, tagColor });
  };

  const saveAll = async (data) => {
    if (typeof window !== 'undefined' && window.hudApi?.saveConfig) {
      await window.hudApi.saveConfig(data);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-[#0a0d14]/90 backdrop-blur-md rounded-2xl border border-[#1b2230] text-gray-200 select-none shadow-2xl">
      
      {/* 1. Header: HUD Accent Glow Color Selector */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#1b2230]">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            HUD Accent Glow Color:
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Choose the primary neon color for Keystrokes, Coordinates, and Reach text
          </p>
        </div>

        {/* Color Palette Balls */}
        <div className="flex items-center gap-3">
          {ACCENT_COLORS.map((col) => {
            const isSelected = accentColor.toLowerCase() === col.hex.toLowerCase();
            return (
              <button
                key={col.id}
                onClick={() => handleColorSelect(col.hex)}
                style={{ backgroundColor: col.hex }}
                className={`w-7 h-7 rounded-full transition-transform duration-150 flex items-center justify-center shadow-lg ${
                  isSelected ? 'ring-4 ring-white/30 scale-110' : 'hover:scale-105 opacity-85'
                }`}
              >
                {isSelected && <Check size={14} className="text-black font-extrabold" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Grid Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Reach Display */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-rose-400" />
              <span className="font-bold text-sm text-white">Reach Display</span>
              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Combat
              </span>
            </div>
            <ToggleSwitch active={modules.reachDisplay} onClick={() => updateModule('reachDisplay')} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-3 leading-relaxed">
            Intercepts entity attacks and calculates Euclidean reach distance with smooth fade-out animation.
          </p>
          <div className="self-start px-2 py-0.5 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-xs text-cyan-400">
            [2.87 Blocks]
          </div>
        </div>

        {/* Target Health Indicator */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-rose-500 fill-rose-500" />
              <span className="font-bold text-sm text-white">Target Health Indicator</span>
              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Combat
              </span>
            </div>
            <ToggleSwitch active={modules.targetHealth} onClick={() => updateModule('targetHealth')} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-3 leading-relaxed">
            Renders target opponent's username, health in hearts, and a dynamic color-coded HP bar.
          </p>
          <div className="self-start px-2.5 py-1 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-xs text-cyan-400 flex items-center gap-2">
            <span>PlayerName 10 ❤</span>
            <span className="w-16 h-2 bg-cyan-400 rounded-sm inline-block shadow-[0_0_6px_#00F5FF]" />
          </div>
        </div>

        {/* Ping & FPS Counter */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-sm text-white">Ping & FPS Counter</span>
              <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Analytics
              </span>
            </div>
            <ToggleSwitch active={modules.pingFps} onClick={() => updateModule('pingFps')} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-3 leading-relaxed">
            Minimalist top-right corner pill showing real-time client frame rate and server latency (ms).
          </p>
          <div className="self-start px-2.5 py-0.5 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-xs text-cyan-400">
            240 FPS | 38 ms
          </div>
        </div>

        {/* Keystrokes & Speedometer (BPS) */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Keyboard size={16} className="text-blue-400" />
              <span className="font-bold text-sm text-white">Keystrokes & Speedometer (BPS)</span>
              <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Movement
              </span>
            </div>
            <ToggleSwitch active={modules.keystrokes} onClick={() => updateModule('keystrokes')} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-3 leading-relaxed">
            Displays WASD keys, LMB/RMB with CPS trackers, Space bar, and real-time Blocks-Per-Second velocity.
          </p>
          <div className="self-start px-2 py-0.5 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-[11px] text-cyan-400">
            [W] [A] [S] [D]  LMB: 14 | RMB: 9 • 4.32 BPS
          </div>
        </div>

        {/* Armor & Weapon Durability Status */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-400" />
              <span className="font-bold text-sm text-white">Armor & Weapon Durability Status</span>
              <span className="text-[10px] bg-teal-950 text-teal-400 border border-teal-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Equipment
              </span>
            </div>
            <ToggleSwitch active={modules.armorDurability} onClick={() => updateModule('armorDurability')} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-3 leading-relaxed">
            Renders equipped Helmet, Chestplate, Leggings, Boots, and held tool with exact numerical durability.
          </p>
          <div className="self-start px-2 py-0.5 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-xs text-cyan-400 flex items-center gap-2">
            <span>⚔ 1562</span>
            <span>• 🪖 364</span>
            <span>• 🛡 528</span>
            <span>• 👖 495</span>
            <span>• 🥾 429</span>
          </div>
        </div>

        {/* Coordinates & Cardinal Direction */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-amber-400" />
              <span className="font-bold text-sm text-white">Coordinates & Cardinal Direction</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Navigation
              </span>
            </div>
            <ToggleSwitch active={modules.coordinates} onClick={() => updateModule('coordinates')} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-3 leading-relaxed">
            Displays exact XYZ player coordinates and current facing compass cardinal direction (N, S, E, W).
          </p>
          <div className="self-start px-2 py-0.5 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-xs text-cyan-400">
            (-55, 32, -40) N
          </div>
        </div>

        {/* Crosshair CPS Combat Analytics */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Crosshair size={16} className="text-rose-400" />
              <span className="font-bold text-sm text-white">Crosshair CPS Combat Analytics</span>
              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Combat
              </span>
            </div>
            <ToggleSwitch active={modules.crosshairCps} onClick={() => updateModule('crosshairCps')} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-3 leading-relaxed">
            Displays instantaneous Left and Right click speeds directly centered near your crosshair.
          </p>
          <div className="self-start px-2 py-0.5 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-xs text-cyan-400">
            12 | 8 CPS
          </div>
        </div>

        {/* Player Nametag & Rank Tag */}
        <div className="bg-[#0f141f] border border-[#1b2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-amber-400" />
              <div>
                <span className="font-bold text-sm text-white block">Player Nametag & Rank Tag</span>
                <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded font-bold uppercase">
                  Customization
                </span>
              </div>
            </div>

            {/* Prefix Input Box & Color Picker */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => handleTagChange(e.target.value)}
                className="w-24 px-2 py-1 bg-white text-black font-bold font-mono text-xs rounded border border-gray-400 focus:outline-none"
              />
              <div
                style={{ backgroundColor: tagColor }}
                className="w-7 h-7 rounded border border-gray-500 shadow-inner"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Configure custom prefix tag (e.g. [DEV], [NMC-PRO], [VIP]) and glow color in chat and HUD.
          </p>
        </div>

      </div>
    </div>
  );
}

// Reusable animated toggle switch
function ToggleSwitch({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-6 rounded-full transition-colors duration-200 relative p-0.5 ${
        active ? 'bg-[#10B981]' : 'bg-[#2a303c]'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
