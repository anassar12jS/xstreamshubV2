
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Trophy, Calendar, PlayCircle, Bell, BellRing, RadioReceiver, Loader2, Filter, Search, RefreshCw, Clock, Zap, ChevronRight } from 'lucide-react';
import { getMatches, SPORTS_CATEGORIES, clearSportsCache } from '../services/sports';
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

// Extracted MatchCard component
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
  const [isFetching, setIsFetching] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'live' | 'upcoming'>('live');
  const [notifiedMatches, setNotifiedMatches] = useState<string[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Use Ref to track IDs to avoid duplicates without triggering re-renders loop
  const loadedIds = useRef(new Set<string>());

  const fetchSportData = useCallback(async (mounted: boolean) => {
        const fetchSport = async (sport: string) => {
            if (!mounted) return;
            try {
                const data = await getMatches(sport);
                if (!mounted) return;
                
                if (data && data.length > 0) {
                    setMatches(prev => {
                        const newItems = data.filter(m => !loadedIds.current.has(m.id));
                        if (newItems.length === 0) return prev;
                        
                        newItems.forEach(m => loadedIds.current.add(m.id));
                        const combined = [...prev, ...newItems];
                        return combined.sort((a, b) => a.date - b.date);
                    });
                }
            } catch (e) {
                console.warn(`Failed to load ${sport}`, e);
            }
        };

        // Fire all requests concurrently
        const promises = SPORTS_CATEGORIES.map(sport => fetchSport(sport));
        
        await Promise.allSettled(promises);
        if (mounted) setIsFetching(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadedIds.current.clear();
    setMatches([]);
    setIsFetching(true);

    fetchSportData(mounted);
    
    return () => { mounted = false; };
  }, [refreshCount, fetchSportData]);

  // Filtering Logic
  const { liveMatches, upcomingMatches, hasResults } = useMemo(() => {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTime = endOfDay.getTime();
    
    // 1. Filter by Category
    let filtered = activeCategory === 'ALL' 
        ? matches 
        : matches.filter(m => m.category.toUpperCase() === activeCategory);

    // 2. Filter by Search
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(m => 
            m.title.toLowerCase().includes(query) ||
            (m.league && m.league.toLowerCase().includes(query)) ||
            (m.teams?.home.name.toLowerCase().includes(query)) ||
            (m.teams?.away.name.toLowerCase().includes(query))
        );
    }

    // 3. Sort priority
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
        } else if (diff >= 15 * 60 * 1000 && m.date <= endOfDayTime) {
            // Only add to upcoming if it is TODAY (before midnight)
            upcoming.push(m);
        }
    }

    const hasResults = live.length > 0 || upcoming.length > 0;

    return { liveMatches: live, upcomingMatches: upcoming, hasResults };
  }, [matches, activeCategory, searchQuery]);

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

  const handleRetry = () => {
      clearSportsCache(); // Force fresh data
      setRefreshCount(prev => prev + 1);
  };

  // If fetching is done and no matches at all, show empty state
  const showEmptyState = !isFetching && matches.length === 0;

  // If fetching is done, matches exist, but filters show nothing
  const showFilteredEmptyState = !isFetching && matches.length > 0 && !hasResults;

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 min-h-screen animate-fade-in">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20 shrink-0">
                <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase italic leading-none">Live Sports</h2>
                    <p className="text-[9px] text-[var(--text-muted)] font-medium">Real-time events dashboard</p>
                </div>
            </div>
            
            {/* Search Bar */}
            <div className="w-full md:w-auto flex-1 max-w-md relative">
                <input 
                    type="text" 
                    placeholder="Search teams, leagues..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-full py-1.5 pl-9 pr-4 text-xs text-[var(--text-main)] focus:outline-none focus:border-[rgb(var(--primary-color))]"
                />
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2" />
            </div>
        </div>
        
        <div className="flex flex-col gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full pb-1">
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

            {/* Filter Toggle (Live vs Upcoming) */}
            <div className="flex items-center gap-2 pt-1">
                 <button 
                    onClick={() => setViewMode('live')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                        viewMode === 'live' 
                        ? 'bg-[rgb(var(--primary-color))] text-white border-[rgb(var(--primary-color))] shadow-md shadow-[rgb(var(--primary-color))]/20' 
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                    }`}
                 >
                    <Zap className={`w-3 h-3 ${viewMode === 'live' ? 'fill-current' : ''}`} />
                    Live ({liveMatches.length})
                 </button>

                 <button 
                    onClick={() => setViewMode('upcoming')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                        viewMode === 'upcoming' 
                        ? 'bg-[rgb(var(--primary-color))] text-white border-[rgb(var(--primary-color))] shadow-md shadow-[rgb(var(--primary-color))]/20' 
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                    }`}
                 >
                    <Calendar className="w-3 h-3" />
                    Upcoming Today ({upcomingMatches.length})
                 </button>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[50vh]">
          {showEmptyState ? (
             <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] border-dashed animate-fade-in">
                <Trophy className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium mb-4">No matches found.</p>
                <button 
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded-lg text-xs font-bold transition-colors"
                >
                    <RefreshCw className="w-3 h-3" /> Retry (Clear Cache)
                </button>
             </div>
          ) : showFilteredEmptyState ? (
             <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">No matches match your filters.</p>
             </div>
          ) : (
             <>
                {/* LIVE VIEW */}
                {viewMode === 'live' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {liveMatches.length > 0 ? (
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
                        ) : (
                            <div className="text-center py-12 bg-[var(--bg-card)]/50 rounded-lg border border-[var(--border-color)] border-dashed">
                                <Zap className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-20 mb-2" />
                                <p className="text-xs text-[var(--text-muted)]">No live matches at the moment.</p>
                                <div className="mt-4">
                                    <button 
                                        onClick={() => setViewMode('upcoming')} 
                                        className="inline-flex items-center gap-1 text-[10px] text-[rgb(var(--primary-color))] font-bold hover:underline"
                                    >
                                        Check Upcoming <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* UPCOMING VIEW */}
                {viewMode === 'upcoming' && (
                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {upcomingMatches.length > 0 ? (
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
                        ) : (
                            <div className="text-center py-12 bg-[var(--bg-card)]/50 rounded-lg border border-[var(--border-color)] border-dashed">
                                 <Calendar className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-20 mb-2" />
                                 <p className="text-xs text-[var(--text-muted)]">No more matches scheduled for today.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Loading Indicator (Bottom) - Only show if still fetching but we have some content already */}
                {isFetching && matches.length > 0 && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-[rgb(var(--primary-color))] animate-spin" />
                    </div>
                )}

                {/* Full Page Loader - Only show if fetching and NO content yet */}
                {isFetching && matches.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 text-[rgb(var(--primary-color))] animate-spin mb-2" />
                        <p className="text-[var(--text-muted)] text-[10px] font-mono animate-pulse">LOADING EVENTS...</p>
                    </div>
                )}
             </>
          )}
      </div>
    </div>
  );
};
