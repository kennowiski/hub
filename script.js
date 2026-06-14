// Ajuste específico para reduzir o piscar dos modais no navegador interno do Instagram.
        // Não altera o layout; apenas troca para transições de blur/opacity mais estáveis no WebView.
        if (/Instagram/i.test(navigator.userAgent)) {
            document.documentElement.classList.add('instagram-webview');
        }


        // ==========================================
        // OTIMIZAÇÕES DE CARREGAMENTO
        // ==========================================
        function isPageVisible() {
            return document.visibilityState === 'visible';
        }

        function setImageSrcIfChanged(img, newSrc) {
            if (!img || !newSrc) return;
            if (img.getAttribute('src') !== newSrc) img.src = newSrc;
        }

        function setContainerHtmlIfChanged(container, html) {
            if (!container) return;
            if (container.dataset.currentHtml !== html) {
                container.innerHTML = html;
                container.dataset.currentHtml = html;
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(typeWriter, 350);
        });

        // ==========================================
        // TYPEWRITER EFFECT (OTIMIZADO PARA LCP/FCP)
        // ==========================================
        const textToType = "Entusiasta de programação explorando conhecimento. Gamer, cinéfilo e amante da música.";
        const typingElement = document.getElementById('typing-text');
        let typeIndex = 0;

        if (typingElement) typingElement.textContent = '';

        function typeWriter() {
            if (!typingElement) return;
            if (typeIndex < textToType.length) {
                typingElement.textContent += textToType.charAt(typeIndex);
                typeIndex++;
                setTimeout(typeWriter, 15);
            }
        }

        // ==========================================
        // TOOLTIP E MODAL DE TECNOLOGIAS
        // ==========================================
        const tooltip = document.getElementById('tech-tooltip');
        const techBoxes = document.querySelectorAll('.tech-box');

        techBoxes.forEach(box => {
            box.addEventListener('mouseenter', (e) => {
                if (window.innerWidth < 900) return;
                document.getElementById('tt-name').textContent = box.dataset.name;
                document.getElementById('tt-desc').textContent = box.dataset.desc;
                document.getElementById('tt-tag').textContent = box.dataset.tag;
                document.getElementById('tt-footer-text').textContent = box.dataset.footer;
                document.getElementById('tt-icon').innerHTML = box.innerHTML;

                const rect = box.getBoundingClientRect();
                let leftPosition = rect.left + (rect.width / 2);
                const topPosition = rect.bottom;

                tooltip.style.left = `${leftPosition}px`;
                tooltip.style.top = `${topPosition}px`;
                tooltip.classList.add('active');
            });
            box.addEventListener('mouseleave', () => { tooltip.classList.remove('active'); });
        });

        const mobileProjectsCard = document.getElementById('projects-card-mobile');
        const techModal = document.getElementById('mobile-tech-modal');
        const closeTechModal = document.getElementById('close-tech-modal');

        mobileProjectsCard.addEventListener('click', () => {
            techModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeTechModal.addEventListener('click', () => {
            techModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        techModal.addEventListener('click', (e) => {
            if (e.target === techModal) {
                techModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // ==========================================
        // DISCORD (Status e Jogos)
        // ==========================================
        const discordId = "387025115898183702";

        async function fetchDiscordPresence() {
            if (!isPageVisible()) return;
            try {
                const response = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
                const json = await response.json();
                const data = json.data;

                if (!data) return;

                const avatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=128`;
                const avatarImg = document.getElementById('discord-avatar');
                setImageSrcIfChanged(avatarImg, avatarUrl);

                const usernameH3 = document.getElementById('discord-username');
                if (usernameH3) usernameH3.textContent = `@${data.discord_user.username}`;

                const statusDot = document.getElementById('discord-status-dot');
                if (statusDot) statusDot.style.backgroundColor = `var(--status-${data.discord_status})`;

                const statusDisplay = { "online": "Online", "idle": "Ausente", "dnd": "N\u00E3o Perturbe", "offline": "Offline" };
                const statusTextP = document.getElementById('discord-status-text');
                if (statusTextP) statusTextP.textContent = statusDisplay[data.discord_status] || "Offline";

                const activityContainer = document.getElementById('discord-activity-container');
                const activity = data.activities.find(a => a.type === 0 || a.type === 2);
                if (activityContainer) {
                    if (activity && activity.name !== "Spotify") {
                        let imgUrl = "";
                        if (activity.assets && activity.assets.large_image) {
                            imgUrl = activity.assets.large_image.startsWith("mp:external") ? activity.assets.large_image.replace("mp:external/", "https://media.discordapp.net/external/") : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
                        }
                        setContainerHtmlIfChanged(activityContainer, `${imgUrl ? `<img src="${imgUrl}" class="activity-img" alt="Atividade">` : `<div class="activity-img" style="background:var(--card-border);display:flex;align-items:center;justify-content:center;font-size:24px;">🎮</div>`}<div class="activity-details"><strong>${activity.name}</strong>${activity.details ? `<span>${activity.details}</span>` : ''}${activity.state ? `<span>${activity.state}</span>` : ''}</div>`);
                    } else {
                        setContainerHtmlIfChanged(activityContainer, `<p class="not-doing-anything">Fazendo nada...</p>`);
                    }
                }
            } catch (error) { console.error("Erro no Discord:", error); }
        }

        window.addEventListener('load', () => {
            setTimeout(fetchDiscordPresence, 1200);
            setInterval(fetchDiscordPresence, 60000);
        });

        // ==========================================
        // SISTEMA MUSICAL (SPOTIFY + LAST.FM)
        // ==========================================

        function svgIcon(name, extraClass = '', extraStyle = '') {
            const icons = {
                spotify: { viewBox: '0 0 496 512', body: `<path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/>` },
                lastfm: { viewBox: '0 0 512 512', body: `<path d="M225.8 367.1l-18.8-51s-30.5 34-76.2 34c-40.5 0-69.2-35.2-69.2-91.5 0-72.1 36.4-97.9 72.1-97.9 66.5 0 74.8 53.3 100.9 134.9 18.8 56.9 54 102.6 155.4 102.6 72.7 0 122-22.3 122-80.9 0-72.9-62.7-80.6-115-92.1-25.8-5.9-33.4-16.4-33.4-34 0-19.9 15.8-31.7 41.6-31.7 28.2 0 43.4 10.6 45.7 35.8l58.6-7c-4.7-52.8-41.1-74.5-100.9-74.5-52.8 0-104.4 19.9-104.4 83.9 0 39.9 19.4 65.1 68 76.8 44.9 10.6 79.8 13.8 79.8 45.7 0 21.7-21.1 30.5-61 30.5-59.2 0-83.9-31.1-97.9-73.9-32-96.8-43.6-163-161.3-163C45.7 113.8 0 168.3 0 261c0 89.1 45.7 137.2 127.9 137.2 66.2 0 97.9-31.1 97.9-31.1z"/>` },
                clock: { viewBox: '0 0 512 512', body: `<path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9L0 168c0 13.3 10.7 24 24 24l110.1 0c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1c0-13.3-10.7-24-24-24z"/>` },
                music: { viewBox: '0 0 512 512', body: `<path d="M499.1 6.3c8.1 6 12.9 15.6 12.9 25.7l0 72 0 264c0 44.2-43 80-96 80s-96-35.8-96-80s43-80 96-80c11.2 0 22 1.6 32 4.6L448 147 192 223.8 192 432c0 44.2-43 80-96 80s-96-35.8-96-80s43-80 96-80c11.2 0 22 1.6 32 4.6L128 200l0-72c0-14.1 9.3-26.6 22.8-30.7l320-96c9.7-2.9 20.2-1.1 28.3 5z"/>` }
            };
            const icon = icons[name];
            if (!icon) return '';
            const classAttr = `icon${extraClass ? ' ' + extraClass : ''}`;
            const styleAttr = extraStyle ? ` style="${extraStyle}"` : '';
            return `<svg class="${classAttr}"${styleAttr} viewBox="${icon.viewBox}" aria-hidden="true">${icon.body}</svg>`;
        }
        let lastSpotifyData = null;
        let spotifyHistoryLoaded = false;
        let spotifyHistoryCache = null;
        let spotifyHistoryPreloadPromise = null;

        async function fetchSpotify() {
            if (!isPageVisible()) return;
            const spotifyContainer = document.getElementById('spotify-card-container');

            try {
                const vercelUrl = 'https://spotify-api-xi-gold.vercel.app/api/spotify';
                const response = await fetch(vercelUrl);
                const data = await response.json();
                lastSpotifyData = data;
                syncCurrentTrackWithCachedHistory();

                const hasTrackInfo = data.title && data.artist;
                const hasAlbumImage = data.albumImageUrl;

                if (!data.isPlaying && hasTrackInfo) {
                    const historyLabelColor = '#8aa0b8';
                    const historyIcon = data.provider === 'lastfm' ? svgIcon('lastfm') : svgIcon('clock');
                    const fallbackCover = 'https://placehold.co/160x160/14161e/94a3b8?text=%E2%99%AA';

                    setContainerHtmlIfChanged(spotifyContainer, `
                        <div class="spotify-playing">
                            <img src="${hasAlbumImage ? data.albumImageUrl : fallbackCover}" class="spotify-art" alt="Capa do Álbum" width="72" height="72" decoding="async" style="animation: none;">
                            <div class="spotify-info">
                                <span class="spotify-label" style="color: ${historyLabelColor};">${historyIcon} ÚLTIMA MÚSICA OUVIDA</span>
                                <strong class="spotify-track">${data.title}</strong>
                                <span class="spotify-artist">${data.artist}</span>
                            </div>
                        </div>
                    `);
                    return;
                }

                if (!data.isPlaying) {
                    setContainerHtmlIfChanged(spotifyContainer, `
                        <div class="spotify-offline">
                            <svg class="icon spotify-icon-offline" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.2 9.4c3.6-1.1 7.2-.6 9.6.8M7.7 12.2c2.9-.8 5.8-.4 7.7.7M8.3 14.8c2-.5 4-.3 5.5.5" fill="none" stroke="var(--bg-color)" stroke-width="1.7" stroke-linecap="round"/></svg>
                            <div class="spotify-info">
                                <span class="spotify-label" style="color: var(--text-muted);"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="2.5" fill="currentColor"/><circle cx="17" cy="16" r="2.5" fill="currentColor"/></svg> Status Musical</span>
                                <strong class="spotify-track">Pausado no momento...</strong>
                            </div>
                        </div>
                    `);
                    return;
                }

                const isLastFm = data.provider === 'lastfm';
                const labelText = isLastFm ? 'Ouvindo agora (Last.fm)' : 'Ouvindo agora';
                const labelColor = isLastFm ? '#ba0000' : '#1DB954';
                const labelIcon = isLastFm ? svgIcon('lastfm') : svgIcon('spotify');
                const pulseAnimation = isLastFm ? 'pulse-art-lf 2s infinite alternate' : 'pulse-art 2s infinite alternate';

                setContainerHtmlIfChanged(spotifyContainer, `
                    <div class="spotify-playing">
                        <img src="${data.albumImageUrl}" class="spotify-art" alt="Capa do Álbum" width="72" height="72" decoding="async" style="animation: ${pulseAnimation};">
                        <div class="spotify-info">
                            <span class="spotify-label" style="color: ${labelColor};">${labelIcon} ${labelText}</span>
                            <strong class="spotify-track">${data.title}</strong>
                            <span class="spotify-artist">${data.artist}</span>
                        </div>
                        <div class="equalizer">
                            <div class="equalizer-bar" style="background-color: ${labelColor};"></div>
                            <div class="equalizer-bar" style="background-color: ${labelColor};"></div>
                            <div class="equalizer-bar" style="background-color: ${labelColor};"></div>
                            <div class="equalizer-bar" style="background-color: ${labelColor};"></div>
                        </div>
                    </div>
                `);

            } catch (error) {
                console.error("Erro ao puxar dados da sua API no Vercel:", error);
            }
        }

        const MUSIC_REFRESH_INTERVAL = 20000;
        fetchSpotify();

        // ==========================================
        // HISTÓRICO MUSICAL (LAST.FM)
        // ==========================================
        const spotifyHistoryModal = document.getElementById('spotify-history-modal');
        const closeSpotifyHistoryModalBtn = document.getElementById('close-spotify-history-modal');
        const spotifyHistoryList = document.getElementById('spotify-history-list');
        const fallbackMusicCover = 'https://placehold.co/160x160/14161e/94a3b8?text=%E2%99%AA';

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function getLargestLastFmImage(images) {
            if (!Array.isArray(images)) return '';
            const found = [...images].reverse().find(img => img && (img['#text'] || img.url));
            return found ? (found['#text'] || found.url || '') : '';
        }

        function formatLastFmDate(value) {
            if (!value) return '';

            if (typeof value === 'number') {
                const date = new Date(value);
                if (!Number.isNaN(date.getTime())) {
                    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                }
            }

            if (typeof value === 'string') {
                if (/^\d+$/.test(value)) {
                    const numericDate = new Date(Number(value));
                    if (!Number.isNaN(numericDate.getTime())) {
                        return numericDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                    }
                }
                return value;
            }

            return '';
        }

        function normalizeLastFmTracks(data) {
            const rawTracks = data?.recentTracks || data?.tracks || data?.history || data?.items || data?.recenttracks?.track || data?.recentTracks?.track || data?.track;
            const list = Array.isArray(rawTracks) ? rawTracks : (rawTracks ? [rawTracks] : []);
            const responseProvider = String(data?.provider || 'lastfm').toLowerCase();

            return list.map(track => {
                const artist = typeof track.artist === 'string'
                    ? track.artist
                    : (track.artist?.name || track.artist?.['#text'] || track.artistName || 'Artista desconhecido');
                const album = typeof track.album === 'string'
                    ? track.album
                    : (track.album?.['#text'] || track.album?.name || track.albumName || '');
                const image = track.albumImageUrl || track.imageUrl || track.cover || track.poster || getLargestLastFmImage(track.image) || fallbackMusicCover;
                const title = track.title || track.name || track.track || 'Música desconhecida';
                const provider = String(track.provider || track.source || track.service || responseProvider || 'lastfm').toLowerCase();

                return { title, artist, album, image, isNowPlaying: false, provider, isSyntheticCurrent: false };
            }).filter(track => track.title || track.artist).slice(0, 10);
        }

        function normalizeTextForCompare(value) {
            return String(value || '')
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
                .replace(/(feat|ft|with|com)\.?/gi, '')
                .replace(/[^a-z0-9]+/gi, ' ')
                .trim()
                .toLowerCase();
        }

        function splitComparableArtists(value) {
            return normalizeTextForCompare(value)
                .split(/\s+(?:and|e)\s+|\s*,\s*|\s*&\s*|\s+x\s*|\s*\/\s*/)
                .map(part => part.trim())
                .filter(Boolean);
        }

        function tracksAreSameSong(a, b) {
            const titleA = normalizeTextForCompare(a?.title);
            const titleB = normalizeTextForCompare(b?.title);
            if (!titleA || !titleB || titleA !== titleB) return false;

            const artistsA = splitComparableArtists(a?.artist);
            const artistsB = splitComparableArtists(b?.artist);

            if (!artistsA.length || !artistsB.length) return true;

            return artistsA.some(artistA => artistsB.some(artistB =>
                artistA === artistB || artistA.includes(artistB) || artistB.includes(artistA)
            ));
        }

        function makeCurrentSpotifyHistoryTrack() {
            if (!lastSpotifyData?.title || !lastSpotifyData?.artist) return null;

            const provider = String(lastSpotifyData.provider || 'spotify').toLowerCase();
            const isSpotifySource = provider.includes('spotify');

            return {
                title: lastSpotifyData.title,
                artist: lastSpotifyData.artist,
                album: lastSpotifyData.album || lastSpotifyData.albumName || '',
                image: lastSpotifyData.albumImageUrl || lastSpotifyData.imageUrl || fallbackMusicCover,
                isNowPlaying: !!lastSpotifyData.isPlaying,
                provider: isSpotifySource ? 'spotify' : provider,
                isSyntheticCurrent: true
            };
        }

        function removeDuplicateTracks(tracks) {
            const uniqueTracks = [];

            for (const track of tracks) {
                const titleKey = normalizeTextForCompare(track.title);
                if (!titleKey) {
                    uniqueTracks.push(track);
                    continue;
                }

                const alreadyExists = uniqueTracks.some(existing => tracksAreSameSong(existing, track));
                if (!alreadyExists) uniqueTracks.push(track);
            }

            return uniqueTracks;
        }

        function mergeCurrentTrackWithHistory(historyTracks) {
            const currentTrack = makeCurrentSpotifyHistoryTrack();
            const baseTracks = (Array.isArray(historyTracks) ? [...historyTracks] : [])
                .filter(track => !track.isSyntheticCurrent)
                .map(track => ({ ...track, isNowPlaying: false }));

            if (!currentTrack || !currentTrack.isNowPlaying) {
                return removeDuplicateTracks(baseTracks).slice(0, 10);
            }

            const withoutDuplicate = baseTracks.filter(track => !tracksAreSameSong(currentTrack, track));

            return removeDuplicateTracks([currentTrack, ...withoutDuplicate]).slice(0, 10);
        }

        function renderSpotifyHistory(tracks, message = '') {
            if (!spotifyHistoryList) return;

            if (!tracks.length) {
                spotifyHistoryList.innerHTML = `<div class="spotify-history-empty">${escapeHtml(message || 'Não foi possível carregar o histórico de reproduções agora.')}</div>`;
                return;
            }

            const items = tracks.map((track, index) => {
                const isFirstTrack = index === 0;
                const shouldShowNow = isFirstTrack && track.isNowPlaying;
                const providerText = String(track.provider || '').toLowerCase();
                const isSpotifySource = providerText.includes('spotify');
                const sourceClass = isSpotifySource ? 'spotify-history-source-spotify' : 'spotify-history-source-lastfm';
                const nowClass = isSpotifySource ? 'spotify-history-now-spotify' : 'spotify-history-now-lastfm';
                const itemClass = shouldShowNow ? `spotify-history-item is-now ${sourceClass}` : 'spotify-history-item';

                return `
                    <div class="${itemClass}">
                        <img class="spotify-history-cover" src="${escapeHtml(track.image || fallbackMusicCover)}" alt="Capa do álbum" loading="lazy" onerror="this.src='${fallbackMusicCover}'">
                        <div class="spotify-history-info">
                            <div class="spotify-history-track">${escapeHtml(track.title)}</div>
                            <div class="spotify-history-artist">${escapeHtml(track.artist)}</div>
                            ${track.album ? `<div class="spotify-history-meta">${escapeHtml(track.album)}</div>` : ''}
                        </div>
                        ${shouldShowNow ? `<div class="spotify-history-now ${nowClass}">Ouvindo agora</div>` : ''}
                    </div>
                `;
            }).join('');

            spotifyHistoryList.innerHTML = items + (message ? `<div class="spotify-history-empty">${escapeHtml(message)}</div>` : '');
        }

        async function fetchSpotifyHistory() {
            const baseUrl = 'https://spotify-api-xi-gold.vercel.app';
            const endpoints = [
                `${baseUrl}/api/lastfm?limit=10`,
                `${baseUrl}/api/lastfm/recent?limit=10`,
                `${baseUrl}/api/spotify?history=1&limit=10`,
                `${baseUrl}/api/spotify?recent=1&limit=10`
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, { cache: 'no-store' });
                    if (!response.ok) continue;
                    const data = await response.json();
                    const tracks = mergeCurrentTrackWithHistory(normalizeLastFmTracks(data));
                    if (tracks.length) return { tracks, message: '' };
                } catch (error) {
                    console.warn('Histórico Last.fm indisponível neste endpoint:', endpoint, error);
                }
            }

            if (spotifyHistoryCache?.tracks?.length) {
                return spotifyHistoryCache;
            }

            const currentTrack = makeCurrentSpotifyHistoryTrack();
            if (currentTrack) {
                return { tracks: [currentTrack], message: '' };
            }

            return { tracks: [], message: 'Não foi possível carregar o histórico do Last.fm agora.' };
        }

        async function preloadSpotifyHistory(force = false) {
            if (!force && spotifyHistoryPreloadPromise) return spotifyHistoryPreloadPromise;

            spotifyHistoryPreloadPromise = (async () => {
                if (!lastSpotifyData) await fetchSpotify();
                const result = await fetchSpotifyHistory();

                if (result?.tracks?.length) {
                    spotifyHistoryCache = result;
                    spotifyHistoryLoaded = true;
                    return result;
                }

                if (spotifyHistoryCache?.tracks?.length) {
                    return spotifyHistoryCache;
                }

                spotifyHistoryLoaded = true;
                return result;
            })();

            return spotifyHistoryPreloadPromise;
        }

        function syncCurrentTrackWithCachedHistory() {
            if (!spotifyHistoryCache?.tracks?.length) return;
            spotifyHistoryCache = {
                ...spotifyHistoryCache,
                tracks: mergeCurrentTrackWithHistory(spotifyHistoryCache.tracks)
            };

            if (spotifyHistoryModal?.classList.contains('active')) {
                renderSpotifyHistory(spotifyHistoryCache.tracks, spotifyHistoryCache.message || '');
            }
        }

        async function refreshMusicAndHistory() {
            await fetchSpotify();
            if (!isPageVisible()) return;
            const result = await preloadSpotifyHistory(true);

            if (spotifyHistoryModal?.classList.contains('active')) {
                if (result?.tracks?.length) {
                    renderSpotifyHistory(result.tracks, result.message || '');
                } else if (spotifyHistoryCache?.tracks?.length) {
                    renderSpotifyHistory(spotifyHistoryCache.tracks, spotifyHistoryCache.message || '');
                }
            }
        }

        async function openSpotifyHistoryModal() {
            if (!spotifyHistoryModal) return;
            spotifyHistoryModal.classList.add('active');
            spotifyHistoryModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            syncCurrentTrackWithCachedHistory();

            if (spotifyHistoryCache?.tracks?.length) {
                renderSpotifyHistory(spotifyHistoryCache.tracks, spotifyHistoryCache.message || '');
            } else {
                const currentTrack = makeCurrentSpotifyHistoryTrack();
                if (currentTrack) {
                    renderSpotifyHistory([currentTrack], '');
                } else {
                    renderSpotifyHistory([], 'Sincronizando histórico<span class="loading-dots"></span>');
                }
            }

            const result = await preloadSpotifyHistory(!spotifyHistoryLoaded);
            if (result?.tracks?.length) {
                renderSpotifyHistory(result.tracks, result.message || '');
            } else if (spotifyHistoryCache?.tracks?.length) {
                renderSpotifyHistory(spotifyHistoryCache.tracks, spotifyHistoryCache.message || '');
            }
        }

        function closeSpotifyHistoryModalFn() {
            if (!spotifyHistoryModal) return;
            spotifyHistoryModal.classList.remove('active');
            spotifyHistoryModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        const spotifyCard = document.getElementById('spotify-card-container');
        if (spotifyCard && spotifyHistoryModal) {
            spotifyCard.addEventListener('click', openSpotifyHistoryModal);
            spotifyCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSpotifyHistoryModal();
                }
            });
        }
        if (closeSpotifyHistoryModalBtn) closeSpotifyHistoryModalBtn.addEventListener('click', closeSpotifyHistoryModalFn);
        if (spotifyHistoryModal) spotifyHistoryModal.addEventListener('click', (e) => { if (e.target === spotifyHistoryModal) closeSpotifyHistoryModalFn(); });

        window.addEventListener('load', () => {
            setTimeout(() => preloadSpotifyHistory().catch(() => { }), 900);
        });

        setInterval(() => {
            refreshMusicAndHistory().catch(error => console.warn('Erro ao sincronizar música e histórico:', error));
        }, MUSIC_REFRESH_INTERVAL);

        // ==========================================
        // FUNÇÕES GERAIS DE COMPARTILHAMENTO
        // ==========================================
        function renderTraktStars(rating) {
            const numericRating = Number(rating);
            if (!Number.isFinite(numericRating) || numericRating <= 0) return '';
            const starsOutOfFive = numericRating / 2;
            const fullStars = Math.floor(starsOutOfFive);
            const hasHalfStar = starsOutOfFive % 1 >= 0.5;
            return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '');
        }


        function renderLetterboxdStars(rating) {
            if (rating === null || rating === undefined || rating === '') return '';

            const ratingText = String(rating).trim();
            if (!ratingText) return '';

            if (/[★☆½]/.test(ratingText)) {
                return ratingText.replace(/☆/g, '').replace(/[^★½]/g, '').trim();
            }

            const numericMatch = ratingText.match(/\d+(?:[\.,]\d+)?/);
            if (!numericMatch) return '';

            let numericRating = Number(numericMatch[0].replace(',', '.'));
            if (!Number.isFinite(numericRating) || numericRating <= 0) return '';

            if (numericRating > 5) {
                numericRating = numericRating / 2;
            }

            const fullStars = Math.floor(numericRating);
            const hasHalfStar = numericRating - fullStars >= 0.25;
            return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '');
        }

        function splitLetterboxdTitleAndRating(rawTitle) {
            const titleText = String(rawTitle || '').trim();
            if (!titleText) {
                return { title: '', rating: '' };
            }

            const titleRatingMatch = titleText.match(/^(.*?)(?:\s*[-–—:|•·]\s*)?([★☆½\s]+)\s*$/);
            const hasStarsAtEnd = titleRatingMatch && /[★½☆]/.test(titleRatingMatch[2]);

            if (!hasStarsAtEnd) {
                return { title: titleText, rating: '' };
            }

            return {
                title: titleRatingMatch[1].trim() || titleText.replace(/[★☆½\s]+$/, '').trim(),
                rating: renderLetterboxdStars(titleRatingMatch[2])
            };
        }

        function normalizeLetterboxdData(data) {
            const splitTitle = splitLetterboxdTitleAndRating(data?.title);
            const rating = renderLetterboxdStars(data?.rating) ||
                renderLetterboxdStars(data?.stars) ||
                renderLetterboxdStars(data?.score) ||
                splitTitle.rating;

            return {
                ...data,
                title: splitTitle.title || 'Filme não encontrado',
                rating
            };
        }

        // ==========================================
        // LETTERBOXD 
        // ==========================================
        function updateLbModal(data) {
            const safeFallback = 'https://placehold.co/300x450/14161e/94a3b8?text=Filme';
            const poster = data.poster || safeFallback;

            const modalPoster = document.getElementById('lb-modal-poster');
            const modalBg = document.getElementById('lb-share-bg');
            const modalTitle = document.getElementById('lb-modal-title');
            const modalRating = document.getElementById('lb-modal-rating');
            const openLink = document.getElementById('lb-open-link');

            if (modalPoster) {
                modalPoster.onerror = function () { this.src = safeFallback; };
                setImageSrcIfChanged(modalPoster, poster);
            }
            if (modalBg) modalBg.style.backgroundImage = `url('${poster}')`;
            const normalizedData = normalizeLetterboxdData(data);
            if (modalTitle) modalTitle.textContent = normalizedData.title || 'Filme não encontrado';
            if (modalRating) modalRating.textContent = normalizedData.rating;
            if (openLink) openLink.href = data.link || 'https://letterboxd.com/kennowiski/';
        }

        async function fetchLetterboxd() {
            try {
                const response = await fetch('https://spotify-api-xi-gold.vercel.app/api/letterboxd');
                const data = await response.json();

                if (!data.title) return;

                const posterImg = document.getElementById('lb-poster');
                const titleSpan = document.getElementById('lb-title');
                const ratingSpan = document.getElementById('lb-rating-card');
                const safeFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='72' viewBox='0 0 48 72'%3E%3Crect width='48' height='72' rx='6' fill='%2314161e'/%3E%3Ctext x='24' y='38' text-anchor='middle' fill='%2394a3b8' font-family='Arial' font-size='8'%3EFilme%3C/text%3E%3C/svg%3E";

                if (posterImg) {
                    posterImg.onerror = function () { this.src = safeFallback; };
                    setImageSrcIfChanged(posterImg, data.poster || safeFallback);
                }
                const normalizedData = normalizeLetterboxdData(data);

                if (titleSpan) titleSpan.textContent = normalizedData.title;
                if (ratingSpan) ratingSpan.textContent = normalizedData.rating;

                updateLbModal(normalizedData);

            } catch (error) { console.error(error); }
        }

        fetchLetterboxd();

        const lbCard = document.getElementById('lb-card');
        const lbModal = document.getElementById('lb-modal');
        const closeLbModalBtn = document.getElementById('close-lb-modal');

        function openLbModal() {
            lbModal.classList.add('active');
            lbModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeLbModalFn() {
            lbModal.classList.remove('active');
            lbModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (lbCard && lbModal) {
            lbCard.addEventListener('click', openLbModal);
            lbCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLbModal(); } });
        }
        if (closeLbModalBtn) closeLbModalBtn.addEventListener('click', closeLbModalFn);
        if (lbModal) lbModal.addEventListener('click', (e) => { if (e.target === lbModal) closeLbModalFn(); });

        // ==========================================
        // TRAKT 
        // ==========================================
        function updateTraktModal(data) {
            const safeFallback = 'https://placehold.co/300x450/14161e/94a3b8?text=TV';
            const poster = data.poster || safeFallback;
            const season = String(data.season || 0).padStart(2, '0');
            const episodeNumber = String(data.episodeNumber || 0).padStart(2, '0');
            const episodeText = `S${season}E${episodeNumber} — ${data.episode || 'Episódio'}`;
            const ratingText = renderTraktStars(data.rating);

            const modalPoster = document.getElementById('trakt-modal-poster');
            const modalBg = document.getElementById('trakt-share-bg');
            const modalTitle = document.getElementById('trakt-modal-title');
            const modalEpisode = document.getElementById('trakt-modal-episode');
            const modalRating = document.getElementById('trakt-modal-rating');
            const openLink = document.getElementById('trakt-open-link');

            if (modalPoster) {
                modalPoster.onerror = function () { this.src = safeFallback; };
                setImageSrcIfChanged(modalPoster, poster);
            }
            if (modalBg) modalBg.style.backgroundImage = `url('${poster}')`;
            if (modalTitle) modalTitle.textContent = data.show || 'Série não encontrada';
            if (modalEpisode) modalEpisode.textContent = episodeText;
            if (modalRating) modalRating.textContent = ratingText || '';
            if (openLink) openLink.href = data.traktUrl || 'https://trakt.tv/users/kennowiski/history';
        }

        async function fetchTrakt() {
            try {
                const response = await fetch('https://spotify-api-xi-gold.vercel.app/api/trakt');
                const data = await response.json();

                if (data.error) return;

                const posterImg = document.getElementById('trakt-poster');
                const titleSpan = document.getElementById('trakt-title');
                const episodeSpan = document.getElementById('trakt-episode');
                const ratingSpan = document.getElementById('trakt-rating');

                if (titleSpan) titleSpan.textContent = data.show || 'Série não encontrada';
                if (episodeSpan) {
                    const season = String(data.season || 0).padStart(2, '0');
                    const episode = String(data.episodeNumber || 0).padStart(2, '0');
                    episodeSpan.textContent = `S${season}E${episode} — ${data.episode || 'Episódio'}`;
                }
                if (ratingSpan) ratingSpan.textContent = renderTraktStars(data.rating);
                if (posterImg) {
                    const safeFallback = 'https://placehold.co/48x72/14161e/94a3b8?text=TV';
                    posterImg.onerror = function () { this.src = safeFallback; };
                    setImageSrcIfChanged(posterImg, data.poster || safeFallback);
                }

                updateTraktModal(data);

            } catch (error) { console.error('Erro no Trakt:', error); }
        }

        fetchTrakt();

        const traktCard = document.getElementById('trakt-card');
        const traktModal = document.getElementById('trakt-modal');
        const closeTraktModalBtn = document.getElementById('close-trakt-modal');

        function openTraktModal() {
            traktModal.classList.add('active');
            traktModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeTraktModalFn() {
            traktModal.classList.remove('active');
            traktModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (traktCard && traktModal) {
            traktCard.addEventListener('click', openTraktModal);
            traktCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTraktModal(); } });
        }
        if (closeTraktModalBtn) closeTraktModalBtn.addEventListener('click', closeTraktModalFn);
        if (traktModal) traktModal.addEventListener('click', (e) => { if (e.target === traktModal) closeTraktModalFn(); });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (techModal && techModal.classList.contains('active')) {
                    techModal.classList.remove('active');
                    document.body.style.overflow = '';
                }

                if (traktModal && traktModal.classList.contains('active')) closeTraktModalFn();
                if (lbModal && lbModal.classList.contains('active')) closeLbModalFn();
                if (spotifyHistoryModal && spotifyHistoryModal.classList.contains('active')) closeSpotifyHistoryModalFn();
            }
        });

        const catGif = document.getElementById('wyd-cat');

        function showCatAt(clickX, clickY) {
            catGif.style.display = 'block';

            const catWidth = catGif.offsetWidth || 180;
            const catHeight = catGif.offsetHeight || 180;

            let posX = clickX;
            let posY = clickY;

            const margem = 10;

            if (posX + catWidth + margem > window.innerWidth) {
                posX = window.innerWidth - catWidth - margem;
            }

            if (posY + catHeight + margem > window.innerHeight) {
                posY = window.innerHeight - catHeight - margem;
            }

            catGif.style.left = posX + 'px';
            catGif.style.top = posY + 'px';
        }

        window.addEventListener('contextmenu', function (evento) {
            evento.preventDefault();

            const clickX = evento.clientX;
            const clickY = evento.clientY;

            if (!catGif.getAttribute('src')) {
                catGif.src = catGif.dataset.src;

                if (!catGif.complete) {
                    catGif.addEventListener('load', () => {
                        showCatAt(clickX, clickY);
                    }, { once: true });
                    return;
                }
            }

            showCatAt(clickX, clickY);
        });

        window.addEventListener('click', function () {
            catGif.style.display = 'none';
        });
