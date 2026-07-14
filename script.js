// ═══════════════════════════════════════════════════════════
//  CONFIG  ←  edit these
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  // Lanyard: join https://discord.gg/lanyard and put your Discord user ID here
  // Get your ID: Discord → Settings → Advanced → Developer Mode → right-click your name → Copy User ID
  DISCORD_USER_ID: 'YOUR_DISCORD_USER_ID',

  // Last.fm (optional – for YT Music now-playing via scrobbling)
  // 1. Create free account at last.fm
  // 2. Install a scrobbler: https://web.last.fm/user/_/listening-report/scrobblers
  //    Recommended: "Web Scrobbler" browser extension → works with YT Music
  // 3. Get your API key at https://www.last.fm/api/account/create
  // 4. Fill in your username and API key below
  LASTFM_USERNAME: '',   // e.g. 'minkdev'
  LASTFM_API_KEY:  'ocularfrog',   // e.g. 'abc123...'

  // Refresh intervals (ms)
  LASTFM_POLL_MS: 15_000,   // how often to check now-playing
  CLOCK_TICK_MS:   1_000,
};
// ═══════════════════════════════════════════════════════════


// ── CLOCK (CET / CEST, Europe/Prague) ──────────────────────
function getCET() {
  const now = new Date();
  const tz   = 'Europe/Prague'; // CET/CEST, auto-handles DST

  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  }).formatToParts(now);
  const get = (t) => timeParts.find(p => p.type === t)?.value ?? '';

  const hour12   = parseInt(get('hour'));
  const minute   = parseInt(get('minute'));
  const second   = parseInt(get('second'));
  const ampm     = get('dayPeriod');
  const hourFull = hour12 + (ampm === 'PM' && hour12 !== 12 ? 12 : 0)
                           - (ampm === 'AM' && hour12 === 12 ? 12 : 0);

  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
  }).format(now);

  return { hour12, minute, second, ampm, hourFull, dateStr };
}

function pad(n) { return String(n).padStart(2, '0'); }

function updateClocks() {
  const { hour12, minute, second, ampm, hourFull, dateStr } = getCET();

  const navClock = document.getElementById('nav-clock');
  if (navClock) navClock.textContent = `${pad(hour12)}:${pad(minute)}:${pad(second)} ${ampm} CET`;

  const digital = document.getElementById('digital-clock');
  if (digital) digital.textContent = `${pad(hour12)}:${pad(minute)}:${pad(second)} ${ampm}`;

  const dateEl = document.getElementById('clock-date');
  if (dateEl) dateEl.textContent = dateStr;

  // Analog hands
  const hourAngle   = ((hourFull % 12) + minute / 60) * 30;
  const minuteAngle = (minute + second / 60) * 6;
  const secondAngle = second * 6;
  setHandAngle('hour-hand',   hourAngle);
  setHandAngle('minute-hand', minuteAngle);
  setHandAngle('second-hand', secondAngle);
}

function setHandAngle(id, deg) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('transform', `rotate(${deg}, 36, 36)`);
}

updateClocks();
setInterval(updateClocks, CONFIG.CLOCK_TICK_MS);


// ── BIRTHDAY COUNTDOWN (August 4) ──────────────────────────
function updateBirthday() {
  const badge = document.getElementById('birthday-badge');
  if (!badge) return;

  const now = new Date();
  const tz  = 'Europe/Prague';

  // Current year's birthday in CET
  const yearStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric' }).format(now);
  const todayStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'numeric', day: 'numeric' }).format(now);

  let year = parseInt(yearStr);
  let bday = new Date(`${year}-08-04T00:00:00`);

  // If birthday already passed this year, use next year
  const todayMD  = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'numeric', day: 'numeric', year: 'numeric' }).format(now);
  const todayDate = new Date(todayMD);
  if (bday < todayDate) bday = new Date(`${year + 1}-08-04T00:00:00`);

  const msLeft = bday - now;
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft === 0) {
    badge.textContent = '🎂 Happy Birthday! 🎉';
  } else if (daysLeft === 1) {
    badge.textContent = '🎂 Birthday tomorrow!';
  } else {
    badge.textContent = `🎂 Birthday in ${daysLeft} days`;
  }
}

updateBirthday();


// ── DISCORD via LANYARD ─────────────────────────────────────
// Lanyard docs: https://github.com/phineas/lanyard
const STATUS_LABELS = {
  online:  'Online',
  idle:    'Idle',
  dnd:     'Do Not Disturb',
  offline: 'Offline',
};

function applyDiscordPresence(data) {
  const status   = data.discord_status || 'offline';
  const user     = data.discord_user;
  const activity = data.activities?.find(a => a.type !== 4); // skip custom status
  const custom   = data.activities?.find(a => a.type === 4); // custom status emoji/text

  // Status dot on avatar
  const avatarDot = document.getElementById('avatar-status-dot');
  if (avatarDot) {
    avatarDot.className = `dnd-dot ${status}`;
  }

  // Status dot + label in Discord card
  const statusDot   = document.getElementById('discord-status-dot');
  const statusLabel = document.getElementById('discord-status-label');
  if (statusDot)   statusDot.className   = `status-dot ${status}`;
  if (statusLabel) statusLabel.textContent = STATUS_LABELS[status] ?? status;

  // Sub text: custom status or default
  const discordSub = document.getElementById('discord-sub');
  if (discordSub) {
    if (custom?.state) {
      discordSub.textContent = `${custom.emoji?.name ?? ''} ${custom.state}`.trim();
    } else {
      discordSub.textContent = status === 'offline'
        ? 'Currently offline.'
        : 'No status set.';
    }
  }

  // Activity block
  const activityWrap = document.getElementById('discord-activity');
  if (activityWrap) {
    if (activity) {
      activityWrap.style.display = 'flex';

      // Activity image
      const actImg = document.getElementById('discord-activity-img');
      if (actImg) {
        const appId = activity.application_id;
        const imgHash = activity.assets?.large_image;
        if (appId && imgHash) {
          // Lanyard proxies images; use the CDN format
          actImg.src = imgHash.startsWith('mp:external/')
            ? `https://media.discordapp.net/external/${imgHash.replace('mp:external/', '')}`
            : `https://cdn.discordapp.com/app-assets/${appId}/${imgHash}.png`;
          actImg.style.display = 'block';
        } else {
          actImg.style.display = 'none';
        }
      }

      document.getElementById('discord-activity-name').textContent   = activity.name ?? '';
      document.getElementById('discord-activity-detail').textContent =
        activity.details ?? activity.state ?? '';
    } else {
      activityWrap.style.display = 'none';
    }
  }
}

function connectLanyard() {
  if (!CONFIG.DISCORD_USER_ID || CONFIG.DISCORD_USER_ID === 'YOUR_DISCORD_USER_ID') {
    console.info('[Lanyard] No Discord user ID set – skipping.');
    return;
  }

  // Use WebSocket for real-time updates
  let ws;

  function openWS() {
    ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.addEventListener('open', () => {
      console.info('[Lanyard] Connected');
    });

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);

      if (msg.op === 1) {
        // Hello – subscribe
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: CONFIG.DISCORD_USER_ID } }));
        // Start heartbeat
        setInterval(() => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
      }

      if (msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
        applyDiscordPresence(msg.d);
      }
    });

    ws.addEventListener('close', () => {
      console.warn('[Lanyard] Disconnected – retrying in 5s');
      setTimeout(openWS, 5000);
    });

    ws.addEventListener('error', (e) => {
      console.error('[Lanyard] WS error', e);
      ws.close();
    });
  }

  openWS();
}

connectLanyard();


// ── LAST.FM (YT Music via Web Scrobbler) ───────────────────
async function fetchLastFM() {
  if (!CONFIG.LASTFM_USERNAME || !CONFIG.LASTFM_API_KEY) return;

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks`
              + `&user=${encodeURIComponent(CONFIG.LASTFM_USERNAME)}`
              + `&api_key=${CONFIG.LASTFM_API_KEY}&format=json&limit=1`;

    const res  = await fetch(url);
    const data = await res.json();
    const track = data?.recenttracks?.track?.[0];
    if (!track) return;

    const isPlaying = track['@attr']?.nowplaying === 'true';
    const title     = track.name;
    const artist    = track.artist['#text'];
    const album     = track.album['#text'];
    const artUrl    = track.image?.find(i => i.size === 'large')?.['#text'] ?? '';

    // Update song title & artist
    const songTitleEl  = document.getElementById('song-title');
    const songArtistEl = document.getElementById('song-artist');
    if (songTitleEl)  songTitleEl.textContent  = title;
    if (songArtistEl) songArtistEl.textContent = artist + (album ? ` — ${album}` : '');

    // Update album art
    const artEl = document.getElementById('album-art');
    if (artEl && artUrl) {
      artEl.src   = artUrl;
      artEl.style.display = 'block';
      const placeholder = document.getElementById('album-art-placeholder');
      if (placeholder) placeholder.style.display = 'none';
    }

    // Visualizer: animated if playing, static if not
    const visualizer = document.querySelector('.visualizer');
    if (visualizer) {
      visualizer.classList.toggle('paused', !isPlaying);
    }

    // Label
    const label = document.getElementById('now-playing-label');
    if (label) label.textContent = isPlaying ? 'Now playing' : 'Last played';

    // Progress bar: Last.fm doesn't give position, so hide when not playing
    const progressArea = document.getElementById('progress-area');
    if (progressArea) progressArea.style.display = isPlaying ? 'block' : 'none';

  } catch (err) {
    console.warn('[Last.fm] Fetch error:', err);
  }
}

// Poll Last.fm on load and on interval
fetchLastFM();
setInterval(fetchLastFM, CONFIG.LASTFM_POLL_MS);
