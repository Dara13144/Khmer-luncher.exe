import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  ShoppingCart,
  Swords,
  Wrench,
  Server,
  DownloadCloud,
  Ghost,
  FileText,
  User,
  ChevronDown,
  Volume2,
  VolumeX,
  Sliders,
  Check,
  Disc3,
  ExternalLink,
  Target,
  Zap,
  Tag
} from 'lucide-react';

export type HubTab =
  | 'play'
  | 'marketplace'
  | 'pvp-hud'
  | 'mods'
  | 'servers'
  | 'installations'
  | 'skins'
  | 'patch-notes';

interface NavItem {
  id: HubTab;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeBorder: string;
  activeBg: string;
  glow: string;
}

const MENU_ITEMS: NavItem[] = [
  { 
    id: 'play', 
    label: 'Play', 
    icon: <Gamepad2 size={20} className="text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]" />, 
    color: '#00ff88',
    activeBorder: 'border-[#00ff88]',
    activeBg: 'from-[#00ff88]/20 to-[#00ff88]/5',
    glow: 'rgba(0,255,136,0.45)'
  },
  { 
    id: 'marketplace', 
    label: 'Marketplace', 
    icon: <ShoppingCart size={20} className="text-[#c084fc] drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" />, 
    color: '#c084fc',
    activeBorder: 'border-[#c084fc]',
    activeBg: 'from-[#c084fc]/20 to-[#c084fc]/5',
    glow: 'rgba(192,132,252,0.45)'
  },
  { 
    id: 'pvp-hud', 
    label: 'PvP HUD Mods ⚔', 
    icon: <Swords size={20} className="text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />, 
    color: '#00f3ff',
    activeBorder: 'border-[#00f3ff]',
    activeBg: 'from-[#00f3ff]/20 to-[#00f3ff]/5',
    glow: 'rgba(0,243,255,0.45)'
  },
  { 
    id: 'mods', 
    label: 'Mods Manager', 
    icon: <Wrench size={20} className="text-[#f97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />, 
    color: '#f97316',
    activeBorder: 'border-[#f97316]',
    activeBg: 'from-[#f97316]/20 to-[#f97316]/5',
    glow: 'rgba(249,115,22,0.45)'
  },
  { 
    id: 'servers', 
    label: 'Servers', 
    icon: <Server size={20} className="text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />, 
    color: '#38bdf8',
    activeBorder: 'border-[#38bdf8]',
    activeBg: 'from-[#38bdf8]/20 to-[#38bdf8]/5',
    glow: 'rgba(56,189,248,0.45)'
  },
  { 
    id: 'installations', 
    label: 'Installations', 
    icon: <DownloadCloud size={20} className="text-[#f43f5e] drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />, 
    color: '#f43f5e',
    activeBorder: 'border-[#f43f5e]',
    activeBg: 'from-[#f43f5e]/20 to-[#f43f5e]/5',
    glow: 'rgba(244,63,94,0.45)'
  },
  { 
    id: 'skins', 
    label: 'Skins', 
    icon: <Ghost size={20} className="text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />, 
    color: '#facc15',
    activeBorder: 'border-[#facc15]',
    activeBg: 'from-[#facc15]/20 to-[#facc15]/5',
    glow: 'rgba(250,204,21,0.45)'
  },
  { 
    id: 'patch-notes', 
    label: 'Patch Notes', 
    icon: <FileText size={20} className="text-[#2dd4bf] drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]" />, 
    color: '#2dd4bf',
    activeBorder: 'border-[#2dd4bf]',
    activeBg: 'from-[#2dd4bf]/20 to-[#2dd4bf]/5',
    glow: 'rgba(45,212,191,0.45)'
  },
];

export default function KhmerMenuHub() {
  const [activeTab, setActiveTab] = useState<HubTab>('play');
  const [hoveredTab, setHoveredTab] = useState<HubTab | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [activeVersion, setActiveVersion] = useState('Fabric 1.21.1');
  const [isLaunching, setIsLaunching] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio mute controller
  const toggleAudio = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isAudioMuted;
    }
    setIsAudioMuted(!isAudioMuted);
  };

  // Launch Game Handler
  const handleLaunchGame = async () => {
    setIsLaunching(true);
    if ((window as any).api?.launchGame) {
      await (window as any).api.launchGame({
        version: activeVersion,
        ram: 4096,
      });
    } else if ((window as any).api?.launch) {
      await (window as any).api.launch({
        version: activeVersion,
        ram: '4G',
      });
    } else {
      setTimeout(() => setIsLaunching(false), 2500);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0c10] text-white flex flex-col select-none font-sans">
      
      {/* 1. Background Video / Static Motion Scrim */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {motionEnabled && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-25 filter blur-[1px]"
            src="/assets/angkor_wat_bg.mp4"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/70 to-[#0a0c10]/90" />
      </div>

      {/* Hidden Traditional Khmer Audio Engine */}
      <audio
        ref={audioRef}
        src="/assets/khmer_traditional_bgm.mp3"
        autoPlay
        loop
      />

      {/* 2. Top Universal Menu Bar */}
      <header className="relative z-50 h-14 bg-[#0d0f14]/90 backdrop-blur-md border-b border-[#1c2230] px-4 flex items-center justify-between">
        
        {/* Left Brand Identity & Nav Tabs */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab('play')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-[1px] flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <div className="w-full h-full bg-[#0d0f14] rounded-full flex items-center justify-center">
                <span className="text-[11px] font-black text-amber-300">KL</span>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-black tracking-wider text-white">KHMER LAUNCHER</span>
              <span className="text-[9px] font-bold text-amber-400 tracking-widest uppercase">PvP Edition</span>
            </div>
          </div>

          {/* Cyberpunk Esports Glass Capsule Bar (Image 1 replica) */}
          <div className="flex flex-col items-center relative">
            <nav 
              className="relative flex items-center bg-gradient-to-b from-[#161a24]/95 to-[#090b11]/98 border border-white/[0.12] rounded-[20px] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl z-10"
              onMouseLeave={() => setHoveredTab(null)}
            >
              {MENU_ITEMS.map((item, idx) => {
                const isActive = activeTab === item.id;
                const isHovered = hoveredTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    onMouseEnter={() => setHoveredTab(item.id)}
                    className={`relative flex flex-col items-center justify-center gap-1 min-w-[82px] px-3 py-1.5 rounded-[14px] transition-all duration-200 outline-none ${
                      isActive 
                        ? `border ${item.activeBorder} bg-gradient-to-b ${item.activeBg} shadow-[0_0_16px_${item.glow}]`
                        : 'border border-transparent hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Vertical Divider */}
                    {idx < MENU_ITEMS.length - 1 && !isActive && activeTab !== MENU_ITEMS[idx + 1]?.id && (
                      <span className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-white/[0.08] pointer-events-none" />
                    )}

                    {/* Icon */}
                    <div className="w-7 h-7 flex items-center justify-center transition-transform">
                      {item.icon}
                    </div>

                    {/* Label */}
                    <span className={`text-[11px] tracking-wide transition-colors ${isActive ? 'text-white font-bold' : isHovered ? 'text-gray-100 font-semibold' : 'text-gray-400 font-medium'}`}>
                      {item.label}
                    </span>

                    {/* Neon Underline Indicator */}
                    <span 
                      className="h-[3px] rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: item.color,
                        width: isActive ? '42px' : isHovered ? '36px' : '30px',
                        boxShadow: isActive ? `0 0 10px ${item.color}, 0 0 20px ${item.color}` : `0 0 6px ${item.color}`,
                        opacity: isActive ? 1 : isHovered ? 0.85 : 0.55
                      }}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Cyberpunk Floor Glow Reflection */}
            <div className="w-[96%] flex justify-around items-center h-3 blur-md opacity-85 pointer-events-none -mt-1">
              {MENU_ITEMS.map((item) => (
                <span 
                  key={`glow-${item.id}`}
                  className="w-12 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: item.color,
                    opacity: activeTab === item.id ? 0.95 : 0.35,
                    transform: activeTab === item.id ? 'scale(1.4)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Menu Controls: Socials, Audio, and Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#1c2230]">
            <button 
              onClick={() => window.open('https://discord.gg/ZnHuvUqpn', '_blank')}
              className="px-2 py-1 rounded bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/40 text-[#8891f2] text-[10px] font-bold tracking-wider"
            >
              DISCORD
            </button>
            <button 
              onClick={() => window.open('https://t.me/+Gzx1VlNQa3Q0YTJl', '_blank')}
              className="px-2 py-1 rounded bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#54bbf0] text-[10px] font-bold tracking-wider"
            >
              TELEGRAM
            </button>
          </div>

          <button
            onClick={toggleAudio}
            title={isAudioMuted ? "Unmute BGM" : "Mute BGM"}
            className="p-1.5 rounded-lg bg-[#141720] hover:bg-[#1a1f2b] border border-[#222838] text-gray-400 hover:text-white transition-colors"
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-emerald-400" />}
          </button>

          {/* Account Card & Drawer */}
          <div className="relative">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-[#141720] hover:bg-[#1a1f2b] border border-[#222838] transition-all"
            >
              <div className="w-5 h-5 rounded-[3px] bg-[#614126] border border-black/40 overflow-hidden flex items-center justify-center text-[10px]">
                😵
              </div>
              <span className="text-xs font-bold text-gray-200">DaraDev</span>
              <span className="text-[8px] font-black uppercase bg-[#ea580c] text-black px-1.5 py-0.5 rounded-[2px] tracking-wide">
                OFFLINE
              </span>
              <ChevronDown size={11} className={`text-gray-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isAccountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-52 bg-[#0f121a] border border-[#232b3d] rounded-xl shadow-2xl p-2 z-50 text-xs"
                >
                  <div className="px-2 py-1.5 border-b border-[#1e2535] mb-1">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">Active Profile</div>
                    <div className="text-white font-bold flex items-center justify-between">
                      DaraDev
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-gray-300 flex items-center gap-2"
                  >
                    <User size={13} />
                    Switch Account
                  </button>
                  <button 
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-gray-300 flex items-center gap-2"
                  >
                    <Sliders size={13} />
                    Account Settings
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* 3. Main Dynamic Content Area (Switched by Tabs) */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 flex flex-col">
        {activeTab === 'play' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Center Hero Logo */}
            <div className="w-24 h-24 rounded-full border-2 border-amber-400/80 bg-black/60 shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center mb-3">
              <span className="text-4xl">🇰🇭</span>
            </div>
            
            <h1 className="text-3xl font-black tracking-wider text-white flex items-center gap-2">
              KHMER <span className="text-amber-400">LAUNCHER</span>
            </h1>

            {/* Feature Pills */}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2.5 py-0.5 rounded-full border border-cyan-400 text-cyan-400 text-[10px] font-bold">
                MINECRAFT 1.21.1
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-emerald-400 text-emerald-400 text-[10px] font-bold">
                ⚡ PVP CLIENT
              </span>
            </div>

            {/* Floating Media Pill at lower right */}
            <div className="absolute bottom-20 right-6 flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#10141f]/80 border border-[#222a3d] backdrop-blur-md">
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-emerald-400 animate-pulse" />
                <span className="w-1 h-4 bg-emerald-400 animate-bounce" />
                <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[11px] text-gray-300 font-mono">Khmer Traditional Sunrise Melody</span>
              <button
                onClick={() => setMotionEnabled(!motionEnabled)}
                className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] text-gray-300 hover:text-white"
              >
                Motion {motionEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* Installations View with Cyberpunk Esports Profile Cards (Image 1 replica) */}
        {activeTab === 'installations' && (
          <div className="flex-1 flex flex-col gap-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide">Installations & Game Profiles</h2>
                <p className="text-xs text-gray-400">Launch configured game instances or manage client configurations.</p>
              </div>
            </div>

            {/* Profile 1: Fabric 1.21.1 (KHMER PvP Client) */}
            <div className="relative overflow-hidden rounded-[18px] border border-[#00ff88] bg-gradient-to-r from-[#060b08] via-[#0c1611] to-[#0a140f]/80 p-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,136,0.25)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-[#00ff88] before:shadow-[0_0_14px_#00ff88]">
              <div className="flex items-center gap-4 relative z-10">
                <img src="/src/assets/install_icon_fabric.png" alt="Fabric" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(0,255,136,0.6)]" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">
                      Fabric 1.21.1 <span className="text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]">(KHMER PvP Client)</span>
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]">
                      ACTIVE PROFILE
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#38bdf8]">
                      FABRIC 0.16.10
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>🟩 Directory: <code className="text-[#38bdf8] bg-black/40 px-1.5 py-0.5 rounded font-mono">.minecraft</code></span>
                    <span>•</span>
                    <span>SimplePvP Mods Integration</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 relative z-10">
                <button
                  onClick={() => {
                    setActiveVersion('Fabric 1.21.1');
                    handleLaunchGame();
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00ff88] to-[#059669] text-white font-extrabold text-xs tracking-wider shadow-[0_0_18px_rgba(0,255,136,0.6)] hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <Play size={14} className="fill-white" />
                  <span>Play Now</span>
                </button>
                <button 
                  onClick={() => alert('Opening .minecraft directory')}
                  className="w-10 h-10 rounded-xl bg-[#0c1018]/90 border border-white/20 flex items-center justify-center hover:border-amber-400 hover:scale-105 transition-all text-amber-400 shadow-md"
                >
                  📁
                </button>
              </div>
            </div>

            {/* Profile 2: Vanilla 1.21.1 */}
            <div className="relative overflow-hidden rounded-[18px] border border-[#a855f7] bg-gradient-to-r from-[#0a0614] via-[#150d24] to-[#120b20]/80 p-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_20px_rgba(168,85,247,0.25)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-[#a855f7] before:shadow-[0_0_14px_#a855f7]">
              <div className="flex items-center gap-4 relative z-10">
                <img src="/src/assets/install_icon_vanilla.png" alt="Vanilla" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">
                      Minecraft 1.21.1 <span className="text-[#c084fc] drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">(Vanilla Official)</span>
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#a855f7] bg-[#a855f7]/15 text-[#d8b4fe]">
                      ★ PURE VANILLA
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>🟩 Tricky Trials Update 1.21.1 release without custom mods</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 relative z-10">
                <button
                  onClick={() => {
                    setActiveVersion('1.21.1 (Vanilla)');
                    handleLaunchGame();
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00ff88] to-[#059669] text-white font-extrabold text-xs tracking-wider shadow-[0_0_18px_rgba(0,255,136,0.6)] hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <Play size={14} className="fill-white" />
                  <span>Play Now</span>
                </button>
                <button 
                  onClick={() => alert('Opening .minecraft directory')}
                  className="w-10 h-10 rounded-xl bg-[#0c1018]/90 border border-white/20 flex items-center justify-center hover:border-amber-400 hover:scale-105 transition-all text-amber-400 shadow-md"
                >
                  📁
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Servers View with Cyberpunk Esports 2x2 Server Grid (Image 1 replica) */}
        {activeTab === 'servers' && (
          <div className="flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide">Multiplayer Servers</h2>
                <p className="text-xs text-gray-400">Join partner networks, competitive arenas, and community servers.</p>
              </div>
              <button 
                onClick={() => alert('Refreshing server pings...')}
                className="px-3 py-1 rounded-lg bg-[#141b29] border border-[#232f45] text-xs font-bold text-gray-300 hover:text-white hover:border-[#38bdf8] transition-all"
              >
                ↺ Refresh Ping
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Server 1: NMC Network (Blue) */}
              <div className="relative overflow-hidden rounded-[16px] border border-[#0088ff] bg-gradient-to-r from-[#050b18] via-[#0b152c] to-[#091226]/80 p-3.5 flex flex-col justify-between min-h-[140px] shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_18px_rgba(0,136,255,0.35)]">
                <div className="flex items-center gap-3 relative z-10">
                  <img src="/src/assets/server_icon_nmc.png" alt="NMC" className="w-14 h-14 object-contain" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-white">NMC Network (Official Partner)</strong>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#f59e0b] bg-[#f59e0b]/20 text-[#fbbf24]">🤝 PARTNER</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 w-fit">
                      <code className="text-[11px] font-mono text-[#38bdf8]">play.nmchosting.com</code>
                      <button onClick={() => navigator.clipboard.writeText('play.nmchosting.com')} className="text-gray-400 hover:text-white text-[11px]">📋</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                    <span>14 ms</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 relative z-10 my-1 line-clamp-1">Cambodia's #1 MMORPG & Towny Server with custom economy, dungeon bosses, and PvP arena.</p>
                <div className="flex items-center justify-between relative z-10 pt-1">
                  <span className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <strong className="text-white">842</strong> Online
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('play.nmchosting.com');
                      handleLaunchGame();
                    }}
                    className="px-4 py-1.5 rounded-full border border-[#0088ff] bg-black/80 text-white font-extrabold text-[11px] shadow-[0_0_12px_rgba(0,136,255,0.45)] hover:scale-105 transition-all flex items-center gap-1.5"
                  >
                    <Play size={11} className="fill-white" />
                    <span>Connect Server</span>
                  </button>
                </div>
              </div>

              {/* Server 2: Angkor Craft SMP (Green) */}
              <div className="relative overflow-hidden rounded-[16px] border border-[#00ff88] bg-gradient-to-r from-[#04100b] via-[#092015] to-[#081911]/80 p-3.5 flex flex-col justify-between min-h-[140px] shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_18px_rgba(0,255,136,0.35)]">
                <div className="flex items-center gap-3 relative z-10">
                  <img src="/src/assets/server_icon_angkor.png" alt="Angkor" className="w-14 h-14 object-contain" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-white">Angkor Craft SMP</strong>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#10b981] bg-[#10b981]/20 text-[#34d399]">✔ VERIFIED</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 w-fit">
                      <code className="text-[11px] font-mono text-[#38bdf8]">mc.angkorcraft.kh</code>
                      <button onClick={() => navigator.clipboard.writeText('mc.angkorcraft.kh')} className="text-gray-400 hover:text-white text-[11px]">📋</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                    <span>18 ms</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 relative z-10 my-1 line-clamp-1">Authentic Cambodian Survival SMP, BoxPvP, Lifesteal, and Clan Wars.</p>
                <div className="flex items-center justify-between relative z-10 pt-1">
                  <span className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <strong className="text-white">419</strong> Online
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('mc.angkorcraft.kh');
                      handleLaunchGame();
                    }}
                    className="px-4 py-1.5 rounded-full border border-[#00ff88] bg-black/80 text-white font-extrabold text-[11px] shadow-[0_0_12px_rgba(0,255,136,0.45)] hover:scale-105 transition-all flex items-center gap-1.5"
                  >
                    <Play size={11} className="fill-white" />
                    <span>Connect Server</span>
                  </button>
                </div>
              </div>

              {/* Server 3: Khmer Tournament PvP Arena (Red) */}
              <div className="relative overflow-hidden rounded-[16px] border border-[#ff0044] bg-gradient-to-r from-[#180509] via-[#2b0a11] to-[#23090f]/80 p-3.5 flex flex-col justify-between min-h-[140px] shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_18px_rgba(255,0,68,0.35)]">
                <div className="flex items-center gap-3 relative z-10">
                  <img src="/src/assets/server_icon_pvp.png" alt="PvP" className="w-14 h-14 object-contain" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-white">Khmer Tournament PvP Arena</strong>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#ef4444] bg-[#ef4444]/20 text-[#f87171]">🏆 COMPETITIVE</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 w-fit">
                      <code className="text-[11px] font-mono text-[#38bdf8]">pvp.khmerlauncher.site</code>
                      <button onClick={() => navigator.clipboard.writeText('pvp.khmerlauncher.site')} className="text-gray-400 hover:text-white text-[11px]">📋</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                    <span>12 ms</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 relative z-10 my-1 line-clamp-1">Official 1.21.1 Competitive Nodebuff, Boxing, Crystal PvP, and Ranked Tournaments.</p>
                <div className="flex items-center justify-between relative z-10 pt-1">
                  <span className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <strong className="text-white">260</strong> Online
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('pvp.khmerlauncher.site');
                      handleLaunchGame();
                    }}
                    className="px-4 py-1.5 rounded-full border border-[#ff0044] bg-black/80 text-white font-extrabold text-[11px] shadow-[0_0_12px_rgba(255,0,68,0.45)] hover:scale-105 transition-all flex items-center gap-1.5"
                  >
                    <Play size={11} className="fill-white" />
                    <span>Connect Server</span>
                  </button>
                </div>
              </div>

              {/* Server 4: Hypixel Network (Purple) */}
              <div className="relative overflow-hidden rounded-[16px] border border-[#a855f7] bg-gradient-to-r from-[#0d0618] via-[#1a0b30] to-[#160a2a]/80 p-3.5 flex flex-col justify-between min-h-[140px] shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_18px_rgba(168,85,247,0.35)]">
                <div className="flex items-center gap-3 relative z-10">
                  <img src="/src/assets/server_icon_hypixel.png" alt="Hypixel" className="w-14 h-14 object-contain" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-white">Hypixel Network</strong>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#06b6d4] bg-[#06b6d4]/20 text-[#22d3ee]">🌐 GLOBAL</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 w-fit">
                      <code className="text-[11px] font-mono text-[#38bdf8]">mc.hypixel.net</code>
                      <button onClick={() => navigator.clipboard.writeText('mc.hypixel.net')} className="text-gray-400 hover:text-white text-[11px]">📋</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shadow-[0_0_6px_#fbbf24]" />
                    <span>180 ms</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 relative z-10 my-1 line-clamp-1">The World's largest Minecraft multiplayer server featuring Bedwars, Skywars, and Duels.</p>
                <div className="flex items-center justify-between relative z-10 pt-1">
                  <span className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <strong className="text-white">42,150</strong> Online
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('mc.hypixel.net');
                      handleLaunchGame();
                    }}
                    className="px-4 py-1.5 rounded-full border border-[#a855f7] bg-black/80 text-white font-extrabold text-[11px] shadow-[0_0_12px_rgba(168,85,247,0.45)] hover:scale-105 transition-all flex items-center gap-1.5"
                  >
                    <Play size={11} className="fill-white" />
                    <span>Connect Server</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informational Subsystems (Loaded on other tabs) */}
        {activeTab !== 'play' && activeTab !== 'installations' && activeTab !== 'servers' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-[#0f121a]/90 border border-[#1f2636] rounded-2xl max-w-md shadow-2xl">
              <div className="text-lg font-bold text-white capitalize mb-1">
                {activeTab.replace('-', ' ')} Hub Module
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Connected to local .minecraft configuration and Fabric mod bridge.
              </p>
              <button 
                onClick={() => setActiveTab('play')}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:brightness-110"
              >
                Return to Play Screen
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. Bottom Launch & Version Control Footer */}
      <footer className="relative z-50 h-18 bg-[#0a0c10]/95 border-t border-[#1a1f2c] px-6 py-3 flex items-center justify-between">
        
        {/* Version Selector Card */}
        <div className="flex items-center gap-3 p-1.5 rounded-xl border border-purple-500/80 bg-[#12101a] shadow-[0_0_12px_rgba(168,85,247,0.2)]">
          <div className="w-8 h-8 rounded-lg bg-purple-950 flex items-center justify-center text-xs">
            ⚡
          </div>
          <div className="flex flex-col leading-none pr-3">
            <span className="text-xs font-bold text-white">{activeVersion}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Custom Mods Active</span>
          </div>
        </div>

        {/* Centered Launch CTA */}
        <button
          onClick={handleLaunchGame}
          disabled={isLaunching}
          className="px-14 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 active:scale-95 text-black font-black text-base tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2"
        >
          <Play size={18} fill="currentColor" />
          {isLaunching ? 'LAUNCHING...' : 'PLAY'}
        </button>

        {/* Metadata */}
        <div className="text-right leading-none">
          <div className="text-xs font-bold text-gray-300">Account Required</div>
          <div className="text-[10px] text-cyan-400 font-mono mt-1">POWERED BY KHMER LAUNCHER</div>
        </div>
      </footer>
    </div>
  );
}
