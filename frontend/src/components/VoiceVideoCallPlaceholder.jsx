'use client';

import React, { useState } from 'react';
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, Volume2, ShieldAlert } from 'lucide-react';
import GlassCard from './GlassCard';

const VoiceVideoCallPlaceholder = ({ partnerName, partnerAvatar }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState(null); // 'voice' or 'video'
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const startCall = (type) => {
    setIsCalling(true);
    setCallType(type);
  };

  const endCall = () => {
    setIsCalling(false);
    setCallType(null);
  };

  return (
    <GlassCard className="border border-indigo-400/20 relative overflow-hidden" glow={isCalling}>
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Main Call Display */}
      {!isCalling ? (
        <div className="text-center py-6">
          <div className="relative inline-flex items-center justify-center mb-4">
            <img
              src={
                partnerAvatar?.startsWith('/uploads')
                  ? `http://localhost:5001${partnerAvatar}`
                  : partnerAvatar || '/uploads/default-avatar.png'
              }
              alt={partnerName}
              className="h-16 w-16 rounded-full object-cover border-2 border-pink-400"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            Connect with {partnerName}
          </h3>
          <p className="text-xs text-slate-400 max-w-70 mx-auto mb-6">
            Start a high-definition encrypted voice or video call with your match.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => startCall('voice')}
              className="flex items-center justify-center gap-2 bg-linear-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <Phone className="h-4 w-4" />
              Voice Call
            </button>
            <button
              onClick={() => startCall('video')}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <Video className="h-4 w-4" />
              Video Call
            </button>
          </div>
        </div>
      ) : (
        /* Call In-Progress Overlay */
        <div className="flex flex-col items-center py-4 relative">
          <div className="absolute top-0 right-0 bg-pink-500/20 dark:bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase animate-pulse">
            Mock Mode
          </div>

          {callType === 'video' && !videoOff ? (
            /* Mock Video Feed */
            <div className="relative w-full aspect-video rounded-xl bg-slate-800 dark:bg-slate-950 flex items-center justify-center overflow-hidden border border-pink-400/20 shadow-inner mb-6">
              <img
                src={
                  partnerAvatar?.startsWith('/uploads')
                    ? `http://localhost:5001${partnerAvatar}`
                    : partnerAvatar || '/uploads/default-avatar.png'
                }
                alt={partnerName}
                className="h-full w-full object-cover filter blur-[2px] opacity-75"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
              
              <div className="absolute text-center text-white">
                <Volume2 className="h-8 w-8 mx-auto mb-2 animate-bounce" />
                <span className="text-sm font-bold">{partnerName} connected...</span>
              </div>

              {/* Sender Mock Picture-in-Picture */}
              <div className="absolute bottom-2 right-2 w-16 sm:w-20 aspect-video rounded bg-slate-950/70 border border-white/20 flex items-center justify-center text-white text-[9px] font-semibold">
                You
              </div>
            </div>
          ) : (
            /* Mock Voice Dial Screen */
            <div className="flex flex-col items-center mb-6">
              <div className="relative h-20 w-20 rounded-full flex items-center justify-center border-2 border-indigo-400 p-1 mb-4 animate-glow">
                <img
                  src={
                    partnerAvatar?.startsWith('/uploads')
                      ? `http://localhost:5001${partnerAvatar}`
                      : partnerAvatar || '/uploads/default-avatar.png'
                  }
                  alt={partnerName}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{partnerName}</h4>
              <span className="text-xs text-indigo-500 font-semibold mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                Calling...
              </span>
            </div>
          )}

          {/* Action Dial Toggles */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setMuted(!muted)}
              className={`p-3 rounded-full shadow transition ${
                muted
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350'
              }`}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <button
              onClick={endCall}
              className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transform hover:scale-105 transition"
              title="Hang Up"
            >
              <PhoneOff className="h-5 w-5" />
            </button>

            {callType === 'video' && (
              <button
                onClick={() => setVideoOff(!videoOff)}
                className={`p-3 rounded-full shadow transition ${
                  videoOff
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350'
                }`}
                title={videoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {videoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-pink-500" />
            Signaling placeholder channel enabled. Calls require active WebRTC.
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default VoiceVideoCallPlaceholder;
