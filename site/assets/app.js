// LeadCast demo site — client-side helpers (v2)
(function () {
  // 1. Active nav highlight (admin shell)
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach((el) => {
    if (el.dataset.nav === path) el.classList.add('active');
  });

  // 2. Sparkline renderer for KPI cards
  document.querySelectorAll('[data-spark]').forEach((el) => {
    const points = el.dataset.spark.split(',').map(Number);
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const w = 120, h = 28;
    const step = w / (points.length - 1);
    const path = points
      .map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    const color = el.dataset.sparkColor || 'var(--color-primary-600)';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="100%">
      <path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  });

  // 3. Heatmap bar generator
  document.querySelectorAll('[data-heatmap]').forEach((el) => {
    const bars = [];
    for (let i = 0; i < 60; i++) {
      const t = i / 60;
      const base = 1 - Math.pow(t, 1.4);
      const noise = Math.sin(i * 0.7) * 0.08 + Math.sin(i * 0.31) * 0.05;
      const dip = i > 18 && i < 26 ? -0.18 : 0;
      const lift = i > 38 && i < 44 ? 0.08 : 0;
      const v = Math.max(0.04, Math.min(1, base + noise + dip + lift));
      bars.push(v);
    }
    el.innerHTML = bars
      .map((v) => {
        const h = (v * 100).toFixed(1);
        const intensity = Math.round(60 + v * 40);
        return `<span style="height:${h}%; background: hsl(220 60% ${100 - intensity}%);"></span>`;
      })
      .join('');
  });

  // 4. Player (legacy: player.html) simulated progress + email gate at 30% mark
  const player = document.querySelector('[data-player]');
  if (player) {
    const progress = player.querySelector('.player-progress > span, .progress > span');
    const timeEl = player.querySelector('[data-current-time]');
    const gate = player.querySelector('[data-gate]');
    const total = 184;
    let cur = 0;
    let raf;
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const tick = () => {
      if (gate && !gate.hidden) return;
      cur = Math.min(total, cur + 0.4);
      if (progress) progress.style.width = `${(cur / total) * 100}%`;
      if (timeEl) timeEl.textContent = `${fmt(cur)} / ${fmt(total)}`;
      if (cur >= total * 0.30 && gate && gate.hidden) {
        gate.hidden = false;
      }
      if (cur < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const form = player.querySelector('[data-gate-form]');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        gate.hidden = true;
      });
    }
    const skip = player.querySelector('[data-gate-skip]');
    if (skip) skip.addEventListener('click', () => (gate.hidden = true));
  }

  // 5. Channel chip icon injector — data-channel="youtube|x|linkedin|instagram|facebook|leadcast"
  const channelIcons = {
    youtube:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2c-.3-1-1.1-1.8-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6c-1 .3-1.8 1.1-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1.1 1.8 2.1 2.1 1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>',
    x:         '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.55l-7.224 8.26L22.83 22h-6.66l-5.214-6.82L4.99 22H1.68l7.73-8.835L1.17 2h6.83l4.713 6.231L18.244 2zm-1.166 18h1.832L7.01 3.91H5.044L17.078 20z"/></svg>',
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06s.92-2.06 2.06-2.06 2.06.92 2.06 2.06-.92 2.06-2.06 2.06zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12c0-3.2.01-3.58.07-4.85.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.35 2.63 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07 3.26 0 3.67-.01 4.95-.07 4.35-.2 6.78-2.63 6.98-6.98.06-1.28.07-1.69.07-4.95 0-3.26-.01-3.67-.07-4.95-.2-4.35-2.63-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84c-3.4 0-6.16 2.76-6.16 6.16S8.6 18.16 12 18.16s6.16-2.76 6.16-6.16S15.4 5.84 12 5.84zm0 10.16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.41-11.84c-.8 0-1.44.64-1.44 1.44s.64 1.44 1.44 1.44 1.44-.64 1.44-1.44-.64-1.44-1.44-1.44z"/></svg>',
    facebook:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85V15.47H7.08V12h3.05V9.36c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.96H15.83c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z"/></svg>',
    leadcast:  '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>'
  };
  document.querySelectorAll('[data-channel]').forEach((el) => {
    const ch = el.dataset.channel;
    const icoEl = el.querySelector('.ch-ico');
    if (icoEl && channelIcons[ch]) icoEl.innerHTML = channelIcons[ch];
    // For .ch-dot (a standalone colored circle), inject the platform SVG inside
    // so users can recognize the platform at a glance.
    if (el.classList.contains('ch-dot') && !el.children.length && channelIcons[ch]) {
      el.innerHTML = channelIcons[ch];
    }
    if (!el.classList.contains('ch-dot')) el.classList.add(`ch-${ch}`);
    else el.classList.add(ch);
  });

  // 6. Multi-line chart renderer (data-multichart='[{name,color,points:[...]}]')
  document.querySelectorAll('[data-multichart]').forEach((el) => {
    let series;
    try { series = JSON.parse(el.dataset.multichart); } catch (e) { return; }
    const w = 720, h = 200, pad = 24;
    let allValues = series.flatMap((s) => s.points);
    const max = Math.max(...allValues);
    const min = 0;
    const range = max - min || 1;
    const n = series[0].points.length;
    const step = (w - pad * 2) / (n - 1);
    const paths = series.map((s) => {
      const d = s.points.map((v, i) => {
        const x = pad + i * step;
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    }).join('');
    // grid lines
    const grid = [0.25, 0.5, 0.75, 1].map((g) => {
      const y = h - pad - g * (h - pad * 2);
      return `<line x1="${pad}" x2="${w-pad}" y1="${y}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="2 4"/>`;
    }).join('');
    // x-axis labels (if provided)
    let xLabels = '';
    if (el.dataset.xLabels) {
      const labels = el.dataset.xLabels.split(',');
      xLabels = labels.map((lab, i) => {
        const x = pad + (i * (n - 1) / (labels.length - 1)) * step;
        return `<text x="${x}" y="${h-6}" text-anchor="middle" font-size="10" fill="#94A3B8" font-family="Inter">${lab}</text>`;
      }).join('');
    }
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${grid}${paths}${xLabels}</svg>`;
  });

  // 7. Live attendee number animation (data-live-count="1234")
  document.querySelectorAll('[data-live-count]').forEach((el) => {
    const target = parseInt(el.dataset.liveCount, 10);
    let current = Math.floor(target * 0.96);
    const fmt = (n) => n.toLocaleString('en-US');
    el.textContent = fmt(current);
    setInterval(() => {
      // small drift up/down
      const drift = Math.floor(Math.random() * 7) - 2;
      current = Math.max(target - 80, Math.min(target + 60, current + drift));
      el.textContent = fmt(current);
    }, 1800);
  });

  // 8. Comment thread skeleton — only enrich if there's a marker
  const ccount = document.querySelector('[data-comment-count]');
  if (ccount) {
    // small ticker effect — increment occasionally
    let n = parseInt(ccount.textContent.replace(/,/g, ''), 10) || 0;
    setInterval(() => {
      n += Math.random() > 0.6 ? 1 : 0;
      ccount.textContent = n.toLocaleString('en-US');
    }, 5200);
  }

  // 9. Year in footer
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  // 10. Subtle on-mount fade-in for hero pillars. Use opacity only so the
  // CSS-defined translateX staggering on .pmock.live / .pmock.one is preserved.
  document.querySelectorAll('.pmock').forEach((el, i) => {
    el.style.opacity = 0;
    setTimeout(() => {
      el.style.transition = 'opacity .55s ease';
      el.style.opacity = 1;
    }, 120 + i * 110);
  });
})();
