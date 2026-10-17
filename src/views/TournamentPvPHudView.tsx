import React, { useState, useEffect, useRef } from 'react';
import {
  Crosshair,
  Layout,
  Sliders,
  BarChart3,
  Save,
  RotateCcw,
  Target,
  Heart,
  Zap,
  Keyboard,
  Shield,
  Compass,
  Check,
  Flame,
  Award
} from 'lucide-react';

const PALETTE = ['#00F5FF', '#10B981', '#A855F7', '#F43F5E', '#FBBF24', '#22C55E'];

export default function TournamentPvPHudView() {
  const [subTab, setSubTab] = useState<'editor' | 'settings' | 'analytics'>('editor');
  const [accentColor, setAccentColor] = useState('#10B981');
  const [playerTag, setPlayerTag] = useState('NMC');
  const [tagColor, setTagColor] = useState('#008080');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [modules, setModules] = useState<Record<string, { enabled: boolean; x: number; y: number; title: string; type: string }>>({
    reachDisplay: { enabled: true, x: 44, y: 76, title: 'Reach Display', type: 'COMBAT' },
    targetHealth: { enabled: true, x: 40, y: 14, title: 'Target Health Indicator', type: 'COMBAT' },
    pingFps: { enabled: true, x: 82, y: 4, title: 'Ping & FPS Counter', type: 'ANALYTICS' },
    keystrokes: { enabled: true, x: 5, y: 62, title: 'Keystrokes & Speedometer', type: 'MOVEMENT' },
    armorDurability: { enabled: true, x: 86, y: 66, title: 'Armor & Weapon Durability', type: 'EQUIPMENT' },
    coordinates: { enabled: false, x: 4, y: 4, title: 'Coordinates & Compass', type: 'NAVIGATION' },
    crosshairCps: { enabled: true, x: 48, y: 47, title: 'Crosshair CPS Analytics', type: 'COMBAT' },
  });

  // Load configuration on mount
  useEffect(() => {
    async function load() {
      if ((window as any).api?.getHudConfig) {
        const saved = await (window as any).api.getHudConfig();
        if (saved) {
          if (saved.accentColor) setAccentColor(saved.accentColor);
          if (saved.playerTag) setPlayerTag(saved.playerTag);
          if (saved.tagColor) setTagColor(saved.tagColor);
          if (saved.modules) setModules(saved.modules);
        }
      }
    }
    load();
  }, []);

  const saveConfig = async (updatedMods = modules, color = accentColor, tag = playerTag, tColor = tagColor) => {
    if ((window as any).api?.saveHudConfig) {
      await (window as any).api.saveHudConfig({
        accentColor: color,
        playerTag: tag,
        tagColor: tColor,
        modules: updatedMods
      });
    }
  };

  const toggleModule = (id: string) => {
    const updated = {
      ...modules,
      [id]: { ...modules[id], enabled: !modules[id].enabled }
    };
    setModules(updated);
    saveConfig(updated);
  };

  // Drag-and-drop calculation relative to 16:9 canvas
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveDragId(id);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const mouseX = moveEvent.clientX - rect.left;
      const mouseY = moveEvent.clientY - rect.top;

      let newX = Math.round((mouseX / rect.width) * 100);
      let newY = Math.round((mouseY / rect.height) * 100);

      newX = Math.max(2, Math.min(newX, 90));
      newY = Math.max(2, Math.min(newY, 90));

      setModules((prev) => ({
        ...prev,
        [id]: { ...prev[id], x: newX, y: newY }
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      saveConfig();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#0a0c10]/95 backdrop-blur-md rounded-2xl border border-[#1b202c] text-white select-none">
      
      {/* 1. Header with View Tabs */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f2636]">
        <div>
          <h1 className="text-xl font-extrabold tracking-wide flex items-center gap-2 text-white">
            <Crosshair className="text-emerald-400" size={22} />
            Tournament PvP HUD & Combat Analytics
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time overlay repositioning, combat stats, and client HUD engine synchronization.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2 bg-[#12151d] p-1 rounded-xl border border-[#212838]">
          <button
            onClick={() => setSubTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'editor' ? 'bg-emerald-500 text-black shadow-[0_0_10px_#10B981]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layout size={14} />
            In-Launcher Canvas
          </button>
          <button
            onClick={() => setSubTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'settings' ? 'bg-emerald-500 text-black shadow-[0_0_10px_#10B981]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            Modules & Colors
          </button>
          <button
            onClick={() => setSubTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'analytics' ? 'bg-emerald-500 text-black shadow-[0_0_10px_#10B981]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            Combat Telemetry
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: Interactive Canvas Editor */}
      {subTab === 'editor' && (
        <div className="flex-1 flex flex-col items-center justify-center pt-4">
          <div
            ref={canvasRef}
            className="relative w-full max-w-4xl aspect-video bg-[#0d1017] rounded-xl border-2 border-dashed border-[#242c3d] overflow-hidden shadow-2xl"
            style={{
              backgroundImage: 'radial-gradient(#1a2233 1.2px, transparent 1.2px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Center Crosshair Reference */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-5 h-5 border border-white" />
            </div>

            {/* Draggable HUD Widgets */}
            {modules.reachDisplay?.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('reachDisplay', e)}
                style={{ left: `${modules.reachDisplay.x}%`, top: `${modules.reachDisplay.y}%` }}
                className="absolute cursor-move px-2.5 py-1 rounded bg-[#0b0e17]/90 border border-cyan-500/40 font-mono text-xs text-cyan-400 shadow-lg hover:ring-2 hover:ring-emerald-400"
              >
                [2.87 Blocks]
              </div>
            )}

            {modules.targetHealth?.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('targetHealth', e)}
                style={{ left: `${modules.targetHealth.x}%`, top: `${modules.targetHealth.y}%` }}
                className="absolute cursor-move px-3 py-1.5 rounded bg-[#0b0e17]/90 border border-[#1b2333] font-mono text-xs text-white flex items-center gap-2 shadow-lg hover:ring-2 hover:ring-emerald-400"
              >
                <span>Enemy 10 ❤</span>
                <span className="w-14 h-2 bg-rose-500 rounded-sm shadow-[0_0_6px_#f43f5e]" />
              </div>
            )}

            {modules.pingFps?.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('pingFps', e)}
                style={{ left: `${modules.pingFps.x}%`, top: `${modules.pingFps.y}%` }}
                className="absolute cursor-move px-2.5 py-1 rounded bg-[#0b0e17]/90 border border-cyan-500/40 text-cyan-400 font-mono text-xs shadow-lg hover:ring-2 hover:ring-emerald-400"
              >
                240 FPS | 38 ms
              </div>
            )}

            {modules.keystrokes?.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('keystrokes', e)}
                style={{ left: `${modules.keystrokes.x}%`, top: `${modules.keystrokes.y}%` }}
                className="absolute cursor-move flex flex-col gap-1 p-2 rounded bg-black/60 border border-[#242c3d] font-mono text-xs text-white hover:ring-2 hover:ring-emerald-400"
              >
                <div className="flex justify-center">
                  <span className="w-6 h-6 bg-white/10 rounded flex items-center justify-center font-bold">W</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-6 h-6 bg-white/10 rounded flex items-center justify-center font-bold">A</span>
                  <span className="w-6 h-6 bg-white/10 rounded flex items-center justify-center font-bold">S</span>
                  <span className="w-6 h-6 bg-white/10 rounded flex items-center justify-center font-bold">D</span>
                </div>
                <div className="text-[10px] text-cyan-400 text-center">LMB: 14 | RMB: 9</div>
              </div>
            )}

            {modules.armorDurability?.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('armorDurability', e)}
                style={{ left: `${modules.armorDurability.x}%`, top: `${modules.armorDurability.y}%` }}
                className="absolute cursor-move flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b0e17]/90 border border-[#1b2333] font-mono text-xs text-cyan-400 hover:ring-2 hover:ring-emerald-400"
              >
                <span>⚔ 1562</span>
                <span>🪖 364</span>
                <span>🛡 528</span>
              </div>
            )}

            {modules.crosshairCps?.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('crosshairCps', e)}
                style={{ left: `${modules.crosshairCps.x}%`, top: `${modules.crosshairCps.y}%` }}
                className="absolute cursor-move font-mono text-xs font-bold text-cyan-400 text-center hover:ring-2 hover:ring-emerald-400"
              >
                +
                <div className="text-[9px]">12 | 8 CPS</div>
              </div>
            )}

            <div className="absolute bottom-2 left-3 text-[11px] text-gray-500 font-mono">
              [DRAG ELEMENTS TO POSITION] • Coordinates auto-saved directly to .minecraft/config/khmer_tournament_hud.json
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: Settings & Toggles */}
      {subTab === 'settings' && (
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {/* Accent Color Palette */}
          <div className="flex items-center justify-between p-4 bg-[#0e121a] rounded-xl border border-[#1f2636] mb-4">
            <div>
              <div className="text-sm font-bold">HUD Accent Glow Color:</div>
              <div className="text-xs text-gray-400">Choose primary neon highlight for text and borders</div>
            </div>
            <div className="flex items-center gap-3">
              {PALETTE.map((col) => (
                <button
                  key={col}
                  onClick={() => {
                    setAccentColor(col);
                    saveConfig(modules, col);
                  }}
                  style={{ backgroundColor: col }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    accentColor === col ? 'ring-4 ring-white/30 scale-110' : 'hover:scale-105'
                  }`}
                >
                  {accentColor === col && <Check size={14} className="text-black font-extrabold" />}
                </button>
              ))}
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(modules).map(([id, mod]) => (
              <div key={id} className="p-4 bg-[#0e121a] rounded-xl border border-[#1f2636] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{mod.title}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 uppercase">
                      {mod.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Status: {mod.enabled ? 'Enabled' : 'Disabled'}</p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => toggleModule(id)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    mod.enabled ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      mod.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: Combat Telemetry & Analytics Dashboard */}
      {subTab === 'analytics' && (
        <div className="flex-1 overflow-y-auto mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-[#0e121a] rounded-xl border border-[#1f2636] flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <Target size={16} className="text-emerald-400" />
              Hit Registration Accuracy
            </span>
            <div className="text-3xl font-extrabold text-white mt-2">78.4%</div>
            <div className="text-[11px] text-emerald-400 mt-1">+3.2% vs last tournament match</div>
          </div>

          <div className="p-5 bg-[#0e121a] rounded-xl border border-[#1f2636] flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <Flame size={16} className="text-rose-400" />
              Peak CPS (Clicks/Sec)
            </span>
            <div className="text-3xl font-extrabold text-white mt-2">16.8 CPS</div>
            <div className="text-[11px] text-gray-400 mt-1">Average: 12.4 CPS (Butterfly clicking)</div>
          </div>

          <div className="p-5 bg-[#0e121a] rounded-xl border border-[#1f2636] flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <Award size={16} className="text-amber-400" />
              Duel Win / Loss Ratio
            </span>
            <div className="text-3xl font-extrabold text-white mt-2">4.2 W/L</div>
            <div className="text-[11px] text-cyan-400 mt-1">126 Wins • 30 Losses</div>
          </div>
        </div>
      )}
    </div>
  );
}
