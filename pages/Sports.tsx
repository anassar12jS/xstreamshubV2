
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Trophy, Calendar, PlayCircle, Clock, Zap, Loader2, Filter, Bell, BellRing, RadioReceiver } from 'lucide-react';
import { getMatches, SPORTS_CATEGORIES } from '../services/sports';
import { SportsMatch } from '../types';

interface SportsProps {
  onPlay: (match: SportsMatch) => void;
}

// Memoize TeamLogo to prevent expensive color calculation on every render
const TeamLogo: React.FC<{ name: string, logo?: string, className?: string }> = React.memo(({ name, logo, className = "w-8 h-8" }) => {
    const [imgError, setImgError] = useState(false);

    const getColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    if (logo && !imgError) {
        return (
            <div className={`rounded-full flex items-center justify-center bg-white/10 border border-white/10 shrink-0 overflow-hidden relative ${className}`}>
                <img 
                    src={logo} 
                    alt={name} 
                    className="w-full h-full object-contain p-0.5" 
                    loading="lazy" 
                    onError={() => setImgError(true)} 
                    referrerPolicy="no-referrer"
                />
            </div>
        );
    }

    const initials = name.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const bg = getColor(name);

    return (
        <div 
            className={`rounded-full flex items-center justify-center text-white font-bold shadow-sm border border-white/10 shrink-0 ${className}`} 
            style={{ backgroundColor: bg, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
            {initials}
        </div>
    );
});

// Extracted MatchCard component to prevent re-creation on every render (CRITICAL FOR PERFORMANCE)
const MatchCard: React.FC<{ 
    match: SportsMatch, 
    isLive: boolean, 
    onPlay: (match: SportsMatch) => void,
    onNotify: (match: SportsMatch, e: React.MouseEvent) => void,
    isNotified: boolean
}> = React.memo(({ match, isLive, onPlay, onNotify, isNotified }) => {
    const dateObj = new Date(match.date);
    const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const dateStr = dateObj.toLocaleDateString([], {month: 'short', day: 'numeric'});
    const [posterFailed, setPosterFailed] = useState(false);

    // Special Poster Card (Featured/Live)
    if (match.poster && !posterFailed) {
      return (
          <div 
              onClick={() => isLive && onPlay(match)}
              className={`group relative overflow-hidden rounded-xl border border-[var(--border-color)] transition-transform duration-300 aspect-video ${
                  isLive 
                      ? 'cursor-pointer hover:shadow-lg hover:shadow-[rgb(var(--primary-color))]/20 hover:border-[rgb(var(--primary-color))]' 
                      : ''
              } will-change-transform`}
          >
              <div className="absolute inset-0">
                  <img 
                      src={match.poster} 
                      alt={match.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                      onError={() => setPosterFailed(true)}
                      referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-black/40 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent opacity-60"></div>
              </div>

              <div className="absolute inset-0 p-2 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                      <span className="bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider">
                          {match.category}
                      </span>
                      {isLive && (
                          <span className="bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-lg shadow-red-900/20">
                              <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span> LIVE
                          </span>
                      )}
                  </div>

                  <div className="mt-auto">
                      <h3 className="text-white font-black text-sm md:text-base leading-none drop-shadow-lg text-center mb-1 uppercase italic line-clamp-2">
                          {match.title}
                      </h3>
                      <div className="flex items-center justify-between border-t border-white/10 pt-2">
                          <span className="text-[9px] font-bold text-gray-200 shadow-black drop-shadow-md">
                              {isLive ? 'Streaming' : `${dateStr} • ${timeStr}`}
                          </span>
                          {isLive ? (
                              <button className="bg-[rgb(var(--primary-color))] text-white px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-lg shadow-[rgb(var(--primary-color))]/20">
                                  <PlayCircle className="w-3 h-3" /> Watch
                              </button>
                          ) : (
                              <button 
                                  onClick={(e) => onNotify(match, e)}
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 transition-colors border backdrop-blur-sm ${isNotified ? 'bg-white text-black border-white' : 'bg-black/40 text-white border-white/20 hover:bg-white/10'}`}
                              >
                                  {isNotified ? <BellRing className="w-2.5 h-2.5" /> : <Bell className="w-2.5 h-2.5" />}
                                  {isNotified ? 'Set' : 'Notify'}
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
    }

    // Standard Compact Card
    return (
      <div 
          onClick={() => isLive && onPlay(match)}
          className={`group relative overflow-hidden rounded-lg transition-colors duration-200 border ${
              isLive 
                  ? 'bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-hover)] border-blue-500/30 hover:border-blue-500/60 cursor-pointer' 
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
          }`}
      >
          <div className="p-2 flex flex-col h-full gap-2">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2 min-w-0">
                       <span className="text-[var(--text-muted)] bg-[var(--bg-input)] px-1 py-0.5 rounded border border-[var(--border-color)] truncate max-w-[60px]">
                          {match.category}
                       </span>
                       {match.league && <span className="text-[var(--text-muted)] opacity-70 truncate max-w-[80px]">{match.league}</span>}
                  </div>
                  {isLive ? (
                      <span className="text-red-500 flex items-center gap-1 shrink-0">
                          <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span> LIVE
                      </span>
                  ) : (
                      <span className="text-[var(--text-muted)] shrink-0">{timeStr}</span>
                  )}
              </div>

              <div className="flex items-center justify-between gap-1">
                  {match.teams?.home && match.teams?.away ? (
                      <>
                          <div className="flex-1 flex flex-col items-center text-center gap-1 min-w-0">
                              <TeamLogo name={match.teams.home.name} logo={match.teams.home.logo} className="w-8 h-8 text-xs" />
                              <span className={`text-[9px] font-bold leading-tight line-clamp-2 ${isLive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                  {match.teams.home.name}
                              </span>
                          </div>
                          <div className="text-[var(--text-muted)] font-black text-[9px] opacity-30 pb-2">VS</div>
                          <div className="flex-1 flex flex-col items-center text-center gap-1 min-w-0">
                              <TeamLogo name={match.teams.away.name} logo={match.teams.away.logo} className="w-8 h-8 text-xs" />
                              <span className={`text-[9px] font-bold leading-tight line-clamp-2 ${isLive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                  {match.teams.away.name}
                              </span>
                          </div>
                      </>
                  ) : (
                      <h3 className="text-[10px] font-bold text-[var(--text-main)] line-clamp-2 text-center w-full py-2">{match.title}</h3>
                  )}
              </div>

              <div className="pt-1.5 border-t border-[var(--border-color)] flex items-center justify-between">
                   <span className="text-[9px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                      <RadioReceiver className="w-2.5 h-2.5" /> {match.streams.length}
                   </span>
                   {isLive ? (
                       <button className="bg-[var(--text-main)] text-[var(--bg-main)] px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 hover:opacity-90">
                          <PlayCircle className="w-2.5 h-2.5" /> Watch
                       </button>
                   ) : (
                       <button 
                          onClick={(e) => onNotify(match, e)}
                          disabled={isNotified}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition-colors border ${isNotified ? 'bg-[rgb(var(--primary-color))]/10 text-[rgb(var(--primary-color))] border-[rgb(var(--primary-color))]' : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}`}
                      >
                           {isNotified ? <BellRing className="w-2.5 h-2.5" /> : <Bell className="w-2.5 h-2.5" />}
                           {isNotified ? 'Set' : 'Notify'}
                      </button>
                   )}
              </div>
          </div>
      </div>
    );
});

export const Sports: React.FC<SportsProps> = ({ onPlay }) => {
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [notifiedMatches, setNotifiedMatches] = useState<string[]>([]);
  
  // Use Ref to track IDs to avoid state dependency loops in effect
  const loadedIds = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;
    loadedIds.current.clear();
    setMatches([]);
    setLoading(true);

    const loadAllSports = async () => {
        const fetchSport = async (sport: string) => {
            if (!mounted) return;
            try {
                const data = await getMatches(sport);
                if (!mounted) return;
                
                if (data && data.length > 0) {
                    setMatches(prev => {
                        // Optimized merge: only add new items, minimal re-sort
                        const newItems = data.filter(m => !loadedIds.current.has(m.id));
                        if (newItems.length === 0) return prev;
                        
                        newItems.forEach(m => loadedIds.current.add(m.id));
                        const combined = [...prev, ...newItems];
                        // Sort is somewhat expensive, but necessary. 
                        // Reducing object creation in mapMatch (in service) helps here.
                        return combined.sort((a, b) => a.date - b.date);
                    });
                    setLoading(false);
                }
            } catch (e) {
                console.warn(`Failed to load ${sport}`, e);
            }
        };

        // Prioritize Football
        fetchSport('football');

        // Parallel fetch for others
        const others = SPORTS_CATEGORIES.filter(s => s !== 'football');
        others.forEach(sport => fetchSport(sport));

        setTimeout(() => {
            if (mounted) setLoading(false);
        }, 4000);
    };

    loadAllSports();
    
    return () => { mounted = false; };
  }, []);

  // Filtering & Logic
  const { liveMatches, upcomingMatches } = useMemo(() => {
    const now = Date.now();
    
    // 1. Filter
    let filtered = activeCategory === 'ALL' 
        ? matches 
        : matches.filter(m => m.category.toUpperCase() === activeCategory);

    // 2. Sort priority
    // Only sort if filtering changed to avoid re-sorting same array ref
    // But since we filtered, we have a new array anyway.
    // Optimization: Use simple sort comparator
    filtered.sort((a, b) => {
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return a.date - b.date;
    });

    const live: SportsMatch[] = [];
    const upcoming: SportsMatch[] = [];

    for (const m of filtered) {
        const diff = m.date - now;
        // Live if Status says so OR time is within window (-3h to +15m)
        const isLiveStatus = m.status && (['in', 'live', '1'].includes(m.status.toLowerCase()));
        const isLiveTime = diff < 15 * 60 * 1000 && diff > -3 * 60 * 60 * 1000;

        if (isLiveStatus || isLiveTime) {
            live.push(m);
        } else if (diff >= 15 * 60 * 1000) {
            upcoming.push(m);
        }
    }

    return { liveMatches: live, upcomingMatches: upcoming };
  }, [matches, activeCategory]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(matches.map(m => m.category.toUpperCase()))) as string[];
    const priority = ['FOOTBALL', 'FIGHT', 'MOTORSPORT', 'BASKETBALL', 'TENNIS', 'BASEBALL'];
    cats.sort((a, b) => {
        const idxA = priority.indexOf(a);
        const idxB = priority.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
    return ['ALL', ...cats];
  }, [matches]);

  const handleNotify = useCallback((match: SportsMatch, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!("Notification" in window)) {
          alert("This browser does not support notifications.");
          return;
      }
      
      const schedule = () => {
          setNotifiedMatches(prev => [...prev, match.title]);
          const diff = match.date - Date.now();
          if (diff > 0) {
              setTimeout(() => {
                  new Notification("Match Starting Soon!", {
                      body: `${match.title} is starting in 5 minutes!`,
                      icon: "https://cdn-icons-png.flaticon.com/512/4221/4221484.png"
                  });
              }, Math.max(0, diff - (5 * 60 * 1000)));
          }
      };

      if (Notification.permission === "granted") {
          schedule();
      } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
              if (permission === "granted") schedule();
          });
      }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 min-h-screen animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20 shrink-0">
               <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase italic leading-none">Live Sports</h2>
                <p className="text-[9px] text-[var(--text-muted)] font-medium">Real-time events dashboard</p>
            </div>
        </div>
        
        <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-colors ${
                            activeCategory === cat 
                            ? 'bg-[var(--text-main)] text-[var(--bg-main)]' 
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                        }`}
                    >
                        {cat === 'ALL' ? 'All' : cat}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {loading && matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-[var(--text-muted)] text-[10px] font-mono animate-pulse">LOADING EVENTS...</p>
        </div>
      ) : matches.length === 0 ? (
         <div className="text-center py-20 text-[var(--text-muted)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] border-dashed">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No matches found.</p>
         </div>
      ) : (
         <div className="space-y-6">
            {liveMatches.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <h3 className="text-sm font-bold text-[var(--text-main)]">Live Now</h3>
                        <span className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded-full border border-[var(--border-color)]">
                            {liveMatches.length}
                        </span>
                    </div>
                    {/* Content Visibility Auto improves rendering performance for large lists */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2" style={{ contentVisibility: 'auto' }}>
                        {liveMatches.map((match) => (
                            <MatchCard 
                                key={match.id} 
                                match={match} 
                                isLive={true} 
                                onPlay={onPlay} 
                                onNotify={handleNotify}
                                isNotified={notifiedMatches.includes(match.title)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {upcomingMatches.length > 0 && (
                <div>
                     <div className="flex items-center gap-2 mb-2 px-1 mt-6 pt-4 border-t border-[var(--border-color)]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <h3 className="text-sm font-bold text-[var(--text-main)]">Upcoming</h3>
                        <span className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded-full border border-[var(--border-color)]">
                            {upcomingMatches.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2" style={{ contentVisibility: 'auto' }}>
                        {upcomingMatches.map((match) => (
                             <MatchCard 
                                key={match.id} 
                                match={match} 
                                isLive={false} 
                                onPlay={onPlay} 
                                onNotify={handleNotify}
                                isNotified={notifiedMatches.includes(match.title)}
                             />
                        ))}
                    </div>
                </div>
            )}
         </div>
      )}
    </div>
  );
};
