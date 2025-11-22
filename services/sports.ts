
import { SportsMatch, SportsStream } from '../types';

const API_BASE = 'https://watchfooty.st/api/v1';
const SITE_BASE = 'https://watchfooty.st';
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

// List of proxies to try in order
const PROXIES = [
    // 1. Local Vercel Proxy (Most reliable/fastest)
    (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`,
    // 2. Fallback
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

export const SPORTS_CATEGORIES = [
    'football', 'basketball', 'american-football', 'baseball', 
    'hockey', 'fight', 'tennis', 'cricket', 'rugby', 'motor-sports'
];

// Fetch with timeout helper
const fetchWithTimeout = async (url: string, options = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

// Helper to fetch with fallback strategy
const fetchApi = async (url: string) => {
    for (const proxyGen of PROXIES) {
        try {
            const proxiedUrl = proxyGen(url);
            // Use timeout to fail fast on bad proxies
            const res = await fetchWithTimeout(proxiedUrl, {}, 5000);
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

// Generate a deterministic ID based on content if API ID is missing
const generateStableId = (m: any): string => {
    if (m.matchId) return m.matchId.toString();
    if (m.id) return m.id.toString();
    
    // Fallback: Hash title + date
    const str = `${m.title || ''}_${m.timestamp || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `stable-${Math.abs(hash)}`;
};

const mapMatch = (m: any): SportsMatch => {
    const home = m.teams?.home;
    const away = m.teams?.away;
    
    return {
        id: generateStableId(m),
        title: m.title || 'Unknown Match',
        date: (m.timestamp || 0) * 1000, 
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

export const getMatches = async (sport: string): Promise<SportsMatch[]> => {
    const cacheKey = `streamhub_sports_${sport}`;
    
    // 1. Check Cache
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }
    } catch (e) { /* Ignore */ }

    // 2. Fetch
    try {
        const data = await fetchApi(`${API_BASE}/matches/${sport}`);
        if (Array.isArray(data)) {
            const validMatches = data.map(item => {
                try { return mapMatch(item); } catch (err) { return null; }
            }).filter(m => m !== null) as SportsMatch[];

            // Sort by date
            validMatches.sort((a, b) => a.date - b.date);

            // 3. Update Cache
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    data: validMatches
                }));
            } catch (e) {}

            return validMatches;
        }
    } catch (e) {
        console.error(`Failed to fetch ${sport}:`, e);
    }
    
    return [];
};

// Keep for compatibility if needed, but UI should use getMatches incrementally
export const getAllMatches = async (): Promise<SportsMatch[]> => {
    const promises = SPORTS_CATEGORIES.map(s => getMatches(s));
    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => a.date - b.date);
};

export const getMatchStreams = async (source: string, id: string): Promise<SportsStream[]> => {
    return [];
};
