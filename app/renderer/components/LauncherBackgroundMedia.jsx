import React, { useState, useRef, useEffect } from 'react';

/**
 * LauncherBackgroundMedia.jsx
 * 
 * Animated Looping Video Background with Integrated Khmer Traditional BGM & Glassmorphism Controller.
 * 
 * Features:
 * - Fullscreen background video layer with 45% black tint scrim.
 * - Dedicated HTML5 audio player with smooth auto-fade in from 0% to default 30% volume.
 * - Glassmorphism media pill HUD widget:
 *   * Live animated 4-bar sound equalizer.
 *   * Track title display ("Khmer Traditional Classical Melody - Sunrise Theme").
 *   * Play / Pause audio toggle.
 *   * Video motion toggle (pauses video rendering to save CPU/GPU cycles).
 *   * Compact volume slider.
 */

// Pure SVG Icons for standalone zero-dependency reliability
const VolumeIcon = ({ muted, className = "w-4 h-4" }) => (
  muted ? (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
);

const PlayIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const FilmIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);

export default function LauncherBackgroundMedia({
  videoSrc = './assets/angkor_wat_bg.mp4',
  posterSrc = './assets/angkor_wat_bg.jpg',
  audioSrc = './assets/khmer_traditional_bgm.mp3',
  songTitle = 'Khmer Traditional Classical Melody - Sunrise Theme',
  defaultVolume = 0.35,
  children
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [volume, setVolume] = useState(defaultVolume);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  // 1. Smooth Auto-Fade In Sound on Launch (0% -> defaultVolume over 2.5s)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsAudioLoaded(true);
          let current = 0;
          const target = volume;
          fadeIntervalRef.current = setInterval(() => {
            current += 0.03;
            if (current >= target) {
              audio.volume = target;
              clearInterval(fadeIntervalRef.current);
            } else {
              audio.volume = current;
            }
          }, 120);
        })
        .catch(() => {
          // Autoplay policy or no media file yet
          setIsPlayingAudio(false);
        });
    }

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  // 2. Volume Change Synchronization
  useEffect(() => {
    if (audioRef.current && isAudioLoaded) {
      audioRef.current.volume = isPlayingAudio ? volume : 0;
    }
  }, [volume, isPlayingAudio, isAudioLoaded]);

  // 3. Audio Toggle (Play / Pause)
  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.volume = volume;
      audio.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  // 4. Video Toggle (Play / Pause for low-end hardware performance saving)
  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlayingVideo) {
      video.pause();
      setIsPlayingVideo(false);
    } else {
      video.play().catch(() => {});
      setIsPlayingVideo(true);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden select-none bg-[#090a0f]">
      {/* ======================================================== */}
      {/* 1. BACKGROUND VIDEO LAYER                                 */}
      {/* ======================================================== */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster={posterSrc}
          className="w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: isPlayingVideo ? 1 : 0.8 }}
        >
          <source src={videoSrc} type="video/mp4" />
          {/* Fallback to high-res poster image if video unsupported or missing */}
          <img src={posterSrc} alt="Angkor Wat Background" className="w-full h-full object-cover" />
        </video>

        {/* 2. DARK CONTRAST SCRIM OVERLAY (45% Black Tint + Subtle Blur) */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />
        
        {/* Subtle Vignette Gradient for Depth */}
        <div className="absolute inset-0 bg-radial-vignette opacity-60 pointer-events-none" 
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(5,6,10,0.85) 100%)'
          }}
        />
      </div>

      {/* ======================================================== */}
      {/* 2. DEDICATED AUDIO ELEMENT (Khmer Traditional BGM)        */}
      {/* ======================================================== */}
      <audio
        ref={audioRef}
        loop
        src={audioSrc}
        preload="auto"
      />

      {/* ======================================================== */}
      {/* 3. FOREGROUND CONTENT (Launcher Pages, Tabs & Modals)    */}
      {/* ======================================================== */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM-RIGHT AUDIO / VIDEO CONTROLLER PILL             */}
      {/* ======================================================== */}
      <div className="fixed bottom-5 right-6 z-30 flex items-center space-x-3.5 px-4 py-2.5 rounded-2xl bg-[#0f1118]/85 backdrop-blur-xl border border-slate-700/60 shadow-[0_10px_30px_rgba(0,0,0,0.7)] text-slate-200 transition-all hover:border-slate-600">
        
        {/* Animated Sound Equalizer Indicator */}
        <div className="flex items-end space-x-0.5 h-4 w-4">
          <span className={`w-0.5 bg-emerald-400 rounded-full transition-all duration-300 ${isPlayingAudio ? 'animate-[bounce_0.6s_ease-in-out_infinite] h-3.5' : 'h-1 bg-slate-600'}`} />
          <span className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${isPlayingAudio ? 'animate-[bounce_0.8s_ease-in-out_infinite_0.2s] h-4' : 'h-1.5 bg-slate-600'}`} />
          <span className={`w-0.5 bg-emerald-400 rounded-full transition-all duration-300 ${isPlayingAudio ? 'animate-[bounce_0.5s_ease-in-out_infinite_0.4s] h-2.5' : 'h-1 bg-slate-600'}`} />
          <span className={`w-0.5 bg-teal-400 rounded-full transition-all duration-300 ${isPlayingAudio ? 'animate-[bounce_0.7s_ease-in-out_infinite_0.1s] h-3' : 'h-1.5 bg-slate-600'}`} />
        </div>

        {/* Track Title Info */}
        <div className="hidden sm:flex flex-col max-w-[210px] text-left">
          <span className="text-[11px] font-bold text-slate-100 truncate tracking-tight">{songTitle}</span>
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
            {isPlayingAudio ? 'Now Playing' : 'Paused'}
          </span>
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Play / Pause Audio Toggle Button */}
        <button
          onClick={toggleAudio}
          title={isPlayingAudio ? "Pause Traditional Music" : "Play Traditional Music"}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center shadow"
        >
          {isPlayingAudio ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Volume Level / Mute Indicator */}
        <button
          onClick={() => {
            if (volume === 0) setVolume(defaultVolume);
            else setVolume(0);
          }}
          title={volume === 0 ? "Unmute Audio" : "Mute Audio"}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <VolumeIcon muted={volume === 0 || !isPlayingAudio} />
        </button>

        {/* Volume Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isPlayingAudio ? volume : 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVolume(val);
            if (!isPlayingAudio && val > 0) setIsPlayingAudio(true);
          }}
          className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />

        <div className="w-px h-5 bg-slate-800" />

        {/* Video Motion Toggle (Hardware performance optimizer) */}
        <button
          onClick={toggleVideo}
          title={isPlayingVideo ? "Disable Video Motion (Save GPU/Battery)" : "Enable Video Motion"}
          className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center space-x-1.5 transition-all ${
            isPlayingVideo
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <FilmIcon />
          <span>{isPlayingVideo ? 'Motion ON' : 'Motion OFF'}</span>
        </button>
      </div>
    </div>
  );
}
