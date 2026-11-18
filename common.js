// Fonctions partagées entre la page publique et l'admin

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Texte -> HTML sûr : échappement, liens cliquables, retours à la ligne
function richText(s) {
  return esc(s)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>');
}

function safeUrl(u) {
  try {
    const url = new URL(u);
    return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '#';
  } catch { return '#'; }
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/* ---------- Dates & heures ---------- */
// "2026-12-13" -> Date locale (évite les décalages de fuseau)
function parseDay(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(NaN);
}
function isoDay(dt) {
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
function formatDate(d) {
  const dt = parseDay(d);
  if (isNaN(dt)) return d || '';
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function dayLabel(d) {
  const s = parseDay(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
// Liste des jours entre deux dates incluses (62 jours max)
function daysBetween(a, b) {
  const out = [];
  const d = parseDay(a), e = parseDay(b);
  if (isNaN(d) || isNaN(e)) return out;
  for (let i = 0; d <= e && i < 62; i++) { out.push(isoDay(d)); d.setDate(d.getDate() + 1); }
  return out;
}
function toMin(t) {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function timeLabel(min, fmt) {
  const h = Math.floor(min / 60) % 24, mm = String(min % 60).padStart(2, '0');
  if (fmt === '12h') return `${h % 12 || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
  return `${String(h).padStart(2, '0')}:${mm}`;
}

/* ---------- Posts ---------- */
// Épinglés d'abord, puis du plus récent au plus ancien
function sortPosts(posts) {
  return [...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
}

function renderPost(p) {
  const pin = p.pinned ? '<span class="badge">📌 Épinglé</span>' : '';
  const date = `<time>${esc(formatDate(p.date))}</time>`;
  if (p.type === 'link') {
    const url = safeUrl(p.url);
    return `
    <article class="card link-card">
      <div class="meta">${pin}<span class="badge link">🔗 Lien</span>${date}</div>
      <a class="link-main" href="${esc(url)}" target="_blank" rel="noopener">
        <h2>${esc(p.title || hostOf(p.url) || p.url)}</h2>
        <span class="host">${esc(hostOf(p.url))} ↗</span>
      </a>
      ${p.content ? `<p>${richText(p.content)}</p>` : ''}
    </article>`;
  }
  return `
  <article class="card">
    <div class="meta">${pin}<span class="badge">💬 Message</span>${date}</div>
    ${p.title ? `<h2>${esc(p.title)}</h2>` : ''}
    <p>${richText(p.content)}</p>
  </article>`;
}

/* ---------- Plannings ---------- */
const PALETTE = ['#ffe599', '#b6d7a8', '#a2c4c9', '#f9cb9c', '#ea9999', '#a4c2f4', '#b4a7d6', '#d5a6bd', '#b7b7b7', '#93c47d', '#ffd966', '#76a5af'];

// Couleur automatique : même nom d'event (sans "(3/4)") = même couleur
function autoColor(title) {
  const base = String(title || '').replace(/\(.*?\)/g, '').trim().toLowerCase();
  let h = 0;
  for (const c of base) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function evColor(ev) {
  return /^#[0-9a-f]{6}$/i.test(ev.color || '') ? ev.color : autoColor(ev.title);
}
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#111' : '#fff';
}

// Place chaque event dans la première colonne libre ; un chevauchement crée une nouvelle colonne
function assignColumns(evs) {
  const sorted = [...evs].sort((a, b) =>
    toMin(a.start) - toMin(b.start) ||
    (toMin(b.end) - toMin(b.start)) - (toMin(a.end) - toMin(a.start)));
  const ends = [], items = [];
  for (const e of sorted) {
    const s = toMin(e.start);
    let c = ends.findIndex(x => x <= s);
    if (c < 0) { c = ends.length; ends.push(0); }
    ends[c] = toMin(e.end);
    items.push({ ev: e, col: c });
  }
  return { items, cols: ends.length };
}

function renderPlanning(pl) {
  const fmt = pl.timeFormat;
  const days = daysBetween(pl.startDate, pl.endDate);
  const evs = (pl.events || []).filter(e => toMin(e.end) > toMin(e.start) && days.includes(e.date));

  // Plage horaire : celle du planning, élargie si un event dépasse
  let a = toMin(pl.dayStart || '09:00'), b = toMin(pl.dayEnd || '20:00');
  for (const e of evs) { a = Math.min(a, toMin(e.start)); b = Math.max(b, toMin(e.end)); }
  a = Math.floor(a / 30) * 30; b = Math.ceil(b / 30) * 30;
  if (b <= a) b = a + 30;
  const slots = (b - a) / 30;

  const period = days.length > 1
    ? `Du ${formatDate(days[0])} au ${formatDate(days[days.length - 1])}`
    : (days[0] ? formatDate(days[0]) : '');

  const dayNav = days.length > 1
    ? `<div class="filters">${days.map(d => `<button class="chip" onclick="document.getElementById('day-${esc(pl.id)}-${d}').scrollIntoView({behavior:'smooth'})">${esc(dayLabel(d))}</button>`).join('')}</div>`
    : '';

  const body = days.map(d => {
    const dayEvs = evs.filter(e => e.date === d);
    const title = `<h3>${esc(dayLabel(d))} <span class="muted count">· ${dayEvs.length} événement${dayEvs.length > 1 ? 's' : ''}</span></h3>`;
    if (!dayEvs.length) {
      return `<section class="pl-day" id="day-${esc(pl.id)}-${d}">${title}<p class="muted">Aucun événement ce jour.</p></section>`;
    }
    const { items, cols } = assignColumns(dayEvs);
    let html = '';
    for (let r = 0; r < slots; r++) {
      html += `<div class="pl-time" style="grid-row:${r + 1}">${timeLabel(a + r * 30, fmt)}</div>`;
      html += `<div class="pl-line${r % 2 ? ' half' : ''}" style="grid-row:${r + 1}"></div>`;
    }
    for (let c = 0; c < cols; c++) html += `<div class="pl-vline" style="grid-column:${c + 2}"></div>`;
    for (const { ev, col } of items) {
      const s = Math.floor((toMin(ev.start) - a) / 30) + 1;
      const span = Math.max(1, Math.ceil((toMin(ev.end) - toMin(ev.start)) / 30));
      const bg = evColor(ev), fg = textOn(bg);
      const hours = `${timeLabel(toMin(ev.start), fmt)} – ${timeLabel(toMin(ev.end), fmt)}`;
      const inner = `<strong>${esc(ev.title)}</strong>${ev.details ? `<span>${esc(ev.details)}</span>` : ''}<small>${hours}</small>`;
      const st = `grid-row:${s} / span ${span};grid-column:${col + 2};background:${bg};color:${fg}`;
      const tip = esc(`${ev.title}${ev.details ? ' — ' + ev.details : ''} (${hours})`);
      html += ev.url
        ? `<a class="pl-ev" href="${esc(safeUrl(ev.url))}" target="_blank" rel="noopener" style="${st}" title="Réserver : ${tip}">${inner}<em>Réserver ↗</em></a>`
        : `<div class="pl-ev" style="${st}" title="${tip}">${inner}</div>`;
    }
    return `<section class="pl-day" id="day-${esc(pl.id)}-${d}">${title}
      <div class="pl-scroll"><div class="pl-grid" style="grid-template-columns:var(--tcol) repeat(${cols},minmax(var(--ccol),1fr));grid-template-rows:repeat(${slots},var(--slot))">${html}</div></div>
    </section>`;
  }).join('');

  return `<div class="pl-head">
      <h2>${esc(pl.name)}</h2>
      <p class="muted">${esc(period)}</p>
      ${pl.note ? `<p class="pl-note">${esc(pl.note)}</p>` : ''}
    </div>${dayNav}${body || '<p class="muted center">Aucune date dans ce planning.</p>'}`;
}
