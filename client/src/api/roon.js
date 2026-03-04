const BASE = '/api';

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

function qs(params) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v != null && v !== '') p.set(k, v);
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

export function getPlayTime(params = {}) {
    return fetchJson(`${BASE}/stats/playtime${qs(params)}`);
}

export function getTopArtists(params = {}) {
    return fetchJson(`${BASE}/stats/top-artists${qs(params)}`);
}

export function getTopTracks(params = {}) {
    return fetchJson(`${BASE}/stats/top-tracks${qs(params)}`);
}

export function getTopZones(params = {}) {
    return fetchJson(`${BASE}/stats/top-zones${qs(params)}`);
}

export function getTopAlbums(params = {}) {
    return fetchJson(`${BASE}/stats/top-albums${qs(params)}`);
}

export function getHistory(params = {}) {
    return fetchJson(`${BASE}/history${qs(params)}`);
}

export function getRecap(params = {}) {
    return fetchJson(`${BASE}/recap${qs(params)}`);
}

export function getNowPlaying() {
    return fetchJson(`${BASE}/now-playing`);
}

export function getStatus() {
    return fetchJson(`${BASE}/status`);
}

export function imageUrl(imageKey, width = 300, height = 300) {
    if (!imageKey) return null;
    return `${BASE}/image/${imageKey}?width=${width}&height=${height}`;
}

