
import { SportsMatch, SportsStream } from '../types';

const API_BASE = 'https://watchfooty.st/api/v1';
const SITE_BASE = 'https://watchfooty.st';

// List of proxies to try in order if direct fetch fails
const PROXIES = [
    // 1. Local Vercel Proxy (Most reliable/fastest)
    (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`,
    // 2. Fallbacks
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

// Helper to fetch with fallback strategy
const fetchApi = async (url: string) => {
    // 1. Try Direct fetch first (some APIs allow CORS or might work with no-referrer)
    try {
        const directRes = await fetch(url, { referrerPolicy: 'no-referrer' });
        if (directRes.ok) return await directRes.json();
        // If 403 or other error, throw to trigger proxy fallback
        if (directRes.status === 403 || directRes.status === 401) throw new Error('Direct access forbidden');
    } catch (e) {
        // Ignore direct failure, proceed to proxies
    }

    // 2. Try Proxies in order
    for (const proxyGen of PROXIES) {
        try {
            const proxiedUrl = proxyGen(url);
            const res = await fetch(proxiedUrl);
            if (res.ok) return await res.json();
        } catch (proxyErr) {
            // Continue to next proxy
        }
    }

    console.warn(`All fetch attempts failed for ${url}`);
    return null;
};

const getFullUrl = (path: string) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${SITE_BASE}${path}`;
};

const mapMatch = (m: any): SportsMatch => {
    // Robust check for nested properties to prevent "Cannot read properties of undefined"
    const home = m.teams?.home;
    const away = m.teams?.away;
    
    // Determine valid status
    const isLive = m.status === 'in' || m.status === 'live' || m.status === '1' || m.status === 1;

    return {
        id: m.matchId || m.id || `match-${Math.random().toString(36).substr(2, 9)}`,
        title: m.title || 'Unknown Match',
        date: (m.timestamp || 0) * 1000, // API returns seconds, JS needs ms
        category: m.sport ? (typeof m.sport === 'string' ? m.sport.toUpperCase() : 'SPORTS') : 'SPORTS',
        league: m.league || '',
        poster: getFullUrl(m.poster),
        isEvent: !!m.isEvent,
        status: m.status,
        popular: !!m.isEvent || (typeof m.league === 'string' && ['Premier League', 'NBA', 'Champions League', 'UFC', 'NFL', 'La Liga', 'Bundesliga'].some(l => m.league.includes(l))),
        teams: (home && away) ? {
            home: {
                name: home.name || 'Home Team',
                logo: getFullUrl(home.logoUrl)
            },
            away: {
                name: away.name || 'Away Team',
                logo: getFullUrl(away.logoUrl)
            }
        } : undefined,
        streams: Array.isArray(m.streams) ? m.streams.map((s: any) => ({
            id: s.id || `stream-${Math.random().toString(36).substr(2, 5)}`,
            url: s.url || '',
            quality: s.quality || 'HD',
            language: s.language || 'en',
            isRedirect: !!s.isRedirect,
            nsfw: !!s.nsfw,
            ads: !!s.ads
        })) : []
    };
};

export const getAllMatches = async (): Promise<SportsMatch[]> => {
  try {
    // 1. Fetch available sports dynamically
    let sportsList: { name: string }[] = [];
    try {
        const sportsData = await fetchApi(`${API_BASE}/sports`);
        if (Array.isArray(sportsData)) {
            sportsList = sportsData;
        }
    } catch (e) {
        console.warn("Failed to fetch sports list, using defaults");
    }

    // Fallback defaults if API list fails or is empty
    if (!sportsList || sportsList.length === 0) {
        sportsList = [
            { name: 'football' }, { name: 'basketball' }, { name: 'american-football' }, 
            { name: 'baseball' }, { name: 'hockey' }, { name: 'fight' }, 
            { name: 'motor-sports' }, { name: 'tennis' }, { name: 'cricket' }, { name: 'rugby' }
        ];
    }

    // Filter out invalid entries
    const validSports = sportsList.filter(s => s && typeof s.name === 'string');

    // 2. Fetch matches for all sports in parallel
    const promises = validSports.map(sport => fetchApi(`${API_BASE}/matches/${sport.name}`));
    const results = await Promise.all(promises);
    
    let allMatches: SportsMatch[] = [];
    
    results.forEach(data => {
        if (Array.isArray(data)) {
            // Map safely, filtering out items that crash the mapper
            const validMatches = data.map(item => {
                try {
                    return mapMatch(item);
                } catch (err) {
                    return null;
                }
            }).filter(m => m !== null) as SportsMatch[];
            
            allMatches = [...allMatches, ...validMatches];
        }
    });

    // Sort by date
    return allMatches.sort((a, b) => a.date - b.date);
  } catch (e) {
    console.error("Failed to fetch matches:", e);
    return [];
  }
};

export const getMatchStreams = async (source: string, id: string): Promise<SportsStream[]> => {
    return [];
};
