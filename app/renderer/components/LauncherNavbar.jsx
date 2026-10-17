import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LauncherNavbar Component
 * 
 * Production-ready animated navigation bar with:
 * 1. Gliding emerald active tab underline (layoutId="activeUnderline", spring physics).
 * 2. Floating hover pill highlight tracking cursor across tabs.
 * 3. 3D sword slash micro-interaction on hovering "PvP HUD Mods".
 * 4. Interactive user profile card with 180° chevron flip & glassmorphism accordion menu.
 */

// Custom SVG Icons
const SwordsIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" y1="14" x2="9" y2="18" />
    <line x1="7" y1="17" x2="4" y2="20" />
    <line x1="3" y1="19" x2="5" y2="21" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const UserIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogOutIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const TABS = [
  { id: 'play', label: 'Play' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'pvp-hud', label: 'PvP HUD Mods', hasIcon: true },
  { id: 'mods-mgr', label: 'Mods Manager' },
  { id: 'installations', label: 'Installations' },
  { id: 'skins', label: 'Skins' },
  { id: 'patch-notes', label: 'Patch Notes' },
];

export default function LauncherNavbar({
  activeTab = 'play',
  onSelectTab,
  username = 'DaraXD16899',
  initialStatus = 'OFFLINE',
  avatarUrl = 'https://minotar.net/avatar/MHF_Steve/32'
}) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userStatus, setUserStatus] = useState(initialStatus);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    if (onSelectTab) onSelectTab(tabId);
  };

  return (
    <header className="h-14 bg-[#111215] border-b border-[#202228] px-5 flex items-center justify-between select-none relative z-50">
      
      {/* 1. Left Nav Tabs with Sliding Line & Hover Pill */}
      <nav 
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHoveredTab(null)}
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              className="relative px-3.5 py-4 text-xs font-semibold tracking-wide transition-colors duration-150 flex items-center gap-1.5 focus:outline-none"
            >
              {/* Hover Pill Background */}
              {isHovered && !isActive && (
                <motion.div
                  layoutId="hoverNavPill"
                  className="absolute inset-x-1 inset-y-2 rounded-md bg-white/[0.06]"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                />
              )}

              {/* Tab Title */}
              <span className={`relative z-10 transition-colors ${
                isActive ? 'text-white font-bold' : isHovered ? 'text-gray-200' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>

              {/* Crossed Swords Micro-Interaction on Hover */}
              {tab.hasIcon && (
                <motion.span
                  className="relative z-10 text-gray-400"
                  animate={isHovered ? { rotate: [0, -15, 15, 0], scale: 1.15 } : { rotate: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <SwordsIcon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_#10B981]' : ''}`} />
                </motion.span>
              )}

              {/* Active Sliding Emerald Underline */}
              {isActive && (
                <motion.div
                  layoutId="activeUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#10B981] shadow-[0_0_10px_#10B981]"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* 2. Right Profile Trigger Area with Dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-[#2b2e36] bg-[#16181d] hover:bg-[#1c1f26] hover:border-[#383d47] transition-all shadow-sm"
        >
          {/* Steve Pixel Avatar */}
          <img
            src={avatarUrl}
            alt="Skin"
            className="w-6 h-6 rounded bg-[#202020] border border-black/50 image-rendering-pixelated"
          />

          {/* User Details */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-200">{username}</span>
            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm leading-tight ${
              userStatus === 'ONLINE' ? 'bg-emerald-500 text-black' : 'bg-[#f97316] text-black'
            }`}>
              {userStatus}
            </span>
          </div>

          {/* Animated 180° Flipping Chevron Arrow */}
          <motion.div
            animate={{ rotate: isProfileOpen ? 180 : 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-gray-400 ml-0.5"
          >
            <ChevronDownIcon className="w-3.5 h-3.5" />
          </motion.div>
        </button>

        {/* Dropdown Card */}
        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-56 rounded-xl bg-[#15171d]/95 backdrop-blur-xl border border-[#2a2e38] shadow-[0_15px_35px_rgba(0,0,0,0.8)] overflow-hidden py-1.5 z-50"
            >
              <div className="px-3.5 py-2.5 border-b border-[#232730]">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Signed in as</p>
                <p className="text-xs font-black text-white truncate mt-0.5">{username}</p>
              </div>

              <div className="p-1 space-y-0.5">
                {/* Toggle Online / Offline Status */}
                <button
                  onClick={() => {
                    setUserStatus(userStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-[#20242e] hover:text-white rounded-lg transition-colors text-left"
                >
                  <span className={`w-2 h-2 rounded-full ${userStatus === 'ONLINE' ? 'bg-[#f97316]' : 'bg-emerald-400'}`} />
                  <span>Set Status to {userStatus === 'ONLINE' ? 'Offline' : 'Online'}</span>
                </button>

                {/* Manage Profiles */}
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-[#20242e] hover:text-white rounded-lg transition-colors text-left"
                >
                  <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Switch &amp; Manage Accounts</span>
                </button>

                <div className="my-1 border-t border-[#232730]" />

                {/* Log Out */}
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                >
                  <LogOutIcon className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
