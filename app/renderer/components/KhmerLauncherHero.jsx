import React, { useState, useEffect } from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Play, 
  Pause, 
  Volume2, 
  Palette, 
  ChevronDown, 
  Zap, 
  Sparkles, 
  Swords, 
  ShoppingBag, 
  FolderGit2, 
  Sliders, 
  Shirt, 
  ScrollText,
  Send
} from 'lucide-react';

/**
 * KHMER LAUNCHER | PvP Edition
 * Full modern esports Minecraft desktop interface built with React & Tailwind CSS.
 */
export default function KhmerLauncherHero() {
  const [activeTab, setActiveTab] = useState('play');
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.45);
  const [isVideoMotionOn, setIsVideoMotionOn] = useState(true);
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('Fabric 1.21.1');

  const navTabs = [
    { id: 'play', label: 'Play' },
    { id: 'store', label: 'Marketplace' },
    { id: 'pvpmods', label: 'PvP HUD Mods', badge: '⚔' },
    { id: 'mods', label: 'Mods Manager' },
    { id: 'installations', label: 'Installations' },
    { id: 'skins', label: 'Skins' },
    { id: 'patchnotes', label: 'Patch Notes' },
  ];

  return (
    <div className="relative w-full h-screen max-w-[1920px] max-h-[1080px] bg-[#0e0f12] text-white flex flex-col justify-between overflow-hidden select-none font-sans border border-[#232730] shadow-2xl">
      
      {/* =========================================================================
          1. BACKGROUND LAYER (Angkor Wat Looping Video / Atmospheric Scrim)
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Background Video / Picture */}
        <video 
          className={`w-full h-full object-cover transition-all duration-700 ${isVideoMotionOn ? 'filter-none scale-100' : 'filter brightness-90 saturate-75 contrast-105'}`}
          autoPlay 
          loop 
          muted 
          playsInline
          poster="assets/angkor_wat_bg.jpg"
        >
          <source src="assets/angkor_wat_bg.mp4" type="video/mp4" />
        </video>

        {/* Cinematic Scrim & Sunlight Flare Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c10]/70 via-[#0a0c10]/40 to-[#0e0f12]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
      </div>

      {/* =========================================================================
          2. TOP HEADER & NAVIGATION BAR
          ========================================================================= */}
      <header className="relative z-30 flex flex-col">
        {/* Window Shell Controls */}
        <div className="h-8 bg-[#090b0e]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-3 text-xs">
          {/* Brand Mark */}
          <div className="flex items-center gap-2">
            <img 
              src="assets/khmer_launcher_logo.png" 
              alt="Khmer Launcher" 
              className="w-4 h-4 rounded-full border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.6)] object-cover" 
            />
            <span className="font-extrabold text-amber-400 tracking-wider">KHMER LAUNCHER</span>
            <span className="text-gray-400 font-medium">| PvP Edition</span>
          </div>

          {/* Window Buttons */}
          <div className="flex items-center space-x-1">
            <button className="w-8 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
              <Minus size={13} />
            </button>
            <button className="w-8 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
              <Square size={11} />
            </button>
            <button className="w-8 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 rounded transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main Navigation Row */}
        <div className="h-12 bg-[#12151b]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                    isActive 
                      ? 'text-white font-bold' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && <span className="text-amber-400 text-xs animate-pulse">{tab.badge}</span>}
                  
                  {/* Glowing Gold Active State Indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Account Pill Capsule */}
          <div className="flex items-center">
            <div className="flex items-center gap-2.5 bg-[#181b22]/90 hover:bg-[#202530] border border-white/10 hover:border-amber-400/40 rounded-lg px-3 py-1.5 transition-all cursor-pointer shadow-lg">
              <img 
                src="https://minotar.net/avatar/MHF_Steve/24" 
                alt="Steve Avatar" 
                className="w-5 h-5 rounded-sm ring-1 ring-white/20" 
              />
              <span className="text-xs font-semibold text-gray-200">No Account</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-white/5">
                NONE
              </span>
              <ChevronDown size={13} className="text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. CENTER HERO DISPLAY
          ========================================================================= */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center -mt-6">
        
        {/* Royal Angkor Wat Golden Emblem Badge */}
        <div className="relative group">
          {/* Pulsing Aura */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-600/30 blur-2xl group-hover:blur-3xl opacity-80 group-hover:opacity-100 transition duration-700 animate-pulse" />
          
          {/* Emblem Container */}
          <div className="relative w-44 h-44 rounded-full border-[3px] border-[#d4af37] bg-black/95 p-1 shadow-[0_0_40px_rgba(212,175,55,0.7),_0_0_80px_rgba(245,158,11,0.4)] transition-transform duration-300 group-hover:scale-105 cursor-pointer overflow-hidden">
            <img 
              src="assets/khmer_launcher_logo.png" 
              alt="KHMER LAUNCHER OFFICIAL" 
              className="w-full h-full object-cover rounded-full select-none pointer-events-none" 
            />
          </div>
        </div>

        {/* Dual-Tone 3D Block Typography */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <h1 className="font-['Minecraft',_sans-serif] text-4xl tracking-widest font-black text-white drop-shadow-[0_4px_0_#000] [text-shadow:_0_0_30px_rgba(255,255,255,0.4),_3px_3px_0_#000]">
            KHMER
          </h1>
          <h1 className="font-['Minecraft',_sans-serif] text-4xl tracking-widest font-black text-amber-500 drop-shadow-[0_4px_0_#78350f] [text-shadow:_0_0_35px_rgba(245,158,11,0.85),_3px_3px_0_#78350f]">
            LAUNCHER
          </h1>
        </div>

        {/* Feature Badges Flex Row */}
        <div className="mt-4 flex items-center gap-2.5 flex-wrap justify-center">
          {/* Cyan Minecraft Version */}
          <span className="px-3 py-1 rounded bg-sky-950/40 border border-sky-400 text-sky-400 text-xs font-bold tracking-wider shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            MINECRAFT 1.21.1
          </span>

          {/* Emerald Green PvP Client */}
          <span className="px-3 py-1 rounded bg-emerald-950/40 border border-emerald-500 text-emerald-400 text-xs font-bold tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <Zap size={12} className="fill-emerald-400" />
            PVP CLIENT
          </span>

          {/* Blurple / Indigo Discord */}
          <button className="px-3 py-1 rounded bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-400 text-indigo-300 text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(129,140,248,0.2)]">
            <Swords size={12} />
            DISCORD
          </button>

          {/* Cyan Telegram */}
          <button className="px-3 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-400 text-cyan-300 text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.2)]">
            <Send size={12} />
            TELEGRAM
          </button>
        </div>
      </main>

      {/* =========================================================================
          4. FLOATING AMBIENT MEDIA CONTROLLER (Above footer on bottom-right)
          ========================================================================= */}
      <div className="relative z-30 flex justify-end px-8 pb-3">
        <div className="flex items-center gap-3 bg-[#0d1017]/90 backdrop-blur-xl border border-sky-400/30 hover:border-cyan-400/60 rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.8),_0_0_20px_rgba(56,189,248,0.2)] transition-all">
          
          {/* Animated Equalizer Wave */}
          <div className="flex items-end gap-0.5 h-4 w-4">
            <span className={`w-0.5 bg-emerald-400 rounded-full transition-all ${isPlayingAudio ? 'h-3.5 animate-bounce' : 'h-1'}`} />
            <span className={`w-0.5 bg-cyan-400 rounded-full transition-all ${isPlayingAudio ? 'h-2 animate-pulse' : 'h-1'}`} />
            <span className={`w-0.5 bg-emerald-300 rounded-full transition-all ${isPlayingAudio ? 'h-4 animate-bounce delay-75' : 'h-1'}`} />
            <span className={`w-0.5 bg-sky-400 rounded-full transition-all ${isPlayingAudio ? 'h-2.5 animate-pulse delay-100' : 'h-1'}`} />
          </div>

          {/* Song Meta */}
          <div className="flex flex-col max-w-[210px] text-left">
            <span className="text-[11px] font-bold text-gray-100 truncate">
              Khmer Traditional Classical Melody - Sunr...
            </span>
            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
              {isPlayingAudio ? 'NOW PLAYING' : 'PAUSED'}
            </span>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* Play/Pause Button */}
          <button 
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs text-cyan-300 transition-colors"
            title="Toggle Play / Pause"
          >
            {isPlayingAudio ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-1.5">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={audioVolume}
              onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-700 accent-teal-400 rounded-lg cursor-pointer"
              title="Melody Volume"
            />
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* Motion Toggle Button */}
          <button 
            onClick={() => setIsVideoMotionOn(!isVideoMotionOn)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              isVideoMotionOn 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                : 'bg-gray-800 text-gray-400 border border-white/5'
            }`}
            title="Toggle Animated Motion"
          >
            {isVideoMotionOn ? 'Motion ON' : 'Motion OFF'}
          </button>
        </div>
      </div>

      {/* =========================================================================
          5. BOTTOM CONTROL LAUNCHER FOOTER
          ========================================================================= */}
      <footer className="relative z-30 h-24 bg-[#111317] border-t-2 border-white/5 flex items-center justify-between px-8">
        
        {/* Left Utilities */}
        <div className="flex items-center gap-2">
          {/* Square Play Shortcut Button */}
          <button className="w-11 h-11 bg-[#1a1e26] hover:bg-[#232936] border border-white/10 rounded flex items-center justify-center text-gray-300 hover:text-white transition-colors shadow">
            <Play size={16} className="fill-gray-300" />
          </button>

          {/* Theme Palette Icon Button */}
          <button className="w-11 h-11 bg-[#1a1e26] hover:bg-[#232936] border border-white/10 rounded flex items-center justify-center text-gray-300 hover:text-amber-400 transition-colors shadow" title="Wallpaper Theme Selector">
            <Palette size={16} />
          </button>
        </div>

        {/* Center-Left Version Profile Card */}
        <div className="relative">
          <div 
            onClick={() => setVersionDropdownOpen(!versionDropdownOpen)}
            className="flex items-center gap-3 bg-[#16181f] hover:bg-[#1c1f28] border-2 border-purple-500/80 rounded px-4 py-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all min-w-[210px]"
          >
            <span className="text-xl">😵‍💫</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">{selectedVersion}</span>
              <span className="text-[10px] text-gray-400">Custom Mods Active</span>
            </div>
            <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${versionDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Options */}
          {versionDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-full bg-[#16181f] border border-purple-500/50 rounded shadow-2xl py-1 flex flex-col z-50">
              <button 
                onClick={() => { setSelectedVersion('Fabric 1.21.1'); setVersionDropdownOpen(false); }}
                className="px-3 py-2 text-xs font-semibold hover:bg-purple-600/30 text-left flex items-center justify-between"
              >
                <span>Fabric 1.21.1 (Modded)</span>
                <span className="text-[10px] text-emerald-400">Active</span>
              </button>
              <button 
                onClick={() => { setSelectedVersion('Vanilla 1.21.1'); setVersionDropdownOpen(false); }}
                className="px-3 py-2 text-xs font-semibold hover:bg-purple-600/30 text-left text-gray-300"
              >
                Vanilla 1.21.1
              </button>
            </div>
          )}
        </div>

        {/* Central Launch CTA: Wide, Glowing Neon Green Button in Pixel Block Font */}
        <div className="flex items-center justify-center">
          <button 
            className="group relative px-16 py-3.5 bg-gradient-to-b from-[#2ebd59] to-[#1e823c] hover:from-[#34d363] hover:to-[#229947] active:translate-y-0.5 border-t border-emerald-300/40 border-b-4 border-[#14532d] rounded-lg shadow-[0_0_35px_rgba(46,189,89,0.5),_0_8px_20px_rgba(0,0,0,0.6)] transition-all cursor-pointer"
          >
            <span className="font-['Minecraft',_sans-serif] text-2xl tracking-widest text-white drop-shadow-[2px_2px_0_#14532d]">
              PLAY
            </span>
          </button>
        </div>

        {/* Right Metadata */}
        <div className="flex flex-col items-end justify-center">
          <span className="text-xs font-bold text-gray-300 tracking-wide">
            Account Required
          </span>
          <span className="text-[10px] font-black tracking-wider text-sky-400 uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
            POWERED BY KHMER LAUNCHER
          </span>
        </div>

      </footer>
    </div>
  );
}
