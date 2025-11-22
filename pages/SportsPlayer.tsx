
import React, { useState, useEffect } from 'react';
import { SportsMatch, SportsStream } from '../types';
import { ArrowLeft, AlertCircle, Zap, ShieldCheck, MonitorPlay, Globe, ExternalLink, Info } from 'lucide-react';

interface SportsPlayerProps {
  match: SportsMatch;
  onBack: () => void;
}

export const SportsPlayer: React.FC<SportsPlayerProps> = ({ match, onBack }) => {
  const [activeStream, setActiveStream] = useState<SportsStream | null>(null);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [adBlockWarning, setAdBlockWarning] = useState(true);

  // Auto-play best stream
  useEffect(() => {
    if (match.streams.length > 0 && !activeStream) {
       // Priority: HD English -> English -> HD -> First
       const best = match.streams.find(s => s.quality === 'hd' && s.language?.toLowerCase() === 'english') 
                 || match.streams.find(s => s.language?.toLowerCase() === 'english')
                 || match.streams.find(s => s.quality === 'hd')
                 || match.streams[0];
       setActiveStream(best);
    }
  }, [match]);

  const handlePlayStream = (stream: SportsStream) => {
      setActiveStream(stream);
      setStreamError(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-4 z-20">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[var(--text-main)] truncate">{match.title}</h1>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="text-[rgb(var(--primary-color))] font-bold uppercase">{match.category}</span>
            {match.league && <span>• {match.league}</span>}
            <span>•</span>
            <span className="flex items-center gap-1 text-red-500 font-bold animate-pulse">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> LIVE
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Player Container */}
        <div className="flex-1 bg-black flex flex-col relative order-1 lg:order-1">
            <div className="relative w-full h-full flex items-center justify-center aspect-video lg:aspect-auto bg-black group">
                {activeStream ? (
                    !streamError ? (
                        <>
                            <iframe 
                                key={activeStream.url} 
                                src={activeStream.url} 
                                className="w-full h-full absolute inset-0 z-10" 
                                frameBorder="0" 
                                allowFullScreen 
                                allow="autoplay; encrypted-media; picture-in-picture"
                                referrerPolicy="origin"
                                onError={() => setStreamError(true)}
                            ></iframe>
                            
                            {/* AdBlock Overlay Hint */}
                            {adBlockWarning && activeStream.ads && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-600/90 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-fade-in backdrop-blur-md pointer-events-none">
                                    <Info className="w-4 h-4" /> Use an AdBlocker for best experience
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-8">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-white font-bold mb-2">Stream Connection Failed</p>
                            <p className="text-[var(--text-muted)] text-sm">Please select a different stream from the list.</p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                         <MonitorPlay className="w-16 h-16 text-[var(--text-muted)] opacity-20 mb-4" />
                         <p className="text-[var(--text-muted)] text-sm">Select a stream to start watching</p>
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar / Bottom Bar for Streams */}
        <div className="bg-[var(--bg-card)] border-l border-[var(--border-color)] w-full lg:w-96 flex flex-col shrink-0 lg:h-full h-[40vh] lg:max-h-none order-2 lg:order-2 flex-grow-0">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/50 shrink-0">
                <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[rgb(var(--primary-color))]" /> 
                    Available Streams
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {match.streams.length} streams available.
                </p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {match.streams.length === 0 ? (
                     <div className="p-8 text-center text-[var(--text-muted)] text-xs">
                        No streams found for this match.
                     </div>
                ) : (
                    match.streams.map((stream, idx) => {
                        const isPlaying = activeStream?.url === stream.url;
                        return (
                            <button
                                key={idx}
                                onClick={() => handlePlayStream(stream)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left group ${
                                    isPlaying 
                                        ? 'bg-[rgb(var(--primary-color))]/10 border-[rgb(var(--primary-color))]' 
                                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[rgb(var(--primary-color))] animate-pulse' : 'bg-[var(--text-muted)]/30'}`}></div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-xs font-bold ${isPlaying ? 'text-[rgb(var(--primary-color))]' : 'text-[var(--text-main)]'}`}>
                                                Stream {idx + 1}
                                            </p>
                                            {stream.quality === 'hd' && (
                                                <span className="text-[10px] bg-blue-500/20 text-blue-500 border border-blue-500/30 px-1 rounded font-black leading-none">HD</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                                                <Globe className="w-3 h-3" /> {stream.language || 'Unknown'}
                                            </p>
                                            {stream.isRedirect && (
                                                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" /> External
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isPlaying && <Zap className="w-4 h-4 text-[rgb(var(--primary-color))]" />}
                            </button>
                        );
                    })
                )}
            </div>
            
            <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-input)]/30 text-[10px] text-[var(--text-muted)] flex items-center gap-2 justify-center">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span>Secure Connection</span>
            </div>
        </div>
      </div>
    </div>
  );
};
