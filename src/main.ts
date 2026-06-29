// @ts-nocheck

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
        let typewriterStarted = false;

        function typeWriter() {
            if (!typingElement) return;

            if (!typewriterStarted) {
                typewriterStarted = true;
                typeIndex = 0;

                typingElement.textContent = '';
                typingElement.classList.add('typing-active');
                typingElement.classList.remove('typing-done');

                window.setTimeout(() => {
                    if (
                        typingElement &&
                        typingElement.classList.contains('typing-active') &&
                        typingElement.textContent.trim().length < 3
                    ) {
                        typingElement.textContent = textToType;
                        typingElement.classList.remove('typing-active');
                        typingElement.classList.add('typing-done');
                    }
                }, 900);
            }

            if (typeIndex < textToType.length) {
                typingElement.textContent += textToType.charAt(typeIndex);
                typeIndex++;
                setTimeout(typeWriter, 15);
            } else {
                typingElement.classList.remove('typing-active');
                typingElement.classList.add('typing-done');
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
            setInterval(fetchDiscordPresence, 30000);
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
                const vercelUrl = 'https://kennowiski-api-hub.vercel.app/api/spotify';
                const response = await fetch(vercelUrl);
                const data = await response.json();
                const responseHasTrackInfo = data.title && data.artist;
            if (data.isPlaying || responseHasTrackInfo) {
                lastSpotifyData = data;
                syncCurrentTrackWithCachedHistory();
            }

                const hasTrackInfo = responseHasTrackInfo;
                const hasAlbumImage = data.albumImageUrl;

                if (!data.isPlaying && hasTrackInfo) {
                    const historyLabelColor = '#8aa0b8';
                    const historyIcon = data.provider === 'lastfm' ? svgIcon('lastfm') : svgIcon('clock');
                    const fallbackCover = 'https://placehold.co/160x160/14161e/94a3b8?text=%E2%99%AA';

                    setContainerHtmlIfChanged(spotifyContainer, `
                        <div class="spotify-playing">
                            <img src="${hasAlbumImage ? data.albumImageUrl : fallbackCover}" class="spotify-art" alt="Capa do Álbum" width="72" height="72" decoding="async" style="animation: none;">
                            <div class="spotify-info">
                                <span class="spotify-label spotify-label-last" style="color: ${historyLabelColor};">${historyIcon} ÚLTIMA MÚSICA OUVIDA</span>
                                <strong class="spotify-track">${data.title}</strong>
                                <span class="spotify-artist">${data.artist}</span>
                            </div>
                        </div>
                    `);
                    return;
                }

                if (!data.isPlaying) {
                const cachedTrack = lastSpotifyData && lastSpotifyData.title && lastSpotifyData.artist
                    ? lastSpotifyData
                    : null;

                if (cachedTrack) {
                    const historyLabelColor = '#8aa0b8';
                    const historyIcon = cachedTrack.provider === 'lastfm' ? svgIcon('lastfm') : svgIcon('clock');
                    const fallbackCover = 'https://placehold.co/160x160/14161e/94a3b8?text=%E2%99%AA';

                    setContainerHtmlIfChanged(spotifyContainer, `
                        <div class="spotify-playing">
                            <img src="${cachedTrack.albumImageUrl || cachedTrack.imageUrl || fallbackCover}" class="spotify-art" alt="Capa do Álbum" width="72" height="72" decoding="async" style="animation: none;">
                            <div class="spotify-info">
                                <span class="spotify-label spotify-label-last" style="color: ${historyLabelColor};">${historyIcon} ÚLTIMA MÚSICA OUVIDA</span>
                                <strong class="spotify-track">${cachedTrack.title}</strong>
                                <span class="spotify-artist">${cachedTrack.artist}</span>
                            </div>
                        </div>
                    `);
                    return;
                }

                setContainerHtmlIfChanged(spotifyContainer, `
                    <div class="spotify-offline">
                        <svg class="icon spotify-icon-offline" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="7" cy="18" r="2.5" fill="currentColor"/>
                            <circle cx="17" cy="16" r="2.5" fill="currentColor"/>
                        </svg>
                        <div class="spotify-info">
                            <span class="spotify-label" style="color: var(--text-muted);">Status Musical</span>
                            <strong class="spotify-track">Nenhuma música recente encontrada. Tentando novamente<span class="loading-dots"></span></strong>
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
                            <span class="spotify-label spotify-label-now" style="color: ${labelColor};">${labelIcon} ${labelText}</span>
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
            const baseUrl = 'https://kennowiski-api-hub.vercel.app';
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

        let currentMovieRecommendationTarget = null;
        let currentSeriesRecommendationTarget = null;

/* Cache Letterboxd e Trakt */
const LETTERBOXD_CACHE_KEY = 'kenny-letterboxd-last-movie';
const LETTERBOXD_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas

const TRAKT_CACHE_KEY = 'kenny-trakt-last-episode';
const TRAKT_CACHE_TTL_MS = 1000 * 60 * 90; // 1h30min

function readTimedMediaCache(key, ttlMs) {
    try {
        const raw = localStorage.getItem(key);

        if (!raw) return null;

        const cached = JSON.parse(raw);

        if (!cached || typeof cached.createdAt !== 'number' || !cached.data) {
            localStorage.removeItem(key);
            return null;
        }

        if (Date.now() - cached.createdAt > ttlMs) {
            localStorage.removeItem(key);
            return null;
        }

        return cached.data;
    } catch (error) {
        console.warn('Cache local indisponível:', key, error);
        return null;
    }
}

function writeTimedMediaCache(key, data) {
    try {
        if (!data) return;

        localStorage.setItem(
            key,
            JSON.stringify({
                createdAt: Date.now(),
                data
            })
        );
    } catch (error) {
        console.warn('Não foi possível salvar cache local:', key, error);
    }
}

function isValidLetterboxdData(data) {
    return Boolean(data && data.title);
}

function isValidTraktData(data) {
    return Boolean(data && !data.error && (data.show || data.episode));
}

function renderLetterboxdData(data) {
    if (!isValidLetterboxdData(data)) return false;

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

    return true;
}

function renderTraktData(data) {
    if (!isValidTraktData(data)) return false;

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

    currentTraktStoryData = data;
    updateTraktModal(data);

    return true;
}
/* Fim Cache Letterboxd e Trakt */

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

            currentMovieRecommendationTarget = {
                type: 'movie',
                title: normalizedData.title || 'Filme não encontrado',
                year: data.year || data.releaseYear || '',
                extra: normalizedData.rating ? `Avaliação: ${normalizedData.rating}` : ''
            };

            resetGeminiRecommendation('lb');

            if (modalTitle) modalTitle.textContent = normalizedData.title || 'Filme não encontrado';
            if (modalRating) modalRating.textContent = normalizedData.rating;
            if (openLink) openLink.href = data.link || 'https://letterboxd.com/kennowiski/';
        }

        async function fetchLetterboxd() {
    const cachedData = readTimedMediaCache(LETTERBOXD_CACHE_KEY, LETTERBOXD_CACHE_TTL_MS);

    if (cachedData) {
        renderLetterboxdData(cachedData);
    }

    try {
        const response = await fetch('https://kennowiski-api-hub.vercel.app/api/letterboxd');

        if (!response.ok) {
            throw new Error('Resposta inválida da API do Letterboxd.');
        }

        const data = await response.json();

        if (!isValidLetterboxdData(data)) return;

        if (renderLetterboxdData(data)) {
            writeTimedMediaCache(LETTERBOXD_CACHE_KEY, data);
        }
    } catch (error) {
        console.error('Erro no Letterboxd:', error);
    }
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
        
const TRAKT_STORY_AVATAR_URL = 'assets/images/trakt-story-avatar.webp';
let currentTraktStoryData = null;

function getTraktStoryButtonHtml(): string {
    return `
        <svg aria-hidden="true" class="icon" viewbox="0 0 512 512">
            <path d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9L160.6 188C143 171.7 119.5 162 94 162c-53 0-96 43-96 96s43 96 96 96c25.5 0 49-9.7 66.6-26l96.1 48.1c-.5 3.9-.7 7.9-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.5 0-49 9.7-66.6 26l-96.1-48.1c.5-3.9 .7-7.9 .7-11.9s-.2-8-.7-11.9l96.1-48.1c17.6 16.3 41.1 26 66.6 26z"></path>
        </svg>
    `;
}

function getCanvasImageCandidateSources(src) {
    const original = String(src || '').trim();
    const candidates = [];

    const addCandidate = (value) => {
        if (value && !candidates.includes(value)) {
            candidates.push(value);
        }
    };

    if (!original) return candidates;

    addCandidate(original);

    try {
        const url = new URL(original, window.location.href);

        if (url.hostname === 'image.tmdb.org') {
            const higherQuality = url.href.replace('/t/p/w300/', '/t/p/w780/');
            const withoutProtocol = higherQuality.replace(/^https?:\/\//, '');

            addCandidate(higherQuality);
            addCandidate('https://images.weserv.nl/?url=' + encodeURIComponent(withoutProtocol));
            addCandidate('https://wsrv.nl/?url=' + encodeURIComponent(withoutProtocol));
            addCandidate('https://images.weserv.nl/?url=' + encodeURIComponent(higherQuality));
        }
    } catch {}

    return candidates;
}

function loadSingleCanvasImage(src) {
    return new Promise((resolve, reject) => {
        if (!src) {
            reject(new Error('Imagem não informada.'));
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.decoding = 'async';

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Não foi possível carregar a imagem: ' + src));

        img.src = src;
    });
}

async function loadCanvasImage(src) {
    const sources = getCanvasImageCandidateSources(src);
    let lastError = null;

    for (const source of sources) {
        try {
            return await loadSingleCanvasImage(source);
        } catch (error) {
            lastError = error;
            console.warn('Falha ao carregar imagem do canvas, tentando fallback:', source, error);
        }
    }

    throw lastError || new Error('Não foi possível carregar a imagem: ' + src);
}

function roundRectPath(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawCoverImage(ctx, img, x, y, width, height, radius) {
    const ratio = Math.max(width / img.width, height / img.height);
    const drawWidth = img.width * ratio;
    const drawHeight = img.height * ratio;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.save();
    roundRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
}

function fitCanvasText(ctx, text, maxWidth) {
    let value = String(text || '');
    if (ctx.measureText(value).width <= maxWidth) {
        return value;
    }

    while (value.length > 0 && ctx.measureText(value + '…').width > maxWidth) {
        value = value.slice(0, -1);
    }

    return value + '…';
}

function getTraktStoryStars(rating) {
    const stars = renderTraktStars(rating);
    return stars && String(stars).trim() ? stars : '☆☆☆☆☆';
}

function slugifyText(value) {
    return String(value || 'trakt-story')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('Não foi possível gerar a imagem final.'));
        }, 'image/png');
    });
}

async function getStoryAvatarImage() {
    try {
        return await loadCanvasImage(TRAKT_STORY_AVATAR_URL);
    } catch (error) {
        const fallbackAvatar = document.getElementById('discord-avatar');
        if (fallbackAvatar && fallbackAvatar.getAttribute('src')) {
            return await loadCanvasImage(fallbackAvatar.getAttribute('src'));
        }
        throw error;
    }
}


/* TRAKT_STORY_ORIGINAL_VISUAL_HELPERS_V1 */
function drawOriginalTraktLogo(ctx, x, y, logoWidth, logoHeight, color) {
    const traktPath = new Path2D('M64 64L64 352L576 352L576 64L64 64zM0 64C0 28.7 28.7 0 64 0L576 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64L64 416c-35.3 0-64-28.7-64-64L0 64zM128 448l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L128 512c-17.7 0-32-14.3-32-32s14.3-32 32-32z');

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(logoWidth / 640, logoHeight / 512);
    ctx.fillStyle = color;
    ctx.fill(traktPath);
    ctx.restore();
}

function clampOriginalTraktColor(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function mixOriginalTraktColor(colorA, colorB, weight) {
    return {
        r: Math.round(colorA.r + (colorB.r - colorA.r) * weight),
        g: Math.round(colorA.g + (colorB.g - colorA.g) * weight),
        b: Math.round(colorA.b + (colorB.b - colorA.b) * weight)
    };
}

function originalTraktColorToCss(color) {
    return 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
}

function sampleOriginalTraktPosterAverageColor(img) {
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d');

    if (!sampleCtx) return null;

    sampleCanvas.width = 24;
    sampleCanvas.height = 24;

    try {
        sampleCtx.drawImage(img, 0, 0, 24, 24);
        const imageData = sampleCtx.getImageData(0, 0, 24, 24).data;

        let r = 0;
        let g = 0;
        let b = 0;
        let total = 0;

        for (let i = 0; i < imageData.length; i += 4) {
            const alpha = imageData[i + 3];

            if (alpha < 16) continue;

            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
            total++;
        }

        if (!total) return null;

        return {
            r: Math.round(r / total),
            g: Math.round(g / total),
            b: Math.round(b / total)
        };
    } catch {
        return null;
    }
}

function paintOriginalTraktStoryBackground(ctx, posterImg) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);

    if (!posterImg) {
        gradient.addColorStop(0, '#5d6f80');
        gradient.addColorStop(0.48, '#1a2530');
        gradient.addColorStop(1, '#020305');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
        return;
    }

    const sampled = sampleOriginalTraktPosterAverageColor(posterImg);

    if (!sampled) {
        gradient.addColorStop(0, '#5d6f80');
        gradient.addColorStop(0.48, '#1a2530');
        gradient.addColorStop(1, '#020305');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
        return;
    }

    const normalized = {
        r: clampOriginalTraktColor(sampled.r, 0, 255),
        g: clampOriginalTraktColor(sampled.g, 0, 255),
        b: clampOriginalTraktColor(sampled.b, 0, 255)
    };

    const topColor = mixOriginalTraktColor(normalized, { r: 210, g: 225, b: 240 }, 0.38);
    const midColor = mixOriginalTraktColor(normalized, { r: 20, g: 28, b: 38 }, 0.58);
    const bottomColor = mixOriginalTraktColor(normalized, { r: 2, g: 3, b: 6 }, 0.86);

    gradient.addColorStop(0, originalTraktColorToCss(topColor));
    gradient.addColorStop(0.48, originalTraktColorToCss(midColor));
    gradient.addColorStop(1, originalTraktColorToCss(bottomColor));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
}
/* FIM TRAKT_STORY_ORIGINAL_VISUAL_HELPERS_V1 */

let traktStoryTransparentMode = false;

async function generateTraktStoryBlob(options: { transparentBackground?: boolean } = {}) {
    if (!currentTraktStoryData) {
        throw new Error('Nenhum item do Trakt carregado no momento.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas não suportado neste navegador.');
    }

    const transparentBackground = Boolean(options.transparentBackground);

    const title = currentTraktStoryData.show || 'Série';
    const season = String(currentTraktStoryData.season || 0).padStart(2, '0');
    const episodeNumber = String(currentTraktStoryData.episodeNumber || 0).padStart(2, '0');
    const episodeTitle = currentTraktStoryData.episode || 'Episódio';
    const episodeLine = 'S' + season + 'E' + episodeNumber + ' • ' + episodeTitle;
    const stars = getTraktStoryStars(currentTraktStoryData.rating);

    const posterEl = document.getElementById('trakt-modal-poster');
    const cardPosterEl = document.getElementById('trakt-poster');

    const posterSrcFromData = currentTraktStoryData.poster || '';
    const posterSrcFromCard = cardPosterEl
        ? (cardPosterEl.currentSrc || cardPosterEl.src || cardPosterEl.getAttribute('src') || '')
        : '';
    const posterSrcFromModal = posterEl
        ? (posterEl.currentSrc || posterEl.src || posterEl.getAttribute('src') || '')
        : '';

    const posterSrc = posterSrcFromData || posterSrcFromCard || posterSrcFromModal;

    let posterImg = null;

    try {
        posterImg = await loadCanvasImage(posterSrc);
    } catch (error) {
        console.error('Poster do Trakt não carregou para o story:', posterSrc, error);
        throw new Error('O pôster do Trakt não carregou para o story. URL usada: ' + posterSrc);
    }

    if (!transparentBackground) {
        paintOriginalTraktStoryBackground(ctx, posterImg);

        const overlay = ctx.createLinearGradient(0, 0, 0, 1920);
        overlay.addColorStop(0, 'rgba(0,0,0,0.04)');
        overlay.addColorStop(0.7, 'rgba(0,0,0,0.22)');
        overlay.addColorStop(1, 'rgba(0,0,0,0.78)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, 1080, 1920);
    }

    const posterWidth = 690;
    const posterHeight = 1025;
    const posterX = (1080 - posterWidth) / 2;

    const posterBaseY = 295;
    const avatarSize = 131;

    const groupBaseTopY = posterBaseY - 86;
    const groupBaseBottomY = posterBaseY + posterHeight + 117 + 80 + 106 + 82 + 88 + 50;
    const layoutOffsetY = Math.round((1920 / 2) - ((groupBaseTopY + groupBaseBottomY) / 2));

    const posterY = posterBaseY + layoutOffsetY;
    const avatarY = posterY - 86;
    const titleY = posterY + posterHeight + 117;
    const episodeY = titleY + 80;
    const ratingY = episodeY + 106;
    const onY = ratingY + 82;
    const logoY = onY + 88;

    if (posterImg) {
        drawCoverImage(ctx, posterImg, posterX, posterY, posterWidth, posterHeight, 28);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRectPath(ctx, posterX, posterY, posterWidth, posterHeight, 28);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, posterX, posterY, posterWidth, posterHeight, 28);
    ctx.stroke();

    try {
        const avatar = await loadCanvasImage('assets/images/trakt-story-avatar.webp');
        const x = (1080 - avatarSize) / 2;
        const y = avatarY;

        ctx.save();
        ctx.beginPath();
        ctx.arc(540, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
        ctx.restore();
    } catch (error) {
        console.warn('Avatar do story não carregou.', error);
    }

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 72px Inter, Arial, sans-serif';
    ctx.fillText(fitCanvasText(ctx, title, 880), 540, titleY);

    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.font = '600 40px Inter, Arial, sans-serif';
    ctx.fillText(fitCanvasText(ctx, episodeLine, 900), 540, episodeY);

    ctx.fillStyle = '#ef4444';
    ctx.font = '800 58px Inter, Arial, sans-serif';
    ctx.fillText(stars, 540, ratingY);

    const lineGap = 46;
    const lineWidth = 150;

    ctx.strokeStyle = 'rgba(255,255,255,0.30)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(540 - lineGap - lineWidth, onY);
    ctx.lineTo(540 - lineGap, onY);
    ctx.moveTo(540 + lineGap, onY);
    ctx.lineTo(540 + lineGap + lineWidth, onY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '700 28px Inter, Arial, sans-serif';
    ctx.fillText('ON', 540, onY + 10);

    const logoWidth = 50;
    const logoHeight = 50;
    ctx.font = '800 60px Inter, Arial, sans-serif';

    const traktText = 'Trakt';
    const textWidth = ctx.measureText(traktText).width;
    const groupGap = 14;
    const groupWidth = logoWidth + groupGap + textWidth;
    const groupX = (1080 - groupWidth) / 2;

    try {
        const traktIcon = await loadCanvasImage('assets/images/trakt-icon.webp');
        ctx.drawImage(traktIcon, groupX, logoY - 40, logoWidth, logoHeight);
    } catch (error) {
        console.warn('Ícone do Trakt não carregou.', error);
        drawOriginalTraktLogo(ctx, groupX, logoY - 28, 44, 35.2, '#ef4444');
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(traktText, groupX + logoWidth + groupGap, logoY);

    return await canvasToBlob(canvas);
}

async function shareOrDownloadTraktStory(blob, filename) {
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Story do Trakt',
                text: 'Gerado no meu portfólio',
                files: [file]
            });
            return;
        } catch (error) {
            if (error && error.name === 'AbortError') {
                return;
            }
        }
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1200);
}

async function handleTraktStoryShare(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = document.getElementById('trakt-story-btn');
    if (!button) return;

    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<svg aria-hidden="true" class="icon" viewbox="0 0 512 512"><path d="M304 48a16 16 0 1 0-32 0l0 48a16 16 0 1 0 32 0l0-48zM188.7 100.7a16 16 0 0 0-22.6 22.6l33.9 33.9a16 16 0 1 0 22.6-22.6l-33.9-33.9zM96 240a16 16 0 1 0 0 32l48 0a16 16 0 1 0 0-32l-48 0zm326.6-116.7a16 16 0 0 0-22.6-22.6l-33.9 33.9a16 16 0 0 0 22.6 22.6l33.9-33.9zM368 256a112 112 0 1 1-224 0 112 112 0 1 1 224 0zm48 0A160 160 0 1 0 96 256a160 160 0 1 0 320 0zm-50.1 98.1a16 16 0 1 0-22.6 22.6l33.9 33.9a16 16 0 1 0 22.6-22.6l-33.9-33.9zM256 416a16 16 0 1 0-16 16l0 48a16 16 0 1 0 32 0l0-48a16 16 0 1 0-16-16zm-89.4-39.4a16 16 0 0 0-22.6-22.6l-33.9 33.9a16 16 0 1 0 22.6 22.6l33.9-33.9z"></path></svg><span>Gerando...</span>';

    try {
        const blob = await generateTraktStoryBlob({ transparentBackground: traktStoryTransparentMode });
        const filename = 'trakt-story-' + slugifyText(currentTraktStoryData && currentTraktStoryData.show ? currentTraktStoryData.show : 'serie') + '.png';
        await shareOrDownloadTraktStory(blob, filename);
    } catch (error) {
        console.error('Erro ao gerar story do Trakt:', error);
        alert(error instanceof Error ? error.message : 'Não foi possível gerar a imagem do story.');
    } finally {
        button.disabled = false;
        button.innerHTML = getTraktStoryButtonHtml();
    }
}


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
            currentSeriesRecommendationTarget = {
                type: 'series',
                title: data.show || 'Série não encontrada',
                year: data.year || '',
                extra: episodeText ? `Episódio atual: ${episodeText}` : ''
            };

            resetGeminiRecommendation('trakt');

            if (modalBg) modalBg.style.backgroundImage = `url('${poster}')`;
            if (modalTitle) modalTitle.textContent = data.show || 'Série não encontrada';
            if (modalEpisode) modalEpisode.textContent = episodeText;
            if (modalRating) modalRating.textContent = ratingText || '';
            if (openLink) openLink.href = data.traktUrl || 'https://trakt.tv/users/kennowiski/history';
        }

        async function fetchTrakt() {
    const cachedData = readTimedMediaCache(TRAKT_CACHE_KEY, TRAKT_CACHE_TTL_MS);

    if (cachedData) {
        renderTraktData(cachedData);
    }

    try {
        const response = await fetch('https://kennowiski-api-hub.vercel.app/api/trakt');

        if (!response.ok) {
            throw new Error('Resposta inválida da API do Trakt.');
        }

        const data = await response.json();

        if (!isValidTraktData(data)) return;

        if (renderTraktData(data)) {
            writeTimedMediaCache(TRAKT_CACHE_KEY, data);
        }
    } catch (error) {
        console.error('Erro no Trakt:', error);
    }
}

fetchTrakt();

/* TRAKT_STORY_ADMIN_BRIDGE_V5 */
function ensureOriginalTraktStoryButton() {
    let button = document.getElementById('trakt-story-btn');

    if (button) return button;

    button = document.createElement('button');
    button.id = 'trakt-story-btn';
    button.type = 'button';
    button.hidden = true;
    button.innerHTML = getTraktStoryButtonHtml();

    document.body.appendChild(button);

    return button;
}

async function fetchFreshTraktStoryDataFromAdmin() {
    try {
        localStorage.removeItem(TRAKT_CACHE_KEY);
    } catch {}

    const response = await fetch('https://kennowiski-api-hub.vercel.app/api/trakt', {
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error('Resposta inválida da API do Trakt.');
    }

    const data = await response.json();

    if (!isValidTraktData(data)) {
        throw new Error('Dados inválidos da API do Trakt.');
    }

    if (!data.poster || String(data.poster).includes('placehold.co')) {
        throw new Error('A API do Trakt retornou sem pôster real.');
    }

    renderTraktData(data);
    writeTimedMediaCache(TRAKT_CACHE_KEY, data);
    updateTraktModal(data);

    currentTraktStoryData = data;

    return data;
}

function syncFreshTraktPoster(data) {
    const poster = data.poster;

    const cardPoster = document.getElementById('trakt-poster');
    const modalPoster = document.getElementById('trakt-modal-poster');
    const modalBg = document.getElementById('trakt-share-bg');

    if (cardPoster) {
        cardPoster.crossOrigin = 'anonymous';
        cardPoster.referrerPolicy = 'no-referrer';
        setImageSrcIfChanged(cardPoster, poster);
    }

    if (modalPoster) {
        modalPoster.crossOrigin = 'anonymous';
        modalPoster.referrerPolicy = 'no-referrer';
        setImageSrcIfChanged(modalPoster, poster);
    }

    if (modalBg) {
        modalBg.style.backgroundImage = `url('${poster}')`;
    }

    currentTraktStoryData.poster = poster;
}

async function runTraktStoryFromAdminIntent() {
    try {
        const params = new URLSearchParams(window.location.search);
        const storyMode = params.get('traktStory');
        const wantsTransparentStory = storyMode === 'transparent';
        const wantsStory = storyMode === '1' || wantsTransparentStory;

        if (!wantsStory) return;

        traktStoryTransparentMode = wantsTransparentStory;

        window.history.replaceState({}, document.title, '/');

        const freshData = await fetchFreshTraktStoryDataFromAdmin();

        syncFreshTraktPoster(freshData);
        ensureOriginalTraktStoryButton();

        await handleTraktStoryShare({
            preventDefault() {},
            stopPropagation() {}
        });
    } catch (error) {
        traktStoryTransparentMode = false;
        console.error('Erro ao gerar story do Trakt pelo admin:', error);
        alert(error instanceof Error ? error.message : 'Não foi possível gerar o story do Trakt pelo admin.');
    }
}

runTraktStoryFromAdminIntent();
/* FIM TRAKT_STORY_ADMIN_BRIDGE_V5 */

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

        // ==========================================
        // RECOMENDAÇÕES COM GEMINI
        // ==========================================
        const GEMINI_RECOMMENDATION_API = 'https://kennowiski-api-hub.vercel.app/api/gemini';

        const GEMINI_CACHE_PREFIX = 'gemini-recommendation:';
        const GEMINI_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas
        const GEMINI_COOLDOWN_MS = 10000; // 10 segundos

        const geminiPendingBySource = {
            lb: false,
            trakt: false
        };

        const geminiLastRequestAtBySource = {
            lb: 0,
            trakt: 0
        };

        function getGeminiElements(source) {
            return {
                button: document.getElementById(`${source}-recommend-btn`),
                box: document.getElementById(`${source}-recommendation-box`)
            };
        }

        function getGeminiButtonHtml() {
            return `
        <svg aria-hidden="true" class="icon" viewbox="0 -24 512 592">
                            <path
                                d="M512 80c0 18-14.3 34.6-38.4 48c24.1 13.4 38.4 30 38.4 48c0 26.5-31.3 48-70 48s-70-21.5-70-48c0-18 14.3-34.6 38.4-48c-24.1-13.4-38.4-30-38.4-48c0-26.5 31.3-48 70-48s70 21.5 70 48zM160 96l32 96l96 32l-96 32l-32 96l-32-96l-96-32l96-32l32-96zM448 320l16 48l48 16l-48 16l-16 48l-16-48l-48-16l48-16l16-48zM256 352l24 72l72 24l-72 24l-24 72l-24-72l-72-24l72-24l24-72z">
            </path>
        </svg>
        Recomendação
    `;
        }

        function resetGeminiRecommendation(source) {
            const { box } = getGeminiElements(source);

            if (!box) return;

            box.classList.remove('active');
            box.innerHTML = '';
        }

        function escapeGeminiHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function getGeminiCacheKey(target) {
            const type = String(target?.type || '').toLowerCase().trim();
            const title = String(target?.title || '').toLowerCase().trim();
            const year = String(target?.year || '').toLowerCase().trim();

            return `${GEMINI_CACHE_PREFIX}${type}:${title}:${year}`;
        }

        function getCachedGeminiRecommendation(target) {
            try {
                const cacheKey = getGeminiCacheKey(target);
                const rawCache = localStorage.getItem(cacheKey);

                if (!rawCache) return null;

                const cached = JSON.parse(rawCache);

                if (!cached?.createdAt || !Array.isArray(cached.recommendations)) {
                    localStorage.removeItem(cacheKey);
                    return null;
                }

                const isExpired = Date.now() - cached.createdAt > GEMINI_CACHE_TTL_MS;

                if (isExpired) {
                    localStorage.removeItem(cacheKey);
                    return null;
                }

                return cached.recommendations;
            } catch {
                return null;
            }
        }

        function setCachedGeminiRecommendation(target, recommendations) {
            try {
                if (!Array.isArray(recommendations) || recommendations.length === 0) return;

                const cacheKey = getGeminiCacheKey(target);

                localStorage.setItem(cacheKey, JSON.stringify({
                    createdAt: Date.now(),
                    recommendations: recommendations.slice(0, 3)
                }));
            } catch {
                // Se o navegador bloquear localStorage, apenas ignora.
            }
        }

        function showGeminiMessage(source, title, message) {
            const { box } = getGeminiElements(source);

            if (!box) return;

            box.innerHTML = `
        <span class="gemini-recommendation-title">${escapeGeminiHtml(title)}</span>
        ${escapeGeminiHtml(message)}
    `;

            box.classList.add('active');
        }

        function renderGeminiRecommendations(source, recommendations, fromCache = false) {
            const { box } = getGeminiElements(source);

            if (!box) return;

            if (!Array.isArray(recommendations) || recommendations.length === 0) {
                box.innerHTML = `
            <span class="gemini-recommendation-title">Recomendação</span>
            Nenhuma recomendação encontrada agora.
        `;
                box.classList.add('active');
                return;
            }

            const itemsHtml = recommendations.slice(0, 3).map((item) => {
                const title = escapeGeminiHtml(item.title || 'Título não informado');
                const year = item.year ? ` (${escapeGeminiHtml(item.year)})` : '';
                const reason = escapeGeminiHtml(item.reason || 'Obra com elementos parecidos.');

                return `
            <div class="gemini-recommendation-item">
                <strong>${title}${year}</strong><br>
                <span>${reason}</span>
            </div>
        `;
            }).join('');

            box.innerHTML = `
        <span class="gemini-recommendation-title">
            Recomendações da IA${fromCache ? ' · cache' : ''}
        </span>
        <div class="gemini-recommendation-list">
            ${itemsHtml}
        </div>
    `;

            box.classList.add('active');
        }

        function getGeminiFriendlyErrorMessage(status, data) {
            if (status === 429) {
                return 'Limite temporário de uso da IA atingido. Tente novamente em alguns minutos.';
            }

            if (status === 503) {
                return 'A IA está sobrecarregada agora. Tente novamente em instantes.';
            }

            if (data?.details?.error?.message) {
                return data.details.error.message;
            }

            if (data?.details) {
                return String(data.details);
            }

            if (data?.error) {
                return String(data.error);
            }

            return 'Não foi possível gerar recomendações agora.';
        }

        async function handleGeminiRecommendation(source) {
            const target = source === 'lb'
                ? currentMovieRecommendationTarget
                : currentSeriesRecommendationTarget;

            const { button, box } = getGeminiElements(source);

            if (!target || !target.title) {
                showGeminiMessage(
                    source,
                    'Recomendação',
                    'Ainda não há dados suficientes para recomendar.'
                );
                return;
            }

            if (geminiPendingBySource[source]) {
                showGeminiMessage(
                    source,
                    'Recomendação',
                    'Aguarde a recomendação atual terminar.'
                );
                return;
            }

            const cachedRecommendations = getCachedGeminiRecommendation(target);

            if (cachedRecommendations) {
                renderGeminiRecommendations(source, cachedRecommendations, true);
                return;
            }

            const now = Date.now();
            const timeSinceLastRequest = now - geminiLastRequestAtBySource[source];

            if (timeSinceLastRequest < GEMINI_COOLDOWN_MS) {
                const secondsToWait = Math.ceil((GEMINI_COOLDOWN_MS - timeSinceLastRequest) / 1000);

                showGeminiMessage(
                    source,
                    'Recomendação',
                    `Aguarde ${secondsToWait} segundo(s) antes de pedir outra recomendação.`
                );

                return;
            }

            try {
                geminiPendingBySource[source] = true;
                geminiLastRequestAtBySource[source] = Date.now();

                if (button) {
                    button.disabled = true;
                    button.innerHTML = `
                <span class="gemini-loader" aria-hidden="true" style="width: 14px; height: 14px; border-width: 2px;"></span>
                Gerando...
            `;
                }

                if (box) {
                    box.innerHTML = `
                <span class="gemini-recommendation-title">Recomendação</span>
                Buscando sugestões parecidas<span class="loading-dots"></span>
            `;
                    box.classList.add('active');
                }

                const response = await fetch(GEMINI_RECOMMENDATION_API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(target)
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok || data.error) {
                    throw new Error(getGeminiFriendlyErrorMessage(response.status, data));
                }

                const recommendations = Array.isArray(data.recommendations)
                    ? data.recommendations.slice(0, 3)
                    : [];

                setCachedGeminiRecommendation(target, recommendations);
                renderGeminiRecommendations(source, recommendations);
            } catch (error) {
                console.error('Erro ao buscar recomendação Gemini:', error);

                showGeminiMessage(
                    source,
                    'Recomendação',
                    error instanceof Error
                        ? error.message
                        : 'Não foi possível gerar recomendações agora.'
                );
            } finally {
                geminiPendingBySource[source] = false;

                if (button) {
                    button.disabled = false;
                    button.innerHTML = getGeminiButtonHtml();
                }
            }
        }

        const lbRecommendBtn = document.getElementById('lb-recommend-btn');
        const traktRecommendBtn = document.getElementById('trakt-recommend-btn');

        if (lbRecommendBtn) {
            lbRecommendBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                handleGeminiRecommendation('lb');
            });
        }

        if (traktRecommendBtn) {
            traktRecommendBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                handleGeminiRecommendation('trakt');
            });
        }

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

/* Supabase Auth Gate - botão Story Trakt */
const SUPABASE_PROJECT_URL = 'https://ivbpcyjkvzsawjzhrwsd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YLo65P0_gWwgWTMhRzr7Cw_gnd03sdu';
const ADMIN_VERIFY_ENDPOINT = 'https://kennowiski-api-hub.vercel.app/api/admin/verify';


/* ADMIN_VERIFY_HELPER_V1 */
async function verifyAdminSessionWithBackend(client: any, authData?: any): Promise<boolean> {
    let accessToken = authData &&
        authData.session &&
        authData.session.access_token;

    if (!accessToken && authData && authData.access_token) {
        accessToken = authData.access_token;
    }

    if (!accessToken && client && client.auth && typeof client.auth.getSession === 'function') {
        const sessionResult = await client.auth.getSession();
        accessToken = sessionResult &&
            sessionResult.data &&
            sessionResult.data.session &&
            sessionResult.data.session.access_token;
    }

    if (!accessToken) return false;

    try {
        const response = await fetch(ADMIN_VERIFY_ENDPOINT, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                authorization: 'Bearer ' + accessToken
            }
        });

        if (!response.ok) return false;

        const data = await response.json().catch(() => ({
            allowed: false
        }));

        return data && data.allowed === true;
    } catch (error) {
        console.error('Erro ao verificar admin:', error);
        return false;
    }
}
/* FIM ADMIN_VERIFY_HELPER_V1 */

const SUPABASE_AUTH_STORAGE_KEY = 'sb-ivbpcyjkvzsawjzhrwsd-auth-token';

function hasSupabaseSessionStored() {
    try {
        return Boolean(localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY));
    } catch {
        return false;
    }
}

function loadSupabaseSdk() {
    return new Promise((resolve, reject) => {
        if (window.supabase && window.supabase.createClient) {
            resolve(window.supabase);
            return;
        }

        const existingScript = document.querySelector('script[data-supabase-sdk="true"]');

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.supabase), { once: true });
            existingScript.addEventListener('error', reject, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.defer = true;
        script.dataset.supabaseSdk = 'true';

        script.onload = () => resolve(window.supabase);
        script.onerror = () => reject(new Error('Não foi possível carregar o Supabase Auth.'));

        document.head.appendChild(script);
    });
}

async function getSupabaseAuthClient() {
    const supabaseGlobal = await loadSupabaseSdk();

    return supabaseGlobal.createClient(
        SUPABASE_PROJECT_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        }
    );
}

function showTraktStoryButton() {
    document.documentElement.classList.add('supabase-story-authorized');
}

function hideTraktStoryButton() {
    document.documentElement.classList.remove('supabase-story-authorized');
}

function setStoryLoginMessage(message, type = '') {
    const messageEl = document.getElementById('story-login-message');

    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.classList.remove('error', 'success');

    if (type) {
        messageEl.classList.add(type);
    }
}

function cleanSupabaseAuthUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('login');
    url.searchParams.delete('logout');

    const cleanPath = url.pathname.replace(/\/+$/, '') === '/login' ? '/' : url.pathname;

    window.history.replaceState(
        {},
        document.title,
        cleanPath + (url.search ? url.search : '') + url.hash
    );
}


/* STORY_LOGIN_SCROLL_LOCK_V1 */
let storyLoginSavedScrollY = 0;
let storyLoginScrollLocked = false;

function lockStoryLoginScroll() {
    if (storyLoginScrollLocked) return;

    storyLoginSavedScrollY = window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

    storyLoginScrollLocked = true;

    document.documentElement.classList.add('story-login-scroll-locked');
    document.body.classList.add('story-login-scroll-locked');

    document.body.style.position = 'fixed';
    document.body.style.top = '-' + storyLoginSavedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
}

function unlockStoryLoginScroll() {
    if (!storyLoginScrollLocked) return;

    storyLoginScrollLocked = false;

    document.documentElement.classList.remove('story-login-scroll-locked');
    document.body.classList.remove('story-login-scroll-locked');

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    window.scrollTo(0, storyLoginSavedScrollY);
}
/* FIM STORY_LOGIN_SCROLL_LOCK_V1 */

function closeStoryLoginModal() {
    const modal = document.getElementById('story-login-modal');

    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    unlockStoryLoginScroll();
}

function openStoryLoginModal(client) {
    return new Promise((resolve) => {
        const modal = document.getElementById('story-login-modal');
        const form = document.getElementById('story-login-form');
        const emailInput = document.getElementById('story-login-email');
        const passwordInput = document.getElementById('story-login-password');
        const closeBtn = document.getElementById('story-login-close');
        const submitBtn = document.getElementById('story-login-submit');

        if (!modal || !form || !emailInput || !passwordInput || !submitBtn) {
            resolve(false);
            return;
        }

        emailInput.value = '';
        passwordInput.value = '';
        setStoryLoginMessage('');

        modal.classList.add('active');
        lockStoryLoginScroll();
        modal.setAttribute('aria-hidden', 'false');


        const cleanup = () => {
            form.removeEventListener('submit', handleSubmit);
            closeBtn?.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOverlayClick);
            document.removeEventListener('keydown', handleEscape);
        };

        const finish = (result) => {
            cleanup();
            closeStoryLoginModal();
            resolve(result);
        };

        const handleCancel = () => {
            const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';

            if (normalizedPath === '/login') {
                document.documentElement.classList.add('auth-redirecting');
                window.location.replace('/');
                return;
            }

            cleanSupabaseAuthUrl();
            finish(false);
        };

        const handleOverlayClick = (event) => {
            if (event.target === modal) {
                handleCancel();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                handleCancel();
            }
        };

        async function handleSubmit(event) {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                setStoryLoginMessage('Preencha e-mail e senha.', 'error');
                return;
            }

            submitBtn.disabled = true;
            setStoryLoginMessage('Entrando...');

            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    setStoryLoginMessage('Login inválido.', 'error');
                    passwordInput.value = '';
                    passwordInput.focus();
                    return;
                }

                const loggedEmail = data && data.user && data.user.email
                    ? data.user.email.toLowerCase()
                    : '';

                if (!(await verifyAdminSessionWithBackend(client, data))) {
                    await client.auth.signOut();
                    hideTraktStoryButton();
                    setStoryLoginMessage('Usuário não autorizado.', 'error');
                    return;
                }

                showTraktStoryButton();
                cleanSupabaseAuthUrl();
                setStoryLoginMessage('Acesso liberado.', 'success');

                setTimeout(() => {
                    finish(true);
                }, 350);
            } catch (error) {
                console.error('Erro no login do Supabase:', error);
                setStoryLoginMessage('Erro ao entrar. Tente novamente.', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        }

        form.addEventListener('submit', handleSubmit);
        closeBtn?.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleEscape);
    });
}

async function handleSupabaseStoryAuth() {
    const params = new URLSearchParams(window.location.search);
    const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const wantsLogin = normalizedPath === '/login';
    const wantsLogout = params.get('logout') === 'on';

    if (!wantsLogin && !wantsLogout && !hasSupabaseSessionStored()) {
        hideTraktStoryButton();
        return;
    }

    try {
        const client = await getSupabaseAuthClient();

        if (wantsLogout) {
            await client.auth.signOut();
            hideTraktStoryButton();
            cleanSupabaseAuthUrl();
            return;
        }

        if (wantsLogin) {
            const didLogin = await openStoryLoginModal(client);

            if (didLogin) {
                window.location.href = '/admin';
            }
            return;
        }

        const { data, error } = await client.auth.getUser();

        if (error || !data || !data.user || !data.user.email) {
            hideTraktStoryButton();
            return;
        }

        if (await verifyAdminSessionWithBackend(client, data)) {
            showTraktStoryButton();
        } else {
            hideTraktStoryButton();
        }
    } catch (error) {
        console.error('Erro no Supabase Auth:', error);
        hideTraktStoryButton();
    }
}

handleSupabaseStoryAuth();
/* Fim Supabase Auth Gate - botão Story Trakt */
