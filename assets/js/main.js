/* ═══════════════════════════════════════════════════════════
   RawFans — Shared Application Logic
   ═══════════════════════════════════════════════════════════ */

const RawFans = {
  STORAGE_KEYS: {
    leads: 'rawfans_leads',
    content: 'rawfans_content',
    finance: 'rawfans_finance',
    outreachTemplates: 'rawfans_outreach_templates',
    outreachLog: 'rawfans_outreach_log',
    settings: 'rawfans_settings',
  },

  TEMPLATE_CATEGORIES: {
    icebreaker: 'Icebreaker',
    followup1: 'Follow-up 1',
    followup2: 'Follow-up 2',
    call_invite: 'Call Einladung',
    call_followup: 'Call Follow-up',
    interest: 'Interesse / Weiteres Gespräch',
    contract: 'Vertragsgespräch',
    reengagement: 'Re-Engagement',
    other: 'Sonstiges',
  },

  OUTREACH_STATUSES: {
    sent: 'Sent',
    replied: 'Replied',
    positive_reply: 'Positive Reply',
    ghosted: 'Ghosted',
    negative: 'Negative',
    call_planned: 'Call geplant',
    call_done: 'Call durchgeführt',
  },

  OUTREACH_SENTIMENTS: {
    interested: 'Interessiert',
    neutral: 'Neutral',
    rejecting: 'Ablehnend',
    questions: 'Fragen gestellt',
  },

  OUTREACH_NEXT_ACTIONS: {
    followup2: 'Follow-up 2 senden',
    call_suggest: 'Call vorschlagen',
    contract: 'Vertrag schicken',
    no_follow: 'Nicht weiter verfolgen',
    wait: 'Abwarten',
    reengage: 'Re-Engagement',
  },

  FINANCE_CATEGORIES: [
    'Agentur-Einnahmen',
    'Model Payout',
    'Werbung',
    'Tools & Software',
    'Lohn',
    'Sonstiges',
  ],

  /* ── Storage ───────────────────────────────────────────── */

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  /* ── Date Helpers ──────────────────────────────────────── */

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  formatRelative(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    return this.formatDate(dateStr);
  },

  isThisWeek(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  },

  getMonthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  getCurrentMonthKey() {
    return this.getMonthKey(new Date().toISOString());
  },

  formatMonthLabel(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  },

  /* ── Navigation & Shell ────────────────────────────────── */

  initShell(activePage) {
    this.setActiveNav(activePage);
    this.initSidebar();
    this.updateTopbarDate();
  },

  setActiveNav(page) {
    document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  },

  initSidebar() {
    const menuBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay?.classList.toggle('active');
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    sidebar?.querySelectorAll('.nav-item:not(.disabled)').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
          sidebar.classList.remove('open');
          overlay?.classList.remove('active');
        }
      });
    });
  },

  initFilterToggle(toggleId, panelId) {
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    if (!toggle || !panel) return;

    const close = () => {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    panel.querySelectorAll('[data-filter-close]').forEach((btn) => {
      btn.addEventListener('click', close);
    });
  },

  updateTopbarDate() {
    const el = document.getElementById('topbar-date');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  },

  /* ── Modal ─────────────────────────────────────────────── */

  openModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  _modalCloseCallbacks: {},

  initModal(modalId, { onClose } = {}) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;

    if (onClose) this._modalCloseCallbacks[modalId] = onClose;

    const close = () => {
      this.closeModal(modalId);
      this._modalCloseCallbacks[modalId]?.();
    };

    overlay.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', close);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    if (!this._escListenerBound) {
      this._escListenerBound = true;
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const active = document.querySelector('.modal-overlay.active');
        if (!active?.id) return;
        this.closeModal(active.id);
        this._modalCloseCallbacks[active.id]?.();
      });
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  debounce(fn, ms = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  parseFollowers(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Math.max(0, Math.floor(value));
    const str = String(value).trim().toUpperCase().replace(/\./g, '').replace(/,/g, '');
    const match = str.match(/^([\d.]+)\s*([KMB])?$/i);
    if (!match) return parseInt(str, 10) || 0;
    let num = parseFloat(match[1]);
    const suffix = (match[2] || '').toUpperCase();
    if (suffix === 'K') num *= 1000;
    if (suffix === 'M') num *= 1000000;
    if (suffix === 'B') num *= 1000000000;
    return Math.floor(num);
  },

  formatFollowers(num) {
    if (num == null || isNaN(num) || num === 0) return '—';
    return new Intl.NumberFormat('de-DE').format(num);
  },

  /* ── Status Badge ──────────────────────────────────────── */

  statusBadge(status) {
    const labels = {
      new: 'Neu',
      messaged: 'Angeschrieben',
      replied: 'Geantwortet',
      interested: 'Interessiert',
      signed: 'Signed',
      rejected: 'Abgelehnt',
      contacted: 'Angeschrieben',
    };
    const cssClass = status === 'contacted' ? 'messaged' : status;
    const label = labels[status] || status;
    return `<span class="badge badge-${cssClass}">${label}</span>`;
  },

  authBadge(auth) {
    const labels = { real: 'Echt', ai: 'KI', uncertain: 'Unsicher' };
    return `<span class="auth-badge auth-${auth}">${labels[auth] || 'Unsicher'}</span>`;
  },

  attractivenessBadge(score) {
    const n = Math.min(10, Math.max(1, parseInt(score, 10) || 5));
    let level = 'mid';
    if (n <= 3) level = 'low';
    else if (n <= 6) level = 'mid';
    else if (n <= 8) level = 'high';
    else level = 'top';
    return `<span class="attract-score attract-${level}">${n}</span>`;
  },

  attractivenessStars(score) {
    const n = Math.min(10, Math.max(1, parseInt(score, 10) || 5));
    const filled = Math.round(n / 2);
    let level = 'mid';
    if (n <= 3) level = 'low';
    else if (n <= 6) level = 'mid';
    else if (n <= 8) level = 'high';
    else level = 'top';
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="attract-star${i <= filled ? ' filled' : ''}">★</span>`;
    }
    return `<span class="attract-stars-wrap attract-${level}" title="${n}/10"><span class="attract-stars">${stars}</span><span class="attract-num">${n}</span></span>`;
  },

  profileChip(link, platform = 'Other') {
    if (!link) return '<span class="profile-chip-empty">—</span>';
    const key = { Instagram: 'instagram', X: 'x', TikTok: 'tiktok', Other: 'other' }[platform] || 'other';
    let label = 'Profil';
    try {
      const host = new URL(link).hostname.replace('www.', '');
      if (host.includes('instagram')) label = 'Instagram';
      else if (host.includes('tiktok')) label = 'TikTok';
      else if (host.includes('twitter') || host.includes('x.com')) label = 'X';
      else label = host.split('.')[0];
    } catch { /* keep default */ }
    return `<a href="${this.escapeHtml(link)}" class="profile-chip profile-chip-${key}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      <span>${this.escapeHtml(label)}</span>
    </a>`;
  },

  platformPill(platform) {
    const key = { Instagram: 'instagram', X: 'x', TikTok: 'tiktok', Other: 'other' }[platform] || 'other';
    return `<span class="platform-pill"><span class="platform-dot ${key}"></span>${this.escapeHtml(platform)}</span>`;
  },

  truncate(str, max = 42) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
  },

  migrateLead(lead) {
    if (lead.username !== undefined && lead.authenticity !== undefined) {
      return {
        ...lead,
        followers: this.parseFollowers(lead.followers),
        attractiveness: Math.min(10, Math.max(1, parseInt(lead.attractiveness, 10) || 5)),
        platform: lead.platform === 'Twitter' ? 'X' : lead.platform,
        status: lead.status === 'contacted' ? 'messaged' : lead.status,
      };
    }

    const statusMap = { contacted: 'messaged', new: 'new', interested: 'interested', signed: 'signed', rejected: 'rejected' };

    return {
      id: lead.id,
      date: lead.date || lead.createdAt || new Date().toISOString(),
      platform: lead.platform === 'Twitter' ? 'X' : (['Instagram', 'X', 'TikTok'].includes(lead.platform) ? lead.platform : 'Other'),
      username: lead.username || lead.handle || lead.name || '',
      profileLink: lead.profileLink || '',
      followers: this.parseFollowers(lead.followers),
      authenticity: lead.authenticity || 'uncertain',
      attractiveness: Math.min(10, Math.max(1, parseInt(lead.attractiveness, 10) || 5)),
      status: statusMap[lead.status] || lead.status || 'new',
      notes: lead.notes || '',
      createdAt: lead.createdAt || lead.date || new Date().toISOString(),
    };
  },

  /* ── Seed Data ─────────────────────────────────────────── */

  seedData() {
    if (!this.get(this.STORAGE_KEYS.content)) {
      const sampleContent = [
        {
          id: this.generateId(),
          title: 'Carousel — Brand Story',
          category: 'instagram',
          description: '5-Slide Carousel für neue Model-Launches mit einheitlichem Branding',
          prompt: '',
          fileUrl: 'https://canva.com/design/example-carousel',
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
        {
          id: this.generateId(),
          title: 'Reel Hook — Lifestyle',
          category: 'reels',
          description: '15-Sekunden Hook für Lifestyle-Content mit Trending Audio',
          prompt: 'Close-up lifestyle shot, golden hour lighting, slow motion hair flip, trending audio sync point at 3s…',
          fileUrl: '',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: this.generateId(),
          title: 'Caption Generator — Gemini',
          category: 'gemini',
          description: 'Prompt für Instagram Captions im RawFans Brand Voice',
          prompt: 'Du bist ein Social Media Manager für eine Premium OnlyFans Agentur. Schreibe 3 Caption-Varianten für einen Instagram Post. Ton: selbstbewusst, luxuriös, nicht explizit. Thema: {{topic}}',
          fileUrl: '',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          id: this.generateId(),
          title: 'Brand Kit Q2 — Canva',
          category: 'canva',
          description: 'Farbpalette, Typografie und Social Templates für Q2',
          prompt: '',
          fileUrl: 'https://canva.com/design/example-brandkit',
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
        {
          id: this.generateId(),
          title: 'Kling AI — Cinematic Intro',
          category: 'video',
          description: 'Video-Prompt für cinematic Model-Intro Clips',
          prompt: 'Cinematic slow motion, woman walking through luxury apartment, warm lighting, 4K, shallow depth of field, film grain, moody atmosphere',
          fileUrl: '',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: this.generateId(),
          title: 'Content-Idee: Behind the Scenes',
          category: 'other',
          description: 'BTS Content-Konzept für authentische Model-Präsenz',
          prompt: '',
          fileUrl: '',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
      ];
      this.set(this.STORAGE_KEYS.content, sampleContent);
    }

    const OUTREACH_TEMPLATE_SEED_VERSION = 2;
    const outreachSeedKey = 'rawfans_outreach_templates_seed_v';
    const outreachTemplateDefs = [
      {
        title: 'Icebreaker — Klassisch & persönlich',
        category: 'icebreaker',
        text: `Hey [Name],

hab gerade dein Profil entdeckt und fand deine Bilder echt stark. Du hast eine sehr eigene Ausstrahlung.

Ich bin Scout bei RawFans, einer deutschen OnlyFans-Agentur. Ich sehe bei dir echt Potenzial und würde gerne mal kurz mit dir quatschen – völlig unverbindlich.

Hättest du Lust?`,
      },
      {
        title: 'Icebreaker — Etwas direkter',
        category: 'icebreaker',
        text: `Hey [Name],

kurz und direkt: Ich scout für RawFans und dein Profil ist mir positiv aufgefallen. Du wirkst authentisch und hast eine gute Präsenz.

Würdest du grundsätzlich mal offen für ein unverbindliches Gespräch sein, wie OnlyFans bei uns laufen könnte?`,
      },
      {
        title: 'Icebreaker — Sehr locker',
        category: 'icebreaker',
        text: `Hey [Name],

deine letzten Posts haben mir echt gut gefallen. Du hast einen sehr cleanen und natürlichen Style.

Ich arbeite bei RawFans und suche aktuell nach genau solchen Creatorinnen. Hättest du Bock, mal kurz zu hören, wie so eine Zusammenarbeit bei uns aussehen würde?`,
      },
      {
        title: 'Icebreaker — Kurz & direkt',
        category: 'icebreaker',
        text: 'Hey [Name], ich scout für RawFans und dein Profil hat mir echt gut gefallen. Hättest du mal Lust auf ein kurzes, unverbindliches Gespräch?',
      },
      {
        title: 'Icebreaker — Persönlich & wertschätzend',
        category: 'icebreaker',
        text: `Hey [Name],

ich sehe relativ viele Profile und deins ist mir wirklich positiv aufgefallen. Du wirkst sehr authentisch und professionell zugleich – das ist selten.

Deshalb wollte ich dich direkt ansprechen. Hast du mal 10 Minuten Zeit für ein unverbindliches Gespräch?`,
      },
      {
        title: 'Icebreaker — Kostenlos & fair',
        category: 'icebreaker',
        text: `Hey [Name],

kurz zu mir: Ich scout für RawFans. Wir arbeiten komplett provisionsbasiert – das heißt für dich entstehen keine Kosten. Wir verdienen nur, wenn du auch verdienst.

Würdest du trotzdem mal hören wollen, wie so eine Zusammenarbeit bei uns abläuft?`,
      },
      {
        title: 'Icebreaker — Wachsende Creatorinnen',
        category: 'icebreaker',
        text: `Hey [Name],

du baust aktuell echt schön auf. Ich sehe bei dir Potenzial, dass da noch deutlich mehr gehen könnte.

Ich arbeite bei RawFans und helfe Creatorinnen genau dabei. Hättest du Interesse, mal zu hören, wie wir das machen?`,
      },
      {
        title: 'Follow-up 1 — Nachhaken',
        category: 'followup1',
        text: `Hey [Name],

ich hatte dir vor ein paar Tagen geschrieben. Wollte nur kurz nachhaken, ob du meine Nachricht gesehen hast.

Falls du gerade viel um die Ohren hast, kein Stress. Würde mich trotzdem freuen, wenn wir kurz sprechen könnten.`,
      },
      {
        title: 'Follow-up 1 — Transparent',
        category: 'followup1',
        text: `Hey [Name],

kurze Nachfrage zu meiner letzten Nachricht. Bist du grundsätzlich offen für so ein Gespräch oder soll ich dich in Ruhe lassen?

Kein Druck, einfach nur damit ich weiß, wo ich stehe.`,
      },
      {
        title: 'Follow-up 1 — Kurz',
        category: 'followup1',
        text: 'Hey [Name], nur kurz nachgehakt wegen meiner letzten Nachricht. Alles gut bei dir?',
      },
      {
        title: 'Follow-up 2 — Letzte Nachricht',
        category: 'followup2',
        text: `Hey [Name],

ich melde mich nochmal, weil ich dein Profil wirklich stark finde und es schade wäre, wenn wir nicht mal kurz drüber reden.

Falls du aktuell einfach keinen Kopf dafür hast, sag mir gerne Bescheid. Ansonsten würde ich mich sehr über ein kurzes Gespräch freuen.`,
      },
      {
        title: 'Call Einladung — Interesse gezeigt',
        category: 'call_invite',
        text: `Hey [Name],

freut mich, dass du zurückgeschrieben hast.

Würdest du Lust haben, diese Woche mal kurz zu telefonieren? Dann können wir dir alles in Ruhe erklären und du kannst deine Fragen stellen. Dauert maximal 20–25 Minuten.

Wann würde es dir zeitlich passen?`,
      },
      {
        title: 'Call Einladung — Flexibel',
        category: 'call_invite',
        text: `Hey [Name],

alles klar. Lass uns gerne mal telefonieren, damit du ein besseres Gefühl dafür bekommst, wie wir arbeiten.

Hättest du diese Woche oder nächste Woche Zeit für einen kurzen Call? Ich bin relativ flexibel.`,
      },
      {
        title: 'Call Follow-up — Termin bestätigen',
        category: 'call_followup',
        text: `Hey [Name],

kurze Erinnerung an unseren Call — passt der Termin noch? Freue mich auf das Gespräch!`,
      },
      {
        title: 'Interesse vertiefen',
        category: 'interest',
        text: `Hey [Name],

danke für deine Antwort! Ich schicke dir gerne mehr Details zu unserem Management-Modell. Was ist dir am wichtigsten — Reichweite, Einnahmen oder Support?`,
      },
      {
        title: 'Re-Engagement — Inaktiv',
        category: 'reengagement',
        text: `Hey [Name],

lange kein Kontakt! Wir haben gerade neue Slots frei und ich dachte an dich. Interesse an einem unverbindlichen Update-Gespräch?`,
      },
    ];
    const defaultOutreachTemplates = outreachTemplateDefs.map((tpl, i) => ({
      id: this.generateId(),
      ...tpl,
      createdAt: new Date(Date.now() - (outreachTemplateDefs.length - i) * 86400000).toISOString(),
    }));

    const outreachSeedVersion = this.get(outreachSeedKey) || 0;
    const existingTemplates = this.get(this.STORAGE_KEYS.outreachTemplates);

    if (!existingTemplates) {
      this.set(this.STORAGE_KEYS.outreachTemplates, defaultOutreachTemplates);
      this.set(outreachSeedKey, OUTREACH_TEMPLATE_SEED_VERSION);
    } else if (outreachSeedVersion < OUTREACH_TEMPLATE_SEED_VERSION) {
      const existingTitles = new Set(existingTemplates.map((t) => t.title));
      const toAdd = defaultOutreachTemplates
        .filter((t) => !existingTitles.has(t.title))
        .map((t) => ({ ...t, id: this.generateId(), createdAt: new Date().toISOString() }));
      if (toAdd.length) {
        this.set(this.STORAGE_KEYS.outreachTemplates, [...toAdd, ...existingTemplates]);
      }
      this.set(outreachSeedKey, OUTREACH_TEMPLATE_SEED_VERSION);
    }

  },

  /* ── Content CRUD ──────────────────────────────────────── */

  CONTENT_CATEGORIES: {
    instagram: 'Instagram Posts',
    reels: 'Reels / Animationen',
    gemini: 'Gemini Prompts',
    canva: 'Canva Templates',
    video: 'Video Prompts',
    other: 'Sonstiges',
  },

  migrateContent(item) {
    if (item.category) {
      return {
        ...item,
        prompt: item.prompt || '',
        fileUrl: item.fileUrl || '',
        description: item.description || '',
      };
    }

    const typeMap = { design: 'canva', animation: 'reels', prompt: 'gemini', reel: 'reels' };

    return {
      id: item.id,
      title: item.title || '',
      category: typeMap[item.type] || 'other',
      description: item.description || '',
      prompt: item.prompt || '',
      fileUrl: item.fileUrl || '',
      createdAt: item.createdAt || new Date().toISOString(),
    };
  },

  getContent() {
    const raw = this.get(this.STORAGE_KEYS.content) || [];
    const migrated = raw.map((item) => this.migrateContent(item));
    const changed = raw.some((item, i) => JSON.stringify(item) !== JSON.stringify(migrated[i]));
    if (changed) this.set(this.STORAGE_KEYS.content, migrated);
    return migrated;
  },

  saveContent(items) {
    this.set(this.STORAGE_KEYS.content, items);
  },

  getFinance() {
    return this.get(this.STORAGE_KEYS.finance) || [];
  },

  saveFinance(entries) {
    this.set(this.STORAGE_KEYS.finance, entries);
  },

  migrateTemplate(tpl) {
    const catMap = { call: 'call_invite' };
    return { ...tpl, category: catMap[tpl.category] || tpl.category };
  },

  getOutreachTemplates() {
    const raw = this.get(this.STORAGE_KEYS.outreachTemplates) || [];
    const migrated = raw.map((t) => this.migrateTemplate(t));
    const changed = raw.some((t, i) => JSON.stringify(t) !== JSON.stringify(migrated[i]));
    if (changed) this.saveOutreachTemplates(migrated);
    return migrated;
  },

  saveOutreachTemplates(templates) {
    this.set(this.STORAGE_KEYS.outreachTemplates, templates);
  },

  migrateOutreachEntry(entry, templates) {
    const statusMap = { interested: 'positive_reply' };
    const tpl = templates.find((t) => t.id === entry.templateId);
    const migrated = { ...entry };
    delete migrated.followUpNeeded;
    return {
      ...migrated,
      status: statusMap[entry.status] || entry.status || 'sent',
      messageType: entry.messageType || tpl?.category || 'other',
      sentiment: entry.sentiment || '',
      nextAction: entry.nextAction || (entry.followUpNeeded ? 'followup2' : ''),
      followUpDate: entry.followUpDate || null,
      callPlanned: entry.callPlanned ?? ['call_planned', 'call_done'].includes(entry.status),
      callDate: entry.callDate || null,
      callTime: entry.callTime || '',
    };
  },

  getOutreachLog() {
    const templates = this.get(this.STORAGE_KEYS.outreachTemplates) || [];
    const raw = this.get(this.STORAGE_KEYS.outreachLog) || [];
    const migrated = raw.map((e) => this.migrateOutreachEntry(e, templates));
    const changed = raw.some((e, i) => JSON.stringify(e) !== JSON.stringify(migrated[i]));
    if (changed) this.saveOutreachLog(migrated);
    return migrated;
  },

  saveOutreachLog(entries) {
    this.set(this.STORAGE_KEYS.outreachLog, entries);
  },

  templateCategoryLabel(cat) {
    return this.TEMPLATE_CATEGORIES[cat] || cat;
  },

  isCallMessageType(type) {
    return ['call_invite', 'call_followup'].includes(type);
  },

  outreachStatusBadge(status) {
    const key = status === 'interested' ? 'positive_reply' : status;
    return `<span class="badge badge-outreach-${key}">${this.OUTREACH_STATUSES[key] || status}</span>`;
  },

  sentimentBadge(sentiment) {
    if (!sentiment) return '<span class="sentiment-none">—</span>';
    const label = this.OUTREACH_SENTIMENTS[sentiment] || sentiment;
    return `<span class="sentiment-badge sentiment-${sentiment}">${label}</span>`;
  },

  formatDateTime(dateStr, timeStr) {
    if (!dateStr) return '—';
    const d = this.formatDate(dateStr);
    return timeStr ? `${d} · ${timeStr}` : d;
  },

  financeTypeLabel(type) {
    return type === 'income' ? 'Einnahme' : 'Ausgabe';
  },

  financeStatusBadge(entry) {
    const labels = {
      received: 'Erhalten',
      paid: 'Bezahlt',
      pending: 'Ausstehend',
    };
    const cssClass = entry.status || 'pending';
    return `<span class="badge badge-finance-${cssClass}">${labels[cssClass] || cssClass}</span>`;
  },

  contentCategoryLabel(category) {
    return this.CONTENT_CATEGORIES[category] || category;
  },

  contentCategoryIcon(category) {
    const icons = {
      instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
      reels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
      gemini: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
      canva: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
      video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
      other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    };
    return icons[category] || icons.other;
  },

  showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('In Zwischenablage kopiert');
      return true;
    } catch {
      this.showToast('Kopieren fehlgeschlagen');
      return false;
    }
  },

  /* ── Dashboard Stats ───────────────────────────────────── */

  getDashboardStats(leads = []) {
    const total = leads.length;
    const contactedThisWeek = leads.filter(
      (l) => ['messaged', 'replied', 'contacted'].includes(l.status) && this.isThisWeek(l.date)
    ).length;
    const signed = leads.filter((l) => l.status === 'signed').length;
    const interested = leads.filter((l) => l.status === 'interested').length;

    return { total, contactedThisWeek, signed, interested };
  },

  getRecentActivity(leads = []) {
    const activities = [];

    leads.forEach((lead) => {
      const name = this.escapeHtml(lead.username);
      if (['messaged', 'replied', 'contacted'].includes(lead.status)) {
        activities.push({
          text: `<strong>${name}</strong> wurde angeschrieben`,
          time: lead.date,
          type: 'messaged',
        });
      }
      if (lead.status === 'signed') {
        activities.push({
          text: `<strong>${name}</strong> hat unterschrieben`,
          time: lead.date,
          type: 'signed',
        });
      }
      if (lead.status === 'new') {
        activities.push({
          text: `Neuer Lead: <strong>${name}</strong>`,
          time: lead.date,
          type: 'new',
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 6);
  },
};

/* ── Shared Supabase Leads ───────────────────────────────── */

let dashboardLeadsCache = [];
let dashboardLeadsRefreshScheduled = false;
let outreachLeadsRefreshScheduled = false;

async function fetchSharedLeads() {
  if (!window.RawFansLeadsDB?.fetchLeads) {
    throw new Error('Supabase Client nicht geladen. Bitte supabase-client.js auf dieser Seite einbinden.');
  }
  return RawFansLeadsDB.fetchLeads();
}

async function fetchSharedOutreachLog() {
  if (!window.RawFansOutreachLogDB?.fetchOutreachLog) {
    throw new Error('Supabase Outreach Log nicht geladen. Bitte outreach-app.js prüfen.');
  }
  return RawFansOutreachLogDB.fetchOutreachLog();
}

async function fetchSharedFinance() {
  if (!window.RawFansFinanceDB?.fetchFinance) {
    throw new Error('Supabase Finanzen nicht geladen. Bitte finanzen-app.js prüfen.');
  }
  return RawFansFinanceDB.fetchFinance();
}

/* ── Page: Dashboard ───────────────────────────────────────── */

async function initDashboard() {
  RawFans.seedData();
  RawFans.initShell('dashboard');

  window.addEventListener('beforeunload', () => RawFansLeadsDB?.unsubscribeFromLeads());

  setDashboardLoading(true);
  showDashboardError(null);

  try {
    dashboardLeadsCache = await fetchSharedLeads();
    renderDashboard(dashboardLeadsCache);

    RawFansLeadsDB.subscribeToLeads(() => {
      if (dashboardLeadsRefreshScheduled) return;
      dashboardLeadsRefreshScheduled = true;
      requestAnimationFrame(async () => {
        dashboardLeadsRefreshScheduled = false;
        try {
          dashboardLeadsCache = await fetchSharedLeads();
          renderDashboard(dashboardLeadsCache);
        } catch (err) {
          console.warn('[Dashboard] Realtime-Refresh fehlgeschlagen:', err);
        }
      });
    });
  } catch (err) {
    handleDashboardError(err);
    renderDashboard([]);
  } finally {
    setDashboardLoading(false);
  }
}

function handleDashboardError(err) {
  const message = err?.message || 'Leads konnten nicht geladen werden.';
  showDashboardError(message);
}

function showDashboardError(message) {
  const el = document.getElementById('dashboard-error-banner');
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function setDashboardLoading(isLoading) {
  const tbody = document.getElementById('recent-leads-body');
  if (isLoading && tbody) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="leads-loading-state">
          <div class="leads-loading-spinner"></div>
          <p>Leads werden geladen…</p>
        </div>
      </td></tr>`;
  }
}

function renderDashboard(leads) {
  const stats = RawFans.getDashboardStats(leads);

  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-contacted').textContent = stats.contactedThisWeek;
  document.getElementById('stat-signed').textContent = stats.signed;
  document.getElementById('stat-interested').textContent = stats.interested;

  const activityList = document.getElementById('activity-list');
  const activities = RawFans.getRecentActivity(leads);

  if (activities.length === 0) {
    activityList.innerHTML = `
      <li class="empty-state" style="padding: 24px 0;">
        <p>Noch keine Aktivitäten</p>
      </li>`;
  } else {
    activityList.innerHTML = activities
      .map(
        (a) => `
      <li class="activity-item">
        <span class="activity-dot"></span>
        <span class="activity-text">${a.text}</span>
        <span class="activity-time">${RawFans.formatRelative(a.time)}</span>
      </li>`
      )
      .join('');
  }

  const recentLeadsBody = document.getElementById('recent-leads-body');
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recentLeads.length === 0) {
    recentLeadsBody.innerHTML = `
      <tr><td colspan="5" class="empty-state">Keine Leads vorhanden</td></tr>`;
  } else {
    recentLeadsBody.innerHTML = recentLeads
      .map(
        (lead) => `
      <tr>
        <td class="cell-primary" data-label="Name">${RawFans.escapeHtml(lead.username)}</td>
        <td data-label="Plattform">${RawFans.platformPill(lead.platform)}</td>
        <td data-label="Follower">${RawFans.formatFollowers(lead.followers)}</td>
        <td data-label="Status">${RawFans.statusBadge(lead.status)}</td>
        <td data-label="Datum">${RawFans.formatDate(lead.date)}</td>
      </tr>`
      )
      .join('');
  }
}

/* ── Page: Leads ─────────────────────────────────────────── */

let leadsFilter = { search: '', platform: 'all', authenticity: 'all', status: 'all' };
let editingLeadId = null;
let leadToDeleteId = null;
let leadsCache = [];
let renderScheduled = false;
let leadsLoading = false;
let leadsSaving = false;
let leadsRealtimeRefreshScheduled = false;

/** Leads-Seite initialisieren (Supabase) */
async function initLeads() {
  RawFans.initShell('leads');
  RawFans.initModal('lead-modal', { onClose: resetLeadForm });
  RawFans.initModal('lead-delete-modal', { onClose: resetDeleteLeadState });

  document.getElementById('lead-delete-confirm')?.addEventListener('click', () => {
    confirmDeleteLead().catch(handleLeadsError);
  });

  document.getElementById('add-lead-btn')?.addEventListener('click', () => openLeadModal());
  document.getElementById('empty-add-lead-main')?.addEventListener('click', () => openLeadModal());
  document.getElementById('lead-form')?.addEventListener('submit', (e) => {
    handleLeadSubmit(e).catch(handleLeadsError);
  });

  document.getElementById('leads-migration-import')?.addEventListener('click', () => {
    runLeadsMigration().catch(handleLeadsError);
  });

  document.getElementById('leads-migration-dismiss')?.addEventListener('click', () => {
    document.getElementById('leads-migration-banner')?.classList.add('hidden');
  });

  const attractSlider = document.getElementById('lead-attract');
  const attractValue = document.getElementById('lead-attract-value');
  attractSlider?.addEventListener('input', (e) => {
    if (attractValue) attractValue.textContent = e.target.value;
  });

  const debouncedSearch = RawFans.debounce((value) => {
    leadsFilter.search = value.toLowerCase();
    scheduleRenderLeadsTable();
  }, 180);

  document.getElementById('leads-search')?.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });

  document.getElementById('leads-platform-filter')?.addEventListener('change', (e) => {
    leadsFilter.platform = e.target.value;
    scheduleRenderLeadsTable();
  });

  document.getElementById('leads-auth-filter')?.addEventListener('change', (e) => {
    leadsFilter.authenticity = e.target.value;
    scheduleRenderLeadsTable();
  });

  document.getElementById('leads-status-filter')?.addEventListener('change', (e) => {
    leadsFilter.status = e.target.value;
    scheduleRenderLeadsTable();
  });

  RawFans.initFilterToggle('leads-filter-toggle', 'leads-filters-panel');

  document.getElementById('leads-table-body')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const deleteBtn = e.target.closest('[data-delete]');
    if (editBtn) editLead(editBtn.dataset.edit);
    if (deleteBtn) openDeleteLeadModal(deleteBtn.dataset.delete);
  });

  window.addEventListener('beforeunload', () => RawFansLeadsDB.unsubscribeFromLeads());

  setLeadsLoading(true);
  showLeadsError(null);

  try {
    if (!window.RawFansLeadsDB) {
      throw new Error('Supabase Client nicht geladen. Bitte assets/js/supabase-client.js prüfen.');
    }
    await loadLeadsFromSupabase();

    RawFansLeadsDB.subscribeToLeads(() => {
      if (leadsRealtimeRefreshScheduled) return;
      leadsRealtimeRefreshScheduled = true;
      requestAnimationFrame(async () => {
        leadsRealtimeRefreshScheduled = false;
        try {
          await loadLeadsFromSupabase({ silent: true });
        } catch (err) {
          console.warn('[Leads] Realtime-Refresh fehlgeschlagen:', err);
        }
      });
    });

    updateLeadsMigrationBanner();
  } catch (err) {
    handleLeadsError(err);
    renderLeadsTable();
  } finally {
    setLeadsLoading(false);
  }
}

function handleLeadsError(err) {
  const message = err?.message || 'Ein unerwarteter Fehler ist aufgetreten.';
  showLeadsError(message);
  RawFans.showToast(message);
}

function showLeadsError(message) {
  const el = document.getElementById('leads-error-banner');
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function setLeadsLoading(isLoading) {
  leadsLoading = isLoading;
  const overlay = document.getElementById('leads-loading-overlay');
  overlay?.classList.toggle('hidden', !isLoading);
  document.getElementById('add-lead-btn')?.toggleAttribute('disabled', isLoading || leadsSaving);
}

function setLeadsSaving(isSaving) {
  leadsSaving = isSaving;
  const submitBtn = document.querySelector('#lead-form button[type="submit"]');
  const deleteBtn = document.getElementById('lead-delete-confirm');
  submitBtn?.toggleAttribute('disabled', isSaving);
  deleteBtn?.toggleAttribute('disabled', isSaving);
  document.getElementById('add-lead-btn')?.toggleAttribute('disabled', isSaving || leadsLoading);
  if (submitBtn) submitBtn.textContent = isSaving ? 'Speichern…' : 'Speichern';
}

async function loadLeadsFromSupabase({ silent = false } = {}) {
  if (!silent) setLeadsLoading(true);
  try {
    leadsCache = await RawFansLeadsDB.fetchLeads();
    renderLeadsTable();
    updateLeadsMigrationBanner();
  } finally {
    if (!silent) setLeadsLoading(false);
  }
}

function updateLeadsMigrationBanner() {
  const banner = document.getElementById('leads-migration-banner');
  const countEl = document.getElementById('leads-migration-count');
  if (!banner) return;

  const localCount = RawFansLeadsDB.getLocalStorageLeadCount();
  if (localCount === 0) {
    banner.classList.add('hidden');
    return;
  }

  if (countEl) countEl.textContent = String(localCount);
  banner.classList.remove('hidden');
}

async function runLeadsMigration() {
  const btn = document.getElementById('leads-migration-import');
  btn?.setAttribute('disabled', 'true');
  if (btn) btn.textContent = 'Importiere…';

  try {
    const result = await RawFansLeadsDB.importFromLocalStorage();
    await loadLeadsFromSupabase();

    if (result.imported > 0) {
      RawFans.showToast(`${result.imported} Lead${result.imported === 1 ? '' : 's'} importiert`);
    } else if (result.alreadyMigrated) {
      RawFans.showToast('Daten wurden bereits importiert');
    } else {
      RawFans.showToast('Keine lokalen Daten zum Importieren');
    }

    if (result.skipped > 0) {
      RawFans.showToast(`${result.skipped} Einträge übersprungen (Duplikate/Fehler)`);
    }

    document.getElementById('leads-migration-banner')?.classList.add('hidden');
  } finally {
    btn?.removeAttribute('disabled');
    if (btn) btn.textContent = 'Alte Leads aus localStorage in Supabase importieren';
  }
}

function scheduleRenderLeadsTable() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    renderLeadsTable();
  });
}

async function refreshLeadsCache() {
  leadsCache = await RawFansLeadsDB.fetchLeads();
}

function getFilteredLeads() {
  const search = leadsFilter.search;

  return leadsCache
    .filter((lead) => {
      if (search) {
        const haystack = [
          lead.username,
          lead.notes,
          lead.profileLink,
          lead.platform,
        ].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (leadsFilter.platform !== 'all' && lead.platform !== leadsFilter.platform) return false;
      if (leadsFilter.authenticity !== 'all' && lead.authenticity !== leadsFilter.authenticity) return false;
      if (leadsFilter.status !== 'all' && lead.status !== leadsFilter.status) return false;

      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calcLeadsStats() {
  const total = leadsCache.length;
  const newThisWeek = leadsCache.filter((l) => RawFans.isThisWeek(l.date)).length;
  const messaged = leadsCache.filter(
    (l) => ['messaged', 'replied', 'contacted'].includes(l.status)
  ).length;
  const converted = leadsCache.filter(
    (l) => ['interested', 'signed'].includes(l.status)
  ).length;
  return { total, newThisWeek, messaged, converted };
}

function renderLeadsStats() {
  const stats = calcLeadsStats();
  document.getElementById('stat-leads-total').textContent = stats.total;
  document.getElementById('stat-leads-week').textContent = stats.newThisWeek;
  document.getElementById('stat-leads-messaged').textContent = stats.messaged;
  document.getElementById('stat-leads-converted').textContent = stats.converted;
}

function buildLeadRow(lead) {
  const notes = lead.notes || '';
  const notesClass = notes ? 'has-notes' : '';
  const statusClass = lead.status === 'signed' ? ' row-signed' : lead.status === 'interested' ? ' row-interested' : '';

  return `<tr data-id="${lead.id}" class="leads-row${statusClass}">
    <td class="cell-date" data-label="Datum">${RawFans.formatDate(lead.date)}</td>
    <td data-label="Plattform">${RawFans.platformPill(lead.platform)}</td>
    <td class="cell-primary cell-username" data-label="Username">${RawFans.escapeHtml(lead.username)}</td>
    <td data-label="Profil">${RawFans.profileChip(lead.profileLink, lead.platform)}</td>
    <td class="cell-followers" data-label="Follower">${RawFans.formatFollowers(lead.followers)}</td>
    <td data-label="Echt / AI">${RawFans.authBadge(lead.authenticity)}</td>
    <td data-label="Attraktivität">${RawFans.attractivenessStars(lead.attractiveness)}</td>
    <td data-label="Status">${RawFans.statusBadge(lead.status)}</td>
    <td data-label="Notizen"><span class="notes-cell ${notesClass}" title="${RawFans.escapeHtml(notes)}">${RawFans.escapeHtml(RawFans.truncate(notes)) || '—'}</span></td>
    <td>
      <div class="table-actions">
        <button class="btn btn-ghost btn-sm btn-icon" data-edit="${lead.id}" title="Bearbeiten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" data-delete="${lead.id}" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function renderLeadsTable() {
  const tbody = document.getElementById('leads-table-body');
  const countEl = document.getElementById('leads-count');
  const emptyPanel = document.getElementById('leads-empty-panel');
  const tableCard = document.getElementById('leads-table-card');
  const controlBar = document.querySelector('.leads-control-bar');
  const leads = getFilteredLeads();
  const total = leadsCache.length;

  renderLeadsStats();

  if (leadsLoading && total === 0) {
    emptyPanel?.classList.add('hidden');
    tableCard?.classList.remove('hidden');
    controlBar?.classList.remove('hidden');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="leads-loading-state">
              <div class="leads-loading-spinner"></div>
              <p>Leads werden geladen…</p>
            </div>
          </td>
        </tr>`;
    }
    return;
  }

  const isCompletelyEmpty = total === 0;
  emptyPanel?.classList.toggle('hidden', !isCompletelyEmpty);
  tableCard?.classList.toggle('hidden', isCompletelyEmpty);
  controlBar?.classList.toggle('hidden', isCompletelyEmpty);

  if (isCompletelyEmpty) return;

  if (countEl) {
    countEl.innerHTML = leads.length === total
      ? `<strong>${total}</strong> Leads`
      : `<strong>${leads.length}</strong> von ${total}`;
  }

  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="leads-filter-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <h4>Keine Leads gefunden</h4>
            <p>Passe deine Filter an oder lege einen neuen Lead an.</p>
            <button class="btn btn-primary" id="empty-add-lead">Neuer Lead</button>
          </div>
        </td>
      </tr>`;
    document.getElementById('empty-add-lead')?.addEventListener('click', () => openLeadModal());
    return;
  }

  const rows = new Array(leads.length);
  for (let i = 0; i < leads.length; i++) {
    rows[i] = buildLeadRow(leads[i]);
  }
  tbody.innerHTML = rows.join('');
}

function openLeadModal(lead = null) {
  editingLeadId = lead?.id || null;
  const form = document.getElementById('lead-form');
  const title = document.getElementById('lead-modal-title');
  const attractValue = document.getElementById('lead-attract-value');

  title.textContent = lead ? 'Lead bearbeiten' : 'Neuer Lead';

  const today = new Date().toISOString().split('T')[0];
  form.date.value = lead?.date
    ? new Date(lead.date).toISOString().split('T')[0]
    : today;
  form.platform.value = lead?.platform || 'Instagram';
  form.username.value = lead?.username || '';
  form.profileLink.value = lead?.profileLink || '';
  form.followers.value = lead?.followers || '';
  form.authenticity.value = lead?.authenticity || 'uncertain';
  form.attractiveness.value = lead?.attractiveness || 5;
  form.status.value = lead?.status || 'new';
  form.notes.value = lead?.notes || '';

  if (attractValue) attractValue.textContent = form.attractiveness.value;

  RawFans.openModal('lead-modal');
}

function editLead(id) {
  const lead = leadsCache.find((l) => l.id === id);
  if (lead) openLeadModal(lead);
}

function openDeleteLeadModal(id) {
  const lead = leadsCache.find((l) => l.id === id);
  if (!lead) return;

  leadToDeleteId = id;

  const usernameEl = document.getElementById('lead-delete-username');
  if (usernameEl) {
    const displayName = lead.username.startsWith('@') ? lead.username : `@${lead.username}`;
    usernameEl.textContent = displayName;
  }

  RawFans.openModal('lead-delete-modal');
}

async function confirmDeleteLead() {
  if (!leadToDeleteId) return;

  setLeadsSaving(true);
  try {
    await RawFansLeadsDB.deleteLead(leadToDeleteId);
    await loadLeadsFromSupabase({ silent: true });
    RawFans.closeModal('lead-delete-modal');
    resetDeleteLeadState();
    RawFans.showToast('Lead gelöscht');
  } finally {
    setLeadsSaving(false);
  }
}

function resetDeleteLeadState() {
  leadToDeleteId = null;
}

function resetLeadForm() {
  editingLeadId = null;
  const form = document.getElementById('lead-form');
  form?.reset();
  const attractValue = document.getElementById('lead-attract-value');
  if (attractValue) attractValue.textContent = '5';
}

async function handleLeadSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const leadData = {
    date: new Date(form.date.value).toISOString(),
    platform: form.platform.value,
    username: form.username.value.trim(),
    profileLink: form.profileLink.value.trim(),
    followers: parseInt(form.followers.value, 10) || 0,
    authenticity: form.authenticity.value,
    attractiveness: parseInt(form.attractiveness.value, 10) || 5,
    status: form.status.value,
    notes: form.notes.value.trim(),
  };

  setLeadsSaving(true);
  try {
    if (editingLeadId) {
      await RawFansLeadsDB.updateLead(editingLeadId, leadData);
      RawFans.showToast('Lead aktualisiert');
    } else {
      await RawFansLeadsDB.addLead(leadData);
      RawFans.showToast('Lead angelegt');
    }

    await loadLeadsFromSupabase({ silent: true });
    RawFans.closeModal('lead-modal');
    resetLeadForm();
  } finally {
    setLeadsSaving(false);
  }
}

/* ── Page: Content Hub ───────────────────────────────────── */

let contentFilter = { search: '', category: 'all' };
let editingContentId = null;
let contentToDeleteId = null;
let contentCache = [];
let contentRenderScheduled = false;

function initContent() {
  RawFans.seedData();
  RawFans.initShell('content');
  RawFans.initModal('content-modal', { onClose: resetContentForm });
  RawFans.initModal('content-delete-modal', { onClose: resetDeleteContentState });

  document.getElementById('content-delete-confirm')?.addEventListener('click', confirmDeleteContent);

  contentCache = RawFans.getContent();

  document.getElementById('add-content-btn')?.addEventListener('click', () => openContentModal());
  document.getElementById('content-form')?.addEventListener('submit', handleContentSubmit);

  const debouncedSearch = RawFans.debounce((value) => {
    contentFilter.search = value.toLowerCase();
    scheduleRenderContentGrid();
  }, 180);

  document.getElementById('content-search')?.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });

  document.getElementById('content-tabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.content-tab[data-category]');
    if (!tab) return;
    document.querySelectorAll('.content-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    contentFilter.category = tab.dataset.category;
    scheduleRenderContentGrid();
  });

  document.getElementById('content-grid')?.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    const downloadBtn = e.target.closest('[data-download]');
    const editBtn = e.target.closest('[data-edit-content]');
    const deleteBtn = e.target.closest('[data-delete-content]');

    if (copyBtn) {
      e.stopPropagation();
      const item = contentCache.find((c) => c.id === copyBtn.dataset.copy);
      if (item?.prompt) RawFans.copyToClipboard(item.prompt);
    }
    if (downloadBtn) {
      e.stopPropagation();
      const item = contentCache.find((c) => c.id === downloadBtn.dataset.download);
      if (item?.fileUrl) window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
    }
    if (editBtn) {
      e.stopPropagation();
      editContent(editBtn.dataset.editContent);
    }
    if (deleteBtn) {
      e.stopPropagation();
      openDeleteContentModal(deleteBtn.dataset.deleteContent);
    }
  });

  renderContentGrid();
}

function refreshContentCache() {
  contentCache = RawFans.getContent();
}

function scheduleRenderContentGrid() {
  if (contentRenderScheduled) return;
  contentRenderScheduled = true;
  requestAnimationFrame(() => {
    contentRenderScheduled = false;
    renderContentGrid();
  });
}

function getFilteredContent() {
  const search = contentFilter.search;

  return contentCache
    .filter((item) => {
      if (search) {
        const haystack = [item.title, item.description, item.prompt, item.category]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (contentFilter.category !== 'all' && item.category !== contentFilter.category) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateContentTabCounts() {
  const counts = { all: contentCache.length };
  Object.keys(RawFans.CONTENT_CATEGORIES).forEach((cat) => {
    counts[cat] = contentCache.filter((item) => item.category === cat).length;
  });

  document.querySelectorAll('[data-count]').forEach((el) => {
    const key = el.dataset.count;
    if (counts[key] !== undefined) el.textContent = counts[key];
  });
}

function buildContentCard(item) {
  const hasPrompt = Boolean(item.prompt?.trim());
  const hasFile = Boolean(item.fileUrl?.trim());
  const cat = item.category || 'other';

  return `<article class="content-card" data-id="${item.id}">
    <div class="content-card-preview cat-${cat}">
      <span class="content-card-category">${RawFans.escapeHtml(RawFans.contentCategoryLabel(cat))}</span>
      ${RawFans.contentCategoryIcon(cat)}
    </div>
    <div class="content-card-body">
      <h4 class="content-card-title">${RawFans.escapeHtml(item.title)}</h4>
      <p class="content-card-desc">${RawFans.escapeHtml(item.description) || 'Keine Beschreibung'}</p>
      <div class="content-card-date">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${RawFans.formatDate(item.createdAt)}
      </div>
      <div class="content-card-actions">
        <button class="btn btn-secondary" data-copy="${item.id}" ${hasPrompt ? '' : 'disabled'} title="Prompt kopieren">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy
        </button>
        <button class="btn btn-secondary" data-download="${item.id}" ${hasFile ? '' : 'disabled'} title="Download öffnen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
        <button class="btn btn-ghost btn-icon-only" data-edit-content="${item.id}" title="Bearbeiten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-ghost btn-icon-only" data-delete-content="${item.id}" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  </article>`;
}

function renderContentGrid() {
  const grid = document.getElementById('content-grid');
  const countEl = document.getElementById('content-count');
  const items = getFilteredContent();
  const total = contentCache.length;

  updateContentTabCounts();

  if (countEl) {
    countEl.innerHTML = items.length === total
      ? `<strong>${total}</strong> Einträge`
      : `<strong>${items.length}</strong> von ${total} Einträgen`;
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <h4>Kein Content gefunden</h4>
        <p>Passe deine Suche oder Kategorie an, oder lege einen neuen Eintrag an.</p>
        <button class="btn btn-primary" id="empty-add-content">Neuer Eintrag</button>
      </div>`;
    document.getElementById('empty-add-content')?.addEventListener('click', () => openContentModal());
    return;
  }

  const cards = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    cards[i] = buildContentCard(items[i]);
  }
  grid.innerHTML = cards.join('');
}

function openContentModal(item = null) {
  editingContentId = item?.id || null;
  const form = document.getElementById('content-form');
  const title = document.getElementById('content-modal-title');

  title.textContent = item ? 'Eintrag bearbeiten' : 'Neuer Eintrag';

  form.title.value = item?.title || '';
  form.category.value = item?.category || 'instagram';
  form.description.value = item?.description || '';
  form.prompt.value = item?.prompt || '';
  form.fileUrl.value = item?.fileUrl || '';

  const deleteBtn = document.getElementById('content-delete-btn');
  if (deleteBtn) {
    deleteBtn.style.display = item ? 'inline-flex' : 'none';
    deleteBtn.onclick = () => {
      if (item) {
        RawFans.closeModal('content-modal');
        openDeleteContentModal(item.id);
      }
    };
  }

  RawFans.openModal('content-modal');
}

function editContent(id) {
  const item = contentCache.find((c) => c.id === id);
  if (item) openContentModal(item);
}

function openDeleteContentModal(id) {
  const item = contentCache.find((c) => c.id === id);
  if (!item) return;

  contentToDeleteId = id;

  const titleEl = document.getElementById('content-delete-title');
  if (titleEl) titleEl.textContent = item.title;

  RawFans.openModal('content-delete-modal');
}

function confirmDeleteContent() {
  if (!contentToDeleteId) return;

  const items = contentCache.filter((c) => c.id !== contentToDeleteId);
  RawFans.saveContent(items);
  refreshContentCache();

  RawFans.closeModal('content-delete-modal');
  RawFans.closeModal('content-modal');
  resetDeleteContentState();
  resetContentForm();
  scheduleRenderContentGrid();
}

function resetDeleteContentState() {
  contentToDeleteId = null;
}

function resetContentForm() {
  editingContentId = null;
  document.getElementById('content-form')?.reset();
}

function handleContentSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const items = [...contentCache];

  const contentData = {
    title: form.title.value.trim(),
    category: form.category.value,
    description: form.description.value.trim(),
    prompt: form.prompt.value.trim(),
    fileUrl: form.fileUrl.value.trim(),
  };

  if (editingContentId) {
    const index = items.findIndex((c) => c.id === editingContentId);
    if (index !== -1) {
      items[index] = { ...items[index], ...contentData };
    }
  } else {
    items.unshift({
      id: RawFans.generateId(),
      ...contentData,
      createdAt: new Date().toISOString(),
    });
  }

  RawFans.saveContent(items);
  refreshContentCache();
  RawFans.closeModal('content-modal');
  resetContentForm();
  scheduleRenderContentGrid();
}

/* ── Page: Finanzen ──────────────────────────────────────── */

let financeFilter = {
  search: '',
  month: RawFans.getCurrentMonthKey(),
  type: 'all',
  category: 'all',
  recurring: 'all',
};
let editingFinanceId = null;
let financeToDeleteId = null;
let financeCache = [];
let financeSaving = false;
let financeRealtimeRefreshScheduled = false;
let financeRenderScheduled = false;

async function initFinanzen() {
  RawFans.initShell('finanzen');
  RawFans.initModal('finance-modal', { onClose: resetFinanceForm });
  RawFans.initModal('finance-delete-modal', { onClose: resetDeleteFinanceState });

  document.getElementById('add-finance-btn')?.addEventListener('click', () => openFinanceModal());
  document.getElementById('finance-form')?.addEventListener('submit', (e) => {
    handleFinanceSubmit(e).catch(handleFinanceError);
  });
  document.getElementById('finance-delete-confirm')?.addEventListener('click', () => {
    confirmDeleteFinance().catch(handleFinanceError);
  });
  document.getElementById('export-csv-btn')?.addEventListener('click', exportFinanceCSV);

  document.getElementById('finance-migration-import')?.addEventListener('click', () => {
    runFinanceMigration().catch(handleFinanceError);
  });

  document.getElementById('finance-migration-dismiss')?.addEventListener('click', () => {
    document.getElementById('finance-migration-banner')?.classList.add('hidden');
  });

  window.addEventListener('beforeunload', () => RawFansFinanceDB?.unsubscribeFromFinance());

  document.getElementById('finance-recurring')?.addEventListener('change', toggleRecurringInterval);

  const debouncedSearch = RawFans.debounce((value) => {
    financeFilter.search = value.toLowerCase();
    scheduleRenderFinance();
  }, 180);

  document.getElementById('finance-search')?.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });

  document.getElementById('finance-month-filter')?.addEventListener('change', (e) => {
    financeFilter.month = e.target.value;
    scheduleRenderFinance();
  });

  document.getElementById('finance-type-filter')?.addEventListener('change', (e) => {
    financeFilter.type = e.target.value;
    scheduleRenderFinance();
  });

  document.getElementById('finance-category-filter')?.addEventListener('change', (e) => {
    financeFilter.category = e.target.value;
    scheduleRenderFinance();
  });

  document.getElementById('finance-recurring-filter')?.addEventListener('change', (e) => {
    financeFilter.recurring = e.target.value;
    scheduleRenderFinance();
  });

  document.getElementById('finance-table-body')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-finance-edit]');
    const deleteBtn = e.target.closest('[data-finance-delete]');
    if (editBtn) editFinance(editBtn.dataset.financeEdit);
    if (deleteBtn) openDeleteFinanceModal(deleteBtn.dataset.financeDelete);
  });

  RawFans.initFilterToggle('finance-filter-toggle', 'finance-filters-panel');

  showFinanceError(null);

  try {
    if (!window.RawFansFinanceDB) {
      throw new Error('Supabase Finanzen nicht geladen. Bitte finanzen-app.js prüfen.');
    }
    await loadFinanceFromSupabase();

    RawFansFinanceDB.subscribeToFinance(() => {
      if (financeRealtimeRefreshScheduled) return;
      financeRealtimeRefreshScheduled = true;
      requestAnimationFrame(async () => {
        financeRealtimeRefreshScheduled = false;
        try {
          await loadFinanceFromSupabase({ silent: true });
        } catch (err) {
          console.warn('[Finanzen] Realtime-Refresh fehlgeschlagen:', err);
        }
      });
    });

    updateFinanceMigrationBanner();
  } catch (err) {
    handleFinanceError(err);
    refreshFinanceLocalCache();
    renderFinance();
  }
}

function handleFinanceError(err) {
  const message = err?.message || 'Finanzdaten konnten nicht geladen werden.';
  showFinanceError(message);
  RawFans.showToast(message);
}

function showFinanceError(message) {
  const el = document.getElementById('finance-error-banner');
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function refreshFinanceLocalCache() {
  financeCache = RawFans.getFinance();
  populateMonthFilter();
}

async function loadFinanceFromSupabase({ silent = false } = {}) {
  financeCache = await fetchSharedFinance();
  populateMonthFilter();
  if (!silent) updateFinanceMigrationBanner();
  scheduleRenderFinance();
}

function updateFinanceMigrationBanner() {
  const banner = document.getElementById('finance-migration-banner');
  const countEl = document.getElementById('finance-migration-count');
  if (!banner || !window.RawFansFinanceDB) return;

  const localCount = RawFansFinanceDB.getLocalStorageFinanceCount();
  if (localCount === 0) {
    banner.classList.add('hidden');
    return;
  }

  if (countEl) countEl.textContent = String(localCount);
  banner.classList.remove('hidden');
}

async function runFinanceMigration() {
  const btn = document.getElementById('finance-migration-import');
  btn?.setAttribute('disabled', 'true');
  if (btn) btn.textContent = 'Importiere…';

  try {
    const result = await RawFansFinanceDB.importFinanceFromLocalStorage();
    await loadFinanceFromSupabase();

    if (result.imported > 0) {
      RawFans.showToast(
        `${result.imported} Finanz-Eintrag${result.imported === 1 ? '' : 'e'} importiert`
      );
    } else if (result.alreadyMigrated) {
      RawFans.showToast('Finanzdaten wurden bereits importiert');
    } else {
      RawFans.showToast('Keine lokalen Finanzdaten zum Importieren');
    }

    if (result.skipped > 0) {
      RawFans.showToast(`${result.skipped} Einträge übersprungen (Duplikate/Fehler)`);
    }

    document.getElementById('finance-migration-banner')?.classList.add('hidden');
  } finally {
    btn?.removeAttribute('disabled');
    if (btn) btn.textContent = 'Alte Finanzdaten aus localStorage in Supabase importieren';
  }
}

function setFinanceSaving(isSaving) {
  financeSaving = isSaving;
  const submitBtn = document.querySelector('#finance-form button[type="submit"]');
  const deleteBtn = document.getElementById('finance-delete-confirm');
  submitBtn?.toggleAttribute('disabled', isSaving);
  deleteBtn?.toggleAttribute('disabled', isSaving);
  document.getElementById('add-finance-btn')?.toggleAttribute('disabled', isSaving);
  if (submitBtn) submitBtn.textContent = isSaving ? 'Speichern…' : 'Speichern';
}

function populateMonthFilter() {
  const select = document.getElementById('finance-month-filter');
  if (!select) return;

  const months = new Set(financeCache.map((e) => RawFans.getMonthKey(e.date)));
  months.add(RawFans.getCurrentMonthKey());
  months.add(financeFilter.month);

  const sorted = [...months].sort().reverse();

  select.innerHTML = sorted
    .map(
      (key) =>
        `<option value="${key}" ${key === financeFilter.month ? 'selected' : ''}>${RawFans.formatMonthLabel(key)}</option>`
    )
    .join('');
}

function scheduleRenderFinance() {
  if (financeRenderScheduled) return;
  financeRenderScheduled = true;
  requestAnimationFrame(() => {
    financeRenderScheduled = false;
    renderFinance();
  });
}

function calcFinanceStats(entries, monthKey) {
  const inMonth = monthKey
    ? entries.filter((e) => RawFans.getMonthKey(e.date) === monthKey)
    : entries;

  const sumByType = (list, type) =>
    list.filter((e) => e.type === type).reduce((sum, e) => sum + (e.amount || 0), 0);

  const monthIncome = sumByType(inMonth, 'income');
  const monthExpense = sumByType(inMonth, 'expense');
  const monthProfit = monthIncome - monthExpense;

  const recurring = entries.filter((e) => e.recurring && e.recurringInterval === 'monthly');
  const recurringIncome = sumByType(recurring, 'income');
  const recurringExpense = sumByType(recurring, 'expense');
  const recurringProfit = recurringIncome - recurringExpense;

  const allIncome = sumByType(entries, 'income');
  const allExpense = sumByType(entries, 'expense');

  const oneTimeMonth = inMonth.filter((e) => !e.recurring);
  const recurringMonth = inMonth.filter((e) => e.recurring);

  return {
    monthIncome,
    monthExpense,
    monthProfit,
    recurringProfit,
    recurringIncome,
    recurringExpense,
    allIncome,
    allExpense,
    allProfit: allIncome - allExpense,
    oneTimeMonthIncome: sumByType(oneTimeMonth, 'income'),
    oneTimeMonthExpense: sumByType(oneTimeMonth, 'expense'),
    recurringMonthIncome: sumByType(recurringMonth, 'income'),
    recurringMonthExpense: sumByType(recurringMonth, 'expense'),
  };
}

function getFilteredFinance() {
  const search = financeFilter.search;

  return financeCache
    .filter((entry) => {
      if (financeFilter.month !== 'all' && RawFans.getMonthKey(entry.date) !== financeFilter.month) {
        return false;
      }
      if (financeFilter.type !== 'all' && entry.type !== financeFilter.type) return false;
      if (financeFilter.category !== 'all' && entry.category !== financeFilter.category) return false;
      if (financeFilter.recurring === 'yes' && !entry.recurring) return false;
      if (financeFilter.recurring === 'no' && entry.recurring) return false;

      if (search) {
        const haystack = [entry.description, entry.category, entry.type]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderFinanceStats() {
  const currentMonthKey = RawFans.getCurrentMonthKey();
  const monthStats = calcFinanceStats(financeCache, currentMonthKey);
  const allStats = calcFinanceStats(financeCache, null);

  const heroTitle = document.getElementById('finance-hero-title');
  if (heroTitle) {
    heroTitle.textContent = `Finanzübersicht – ${RawFans.formatMonthLabel(currentMonthKey)}`;
  }

  document.getElementById('stat-month-income').textContent = RawFans.formatCurrency(monthStats.monthIncome);
  document.getElementById('stat-month-expense').textContent = RawFans.formatCurrency(monthStats.monthExpense);

  const profitEl = document.getElementById('stat-month-profit');
  const profitPositive = monthStats.monthProfit >= 0;
  profitEl.textContent = RawFans.formatCurrency(monthStats.monthProfit);
  profitEl.className = `finance-stat-value ${profitPositive ? 'profit-positive' : 'profit-negative'}`;

  const profitCard = document.getElementById('finance-profit-card');
  if (profitCard) {
    profitCard.classList.toggle('is-positive', profitPositive);
    profitCard.classList.toggle('is-negative', !profitPositive);
  }

  const recurringEl = document.getElementById('stat-recurring-profit');
  if (recurringEl) {
    recurringEl.textContent = RawFans.formatCurrency(allStats.recurringProfit);
    recurringEl.classList.toggle('profit-positive', allStats.recurringProfit >= 0);
    recurringEl.classList.toggle('profit-negative', allStats.recurringProfit < 0);
  }

  document.getElementById('stat-all-income').textContent = RawFans.formatCurrency(allStats.allIncome);
  document.getElementById('stat-all-expense').textContent = RawFans.formatCurrency(allStats.allExpense);

  const allProfitEl = document.getElementById('stat-all-profit');
  allProfitEl.textContent = RawFans.formatCurrency(allStats.allProfit);
  allProfitEl.className = `finance-all-value ${allStats.allProfit >= 0 ? 'profit-positive' : 'profit-negative'}`;
}

function buildFinanceRow(entry) {
  const typeClass = entry.type === 'income' ? 'finance-income' : 'finance-expense';
  const amountPrefix = entry.type === 'income' ? '+' : '−';
  const recurringLabel = entry.recurring
    ? `<span class="finance-recurring-badge">↻ Monatlich</span>`
    : '<span class="finance-once-badge">Einmalig</span>';

  return `<tr data-id="${entry.id}" class="finance-row finance-row-${entry.type}">
    <td class="cell-date" data-label="Datum">${RawFans.formatDate(entry.date)}</td>
    <td data-label="Typ"><span class="finance-type-pill ${typeClass}">${RawFans.financeTypeLabel(entry.type)}</span></td>
    <td class="cell-category" data-label="Kategorie">${RawFans.escapeHtml(entry.category)}</td>
    <td class="cell-primary cell-description" data-label="Beschreibung">${RawFans.escapeHtml(entry.description)}</td>
    <td class="finance-amount ${typeClass}" data-label="Betrag">${amountPrefix}${RawFans.formatCurrency(entry.amount)}</td>
    <td data-label="Wiederkehrend">${recurringLabel}</td>
    <td data-label="Status">${RawFans.financeStatusBadge(entry)}</td>
    <td>
      <div class="table-actions">
        <button class="btn btn-ghost btn-sm btn-icon" data-finance-edit="${entry.id}" title="Bearbeiten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" data-finance-delete="${entry.id}" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function renderFinanceTable() {
  const tbody = document.getElementById('finance-table-body');
  const countEl = document.getElementById('finance-count');
  const entries = getFilteredFinance();

  if (countEl) {
    countEl.innerHTML = `<strong>${entries.length}</strong> Einträge`;
  }

  if (entries.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="finance-filter-empty">
          <h4>Keine Einträge gefunden</h4>
          <p>Passe deine Filter an oder lege einen neuen Buchungssatz an.</p>
          <button class="btn btn-primary" id="empty-add-finance">Neuer Eintrag</button>
        </div>
      </td></tr>`;
    document.getElementById('empty-add-finance')?.addEventListener('click', () => openFinanceModal());
    return;
  }

  const rows = new Array(entries.length);
  for (let i = 0; i < entries.length; i++) {
    rows[i] = buildFinanceRow(entries[i]);
  }
  tbody.innerHTML = rows.join('');
}

function renderFinance() {
  renderFinanceStats();
  renderFinanceTable();
}

function toggleRecurringInterval() {
  const recurring = document.getElementById('finance-recurring');
  const intervalGroup = document.getElementById('finance-interval-group');
  if (intervalGroup) {
    intervalGroup.style.display = recurring?.checked ? 'block' : 'none';
  }
}

function updateFinanceStatusOptions(type) {
  const statusSelect = document.getElementById('finance-status');
  if (!statusSelect) return;

  if (type === 'income') {
    statusSelect.innerHTML = `
      <option value="received">Erhalten</option>
      <option value="pending">Ausstehend</option>`;
  } else {
    statusSelect.innerHTML = `
      <option value="paid">Bezahlt</option>
      <option value="pending">Ausstehend</option>`;
  }
}

function openFinanceModal(entry = null) {
  editingFinanceId = entry?.id || null;
  const form = document.getElementById('finance-form');
  const title = document.getElementById('finance-modal-title');
  const typeSelect = document.getElementById('finance-type');

  title.textContent = entry ? 'Eintrag bearbeiten' : 'Neuer Eintrag';

  const today = new Date().toISOString().split('T')[0];
  form.date.value = entry?.date
    ? new Date(entry.date).toISOString().split('T')[0]
    : today;
  form.type.value = entry?.type || 'income';
  updateFinanceStatusOptions(form.type.value);

  form.category.value = entry?.category || RawFans.FINANCE_CATEGORIES[0];
  form.description.value = entry?.description || '';
  form.amount.value = entry?.amount || '';
  form.recurring.checked = entry?.recurring || false;
  form.recurringInterval.value = entry?.recurringInterval || 'monthly';
  form.status.value = entry?.status || (form.type.value === 'income' ? 'received' : 'paid');

  toggleRecurringInterval();

  typeSelect.onchange = (e) => {
    updateFinanceStatusOptions(e.target.value);
    form.status.value = e.target.value === 'income' ? 'received' : 'paid';
  };

  RawFans.openModal('finance-modal');
}

function editFinance(id) {
  const entry = financeCache.find((e) => e.id === id);
  if (entry) openFinanceModal(entry);
}

function openDeleteFinanceModal(id) {
  const entry = financeCache.find((e) => e.id === id);
  if (!entry) return;

  financeToDeleteId = id;
  const descEl = document.getElementById('finance-delete-desc');
  if (descEl) descEl.textContent = entry.description;

  RawFans.openModal('finance-delete-modal');
}

async function confirmDeleteFinance() {
  if (!financeToDeleteId) return;

  setFinanceSaving(true);
  try {
    await RawFansFinanceDB.deleteFinance(financeToDeleteId);
    await loadFinanceFromSupabase({ silent: true });
    RawFans.closeModal('finance-delete-modal');
    RawFans.closeModal('finance-modal');
    resetDeleteFinanceState();
    resetFinanceForm();
    RawFans.showToast('Eintrag gelöscht');
  } finally {
    setFinanceSaving(false);
  }
}

function resetDeleteFinanceState() {
  financeToDeleteId = null;
}

function resetFinanceForm() {
  editingFinanceId = null;
  document.getElementById('finance-form')?.reset();
  toggleRecurringInterval();
}

async function handleFinanceSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const entryData = {
    date: new Date(form.date.value).toISOString(),
    type: form.type.value,
    category: form.category.value,
    description: form.description.value.trim(),
    amount: parseFloat(form.amount.value) || 0,
    recurring: form.recurring.checked,
    recurringInterval: form.recurring.checked ? form.recurringInterval.value : null,
    status: form.status.value,
  };

  setFinanceSaving(true);
  try {
    if (editingFinanceId) {
      await RawFansFinanceDB.updateFinance(editingFinanceId, entryData);
    } else {
      await RawFansFinanceDB.addFinance(entryData);
    }
    await loadFinanceFromSupabase({ silent: true });
    RawFans.closeModal('finance-modal');
    resetFinanceForm();
    RawFans.showToast('Eintrag gespeichert');
  } finally {
    setFinanceSaving(false);
  }
}

function exportFinanceCSV() {
  const headers = ['Datum', 'Typ', 'Kategorie', 'Beschreibung', 'Betrag', 'Wiederkehrend', 'Intervall', 'Status'];
  const rows = financeCache.map((e) => [
    RawFans.formatDate(e.date),
    RawFans.financeTypeLabel(e.type),
    e.category,
    e.description,
    e.amount.toFixed(2).replace('.', ','),
    e.recurring ? 'Ja' : 'Nein',
    e.recurringInterval || '',
    e.status === 'received' ? 'Erhalten' : e.status === 'paid' ? 'Bezahlt' : 'Ausstehend',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rawfans-finanzen-${RawFans.getCurrentMonthKey()}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  RawFans.showToast('CSV exportiert');
}

/* ── Page: Outreach ──────────────────────────────────────── */

let outreachActiveTab = 'log';
let templateFilter = { search: '', category: 'icebreaker' };
let logFilter = {
  search: '',
  status: 'all',
  category: 'all',
  period: 'all',
  followUp: 'all',
  callPipeline: 'all',
};
let editingTemplateId = null;
let editingLogId = null;
let templateToDeleteId = null;
let logToDeleteId = null;
let historyLeadId = null;
let templatesCache = [];
let outreachLogCache = [];
let leadsCacheOutreach = [];
let outreachLogSaving = false;
let outreachLogRealtimeRefreshScheduled = false;
let outreachRenderScheduled = false;
let templatePersonalizeName = '';
let templatePersonalizeScheduled = false;

const TEMPLATE_NAME_PLACEHOLDER_RE = /\[Name\]|\(name\)|\{\{name\}\}/gi;

const REPLY_STATUSES = ['replied', 'positive_reply', 'call_planned', 'call_done'];
const TERMINAL_STATUSES = ['negative', 'call_done'];

async function initOutreach() {
  RawFans.seedData();
  RawFans.initShell('outreach');
  RawFans.initModal('template-modal', { onClose: resetTemplateForm });
  RawFans.initModal('log-modal', { onClose: resetLogForm });
  RawFans.initModal('template-delete-modal', { onClose: () => { templateToDeleteId = null; } });
  RawFans.initModal('log-delete-modal', { onClose: () => { logToDeleteId = null; } });
  RawFans.initModal('lead-history-modal', { onClose: () => { historyLeadId = null; } });

  document.getElementById('template-delete-confirm')?.addEventListener('click', confirmDeleteTemplate);
  document.getElementById('log-delete-confirm')?.addEventListener('click', () => {
    confirmDeleteLog().catch(handleOutreachError);
  });

  window.addEventListener('beforeunload', () => {
    RawFansLeadsDB?.unsubscribeFromLeads();
    RawFansOutreachLogDB?.unsubscribeFromOutreachLog();
  });

  document.getElementById('outreach-log-migration-import')?.addEventListener('click', () => {
    runOutreachLogMigration().catch(handleOutreachError);
  });

  document.getElementById('outreach-log-migration-dismiss')?.addEventListener('click', () => {
    document.getElementById('outreach-log-migration-banner')?.classList.add('hidden');
  });

  showOutreachError(null);

  try {
    if (!window.RawFansOutreachLogDB) {
      throw new Error('Supabase Outreach Log nicht geladen. Bitte outreach-app.js prüfen.');
    }
    await refreshOutreachCaches();

    RawFansLeadsDB.subscribeToLeads(() => {
      if (outreachLeadsRefreshScheduled) return;
      outreachLeadsRefreshScheduled = true;
      requestAnimationFrame(async () => {
        outreachLeadsRefreshScheduled = false;
        try {
          leadsCacheOutreach = await fetchSharedLeads();
          populateLogLeadSelect();
          scheduleRenderOutreach();
        } catch (err) {
          console.warn('[Outreach] Leads Realtime-Refresh fehlgeschlagen:', err);
        }
      });
    });

    RawFansOutreachLogDB.subscribeToOutreachLog(() => {
      if (outreachLogRealtimeRefreshScheduled) return;
      outreachLogRealtimeRefreshScheduled = true;
      requestAnimationFrame(async () => {
        outreachLogRealtimeRefreshScheduled = false;
        try {
          await loadOutreachLogFromSupabase({ silent: true });
        } catch (err) {
          console.warn('[Outreach] Log Realtime-Refresh fehlgeschlagen:', err);
        }
      });
    });

    updateOutreachLogMigrationBanner();
  } catch (err) {
    handleOutreachError(err);
    refreshOutreachLocalCaches();
  }

  switchOutreachTab('log');

  document.getElementById('add-template-btn')?.addEventListener('click', () => openTemplateModal());
  document.getElementById('add-log-btn')?.addEventListener('click', () => {
    openLogModal().catch(handleOutreachError);
  });
  document.getElementById('template-form')?.addEventListener('submit', handleTemplateSubmit);
  document.getElementById('log-form')?.addEventListener('submit', (e) => {
    handleLogSubmit(e).catch(handleOutreachError);
  });

  document.getElementById('log-call-planned')?.addEventListener('change', (e) => {
    e.target.dataset.userSet = 'true';
    toggleCallFields();
  });
  document.getElementById('log-template')?.addEventListener('change', onLogTemplateChange);
  document.getElementById('log-message-type')?.addEventListener('change', onLogMessageTypeChange);

  document.getElementById('outreach-tabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.content-tab[data-tab]');
    if (!tab) return;
    switchOutreachTab(tab.dataset.tab);
  });

  const debouncedTemplateSearch = RawFans.debounce((v) => {
    templateFilter.search = v.toLowerCase();
    scheduleRenderOutreach();
  }, 180);

  document.getElementById('template-search')?.addEventListener('input', (e) => {
    debouncedTemplateSearch(e.target.value);
  });

  document.getElementById('template-category-chips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.template-cat-chip[data-category]');
    if (!chip) return;
    switchTemplateCategory(chip.dataset.category);
  });

  document.getElementById('template-personalize-name')?.addEventListener('input', (e) => {
    templatePersonalizeName = e.target.value;
    scheduleTemplatePersonalize();
  });

  const debouncedLogSearch = RawFans.debounce((v) => {
    logFilter.search = v.toLowerCase();
    scheduleRenderOutreach();
  }, 180);

  document.getElementById('log-search')?.addEventListener('input', (e) => {
    debouncedLogSearch(e.target.value);
  });

  const logFilterMap = {
    'log-status-filter': 'status',
    'log-category-filter': 'category',
    'log-period-filter': 'period',
    'log-followup-filter': 'followUp',
    'log-call-filter': 'callPipeline',
  };

  Object.entries(logFilterMap).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      logFilter[key] = e.target.value;
      scheduleRenderOutreach();
    });
  });

  RawFans.initFilterToggle('log-filter-toggle', 'log-filters-panel');

  document.getElementById('templates-grid')?.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('[data-template-copy]');
    const editBtn = e.target.closest('[data-template-edit]');
    const deleteBtn = e.target.closest('[data-template-delete]');
    if (copyBtn) {
      e.stopPropagation();
      const t = templatesCache.find((x) => x.id === copyBtn.dataset.templateCopy);
      if (t?.text) RawFans.copyToClipboard(personalizeTemplateText(t.text, templatePersonalizeName));
    }
    if (editBtn) {
      e.stopPropagation();
      editTemplate(editBtn.dataset.templateEdit);
    }
    if (deleteBtn) {
      e.stopPropagation();
      openDeleteTemplateModal(deleteBtn.dataset.templateDelete);
    }
  });

  document.getElementById('outreach-log-body')?.addEventListener('click', (e) => {
    const historyBtn = e.target.closest('[data-lead-history]');
    const followupBtn = e.target.closest('[data-log-followup]');
    const editBtn = e.target.closest('[data-log-edit]');
    const deleteBtn = e.target.closest('[data-log-delete]');
    if (historyBtn) {
      e.preventDefault();
      openLeadHistory(historyBtn.dataset.leadHistory);
    }
    if (followupBtn) openQuickFollowUp(followupBtn.dataset.logFollowup);
    if (editBtn) editLog(editBtn.dataset.logEdit);
    if (deleteBtn) openDeleteLogModal(deleteBtn.dataset.logDelete);
  });

  renderOutreach();
}

function handleOutreachError(err) {
  const message = err?.message || 'Outreach-Daten konnten nicht geladen werden.';
  showOutreachError(message);
  RawFans.showToast(message);
}

function showOutreachError(message) {
  const el = document.getElementById('outreach-leads-error-banner');
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function refreshOutreachLocalCaches() {
  templatesCache = RawFans.getOutreachTemplates();
  outreachLogCache = RawFans.getOutreachLog();
}

async function loadOutreachLogFromSupabase({ silent = false } = {}) {
  outreachLogCache = await fetchSharedOutreachLog();
  if (!silent) updateOutreachLogMigrationBanner();
  scheduleRenderOutreach();
}

function updateOutreachLogMigrationBanner() {
  const banner = document.getElementById('outreach-log-migration-banner');
  const countEl = document.getElementById('outreach-log-migration-count');
  if (!banner || !window.RawFansOutreachLogDB) return;

  const localCount = RawFansOutreachLogDB.getLocalStorageOutreachLogCount();
  if (localCount === 0) {
    banner.classList.add('hidden');
    return;
  }

  if (countEl) countEl.textContent = String(localCount);
  banner.classList.remove('hidden');
}

async function runOutreachLogMigration() {
  const btn = document.getElementById('outreach-log-migration-import');
  btn?.setAttribute('disabled', 'true');
  if (btn) btn.textContent = 'Importiere…';

  try {
    const result = await RawFansOutreachLogDB.importOutreachLogFromLocalStorage();
    await loadOutreachLogFromSupabase();

    if (result.imported > 0) {
      RawFans.showToast(
        `${result.imported} Outreach-Eintrag${result.imported === 1 ? '' : 'e'} importiert`
      );
    } else if (result.alreadyMigrated) {
      RawFans.showToast('Outreach Log wurde bereits importiert');
    } else {
      RawFans.showToast('Keine lokalen Outreach-Log-Daten zum Importieren');
    }

    if (result.skipped > 0) {
      RawFans.showToast(`${result.skipped} Einträge übersprungen (Duplikate/Fehler)`);
    }

    document.getElementById('outreach-log-migration-banner')?.classList.add('hidden');
  } finally {
    btn?.removeAttribute('disabled');
    if (btn) btn.textContent = 'Altes Outreach Log aus localStorage in Supabase importieren';
  }
}

function setOutreachLogSaving(isSaving) {
  outreachLogSaving = isSaving;
  const submitBtn = document.querySelector('#log-form button[type="submit"]');
  const deleteBtn = document.getElementById('log-delete-confirm');
  submitBtn?.toggleAttribute('disabled', isSaving);
  deleteBtn?.toggleAttribute('disabled', isSaving);
  if (submitBtn) submitBtn.textContent = isSaving ? 'Speichern…' : 'Speichern';
}

async function refreshOutreachCaches() {
  templatesCache = RawFans.getOutreachTemplates();
  outreachLogCache = await fetchSharedOutreachLog();
  leadsCacheOutreach = await fetchSharedLeads();
  showOutreachError(null);
  populateLogLeadSelect();
  populateLogTemplateSelect();
  updateOutreachLogMigrationBanner();
}

function switchOutreachTab(tab) {
  outreachActiveTab = tab;
  document.querySelectorAll('#outreach-tabs .content-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('panel-templates')?.classList.toggle('hidden', tab !== 'templates');
  document.getElementById('panel-log')?.classList.toggle('hidden', tab !== 'log');
  document.getElementById('add-template-btn')?.classList.toggle('hidden', tab !== 'templates');
  document.getElementById('add-log-btn')?.classList.toggle('hidden', tab !== 'log');
  document.getElementById('template-name-field')?.classList.toggle('hidden', tab !== 'templates');
}

function switchTemplateCategory(category) {
  if (!category || templateFilter.category === category) return;
  templateFilter.category = category;
  updateTemplateCategoryChips();
  scheduleRenderOutreach();
}

function updateTemplateCategoryChips() {
  document.querySelectorAll('#template-category-chips .template-cat-chip').forEach((chip) => {
    const count = templatesCache.filter((t) => t.category === chip.dataset.category).length;
    const label = RawFans.templateCategoryLabel(chip.dataset.category);
    const shortLabel = chip.dataset.category === 'interest' ? 'Interesse' : label;
    chip.innerHTML = `${RawFans.escapeHtml(shortLabel)}<span class="template-cat-count">${count}</span>`;
    chip.classList.toggle('active', chip.dataset.category === templateFilter.category);
  });
}

function scheduleRenderOutreach() {
  if (outreachRenderScheduled) return;
  outreachRenderScheduled = true;
  requestAnimationFrame(() => {
    outreachRenderScheduled = false;
    renderOutreach();
  });
}

function getLeadById(id) {
  return leadsCacheOutreach.find((l) => l.id === id);
}

function getTemplateById(id) {
  return templatesCache.find((t) => t.id === id);
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isFollowUpOverdue(entry) {
  if (!entry.followUpDate || entry.nextAction === 'no_follow') return false;
  if (TERMINAL_STATUSES.includes(entry.status)) return false;
  return startOfDay(entry.followUpDate) < startOfDay();
}

function isOpenFollowUp(entry) {
  if (entry.nextAction === 'no_follow' || TERMINAL_STATUSES.includes(entry.status)) return false;
  if (!entry.followUpDate) return false;
  return startOfDay(entry.followUpDate) >= startOfDay();
}

function isInCallPipeline(entry) {
  return entry.callPlanned
    || entry.status === 'call_planned'
    || RawFans.isCallMessageType(entry.messageType);
}

function getLeadThread(leadId) {
  return outreachLogCache
    .filter((e) => e.leadId === leadId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function suggestNextMessageType(lastType) {
  const flow = {
    icebreaker: 'followup1',
    followup1: 'followup2',
    followup2: 'call_invite',
    interest: 'call_invite',
    call_invite: 'call_followup',
    call_followup: 'call_followup',
    reengagement: 'followup1',
  };
  return flow[lastType] || 'followup1';
}

function calcOutreachStats() {
  const monthKey = RawFans.getCurrentMonthKey();
  const thisMonth = outreachLogCache.filter((e) => RawFans.getMonthKey(e.date) === monthKey);
  const sentCount = thisMonth.length;
  const repliedCount = thisMonth.filter((e) => REPLY_STATUSES.includes(e.status)).length;
  const replyRate = sentCount > 0 ? Math.round((repliedCount / sentCount) * 100) : 0;
  const openFollowUps = outreachLogCache.filter(isOpenFollowUp).length;
  const plannedCalls = outreachLogCache.filter(
    (e) => e.callPlanned && e.status !== 'call_done'
  ).length;

  const repliedAll = outreachLogCache.filter((e) => REPLY_STATUSES.includes(e.status)).length;
  const callReached = outreachLogCache.filter(
    (e) => ['call_planned', 'call_done'].includes(e.status)
  ).length;
  const callConversion = repliedAll > 0 ? Math.round((callReached / repliedAll) * 100) : 0;

  return { sentCount, replyRate, openFollowUps, plannedCalls, callConversion };
}

function renderOutreachStats() {
  const stats = calcOutreachStats();
  document.getElementById('stat-dms-month').textContent = stats.sentCount;
  document.getElementById('stat-reply-rate').textContent = `${stats.replyRate}%`;
  document.getElementById('stat-open-followups').textContent = stats.openFollowUps;
  document.getElementById('stat-planned-calls').textContent = stats.plannedCalls;
  document.getElementById('stat-call-conversion').textContent = `${stats.callConversion}%`;
}

function getFilteredTemplates() {
  return templatesCache
    .filter((t) => {
      if (t.category !== templateFilter.category) return false;
      if (templateFilter.search) {
        const hay = [t.title, t.text].join(' ').toLowerCase();
        if (!hay.includes(templateFilter.search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function isInPeriod(dateStr, period) {
  if (period === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  const days = { week: 7, month: 30, quarter: 90 }[period];
  if (!days) return true;
  return now - date <= days * 86400000;
}

function getFilteredLog() {
  return outreachLogCache
    .filter((entry) => {
      if (logFilter.status !== 'all' && entry.status !== logFilter.status) return false;
      if (logFilter.followUp === 'open' && !isOpenFollowUp(entry)) return false;
      if (logFilter.followUp === 'overdue' && !isFollowUpOverdue(entry)) return false;
      if (logFilter.followUp === 'none' && (isOpenFollowUp(entry) || isFollowUpOverdue(entry))) return false;
      if (logFilter.callPipeline === 'yes' && !isInCallPipeline(entry)) return false;
      if (!isInPeriod(entry.date, logFilter.period)) return false;

      if (logFilter.category !== 'all' && entry.messageType !== logFilter.category) return false;

      if (logFilter.search) {
        const lead = getLeadById(entry.leadId);
        const hay = [
          lead?.username,
          entry.notes,
          getTemplateById(entry.templateId)?.title,
          RawFans.templateCategoryLabel(entry.messageType),
          RawFans.OUTREACH_NEXT_ACTIONS[entry.nextAction],
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(logFilter.search)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function personalizeTemplateText(text, name) {
  if (!text) return '';
  const trimmed = (name || '').trim();
  if (!trimmed) return text;
  return text.replace(TEMPLATE_NAME_PLACEHOLDER_RE, trimmed);
}

function scheduleTemplatePersonalize() {
  if (templatePersonalizeScheduled) return;
  templatePersonalizeScheduled = true;
  requestAnimationFrame(() => {
    templatePersonalizeScheduled = false;
    updateTemplatePreviews();
  });
}

function updateTemplatePreviews() {
  const grid = document.getElementById('templates-grid');
  if (!grid) return;

  const previewEls = grid.querySelectorAll('.outreach-template-preview[data-template-id]');
  if (previewEls.length === 0) return;

  previewEls.forEach((el) => {
    const tpl = templatesCache.find((t) => t.id === el.dataset.templateId);
    if (!tpl) return;
    const displayText = personalizeTemplateText(tpl.text, templatePersonalizeName);
    el.textContent = RawFans.truncate(displayText, 160);
    el.classList.toggle('is-personalized', !!templatePersonalizeName.trim());
  });
}

function buildTemplateCard(tpl) {
  const displayText = personalizeTemplateText(tpl.text, templatePersonalizeName);
  const preview = RawFans.truncate(displayText, 160);
  const isPersonalized = !!templatePersonalizeName.trim();
  return `<article class="outreach-template-card" data-template-id="${tpl.id}">
    <div class="outreach-template-body">
      <h4 class="outreach-template-title">${RawFans.escapeHtml(tpl.title)}</h4>
      <p class="outreach-template-preview${isPersonalized ? ' is-personalized' : ''}" data-template-id="${tpl.id}">${RawFans.escapeHtml(preview)}</p>
      <div class="content-card-actions">
        <button class="btn btn-primary btn-sm" data-template-copy="${tpl.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Kopieren
        </button>
        <button class="btn btn-ghost btn-icon-only" data-template-edit="${tpl.id}" title="Bearbeiten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-ghost btn-icon-only" data-template-delete="${tpl.id}" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  </article>`;
}

function buildLogRow(entry) {
  const lead = getLeadById(entry.leadId);
  const tpl = getTemplateById(entry.templateId);
  const username = lead?.username || '—';
  const rowClasses = [];
  if (isFollowUpOverdue(entry)) rowClasses.push('row-overdue');
  if (isInCallPipeline(entry)) rowClasses.push('row-call');

  const profileLink = lead?.profileLink
    ? `<a href="${RawFans.escapeHtml(lead.profileLink)}" class="profile-link profile-link-sm" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="Profil öffnen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>`
    : '';

  const leadCell = lead
    ? `<button type="button" class="lead-history-link" data-lead-history="${lead.id}" title="Thread-Historie anzeigen">
        <span class="lead-history-name">${RawFans.escapeHtml(username)}</span>
        ${profileLink}
      </button>`
    : `<span style="color: var(--text-muted)">${RawFans.escapeHtml(username)}</span>`;

  const typeBadge = `<span class="outreach-cat-badge cat-${entry.messageType}">${RawFans.escapeHtml(RawFans.templateCategoryLabel(entry.messageType))}</span>`;

  const followUpCell = entry.followUpDate
    ? `<span class="${isFollowUpOverdue(entry) ? 'followup-overdue' : 'outreach-followup-yes'}">${RawFans.formatDate(entry.followUpDate)}${isFollowUpOverdue(entry) ? ' · Überfällig' : ''}</span>`
    : '<span class="finance-once-badge">—</span>';

  const nextActionLabel = RawFans.OUTREACH_NEXT_ACTIONS[entry.nextAction]
    || (entry.nextAction ? entry.nextAction : '—');

  const callCell = entry.callPlanned
    ? `<span class="call-planned-badge">Ja · ${RawFans.formatDateTime(entry.callDate, entry.callTime)}</span>`
    : '<span class="finance-once-badge">Nein</span>';

  return `<tr data-id="${entry.id}" class="${rowClasses.join(' ')}">
    <td class="cell-date" data-label="Datum">${RawFans.formatDate(entry.date)}</td>
    <td class="cell-lead" data-label="Lead">${leadCell}</td>
    <td data-label="Vorlage">${RawFans.escapeHtml(tpl?.title || '—')}</td>
    <td data-label="Typ">${typeBadge}</td>
    <td data-label="Status">${RawFans.outreachStatusBadge(entry.status)}</td>
    <td data-label="Sentiment">${RawFans.sentimentBadge(entry.sentiment)}</td>
    <td data-label="Nächste Aktion"><span class="next-action-cell">${RawFans.escapeHtml(nextActionLabel)}</span></td>
    <td data-label="Follow-up">${followUpCell}</td>
    <td data-label="Call">${callCell}</td>
    <td data-label="Notizen"><span class="notes-cell ${entry.notes ? 'has-notes' : ''}" title="${RawFans.escapeHtml(entry.notes)}">${RawFans.escapeHtml(RawFans.truncate(entry.notes, 36)) || '—'}</span></td>
    <td>
      <div class="table-actions">
        <button class="btn btn-ghost btn-sm btn-icon" data-log-followup="${entry.id}" title="Follow-up loggen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" data-log-edit="${entry.id}" title="Bearbeiten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" data-log-delete="${entry.id}" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function renderTemplates() {
  const grid = document.getElementById('templates-grid');
  const metaEl = document.getElementById('templates-category-meta');
  const items = getFilteredTemplates();
  const categoryTotal = templatesCache.filter((t) => t.category === templateFilter.category).length;

  updateTemplateCategoryChips();

  if (metaEl) {
    const catLabel = RawFans.templateCategoryLabel(templateFilter.category);
    metaEl.textContent = items.length === categoryTotal
      ? `${items.length} Vorlage${items.length === 1 ? '' : 'n'} · ${catLabel}`
      : `${items.length} von ${categoryTotal} · ${catLabel}`;
  }

  if (items.length === 0) {
    const isSearch = !!templateFilter.search;
    grid.innerHTML = `<div class="templates-empty" style="grid-column: 1/-1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
      <h4>${isSearch ? 'Keine Treffer' : 'Keine Vorlagen in dieser Kategorie'}</h4>
      <p>${isSearch ? 'Passe deine Suche an.' : 'Lege die erste Vorlage für diese Kategorie an.'}</p>
      <button class="btn btn-primary" id="empty-add-template">Neue Vorlage</button>
    </div>`;
    document.getElementById('empty-add-template')?.addEventListener('click', () => openTemplateModal());
    return;
  }

  const cards = new Array(items.length);
  for (let i = 0; i < items.length; i++) cards[i] = buildTemplateCard(items[i]);
  grid.innerHTML = cards.join('');
}

function renderLog() {
  const tbody = document.getElementById('outreach-log-body');
  const countEl = document.getElementById('log-count');
  const entries = getFilteredLog();

  if (countEl) countEl.innerHTML = `<strong>${entries.length}</strong> Einträge`;

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11"><div class="empty-state">
      <h4>Keine Outreach-Einträge</h4>
      <p>Logge deine erste gesendete DM.</p>
      <button class="btn btn-primary" id="empty-add-log">Eintrag loggen</button>
    </div></td></tr>`;
    document.getElementById('empty-add-log')?.addEventListener('click', () => {
      openLogModal().catch(handleOutreachError);
    });
    return;
  }

  const rows = new Array(entries.length);
  for (let i = 0; i < entries.length; i++) rows[i] = buildLogRow(entries[i]);
  tbody.innerHTML = rows.join('');
}

function renderOutreach() {
  renderOutreachStats();
  renderTemplates();
  renderLog();
}

function populateLogLeadSelect(selectedId = '') {
  const select = document.getElementById('log-lead');
  if (!select) return;
  const sorted = [...leadsCacheOutreach].sort((a, b) => a.username.localeCompare(b.username));
  select.innerHTML = '<option value="">Lead auswählen…</option>' +
    sorted.map((l) =>
      `<option value="${l.id}" ${l.id === selectedId ? 'selected' : ''}>${RawFans.escapeHtml(l.username)} — ${RawFans.escapeHtml(l.platform)}</option>`
    ).join('');
}

function populateLogTemplateSelect(selectedId = '') {
  const select = document.getElementById('log-template');
  if (!select) return;
  select.innerHTML = '<option value="">Keine Vorlage</option>' +
    templatesCache.map((t) =>
      `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${RawFans.escapeHtml(t.title)}</option>`
    ).join('');
}

function toggleCallFields() {
  const cb = document.getElementById('log-call-planned');
  const group = document.getElementById('log-call-fields');
  if (group) group.style.display = cb?.checked ? 'grid' : 'none';
}

function onLogTemplateChange() {
  const tplId = document.getElementById('log-template')?.value;
  const messageType = document.getElementById('log-message-type');
  const notes = document.getElementById('log-notes');
  if (!tplId) return;
  const tpl = getTemplateById(tplId);
  if (!tpl) return;
  if (messageType) messageType.value = tpl.category;
  onLogMessageTypeChange();
  if (notes && !notes.value.trim()) {
    notes.placeholder = `Gesendet: „${RawFans.truncate(tpl.text, 60)}"…`;
  }
}

function onLogMessageTypeChange() {
  const type = document.getElementById('log-message-type')?.value;
  const callCb = document.getElementById('log-call-planned');
  if (!callCb || callCb.dataset.userSet === 'true') return;
  if (RawFans.isCallMessageType(type) || type === 'contract') {
    callCb.checked = RawFans.isCallMessageType(type);
    toggleCallFields();
  }
}

function openTemplateModal(tpl = null) {
  editingTemplateId = tpl?.id || null;
  const form = document.getElementById('template-form');
  document.getElementById('template-modal-title').textContent = tpl ? 'Vorlage bearbeiten' : 'Neue Vorlage';
  form.title.value = tpl?.title || '';
  form.category.value = tpl?.category || templateFilter.category || 'icebreaker';
  form.text.value = tpl?.text || '';
  RawFans.openModal('template-modal');
}

function editTemplate(id) {
  const tpl = templatesCache.find((t) => t.id === id);
  if (tpl) openTemplateModal(tpl);
}

function openDeleteTemplateModal(id) {
  const tpl = templatesCache.find((t) => t.id === id);
  if (!tpl) return;
  templateToDeleteId = id;
  document.getElementById('template-delete-title').textContent = tpl.title;
  RawFans.openModal('template-delete-modal');
}

function confirmDeleteTemplate() {
  if (!templateToDeleteId) return;
  const items = templatesCache.filter((t) => t.id !== templateToDeleteId);
  RawFans.saveOutreachTemplates(items);
  refreshOutreachLocalCaches();
  RawFans.closeModal('template-delete-modal');
  templateToDeleteId = null;
  scheduleRenderOutreach();
}

function resetTemplateForm() {
  editingTemplateId = null;
  document.getElementById('template-form')?.reset();
}

function handleTemplateSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const items = [...templatesCache];
  const data = {
    title: form.title.value.trim(),
    category: form.category.value,
    text: form.text.value.trim(),
  };

  if (editingTemplateId) {
    const i = items.findIndex((t) => t.id === editingTemplateId);
    if (i !== -1) items[i] = { ...items[i], ...data };
  } else {
    items.unshift({ id: RawFans.generateId(), ...data, createdAt: new Date().toISOString() });
  }

  RawFans.saveOutreachTemplates(items);
  refreshOutreachLocalCaches();
  populateLogTemplateSelect();
  RawFans.closeModal('template-modal');
  resetTemplateForm();
  scheduleRenderOutreach();
}

function fillLogForm(entry = null, overrides = {}) {
  const form = document.getElementById('log-form');
  if (!form) return;

  const today = new Date().toISOString().split('T')[0];
  const data = { ...entry, ...overrides };
  const callCb = document.getElementById('log-call-planned');

  form.date.value = data.date
    ? new Date(data.date).toISOString().split('T')[0]
    : today;
  populateLogLeadSelect(data.leadId || '');
  populateLogTemplateSelect(data.templateId || '');
  form.messageType.value = data.messageType || 'icebreaker';
  form.status.value = data.status || 'sent';
  form.sentiment.value = data.sentiment || '';
  form.nextAction.value = data.nextAction || '';
  form.followUpDate.value = data.followUpDate
    ? new Date(data.followUpDate).toISOString().split('T')[0]
    : '';
  form.notes.value = data.notes || '';

  if (callCb) {
    callCb.dataset.userSet = entry ? 'true' : 'false';
    callCb.checked = data.callPlanned || false;
  }
  form.callDate.value = data.callDate
    ? new Date(data.callDate).toISOString().split('T')[0]
    : '';
  form.callTime.value = data.callTime || '';
  toggleCallFields();
}

async function openLogModal(entry = null, overrides = {}) {
  editingLogId = entry?.id || null;
  await refreshOutreachCaches();
  document.getElementById('log-modal-title').textContent = entry
    ? 'Eintrag bearbeiten'
    : (overrides.leadId ? 'Follow-up loggen' : 'Outreach loggen');
  fillLogForm(entry, overrides);
  RawFans.openModal('log-modal');
}

function openQuickFollowUp(entryId) {
  const entry = outreachLogCache.find((e) => e.id === entryId);
  if (!entry) return;
  const suggestedType = suggestNextMessageType(entry.messageType);
  const matchingTpl = templatesCache.find((t) => t.category === suggestedType);
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 3);

  openLogModal(null, {
    leadId: entry.leadId,
    messageType: suggestedType,
    templateId: matchingTpl?.id || '',
    status: 'sent',
    nextAction: suggestedType === 'call_invite' ? 'wait' : 'followup2',
    followUpDate: followUpDate.toISOString(),
    callPlanned: RawFans.isCallMessageType(suggestedType),
  }).catch(handleOutreachError);
}

function openLeadHistory(leadId) {
  const lead = getLeadById(leadId);
  if (!lead) return;
  historyLeadId = leadId;
  const thread = getLeadThread(leadId);

  document.getElementById('history-lead-name').textContent = lead.username;
  document.getElementById('history-lead-platform').innerHTML = RawFans.platformPill(lead.platform);
  document.getElementById('history-lead-count').textContent = `${thread.length} Nachricht${thread.length === 1 ? '' : 'en'}`;

  const profileEl = document.getElementById('history-lead-profile');
  if (profileEl) {
    profileEl.innerHTML = lead.profileLink
      ? `<a href="${RawFans.escapeHtml(lead.profileLink)}" class="profile-link" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Profil öffnen</span>
        </a>`
      : '<span style="color: var(--text-muted)">Kein Profil-Link</span>';
  }

  const timeline = document.getElementById('history-timeline');
  if (!timeline) return;

  if (thread.length === 0) {
    timeline.innerHTML = '<p class="history-empty">Noch keine Outreach-Nachrichten für diesen Lead.</p>';
  } else {
    timeline.innerHTML = thread.map((item) => {
      const tpl = getTemplateById(item.templateId);
      const nextAction = RawFans.OUTREACH_NEXT_ACTIONS[item.nextAction] || '—';
      return `<div class="history-item ${isFollowUpOverdue(item) ? 'history-overdue' : ''} ${isInCallPipeline(item) ? 'history-call' : ''}">
        <div class="history-item-date">${RawFans.formatDate(item.date)}</div>
        <div class="history-item-body">
          <div class="history-item-meta">
            <span class="outreach-cat-badge cat-${item.messageType}">${RawFans.escapeHtml(RawFans.templateCategoryLabel(item.messageType))}</span>
            ${RawFans.outreachStatusBadge(item.status)}
            ${RawFans.sentimentBadge(item.sentiment)}
          </div>
          <div class="history-item-detail">
            <strong>${RawFans.escapeHtml(tpl?.title || 'Manuell')}</strong>
            ${item.followUpDate ? `<span>Follow-up: ${RawFans.formatDate(item.followUpDate)}</span>` : ''}
            ${item.callPlanned ? `<span>Call: ${RawFans.formatDateTime(item.callDate, item.callTime)}</span>` : ''}
            <span>Nächste Aktion: ${RawFans.escapeHtml(nextAction)}</span>
          </div>
          ${item.notes ? `<p class="history-item-notes">${RawFans.escapeHtml(item.notes)}</p>` : ''}
          <div class="history-item-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-history-edit="${item.id}">Bearbeiten</button>
            <button type="button" class="btn btn-ghost btn-sm" data-history-followup="${item.id}">Follow-up</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  timeline.querySelectorAll('[data-history-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      RawFans.closeModal('lead-history-modal');
      editLog(btn.dataset.historyEdit);
    });
  });
  timeline.querySelectorAll('[data-history-followup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      RawFans.closeModal('lead-history-modal');
      openQuickFollowUp(btn.dataset.historyFollowup);
    });
  });

  const historyAddBtn = document.getElementById('history-add-followup');
  if (historyAddBtn) {
    historyAddBtn.onclick = () => {
      RawFans.closeModal('lead-history-modal');
      const last = thread[thread.length - 1];
      if (last) openQuickFollowUp(last.id);
      else openLogModal(null, { leadId }).catch(handleOutreachError);
    };
  }

  RawFans.openModal('lead-history-modal');
}

function editLog(id) {
  const entry = outreachLogCache.find((e) => e.id === id);
  if (entry) openLogModal(entry).catch(handleOutreachError);
}

function openDeleteLogModal(id) {
  const entry = outreachLogCache.find((e) => e.id === id);
  if (!entry) return;
  const lead = getLeadById(entry.leadId);
  logToDeleteId = id;
  document.getElementById('log-delete-desc').textContent = lead?.username || 'diesen Eintrag';
  RawFans.openModal('log-delete-modal');
}

async function confirmDeleteLog() {
  if (!logToDeleteId) return;

  setOutreachLogSaving(true);
  try {
    await RawFansOutreachLogDB.deleteOutreachLog(logToDeleteId);
    await loadOutreachLogFromSupabase({ silent: true });
    RawFans.closeModal('log-delete-modal');
    RawFans.closeModal('log-modal');
    logToDeleteId = null;
    resetLogForm();
    RawFans.showToast('Eintrag gelöscht');
  } finally {
    setOutreachLogSaving(false);
  }
}

function resetLogForm() {
  editingLogId = null;
  const form = document.getElementById('log-form');
  form?.reset();
  const callCb = document.getElementById('log-call-planned');
  if (callCb) callCb.dataset.userSet = 'false';
  toggleCallFields();
}

async function handleLogSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!form.leadId.value) {
    RawFans.showToast('Bitte Lead auswählen');
    return;
  }

  const callPlanned = form.callPlanned?.checked || false;
  const data = {
    date: new Date(form.date.value).toISOString(),
    leadId: form.leadId.value,
    templateId: form.templateId.value || null,
    messageType: form.messageType.value,
    status: form.status.value,
    sentiment: form.sentiment.value,
    nextAction: form.nextAction.value,
    followUpDate: form.followUpDate.value
      ? new Date(form.followUpDate.value).toISOString()
      : null,
    callPlanned,
    callDate: callPlanned && form.callDate.value
      ? new Date(form.callDate.value).toISOString()
      : null,
    callTime: callPlanned ? (form.callTime.value || '') : '',
    notes: form.notes.value.trim(),
  };

  setOutreachLogSaving(true);
  try {
    if (editingLogId) {
      await RawFansOutreachLogDB.updateOutreachLog(editingLogId, data);
    } else {
      await RawFansOutreachLogDB.addOutreachLog(data);
    }
    await loadOutreachLogFromSupabase({ silent: true });
    RawFans.closeModal('log-modal');
    resetLogForm();
    RawFans.showToast('Outreach gespeichert');
  } finally {
    setOutreachLogSaving(false);
  }
}