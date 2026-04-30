// LeadCast demo site — minimal client-side helpers
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
    // Generate 60 bars with a falloff curve simulating real video drop-off
    const bars = [];
    for (let i = 0; i < 60; i++) {
      const t = i / 60;
      const base = 1 - Math.pow(t, 1.4);
      const noise = Math.sin(i * 0.7) * 0.08 + Math.sin(i * 0.31) * 0.05;
      const dip = i > 18 && i < 26 ? -0.18 : 0; // ドロップオフ
      const lift = i > 38 && i < 44 ? 0.08 : 0;  // 巻き戻し集中
      const v = Math.max(0.04, Math.min(1, base + noise + dip + lift));
      bars.push(v);
    }
    el.innerHTML = bars
      .map((v) => {
        const h = (v * 100).toFixed(1);
        const intensity = Math.round(60 + v * 40); // 60-100% saturation
        return `<span style="height:${h}%; background: hsl(220 60% ${100 - intensity}%);"></span>`;
      })
      .join('');
  });

  // 4. Player simulated progress + email gate trigger at 30% mark
  const player = document.querySelector('[data-player]');
  if (player) {
    const progress = player.querySelector('.player-progress > span');
    const timeEl = player.querySelector('[data-current-time]');
    const gate = player.querySelector('[data-gate]');
    const total = 184; // 3:04
    let cur = 0;
    let raf;
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const tick = () => {
      if (gate && !gate.hidden) return; // pause when gated
      cur = Math.min(total, cur + 0.4);
      if (progress) progress.style.width = `${(cur / total) * 100}%`;
      if (timeEl) timeEl.textContent = `${fmt(cur)} / ${fmt(total)}`;
      if (cur >= total * 0.30 && gate && gate.hidden) {
        gate.hidden = false;
      }
      if (cur < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Submit closes gate
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

  // 5. Year in footer
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
