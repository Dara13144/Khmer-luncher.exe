import React, { useState, useRef } from 'react';
import { 
  Move, 
  RotateCcw, 
  Save, 
  Sliders, 
  Layout, 
  Check, 
  Eye
} from 'lucide-react';

export default function HudCanvasEditor() {
  const [editorMode, setEditorMode] = useState('visual_canvas');
  const [accentColor, setAccentColor] = useState('#00F5FF');
  const [activeElementId, setActiveElementId] = useState(null);
  const canvasRef = useRef(null);

  const [elements, setElements] = useState({
    pingFps: {
      id: 'pingFps',
      name: 'Ping & FPS Counter',
      enabled: true,
      x: 82,
      y: 4,
      renderPreview: () => (
        <div className="px-2.5 py-1 rounded bg-[#0b0e17]/90 border border-cyan-500/40 text-cyan-400 font-mono text-[11px] shadow-lg whitespace-nowrap">
          240 FPS | 38 ms
        </div>
      )
    },
    targetHealth: {
      id: 'targetHealth',
      name: 'Target Health Indicator',
      enabled: true,
      x: 42,
      y: 18,
      renderPreview: () => (
        <div className="px-3 py-1 rounded bg-[#0b0e17]/90 border border-[#1b2333] text-xs font-mono flex items-center gap-2 shadow-lg">
          <span className="text-white font-bold">Opponent 10 ❤</span>
          <span className="w-14 h-2 bg-rose-500 rounded-sm shadow-[0_0_6px_#f43f5e]" />
        </div>
      )
    },
    keystrokes: {
      id: 'keystrokes',
      name: 'Keystrokes (WASD + CPS)',
      enabled: true,
      x: 6,
      y: 65,
      renderPreview: () => (
        <div className="flex flex-col gap-1 select-none font-mono text-[10px] text-white">
          <div className="flex justify-center">
            <span className="w-6 h-6 bg-black/60 border border-white/20 rounded flex items-center justify-center font-bold">W</span>
          </div>
          <div className="flex gap-1">
            <span className="w-6 h-6 bg-black/60 border border-white/20 rounded flex items-center justify-center font-bold">A</span>
            <span className="w-6 h-6 bg-black/60 border border-white/20 rounded flex items-center justify-center font-bold">S</span>
            <span className="w-6 h-6 bg-black/60 border border-white/20 rounded flex items-center justify-center font-bold">D</span>
          </div>
          <div className="bg-black/60 border border-white/20 rounded text-center py-0.5 text-cyan-400 text-[9px]">
            LMB 14 | RMB 9
          </div>
        </div>
      )
    },
    armorDurability: {
      id: 'armorDurability',
      name: 'Armor Status',
      enabled: true,
      x: 85,
      y: 70,
      renderPreview: () => (
        <div className="flex flex-col gap-1 bg-[#0b0e17]/90 p-1.5 rounded border border-[#1b2333] text-[10px] font-mono text-cyan-400">
          <div>⚔ 1562</div>
          <div>🛡 528</div>
          <div>🥾 429</div>
        </div>
      )
    },
    crosshairCps: {
      id: 'crosshairCps',
      name: 'Crosshair CPS',
      enabled: true,
      x: 48,
      y: 48,
      renderPreview: () => (
        <div className="text-center font-mono text-[11px] font-bold text-cyan-400 drop-shadow">
          +
          <div className="text-[9px]">12 | 8</div>
        </div>
      )
    }
  });

  const handleDrag = (id, e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const onMouseMove = (moveEvent) => {
      const mouseX = moveEvent.clientX - rect.left;
      const mouseY = moveEvent.clientY - rect.top;

      let newX = Math.round((mouseX / rect.width) * 100);
      let newY = Math.round((mouseY / rect.height) * 100);

      newX = Math.max(2, Math.min(newX, 90));
      newY = Math.max(2, Math.min(newY, 90));

      setElements((prev) => ({
        ...prev,
        [id]: { ...prev[id], x: newX, y: newY }
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      saveToDisk();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const saveToDisk = async () => {
    if (typeof window !== 'undefined' && window.hudApi?.saveConfig) {
      await window.hudApi.saveConfig({
        accentColor,
        elements
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 text-white select-none">
      
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between bg-[#12151e] p-3 rounded-xl border border-[#232938]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditorMode('visual_canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              editorMode === 'visual_canvas'
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_#10B981]'
                : 'bg-[#1b202c] text-gray-400 hover:text-white'
            }`}
          >
            <Layout size={14} />
            In-Launcher Canvas Editor
          </button>

          <button
            onClick={() => setEditorMode('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              editorMode === 'settings'
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_#10B981]'
                : 'bg-[#1b202c] text-gray-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            Module Toggles & Colors
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            In-Game Real-Time Sync Enabled (Press R-SHIFT in-game)
          </span>

          <button
            onClick={saveToDisk}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b202c] hover:bg-emerald-500 hover:text-black rounded-lg border border-[#2b3345] text-xs font-bold transition-colors"
          >
            <Save size={13} />
            Save Layout
          </button>
        </div>
      </div>

      {/* Visual Canvas View */}
      {editorMode === 'visual_canvas' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-2">
          
          {/* 16:9 In-Game Simulated Screen */}
          <div
            ref={canvasRef}
            className="relative w-full max-w-4xl aspect-video bg-[#0b0e14] rounded-2xl border-2 border-dashed border-[#262f45] overflow-hidden shadow-2xl"
            style={{
              backgroundImage: 'radial-gradient(#182030 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Center Crosshair Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-4 h-4 border-t border-b border-l border-r border-white" />
            </div>

            {/* Draggable HUD Elements */}
            {Object.values(elements).map((el) => {
              if (!el.enabled) return null;
              const isSelected = activeElementId === el.id;

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => {
                    setActiveElementId(el.id);
                    handleDrag(el.id, e);
                  }}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                  }}
                  className={`absolute cursor-move transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black rounded'
                      : 'hover:ring-1 hover:ring-white/40'
                  }`}
                >
                  {el.renderPreview(accentColor)}
                </div>
              );
            })}

            {/* Bottom Screen Helper */}
            <div className="absolute bottom-2 left-3 text-[10px] text-gray-500 font-mono">
              [DRAG ANY ELEMENT TO REPOSITION] • Positions auto-saved to .minecraft/config/khmer_pvp_hud.json
            </div>
          </div>
        </div>
      ) : (
        /* Settings Modules View (Original Toggles) */
        <div className="text-xs text-gray-400 p-4">
          Open the toggles list to enable or disable individual widgets.
        </div>
      )}
    </div>
  );
}
