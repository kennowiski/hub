// DISCORD (Status e Jogos)
import { isPageVisible, setImageSrcIfChanged, setContainerHtmlIfChanged } from './utils.js';
import { LANYARD_API_URL } from './config.js';

interface LanyardActivityAssets {
    large_image?: string;
}

interface LanyardActivity {
    type: number;
    name: string;
    details?: string;
    state?: string;
    application_id?: string;
    assets?: LanyardActivityAssets;
}

interface LanyardData {
    discord_user: { id: string; username: string; avatar: string };
    discord_status: 'online' | 'idle' | 'dnd' | 'offline';
    activities: LanyardActivity[];
}

async function fetchDiscordPresence(): Promise<void> {
    if (!isPageVisible()) return;
    try {
        const response = await fetch(LANYARD_API_URL);
        const json = await response.json();
        const data: LanyardData | undefined = json.data;

        if (!data) return;

        const avatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=128`;
        const avatarImg = document.getElementById('discord-avatar') as HTMLImageElement | null;
        setImageSrcIfChanged(avatarImg, avatarUrl);

        const usernameH3 = document.getElementById('discord-username');
        if (usernameH3) usernameH3.textContent = `@${data.discord_user.username}`;

        const statusDot = document.getElementById('discord-status-dot') as HTMLElement | null;
        if (statusDot) statusDot.style.backgroundColor = `var(--status-${data.discord_status})`;

        const statusDisplay: Record<string, string> = { "online": "Online", "idle": "Ausente", "dnd": "N\u00E3o Perturbe", "offline": "Offline" };
        const statusTextP = document.getElementById('discord-status-text');
        if (statusTextP) statusTextP.textContent = statusDisplay[data.discord_status] || "Offline";

        const activityContainer = document.getElementById('discord-activity-container');
        const activity = data.activities.find(a => a.type === 0 || a.type === 2);
        if (activityContainer) {
            if (activity && activity.name !== "Spotify") {
                const isVsCode = activity.name === "Visual Studio Code" || activity.name === "Code";

                if (isVsCode) {
                    const vsCodeIcon = `<img src="/assets/images/vscode.svg" class="activity-img" alt="VS Code">`;
                    const fileLine = activity.details ? `<span>Editando ${activity.details}</span>` : '';
                    const projectLine = activity.state ? `<span>${activity.state}</span>` : '';
                    setContainerHtmlIfChanged(activityContainer, `${vsCodeIcon}<div class="activity-details"><strong>Programando</strong>${fileLine}${projectLine}</div>`);
                } else {
                    let imgUrl = "";
                    if (activity.assets && activity.assets.large_image) {
                        imgUrl = activity.assets.large_image.startsWith("mp:external") ? activity.assets.large_image.replace("mp:external/", "https://media.discordapp.net/external/") : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
                    }
                    setContainerHtmlIfChanged(activityContainer, `${imgUrl ? `<img src="${imgUrl}" class="activity-img" alt="Atividade">` : `<div class="activity-img" style="background:var(--card-border);display:flex;align-items:center;justify-content:center;font-size:24px;">🎮</div>`}<div class="activity-details"><strong>${activity.name}</strong>${activity.details ? `<span>${activity.details}</span>` : ''}${activity.state ? `<span>${activity.state}</span>` : ''}</div>`);
                }
            } else {
                setContainerHtmlIfChanged(activityContainer, `<p class="not-doing-anything">Fazendo nada...</p>`);
            }
        }
    } catch (error) { console.error("Erro no Discord:", error); }
}

export function initDiscord(): void {
    window.addEventListener('load', () => {
        setTimeout(fetchDiscordPresence, 1200);
        setInterval(fetchDiscordPresence, 30000);
    });
}
